"use client";

import { useState } from "react";
import { FileText, EyeOff } from "lucide-react";

interface CvPreviewProps {
  cvUrl: string;
}

export default function CvPreview({ cvUrl }: CvPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/[0.08] hover:border-[#c9a84c]/30 px-3 py-2.5 text-sm text-zinc-400 hover:text-[#c9a84c] transition-all"
      >
        {isOpen ? (
          <>
            <EyeOff className="h-4 w-4" />
            Hide Preview
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Preview CV
          </>
        )}
      </button>

      {isOpen && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <iframe
            src={cvUrl}
            title="CV Preview"
            className="w-full"
            style={{ height: "600px", background: "#0a0a0a" }}
            onError={() => {
              /* handled via fallback below */
            }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <FileText className="h-8 w-8 text-zinc-600" />
              <p className="text-zinc-500 text-sm">
                Unable to display the PDF inline.
              </p>
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#c9a84c] hover:text-[#b8952f] underline"
              >
                Open in new tab instead
              </a>
            </div>
          </iframe>
        </div>
      )}
    </div>
  );
}
