import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";

const STAGES: { value: ApplicationStage; label: string; accent: string; dot: string }[] = [
  { value: "APPLIED",     label: "Applied",     accent: "border-t-zinc-500",   dot: "bg-zinc-400" },
  { value: "SCREENING",   label: "Screening",   accent: "border-t-blue-500",   dot: "bg-blue-400" },
  { value: "SHORTLISTED", label: "Shortlisted", accent: "border-t-violet-500", dot: "bg-violet-400" },
  { value: "INTERVIEW",   label: "Interview",   accent: "border-t-amber-500",  dot: "bg-amber-400" },
  { value: "OFFER",       label: "Offer",       accent: "border-t-orange-500", dot: "bg-orange-400" },
  { value: "HIRED",       label: "Hired",       accent: "border-t-green-500",  dot: "bg-green-400" },
  { value: "REJECTED",    label: "Rejected",    accent: "border-t-red-500",    dot: "bg-red-400" },
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

  const byStage = Object.fromEntries(
    STAGES.map((s) => [s.value, applications.filter((a) => a.currentStage === s.value)])
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {applications.length} application{applications.length !== 1 ? "s" : ""} across all stages
        </p>
      </div>

      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-3 min-w-max">
          {STAGES.map((stage) => {
            const cards = byStage[stage.value] ?? [];
            return (
              <div key={stage.value} className="w-[210px] flex flex-col gap-2">
                {/* Column header */}
                <div className={`bg-[#111111] border border-white/[0.06] border-t-2 ${stage.accent} rounded-t-lg px-3 py-2.5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                      <span className="text-xs font-semibold text-zinc-300">{stage.label}</span>
                    </div>
                    <span className="text-[11px] text-zinc-600 bg-zinc-800/80 rounded-full px-2 py-0.5 tabular-nums">
                      {cards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[160px]">
                  {cards.length === 0 ? (
                    <div className="flex-1 border border-dashed border-white/[0.05] rounded-lg flex items-center justify-center py-8">
                      <span className="text-xs text-zinc-800">Empty</span>
                    </div>
                  ) : cards.map((app) => {
                    const initials = `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
                    const score = app.aiEvaluation?.score;
                    const scoreColor = !score ? "" :
                      score >= 8 ? "text-green-400" : score >= 5 ? "text-amber-400" : "text-red-400";

                    return (
                      <Link
                        key={app.id}
                        href={`/applications/${app.id}`}
                        className="group bg-[#111111] border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-all duration-150 hover:bg-[#141414]"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-zinc-400 text-[10px] font-semibold">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug truncate">
                              {app.applicant.firstName} {app.applicant.lastName}
                            </p>
                            <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                              {app.jobOpening.title}
                            </p>
                          </div>
                        </div>
                        {score !== undefined && (
                          <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                            <span className="text-[10px] text-zinc-700">AI Score</span>
                            <span className={`text-xs font-bold tabular-nums ${scoreColor}`}>{score}/10</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
