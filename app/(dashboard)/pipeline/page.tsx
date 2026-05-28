import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { TrendingUp, ArrowRight } from "lucide-react";

const STAGES: {
  value: ApplicationStage;
  label: string;
  accent: string;
  dot: string;
  rowBg: string;
  countBg: string;
  countText: string;
}[] = [
  {
    value: "APPLIED",
    label: "Applied",
    accent: "border-l-zinc-500",
    dot: "bg-zinc-400",
    rowBg: "bg-zinc-500/5",
    countBg: "bg-zinc-800",
    countText: "text-zinc-300",
  },
  {
    value: "SCREENING",
    label: "Screening",
    accent: "border-l-blue-500",
    dot: "bg-blue-400",
    rowBg: "bg-blue-500/5",
    countBg: "bg-blue-500/10",
    countText: "text-blue-400",
  },
  {
    value: "SHORTLISTED",
    label: "Shortlisted",
    accent: "border-l-violet-500",
    dot: "bg-violet-400",
    rowBg: "bg-violet-500/5",
    countBg: "bg-violet-500/10",
    countText: "text-violet-400",
  },
  {
    value: "INTERVIEW",
    label: "Interview",
    accent: "border-l-amber-500",
    dot: "bg-amber-400",
    rowBg: "bg-amber-500/5",
    countBg: "bg-amber-500/10",
    countText: "text-amber-400",
  },
  {
    value: "OFFER",
    label: "Offer",
    accent: "border-l-orange-500",
    dot: "bg-orange-400",
    rowBg: "bg-orange-500/5",
    countBg: "bg-orange-500/10",
    countText: "text-orange-400",
  },
  {
    value: "HIRED",
    label: "Hired",
    accent: "border-l-green-500",
    dot: "bg-green-400",
    rowBg: "bg-green-500/5",
    countBg: "bg-green-500/10",
    countText: "text-green-400",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    accent: "border-l-red-500",
    dot: "bg-red-400",
    rowBg: "bg-red-500/5",
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {applications.length} total &middot;{" "}
          <span className="text-zinc-400">{activeCount} active</span>
        </p>
      </div>

      {/* Stage rows */}
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const cards = byStage[stage.value] ?? [];

          return (
            <div
              key={stage.value}
              className={`border border-white/[0.06] border-l-2 ${stage.accent} rounded-xl overflow-hidden`}
            >
              {/* Stage header row */}
              <div className={`flex items-center justify-between px-5 py-3 ${stage.rowBg} border-b border-white/[0.06]`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-sm font-semibold text-zinc-200">
                    {stage.label}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${stage.countBg} ${stage.countText} tabular-nums`}
                >
                  {cards.length} {cards.length === 1 ? "candidate" : "candidates"}
                </span>
              </div>

              {/* Applicant rows */}
              {cards.length === 0 ? (
                <div className="px-5 py-4 bg-[#0d0d0d]">
                  <p className="text-xs text-zinc-800 italic">No candidates at this stage</p>
                </div>
              ) : (
                <div className="bg-[#0d0d0d] divide-y divide-white/[0.04]">
                  {cards.map((app) => {
                    const initials =
                      `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
                    const score = app.aiEvaluation?.score;
                    const scoreColor =
                      score === undefined ? "" :
                      score >= 8 ? "text-green-400 bg-green-500/10 border-green-500/20" :
                      score >= 5 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                                   "text-red-400 bg-red-500/10 border-red-500/20";
                    const avatarColor =
                      score === undefined ? "bg-zinc-800 text-zinc-400" :
                      score >= 8 ? "bg-green-500/10 text-green-400" :
                      score >= 5 ? "bg-amber-500/10 text-amber-400" :
                                   "bg-red-500/10 text-red-400";

                    return (
                      <Link
                        key={app.id}
                        href={`/applications/${app.id}`}
                        className="group grid grid-cols-[auto_1fr_200px_80px_60px] items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarColor}`}>
                          <span className="text-[11px] font-bold">{initials}</span>
                        </div>

                        {/* Name + job */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors truncate">
                            {app.applicant.firstName} {app.applicant.lastName}
                          </p>
                          <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                            {app.jobOpening.title}
                          </p>
                        </div>

                        {/* Job title (email) */}
                        <p className="text-xs text-zinc-600 truncate hidden md:block">
                          {app.applicant.email}
                        </p>

                        {/* Applied */}
                        <p className="text-[11px] text-zinc-600 tabular-nums text-right">
                          {relativeDate(new Date(app.createdAt))}
                        </p>

                        {/* Score + arrow */}
                        <div className="flex items-center justify-end gap-2">
                          {score !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold tabular-nums ${scoreColor}`}
                            >
                              <TrendingUp className="h-2.5 w-2.5" />
                              {score}/10
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-800">—</span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-[#c9a84c] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
