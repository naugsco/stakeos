export const dynamic = "force-dynamic";

import { ReportsContent } from "@/components/reports-content";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageDataBySource, loadReportsPageShellDataBySource } from "@/lib/dashboardData";

export default async function ReportsPage() {
  const shellData = await loadReportsPageShellDataBySource();
  const overview = shellData.overview;
  const reportsData = await loadReportsPageDataBySource();
  const reportSections = [
    { id: "recent-baptism-follow-up", label: "Recent Baptism Follow-Up" },
    { id: "temple-and-covenants", label: "Temple And Covenants" },
    { id: "youth-and-formation", label: "Youth And Formation" },
    { id: "ministering-and-household-care", label: "Ministering And Household Care" },
    { id: "growth-and-leadership", label: "Growth And Leadership" },
    { id: "recommend-expiration-risk-list", label: "Recommend Expiration Risk" },
    { id: "temple-recommend-list", label: "Temple Recommend Attention" },
    { id: "seminary-institute-list", label: "Seminary/Institute By Unit" },
    { id: "ministering-gap-list", label: "Ministering Gap List" },
    { id: "household-outreach-list", label: "Household Outreach" },
    { id: "recent-baptisms-list", label: "Recent Baptisms" },
    { id: "new-returning-strengthening", label: "New/Returning Strengthening" },
    { id: "priesthood-progression-list", label: "Priesthood Progression" }
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
          <div className="sticky top-24 rounded-[28px] border border-amber-900/10 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Reports Index</div>
            <p className="mt-2 text-sm text-slate-600">
              Jump directly to the report family or drill-down section you need.
            </p>
            <nav className="mt-5 space-y-2">
              {reportSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-2xl border border-transparent bg-[#fffaf0] px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-amber-300 hover:bg-white"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <ReportsContent data={reportsData} />
        </div>
      </div>
    </div>
  );
}
