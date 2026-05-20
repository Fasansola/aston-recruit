import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ApplicationStage } from "@prisma/client";
import ApplicationsOverTime from "@/components/analytics/applications-over-time";
import StageDistribution from "@/components/analytics/stage-distribution";
import ScoreDistribution from "@/components/analytics/score-distribution";
import TopJobs from "@/components/analytics/top-jobs";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function subDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - days);
  return result;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // 1. Applications per day for the last 30 days
  const recentApplications = await prisma.application.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Build a map: "DD Mon" → count
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const day = subDays(now, i);
    dayMap[formatDate(day)] = 0;
  }
  for (const app of recentApplications) {
    const key = formatDate(new Date(app.createdAt));
    if (key in dayMap) dayMap[key]++;
  }
  const applicationsOverTime = Object.entries(dayMap).map(([date, count]) => ({
    date,
    count,
  }));

  // 2. Applications by stage
  const stageGroups = await prisma.application.groupBy({
    by: ["currentStage"],
    _count: { _all: true },
  });

  const allStages: ApplicationStage[] = [
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ];

  const stageMap = Object.fromEntries(
    stageGroups.map((g) => [g.currentStage, g._count._all])
  );

  const stageData = allStages.map((stage) => ({
    stage,
    count: stageMap[stage] ?? 0,
  }));

  // 3. AI score distribution (buckets)
  const allEvaluations = await prisma.aIEvaluation.findMany({
    select: { score: true },
  });

  const scoreBuckets = [
    { label: "1–3 Poor", color: "#ef4444", min: 1, max: 3 },
    { label: "4–5 Below Avg", color: "#f97316", min: 4, max: 5 },
    { label: "6–7 Average", color: "#eab308", min: 6, max: 7 },
    { label: "8–10 Strong", color: "#22c55e", min: 8, max: 10 },
  ].map((bucket) => ({
    label: bucket.label,
    color: bucket.color,
    count: allEvaluations.filter(
      (e) => e.score >= bucket.min && e.score <= bucket.max
    ).length,
  }));

  // 4. Top 5 jobs by application count
  const jobCounts = await prisma.application.groupBy({
    by: ["jobOpeningId"],
    _count: { _all: true },
    orderBy: { _count: { jobOpeningId: "desc" } },
    take: 5,
  });

  const jobIds = jobCounts.map((j) => j.jobOpeningId);
  const jobDetails = await prisma.jobOpening.findMany({
    where: { id: { in: jobIds } },
    select: { id: true, title: true },
  });
  const jobDetailMap = Object.fromEntries(jobDetails.map((j) => [j.id, j]));

  const topJobs = jobCounts.map((j) => ({
    id: j.jobOpeningId,
    title: jobDetailMap[j.jobOpeningId]?.title ?? "Unknown",
    count: j._count._all,
  }));

  const maxJobCount = topJobs[0]?.count ?? 0;

  // 5. Stage conversion rates
  const totalByStage = Object.fromEntries(
    stageData.map((s) => [s.stage, s.count])
  );
  const totalApplications = Object.values(totalByStage).reduce(
    (a, b) => a + b,
    0
  );

  const conversionStages: ApplicationStage[] = [
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFER",
    "HIRED",
  ];

  const conversionRates = conversionStages.map((stage) => {
    const count = totalByStage[stage] ?? 0;
    const pct =
      totalApplications > 0
        ? ((count / totalApplications) * 100).toFixed(1)
        : "0.0";
    return { stage, count, pct };
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Hiring pipeline overview — last updated now
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Applications",
            value: totalApplications,
            color: "text-white",
          },
          {
            label: "Last 30 Days",
            value: recentApplications.length,
            color: "text-[#c9a84c]",
          },
          {
            label: "AI Evaluated",
            value: allEvaluations.length,
            color: "text-zinc-300",
          },
          {
            label: "Hired",
            value: totalByStage["HIRED"] ?? 0,
            color: "text-green-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#111111] border border-white/[0.06] rounded-xl p-5"
          >
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Applications over time */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">
            Applications over time (30 days)
          </h2>
          <ApplicationsOverTime data={applicationsOverTime} />
        </div>

        {/* Stage distribution */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">
            Applications by stage
          </h2>
          <StageDistribution data={stageData} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AI Score distribution */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">
            AI score distribution
          </h2>
          <ScoreDistribution data={scoreBuckets} />
        </div>

        {/* Top jobs */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">
            Top jobs by applications
          </h2>
          <TopJobs data={topJobs} maxCount={maxJobCount} />
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-6">
          Pipeline conversion rates
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {conversionRates.map((r, i) => (
            <div key={r.stage} className="relative text-center">
              {/* Connector arrow */}
              {i > 0 && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-zinc-700 text-xs hidden sm:block">
                  →
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  {r.stage}
                </p>
                <p className="text-2xl font-bold text-white">{r.count}</p>
                <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c9a84c]/60 rounded-full transition-all"
                    style={{
                      width:
                        totalApplications > 0
                          ? `${(r.count / totalApplications) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{r.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
