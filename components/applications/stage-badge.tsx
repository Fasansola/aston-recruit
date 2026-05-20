import { ApplicationStage } from "@prisma/client";

const STAGE_CONFIG: Record<ApplicationStage, { label: string; className: string }> = {
  APPLIED:     { label: "Applied",     className: "bg-zinc-800/80 text-zinc-300 border-zinc-700/50" },
  SCREENING:   { label: "Screening",   className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  SHORTLISTED: { label: "Shortlisted", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  INTERVIEW:   { label: "Interview",   className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  OFFER:       { label: "Offer",       className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  HIRED:       { label: "Hired",       className: "bg-green-500/10 text-green-400 border-green-500/20" },
  REJECTED:    { label: "Rejected",    className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function StageBadge({ stage }: { stage: ApplicationStage }) {
  const config = STAGE_CONFIG[stage];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${config.className}`}>
      {config.label}
    </span>
  );
}
