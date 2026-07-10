import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Users, TrendingUp, Brain, ArrowRight, Plus } from "lucide-react";
import StageBadge from "@/components/applications/stage-badge";
import { ApplicationStage } from "@prisma/client";

async function getStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalApplications, openJobs, thisWeek, aiEvaluated, recent] = await Promise.all([
    prisma.application.count(),
    prisma.jobOpening.count({ where: { status: "OPEN" } }),
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.aIEvaluation.count(),
    prisma.application.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        applicant: true,
        jobOpening: { select: { title: true } },
        aiEvaluation: { select: { score: true } },
      },
    }),
  ]);
  return { totalApplications, openJobs, thisWeek, aiEvaluated, recent };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getStats();
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const statCards = [
    { title: "Total Applications", value: stats.totalApplications, icon: Users, sub: "All time" },
    { title: "Open Positions", value: stats.openJobs, icon: Briefcase, sub: "Active jobs" },
    { title: "This Week", value: stats.thisWeek, icon: TrendingUp, sub: "New applications" },
    { title: "AI Evaluated", value: stats.aiEvaluated, icon: Brain, sub: "CVs scored" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm mb-1">Good to see you back</p>
          <h1 className="text-2xl font-semibold text-white">Welcome, {firstName}</h1>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] text-black text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{card.title}</p>
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-[#c9a84c]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">{card.value}</p>
              <p className="text-zinc-600 text-xs mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Recent applications */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
          <Link href="/applications" className="text-xs text-zinc-500 hover:text-[#c9a84c] transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-zinc-600 text-sm">No applications yet.</p>
            <p className="text-zinc-700 text-xs mt-1">Applications will appear here once candidates apply.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {stats.recent.map((app) => {
              const initials = `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
              return (
                <Link key={app.id} href={`/applications/${app.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-zinc-300 text-xs font-semibold">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {app.applicant.firstName} {app.applicant.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{app.jobOpening?.title ?? "Deleted job"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {app.aiEvaluation && (
                      <span className={`text-xs font-bold tabular-nums ${
                        app.aiEvaluation.score >= 8 ? "text-green-400" :
                        app.aiEvaluation.score >= 5 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {app.aiEvaluation.score}/10
                      </span>
                    )}
                    <StageBadge stage={app.currentStage as ApplicationStage} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
