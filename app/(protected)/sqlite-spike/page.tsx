export const dynamic = "force-dynamic";

import { BarMetricsChart } from "@/components/charts/bar-metrics-chart";
import { ComparisonBarMetricsChart } from "@/components/charts/comparison-bar-metrics-chart";
import { DashboardOverviewCards } from "@/components/dashboard-overview-cards";
import { MinisteringCoverageUnitChart } from "@/components/charts/ministering-coverage-unit-chart";
import { loadSqliteSpikeDashboardData } from "@/src/sqlite-spike/queries";
import Link from "next/link";

export default async function SqliteSpikePage() {
  const data = await loadSqliteSpikeDashboardData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">SQLite Spike</h1>
        <p className="text-sm text-slate-600">
          Experimental parallel dashboard backed by SQLite. This does not replace the main PostgreSQL app path.
        </p>
        <div className="mt-3">
          <Link
            href="/sqlite-spike/compare"
            className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50"
          >
            Open SQLite vs PostgreSQL Comparison
          </Link>
          <Link
            href="/members?source=sqlite"
            className="ml-3 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Open SQLite Members
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">SQLite Spike Database</p>
        <p className="mt-1 break-all font-mono text-sm text-slate-800">{data.status.dbPath}</p>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <p>Exists: {data.status.exists ? "Yes" : "No"}</p>
          <p>Members Loaded: {data.status.members}</p>
          <p>Last Successful Sync: {data.status.latestSyncCompletedAt ? new Date(data.status.latestSyncCompletedAt).toLocaleString() : "None"}</p>
        </div>
        {!data.status.exists || data.status.members === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Run <code>npm run sqlite:spike:sync</code> to populate the SQLite spike database from a fresh LCR scrape.
          </div>
        ) : null}
      </section>

      <DashboardOverviewCards
        overview={data.overview}
        showRecommendRecovered={false}
        missionReadyHint="SQLite-backed summary cards using the shared overview abstraction."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Temple Recommend Health</h2>
          <BarMetricsChart data={data.templeRecommendHealth} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Mission Readiness Composite</h2>
          <BarMetricsChart data={data.missionReadiness} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Recent Baptisms</h2>
          <BarMetricsChart data={data.recentBaptisms} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Recommend Expiration Risk</h2>
          <BarMetricsChart data={data.recommendExpirationRisk} />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Seminary Participation By Unit</h2>
          <ComparisonBarMetricsChart
            data={data.seminaryByUnit}
            actualLabel="Seminary Attending"
            potentialLabel="Seminary Eligible"
          />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold">Institute Participation By Unit</h2>
          <ComparisonBarMetricsChart
            data={data.instituteByUnit}
            actualLabel="Institute Attending"
            potentialLabel="Institute Eligible"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Ministering Coverage By Unit</h2>
        <MinisteringCoverageUnitChart data={data.ministeringCoverageByUnit} />
      </section>
    </div>
  );
}
