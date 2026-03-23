"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface HorizontalChartData {
  label: string;
  value: number;
}

export function HorizontalBarMetricsChart({
  data,
  href,
  linkLabel = "Open member list"
}: {
  data: HorizontalChartData[];
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="relative h-[30rem] w-full rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      {href ? (
        <Link
          href={href}
          className="absolute right-3 top-3 z-10 rounded-md border border-amber-300 bg-white/95 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-white"
        >
          {linkLabel}
        </Link>
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 44 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke="#cbd5e1" />
          <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis type="category" dataKey="label" width={180} tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              background: "#fffef8",
              boxShadow: "0 4px 18px rgba(15,23,42,0.08)"
            }}
          />
          <Bar dataKey="value" fill="#0f766e" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
