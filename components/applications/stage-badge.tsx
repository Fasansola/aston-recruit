import { Badge } from "@/components/ui/badge";
import { ApplicationStage } from "@prisma/client";

const STAGE_CONFIG: Record<
  ApplicationStage,
  { label: string; className: string }
> = {
  APPLIED: {
    label: "Applied",
    className: "bg-zinc-800 text-zinc-300 border-zinc-600",
  },
  SCREENING: {
    label: "Screening",
    className: "bg-blue-900 text-blue-300 border-blue-700",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    className: "bg-purple-900 text-purple-300 border-purple-700",
  },
  INTERVIEW: {
    label: "Interview",
    className: "bg-yellow-900 text-yellow-300 border-yellow-700",
  },
  OFFER: {
    label: "Offer",
    className: "bg-orange-900 text-orange-300 border-orange-700",
  },
  HIRED: {
    label: "Hired",
    className: "bg-green-900 text-green-300 border-green-700",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-900 text-red-300 border-red-700",
  },
};

interface StageBadgeProps {
  stage: ApplicationStage;
}

export default function StageBadge({ stage }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
