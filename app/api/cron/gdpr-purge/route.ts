import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/cron/gdpr-purge
 *
 * Called by Vercel Cron every Sunday at 2am UTC (see vercel.json).
 * Purges all REJECTED applications older than 6 months, along with
 * associated data. If the applicant has no remaining applications
 * they are also deleted.
 *
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Find all qualifying applications
    const applications = await prisma.application.findMany({
      where: {
        currentStage: "REJECTED",
        updatedAt: { lt: sixMonthsAgo },
      },
      select: {
        id: true,
        applicantId: true,
      },
    });

    if (applications.length === 0) {
      console.log("[GDPR Purge] No applications to purge.");
      return NextResponse.json({ success: true, purged: 0 });
    }

    const applicationIds = applications.map((a) => a.id);
    const applicantIds = [...new Set(applications.map((a) => a.applicantId))];

    console.log(
      `[GDPR Purge] Purging ${applicationIds.length} application(s) older than 6 months.`
    );

    // Delete in dependency order inside a transaction
    await prisma.$transaction([
      prisma.note.deleteMany({
        where: { applicationId: { in: applicationIds } },
      }),
      prisma.emailLog.deleteMany({
        where: { applicationId: { in: applicationIds } },
      }),
      prisma.stageHistory.deleteMany({
        where: { applicationId: { in: applicationIds } },
      }),
      prisma.aIEvaluation.deleteMany({
        where: { applicationId: { in: applicationIds } },
      }),
      prisma.application.deleteMany({
        where: { id: { in: applicationIds } },
      }),
    ]);

    // Delete applicants who have no remaining applications
    const applicantsWithRemainingApps = await prisma.application.findMany({
      where: { applicantId: { in: applicantIds } },
      select: { applicantId: true },
    });

    const retainedApplicantIds = new Set(
      applicantsWithRemainingApps.map((a) => a.applicantId)
    );

    const applicantsToDelete = applicantIds.filter(
      (id) => !retainedApplicantIds.has(id)
    );

    if (applicantsToDelete.length > 0) {
      await prisma.applicant.deleteMany({
        where: { id: { in: applicantsToDelete } },
      });
      console.log(
        `[GDPR Purge] Deleted ${applicantsToDelete.length} applicant(s) with no remaining applications.`
      );
    }

    console.log(
      `[GDPR Purge] Complete. Purged ${applicationIds.length} application(s).`
    );

    return NextResponse.json({
      success: true,
      purged: applicationIds.length,
      applicantsDeleted: applicantsToDelete.length,
    });
  } catch (error) {
    console.error("[GDPR Purge] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
