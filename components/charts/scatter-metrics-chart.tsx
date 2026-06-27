"use client";

import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, GRID_STROKE, SCATTER_PALETTE } from "@/lib/chartTheme";

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
  title?: string;
}

const getColorForLabel = (label: string) => {
  let hash = 0;
  for (const char of label) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return SCATTER_PALETTE[hash % SCATTER_PALETTE.length];
};

export function ScatterMetricsChart({
  data,
  href,
  linkLabel = "Open detail list",
  title = "Readiness scatter plot"
}: ScatterMetricsChartProps) {
  return (
    <ChartFrame
      title={title}
      href={href}
      linkLabel={linkLabel}
      isEmpty={data.length === 0}
      srTable={
        <SrDataTable
          caption={title}
          columns={["Unit", "Class participation %", "Weighted readiness %", "Active recommend %"]}
          rows={data.map((point) => [point.label, point.x, point.y, point.recommendPct ?? point.z])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis
            type="number"
            dataKey="x"
            name="Class Participation %"
            tick={AXIS_TICK}
            domain={[0, 100]}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Weighted Readiness"
            tick={AXIS_TICK}
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
    </ChartFrame>
  );
}
