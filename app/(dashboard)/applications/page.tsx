import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import StageBadge from "@/components/applications/stage-badge";
import { ApplicationStage } from "@prisma/client";
import { Users } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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

      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        {applications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Users className="h-5 w-5 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No applications yet</p>
            <p className="text-zinc-600 text-sm mt-1">Applications will appear here once candidates apply via your website.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_140px_80px_100px_80px] gap-4 px-6 py-3 border-b border-white/[0.06]">
              <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Applicant</span>
              <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Position</span>
              <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Stage</span>
              <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Score</span>
              <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Applied</span>
              <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider"></span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {applications.map((app) => {
                const initials = `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
                return (
                  <div key={app.id} className="grid grid-cols-[1fr_1fr_140px_80px_100px_80px] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                        <span className="text-zinc-300 text-[11px] font-semibold">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">
                          {app.applicant.firstName} {app.applicant.lastName}
                        </p>
                        <p className="text-[11px] text-zinc-600 truncate">{app.applicant.email}</p>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-400 truncate">{app.jobOpening.title}</p>

                    <div>
                      <StageBadge stage={app.currentStage as ApplicationStage} />
                    </div>

                    <div>
                      {app.aiEvaluation ? (
                        <span className={`text-sm font-bold tabular-nums ${
                          app.aiEvaluation.score >= 8 ? "text-green-400" :
                          app.aiEvaluation.score >= 5 ? "text-yellow-400" : "text-red-400"
                        }`}>
                          {app.aiEvaluation.score}/10
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-700 italic">—</span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600">
                      {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>

                    <div>
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-xs text-zinc-500 hover:text-[#c9a84c] transition-colors font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
