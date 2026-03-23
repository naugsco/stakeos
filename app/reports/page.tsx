export const dynamic = "force-dynamic";

import { RecentBaptismStageChart } from "@/components/charts/recent-baptism-stage-chart";
import { RecentBaptismPathBrowser } from "@/components/recent-baptism-path-browser";
import { RecentBaptismUnitHeatmap } from "@/components/recent-baptism-unit-heatmap";
import { ReportsBrowser } from "@/components/reports-browser";
import { StatCard } from "@/components/stat-card";
import { loadReportsPageData } from "@/lib/dashboardData";

export default async function ReportsPage() {
  const data = await loadReportsPageData();
  const missionEligibleMen = data.missionEligible.filter((row) => /^(m|male)$/i.test(row.gender ?? "")).length;
  const missionEligibleWomen = data.missionEligible.filter((row) => /^(f|female)$/i.test(row.gender ?? "")).length;

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
        <StatCard
          label="Mission Eligible (18-25)"
          value={Number.parseInt(data.overview.missionEligible, 10)}
          hint={`Men ${missionEligibleMen} · Women ${missionEligibleWomen}`}
        />
        <StatCard label="Seminary Attending" value={Number.parseInt(data.overview.seminaryAttending, 10)} />
        <StatCard label="Institute Attending" value={Number.parseInt(data.overview.instituteAttending, 10)} />
        <StatCard label="Temple Recommend Active" value={Number.parseInt(data.overview.activeTempleRecommend, 10)} />
        <StatCard label="Converts (12 months)" value={Number.parseInt(data.overview.convertsLast12Months, 10)} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Baptism Follow-Up</h2>
          <p className="text-sm text-slate-600">
            Keep the baptized-last-24-months cohort together at the top. This section shows stage readiness, unit comparison, and the member list in one follow-up flow.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Recent Baptism Readiness Stages</h3>
          <p className="mb-2 text-xs text-slate-600">
            Cohort = members baptized in the last 24 months. Each stage shows how much of that cohort currently has an active recommend, a current calling, assigned ministers, and is assigned as a minister.
          </p>
          <RecentBaptismStageChart rows={data.recentBaptismPathCohort} />
        </div>

        <RecentBaptismUnitHeatmap rows={data.recentBaptismPathCohort} />

        <RecentBaptismPathBrowser rows={data.recentBaptismPathCohort} />
      </section>

      <ReportsBrowser
        unitHealth={data.unitHealth}
        leadershipTenure={data.leadershipTenure}
        recentMoveIns={data.recentMoveIns}
        templeRecommendHealth={data.templeRecommendHealth}
        seminaryInstituteByUnit={data.seminaryInstituteByUnit}
        newReturningStrengthening={data.newReturningStrengthening}
        priesthoodProgression={data.priesthoodProgression}
        recentBaptisms={data.recentBaptisms}
        recommendExpirationRisk={data.recommendExpirationRisk}
        ministeringGaps={data.ministeringGaps}
        seminaryInstituteOpportunity={data.seminaryInstituteOpportunity}
        householdOutreach={data.householdOutreach}
        covenantPathProgression={data.covenantPathProgression}
      />
    </div>
  );
}
