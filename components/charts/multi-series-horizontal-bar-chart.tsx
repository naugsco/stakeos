"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

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
  linkLabel = "Open member list",
  title = "Distribution by group"
}: {
  data: MultiSeriesHorizontalBarRow[];
  href?: string;
  linkLabel?: string;
  title?: string;
}) {
  const chartHeight = Math.max(720, data.length * 42);

  return (
    <ChartFrame
      title={title}
      href={href}
      linkLabel={linkLabel}
      heightClass=""
      isEmpty={data.length === 0}
      srTable={
        <SrDataTable
          caption={title}
          columns={["Row", "Shared", "Men", "Women"]}
          rows={data
            .filter((row) => row.kind !== "section")
            .map((row) => [row.label, row.everyone ?? 0, row.men ?? 0, row.women ?? 0])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 48 }} barCategoryGap="22%">
          <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis type="number" tick={AXIS_TICK} />
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
                    fontSize={12}
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
            contentStyle={TOOLTIP_CONTENT_STYLE}
          />
          <Legend />
          <Bar dataKey="everyone" name="Shared" fill={CHART_COLORS.teal} radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={18} />
          <Bar dataKey="men" name="M" fill={CHART_COLORS.blue} radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={18} />
          <Bar dataKey="women" name="W" fill={CHART_COLORS.pink} radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
