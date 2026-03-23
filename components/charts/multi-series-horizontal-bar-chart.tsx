"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MultiSeriesHorizontalBarRow {
  label: string;
  kind?: "section" | "data";
  everyone?: number;
  men?: number;
  women?: number;
}

export function MultiSeriesHorizontalBarChart({
  data,
  href,
  linkLabel = "Open member list"
}: {
  data: MultiSeriesHorizontalBarRow[];
  href?: string;
  linkLabel?: string;
}) {
  const chartHeight = Math.max(720, data.length * 42);

  return (
    <div className="relative w-full rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      {href ? (
        <Link
          href={href}
          className="absolute right-3 top-3 z-10 rounded-md border border-amber-300 bg-white/95 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-white"
        >
          {linkLabel}
        </Link>
      ) : null}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 48 }} barCategoryGap="22%">
          <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke="#cbd5e1" />
          <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={190}
            tick={(props) => {
              const { x, y, payload } = props;
              const row = data.find((entry) => entry.label === payload.value);
              const isSection = row?.kind === "section";
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill={isSection ? "#0f172a" : "#475569"}
                    fontSize={isSection ? 12 : 12}
                    fontWeight={isSection ? 700 : 500}
                  >
                    {payload.value}
                  </text>
                </g>
              );
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              const row = data.find((entry) => entry.label === label);
              if (!active || !payload?.length || row?.kind === "section") {
                return null;
              }
              if (!row) {
                return null;
              }

              return (
                <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg">
                  <div className="font-semibold text-slate-900">{label}</div>
                  {typeof row.everyone === "number" ? <div className="text-slate-600">Everyone / Shared: {row.everyone}</div> : null}
                  {typeof row.men === "number" ? <div className="text-slate-600">Men: {row.men}</div> : null}
                  {typeof row.women === "number" ? <div className="text-slate-600">Women: {row.women}</div> : null}
                </div>
              );
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              background: "#fffef8",
              boxShadow: "0 4px 18px rgba(15,23,42,0.08)"
            }}
          />
          <Legend />
          <Bar dataKey="everyone" name="Shared" fill="#0f766e" radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={18} />
          <Bar dataKey="men" name="M" fill="#1d4ed8" radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={18} />
          <Bar dataKey="women" name="W" fill="#d94674" radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
