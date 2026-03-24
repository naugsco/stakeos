export const dynamic = "force-dynamic";

import { BarMetricsChart } from "@/components/charts/bar-metrics-chart";
import { ComparisonBarMetricsChart } from "@/components/charts/comparison-bar-metrics-chart";
import { MinisteringCoverageUnitChart } from "@/components/charts/ministering-coverage-unit-chart";
import { StatCard } from "@/components/stat-card";
import { loadSqliteSpikeDashboardData } from "@/src/sqlite-spike/queries";

export default async function SqliteSpikePage() {
  const data = await loadSqliteSpikeDashboardData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">SQLite Spike</h1>
        <p className="text-sm text-slate-600">
          Experimental parallel dashboard backed by SQLite. This does not replace the main PostgreSQL app path.
        </p>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Members" value={data.overview.totalMembers} />
        <StatCard label="Current Callings" value={data.overview.currentCallings} />
        <StatCard label="Recommend Active" value={data.overview.recommendActive} />
        <StatCard label="Mission Ready" value={data.overview.missionReady} />
        <StatCard label="Recent Baptisms This Year" value={data.overview.recentBaptismsThisYear} />
      </section>

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
