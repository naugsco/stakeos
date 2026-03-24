export const dynamic = "force-dynamic";

import Link from "next/link";
import { ReportsClient } from "@/components/reports-client";
import { ReportsContent } from "@/components/reports-content";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageDataBySource, loadReportsPageShellDataBySource } from "@/lib/dashboardData";

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: { source?: string };
}) {
  const source = searchParams?.source === "sqlite" ? "sqlite" : "postgres";
  const shellData = await loadReportsPageShellDataBySource(source);
  const isSqlite = source === "sqlite";
  const overview = shellData.overview;
  const sqliteData = isSqlite ? await loadReportsPageDataBySource("sqlite") : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-slate-600">
            {isSqlite
              ? "SQLite-backed reports view. All report families on this page are now running through the SQLite spike data path."
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

      {isSqlite && sqliteData ? <ReportsContent data={sqliteData} source="sqlite" /> : <ReportsClient />}
    </div>
  );
}
