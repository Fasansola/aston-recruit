import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    // Optional filters
    const stage = searchParams.get("stage") ?? undefined;
    const jobId = searchParams.get("jobId") ?? undefined;

    const where = {
      ...(stage ? { currentStage: stage as never } : {}),
      ...(jobId ? { jobOpeningId: jobId } : {}),
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          applicant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          jobOpening: {
            select: { id: true, title: true, department: true },
          },
          aiEvaluation: {
            select: { score: true, recommendation: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/applications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
