import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  ArrowLeft,
  Phone,
  Mail,
  ExternalLink,
  Lock,
  MapPin,
  Building2,
  Copy,
} from "lucide-react";
import StageBadge from "@/components/applications/stage-badge";
import AiScoreCard from "@/components/applications/ai-score-card";
import StageChanger from "@/components/applications/stage-changer";
import NoteForm from "@/components/applications/note-form";
import SendEmailButton from "@/components/applications/send-email-button";
import CvPreview from "@/components/applications/cv-preview";
// CvPreview now uses applicationId — private blob URLs are served via /api/cv/[id]
import RescoreButton from "@/components/applications/rescore-button";
import DeleteButton from "@/components/ui/delete-button";
import { ApplicationStage, AIRecommendation } from "@prisma/client";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // @ts-expect-error — custom role field
  const role = session.user.role as string;
  const canChangeStage = ["ADMIN", "HR_MANAGER"].includes(role);
  const canAddNotes = role !== "VIEWER";

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      applicant: true,
      jobOpening: true,
      aiEvaluation: true,
      stageHistory: {
        orderBy: { changedAt: "asc" },
        include: { changedBy: { select: { name: true } } },
      },
      emailLogs: { orderBy: { sentAt: "desc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!application) notFound();

  const { applicant, jobOpening, aiEvaluation } = application;
  const initials =
    `${applicant.firstName[0]}${applicant.lastName[0]}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Applications
      </Link>

      {/* Header card */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
            <span className="text-[#c9a84c] text-lg font-bold">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-white">
                    {applicant.firstName} {applicant.lastName}
                  </h1>
                  {application.isDuplicate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Copy className="h-3 w-3" /> Duplicate Submission
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-sm mt-0.5">
                  {jobOpening.title}
                </p>
              </div>
              <StageBadge stage={application.currentStage as ApplicationStage} />
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <a
                href={`mailto:${applicant.email}`}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" /> {applicant.email}
              </a>
              {applicant.phone && (
                <a
                  href={`tel:${applicant.phone}`}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" /> {applicant.phone}
                </a>
              )}
              {jobOpening.location && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <MapPin className="h-3.5 w-3.5" /> {jobOpening.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions row */}
        {canChangeStage && (
          <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">Move stage:</span>
              <StageChanger
                applicationId={application.id}
                currentStage={application.currentStage as ApplicationStage}
              />
            </div>
            <div className="h-4 w-px bg-white/[0.06]" />
            <SendEmailButton applicationId={application.id} />
            {role === "ADMIN" && (
              <>
                <div className="h-4 w-px bg-white/[0.06]" />
                <DeleteButton
                  endpoint={`/api/applications/${application.id}`}
                  redirectTo="/applications"
                  label="Delete Application"
                  confirmMessage="Are you sure you want to delete this application and all its data (AI evaluation, notes, emails)? This cannot be undone."
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Evaluation */}
          {aiEvaluation ? (
            <AiScoreCard
              evaluation={{
                ...aiEvaluation,
                recommendation: aiEvaluation.recommendation as AIRecommendation,
              }}
            />
          ) : (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl px-6 py-10 text-center space-y-4">
              <div>
                <p className="text-zinc-500 text-sm">
                  No AI evaluation yet.
                </p>
                <p className="text-zinc-700 text-xs mt-1">
                  It may still be processing — refresh in ~20 seconds. If it never appears, use the button below.
                </p>
              </div>
              {canChangeStage && (
                <div className="max-w-xs mx-auto">
                  <RescoreButton applicationId={application.id} />
                </div>
              )}
            </div>
          )}

          {/* Stage History */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Stage History</h3>
            </div>
            <div className="px-6 py-5">
              {application.stageHistory.length === 0 ? (
                <p className="text-zinc-600 text-sm">No history yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />
                  <div className="space-y-5">
                    {application.stageHistory.map((h) => (
                      <div key={h.id} className="flex items-start gap-4">
                        <div className="w-3.5 h-3.5 rounded-full bg-zinc-800 border-2 border-[#c9a84c]/50 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-zinc-300">
                            {h.fromStage ? (
                              <>
                                <span className="text-zinc-500">
                                  {h.fromStage}
                                </span>
                                {" → "}
                                <span className="font-medium text-white">
                                  {h.toStage}
                                </span>
                              </>
                            ) : (
                              <span className="font-medium text-white">
                                Application received — {h.toStage}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {new Date(h.changedAt).toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                            {h.changedBy && <> · {h.changedBy.name}</>}
                          </p>
                          {h.note && (
                            <p className="text-xs text-zinc-500 mt-1 italic">
                              {h.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Log */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Email Log</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {application.emailLogs.length === 0 ? (
                <p className="px-6 py-5 text-sm text-zinc-600">
                  No emails sent yet.
                </p>
              ) : (
                application.emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div>
                      <p className="text-sm text-zinc-300">{log.subject}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {log.sentTo} ·{" "}
                        {new Date(log.sentAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        log.status === "sent"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Notes</h3>
            </div>
            <div className="p-6 space-y-5">
              {canAddNotes && (
                <div className="pb-5 border-b border-white/[0.06]">
                  <NoteForm applicationId={application.id} />
                </div>
              )}
              {application.notes.length === 0 ? (
                <p className="text-sm text-zinc-600">No notes yet.</p>
              ) : (
                <div className="space-y-4">
                  {application.notes.map((note) => (
                    <div key={note.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-400">
                          {note.author.name}
                        </span>
                        {note.isPrivate && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                            <Lock className="h-2.5 w-2.5" /> Private
                          </span>
                        )}
                        <span className="text-xs text-zinc-700 ml-auto">
                          {new Date(note.createdAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short" }
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {note.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* CV */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              CV / Resume
            </h3>
            <CvPreview applicationId={application.id} />
            <a
              href={application.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full rounded-lg border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </a>
          </div>

          {/* Details */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Applied</p>
                <p className="text-sm text-zinc-300">
                  {new Date(application.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">Source</p>
                <p className="text-sm text-zinc-300 capitalize">
                  {application.source.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-600 mb-0.5">GDPR Consent</p>
                <p
                  className={`text-sm font-medium ${
                    application.gdprConsent ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {application.gdprConsent ? "Given" : "Not given"}
                </p>
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Position
            </h3>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {jobOpening.title}
              </p>
              {jobOpening.department && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
                  <Building2 className="h-3 w-3" /> {jobOpening.department}
                </p>
              )}
              {jobOpening.location && (
                <p className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
                  <MapPin className="h-3 w-3" /> {jobOpening.location}
                </p>
              )}
            </div>
            <Link
              href={`/jobs/${jobOpening.id}`}
              className="text-xs text-[#c9a84c] hover:text-[#b8952f] transition-colors"
            >
              View job opening →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
