export const dynamic = "force-dynamic";

import { ReportsContent } from "@/components/reports-content";
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
          <div className="sticky top-24 rounded-[28px] border border-amber-900/10 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Reports Index</div>
            <p className="mt-2 text-sm text-slate-600">
              Jump by report family instead of scanning the entire page top to bottom.
            </p>
            <div className="mt-5 space-y-5">
              {reportGroups.map((group) => (
                <div key={group.heading}>
                  <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.heading}</div>
                  <nav className="mt-2 space-y-2">
                    {group.items.map((section) => (
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
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <ReportsContent data={reportsData} />
        </div>
      </div>
    </div>
  );
}
