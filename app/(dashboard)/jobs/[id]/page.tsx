import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, MapPin, Building2, Calendar } from "lucide-react";
import StageBadge from "@/components/applications/stage-badge";
import { ApplicationStage } from "@prisma/client";

const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-900 text-green-300 border-green-700",
  DRAFT: "bg-zinc-800 text-zinc-300 border-zinc-600",
  CLOSED: "bg-red-900 text-red-300 border-red-700",
  PAUSED: "bg-yellow-900 text-yellow-300 border-yellow-700",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800 mt-1">
          <ArrowLeft className="h-4 w-4" />
          Jobs
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <Badge variant="outline" className={JOB_STATUS_COLORS[job.status] ?? ""}>
              {job.status}
            </Badge>
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
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{job.requirements}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-zinc-500">WP Opening ID</p>
                <p className="text-zinc-300 font-mono text-xs mt-0.5">{job.wpJobOpeningId}</p>
              </div>
              <div>
                <p className="text-zinc-500">Applications</p>
                <p className="text-zinc-300 font-semibold">{job.applications.length}</p>
              </div>
              {job.closesAt && (
                <div>
                  <p className="text-zinc-500">Closes</p>
                  <p className="text-zinc-300">{new Date(job.closesAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Applications table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Applications ({job.applications.length})
        </h2>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Applicant</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Stage</TableHead>
                <TableHead className="text-zinc-400">AI Score</TableHead>
                <TableHead className="text-zinc-400">Applied</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.applications.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                    No applications yet for this position.
                  </TableCell>
                </TableRow>
              )}
              {job.applications.map((app) => (
                <TableRow key={app.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell className="font-medium text-white">
                    {app.applicant.firstName} {app.applicant.lastName}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{app.applicant.email}</TableCell>
                  <TableCell>
                    <StageBadge stage={app.currentStage as ApplicationStage} />
                  </TableCell>
                  <TableCell>
                    {app.aiEvaluation ? (
                      <span
                        className={`font-bold text-sm ${
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
                      <span className="text-zinc-600 text-sm">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/applications/${app.id}`} className="text-sm text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
