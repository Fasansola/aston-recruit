"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, ExternalLink, RefreshCw, EyeOff } from "lucide-react";

interface WpPublishButtonProps {
  jobId: string;
  currentWpPostId?: number | null;
  currentWpPostUrl?: string | null;
}

type WpState = "published" | "unlisted" | "none";

function deriveState(postId: number | null | undefined, postUrl: string | null | undefined): WpState {
  if (postId && postUrl) return "published";
  if (postId && !postUrl) return "unlisted";
  return "none";
}

export default function WpPublishButton({
  jobId,
  currentWpPostId,
  currentWpPostUrl,
}: WpPublishButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<WpState>(deriveState(currentWpPostId, currentWpPostUrl));
  const [publishedUrl, setPublishedUrl] = useState<string | null>(currentWpPostUrl ?? null);
  const [loading, setLoading] = useState<"publish" | "unlist" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setLoading("publish");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/publish-wp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Publishing failed"); return; }
      setPublishedUrl(data.wpPostUrl);
      setState("published");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleUnlist() {
    setLoading("unlist");
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/unpublish-wp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Unlist failed"); return; }
      setPublishedUrl(null);
      setState("unlisted");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (state === "published") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-green-400 font-medium">Published on WordPress</span>
        </div>

        <a
          href={publishedUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] hover:border-green-500/30 text-xs text-zinc-400 hover:text-green-400 transition-all"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          View live post
        </a>

        <div className="flex gap-2">
          <button
            onClick={handlePublish}
            disabled={!!loading}
            title="Re-publish (updates existing post)"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/[0.16] text-xs text-zinc-500 hover:text-zinc-300 transition-all disabled:opacity-50"
          >
            {loading === "publish"
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <RefreshCw className="h-3 w-3" />}
            Re-publish
          </button>
          <button
            onClick={handleUnlist}
            disabled={!!loading}
            title="Set post to draft — removes it from the public site"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30 text-xs text-amber-500/70 hover:text-amber-400 transition-all disabled:opacity-50"
          >
            {loading === "unlist"
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <EyeOff className="h-3 w-3" />}
            Unlist
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (state === "unlisted") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[11px] text-amber-400 font-medium">Unlisted on WordPress</span>
        </div>
        <p className="text-[11px] text-zinc-600">Post exists as a draft — not visible to the public.</p>
        <button
          onClick={handlePublish}
          disabled={!!loading}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 text-[#c9a84c] text-xs font-medium transition-all disabled:opacity-50"
        >
          {loading === "publish"
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</>
            : <><Globe className="h-3.5 w-3.5" /> Re-publish to WordPress</>}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePublish}
        disabled={!!loading}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 text-[#c9a84c] text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === "publish"
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</>
          : <><Globe className="h-3.5 w-3.5" /> Publish to WordPress</>}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
