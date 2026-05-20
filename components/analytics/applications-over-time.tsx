"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface ApplicationsOverTimeProps {
  data: DataPoint[];
}

export default function ApplicationsOverTime({
  data,
}: ApplicationsOverTimeProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
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
          cursor={{ stroke: "#c9a84c", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#c9a84c"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#c9a84c", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
