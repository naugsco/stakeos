"use client";

import Link from "next/link";
import { CopyPhoneLink, EmailAddressLink } from "@/components/contact-links";
import { useMemo, useState } from "react";
import {
  buildAppleContactsVcf,
  buildContactsFilename,
  buildGoogleContactsCsv,
  downloadTextFile,
  type ExportContact
} from "@/src/contacts/contactExport";
import {
  buildMemberGroupContext,
  MEMBER_GROUP_DEFINITIONS,
  type MemberGroupId,
  matchesMemberGroup
} from "@/src/members/memberGroups";

type MemberRow = {
  lcrMemberId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  unitName: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  country: string | null;
  householdId: number | null;
  householdPosition: string | null;
  memberStatus: string | null;
  isMarried: boolean | null;
  isSingle: boolean | null;
  marriageStatus: string | null;
  missionStatus: string | null;
  missionCountry: string | null;
  isReturnedMissionary: boolean | null;
  priesthoodType: string | null;
  priesthoodOffice: string | null;
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

const summarizeSelectedGroups = (labels: string[]) => {
  if (labels.length === 0) {
    return "All active members";
  }
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  return `${labels.slice(0, 2).join(", ")} + ${labels.length - 2} more`;
};

const encodeMailtoValue = (value: string) => encodeURIComponent(value).replace(/%20/g, " ");

const copyToClipboard = async (value: string) => {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable.");
  }

  await navigator.clipboard.writeText(value);
};

