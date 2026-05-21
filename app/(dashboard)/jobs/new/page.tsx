"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import Link from "next/link";

/** Converts a job title into a URL-safe, unique job ID */
function generateJobId(title: string, suffix: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return slug ? `job_${slug}_${suffix}` : `job_${suffix}`;
}

/** Generates a short random alphanumeric suffix */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const suffixRef = useRef(randomSuffix()); // stable suffix for this session

  const [form, setForm] = useState({
    wpJobOpeningId: "",
    title: "",
    department: "",
    location: "",
    description: "",
    requirements: "",
    closesAt: "",
    status: "OPEN",
  });

  // Auto-generate the ID whenever the title changes
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      wpJobOpeningId: generateJobId(prev.title, suffixRef.current),
    }));
  }, [form.title]);

  function regenerateSuffix() {
    suffixRef.current = randomSuffix();
    setForm((prev) => ({
      ...prev,
      wpJobOpeningId: generateJobId(prev.title, suffixRef.current),
    }));
  }

  function copyId() {
    navigator.clipboard.writeText(form.wpJobOpeningId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create job");
        return;
      }
      router.push("/jobs");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/10 h-10 text-sm";
  const labelClass = "text-xs font-medium text-zinc-400";

  return (
    <div className="max-w-2xl space-y-7">
      {/* Header */}
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-semibold text-white">New Job Opening</h1>
        <p className="text-zinc-500 text-sm mt-1">Create a position to start receiving applications.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Basic Info</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title" className={labelClass}>Job Title <span className="text-[#c9a84c]">*</span></Label>
            <Input id="title" name="title" value={form.title} onChange={handleChange} required
              placeholder="e.g. Business Setup Consultant" className={inputClass} />
          </div>

          {/* Auto-generated WP Job ID */}
          <div className="space-y-1.5">
            <Label className={labelClass}>
              WordPress Job ID
              <span className="ml-2 text-zinc-600 font-normal normal-case tracking-normal">— auto-generated from title</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 bg-[#0d0d0d] border border-[#c9a84c]/30 rounded-lg px-3 h-10">
                <span className="text-[#c9a84c] text-xs font-mono flex-1 truncate">
                  {form.wpJobOpeningId || <span className="text-zinc-700 italic">type a title above…</span>}
                </span>
              </div>
              <button type="button" onClick={copyId} title="Copy ID"
                className="h-10 px-3 rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/40 text-zinc-400 hover:text-[#c9a84c] transition-all flex items-center gap-1.5 text-xs shrink-0">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button type="button" onClick={regenerateSuffix} title="Regenerate ID"
                className="h-10 w-10 rounded-lg border border-white/[0.08] hover:border-white/[0.16] text-zinc-500 hover:text-zinc-300 transition-all flex items-center justify-center shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-600">
              Paste this value into the hidden <code className="text-zinc-500">job_opening_id</code> field in your Elementor form.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="department" className={labelClass}>Department</Label>
              <Input id="department" name="department" value={form.department} onChange={handleChange}
                placeholder="e.g. Sales" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className={labelClass}>Location</Label>
              <Input id="location" name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Dubai, UAE" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v ?? "OPEN" }))}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161616] border-white/[0.08]">
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closesAt" className={labelClass}>Closes At</Label>
              <Input id="closesAt" name="closesAt" type="date" value={form.closesAt}
                onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="description" className={labelClass}>
              Job Description <span className="text-[#c9a84c]">*</span>
            </Label>
            <Textarea id="description" name="description" value={form.description}
              onChange={handleChange} required rows={5}
              placeholder="Describe the role, responsibilities, and what the candidate will be doing…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirements" className={labelClass}>
              Requirements <span className="text-[#c9a84c]">*</span>
            </Label>
            <Textarea id="requirements" name="requirements" value={form.requirements}
              onChange={handleChange} required rows={5}
              placeholder="List the skills, experience, and qualifications required…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none" />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] disabled:opacity-50 text-black text-sm font-semibold transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Creating…" : "Create Job Opening"}
          </button>
          <Link href="/jobs" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-2">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
