import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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

    const job = await prisma.jobOpening.findUnique({
      where: { id },
      select: { wpPostId: true, wpPostUrl: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.wpPostId) {
      return NextResponse.json(
        { error: "This job has not been published to WordPress." },
        { status: 400 }
      );
    }

    const { WORDPRESS_URL, WORDPRESS_CAREER_TOKEN } = process.env;

    if (!WORDPRESS_URL || !WORDPRESS_CAREER_TOKEN) {
      return NextResponse.json(
        { error: "WordPress is not configured." },
        { status: 500 }
      );
    }

    // Set the WP post to draft via the custom token endpoint
    const wpRes = await fetch(
      `${WORDPRESS_URL.replace(/\/$/, "")}/wp-json/aston/v1/career/${job.wpPostId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Aston-Token": WORDPRESS_CAREER_TOKEN,
        },
        body: JSON.stringify({ status: "draft" }),
      }
    );

    if (!wpRes.ok) {
      const errorText = await wpRes.text().catch(() => "(no body)");
      return NextResponse.json(
        { error: `WordPress returned ${wpRes.status}: ${errorText}` },
        { status: 502 }
      );
    }

    // Clear wpPostUrl (post is now draft/unlisted) but keep wpPostId
    const updated = await prisma.jobOpening.update({
      where: { id },
      data: { wpPostUrl: null },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/jobs/[id]/unpublish-wp]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
