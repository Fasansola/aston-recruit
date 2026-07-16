"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MarkdownEditorProps {
  id: string;
  name: string;
  label: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

export default function MarkdownEditor({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  required,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-zinc-400">
          {label}
        </Label>
        <div className="flex items-center gap-0.5 bg-[#0d0d0d] border border-white/[0.06] rounded-md p-0.5">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-2.5 py-1 text-[11px] rounded transition-all font-medium ${
              tab === "write"
                ? "bg-white/[0.08] text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-2.5 py-1 text-[11px] rounded transition-all font-medium ${
              tab === "preview"
                ? "bg-white/[0.08] text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          rows={rows}
          placeholder={placeholder}
          className="bg-[#0d0d0d] border-white/[0.08] text-zinc-200 placeholder:text-zinc-700 focus:border-[#c9a84c]/50 text-sm resize-none font-mono"
        />
      ) : (
        <div
          className={`min-h-[${rows * 24}px] rounded-md border border-white/[0.08] bg-[#0d0d0d] px-3 py-2 prose prose-sm prose-invert max-w-none
            prose-headings:text-zinc-200 prose-headings:font-semibold
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-strong:text-zinc-100
            prose-em:text-zinc-300
            prose-ul:text-zinc-300 prose-ol:text-zinc-300
            prose-li:marker:text-zinc-500
            prose-code:text-[#c9a84c] prose-code:bg-white/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-[#c9a84c]/40 prose-blockquote:text-zinc-400
            prose-hr:border-white/[0.08]
            prose-a:text-[#c9a84c]`}
        >
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-zinc-700 italic not-prose text-sm">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <p className="text-[11px] text-zinc-700">
        Supports Markdown — **bold**, *italic*, `code`, bullet lists, headings
      </p>
    </div>
  );
}
