"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIRecommendation } from "@prisma/client";
import { CheckCircle, XCircle, AlertTriangle, Brain } from "lucide-react";

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

const RECOMMENDATION_CONFIG: Record<
  AIRecommendation,
  { label: string; className: string }
> = {
  STRONG_YES: {
    label: "Strong Yes",
    className: "bg-green-900 text-green-300 border-green-700",
  },
  YES: {
    label: "Yes",
    className: "bg-teal-900 text-teal-300 border-teal-700",
  },
  MAYBE: {
    label: "Maybe",
    className: "bg-yellow-900 text-yellow-300 border-yellow-700",
  },
  NO: {
    label: "No",
    className: "bg-orange-900 text-orange-300 border-orange-700",
  },
  STRONG_NO: {
    label: "Strong No",
    className: "bg-red-900 text-red-300 border-red-700",
  },
};

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 8 ? "#4ade80" : score >= 5 ? "#facc15" : "#f87171";
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 10) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute text-lg font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

interface AiScoreCardProps {
  evaluation: AIEvaluation;
}

export default function AiScoreCard({ evaluation }: AiScoreCardProps) {
  const rec = RECOMMENDATION_CONFIG[evaluation.recommendation];

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Brain className="h-4 w-4 text-[#c9a84c]" />
        <CardTitle className="text-white text-base">AI Evaluation</CardTitle>
        <span className="ml-auto text-xs text-zinc-500">
          {new Date(evaluation.evaluatedAt).toLocaleDateString()}
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score + recommendation */}
        <div className="flex items-center gap-5">
          <div className="text-center">
            <ScoreCircle score={evaluation.score} />
            <p className="text-xs text-zinc-500 mt-1">Overall</p>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <Badge variant="outline" className={rec.className}>
                {rec.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Skills Match</span>
                <span
                  className={`ml-2 font-bold ${
                    evaluation.skillsMatchScore >= 8
                      ? "text-green-400"
                      : evaluation.skillsMatchScore >= 5
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {evaluation.skillsMatchScore}/10
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Experience</span>
                <span
                  className={`ml-2 font-bold ${
                    evaluation.experienceMatchScore >= 8
                      ? "text-green-400"
                      : evaluation.experienceMatchScore >= 5
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {evaluation.experienceMatchScore}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-zinc-300 leading-relaxed">{evaluation.summary}</p>

        {/* Strengths */}
        {evaluation.strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Strengths
            </p>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {evaluation.weaknesses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Weaknesses
            </p>
            <ul className="space-y-1">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <XCircle className="h-3.5 w-3.5 text-orange-400 mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red flags */}
        {evaluation.redFlags.length > 0 && (
          <div className="rounded-md bg-red-950 border border-red-800 p-3">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Red Flags
            </p>
            <ul className="space-y-1">
              {evaluation.redFlags.map((f, i) => (
                <li key={i} className="text-sm text-red-300">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
