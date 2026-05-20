import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sendStageEmailWithLog } from "@/lib/email-sender";
import { ApplicationStage } from "@prisma/client";

const patchSchema = z.object({
  currentStage: z.nativeEnum(ApplicationStage),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: true,
        jobOpening: true,
        aiEvaluation: true,
        stageHistory: {
          orderBy: { changedAt: "desc" },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
        emailLogs: { orderBy: { sentAt: "desc" } },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("[GET /api/applications/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HR_MANAGER can move pipeline stages
    // @ts-expect-error — custom role field on session
    const role = session.user.role as string;
    if (!["ADMIN", "HR_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { currentStage } = parsed.data;

    // Find the current application to log fromStage
    const existing = await prisma.application.findUnique({
      where: { id },
      select: { currentStage: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update stage and create history in a transaction
    const [application] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: { currentStage },
      }),
      prisma.stageHistory.create({
        data: {
          applicationId: id,
          fromStage: existing.currentStage,
          toStage: currentStage,
          changedById: session.user.id,
        },
      }),
    ]);

    // Fire-and-forget stage email
    void sendStageEmailWithLog(id, currentStage);

    return NextResponse.json(application);
  } catch (error) {
    console.error("[PATCH /api/applications/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete applications
    // @ts-expect-error — custom role field on session
    const role = session.user.role as string;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Delete in order to respect FK constraints
    await prisma.$transaction([
      prisma.note.deleteMany({ where: { applicationId: id } }),
      prisma.emailLog.deleteMany({ where: { applicationId: id } }),
      prisma.stageHistory.deleteMany({ where: { applicationId: id } }),
      prisma.aIEvaluation.deleteMany({ where: { applicationId: id } }),
      prisma.application.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/applications/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
