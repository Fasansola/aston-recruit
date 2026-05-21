import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import BulkActionsTable from "@/components/applications/bulk-actions-table";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // @ts-expect-error — custom role field
  const role = session.user.role as string;
  const isReadOnly = !["ADMIN", "HR_MANAGER"].includes(role);

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      applicant: true,
      jobOpening: { select: { id: true, title: true } },
      aiEvaluation: { select: { score: true, recommendation: true } },
    },
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-white">Applications</h1>
        <p className="text-zinc-500 text-sm mt-1">{applications.length} total</p>
      </div>

      <BulkActionsTable
        applications={applications.map((a) => ({
          id: a.id,
          currentStage: a.currentStage,
          createdAt: a.createdAt,
          isDuplicate: a.isDuplicate,
          applicant: a.applicant,
          jobOpening: a.jobOpening,
          aiEvaluation: a.aiEvaluation
            ? {
                score: a.aiEvaluation.score,
                recommendation: a.aiEvaluation.recommendation,
              }
            : null,
        }))}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
