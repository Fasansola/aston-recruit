import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, TrendingUp, Brain } from "lucide-react";
import { redirect } from "next/navigation";

async function getStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalApplications, openJobs, thisWeek, aiEvaluated] = await Promise.all([
    prisma.application.count(),
    prisma.jobOpening.count({ where: { status: "OPEN" } }),
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.aIEvaluation.count(),
  ]);

  return { totalApplications, openJobs, thisWeek, aiEvaluated };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const stats = await getStats();

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: Users,
      description: "All time",
    },
    {
      title: "Open Jobs",
      value: stats.openJobs,
      icon: Briefcase,
      description: "Active positions",
    },
    {
      title: "This Week",
      value: stats.thisWeek,
      icon: TrendingUp,
      description: "New applications",
    },
    {
      title: "AI Evaluated",
      value: stats.aiEvaluated,
      icon: Brain,
      description: "CVs scored",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-[#c9a84c]" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">
              View your pipeline and recent application updates from the Applications
              and Pipeline sections.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/jobs/new"
              className="block text-sm text-[#c9a84c] hover:underline"
            >
              + Create new job opening
            </a>
            <a
              href="/applications"
              className="block text-sm text-[#c9a84c] hover:underline"
            >
              → View all applications
            </a>
            <a
              href="/pipeline"
              className="block text-sm text-[#c9a84c] hover:underline"
            >
              → Open pipeline view
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
