"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplicationStage } from "@prisma/client";

const STAGES: { value: ApplicationStage; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
];

interface StageChangerProps {
  applicationId: string;
  currentStage: ApplicationStage;
}

export default function StageChanger({
  applicationId,
  currentStage,
}: StageChangerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStage: string | null) {
    if (!newStage || newStage === currentStage) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: newStage }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update stage");
        return;
      }

      // Refresh the page to show the new stage and updated history
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Select
        value={currentStage}
        onValueChange={handleChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          {STAGES.map((stage) => (
            <SelectItem
              key={stage.value}
              value={stage.value}
              className="text-zinc-200 focus:bg-zinc-700"
            >
              {stage.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && <p className="text-xs text-zinc-500">Updating…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
