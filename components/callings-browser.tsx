"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmailAddressLink } from "@/components/contact-links";

type CallingRow = {
  callingTitle: string;
  organizationName: string | null;
  lcrMemberId: string | null;
  email: string | null;
  fullName: string | null;
  unitName: string;
  isLeadership: boolean;
  sustainedOn: string | null;
  isCurrent: boolean;
};

type SortKey = "callingTitle" | "isLeadership" | "assigned" | "sustainedOn" | "isCurrent";
type SortDirection = "asc" | "desc";

const compareValues = (
  a: string | number | boolean | null,
  b: string | number | boolean | null,
  direction: SortDirection
) => {
  const normalize = (value: string | number | boolean | null) => {
    if (value === null || value === undefined) {
      return null;
    }
    return value;
  };

  const first = normalize(a);
  const second = normalize(b);
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

const encodeMailtoValue = (value: string) => encodeURIComponent(value).replace(/%20/g, " ");

export function CallingsBrowser({
  callings,
  availableUnits
}: {
  callings: CallingRow[];
  availableUnits: string[];
}) {
  const [callingFilter, setCallingFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [leadershipOnly, setLeadershipOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("callingTitle");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const unitOptions = useMemo(() => {
    const units = Array.from(
      new Set([...availableUnits.filter(Boolean), ...callings.map((item) => item.unitName).filter(Boolean)])
    ).sort((a, b) => a.localeCompare(b));
    return ["all", ...units];
  }, [availableUnits, callings]);

  const filteredCallings = useMemo(() => {
    const needle = callingFilter.trim().toLowerCase();

    return callings.filter((calling) => {
      const unitMatch = unitFilter === "all" || calling.unitName === unitFilter;
      const leadershipMatch = !leadershipOnly || calling.isLeadership;
      const callingMatch =
        !needle ||
        calling.callingTitle.toLowerCase().includes(needle) ||
        (calling.organizationName ?? "").toLowerCase().includes(needle);

      return unitMatch && leadershipMatch && callingMatch;
    });
  }, [callings, callingFilter, unitFilter, leadershipOnly]);

  const currentCount = filteredCallings.filter((calling) => calling.isCurrent).length;
  const leadershipCount = filteredCallings.filter((calling) => calling.isLeadership).length;
  const visibleEmailList = useMemo(() => {
    return Array.from(
      new Set(
        filteredCallings
          .map((calling) => calling.email?.trim() ?? "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [filteredCallings]);
  const emailVisibleHref = useMemo(() => {
    if (visibleEmailList.length === 0) {
      return null;
    }

    const recipients = visibleEmailList.join(",");
    const subject = unitFilter === "all" ? "StakeOS filtered callings" : `StakeOS callings - ${unitFilter}`;
    return `mailto:?bcc=${encodeMailtoValue(recipients)}&subject=${encodeMailtoValue(subject)}`;
  }, [unitFilter, visibleEmailList]);
  const groupedByUnit = useMemo(() => {
    const grouped = new Map<string, CallingRow[]>();
    for (const calling of filteredCallings) {
      const unit = calling.unitName || "Unknown";
      const list = grouped.get(unit) ?? [];
      list.push(calling);
      grouped.set(unit, list);
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([unitName, unitCallings]) => ({
        unitName,
        rows: [...unitCallings].sort((left, right) => {
          const leftValue =
            sortKey === "assigned"
              ? left.fullName ?? "Vacant"
              : sortKey === "sustainedOn"
                ? left.sustainedOn
                : left[sortKey];
          const rightValue =
            sortKey === "assigned"
              ? right.fullName ?? "Vacant"
              : sortKey === "sustainedOn"
                ? right.sustainedOn
                : right[sortKey];
          return compareValues(leftValue, rightValue, sortDirection);
        }),
        stats: {
          total: unitCallings.length,
          leadership: unitCallings.filter((calling) => calling.isLeadership).length,
          current: unitCallings.filter((calling) => calling.isCurrent).length
        }
      }));
  }, [filteredCallings, sortDirection, sortKey]);

  const updateSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Filter Calling</label>
          <input
            value={callingFilter}
            onChange={(event) => setCallingFilter(event.target.value)}
            placeholder="Bishop, president, clerk..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Filter Unit</label>
          <select
            value={unitFilter}
            onChange={(event) => setUnitFilter(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit === "all" ? "All Units" : unit}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={leadershipOnly}
              onChange={(event) => setLeadershipOnly(event.target.checked)}
              className="h-4 w-4"
            />
            Leadership only (President, Bishop, High Councilor)
          </label>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <p className="text-slate-500">Visible Callings</p>
          <p className="text-xl font-semibold text-slate-900">{filteredCallings.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <p className="text-slate-500">Visible Current</p>
          <p className="text-xl font-semibold text-slate-900">{currentCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <p className="text-slate-500">Leadership Callings</p>
          <p className="text-xl font-semibold text-slate-900">{leadershipCount}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        <div>
          <p className="text-slate-500">Visible Calling Emails</p>
          <p className="font-semibold text-slate-900">{visibleEmailList.length}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {visibleEmailList.length > 0 ? (
            <div className="hidden max-w-[28rem] text-xs text-slate-500 md:block">
              {visibleEmailList.slice(0, 3).join(", ")}
              {visibleEmailList.length > 3 ? ` + ${visibleEmailList.length - 3} more` : ""}
            </div>
          ) : null}
          {emailVisibleHref ? (
            <a
              href={emailVisibleHref}
              className="rounded-full bg-teal-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Email Filtered Callings
            </a>
          ) : (
            <div className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-400">
              No visible emails
            </div>
          )}
        </div>
      </section>

      {groupedByUnit.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No callings match the current filters.
        </section>
      ) : null}

      {groupedByUnit.map((group) => (
        <section key={group.unitName} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-900">{group.unitName}</h2>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Total {group.stats.total} | Current {group.stats.current} | Leadership {group.stats.leadership}
            </p>
          </header>

          <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                {[
                  { key: "callingTitle", label: "Calling" },
                  { key: "isLeadership", label: "Leadership" },
                  { key: "assigned", label: "Assigned" },
                  { key: "sustainedOn", label: "Sustained" },
                  { key: "isCurrent", label: "Status" }
                ].map((column) => {
                  const key = column.key as SortKey;
                  const isActive = sortKey === key;
                  const direction = isActive ? (sortDirection === "asc" ? "▲" : "▼") : "";
                  return (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => updateSort(key)}
                        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">{direction}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.rows.map((calling, index) => (
                <tr key={`${group.unitName}-${calling.callingTitle}-${index}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{calling.callingTitle}</td>
                  <td className="px-4 py-3">{calling.isLeadership ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {calling.fullName && calling.lcrMemberId ? (
                      <div className="space-y-1">
                        <Link href={`/members/${encodeURIComponent(calling.lcrMemberId)}`} className="hover:underline">
                          {calling.fullName}
                        </Link>
                        {calling.email ? <div className="text-xs"><EmailAddressLink email={calling.email} /></div> : null}
                      </div>
                    ) : (
                      "Vacant"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{calling.sustainedOn ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{calling.isCurrent ? "Current" : "Released"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
