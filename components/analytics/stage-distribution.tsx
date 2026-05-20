"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StageData {
  stage: string;
  count: number;
}

interface StageDistributionProps {
  data: StageData[];
}

const STAGE_COLORS: Record<string, string> = {
  APPLIED: "#71717a",
  SCREENING: "#3b82f6",
  SHORTLISTED: "#8b5cf6",
  INTERVIEW: "#f59e0b",
  OFFER: "#f97316",
  HIRED: "#22c55e",
  REJECTED: "#ef4444",
};

export default function StageDistribution({ data }: StageDistributionProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis
          dataKey="stage"
          tick={{ fill: "#71717a", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161616",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
            color: "#e4e4e7",
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(255,255,255,0.02)" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.stage}
              fill={STAGE_COLORS[entry.stage] ?? "#71717a"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
