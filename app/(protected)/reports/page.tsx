export const dynamic = "force-dynamic";

import { ReportsClient } from "@/components/reports-client";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageShellData } from "@/lib/dashboardData";

export default async function ReportsPage() {
  const data = await loadReportsPageShellData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-600">
          Drill-down lists and operational tables behind the dashboard metrics. Charts live on Dashboard; this page is
          for sorting, scanning, and follow-up.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Members" value={Number.parseInt(data.overview.totalMembers, 10)} />
        <StatCard label="Units Represented" value={Number.parseInt(data.overview.unitsRepresented, 10)} />
        <StatCard label="Leadership Callings" value={Number.parseInt(data.overview.leadershipCallings, 10)} />
        <StatCard label="Mission Eligible (18-25)" value={Number.parseInt(data.overview.missionEligible, 10)} />
        <StatCard label="Seminary Attending" value={Number.parseInt(data.overview.seminaryAttending, 10)} />
        <StatCard label="Institute Attending" value={Number.parseInt(data.overview.instituteAttending, 10)} />
        <StatCard label="Temple Recommend Active" value={Number.parseInt(data.overview.activeTempleRecommend, 10)} />
        <StatCard label="Converts (12 months)" value={Number.parseInt(data.overview.convertsLast12Months, 10)} />
      </section>

      <ReportsClient />
    </div>
  );
}
