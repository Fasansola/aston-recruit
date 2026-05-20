import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-900 text-green-300 border-green-700",
  DRAFT: "bg-zinc-800 text-zinc-300 border-zinc-600",
  CLOSED: "bg-red-900 text-red-300 border-red-700",
  PAUSED: "bg-yellow-900 text-yellow-300 border-yellow-700",
};

export default async function JobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const jobs = await prisma.jobOpening.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Openings</h1>
          <p className="text-zinc-400 mt-1">{jobs.length} positions</p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold bg-[#c9a84c] hover:bg-[#b8952f] text-black transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Title</TableHead>
              <TableHead className="text-zinc-400">Department</TableHead>
              <TableHead className="text-zinc-400">Location</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Applications</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center text-zinc-500 py-12">
                  No job openings yet. Create your first one.
                </TableCell>
              </TableRow>
            )}
            {jobs.map((job) => (
              <TableRow key={job.id} className="border-zinc-800 hover:bg-zinc-900">
                <TableCell className="font-medium text-white">{job.title}</TableCell>
                <TableCell className="text-zinc-400">{job.department ?? "—"}</TableCell>
                <TableCell className="text-zinc-400">{job.location ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[job.status] ?? ""}
                  >
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-zinc-300">
                  {job._count.applications}
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {new Date(job.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/jobs/${job.id}`} className="text-sm text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-800">
                      View
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
