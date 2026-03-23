"use client";

import { useMemo, useState } from "react";

type SortDirection = "asc" | "desc";

type RecentBaptismPathRow = {
  unitName: string;
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  ministeringAssigned: boolean;
  assignedAsMinister: boolean | null;
  assignedAsMinisterLabel: string;
};

type HeatmapRow = {
  unitName: string;
  cohortCount: number;
  activeRecommendPct: number;
  hasCallingPct: number;
  assignedMinistersPct: number;
  assignedAsMinisterPct: number;
};

const isActiveRecommend = (status: string | null) => Boolean(status && /^active/i.test(status));

const compareValues = (
  a: string | number,
  b: string | number,
  direction: SortDirection
) => {
  const result =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), undefined, { sensitivity: "base" });

  return direction === "asc" ? result : -result;
};

const heatStyle = (pct: number) => {
  const alpha = Math.max(0.08, Math.min(0.92, pct / 100));
  return {
    backgroundColor: `rgba(15, 118, 110, ${alpha})`,
    color: pct >= 45 ? "#ffffff" : "#0f172a"
  };
};

export function RecentBaptismUnitHeatmap({ rows }: { rows: RecentBaptismPathRow[] }) {
  const [sortKey, setSortKey] = useState<keyof HeatmapRow>("cohortCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const unitRows = useMemo(() => {
    const grouped = new Map<string, RecentBaptismPathRow[]>();
    for (const row of rows) {
      const bucket = grouped.get(row.unitName) ?? [];
      bucket.push(row);
      grouped.set(row.unitName, bucket);
    }

    return Array.from(grouped.entries())
      .map<HeatmapRow>(([unitName, members]) => {
        const cohortCount = members.length;
        const pct = (count: number) => (cohortCount > 0 ? Math.round((count / cohortCount) * 100) : 0);
        return {
          unitName,
          cohortCount,
          activeRecommendPct: pct(members.filter((member) => isActiveRecommend(member.templeRecommendStatus)).length),
          hasCallingPct: pct(members.filter((member) => member.hasCurrentCalling).length),
          assignedMinistersPct: pct(members.filter((member) => member.ministeringAssigned).length),
          assignedAsMinisterPct: pct(members.filter((member) => member.assignedAsMinister === true).length)
        };
      })
      .sort((left, right) => compareValues(left[sortKey], right[sortKey], sortDirection));
  }, [rows, sortDirection, sortKey]);

  const toggleSort = (key: keyof HeatmapRow) => {
    if (key === sortKey) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "unitName" ? "asc" : "desc");
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-lg font-semibold">Recent Baptism Unit Heatmap</h2>
        <p className="text-xs text-slate-600">
          Darker cells indicate higher percentages within that unit&apos;s baptized-last-24-months cohort.
        </p>
      </header>
      <div className="max-h-[28rem] overflow-auto">
        <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              {[
                { key: "unitName", label: "Unit" },
                { key: "cohortCount", label: "Cohort" },
                { key: "activeRecommendPct", label: "Recommend %" },
                { key: "hasCallingPct", label: "Calling %" },
                { key: "assignedMinistersPct", label: "Ministers %" },
                { key: "assignedAsMinisterPct", label: "Assigned As Minister %" }
              ].map((column) => {
                const key = column.key as keyof HeatmapRow;
                const active = sortKey === key;
                return (
                  <th key={column.key} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                    >
                      <span>{column.label}</span>
                      <span aria-hidden="true">{active ? (sortDirection === "asc" ? "▲" : "▼") : ""}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unitRows.map((row) => (
              <tr key={row.unitName} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{row.unitName}</td>
                <td className="px-4 py-3">{row.cohortCount}</td>
                <td className="px-4 py-3 font-medium" style={heatStyle(row.activeRecommendPct)}>{row.activeRecommendPct}%</td>
                <td className="px-4 py-3 font-medium" style={heatStyle(row.hasCallingPct)}>{row.hasCallingPct}%</td>
                <td className="px-4 py-3 font-medium" style={heatStyle(row.assignedMinistersPct)}>{row.assignedMinistersPct}%</td>
                <td className="px-4 py-3 font-medium" style={heatStyle(row.assignedAsMinisterPct)}>{row.assignedAsMinisterPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
