import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendStageEmailWithLog } from "@/lib/email-sender";
import { ApplicationStage } from "@prisma/client";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
  stage: z.nativeEnum(ApplicationStage),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HR_MANAGER can manually send emails
    // @ts-expect-error — custom role field
    const role = session.user.role as string;
    if (!["ADMIN", "HR_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify the application exists
    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stage } = parsed.data;

    // Fire-and-forget — do not await so response returns immediately
    void sendStageEmailWithLog(id, stage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/applications/[id]/send-email]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
