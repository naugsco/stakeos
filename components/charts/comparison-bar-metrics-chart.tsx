"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

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
  title?: string;
}

export function ComparisonBarMetricsChart({
  data,
  href,
  linkLabel = "Open member list",
  actualLabel = "Actual",
  potentialLabel = "Potential",
  title = "Comparison bar chart"
}: ComparisonBarMetricsChartProps) {
  return (
    <ChartFrame
      title={title}
      href={href}
      linkLabel={linkLabel}
      isEmpty={data.length === 0}
      srTable={
        <SrDataTable
          caption={title}
          columns={["Category", actualLabel, potentialLabel]}
          rows={data.map((row) => [row.label, row.actual, row.potential])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis dataKey="label" tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
          <Legend />
          <Bar dataKey="actual" name={actualLabel} fill={CHART_COLORS.teal} radius={[8, 8, 0, 0]} />
          <Bar dataKey="potential" name={potentialLabel} fill={CHART_COLORS.amber} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
