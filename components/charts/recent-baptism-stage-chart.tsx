"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RecentBaptismPathRow {
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  ministeringAssigned: boolean;
  assignedAsMinister: boolean | null;
  assignedAsMinisterLabel: string;
}

interface StageChartRow {
  stage: string;
  positiveLabel: string;
  positiveCount: number;
  remainingLabel: string;
  remainingCount: number;
  positivePct: number;
}

const isActiveRecommend = (status: string | null) => Boolean(status && /^active/i.test(status));

export function RecentBaptismStageChart({
  rows,
  href = "/reports#recent-baptism-path-list",
  linkLabel = "Open recent baptism cohort"
}: {
  rows: RecentBaptismPathRow[];
  href?: string;
  linkLabel?: string;
}) {
  const total = rows.length;
  const stageData: StageChartRow[] = [
    {
      stage: "Active Recommend",
      positiveLabel: "Active",
      positiveCount: rows.filter((row) => isActiveRecommend(row.templeRecommendStatus)).length,
      remainingLabel: "Not Active",
      remainingCount: rows.filter((row) => !isActiveRecommend(row.templeRecommendStatus)).length,
      positivePct: 0
    },
    {
      stage: "Current Calling",
      positiveLabel: "Has Calling",
      positiveCount: rows.filter((row) => row.hasCurrentCalling).length,
      remainingLabel: "No Calling",
      remainingCount: rows.filter((row) => !row.hasCurrentCalling).length,
      positivePct: 0
    },
    {
      stage: "Assigned Ministers",
      positiveLabel: "Assigned",
      positiveCount: rows.filter((row) => row.ministeringAssigned).length,
      remainingLabel: "Not Assigned",
      remainingCount: rows.filter((row) => !row.ministeringAssigned).length,
      positivePct: 0
    },
    {
      stage: "Assigned as Minister",
      positiveLabel: "Assigned",
      positiveCount: rows.filter((row) => row.assignedAsMinister === true).length,
      remainingLabel: "Not Assigned",
      remainingCount: rows.filter((row) => row.assignedAsMinister !== true).length,
      positivePct: 0
    }
  ].map((row) => ({
    ...row,
    positivePct: total > 0 ? Math.round((row.positiveCount / total) * 100) : 0
  }));

  return (
    <div className="relative h-[24rem] w-full">
      <Link
        href={href}
        className="absolute right-0 top-0 z-10 rounded-lg border border-amber-300 bg-white/95 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-white"
      >
        {linkLabel}
      </Link>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={stageData}
          layout="vertical"
          margin={{ top: 10, right: 24, bottom: 8, left: 32 }}
          barCategoryGap="18%"
          barGap={0}
        >
          <CartesianGrid horizontal={false} strokeDasharray="2 8" stroke="#dbe3ef" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} domain={[0, total || 1]} />
          <YAxis type="category" dataKey="stage" width={140} tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string, item) => {
              const row = item.payload as StageChartRow;
              if (name === "positiveCount") {
                return [`${value} (${row.positivePct}%)`, row.positiveLabel];
              }
              return [String(value), row.remainingLabel];
            }}
            labelFormatter={(label) => `Stage: ${label}`}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              background: "#fffef8",
              boxShadow: "0 4px 18px rgba(15,23,42,0.08)"
            }}
          />
          <Legend />
          <Bar dataKey="positiveCount" name="Meets Stage" stackId="stage" fill="#0f766e" radius={[10, 0, 0, 10]} barSize={22} />
          <Bar dataKey="remainingCount" name="Not Yet" stackId="stage" fill="#cbd5e1" radius={[0, 10, 10, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
