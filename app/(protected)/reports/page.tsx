export const dynamic = "force-dynamic";

import { ReportsContent } from "@/components/reports-content";
import { ReportsIndexNav } from "@/components/reports-index-nav";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageDataBySource, loadReportsPageShellDataBySource } from "@/lib/dashboardData";

export default async function ReportsPage() {
  const shellData = await loadReportsPageShellDataBySource();
  const overview = shellData.overview;
  const reportsData = await loadReportsPageDataBySource();
  const reportGroups = [
    {
      heading: "Follow-Up",
      items: [
        { id: "recent-baptism-follow-up", label: "Recent Baptism Follow-Up" },
        { id: "recent-baptisms-list", label: "Recent Baptisms" },
        { id: "new-returning-strengthening", label: "New/Returning Strengthening" }
      ]
    },
    {
      heading: "Temple And Covenants",
      items: [
        { id: "temple-and-covenants", label: "Temple And Covenants" },
        { id: "temple-recommend-list", label: "Temple Recommend Attention" },
        { id: "recommend-expiration-risk-list", label: "Recommend Expiration Risk" }
      ]
    },
    {
      heading: "Youth And Formation",
      items: [
        { id: "youth-and-formation", label: "Youth And Formation" },
        { id: "seminary-institute-list", label: "Seminary/Institute By Unit" },
        { id: "priesthood-progression-list", label: "Priesthood Progression" }
      ]
    },
    {
      heading: "Ministering And Household Care",
      items: [
        { id: "ministering-and-household-care", label: "Ministering And Household Care" },
        { id: "ministering-gap-list", label: "Ministering Gap List" },
        { id: "household-outreach-list", label: "Household Outreach" }
      ]
    },
    {
      heading: "Growth And Leadership",
      items: [{ id: "growth-and-leadership", label: "Growth And Leadership" }]
    }
  ];

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

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <ReportsIndexNav reportGroups={reportGroups} />
        </aside>

        <div className="min-w-0">
          <ReportsContent data={reportsData} />
        </div>
      </div>
    </div>
  );
}
