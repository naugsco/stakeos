"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ComparativeChartData {
  label: string;
  actual: number;
  potential: number;
}

interface ComparisonBarMetricsChartProps {
  data: ComparativeChartData[];
  href?: string;
  linkLabel?: string;
  actualLabel?: string;
  potentialLabel?: string;
}

export function ComparisonBarMetricsChart({
  data,
  href,
  linkLabel = "Open member list",
  actualLabel = "Actual",
  potentialLabel = "Potential"
}: ComparisonBarMetricsChartProps) {
  return (
    <div className="relative h-80 w-full rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      {href ? (
        <Link
          href={href}
          className="absolute right-3 top-3 z-10 rounded-md border border-amber-300 bg-white/95 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-white"
        >
          {linkLabel}
        </Link>
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 6" stroke="#cbd5e1" />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              background: "#fffef8",
              boxShadow: "0 4px 18px rgba(15,23,42,0.08)"
            }}
          />
          <Legend />
          <Bar dataKey="actual" name={actualLabel} fill="#0f766e" radius={[8, 8, 0, 0]} />
          <Bar dataKey="potential" name={potentialLabel} fill="#b45309" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
