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
          <RecentBaptismStageChart rows={data.recentBaptismPathCohort} href={recentBaptismHref} />
        </div>

        <RecentBaptismUnitHeatmap rows={data.recentBaptismPathCohort} />

        <RecentBaptismPathBrowser rows={data.recentBaptismPathCohort} source="sqlite" />
      </section>

      <ReportsBrowser
        source="sqlite"
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
