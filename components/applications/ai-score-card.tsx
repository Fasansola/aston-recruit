"use client";

import { AIRecommendation } from "@prisma/client";
import { CheckCircle2, XCircle, AlertTriangle, Sparkles } from "lucide-react";

interface AIEvaluation {
  score: number;
  recommendation: AIRecommendation;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillsMatchScore: number;
  experienceMatchScore: number;
  redFlags: string[];
  evaluatedAt: Date | string;
}

const REC_CONFIG: Record<AIRecommendation, { label: string; bg: string; text: string; border: string }> = {
  STRONG_YES: { label: "Strong Yes", bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
  YES:        { label: "Yes",        bg: "bg-teal-500/10",   text: "text-teal-400",   border: "border-teal-500/20" },
  MAYBE:      { label: "Maybe",      bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20" },
  NO:         { label: "No",         bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  STRONG_NO:  { label: "Strong No",  bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
};

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = score >= 8 ? "#4ade80" : score >= 5 ? "#fbbf24" : "#f87171";
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f1f1f" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function SubScore({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "text-green-400" : score >= 5 ? "text-amber-400" : "text-red-400";
  const bg = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${color}`}>{score}/10</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}/70 transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}

export default function AiScoreCard({ evaluation }: { evaluation: AIEvaluation }) {
  const rec = REC_CONFIG[evaluation.recommendation];

  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-[#c9a84c]" />
        </div>
        <h3 className="text-sm font-semibold text-white">AI Evaluation</h3>
        <span className="ml-auto text-xs text-zinc-600">
          {new Date(evaluation.evaluatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Score row */}
        <div className="flex items-center gap-6">
          <div className="text-center shrink-0">
            <ScoreRing score={evaluation.score} />
            <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">Overall</p>
          </div>
          <div className="flex-1 space-y-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${rec.bg} ${rec.text} ${rec.border}`}>
              {rec.label}
            </span>
            <SubScore label="Skills Match" score={evaluation.skillsMatchScore} />
            <SubScore label="Experience" score={evaluation.experienceMatchScore} />
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-zinc-400 leading-relaxed">{evaluation.summary}</p>

        {/* Strengths + Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {evaluation.strengths.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Strengths</p>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.weaknesses.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Weaknesses</p>
              <ul className="space-y-2">
                {evaluation.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <XCircle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Red flags */}
        {evaluation.redFlags.length > 0 && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-2">
              <AlertTriangle className="h-3 w-3" /> Red Flags
            </p>
            <ul className="space-y-1.5">
              {evaluation.redFlags.map((f, i) => (
                <li key={i} className="text-xs text-red-300/80">{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
