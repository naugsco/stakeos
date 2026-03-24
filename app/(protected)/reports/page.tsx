export const dynamic = "force-dynamic";

import Link from "next/link";
import { BarMetricsChart } from "@/components/charts/bar-metrics-chart";
import { ReportsClient } from "@/components/reports-client";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageShellDataBySource } from "@/lib/dashboardData";

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: { source?: string };
}) {
  const source = searchParams?.source === "sqlite" ? "sqlite" : "postgres";
  const data = await loadReportsPageShellDataBySource(source);
  const isSqlite = source === "sqlite";
  const overview = data.overview;
  const sqliteSummaries = data.sqliteSummaries;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-slate-600">
            {isSqlite
              ? "SQLite-backed reports shell. Summary metrics are live; detailed drill-down tables are not yet ported on this branch."
              : "Drill-down lists and operational tables behind the dashboard metrics. Charts live on Dashboard; this page is for sorting, scanning, and follow-up."}
          </p>
        </div>
        <Link
          href={isSqlite ? "/reports" : "/reports?source=sqlite"}
          className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50"
        >
          {isSqlite ? "Switch To PostgreSQL Reports" : "Open SQLite Reports"}
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Members" value={Number(overview.totalMembers)} />
        <StatCard label="Units Represented" value={Number(overview.unitsRepresented)} />
        <StatCard label="Leadership Callings" value={Number(overview.leadershipCallings)} />
        <StatCard label="Mission Eligible (18-25)" value={Number(overview.missionEligible)} />
        <StatCard label="Seminary Attending" value={Number(overview.seminaryAttending)} />
        <StatCard label="Institute Attending" value={Number(overview.instituteAttending)} />
        <StatCard label="Temple Recommend Active" value={Number(overview.activeTempleRecommend)} />
        <StatCard label="Converts (12 months)" value={Number(overview.convertsLast12Months)} />
      </section>

      {isSqlite ? (
        <section className="space-y-6">
          <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Detailed report tables are still PostgreSQL-only on this spike branch. This SQLite reports mode is here to validate shell metrics and summary shapes before deeper report porting.
          </section>
          <section className="grid gap-6 lg:grid-cols-3">
            <div>
              <h2 className="mb-2 text-lg font-semibold">Temple Recommend Health</h2>
              <BarMetricsChart data={sqliteSummaries?.templeRecommendHealth ?? []} />
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Recent Baptisms</h2>
              <BarMetricsChart data={sqliteSummaries?.recentBaptisms ?? []} />
            </div>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Recommend Expiration Risk</h2>
              <BarMetricsChart data={sqliteSummaries?.recommendExpirationRisk ?? []} />
            </div>
          </section>
        </section>
      ) : (
        <ReportsClient />
      )}
    </div>
  );
}
