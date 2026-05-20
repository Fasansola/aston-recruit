"use client";

interface TopJob {
  title: string;
  count: number;
  id: string;
}

interface TopJobsProps {
  data: TopJob[];
  maxCount: number;
}

export default function TopJobs({ data, maxCount }: TopJobsProps) {
  if (data.length === 0) {
    return (
      <p className="text-zinc-600 text-sm text-center py-8">
        No data yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((job, i) => {
        const pct = maxCount > 0 ? (job.count / maxCount) * 100 : 0;
        return (
          <div key={job.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] text-zinc-600 tabular-nums w-4 shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-zinc-300 truncate">{job.title}</span>
              </div>
              <span className="text-sm font-semibold text-[#c9a84c] tabular-nums shrink-0">
                {job.count}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#c9a84c]/60 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
