"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmailAddressLink } from "@/components/contact-links";
import {
  buildAppleContactsVcf,
  buildContactsFilename,
  buildGoogleContactsCsv,
  downloadTextFile,
  type ExportContact
} from "@/src/contacts/contactExport";
import { CALLING_GROUP_DEFINITIONS, type CallingGroupId, matchesCallingGroup } from "@/src/callings/callingGroups";
import { compareStakeDates, parseStakeDate } from "@/src/utils/date";

type CallingRow = {
  callingTitle: string;
  organizationName: string | null;
  lcrMemberId: string | null;
  email: string | null;
  phoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  country: string | null;
  fullName: string | null;
  unitName: string;
  isLeadership: boolean;
  sustainedOn: string | null;
  isCurrent: boolean;
};

type SortKey = "callingTitle" | "isLeadership" | "assigned" | "sustainedOn" | "isCurrent";
type SortDirection = "asc" | "desc";
type SustainedWindow = "all" | "last_30_days" | "last_60_days";

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

const copyToClipboard = async (value: string) => {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable.");
  }

  await navigator.clipboard.writeText(value);
};

const summarizeSelectedGroups = (labels: string[]) => {
  if (labels.length === 0) {
    return "All current callings";
  }
  if (labels.length === 1) {
    return labels[0];
  }
  if (labels.length <= 3) {
    return labels.join(", ");
  }
  return `${labels.length} groups selected`;
};

const isRecentlySustained = (value: string | null, days: number) => {
  if (!value) {
    return false;
  }

  const parsed = parseStakeDate(value);
  if (!parsed) {
    return false;
  }

  const now = new Date();
  const daysAgo = (now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24);
  return daysAgo >= 0 && daysAgo <= days;
};

