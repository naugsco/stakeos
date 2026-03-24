export const dynamic = "force-dynamic";

import Link from "next/link";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { StatCard } from "@/components/stat-card";
import { UnitHealthRadarPanel } from "@/components/unit-health-radar-panel";
import { loadStakeOverviewPageDataBySource } from "@/lib/dashboardData";

const formatChangedFields = (changedFields: string[]) => (changedFields.length > 0 ? changedFields.join(", ") : "-");

const syncCoverageHint = (status: string, readyLabel: string) => {
  if (status === "ready") {
    return readyLabel;
  }
  if (status === "baseline-established") {
    return "Baseline captured. Exact diffs appear after the next sync.";
  }
  return "No snapshot baseline yet. Run the baseline seed or the next sync.";
};

export default async function StakeOverviewPage({ searchParams }: { searchParams?: { source?: string } }) {
  const source = searchParams?.source === "postgres" ? "postgres" : "sqlite";
  const data = await loadStakeOverviewPageDataBySource(source);
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stake Overview</h1>
          <p className="text-sm text-slate-600">{source === "sqlite" ? "SQLite-backed overview with exact sync-diff snapshots." : "PostgreSQL-backed overview with exact sync-diff history."}</p>
        </div>
        <Link href={source === "sqlite" ? "/stake-overview?source=postgres" : "/stake-overview"} className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50">
          {source === "sqlite" ? "Switch To PostgreSQL Overview" : "Switch To SQLite Overview"}
        </Link>
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
