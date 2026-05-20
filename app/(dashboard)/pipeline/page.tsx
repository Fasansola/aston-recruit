import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationStage } from "@prisma/client";

const STAGES: { value: ApplicationStage; label: string; color: string }[] = [
  { value: "APPLIED", label: "Applied", color: "border-t-zinc-500" },
  { value: "SCREENING", label: "Screening", color: "border-t-blue-500" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "border-t-purple-500" },
  { value: "INTERVIEW", label: "Interview", color: "border-t-yellow-500" },
  { value: "OFFER", label: "Offer", color: "border-t-orange-500" },
  { value: "HIRED", label: "Hired", color: "border-t-green-500" },
  { value: "REJECTED", label: "Rejected", color: "border-t-red-500" },
];

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      applicant: true,
      jobOpening: { select: { title: true } },
      aiEvaluation: { select: { score: true } },
    },
  });

  // Group by stage
  const byStage = Object.fromEntries(
    STAGES.map((s) => [
      s.value,
      applications.filter((a) => a.currentStage === s.value),
    ])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="text-zinc-400 mt-1">
          {applications.length} application{applications.length !== 1 ? "s" : ""} across all stages
        </p>
      </div>

      {/* Kanban board — horizontal scroll on smaller screens */}
      <div className="overflow-x-auto pb-4">
        <div
          className="grid gap-4 min-w-max"
          style={{ gridTemplateColumns: `repeat(${STAGES.length}, 220px)` }}
        >
          {STAGES.map((stage) => {
            const cards = byStage[stage.value] ?? [];
            return (
              <div key={stage.value} className="flex flex-col gap-2">
                {/* Column header */}
                <div
                  className={`rounded-t-lg border-t-2 bg-zinc-900 border-x border-b border-zinc-800 px-3 py-2 ${stage.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">
                      {stage.label}
                    </span>
                    <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
                      {cards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[200px]">
                  {cards.map((app) => (
                    <Link key={app.id} href={`/applications/${app.id}`}>
                      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-sm font-medium text-white leading-tight">
                            {app.applicant.firstName} {app.applicant.lastName}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {app.jobOpening.title}
                          </p>
                          {app.aiEvaluation && (
                            <span
                              className={`inline-block text-xs font-bold ${
                                app.aiEvaluation.score >= 8
                                  ? "text-green-400"
                                  : app.aiEvaluation.score >= 5
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {app.aiEvaluation.score}/10
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {cards.length === 0 && (
                    <div className="text-xs text-zinc-700 text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
