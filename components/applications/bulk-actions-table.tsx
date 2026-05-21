"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StageBadge from "@/components/applications/stage-badge";
import { ApplicationStage } from "@prisma/client";
import { Loader2, CheckSquare, Square, ChevronDown, Copy } from "lucide-react";

const STAGES: { value: ApplicationStage; label: string }[] = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
];

const EMAIL_OPTIONS: { label: string; stage: ApplicationStage }[] = [
  { label: "Application Received", stage: "APPLIED" },
  { label: "Under Review", stage: "SCREENING" },
  { label: "Shortlisted", stage: "SHORTLISTED" },
  { label: "Interview Invite", stage: "INTERVIEW" },
  { label: "Offer", stage: "OFFER" },
  { label: "Rejected", stage: "REJECTED" },
];

interface ApplicationRow {
  id: string;
  currentStage: string;
  createdAt: Date;
  isDuplicate: boolean;
  applicant: { firstName: string; lastName: string; email: string };
  jobOpening: { id: string; title: string };
  aiEvaluation: { score: number; recommendation: string } | null;
}

interface BulkActionsTableProps {
  applications: ApplicationRow[];
  isReadOnly?: boolean;
}

type BulkMode = "stage" | "email";
type FilterTab = "all" | "duplicates";

export default function BulkActionsTable({
  applications,
  isReadOnly = false,
}: BulkActionsTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<BulkMode | null>(null);
  const [bulkStage, setBulkStage] = useState<ApplicationStage | "">("");
  const [bulkEmailStage, setBulkEmailStage] = useState<ApplicationStage | "">(
    ""
  );
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const duplicateCount = applications.filter((a) => a.isDuplicate).length;
  const visibleApplications =
    activeTab === "duplicates"
      ? applications.filter((a) => a.isDuplicate)
      : applications;

  const allIds = visibleApplications.map((a) => a.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function switchTab(tab: FilterTab) {
    setActiveTab(tab);
    setSelected(new Set());
    setBulkMode(null);
    setStatusMsg(null);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOpenBulk(mode: BulkMode) {
    setBulkMode((prev) => (prev === mode ? null : mode));
    setStatusMsg(null);
  }

  async function handleBulkStage() {
    if (!bulkStage) return;
    startTransition(async () => {
      try {
        await Promise.all(
          [...selected].map((id) =>
            fetch(`/api/applications/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentStage: bulkStage }),
            })
          )
        );
        setStatusMsg({
          type: "success",
          text: `Moved ${selected.size} application(s) to ${bulkStage}.`,
        });
        setSelected(new Set());
        setBulkMode(null);
        setBulkStage("");
        router.refresh();
      } catch {
        setStatusMsg({ type: "error", text: "Some updates failed. Please retry." });
      }
    });
  }

  async function handleBulkEmail() {
    if (!bulkEmailStage) return;
    startTransition(async () => {
      try {
        await Promise.all(
          [...selected].map((id) =>
            fetch(`/api/applications/${id}/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stage: bulkEmailStage }),
            })
          )
        );
        setStatusMsg({
          type: "success",
          text: `Email queued for ${selected.size} application(s).`,
        });
        setSelected(new Set());
        setBulkMode(null);
        setBulkEmailStage("");
      } catch {
        setStatusMsg({ type: "error", text: "Some emails failed to queue." });
      }
    });
  }

  async function handleBulkDiscard() {
    startTransition(async () => {
      try {
        await Promise.all(
          [...selected].map((id) =>
            fetch(`/api/applications/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentStage: "REJECTED" }),
            })
          )
        );
        setStatusMsg({
          type: "success",
          text: `Discarded ${selected.size} duplicate application(s).`,
        });
        setSelected(new Set());
        setBulkMode(null);
        router.refresh();
      } catch {
        setStatusMsg({ type: "error", text: "Some updates failed. Please retry." });
      }
    });
  }

  if (applications.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl px-6 py-16 text-center">
        <p className="text-zinc-400 font-medium">No applications yet</p>
        <p className="text-zinc-600 text-sm mt-1">
          Applications will appear here once candidates apply via your website.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => switchTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "all"
              ? "bg-white/[0.08] text-zinc-200"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          All ({applications.length})
        </button>
        <button
          onClick={() => switchTab("duplicates")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "duplicates"
              ? "bg-orange-500/10 text-orange-400"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Copy className="h-3 w-3" />
          Duplicates
          {duplicateCount > 0 && (
            <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {duplicateCount}
            </span>
          )}
        </button>
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="px-4 py-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
          <p className="text-xs text-yellow-400/80">
            You are viewing applications in read-only mode.
          </p>
        </div>
      )}

      {/* Bulk action bar */}
      {someSelected && !isReadOnly && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#161616] border border-white/[0.08] rounded-xl flex-wrap">
          <span className="text-xs font-semibold text-zinc-300">
            {selected.size} selected
          </span>
          <div className="h-3.5 w-px bg-white/[0.08]" />

          {/* Move Stage */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenBulk("stage")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 text-xs text-zinc-400 hover:text-[#c9a84c] transition-all"
            >
              Move Stage
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  bulkMode === "stage" ? "rotate-180" : ""
                }`}
              />
            </button>
            {bulkMode === "stage" && (
              <div className="flex items-center gap-2">
                <select
                  value={bulkStage}
                  onChange={(e) =>
                    setBulkStage(e.target.value as ApplicationStage)
                  }
                  className="bg-[#0d0d0d] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c9a84c]/50"
                >
                  <option value="">Select stage…</option>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkStage}
                  disabled={!bulkStage || isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] disabled:opacity-40 text-black text-xs font-semibold transition-colors"
                >
                  {isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Apply
                </button>
              </div>
            )}
          </div>

          <div className="h-3.5 w-px bg-white/[0.08]" />

          {/* Send Email */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenBulk("email")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 text-xs text-zinc-400 hover:text-[#c9a84c] transition-all"
            >
              Send Email
              <ChevronDown
                className={`h-3 w-3 transition-transform ${
                  bulkMode === "email" ? "rotate-180" : ""
                }`}
              />
            </button>
            {bulkMode === "email" && (
              <div className="flex items-center gap-2">
                <select
                  value={bulkEmailStage}
                  onChange={(e) =>
                    setBulkEmailStage(e.target.value as ApplicationStage)
                  }
                  className="bg-[#0d0d0d] border border-white/[0.08] text-zinc-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c9a84c]/50"
                >
                  <option value="">Select email…</option>
                  {EMAIL_OPTIONS.map((o) => (
                    <option key={o.stage} value={o.stage}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkEmail}
                  disabled={!bulkEmailStage || isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] disabled:opacity-40 text-black text-xs font-semibold transition-colors"
                >
                  {isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Send
                </button>
              </div>
            )}
          </div>

          {/* Discard duplicates shortcut — only shown on duplicates tab */}
          {activeTab === "duplicates" && (
            <>
              <div className="h-3.5 w-px bg-white/[0.08]" />
              <button
                onClick={handleBulkDiscard}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-xs text-red-400 font-medium transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                Discard Selected
              </button>
            </>
          )}

          <button
            onClick={() => {
              setSelected(new Set());
              setBulkMode(null);
            }}
            className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Status feedback */}
      {statusMsg && (
        <div
          className={`px-4 py-2.5 rounded-lg border text-xs ${
            statusMsg.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_1fr_140px_80px_100px_80px] gap-4 px-6 py-3 border-b border-white/[0.06]">
          {!isReadOnly ? (
            <button
              onClick={toggleAll}
              className="flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
              title={allSelected ? "Deselect all" : "Select all"}
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-[#c9a84c]" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div />
          )}
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Applicant
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Position
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Stage
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Score
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
            Applied
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider" />
        </div>

        <div className="divide-y divide-white/[0.04]">
          {visibleApplications.length === 0 && (
            <p className="px-6 py-10 text-sm text-zinc-600 text-center">
              No duplicate applications found.
            </p>
          )}
          {visibleApplications.map((app) => {
            const initials =
              `${app.applicant.firstName[0]}${app.applicant.lastName[0]}`.toUpperCase();
            const isChecked = selected.has(app.id);

            return (
              <div
                key={app.id}
                className={`grid grid-cols-[40px_1fr_1fr_140px_80px_100px_80px] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors ${
                  isChecked ? "bg-[#c9a84c]/[0.03]" : ""
                }`}
              >
                {!isReadOnly ? (
                  <button
                    onClick={() => toggleOne(app.id)}
                    className="flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 text-[#c9a84c]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-zinc-300 text-[11px] font-semibold">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </p>
                      {app.isDuplicate && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <Copy className="h-2.5 w-2.5" /> Duplicate
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 truncate">
                      {app.applicant.email}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 truncate">
                  {app.jobOpening.title}
                </p>

                <div>
                  <StageBadge
                    stage={app.currentStage as ApplicationStage}
                  />
                </div>

                <div>
                  {app.aiEvaluation ? (
                    <span
                      className={`text-sm font-bold tabular-nums ${
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
                    <span className="text-xs text-zinc-700 italic">—</span>
                  )}
                </div>

                <p className="text-xs text-zinc-600">
                  {new Date(app.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>

                <div>
                  <Link
                    href={`/applications/${app.id}`}
                    className="text-xs text-zinc-500 hover:text-[#c9a84c] transition-colors font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
