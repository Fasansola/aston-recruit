import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ArrowLeft, MapPin, Building2, Calendar, Pencil } from "lucide-react";
import CopyableId from "@/components/ui/copyable-id";
import StageBadge from "@/components/applications/stage-badge";
import WpPublishButton from "@/components/jobs/wp-publish-button";
import JobShareButtons from "@/components/jobs/job-share-buttons";
import DeleteButton from "@/components/ui/delete-button";
import { ApplicationStage } from "@prisma/client";

const JOB_STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  OPEN: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
    label: "Open",
  },
  DRAFT: {
    bg: "bg-zinc-800/60",
    text: "text-zinc-400",
    border: "border-zinc-700/50",
    label: "Draft",
  },
  CLOSED: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    label: "Closed",
  },
  PAUSED: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    label: "Paused",
  },
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // @ts-expect-error — custom role field
  const role = session.user.role as string;
  const canEdit = ["ADMIN", "HR_MANAGER"].includes(role);

  const { id } = await params;

  const job = await prisma.jobOpening.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: true,
          aiEvaluation: { select: { score: true, recommendation: true } },
        },
      },
    },
  });

  if (!job) notFound();

  const statusStyle =
    JOB_STATUS_STYLES[job.status] ?? JOB_STATUS_STYLES.DRAFT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Jobs
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {statusStyle.label}
            </span>
            {canEdit && (
              <Link
                href={`/jobs/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 text-xs text-zinc-400 hover:text-[#c9a84c] transition-all"
              >
                <Pencil className="h-3 w-3" />
                Edit Job
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
            {job.department && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.department}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Description
            </h3>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </div>

          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Requirements
            </h3>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
              {job.requirements}
            </p>
          </div>
        </div>

        <div>
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">WordPress Job ID</p>
                <CopyableId value={job.wpJobOpeningId} />
                <p className="text-[11px] text-zinc-700 mt-1.5">
                  Paste into the hidden <code className="text-zinc-600">job_opening_id</code> field in your Elementor form.
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Applications</p>
                <p className="text-zinc-300 font-semibold text-lg">
                  {job.applications.length}
                </p>
              </div>
              {job.closesAt && (
                <div>
                  <p className="text-[11px] text-zinc-600 mb-0.5">Closes</p>
                  <p className="text-zinc-300">
                    {new Date(job.closesAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {canEdit && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[11px] text-zinc-600 mb-2">WordPress</p>
                  <WpPublishButton
                    jobId={job.id}
                    currentWpPostUrl={job.wpPostUrl}
                  />
                </div>
              )}

              {job.wpPostUrl && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[11px] text-zinc-600 mb-2">Share</p>
                  <JobShareButtons
                    jobTitle={job.title}
                    wpPostUrl={job.wpPostUrl}
                  />
                </div>
              )}

              {role === "ADMIN" && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[11px] text-zinc-600 mb-2">Danger Zone</p>
                  <DeleteButton
                    endpoint={`/api/jobs/${id}`}
                    redirectTo="/jobs"
                    label="Delete Job"
                    confirmMessage={
                      job.applications.length > 0
                        ? `This job has ${job.applications.length} application(s). Remove all applications before deleting.`
                        : "Are you sure you want to delete this job opening? This cannot be undone."
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Applications table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Applications ({job.applications.length})
        </h2>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
          {job.applications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-zinc-500 text-sm">
                No applications yet for this position.
              </p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="grid grid-cols-[1fr_160px_80px_100px_80px] gap-4 px-6 py-3 border-b border-white/[0.06]">
                <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Applicant
                </span>
                <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Stage
                </span>
                <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Score
                </span>
                <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  Applied
                </span>
                <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider" />
              </div>

              <div className="divide-y divide-white/[0.04]">
                {job.applications.map((app) => {
                  const initials =
                    `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
                  return (
                    <div
                      key={app.id}
                      className="grid grid-cols-[1fr_160px_80px_100px_80px] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                          <span className="text-zinc-300 text-[11px] font-semibold">
                            {initials}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">
                            {app.applicant.firstName} {app.applicant.lastName}
                          </p>
                          <p className="text-[11px] text-zinc-600 truncate">
                            {app.applicant.email}
                          </p>
                        </div>
                      </div>

                      <div>
                        <StageBadge
                          stage={app.currentStage as ApplicationStage}
                        />
                      </div>

                      <div>
                        {app.aiEvaluation ? (
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              app.aiEvaluation.score >= 8
                                ? "text-green-400"
                                : app.aiEvaluation.score >= 5
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {app.aiEvaluation.score}/10
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-700 italic">—</span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600">
                        {new Date(app.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
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
    </div>
  );
}
