export const dynamic = "force-dynamic";

import { ReportsContent } from "@/components/reports-content";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageDataBySource, loadReportsPageShellDataBySource } from "@/lib/dashboardData";

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  void searchParams;
  const shellData = await loadReportsPageShellDataBySource("sqlite");
  const overview = shellData.overview;
  const reportsData = await loadReportsPageDataBySource("sqlite");

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-slate-600">
            Drill-down lists and operational tables behind the dashboard metrics. Charts live on Dashboard; this page is for sorting, scanning, and follow-up.
          </p>
        </div>
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

      <ReportsContent data={reportsData} />
    </div>
  );
}
