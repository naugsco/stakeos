"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

interface HorizontalChartData {
  label: string;
  value: number;
}

export function HorizontalBarMetricsChart({
  data,
  href,
  linkLabel = "Open member list",
  title = "Horizontal bar chart"
}: {
  data: HorizontalChartData[];
  href?: string;
  linkLabel?: string;
  title?: string;
}) {
  return (
    <ChartFrame
      title={title}
      href={href}
      linkLabel={linkLabel}
      heightClass="h-[30rem]"
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
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 44 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis type="number" tick={AXIS_TICK} />
          <YAxis type="category" dataKey="label" width={180} tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
          <Bar dataKey="value" fill={CHART_COLORS.teal} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
