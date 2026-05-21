import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { scoreApplication } from "@/lib/ai-scorer";

/**
 * POST /api/applications/[id]/rescore
 *
 * Manually triggers (or re-triggers) AI evaluation for an application.
 * Useful when the background job silently failed (e.g. missing OPENAI_API_KEY,
 * transient OpenAI error, or cold-start termination).
 *
 * Only ADMIN and HR_MANAGER roles can trigger this.
 */
export async function POST(
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
    if (!["ADMIN", "HR_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, aiEvaluation: { select: { id: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Delete existing evaluation so scoreApplication can create a fresh one
    if (application.aiEvaluation) {
      await prisma.aIEvaluation.delete({
        where: { applicationId: id },
      });
    }

    // Run synchronously here so the caller can see success/failure.
    // This is a manual action so waiting ~15s is acceptable.
    await scoreApplication(id);

    // Check if evaluation was actually created
    const evaluation = await prisma.aIEvaluation.findUnique({
      where: { applicationId: id },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "AI scoring completed but no evaluation was saved. Check that OPENAI_API_KEY is set in your environment variables." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/applications/[id]/rescore]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
