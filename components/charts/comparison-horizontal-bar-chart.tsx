"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

interface ComparativeChartData {
  label: string;
  actual: number;
  potential: number;
}

interface ComparisonHorizontalBarChartProps {
  data: ComparativeChartData[];
  href?: string;
  linkLabel?: string;
  actualLabel?: string;
  potentialLabel?: string;
  title?: string;
}

export function ComparisonHorizontalBarChart({
  data,
  href,
  linkLabel = "Open member list",
  actualLabel = "Actual",
  potentialLabel = "Potential",
  title = "Comparison chart"
}: ComparisonHorizontalBarChartProps) {
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
          columns={["Category", actualLabel, potentialLabel]}
          rows={data.map((row) => [row.label, row.actual, row.potential])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 44 }} barCategoryGap="20%">
          <CartesianGrid horizontal={false} strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis type="number" tick={AXIS_TICK} />
          <YAxis type="category" dataKey="label" width={180} tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
          <Legend />
          <Bar dataKey="actual" name={actualLabel} fill={CHART_COLORS.teal} radius={[0, 8, 8, 0]} />
          <Bar dataKey="potential" name={potentialLabel} fill={CHART_COLORS.amber} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
