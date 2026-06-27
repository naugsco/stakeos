"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartFrame, SrDataTable } from "@/components/charts/chart-frame";
import { AXIS_TICK } from "@/lib/chartTheme";

interface MinisteringCoverageUnitPoint {
  unitName: string;
  eligibleCount: number;
  noAssignedCount: number;
  brothersOnlyCount: number;
  sistersOnlyCount: number;
  bothAssignedCount: number;
  assignedAnyPct: number;
  noAssignedPct: number;
}

export function MinisteringCoverageUnitChart({
  data,
  href,
  linkLabel = "Open ministering gaps",
  title = "Ministering coverage by unit"
}: {
  data: MinisteringCoverageUnitPoint[];
  href?: string;
  linkLabel?: string;
  title?: string;
}) {
  return (
    <ChartFrame
      title={title}
      href={href}
      linkLabel={linkLabel}
      heightClass="h-[28rem]"
      isEmpty={data.length === 0}
      srTable={
        <SrDataTable
          caption={title}
          columns={["Unit", "Eligible", "No ministers", "Brothers only", "Sisters only", "Both assigned"]}
          rows={data.map((row) => [
            row.unitName,
            row.eligibleCount,
            row.noAssignedCount,
            row.brothersOnlyCount,
            row.sistersOnlyCount,
            row.bothAssignedCount
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 20, bottom: 8, left: 32 }}
          barCategoryGap="18%"
          barGap={0}
        >
          <CartesianGrid horizontal={false} strokeDasharray="2 8" stroke="#dbe3ef" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis type="category" dataKey="unitName" width={160} tick={AXIS_TICK} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            content={({ active, payload, label }) => {
              const row = payload?.[0]?.payload as MinisteringCoverageUnitPoint | undefined;
              if (!active || !row) {
                return null;
              }

              return (
                <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg">
                  <div className="font-semibold text-slate-900">{label}</div>
                  <div className="text-slate-600">Eligible active members: {row.eligibleCount}</div>
                  <div className="text-slate-600">No assigned ministers: {row.noAssignedCount} ({row.noAssignedPct}%)</div>
                  <div className="text-slate-600">Brothers only: {row.brothersOnlyCount}</div>
                  <div className="text-slate-600">Sisters only: {row.sistersOnlyCount}</div>
                  <div className="text-slate-600">Both assigned: {row.bothAssignedCount}</div>
                  <div className="text-slate-600">Assigned any: {row.eligibleCount - row.noAssignedCount} ({row.assignedAnyPct}%)</div>
                </div>
              );
            }}
          />
          <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: "8px", fontSize: "12px" }} />
          <Bar
            dataKey="noAssignedCount"
            name="No Assigned"
            stackId="ministering"
            fill="#c2185b"
            radius={[10, 0, 0, 10]}
            stroke="none"
            barSize={20}
            isAnimationActive={false}
          />
          <Bar
            dataKey="brothersOnlyCount"
            name="Brothers Only"
            stackId="ministering"
            fill="#1572a1"
            stroke="none"
            barSize={20}
            isAnimationActive={false}
          />
          <Bar
            dataKey="sistersOnlyCount"
            name="Sisters Only"
            stackId="ministering"
            fill="#c26b18"
            stroke="none"
            barSize={20}
            isAnimationActive={false}
          />
          <Bar
            dataKey="bothAssignedCount"
            name="Both Assigned"
            stackId="ministering"
            fill="#16806f"
            radius={[0, 10, 10, 0]}
            stroke="none"
            barSize={20}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