export function MembersTable({
  members,
  stakeName
}: {
  members: MemberRow[];
  stakeName: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState<MemberGroupId[]>([]);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [phonesCopied, setPhonesCopied] = useState(false);

  const unitOptions = useMemo(() => {
    const units = Array.from(new Set(members.map((member) => member.unitName?.trim() ?? "").filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
    return ["all", ...units];
  }, [members]);

  const memberGroupContext = useMemo(() => buildMemberGroupContext(members), [members]);

  const selectedGroups = useMemo(
    () => MEMBER_GROUP_DEFINITIONS.filter((group) => selectedGroupIds.includes(group.id)),
    [selectedGroupIds]
  );
  const selectedGroupLabels = selectedGroups.map((group) => group.label);

  const visibleRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = members.filter((member) => {
      const searchMatch = !query || member.fullName.toLowerCase().includes(query);
      const unitMatch = unitFilter === "all" || (member.unitName ?? "") === unitFilter;
      const groupMatch =
        selectedGroupIds.length === 0 ||
        selectedGroupIds.includes("all_members") ||
        selectedGroupIds.some((groupId) => matchesMemberGroup(member, groupId, memberGroupContext));
      return searchMatch && unitMatch && groupMatch;
    });
    const copy = [...filtered];
    copy.sort((left, right) => compareValues(left[sortKey], right[sortKey], sortDirection));
    return copy;
  }, [memberGroupContext, members, searchTerm, selectedGroupIds, sortKey, sortDirection, unitFilter]);

  const updateSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const toggleGroup = (groupId: MemberGroupId) => {
    setSelectedGroupIds((current) => {
      if (groupId === "all_members") {
        return current.includes("all_members") ? [] : ["all_members"];
      }

      const next = current.filter((item) => item !== "all_members");
      return next.includes(groupId) ? next.filter((item) => item !== groupId) : [...next, groupId];
    });
  };

  const clearGroupFilters = () => setSelectedGroupIds([]);

  const exportableContacts = useMemo<ExportContact[]>(() => {
    return visibleRows
      .filter((member) => member.email || member.phoneNumber || member.addressLine1 || member.addressLine2)
      .map((member) => ({
        fullName: member.fullName,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        unitName: member.unitName,
        addressLine1: member.addressLine1,
        addressLine2: member.addressLine2,
        city: member.city,
        stateOrProvince: member.stateOrProvince,
        postalCode: member.postalCode,
        country: member.country,
        notes: [
          member.unitName ? `Unit: ${member.unitName}` : "",
          member.memberStatus ? `Member status: ${member.memberStatus}` : "",
          member.householdPosition ? `Household role: ${member.householdPosition}` : "",
          `Exported from StakeOS directory`
        ]
      }));
  }, [visibleRows]);

  const visibleEmailList = useMemo(() => {
    return Array.from(
      new Set(
        visibleRows
          .map((member) => member.email?.trim() ?? "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [visibleRows]);
  const visiblePhoneList = useMemo(() => {
    return Array.from(
      new Set(
        visibleRows
          .map((member) => member.phoneNumber?.trim() ?? "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [visibleRows]);

  const emailVisibleHref = useMemo(() => {
    if (visibleEmailList.length === 0) {
      return null;
    }

    const recipients = visibleEmailList.join(",");
    const subject = unitFilter === "all" ? "StakeOS filtered members" : `StakeOS members - ${unitFilter}`;
    return `mailto:?bcc=${encodeMailtoValue(recipients)}&subject=${encodeMailtoValue(subject)}`;
  }, [unitFilter, visibleEmailList]);

  const exportAppleContacts = () => {
    if (exportableContacts.length === 0) {
      return;
    }
    downloadTextFile(
      buildContactsFilename(stakeName, "members-apple-contacts", "vcf"),
      buildAppleContactsVcf(exportableContacts, stakeName),
      "text/vcard"
    );
  };

  const exportGoogleContacts = () => {
    if (exportableContacts.length === 0) {
      return;
    }
    downloadTextFile(
      buildContactsFilename(stakeName, "members-google-contacts", "csv"),
      buildGoogleContactsCsv(exportableContacts, stakeName),
      "text/csv"
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)_minmax(260px,1fr)]">
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
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="member-group-filter">
              Member Groups
            </label>
            <button
              id="member-group-filter"
              type="button"
              onClick={() => setGroupMenuOpen((current) => !current)}
              className="mt-2 flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm"
            >
              <span className="truncate">{summarizeSelectedGroups(selectedGroupLabels)}</span>
              <span aria-hidden="true">{groupMenuOpen ? "▲" : "▼"}</span>
            </button>
            {selectedGroups.length > 0 ? (
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <p className="min-w-0 truncate text-slate-500">
                  {selectedGroups.length} group{selectedGroups.length === 1 ? "" : "s"} active: {selectedGroupLabels.join(", ")}
                </p>
                <button
                  type="button"
                  onClick={clearGroupFilters}
                  className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            ) : null}
            {groupMenuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-[44rem] max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Filter by member groups</div>
                    <div className="text-xs text-slate-500">Select one or more groups, then close the menu to review the filtered list.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearGroupFilters}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupMenuOpen(false)}
                      className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="grid gap-x-10 gap-y-2 md:grid-cols-2">
                  {[1, 2].map((column) => (
                    <div key={column} className="space-y-1">
                      {MEMBER_GROUP_DEFINITIONS.filter((group) => group.column === column).map((group) => {
                        const selected = selectedGroupIds.includes(group.id);
                        return (
                          <label
                            key={group.id}
                            className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleGroup(group.id)}
                              className="mt-1 h-4 w-4"
                            />
                            <span className="text-sm text-slate-800">{group.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            {visibleEmailList.length} emails
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            {visiblePhoneList.length} phones
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            {exportableContacts.length} exportable
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {emailVisibleHref ? (
            <a
              href={emailVisibleHref}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Email Filtered Members
            </a>
          ) : (
            <div className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-400">
              No visible emails
            </div>
          )}
          {visiblePhoneList.length > 0 ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await copyToClipboard(visiblePhoneList.join("\n"));
                  setPhonesCopied(true);
                  window.setTimeout(() => setPhonesCopied(false), 1500);
                } catch {
                  setPhonesCopied(false);
                }
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {phonesCopied ? "Phone Numbers Copied" : "Copy Filtered Phones"}
            </button>
          ) : (
            <div className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-400">
              No visible phones
            </div>
          )}
          <button
            type="button"
            onClick={exportAppleContacts}
            disabled={exportableContacts.length === 0}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Export Apple Contacts
          </button>
          <button
            type="button"
            onClick={exportGoogleContacts}
            disabled={exportableContacts.length === 0}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Export Google Contacts
          </button>
        </div>
      </section>
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
