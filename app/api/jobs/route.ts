import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { publishJobToWordPress } from "@/lib/wp-publisher";

const createJobSchema = z.object({
  wpJobOpeningId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  department: z.string().optional(),
  location: z.string().optional(),
  description: z.string().min(1),
  requirements: z.string().min(1),
  closesAt: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "PAUSED"]).optional().default("OPEN"),
  publishToWordPress: z.boolean().optional().default(false),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.jobOpening.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[GET /api/jobs]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HR_MANAGER can create jobs
    // @ts-expect-error — custom role field
    const role = session.user.role as string;
    if (!["ADMIN", "HR_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fall back to a server-generated ID if none provided
    const wpJobOpeningId =
      parsed.data.wpJobOpeningId ||
      `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const job = await prisma.jobOpening.create({
      data: {
        wpJobOpeningId,
        title: parsed.data.title,
        department: parsed.data.department ?? null,
        location: parsed.data.location ?? null,
        description: parsed.data.description,
        requirements: parsed.data.requirements,
        status: parsed.data.status,
        closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
      },
    });

    // Optionally publish to WordPress immediately after creation
    if (parsed.data.publishToWordPress) {
      try {
        const { wpPostId, wpPostUrl } = await publishJobToWordPress({
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          department: job.department,
          location: job.location,
          closesAt: job.closesAt,
        });

        const updated = await prisma.jobOpening.update({
          where: { id: job.id },
          data: { wpPostId, wpPostUrl },
        });

        return NextResponse.json(updated, { status: 201 });
      } catch (wpError) {
        // Job was created — don't roll back. Return the job with a WP warning.
        console.error("[POST /api/jobs] WordPress publish failed:", wpError);
        return NextResponse.json(
          {
            ...job,
            wpWarning:
              wpError instanceof Error
                ? wpError.message
                : "WordPress publish failed — job was saved, but not published to the website.",
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("[POST /api/jobs]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