export function CallingsBrowser({
  callings,
  availableUnits,
  stakeName
}: {
  callings: CallingRow[];
  availableUnits: string[];
  stakeName: string;
}) {
  const [callingFilter, setCallingFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState<CallingGroupId[]>([]);
  const [sustainedWindow, setSustainedWindow] = useState<SustainedWindow>("all");
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("callingTitle");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [phonesCopied, setPhonesCopied] = useState(false);

  const unitOptions = useMemo(() => {
    const units = Array.from(
      new Set([...availableUnits.filter(Boolean), ...callings.map((item) => item.unitName).filter(Boolean)])
    ).sort((a, b) => a.localeCompare(b));
    return ["all", ...units];
  }, [availableUnits, callings]);

  const filteredCallings = useMemo(() => {
    const needle = callingFilter.trim().toLowerCase();
    const groupFilterActive = selectedGroupIds.length > 0 && !selectedGroupIds.includes("all_callings");

    return callings.filter((calling) => {
      const unitMatch = unitFilter === "all" || calling.unitName === unitFilter;
      const groupMatch =
        !groupFilterActive ||
        selectedGroupIds.some((groupId) =>
          matchesCallingGroup(
            {
              callingTitle: calling.callingTitle,
              organizationName: calling.organizationName
            },
            groupId
          )
        );
      const callingMatch =
        !needle ||
        calling.callingTitle.toLowerCase().includes(needle) ||
        (calling.organizationName ?? "").toLowerCase().includes(needle);
      const sustainedMatch =
        sustainedWindow === "all" ||
        (sustainedWindow === "last_30_days" && isRecentlySustained(calling.sustainedOn, 30)) ||
        (sustainedWindow === "last_60_days" && isRecentlySustained(calling.sustainedOn, 60));

      return unitMatch && groupMatch && callingMatch && sustainedMatch;
    });
  }, [callings, callingFilter, selectedGroupIds, sustainedWindow, unitFilter]);

  const currentCount = filteredCallings.filter((calling) => calling.isCurrent).length;
  const leadershipCount = filteredCallings.filter((calling) => calling.isLeadership).length;
  const selectedGroups = useMemo(
    () => CALLING_GROUP_DEFINITIONS.filter((group) => selectedGroupIds.includes(group.id)),
    [selectedGroupIds]
  );
  const selectedGroupLabels = selectedGroups.map((group) => group.label);
  const visibleEmailList = useMemo(() => {
    return Array.from(
      new Set(
        filteredCallings
          .map((calling) => calling.email?.trim() ?? "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [filteredCallings]);
  const visiblePhoneList = useMemo(() => {
    return Array.from(
      new Set(
        filteredCallings
          .map((calling) => calling.phoneNumber?.trim() ?? "")
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
          return sortKey === "sustainedOn"
            ? compareStakeDates(left.sustainedOn, right.sustainedOn, sortDirection)
            : compareValues(leftValue, rightValue, sortDirection);
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

  const toggleGroup = (groupId: CallingGroupId) => {
    setSelectedGroupIds((current) => {
      if (groupId === "all_callings") {
        return current.includes("all_callings") ? [] : ["all_callings"];
      }

      const next = current.filter((item) => item !== "all_callings");
      return next.includes(groupId) ? next.filter((item) => item !== groupId) : [...next, groupId];
    });
  };

  const clearGroupFilters = () => setSelectedGroupIds([]);

  const exportableContacts = useMemo<ExportContact[]>(() => {
    const byKey = new Map<string, ExportContact>();

    for (const calling of filteredCallings) {
      if (!calling.fullName || !calling.lcrMemberId) {
        continue;
      }
      if (!calling.email && !calling.phoneNumber && !calling.addressLine1 && !calling.addressLine2) {
        continue;
      }

      const key = calling.lcrMemberId || `${calling.fullName}:${calling.email || ""}:${calling.phoneNumber || ""}`;
      const existing = byKey.get(key);
      const notes = [
        calling.unitName ? `Unit: ${calling.unitName}` : "",
        calling.organizationName ? `Organization: ${calling.organizationName}` : "",
        `Visible calling: ${calling.callingTitle}`,
        calling.sustainedOn ? `Sustained: ${calling.sustainedOn}` : "",
        "Exported from StakeOS callings"
      ].filter(Boolean);

      if (!existing) {
        byKey.set(key, {
          fullName: calling.fullName,
          firstName: calling.firstName,
          lastName: calling.lastName,
          email: calling.email,
          phoneNumber: calling.phoneNumber,
          unitName: calling.unitName,
          addressLine1: calling.addressLine1,
          addressLine2: calling.addressLine2,
          city: calling.city,
          stateOrProvince: calling.stateOrProvince,
          postalCode: calling.postalCode,
          country: calling.country,
          title: calling.callingTitle,
          notes
        });
        continue;
      }

      const nextNotes = new Set([...(existing.notes ?? []), ...notes]);
      byKey.set(key, {
        ...existing,
        title: existing.title || calling.callingTitle,
        notes: Array.from(nextNotes)
      });
    }

    return Array.from(byKey.values()).sort((left, right) => left.fullName.localeCompare(right.fullName));
  }, [filteredCallings]);

  const exportAppleContacts = () => {
    if (exportableContacts.length === 0) {
      return;
    }
    downloadTextFile(
      buildContactsFilename(stakeName, "callings-apple-contacts", "vcf"),
      buildAppleContactsVcf(exportableContacts, stakeName),
      "text/vcard"
    );
  };

  const exportGoogleContacts = () => {
    if (exportableContacts.length === 0) {
      return;
    }
    downloadTextFile(
      buildContactsFilename(stakeName, "callings-google-contacts", "csv"),
      buildGoogleContactsCsv(exportableContacts, stakeName),
      "text/csv"
    );
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.1fr_0.85fr_0.8fr_1.2fr]">
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

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Sustained Date</label>
          <select
            value={sustainedWindow}
            onChange={(event) => setSustainedWindow(event.target.value as SustainedWindow)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All Dates</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_60_days">Last 60 Days</option>
          </select>
        </div>

        <div className="relative">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Calling Groups</label>
          <button
            type="button"
            onClick={() => setGroupMenuOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-left text-sm"
          >
            <span className="truncate">{summarizeSelectedGroups(selectedGroupLabels)}</span>
            <span aria-hidden="true">{groupMenuOpen ? "▲" : "▼"}</span>
          </button>
          {selectedGroups.length > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <p className="min-w-0 truncate text-slate-500">{selectedGroups.length} group{selectedGroups.length === 1 ? "" : "s"} active</p>
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
                  <div className="text-sm font-semibold text-slate-900">Filter by calling groups</div>
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
              <div className="max-h-[24rem] overflow-y-auto pr-1">
                <div className="grid gap-x-10 gap-y-2 md:grid-cols-2">
                  {[1, 2].map((column) => (
                    <div key={column} className="space-y-1">
                      {CALLING_GROUP_DEFINITIONS.filter((group) => group.column === column).map((group) => {
                        const selected = selectedGroupIds.includes(group.id);
                        return (
                          <label key={group.id} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
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
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
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
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <p className="text-slate-500">Calling Groups Active</p>
          <p className="text-xl font-semibold text-slate-900">{selectedGroups.length}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
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
              Email Filtered Callings
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
