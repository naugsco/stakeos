"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_CONTENT_STYLE } from "@/lib/chartTheme";

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
      stage: "Has Assigned Ministers",
      positiveLabel: "Assigned",
      positiveCount: rows.filter((row) => row.ministeringAssigned).length,
      remainingLabel: "Not Assigned",
      remainingCount: rows.filter((row) => !row.ministeringAssigned).length,
      positivePct: 0
    },
    {
      stage: "Serving as Minister",
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
    <ChartFrame
      title="Recent baptism progression by stage"
      href={href}
      linkLabel={linkLabel}
      heightClass="h-[24rem]"
      bare
      isEmpty={total === 0}
      srTable={
        <SrDataTable
          caption="Recent baptism progression by stage"
          columns={["Stage", "Meets stage", "Percent", "Not yet"]}
          rows={stageData.map((row) => [row.stage, row.positiveCount, `${row.positivePct}%`, row.remainingCount])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={stageData}
          layout="vertical"
          margin={{ top: 10, right: 24, bottom: 8, left: 32 }}
          barCategoryGap="18%"
          barGap={0}
        >
          <CartesianGrid horizontal={false} strokeDasharray="2 8" stroke="#dbe3ef" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} domain={[0, total || 1]} />
          <YAxis type="category" dataKey="stage" width={140} tick={AXIS_TICK} />
          <Tooltip
            formatter={(value: number, name: string, item) => {
              const row = item.payload as StageChartRow;
              if (name === "positiveCount") {
                return [`${value} (${row.positivePct}%)`, row.positiveLabel];
              }
              return [String(value), row.remainingLabel];
            }}
            labelFormatter={(label) => `Stage: ${label}`}
            contentStyle={TOOLTIP_CONTENT_STYLE}
          />
          <Legend />
          <Bar dataKey="positiveCount" name="Meets Stage" stackId="stage" fill={CHART_COLORS.teal} radius={[10, 0, 0, 10]} barSize={22} />
          <Bar dataKey="remainingCount" name="Not Yet" stackId="stage" fill={CHART_COLORS.neutral} radius={[0, 10, 10, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
