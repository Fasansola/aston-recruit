"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface RescoreButtonProps {
  applicationId: string;
}

export default function RescoreButton({ applicationId }: RescoreButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleRescore() {
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/rescore`, {
        method: "POST",
      });

      if (res.ok) {
        // Refresh the page data to show the new score
        router.refresh();
        setStatus("idle");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong. Check that OPENAI_API_KEY is set in Vercel.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error — please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleRescore}
        disabled={status === "loading"}
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 px-4 py-2.5 text-sm font-medium text-[#c9a84c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} />
        {status === "loading" ? "Running AI evaluation… (~15s)" : "Re-run AI Evaluation"}
      </button>

      {status === "error" && errorMsg && (
        <p className="text-xs text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
}
