import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { Users, TrendingUp } from "lucide-react";

const STAGES: {
  value: ApplicationStage;
  label: string;
  topAccent: string;
  cardBorder: string;
  dot: string;
  countBg: string;
  countText: string;
}[] = [
  {
    value: "APPLIED",
    label: "Applied",
    topAccent: "border-t-zinc-500",
    cardBorder: "border-l-zinc-500",
    dot: "bg-zinc-400",
    countBg: "bg-zinc-800",
    countText: "text-zinc-300",
  },
  {
    value: "SCREENING",
    label: "Screening",
    topAccent: "border-t-blue-500",
    cardBorder: "border-l-blue-500",
    dot: "bg-blue-400",
    countBg: "bg-blue-500/10",
    countText: "text-blue-400",
  },
  {
    value: "SHORTLISTED",
    label: "Shortlisted",
    topAccent: "border-t-violet-500",
    cardBorder: "border-l-violet-500",
    dot: "bg-violet-400",
    countBg: "bg-violet-500/10",
    countText: "text-violet-400",
  },
  {
    value: "INTERVIEW",
    label: "Interview",
    topAccent: "border-t-amber-500",
    cardBorder: "border-l-amber-500",
    dot: "bg-amber-400",
    countBg: "bg-amber-500/10",
    countText: "text-amber-400",
  },
  {
    value: "OFFER",
    label: "Offer",
    topAccent: "border-t-orange-500",
    cardBorder: "border-l-orange-500",
    dot: "bg-orange-400",
    countBg: "bg-orange-500/10",
    countText: "text-orange-400",
  },
  {
    value: "HIRED",
    label: "Hired",
    topAccent: "border-t-green-500",
    cardBorder: "border-l-green-500",
    dot: "bg-green-400",
    countBg: "bg-green-500/10",
    countText: "text-green-400",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    topAccent: "border-t-red-500",
    cardBorder: "border-l-red-500",
    dot: "bg-red-400",
    countBg: "bg-red-500/10",
    countText: "text-red-400",
  },
];

function relativeDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-500/15 text-green-400 border-green-500/20"
      : score >= 5
      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
      : "bg-red-500/15 text-red-400 border-red-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border tabular-nums ${color}`}
    >
      <TrendingUp className="h-2.5 w-2.5" />
      {score}/10
    </span>
  );
}

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
    STAGES.map((s) => [
      s.value,
      applications.filter((a) => a.currentStage === s.value),
    ])
  );

  const activeCount = applications.filter(
    (a) => !["HIRED", "REJECTED"].includes(a.currentStage)
  ).length;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {applications.length} total &middot;{" "}
            <span className="text-zinc-400">{activeCount} active</span>
          </p>
        </div>

        {/* Quick-stat chips */}
        <div className="flex items-center gap-2">
          {STAGES.filter((s) => (byStage[s.value]?.length ?? 0) > 0)
            .slice(0, 4)
            .map((s) => (
              <div
                key={s.value}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.06] text-[11px] font-medium ${s.countText}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
                <span className="opacity-60">{byStage[s.value].length}</span>
              </div>
            ))}
        </div>
      </div>

      {/* ── Kanban board ── */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {STAGES.map((stage) => {
            const cards = byStage[stage.value] ?? [];

            return (
              <div key={stage.value} className="w-[252px] flex flex-col gap-2">
                {/* Column header */}
                <div
                  className={`bg-[#111111] border border-white/[0.06] border-t-2 ${stage.topAccent} rounded-xl px-3.5 py-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${stage.dot} shadow-sm`}
                      />
                      <span className="text-xs font-semibold text-zinc-200 tracking-wide">
                        {stage.label}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stage.countBg} ${stage.countText} tabular-nums`}
                    >
                      {cards.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[200px]">
                  {cards.length === 0 ? (
                    <div className="flex-1 border border-dashed border-white/[0.04] rounded-xl flex flex-col items-center justify-center py-10 gap-2">
                      <Users className="h-4 w-4 text-zinc-800" />
                      <span className="text-[11px] text-zinc-800">No candidates</span>
                    </div>
                  ) : (
                    cards.map((app) => {
                      const initials =
                        `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
                      const score = app.aiEvaluation?.score;
                      const avatarColor =
                        score === undefined
                          ? "bg-zinc-800 text-zinc-400"
                          : score >= 8
                          ? "bg-green-500/10 text-green-400"
                          : score >= 5
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400";

                      return (
                        <Link
                          key={app.id}
                          href={`/applications/${app.id}`}
                          className={`group bg-[#111111] border border-white/[0.06] border-l-2 ${stage.cardBorder} hover:border-white/[0.14] hover:bg-[#161616] rounded-xl p-3.5 transition-all duration-150`}
                        >
                          {/* Top row: avatar + name */}
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${avatarColor}`}
                            >
                              <span className="text-[10px] font-bold">
                                {initials}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-100 group-hover:text-white transition-colors truncate leading-snug">
                                {app.applicant.firstName} {app.applicant.lastName}
                              </p>
                              <p className="text-[11px] text-zinc-600 truncate mt-0.5 leading-snug">
                                {app.jobOpening.title}
                              </p>
                            </div>
                          </div>

                          {/* Bottom row: date + score */}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-700 tabular-nums">
                              {relativeDate(new Date(app.createdAt))}
                            </span>
                            {score !== undefined ? (
                              <ScorePill score={score} />
                            ) : (
                              <span className="text-[10px] text-zinc-800 italic">
                                No score
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })
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
