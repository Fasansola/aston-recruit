import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Plus, MapPin, Building2, Users, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  OPEN:   { label: "Open",   dot: "bg-green-400",  text: "text-green-400" },
  DRAFT:  { label: "Draft",  dot: "bg-zinc-500",   text: "text-zinc-400" },
  CLOSED: { label: "Closed", dot: "bg-red-400",    text: "text-red-400" },
  PAUSED: { label: "Paused", dot: "bg-yellow-400", text: "text-yellow-400" },
};

export default async function JobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const jobs = await prisma.jobOpening.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  const open = jobs.filter((j) => j.status === "OPEN").length;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Job Openings</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {open} open · {jobs.length} total
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] text-black text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.06] border-dashed rounded-xl px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-5 w-5 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No job openings yet</p>
          <p className="text-zinc-600 text-sm mt-1 mb-5">Create your first job to start receiving applications.</p>
          <Link href="/jobs/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] text-black text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Create Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.DRAFT;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] hover:bg-[#141414] transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-[#c9a84c]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors leading-snug mb-2">
                  {job.title}
                </h3>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                  {job.department && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Building2 className="h-3 w-3" /> {job.department}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    {job._count.applications} application{job._count.applications !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {new Date(job.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
