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

interface DataRow {
  month: string;
  sustained?: number;
  released?: number;
  converts?: number;
}

interface Props {
  data: DataRow[];
  variant: "turnover" | "converts";
}

export function LineTrendChart({ data, variant }: Props) {
  return (
    <div className="h-80 w-full rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 6" stroke="#cbd5e1" />
          <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              background: "#fffef8",
              boxShadow: "0 4px 18px rgba(15,23,42,0.08)"
            }}
          />
          <Legend />
          {variant === "turnover" ? (
            <>
              <Line type="monotone" dataKey="sustained" stroke="#0f766e" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="released" stroke="#dc2626" strokeWidth={2} dot={false} />
            </>
          ) : (
            <Line type="monotone" dataKey="converts" stroke="#1d4ed8" strokeWidth={3} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
