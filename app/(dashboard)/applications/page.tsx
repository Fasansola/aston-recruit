import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StageBadge from "@/components/applications/stage-badge";
import { ApplicationStage } from "@prisma/client";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <p className="text-zinc-400 mt-1">{applications.length} total</p>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Applicant</TableHead>
              <TableHead className="text-zinc-400">Job</TableHead>
              <TableHead className="text-zinc-400">Stage</TableHead>
              <TableHead className="text-zinc-400">AI Score</TableHead>
              <TableHead className="text-zinc-400">Applied</TableHead>
              <TableHead className="text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="text-center text-zinc-500 py-12">
                  No applications yet. They will appear here once candidates apply.
                </TableCell>
              </TableRow>
            )}
            {applications.map((app) => (
              <TableRow key={app.id} className="border-zinc-800 hover:bg-zinc-900">
                <TableCell>
                  <div>
                    <p className="font-medium text-white">
                      {app.applicant.firstName} {app.applicant.lastName}
                    </p>
                    <p className="text-xs text-zinc-500">{app.applicant.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-300 text-sm">
                  {app.jobOpening.title}
                </TableCell>
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
  );
}
