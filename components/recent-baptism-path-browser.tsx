"use client";

import { useMemo, useState } from "react";
import { MemberNameLink } from "@/components/member-name-link";

type SortDirection = "asc" | "desc";

type RecentBaptismPathRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  baptismDate: string | null;
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  currentCalling: string | null;
  ministeringAssigned: boolean;
  assignedAsMinister: boolean | null;
  assignedAsMinisterLabel: string;
};

const compareValues = (
  a: string | number | boolean | null,
  b: string | number | boolean | null,
  direction: SortDirection
) => {
  const first = a ?? null;
  const second = b ?? null;

  if (first === null && second === null) {
    return 0;
  }
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }

  let result = 0;
  if (typeof first === "number" && typeof second === "number") {
    result = first - second;
  } else if (typeof first === "boolean" && typeof second === "boolean") {
    result = Number(first) - Number(second);
  } else {
    result = String(first).localeCompare(String(second), undefined, { sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
};

export function RecentBaptismPathBrowser({ rows }: { rows: RecentBaptismPathRow[] }) {
  const [sortKey, setSortKey] = useState<
    "baptismDate" | "unitName" | "fullName" | "templeRecommendStatus" | "hasCurrentCalling" | "ministeringAssigned" | "assignedAsMinisterLabel"
  >("baptismDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedRows = useMemo(
    () => [...rows].sort((left, right) => compareValues(left[sortKey], right[sortKey], sortDirection)),
    [rows, sortDirection, sortKey]
  );

  const toggleSort = (
    key:
      | "baptismDate"
      | "unitName"
      | "fullName"
      | "templeRecommendStatus"
      | "hasCurrentCalling"
      | "ministeringAssigned"
      | "assignedAsMinisterLabel"
  ) => {
    if (key === sortKey) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const derivedAssignmentCount = rows.filter((row) => row.assignedAsMinisterLabel === "Yes").length;

  return (
    <section id="recent-baptism-path-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-lg font-semibold">Recent Baptism Readiness Cohort</h2>
        <p className="text-xs text-slate-600">
          Members baptized in the last 24 months, with temple recommend, calling, and ministering follow-up signals.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {derivedAssignmentCount > 0
            ? `Assigned as minister is derived heuristically by matching member names against ministering-brothers and ministering-sisters lists (${derivedAssignmentCount} current matches).`
            : "Assigned as minister is derived heuristically by matching member names against ministering-brothers and ministering-sisters lists. No current matches were found in this cohort."}
        </p>
      </header>
      <div className="max-h-[32rem] overflow-auto">
        <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              {[
                { key: "baptismDate", label: "Baptism Date" },
                { key: "unitName", label: "Unit" },
                { key: "fullName", label: "Member" },
                { key: "templeRecommendStatus", label: "Recommend" },
                { key: "hasCurrentCalling", label: "Calling" },
                { key: "ministeringAssigned", label: "Assigned Ministers" },
                { key: "assignedAsMinisterLabel", label: "Assigned As Minister" }
              ].map((column) => {
                const key = column.key as
                  | "baptismDate"
                  | "unitName"
                  | "fullName"
                  | "templeRecommendStatus"
                  | "hasCurrentCalling"
                  | "ministeringAssigned"
                  | "assignedAsMinisterLabel";
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
            {sortedRows.map((row) => (
              <tr key={row.lcrMemberId} className="hover:bg-slate-50">
                <td className="px-4 py-3">{row.baptismDate ?? "-"}</td>
                <td className="px-4 py-3">{row.unitName}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                </td>
                <td className="px-4 py-3">{row.templeRecommendStatus ?? "-"}</td>
                <td className="px-4 py-3">{row.hasCurrentCalling ? row.currentCalling ?? "Yes" : "No"}</td>
                <td className="px-4 py-3">{row.ministeringAssigned ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{row.assignedAsMinisterLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
