"use client";

import Link from "next/link";
import { CopyPhoneLink, EmailAddressLink } from "@/components/contact-links";
import { useMemo, useState } from "react";

type MemberRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
  phoneNumber: string | null;
};

type SortKey = "fullName" | "unitName" | "age" | "gender" | "email" | "phoneNumber";
type SortDirection = "asc" | "desc";

interface ColumnDef {
  key: SortKey;
  label: string;
}

const columns: ColumnDef[] = [
  { key: "fullName", label: "Name" },
  { key: "unitName", label: "Unit" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "email", label: "Email" },
  { key: "phoneNumber", label: "Phone" }
];

const compareValues = (
  a: string | number | null,
  b: string | number | null,
  direction: SortDirection
): number => {
  const normalize = (value: string | number | null) => {
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
  } else {
    result = String(first).localeCompare(String(second), undefined, { sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
};

export function MembersTable({
  members
}: {
  members: MemberRow[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");

  const unitOptions = useMemo(() => {
    const units = Array.from(new Set(members.map((member) => member.unitName?.trim() ?? "").filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
    return ["all", ...units];
  }, [members]);

  const visibleRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = members.filter((member) => {
      const searchMatch = !query || member.fullName.toLowerCase().includes(query);
      const unitMatch = unitFilter === "all" || (member.unitName ?? "") === unitFilter;
      return searchMatch && unitMatch;
    });
    const copy = [...filtered];
    copy.sort((left, right) => compareValues(left[sortKey], right[sortKey], sortDirection));
    return copy;
  }, [members, searchTerm, sortKey, sortDirection, unitFilter]);

  const updateSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="member-search">
              Search Members by Name
            </label>
            <input
              id="member-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Start typing a member name..."
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-amber-300 transition focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="member-unit-filter">
              Filter Unit
            </label>
            <select
              id="member-unit-filter"
              value={unitFilter}
              onChange={(event) => setUnitFilter(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-amber-300 transition focus:ring-2"
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit === "all" ? "Entire Stake" : unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            {columns.map((column) => {
              const isActive = sortKey === column.key;
              const direction = isActive ? (sortDirection === "asc" ? "▲" : "▼") : "";
              return (
                <th key={column.key} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateSort(column.key)}
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
          {visibleRows.map((member) => (
            <tr key={member.lcrMemberId} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link
                  href={`/members/${encodeURIComponent(member.lcrMemberId)}`}
                  className="hover:underline"
                >
                  {member.fullName}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-700">{member.unitName ?? "-"}</td>
              <td className="px-4 py-3 text-slate-700">{member.age ?? "-"}</td>
              <td className="px-4 py-3 text-slate-700">{member.gender ?? "-"}</td>
              <td className="px-4 py-3 text-slate-700"><EmailAddressLink email={member.email} /></td>
              <td className="px-4 py-3 text-slate-700"><CopyPhoneLink phone={member.phoneNumber} /></td>
            </tr>
          ))}
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-500">
                No members found for this search.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
