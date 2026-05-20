"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NoteFormProps {
  applicationId: string;
}

export default function NoteForm({ applicationId }: NoteFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), isPrivate }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add note");
        return;
      }

      setBody("");
      setIsPrivate(false);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add an internal note…"
        rows={3}
        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-[#c9a84c] focus:ring-[#c9a84c]"
          />
          <Label className="text-zinc-400 text-sm cursor-pointer">
            Private (only visible to you)
          </Label>
        </label>

        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !body.trim()}
          className="bg-[#c9a84c] hover:bg-[#b8952f] text-black font-semibold"
        >
          {isLoading ? "Adding…" : "Add Note"}
        </Button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
