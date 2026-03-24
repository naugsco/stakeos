export const dynamic = "force-dynamic";

import { BarMetricsChart } from "@/components/charts/bar-metrics-chart";
import { ComparisonBarMetricsChart } from "@/components/charts/comparison-bar-metrics-chart";
import { DashboardOverviewCards } from "@/components/dashboard-overview-cards";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { MinisteringCoverageUnitChart } from "@/components/charts/ministering-coverage-unit-chart";
import { SyncControlPanel } from "@/components/sync-control-panel";
import { loadDashboardData } from "@/lib/dashboardData";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { unit?: string };
}) {
  const selectedUnit = searchParams?.unit?.trim() ? searchParams.unit.trim() : null;
  const data = await loadDashboardData(selectedUnit);
  const recommendMap = data.templeRecommendHealth.statusCounts.reduce<Record<string, number>>((acc, row) => {
    acc[row.label] = row.value;
    return acc;
  }, {});
  const seminaryByUnit = [...data.seminaryInstituteByUnit]
    .sort((left, right) => right.seminaryEligible - left.seminaryEligible)
    .slice(0, 11)
    .map((row) => ({ label: row.unitName, actual: row.seminaryAttending, potential: row.seminaryEligible }));
  const instituteByUnit = [...data.seminaryInstituteByUnit]
    .sort((left, right) => right.instituteEligible - left.instituteEligible)
    .slice(0, 11)
    .map((row) => ({ label: row.unitName, actual: row.instituteAttending, potential: row.instituteEligible }));
  const recommendHistoryNote = data.templeRecommendHealth.trackingSince
    ? `History tracking since ${new Date(data.templeRecommendHealth.trackingSince).toLocaleDateString()} (${data.templeRecommendHealth.daysTracked} days tracked).`
    : "History tracking has not started yet. Run a full sync to begin.";
  const missionGenderNote = `Men: ${data.missionGenderBreakdown.menEligible} eligible, ${data.missionGenderBreakdown.menReady} ready. Women: ${data.missionGenderBreakdown.womenEligible} eligible, ${data.missionGenderBreakdown.womenReady} ready.`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Leadership Dashboard</h1>
        <p className="text-sm text-slate-600">
          Operational snapshot from local StakeOS intelligence database.
          {data.selectedUnit ? ` Scoped to ${data.selectedUnit}.` : " Scoped to the entire stake."}
        </p>
      </header>

      <DashboardOverviewCards
        overview={{
          totalMembers: data.overview.totalMembers,
          currentCallings: data.overview.currentCallings,
          recommendActive: recommendMap.Active ?? 0,
          missionReady: data.missionReadiness.summary.find((row) => row.label === "Ready")?.value ?? 0,
          recentBaptismsThisYear: data.recentBaptisms.summary.find((row) => row.label === "This Year")?.value ?? 0
        }}
        recommendRecovered={data.newReturningStrengthening.summary.find((row) => row.label === "Recommend Recovered (1y+)")?.value ?? 0}
        missionReadyHint={`Men ${data.missionGenderBreakdown.menReady} · Women ${data.missionGenderBreakdown.womenReady}`}
      />

      <SyncControlPanel
        daysSinceLastSync={data.daysSinceLastSync}
        latestCompletedAt={data.overview.latestSync?.completedAt ?? null}
        units={data.availableUnits}
        selectedUnit={data.selectedUnit}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Temple And Covenants</h2>
          <p className="text-sm text-slate-600">Recommend health and near-term temple follow-up should sit together because they answer the same stewardship question.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Temple Recommend Health</h3>
            <p className="mb-2 text-xs text-slate-600">{recommendHistoryNote}</p>
            <BarMetricsChart
              data={data.templeRecommendHealth.statusCounts}
              href="/reports#temple-recommend-list"
              linkLabel="Open recommend list"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Recommend Expiration Risk</h3>
            <p className="mb-2 text-xs text-slate-600">Expired and next-90-day expiration risk based on explicit recommend expiration dates.</p>
            <BarMetricsChart
              data={data.recommendExpirationRisk.summary}
              href="/reports#recommend-expiration-risk-list"
              linkLabel="Open expiration list"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Youth, Mission, And Formation</h2>
          <p className="text-sm text-slate-600">Mission readiness, cohort progression, and seminary or institute participation belong together because they describe the same pipeline.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Mission Readiness Composite (Age 17-25)</h3>
            <p className="mb-2 text-xs text-slate-600">
              Score = Active recommend (1) + seminary/institute participation (1) + endowed at 18+ (1). This preparation view includes age 17 so upcoming candidates can be monitored before formal mission eligibility at 18.
            </p>
            <p className="mb-2 text-xs font-medium text-slate-500">{missionGenderNote}</p>
            <BarMetricsChart
              data={data.missionReadiness.summary}
              href="/youth#mission-youth-pipeline"
              linkLabel="Open mission/youth list"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Youth / YSA Progression</h3>
            <p className="mb-2 text-xs text-slate-600">Age-band distribution across the combined youth and young single adult pipeline.</p>
            <BarMetricsChart
              data={data.youth.map((item) => ({
                label: item.ageBand,
                value: item.count
              }))}
              href="/youth"
              linkLabel="Open youth lists"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Seminary Participation by Unit</h3>
            <p className="mb-2 text-xs text-slate-600">Teal = attending now, amber = eligible population.</p>
            <ComparisonBarMetricsChart
              data={seminaryByUnit}
              href="/youth#seminary-opportunity-list"
              linkLabel="Open seminary opportunity list"
              actualLabel="Seminary Attending"
              potentialLabel="Seminary Eligible"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Institute Participation by Unit</h3>
            <p className="mb-2 text-xs text-slate-600">Teal = attending now, amber = eligible population.</p>
            <ComparisonBarMetricsChart
              data={instituteByUnit}
              href="/reports#seminary-institute-opportunity-list"
              linkLabel="Open institute opportunity list"
              actualLabel="Institute Attending"
              potentialLabel="Institute Eligible"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ministering And Household Care</h2>
          <p className="text-sm text-slate-600">These panels are operational follow-up tools. They should sit together because both point to care coverage and outreach need.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Ministering Coverage by Unit</h3>
            <p className="mb-2 text-xs text-slate-600">
              Each unit bar shows active members with no assigned ministers, brothers only, sisters only, or both assigned.
            </p>
            <MinisteringCoverageUnitChart
              data={data.ministeringCoverageByUnit}
              href="/reports#ministering-gap-list"
              linkLabel="Open ministering gaps"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-lg font-semibold">Household Outreach Opportunities</h3>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600"
                title="Households appear here if they have at least one youth-program member age 12-18, a YSA age 18-35, a baptism in the last 12 months, a temple recommend expiring within 90 days, or a member with no ministering assigned."
              >
                i
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-600">Households flagged for youth, recent baptisms, recommend risk, or ministering follow-up.</p>
            <BarMetricsChart
              data={data.householdOutreach.summary}
              href="/reports#household-outreach-list"
              linkLabel="Open household outreach list"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Growth And Leadership</h2>
          <p className="text-sm text-slate-600">Baptisms, retention, leadership churn, and priesthood progression are the stake-level trend panels rather than immediate operational queues.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Recent Baptisms</h3>
            <BarMetricsChart
              data={data.recentBaptisms.summary}
              href="/reports#recent-baptisms-list"
              linkLabel="Open baptism list"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">New/Returning Strengthening Focus</h3>
            <BarMetricsChart
              data={data.newReturningStrengthening.summary}
              href="/reports#new-returning-strengthening"
              linkLabel="Open strengthening list"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Priesthood Progression Pipeline</h3>
            <BarMetricsChart
              data={data.priesthoodProgression.summary}
              href="/reports#priesthood-progression-list"
              linkLabel="Open progression list"
            />
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">Leadership Turnover</h3>
            <LineTrendChart data={data.turnover} variant="turnover" />
          </div>
        </div>
      </section>
    </div>
  );
}
