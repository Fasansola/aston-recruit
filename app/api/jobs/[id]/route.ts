import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const patchJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "PAUSED"]).optional(),
  closesAt: z.string().datetime().nullable().optional(),
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

    const job = await prisma.jobOpening.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
          include: {
            applicant: { select: { id: true, firstName: true, lastName: true, email: true } },
            aiEvaluation: { select: { score: true, recommendation: true } },
          },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("[GET /api/jobs/[id]]", error);
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

    // @ts-expect-error — custom role field
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

    const parsed = patchJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { closesAt, ...rest } = parsed.data;

    const job = await prisma.jobOpening.update({
      where: { id },
      data: {
        ...rest,
        ...(closesAt !== undefined
          ? { closesAt: closesAt ? new Date(closesAt) : null }
          : {}),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("[PATCH /api/jobs/[id]]", error);
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

    // @ts-expect-error — custom role field
    const role = session.user.role as string;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const job = await prisma.jobOpening.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Detach applications from this job before deleting so applicant records are preserved
    await prisma.$transaction([
      prisma.application.updateMany({
        where: { jobOpeningId: id },
        data: { jobOpeningId: null },
      }),
      prisma.jobOpening.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/jobs/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
