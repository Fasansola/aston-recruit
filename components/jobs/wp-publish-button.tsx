"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface WpPublishButtonProps {
  jobId: string;
  currentWpPostUrl?: string | null;
}

export default function WpPublishButton({ jobId, currentWpPostUrl }: WpPublishButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(currentWpPostUrl ?? null);

  async function handlePublish() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/publish-wp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Publishing failed");
        return;
      }
      setPublishedUrl(data.wpPostUrl);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (publishedUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[11px] text-green-400 font-medium">Published on WordPress</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] hover:border-green-500/30 text-xs text-zinc-400 hover:text-green-400 transition-all truncate"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            View live post
          </a>
          <button
            onClick={handlePublish}
            disabled={isLoading}
            title="Re-publish (updates existing post)"
            className="p-2 rounded-lg border border-white/[0.08] hover:border-white/[0.16] text-zinc-600 hover:text-zinc-300 transition-all disabled:opacity-50"
          >
            {isLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />
            }
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePublish}
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 text-[#c9a84c] text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</>
          : <><Globe className="h-3.5 w-3.5" /> Publish to WordPress</>
        }
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
