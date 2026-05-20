"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface JobFormData {
  wpJobOpeningId: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  closesAt: string;
  status: string;
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<JobFormData>({
    wpJobOpeningId: "",
    title: "",
    department: "",
    location: "",
    description: "",
    requirements: "",
    closesAt: "",
    status: "OPEN",
  });

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch job");
        const data = await res.json();
        setForm({
          wpJobOpeningId: data.wpJobOpeningId ?? "",
          title: data.title ?? "",
          department: data.department ?? "",
          location: data.location ?? "",
          description: data.description ?? "",
          requirements: data.requirements ?? "",
          closesAt: data.closesAt
            ? new Date(data.closesAt).toISOString().split("T")[0]
            : "",
          status: data.status ?? "OPEN",
        });
      } catch {
        setError("Failed to load job data.");
      } finally {
        setIsFetching(false);
      }
    }
    fetchJob();
  }, [jobId]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          department: form.department || undefined,
          location: form.location || undefined,
          description: form.description,
          requirements: form.requirements,
          status: form.status,
          closesAt: form.closesAt
            ? new Date(form.closesAt).toISOString()
            : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update job");
        return;
      }
      router.push(`/jobs/${jobId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/10 h-10 text-sm";
  const labelClass = "text-xs font-medium text-zinc-400";

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 text-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-7">
      {/* Header */}
      <div>
        <Link
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Job
        </Link>
        <h1 className="text-2xl font-semibold text-white">Edit Job Opening</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Update the details for this position.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Basic Info
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className={labelClass}>
                Job Title <span className="text-[#c9a84c]">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Business Setup Consultant"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wpJobOpeningId" className={labelClass}>
                WP Job ID <span className="text-[#c9a84c]">*</span>
              </Label>
              <Input
                id="wpJobOpeningId"
                name="wpJobOpeningId"
                value={form.wpJobOpeningId}
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`}
                title="WP Job ID cannot be changed after creation"
              />
              <p className="text-[10px] text-zinc-700">Cannot be changed after creation</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="department" className={labelClass}>
                Department
              </Label>
              <Input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Sales"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className={labelClass}>
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Dubai, UAE"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClass}>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v ?? "OPEN" }))
                }
              >
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
              <Label htmlFor="closesAt" className={labelClass}>
                Closes At
              </Label>
              <Input
                id="closesAt"
                name="closesAt"
                type="date"
                value={form.closesAt}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Role Details
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="description" className={labelClass}>
              Job Description <span className="text-[#c9a84c]">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Describe the role, responsibilities, and what the candidate will be doing…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requirements" className={labelClass}>
              Requirements <span className="text-[#c9a84c]">*</span>
            </Label>
            <Textarea
              id="requirements"
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              required
              rows={5}
              placeholder="List the skills, experience, and qualifications required…"
              className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none"
            />
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
            {isLoading ? "Saving…" : "Save Changes"}
          </button>
          <Link
            href={`/jobs/${jobId}`}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
