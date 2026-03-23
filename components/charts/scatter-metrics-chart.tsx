"use client";

import Link from "next/link";
import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

interface ScatterPoint {
  label: string;
  x: number;
  y: number;
  z: number;
  classLabel?: string;
  recommendPct?: number;
  ministeringPct?: number;
}

interface ScatterMetricsChartProps {
  data: ScatterPoint[];
  href?: string;
  linkLabel?: string;
}

const palette = [
  "#0f766e",
  "#0369a1",
  "#b45309",
  "#be123c",
  "#4f46e5",
  "#15803d",
  "#7c2d12",
  "#1d4ed8",
  "#a21caf",
  "#0f766e",
  "#4338ca",
  "#c2410c"
];

const getColorForLabel = (label: string) => {
  let hash = 0;
  for (const char of label) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return palette[hash % palette.length];
};

export function ScatterMetricsChart({
  data,
  href,
  linkLabel = "Open detail list"
}: ScatterMetricsChartProps) {
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
        <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="#cbd5e1" />
          <XAxis
            type="number"
            dataKey="x"
            name="Class Participation %"
            tick={{ fill: "#475569", fontSize: 12 }}
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Weighted Readiness"
            tick={{ fill: "#475569", fontSize: 12 }}
            domain={[0, 100]}
          />
          <ZAxis type="number" dataKey="z" name="Active Recommend %" range={[120, 920]} />
          <Tooltip
            cursor={{ strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as ScatterPoint | undefined;
              if (!active || !point) {
                return null;
              }
              return (
                <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg">
                  <div className="font-semibold text-slate-900">{point.label}</div>
                  <div className="text-slate-600">{point.classLabel ?? "Class"} participation: {point.x}%</div>
                  <div className="text-slate-600">Weighted readiness: {point.y}%</div>
                  <div className="text-slate-600">Active recommend: {point.recommendPct ?? point.z}%</div>
                  <div className="text-slate-600">Assigned ministers: {point.ministeringPct ?? 0}%</div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((point) => (
              <Cell key={point.label} fill={getColorForLabel(point.label)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
