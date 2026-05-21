"use client";

import { useState } from "react";
import { FileText, EyeOff, ExternalLink } from "lucide-react";

interface CvPreviewProps {
  applicationId: string;
}

export default function CvPreview({ applicationId }: CvPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Server-side signed URL route — avoids exposing the raw private blob URL
  const signedUrl = `/api/cv/${applicationId}`;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 px-3 py-2.5 text-sm text-zinc-400 hover:text-[#c9a84c] transition-all"
      >
        {isOpen ? (
          <><EyeOff className="h-4 w-4" /> Hide Preview</>
        ) : (
          <><FileText className="h-4 w-4" /> Preview CV</>
        )}
      </button>

      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 px-3 py-2.5 text-sm text-zinc-400 hover:text-[#c9a84c] transition-all"
      >
        <ExternalLink className="h-4 w-4" />
        Open PDF
      </a>

      {isOpen && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <iframe
            src={signedUrl}
            title="CV Preview"
            className="w-full"
            style={{ height: "600px", background: "#0a0a0a" }}
          />
        </div>
      )}
    </div>
  );
}
