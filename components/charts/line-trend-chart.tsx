"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, GRID_STROKE, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

interface DataRow {
  month: string;
  sustained?: number;
  released?: number;
  converts?: number;
}

interface Props {
  data: DataRow[];
  variant: "turnover" | "converts";
  title?: string;
}

export function LineTrendChart({ data, variant, title }: Props) {
  const chartTitle = title ?? (variant === "turnover" ? "Leadership turnover trend" : "Convert trend");
  const columns =
    variant === "turnover" ? ["Month", "Sustained", "Released"] : ["Month", "Converts"];
  const rows = data.map((row) =>
    variant === "turnover"
      ? [row.month, row.sustained ?? 0, row.released ?? 0]
      : [row.month, row.converts ?? 0]
  );

  return (
    <ChartFrame
      title={chartTitle}
      isEmpty={data.length === 0}
      srTable={<SrDataTable caption={chartTitle} columns={columns} rows={rows} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} />
          <XAxis dataKey="month" tick={AXIS_TICK} />
          <YAxis tick={AXIS_TICK} />
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
          <Legend />
          {variant === "turnover" ? (
            <>
              <Line type="monotone" dataKey="sustained" stroke={CHART_COLORS.teal} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="released" stroke="#dc2626" strokeWidth={2} dot={false} />
            </>
          ) : (
            <Line type="monotone" dataKey="converts" stroke={CHART_COLORS.blue} strokeWidth={3} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
