export const dynamic = "force-dynamic";

import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { ContactMethodsInline } from "@/components/contact-links";
import { StatCard } from "@/components/stat-card";
import { UnitHealthRadarPanel } from "@/components/unit-health-radar-panel";
import { loadStakeOverviewPageDataBySource } from "@/lib/dashboardData";

const formatChangedFields = (changedFields: string[]) => (changedFields.length > 0 ? changedFields.join(", ") : "-");
const encodeMailtoValue = (value: string) => encodeURIComponent(value).replace(/%20/g, " ");
const buildTrainingMailto = ({
  recipients,
  subject,
  body
}: {
  recipients: string[];
  subject: string;
  body: string;
}) => {
  const parts = [];
  if (recipients.length > 0) {
    parts.push(`to=${encodeMailtoValue(recipients.join(","))}`);
  }
  parts.push(`subject=${encodeMailtoValue(subject)}`);
  parts.push(`body=${encodeMailtoValue(body)}`);
  return `mailto:?${parts.join("&")}`;
};

const formatLeadershipDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const formatDaysAgo = (daysAgo: number, label: "Sustained" | "Set Apart") =>
  daysAgo === 0 ? `${label} today` : `${label} ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;

const trainingGreeting = (groupLabel: string) => {
  switch (groupLabel) {
    case "Stake Presidency":
      return "Brethren";
    case "High Council":
      return "Brethren";
    default:
      return "Dear leaders";
  }
};

const syncCoverageHint = (status: string, readyLabel: string) => {
  if (status === "ready") {
    return readyLabel;
  }
  if (status === "baseline-established") {
    return "Baseline captured. Exact diffs appear after the next sync.";
  }
  return "No snapshot baseline yet. Run the baseline seed or the next sync.";
};

export default async function StakeOverviewPage() {
  const data = await loadStakeOverviewPageDataBySource();
  const trainerGroupMeta = {
    stake_presidency: { label: "Stake Presidency", recipients: data.trainingEmailRecipients.stakePresidency },
    high_council: { label: "High Council", recipients: data.trainingEmailRecipients.highCouncil },
    stake_rs: { label: "Stake Relief Society", recipients: data.trainingEmailRecipients.stakeReliefSociety },
    stake_yw: { label: "Stake Young Women", recipients: data.trainingEmailRecipients.stakeYoungWomen },
    stake_primary: { label: "Stake Primary", recipients: data.trainingEmailRecipients.stakePrimary },
    stake_ss: { label: "Stake Sunday School", recipients: data.trainingEmailRecipients.stakeSundaySchool }
  } as const;
  const groupedLeadershipAlerts = Object.entries(trainerGroupMeta)
    .map(([groupKey, meta]) => ({
      groupKey,
      ...meta,
      rows: data.newLeadershipAlerts.filter((row) => row.trainerGroup === groupKey)
    }))
    .filter((group) => group.rows.length > 0);
  const pendingSetApartCount = data.newLeadershipAlerts.filter((row) => row.pendingSetApart).length;
  const contactCoverageReady = data.syncDiff
    ? data.syncDiff.coverage.emails.ready || data.syncDiff.coverage.phones.ready
    : false;
  const contactCoverageStatus = data.syncDiff
    ? data.syncDiff.coverage.emails.status === "not-seeded" && data.syncDiff.coverage.phones.status === "not-seeded"
      ? "not-seeded"
      : contactCoverageReady
        ? "ready"
        : "baseline-established"
    : "not-seeded";

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold">Stake Overview</h1>
          <p className="text-sm text-slate-600">Trend and change tracking across leadership, converts, unit health, and sync-to-sync movement.</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Members" value={data.overview.totalMembers} />
        <StatCard label="Members With A Current Calling" value={data.overview.membersWithCurrentCalling} />
        <StatCard label="Members Without A Current Calling" value={data.overview.membersWithoutCurrentCalling} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Leadership Turnover Trend</h2>
        <LineTrendChart data={data.turnover} variant="turnover" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Recent Convert Growth</h2>
        <LineTrendChart data={data.converts} variant="converts" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Unit Health Radar</h2>
        <UnitHealthRadarPanel rows={data.unitHealthRadar} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recent Leadership Training Queue</h2>
            <p className="text-sm text-slate-600">
              Current ward and branch leaders sustained or set apart in the last 60 days, grouped by the stake training group that should follow up.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Recent Leadership Calls" value={data.newLeadershipAlerts.length} hint="Current leaders sustained or set apart in the last 60 days." />
          <StatCard label="Training Groups Active" value={groupedLeadershipAlerts.length} hint="Groups with at least one recent follow-up item." />
          <StatCard label="Sustained, Not Set Apart" value={pendingSetApartCount} hint="Recent callings still missing a set-apart date." />
        </div>

        {groupedLeadershipAlerts.length > 0 ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#fffaf0] p-4 shadow-sm">
            <div className="border-b border-amber-900/10 pb-3">
              <h3 className="text-base font-semibold text-slate-900">Training Group Follow-Up</h3>
              <p className="mt-1 text-sm text-slate-600">
                Each section below prepares an email draft for the stake leaders responsible to train these newly called ward or branch leaders.
              </p>
            </div>
          {groupedLeadershipAlerts.map((group) => {
            const notifyHref = buildTrainingMailto({
              recipients: group.recipients,
              subject: `Recent leadership follow-up for ${group.label}`,
              body: [
                trainingGreeting(group.label) + ",",
                "",
                `Stake Leadership have identified several recent callings that would benefit from a warm introduction and early follow-up from ${group.label}.`,
                "",
                "Would you please reach out as soon as you can to welcome these leaders, introduce yourself as a resource, and help them feel supported as they begin in their new responsibilities?",
                "",
                "A brief call, text, or email would be a good first step, followed by any training that seems helpful.",
                "",
                "Recent leadership follow-up items:",
                "",
                ...group.rows.map((row) =>
                  [
                    `- ${row.fullName}`,
                    `  Calling: ${row.callingTitle}`,
                    `  Unit: ${row.unitName}`,
                    `  Sustained: ${formatLeadershipDate(row.sustainedOn)}`,
                    `  Set apart: ${formatLeadershipDate(row.setApartOn)}`,
                    `  Status: ${row.pendingSetApart ? "Sustained, not set apart" : formatDaysAgo(row.daysAgo, row.recentDateLabel)}`,
                    `  Email: ${row.primaryEmail ?? "None listed"}`,
                    `  Phone: ${row.primaryPhone ?? "None listed"}`
                  ].join("\n")
                ),
                "",
                "Thank you for helping these leaders feel supported from the start."
              ].join("\n")
            });

            return (
              <div key={group.groupKey} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <h3 className="text-base font-semibold">{group.label}</h3>
                    <p className="text-sm text-slate-600">
                      {group.rows.length} recent calling{group.rows.length === 1 ? "" : "s"}.
                      {" "}
                      {group.recipients.length > 0 ? `${group.recipients.length} current trainer recipient(s) will be prefilled from the local stake data.` : "No current trainer recipients were found in the local stake data, so the draft will open without prefilled recipients."}
                    </p>
                  </div>
                  <a
                    href={notifyHref}
                    className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Draft Email
                  </a>
                </header>
                <div className="max-h-80 overflow-auto">
                  <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-2">Leader</th>
                        <th className="px-4 py-2">Unit</th>
                        <th className="px-4 py-2">Calling</th>
                        <th className="px-4 py-2">Sustained</th>
                        <th className="px-4 py-2">Set Apart</th>
                        <th className="px-4 py-2">How Long Ago</th>
                        <th className="px-4 py-2">Contact</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.rows.map((row) => (
                        <tr key={`${row.trainerGroup}-${row.unitName}-${row.callingTitle}-${row.lcrMemberId}`} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-900">{row.fullName}</td>
                          <td className="px-4 py-2">{row.unitName}</td>
                          <td className="px-4 py-2">{row.callingTitle}</td>
                          <td className="px-4 py-2">{formatLeadershipDate(row.sustainedOn)}</td>
                          <td className="px-4 py-2">{formatLeadershipDate(row.setApartOn)}</td>
                          <td className="px-4 py-2">{formatDaysAgo(row.daysAgo, row.recentDateLabel)}</td>
                          <td className="px-4 py-2"><ContactMethodsInline email={row.primaryEmail} phone={row.primaryPhone} /></td>
                          <td className="px-4 py-2">
                            {row.pendingSetApart ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                Sustained, not set apart
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800">
                                {row.recentDateLabel}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
            No current ward or branch leadership callings were sustained or set apart in the last 60 days.
          </div>
        )}
      </section>

      {data.syncDiff ? (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Changes Since Last Sync</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Members Changed"
            value={data.syncDiff.counts.membersChanged}
            hint={
              data.syncDiff.coverage.members.ready
                ? `Added: ${data.syncDiff.counts.membersAdded} | Removed: ${data.syncDiff.counts.membersRemoved} | Updated: ${data.syncDiff.counts.membersUpdated}`
                : syncCoverageHint(data.syncDiff.coverage.members.status, "")
            }
          />
          <StatCard
            label="Callings Changed"
            value={data.syncDiff.counts.callingsChanged}
            hint={
              data.syncDiff.coverage.callings.ready
                ? `Added: ${data.syncDiff.counts.callingsAdded} | Removed: ${data.syncDiff.counts.callingsRemoved} | Updated: ${data.syncDiff.counts.callingsUpdated}`
                : syncCoverageHint(data.syncDiff.coverage.callings.status, "")
            }
          />
          <StatCard
            label="Contact Changes"
            value={data.syncDiff.counts.emailChanged + data.syncDiff.counts.phoneChanged}
            hint={
              contactCoverageReady
                ? `Emails: +${data.syncDiff.counts.emailAdded} / -${data.syncDiff.counts.emailRemoved} / ${data.syncDiff.counts.emailUpdated} updated | Phones: +${data.syncDiff.counts.phoneAdded} / -${data.syncDiff.counts.phoneRemoved} / ${data.syncDiff.counts.phoneUpdated} updated`
                : syncCoverageHint(contactCoverageStatus, "")
            }
          />
        </div>
        <div className="space-y-1 text-sm text-slate-600">
          <p>
            Latest successful sync window: {data.syncDiff.windowStart ?? "n/a"} to {data.syncDiff.windowEnd ?? "n/a"}
          </p>
          <p>
            Exact comparisons use the latest available snapshot pair for each data type:
            {" "}
            Members {data.syncDiff.comparisonWindows.members.start ?? "baseline"} to {data.syncDiff.comparisonWindows.members.end ?? "n/a"}
            {" | "}
            Callings {data.syncDiff.comparisonWindows.callings.start ?? "baseline"} to {data.syncDiff.comparisonWindows.callings.end ?? "n/a"}
            {" | "}
            Contacts{" "}
            {(data.syncDiff.comparisonWindows.emails.start ?? data.syncDiff.comparisonWindows.phones.start ?? "baseline")} to{" "}
            {(data.syncDiff.comparisonWindows.emails.end ?? data.syncDiff.comparisonWindows.phones.end ?? "n/a")}
          </p>
        </div>
        {!data.syncDiff.coverage.members.ready ||
        !data.syncDiff.coverage.callings.ready ||
        !contactCoverageReady ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Exact change tracking is snapshot-based. Any area marked as baseline-only will become accurate after the
            next sync for that data type.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-base font-semibold">Recent Member Changes</h3>
          </header>
          <div className="max-h-80 overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-2">Member</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Changed Fields</th>
                  <th className="px-4 py-2">Move-In</th>
                  <th className="px-4 py-2">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.syncDiff.members.length > 0 ? (
                  data.syncDiff.members.map((row: (typeof data.syncDiff.members)[number]) => (
                    <tr key={`${row.lcrMemberId}-${row.updatedAt}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{row.fullName}</td>
                      <td className="px-4 py-2">{row.unitName}</td>
                      <td className="px-4 py-2">{row.changeType}</td>
                      <td className="px-4 py-2">{formatChangedFields(row.changedFields)}</td>
                      <td className="px-4 py-2">{row.moveInDate ?? "-"}</td>
                      <td className="px-4 py-2">{row.updatedAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={6}>
                      No exact member changes available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-base font-semibold">Recent Calling Changes</h3>
          </header>
          <div className="max-h-80 overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-2">Calling</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Changed Fields</th>
                  <th className="px-4 py-2">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.syncDiff.callings.length > 0 ? (
                  data.syncDiff.callings.map((row: (typeof data.syncDiff.callings)[number]) => (
                    <tr key={`${row.lcrCallingId}-${row.updatedAt}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{row.callingTitle}</td>
                      <td className="px-4 py-2">{row.unitName}</td>
                      <td className="px-4 py-2">{row.changeType}</td>
                      <td className="px-4 py-2">{formatChangedFields(row.changedFields)}</td>
                      <td className="px-4 py-2">{row.updatedAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={5}>
                      No exact calling changes available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-base font-semibold">Recent Contact Changes</h3>
          </header>
          <div className="max-h-80 overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-2">Member</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Contact</th>
                  <th className="px-4 py-2">Value</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Changed Fields</th>
                  <th className="px-4 py-2">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.syncDiff.contacts.length > 0 ? (
                  data.syncDiff.contacts.map((row: (typeof data.syncDiff.contacts)[number]) => (
                    <tr key={`${row.contactType}-${row.memberLcrMemberId}-${row.value}-${row.updatedAt}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{row.fullName}</td>
                      <td className="px-4 py-2">{row.unitName}</td>
                      <td className="px-4 py-2">{row.contactType}</td>
                      <td className="px-4 py-2">{row.value}</td>
                      <td className="px-4 py-2">{row.changeType}</td>
                      <td className="px-4 py-2">{formatChangedFields(row.changedFields)}</td>
                      <td className="px-4 py-2">{row.updatedAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={7}>
                      No exact contact changes available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}
