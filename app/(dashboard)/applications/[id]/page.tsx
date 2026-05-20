import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Phone, Mail, ExternalLink, Lock, Clock } from "lucide-react";
import StageBadge from "@/components/applications/stage-badge";
import AiScoreCard from "@/components/applications/ai-score-card";
import StageChanger from "@/components/applications/stage-changer";
import NoteForm from "@/components/applications/note-form";
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
        orderBy: { changedAt: "desc" },
        include: {
          changedBy: { select: { name: true } },
        },
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800">
        <ArrowLeft className="h-4 w-4" />
        Applications
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {applicant.firstName} {applicant.lastName}
          </h1>
          <p className="text-zinc-400 mt-1">{jobOpening.title}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {applicant.email}
            </span>
            {applicant.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {applicant.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StageBadge stage={application.currentStage as ApplicationStage} />
          {canChangeStage && (
            <StageChanger
              applicationId={application.id}
              currentStage={application.currentStage as ApplicationStage}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — AI evaluation + stage history + email log */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Evaluation */}
          {aiEvaluation ? (
            <AiScoreCard
              evaluation={{
                ...aiEvaluation,
                recommendation: aiEvaluation.recommendation as AIRecommendation,
              }}
            />
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center text-zinc-500 text-sm">
                AI evaluation pending — processing in background…
              </CardContent>
            </Card>
          )}

          {/* Stage History */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Stage History</CardTitle>
            </CardHeader>
            <CardContent>
              {application.stageHistory.length === 0 ? (
                <p className="text-zinc-500 text-sm">No history yet.</p>
              ) : (
                <div className="space-y-3">
                  {application.stageHistory.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <Clock className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300">
                          {h.fromStage ? (
                            <>
                              Moved from{" "}
                              <span className="text-zinc-400">{h.fromStage}</span> to{" "}
                              <span className="text-white font-medium">{h.toStage}</span>
                            </>
                          ) : (
                            <>
                              Application received —{" "}
                              <span className="text-white font-medium">{h.toStage}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(h.changedAt).toLocaleString()}
                          {h.changedBy && ` · by ${h.changedBy.name}`}
                        </p>
                        {h.note && (
                          <p className="text-xs text-zinc-400 mt-1 italic">{h.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Log */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Email Log</CardTitle>
            </CardHeader>
            <CardContent>
              {application.emailLogs.length === 0 ? (
                <p className="text-zinc-500 text-sm">No emails sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {application.emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-zinc-300">{log.subject}</p>
                        <p className="text-xs text-zinc-500">
                          To: {log.sentTo} · {new Date(log.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          log.status === "sent"
                            ? "border-green-700 text-green-400 text-xs"
                            : "border-red-700 text-red-400 text-xs"
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAddNotes && (
                <>
                  <NoteForm applicationId={application.id} />
                  <Separator className="bg-zinc-800" />
                </>
              )}
              {application.notes.length === 0 ? (
                <p className="text-zinc-500 text-sm">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {application.notes.map((note) => (
                    <div key={note.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-medium">
                          {note.author.name}
                        </span>
                        {note.isPrivate && (
                          <span className="flex items-center gap-1 text-xs text-zinc-600">
                            <Lock className="h-3 w-3" />
                            Private
                          </span>
                        )}
                        <span className="text-xs text-zinc-600 ml-auto">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{note.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-500">Applied</p>
                <p className="text-zinc-300">
                  {new Date(application.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Source</p>
                <p className="text-zinc-300">{application.source}</p>
              </div>
              <div>
                <p className="text-zinc-500">GDPR Consent</p>
                <p className={application.gdprConsent ? "text-green-400" : "text-red-400"}>
                  {application.gdprConsent ? "Given" : "Not given"}
                </p>
              </div>
              {application.gdprConsentedAt && (
                <div>
                  <p className="text-zinc-500">Consented At</p>
                  <p className="text-zinc-300">
                    {new Date(application.gdprConsentedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CV link */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">CV</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open CV (PDF)
              </a>
            </CardContent>
          </Card>

          {/* Job info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-zinc-300 font-medium">{jobOpening.title}</p>
              {jobOpening.department && (
                <p className="text-zinc-500">{jobOpening.department}</p>
              )}
              {jobOpening.location && (
                <p className="text-zinc-500">{jobOpening.location}</p>
              )}
              <Link href={`/jobs/${jobOpening.id}`} className="text-sm text-[#c9a84c] hover:text-[#b8952f] transition-colors">
                View job →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
