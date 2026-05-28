"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Copy, Check, RefreshCw, Sparkles, Globe, ExternalLink, AlertCircle } from "lucide-react";
import type { WpFieldOptions } from "@/app/api/jobs/wp-fields/route";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wpFields, setWpFields] = useState<WpFieldOptions>({
    job_location: [],
    in_office__remote: [],
    job_type: [],
    wages: [],
  });
  const [wpWarning, setWpWarning] = useState<string | null>(null);
  const [wpPostUrl, setWpPostUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishToWordPress, setPublishToWordPress] = useState(false);
  const [aiNotes, setAiNotes] = useState("");
  const suffixRef = useRef(randomSuffix());

  const [form, setForm] = useState({
    wpJobOpeningId: "",
    title: "",
    department: "",
    location: "",
    description: "",
    requirements: "",
    shortDescription: "",
    wages: "",
    workType: "",
    jobType: "",
    closesAt: "",
    status: "OPEN",
  });

  // Load WP ACF field options on mount
  useEffect(() => {
    fetch("/api/jobs/wp-fields")
      .then((r) => r.json())
      .then((data: WpFieldOptions) => setWpFields(data))
      .catch(() => {}); // silently degrade
  }, []);

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

  async function handleGenerate() {
    if (!form.title) {
      setError("Enter a job title before generating.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          department: form.department || undefined,
          location: form.location || undefined,
          notes: aiNotes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "AI generation failed");
      }
      const { description, requirements, shortDescription } = await res.json();
      setForm((prev) => ({ ...prev, description, requirements, shortDescription: shortDescription ?? prev.shortDescription }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setWpWarning(null);
    setWpPostUrl(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : undefined,
          publishToWordPress,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create job");
        return;
      }
      const data = await res.json();
      if (data.wpWarning) {
        // Job created but WP publish failed — show warning then redirect
        setWpWarning(data.wpWarning);
        setTimeout(() => router.push("/jobs"), 4000);
        return;
      }
      if (data.wpPostUrl) {
        setWpPostUrl(data.wpPostUrl);
        setTimeout(() => router.push("/jobs"), 3000);
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
            {/* Salary — free text if WP field has no enum, otherwise a select */}
            <div className="space-y-1.5">
              <Label htmlFor="wages" className={labelClass}>Salary / Wages</Label>
              {wpFields.wages.length > 0 ? (
                <Select value={form.wages} onValueChange={(v) => setForm((p) => ({ ...p, wages: v ?? "" }))}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent className="bg-[#161616] border-white/[0.08]">
                    {wpFields.wages.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input id="wages" name="wages" value={form.wages} onChange={handleChange}
                  placeholder="e.g. Negotiable, AED 15,000/month" className={inputClass} />
              )}
            </div>

            {/* Job Type — driven by WP ACF enum */}
            <div className="space-y-1.5">
              <Label className={labelClass}>
                Job Type
                {wpFields.job_type.length > 0 && <span className="ml-1 text-[10px] text-zinc-600">(from WordPress)</span>}
              </Label>
              <Select value={form.jobType} onValueChange={(v) => setForm((p) => ({ ...p, jobType: v ?? "" }))}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent className="bg-[#161616] border-white/[0.08]">
                  {(wpFields.job_type.length > 0
                    ? wpFields.job_type
                    : ["Full-time", "Part-time", "Contract", "Freelance", "Internship"]
                  ).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Work Arrangement — driven by WP ACF enum */}
            <div className="space-y-1.5">
              <Label className={labelClass}>
                Work Arrangement
                {wpFields.in_office__remote.length > 0 && <span className="ml-1 text-[10px] text-zinc-600">(from WordPress)</span>}
              </Label>
              <Select value={form.workType} onValueChange={(v) => setForm((p) => ({ ...p, workType: v ?? "" }))}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent className="bg-[#161616] border-white/[0.08]">
                  {(wpFields.in_office__remote.length > 0
                    ? wpFields.in_office__remote
                    : ["In-office", "Remote", "Hybrid"]
                  ).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closesAt" className={labelClass}>Closes At</Label>
              <Input id="closesAt" name="closesAt" type="date" value={form.closesAt}
                onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Location — driven by WP ACF enum when available */}
          {wpFields.job_location.length > 0 && (
            <div className="space-y-1.5">
              <Label className={labelClass}>
                Office Location
                <span className="ml-1 text-[10px] text-zinc-600">(from WordPress — must match site options)</span>
              </Label>
              <Select value={form.location} onValueChange={(v) => setForm((p) => ({ ...p, location: v ?? "" }))}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent className="bg-[#161616] border-white/[0.08]">
                  {wpFields.job_location.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.location && !wpFields.job_location.includes(form.location) && (
                <p className="flex items-center gap-1 text-[11px] text-yellow-500">
                  <AlertCircle className="h-3 w-3" />
                  Current value &quot;{form.location}&quot; is not a valid WordPress option — select one above.
                </p>
              )}
            </div>
          )}

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
          </div>
        </div>

        {/* AI Generation */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role Details</h2>
              <p className="text-[11px] text-zinc-600 mt-0.5">Write manually or generate with AI</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !form.title}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 text-[#c9a84c] text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                : <><Sparkles className="h-3.5 w-3.5" /> Generate with AI</>
              }
            </button>
          </div>

          {/* AI notes / hints */}
          <div className="space-y-1.5">
            <Label className={labelClass}>
              AI Hints <span className="text-zinc-600 font-normal">(optional — the more detail, the better the output)</span>
            </Label>
            <Input
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="e.g. 3+ years UAE experience, Arabic speaker preferred, DIFC knowledge"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shortDescription" className={labelClass}>
              Short Description
              <span className="ml-2 text-zinc-600 font-normal">— shown on listing cards (auto-filled by AI)</span>
            </Label>
            <Textarea id="shortDescription" name="shortDescription" value={form.shortDescription}
              onChange={handleChange} rows={2}
              placeholder="1-2 sentence summary shown on the job listing card on the website…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className={labelClass}>
              Job Description <span className="text-[#c9a84c]">*</span>
            </Label>
            <Textarea id="description" name="description" value={form.description}
              onChange={handleChange} required rows={6}
              placeholder="Describe the role, responsibilities, and what the candidate will be doing…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirements" className={labelClass}>
              Requirements <span className="text-[#c9a84c]">*</span>
            </Label>
            <Textarea id="requirements" name="requirements" value={form.requirements}
              onChange={handleChange} required rows={6}
              placeholder="List the skills, experience, and qualifications required…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none" />
          </div>
        </div>

        {/* WordPress publish toggle */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={publishToWordPress}
                onChange={(e) => setPublishToWordPress(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 rounded-full bg-zinc-800 peer-checked:bg-[#c9a84c] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">Publish to WordPress</span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Creates a post under the <code className="text-zinc-500">career</code> custom post type on aston.ae simultaneously.
                Requires <code className="text-zinc-500">WORDPRESS_URL</code>, <code className="text-zinc-500">WORDPRESS_USERNAME</code>, and <code className="text-zinc-500">WORDPRESS_APP_PASSWORD</code> to be set in Vercel.
              </p>
            </div>
          </label>
        </div>

        {/* Feedback */}
        {error && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {wpWarning && (
          <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/10 px-4 py-3">
            <p className="text-yellow-400 text-sm font-medium">Job saved — WordPress publish failed</p>
            <p className="text-yellow-400/70 text-xs mt-1">{wpWarning}</p>
            <p className="text-zinc-600 text-xs mt-1">Redirecting to jobs list…</p>
          </div>
        )}

        {wpPostUrl && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Published to WordPress!</p>
              <p className="text-zinc-600 text-xs mt-0.5">Redirecting to jobs list…</p>
            </div>
            <a href={wpPostUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
              View post <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] hover:bg-[#b8952f] disabled:opacity-50 text-black text-sm font-semibold transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading
              ? publishToWordPress ? "Creating & Publishing…" : "Creating…"
              : publishToWordPress ? "Create & Publish to WordPress" : "Create Job Opening"
            }
          </button>
          <Link href="/jobs" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-2">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
