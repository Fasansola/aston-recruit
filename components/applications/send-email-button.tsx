"use client";

import { useState } from "react";
import { Mail, ChevronDown, Loader2, CheckCircle, XCircle } from "lucide-react";

const EMAIL_OPTIONS: { label: string; stage: string }[] = [
  { label: "Application Received", stage: "APPLIED" },
  { label: "Under Review", stage: "SCREENING" },
  { label: "Shortlisted", stage: "SHORTLISTED" },
  { label: "Interview Invite", stage: "INTERVIEW" },
  { label: "Offer", stage: "OFFER" },
  { label: "Rejected", stage: "REJECTED" },
];

interface SendEmailButtonProps {
  applicationId: string;
}

type Status = "idle" | "selecting" | "loading" | "success" | "error";

export default function SendEmailButton({
  applicationId,
}: SendEmailButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  function handleToggleDropdown() {
    if (status === "selecting") {
      setStatus("idle");
      setSelectedStage("");
    } else {
      setStatus("selecting");
      setMessage("");
    }
  }

  async function handleSend() {
    if (!selectedStage) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(
        `/api/applications/${applicationId}/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: selectedStage }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send email");
      }

      const label =
        EMAIL_OPTIONS.find((o) => o.stage === selectedStage)?.label ??
        "Email";
      setMessage(`"${label}" email queued successfully.`);
      setStatus("success");
      setSelectedStage("");

      // Reset to idle after 4 seconds
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to send email."
      );
      setStatus("error");
      // Reset to selecting so they can try again
      setTimeout(() => setStatus("selecting"), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Trigger button */}
      <button
        onClick={handleToggleDropdown}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 text-xs text-zinc-400 hover:text-[#c9a84c] transition-all disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Mail className="h-3.5 w-3.5" />
        )}
        Send Email
        <ChevronDown
          className={`h-3 w-3 transition-transform ${
            status === "selecting" ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {status === "selecting" && (
        <div className="bg-[#161616] border border-white/[0.08] rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
            Choose email template
          </p>
          <div className="space-y-1">
            {EMAIL_OPTIONS.map((opt) => (
              <label
                key={opt.stage}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="email-stage"
                  value={opt.stage}
                  checked={selectedStage === opt.stage}
                  onChange={() => setSelectedStage(opt.stage)}
                  className="accent-[#c9a84c]"
                />
                <span className="text-xs text-zinc-300">{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={!selectedStage}
              className="px-3 py-1.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] disabled:opacity-40 text-black text-xs font-semibold transition-colors"
            >
              Send
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setSelectedStage("");
              }}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Feedback messages */}
      {status === "success" && message && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
          <p className="text-xs text-green-400">{message}</p>
        </div>
      )}
      {status === "error" && message && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{message}</p>
        </div>
      )}
    </div>
  );
}
