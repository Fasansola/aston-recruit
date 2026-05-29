import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import { TrendingUp, Mail, Briefcase, Clock } from "lucide-react";

const STAGES: {
  value: ApplicationStage;
  label: string;
  sectionBorder: string;
  headerBg: string;
  dot: string;
  countBg: string;
  countText: string;
  cardAccent: string;
}[] = [
  {
    value: "APPLIED",
    label: "Applied",
    sectionBorder: "border-l-zinc-500",
    headerBg: "bg-zinc-500/[0.07]",
    dot: "bg-zinc-400",
    countBg: "bg-zinc-800",
    countText: "text-zinc-300",
    cardAccent: "hover:border-zinc-500/40",
  },
  {
    value: "SCREENING",
    label: "Screening",
    sectionBorder: "border-l-blue-500",
    headerBg: "bg-blue-500/[0.07]",
    dot: "bg-blue-400",
    countBg: "bg-blue-500/10",
    countText: "text-blue-400",
    cardAccent: "hover:border-blue-500/40",
  },
  {
    value: "SHORTLISTED",
    label: "Shortlisted",
    sectionBorder: "border-l-violet-500",
    headerBg: "bg-violet-500/[0.07]",
    dot: "bg-violet-400",
    countBg: "bg-violet-500/10",
    countText: "text-violet-400",
    cardAccent: "hover:border-violet-500/40",
  },
  {
    value: "INTERVIEW",
    label: "Interview",
    sectionBorder: "border-l-amber-500",
    headerBg: "bg-amber-500/[0.07]",
    dot: "bg-amber-400",
    countBg: "bg-amber-500/10",
    countText: "text-amber-400",
    cardAccent: "hover:border-amber-500/40",
  },
  {
    value: "OFFER",
    label: "Offer",
    sectionBorder: "border-l-orange-500",
    headerBg: "bg-orange-500/[0.07]",
    dot: "bg-orange-400",
    countBg: "bg-orange-500/10",
    countText: "text-orange-400",
    cardAccent: "hover:border-orange-500/40",
  },
  {
    value: "HIRED",
    label: "Hired",
    sectionBorder: "border-l-green-500",
    headerBg: "bg-green-500/[0.07]",
    dot: "bg-green-400",
    countBg: "bg-green-500/10",
    countText: "text-green-400",
    cardAccent: "hover:border-green-500/40",
  },
  {
    value: "REJECTED",
    label: "Rejected",
    sectionBorder: "border-l-red-500",
    headerBg: "bg-red-500/[0.07]",
    dot: "bg-red-400",
    countBg: "bg-red-500/10",
    countText: "text-red-400",
    cardAccent: "hover:border-red-500/40",
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
              className={`border border-white/[0.06] border-l-2 ${stage.sectionBorder} rounded-xl overflow-hidden`}
            >
              {/* Stage header */}
              <div
                className={`flex items-center justify-between px-5 py-3 ${stage.headerBg} border-b border-white/[0.05]`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${stage.dot} shadow-sm`} />
                  <span className="text-sm font-semibold text-zinc-200 tracking-wide">
                    {stage.label}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${stage.countBg} ${stage.countText} tabular-nums`}
                >
                  {cards.length} {cards.length === 1 ? "candidate" : "candidates"}
                </span>
              </div>

              {/* Cards grid */}
              {cards.length === 0 ? (
                <div className="px-5 py-5 bg-[#0c0c0c]">
                  <p className="text-xs text-zinc-800 italic">No candidates at this stage</p>
                </div>
              ) : (
                <div className="bg-[#0c0c0c] p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {cards.map((app) => {
                    const initials =
                      `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
                    const score = app.aiEvaluation?.score;

                    const avatarRing =
                      score === undefined
                        ? "ring-zinc-700"
                        : score >= 8
                        ? "ring-green-500/40"
                        : score >= 5
                        ? "ring-amber-500/40"
                        : "ring-red-500/40";

                    const avatarBg =
                      score === undefined
                        ? "bg-zinc-800 text-zinc-400"
                        : score >= 8
                        ? "bg-green-500/10 text-green-400"
                        : score >= 5
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400";

                    const scorePill =
                      score === undefined
                        ? null
                        : score >= 8
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : score >= 5
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20";

                    return (
                      <Link
                        key={app.id}
                        href={`/applications/${app.id}`}
                        className={`group relative flex flex-col bg-[#111111] border border-white/[0.07] ${stage.cardAccent} rounded-xl p-4 gap-3 transition-all duration-150 hover:bg-[#161616] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-px`}
                      >
                        {/* Top: avatar + name */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ring-1 ${avatarRing} flex items-center justify-center shrink-0 ${avatarBg}`}
                          >
                            <span className="text-xs font-bold">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate leading-snug">
                              {app.applicant.firstName} {app.applicant.lastName}
                            </p>
                            {score !== undefined && scorePill && (
                              <span
                                className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded border text-[10px] font-bold tabular-nums ${scorePill}`}
                              >
                                <TrendingUp className="h-2.5 w-2.5" />
                                {score}/10
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: job + email */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Briefcase className="h-3 w-3 text-zinc-600 shrink-0" />
                            <p className="text-xs text-zinc-400 truncate">
                              {app.jobOpening.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="h-3 w-3 text-zinc-600 shrink-0" />
                            <p className="text-xs text-zinc-600 truncate">
                              {app.applicant.email}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: date + arrow */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-zinc-700" />
                            <span className="text-[11px] text-zinc-600 tabular-nums">
                              {relativeDate(new Date(app.createdAt))}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-700 group-hover:text-[#c9a84c] transition-colors font-medium">
                            View →
                          </span>
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
