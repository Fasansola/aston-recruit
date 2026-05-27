import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { publishJobToWordPress } from "@/lib/wp-publisher";

/**
 * POST /api/jobs/[id]/publish-wp
 * Publishes (or re-publishes) a job opening to the WordPress career CPT.
 * Stores the returned wpPostId and wpPostUrl back on the JobOpening record.
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

    const job = await prisma.jobOpening.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const { wpPostId, wpPostUrl } = await publishJobToWordPress({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      department: job.department,
      location: job.location,
      wpJobOpeningId: job.wpJobOpeningId,
    });

    // Persist the WP post reference on the job record
    const updated = await prisma.jobOpening.update({
      where: { id },
      data: { wpPostId, wpPostUrl },
    });

    return NextResponse.json({
      wpPostId: updated.wpPostId,
      wpPostUrl: updated.wpPostUrl,
    });
  } catch (error) {
    console.error("[POST /api/jobs/[id]/publish-wp]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
