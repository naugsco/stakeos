"use client";

import { useMemo, useState } from "react";
import { MemberNameLink } from "@/components/member-name-link";

type SortDirection = "asc" | "desc";
type SortKey = "fullName" | "unitName" | "callingTitle" | "sustainedOn";

type CommitteeMember = {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  callingTitle: string;
  sustainedOn: string | null;
  email: string | null;
};

type Committee = {
  key: string;
  name: string;
  handbookBasis: string;
  handbookUrl: string;
  members: CommitteeMember[];
};

const compareValues = (a: string | null, b: string | null, direction: SortDirection) => {
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

  const result = first.localeCompare(second, undefined, { sensitivity: "base" });
  return direction === "asc" ? result : -result;
};

function CommitteeTable({ committee }: { committee: Committee }) {
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const mailtoHref = useMemo(() => {
    const emails = Array.from(
      new Set(
        committee.members
          .map((member) => member.email?.trim() ?? "")
          .filter(Boolean)
      )
    );

    if (emails.length === 0) {
      return null;
    }

    const params = new URLSearchParams({
      bcc: emails.join(","),
      subject: `${committee.name} Outreach`
    });

    return `mailto:?${params.toString()}`;
  }, [committee.members, committee.name]);

  const sortedMembers = useMemo(() => {
    return [...committee.members].sort((left, right) => {
      const leftValue = (left[sortKey] ?? null) as string | null;
      const rightValue = (right[sortKey] ?? null) as string | null;
      return compareValues(leftValue, rightValue, sortDirection);
    });
  }, [committee.members, sortDirection, sortKey]);

  const updateSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{committee.name}</h2>
          <p className="text-xs text-slate-600">
            {committee.handbookBasis} |{" "}
            <a href={committee.handbookUrl} target="_blank" rel="noreferrer" className="underline">
              Handbook Source
            </a>
          </p>
        </div>
        {mailtoHref ? (
          <a
            href={mailtoHref}
            className="rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50"
          >
            Email Committee
          </a>
        ) : (
          <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
            No email addresses
          </span>
        )}
      </header>

      {committee.members.length === 0 ? (
        <div className="px-4 py-4 text-sm text-slate-600">No matching current callings found for this committee.</div>
      ) : (
        <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              {[
                { key: "fullName", label: "Member" },
                { key: "unitName", label: "Unit" },
                { key: "callingTitle", label: "Calling" },
                { key: "sustainedOn", label: "Sustained" }
              ].map((column) => {
                const key = column.key as SortKey;
                const active = sortKey === key;
                return (
                  <th key={column.key} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => updateSort(key)}
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
            {sortedMembers.map((member) => (
              <tr key={`${committee.key}-${member.lcrMemberId}-${member.callingTitle}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <MemberNameLink lcrMemberId={member.lcrMemberId} fullName={member.fullName} />
                </td>
                <td className="px-4 py-3">{member.unitName ?? "-"}</td>
                <td className="px-4 py-3">{member.callingTitle}</td>
                <td className="px-4 py-3">{member.sustainedOn ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function CommitteesBrowser({ committees }: { committees: Committee[] }) {
  return (
    <div className="space-y-6">
      {committees.map((committee) => (
        <CommitteeTable key={committee.key} committee={committee} />
      ))}
    </div>
  );
}
