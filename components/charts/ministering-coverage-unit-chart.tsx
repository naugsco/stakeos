"use client";

import Link from "next/link";
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
  linkLabel = "Open ministering gaps"
}: {
  data: MinisteringCoverageUnitPoint[];
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="relative h-[28rem] w-full rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      {href ? (
        <Link
          href={href}
          className="absolute right-3 top-3 z-10 rounded-lg border border-amber-300 bg-white/95 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-white"
        >
          {linkLabel}
        </Link>
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 20, bottom: 8, left: 32 }}
          barCategoryGap="18%"
          barGap={0}
        >
          <CartesianGrid horizontal={false} strokeDasharray="2 8" stroke="#dbe3ef" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis type="category" dataKey="unitName" width={160} tick={{ fill: "#475569", fontSize: 12 }} />
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
    </div>
  );
}
