"use client";

import { RecentBaptismStageChart } from "@/components/charts/recent-baptism-stage-chart";
import { RecentBaptismPathBrowser } from "@/components/recent-baptism-path-browser";
import { RecentBaptismUnitHeatmap } from "@/components/recent-baptism-unit-heatmap";
import { ReportsBrowser } from "@/components/reports-browser";
interface ReportsContentData {
  unitHealth: React.ComponentProps<typeof ReportsBrowser>["unitHealth"];
  leadershipTenure: React.ComponentProps<typeof ReportsBrowser>["leadershipTenure"];
  recentMoveIns: React.ComponentProps<typeof ReportsBrowser>["recentMoveIns"];
  templeRecommendHealth: React.ComponentProps<typeof ReportsBrowser>["templeRecommendHealth"];
  seminaryInstituteByUnit: React.ComponentProps<typeof ReportsBrowser>["seminaryInstituteByUnit"];
  newReturningStrengthening: React.ComponentProps<typeof ReportsBrowser>["newReturningStrengthening"];
  priesthoodProgression: React.ComponentProps<typeof ReportsBrowser>["priesthoodProgression"];
  recentBaptisms: React.ComponentProps<typeof ReportsBrowser>["recentBaptisms"];
  recommendExpirationRisk: React.ComponentProps<typeof ReportsBrowser>["recommendExpirationRisk"];
  ministeringGaps: React.ComponentProps<typeof ReportsBrowser>["ministeringGaps"];
  seminaryInstituteOpportunity: React.ComponentProps<typeof ReportsBrowser>["seminaryInstituteOpportunity"];
  householdOutreach: React.ComponentProps<typeof ReportsBrowser>["householdOutreach"];
  covenantPathProgression: React.ComponentProps<typeof ReportsBrowser>["covenantPathProgression"];
  recentBaptismPathCohort: React.ComponentProps<typeof RecentBaptismPathBrowser>["rows"];
}

export function ReportsContent({
  data
}: {
  data: ReportsContentData;
}) {
  const recentBaptismHref = "/reports#recent-baptism-path-list";

  return (
    <>
      <section id="recent-baptism-follow-up" className="scroll-mt-32 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent Baptism Follow-Up</h2>
          <p className="text-sm text-slate-600">
            Keep the baptized-last-24-months cohort together at the top. This section shows stage readiness, unit comparison, and the member list in one follow-up flow.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Recent Baptism Readiness Stages</h2>
            <p className="text-xs text-slate-600">
              Cohort = members baptized in the last 24 months. Each stage shows how much of that cohort currently has an active recommend, a current calling, assigned ministers, and is assigned as a minister.
            </p>
          </header>
          <div className="p-4">
            <RecentBaptismStageChart rows={data.recentBaptismPathCohort} href={recentBaptismHref} />
          </div>
        </section>

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
    </>
  );
}
