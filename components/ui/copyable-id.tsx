"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-1 flex items-center gap-2 bg-[#0d0d0d] border border-[#c9a84c]/25 rounded-lg px-3 py-2">
      <span className="text-[#c9a84c] font-mono text-xs flex-1 break-all">{value}</span>
      <button
        onClick={copy}
        title="Copy to clipboard"
        className="shrink-0 flex items-center gap-1 text-[11px] text-zinc-500 hover:text-[#c9a84c] transition-colors"
      >
        {copied
          ? <><Check className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied!</span></>
          : <><Copy className="h-3 w-3" /><span>Copy</span></>
        }
      </button>
    </div>
  );
}
