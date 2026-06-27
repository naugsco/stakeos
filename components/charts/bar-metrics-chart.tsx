"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

interface ChartData {
  label: string;
  value: number;
}

export function BarMetricsChart({
  data,
  href,
  linkLabel = "Open member list",
  title = "Bar chart"
}: {
  data: ChartData[];
  href?: string;
  linkLabel?: string;
  title?: string;
}) {
  return (
    <ChartFrame
      title={title}
      href={href}
      linkLabel={linkLabel}
      isEmpty={data.length === 0}
      srTable={
        <SrDataTable
          caption={title}
          columns={["Category", "Value"]}
          rows={data.map((row) => [row.label, row.value])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis dataKey="label" tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
          <Bar dataKey="value" fill={CHART_COLORS.teal} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
