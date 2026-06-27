export const dynamic = "force-dynamic";

import Link from "next/link";
import { BarMetricsChart } from "@/components/charts/bar-metrics-chart";
import { ComparisonBarMetricsChart } from "@/components/charts/comparison-bar-metrics-chart";
import { DashboardOverviewCards } from "@/components/dashboard-overview-cards";
import { DashboardUnitSelect } from "@/components/dashboard-unit-select";
import { LineTrendChart } from "@/components/charts/line-trend-chart";
import { MinisteringCoverageUnitChart } from "@/components/charts/ministering-coverage-unit-chart";
import { loadDashboardDataBySource } from "@/lib/dashboardData";

type DashboardView = "overview" | "action-needed" | "trends";
type DashboardMode = "stake" | "unit-leader";

const normalizeView = (value?: string): DashboardView => {
  if (value === "action-needed" || value === "trends") {
    return value;
  }
  return "overview";
};

const normalizeMode = (value?: string): DashboardMode => {
  if (value === "unit-leader") {
    return value;
  }
  return "stake";
};

const buildHref = ({
  unit,
  view,
  mode
}: {
  unit: string | null;
  view: DashboardView;
  mode: DashboardMode;
}) => {
  const params = new URLSearchParams();
  if (unit) {
    params.set("unit", unit);
  }
  if (view !== "overview") {
    params.set("view", view);
  }
  if (mode !== "stake") {
    params.set("mode", mode);
  }

  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { unit?: string; view?: string; mode?: string };
}) {
  const selectedUnit = searchParams?.unit?.trim() ? searchParams.unit.trim() : null;
  const selectedView = normalizeView(searchParams?.view);
  const selectedMode = normalizeMode(searchParams?.mode);
  const data = await loadDashboardDataBySource(selectedUnit);

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
  const missionReadyCount = data.missionReadiness.summary.find((row) => row.label === "Ready")?.value ?? 0;
  const missionProgressingCount = data.missionReadiness.summary.find((row) => row.label === "Progressing")?.value ?? 0;
  const missionPipelineCount = missionReadyCount + missionProgressingCount;

  const viewLinks: Array<{ id: DashboardView; label: string; description: string }> = [
    { id: "overview", label: "Overview", description: "Core health snapshot" },
    { id: "action-needed", label: "Action Needed", description: "Immediate follow-up lists" },
    { id: "trends", label: "Trends", description: "Formation and leadership patterns" }
  ];

  const modeLinks: Array<{ id: DashboardMode; label: string; description: string }> = [
    { id: "stake", label: "Stake View", description: "Full stake operations" },
    { id: "unit-leader", label: "Unit Leader Mode", description: "Bishopric and ward council focus" }
  ];

  const freshnessTone =
    data.daysSinceLastSync === null
      ? "border-slate-200 bg-white"
      : data.daysSinceLastSync >= 7
        ? "border-rose-400 bg-rose-50/90 ring-1 ring-rose-300"
        : data.daysSinceLastSync >= 2
          ? "border-amber-300 bg-amber-50/90"
          : "border-emerald-200 bg-emerald-50/70";

  const freshnessTextTone =
    data.daysSinceLastSync === null
      ? "text-slate-900"
      : data.daysSinceLastSync >= 7
        ? "text-rose-800"
        : data.daysSinceLastSync >= 2
          ? "text-amber-900"
          : "text-slate-900";

  const freshnessCaption =
    data.daysSinceLastSync === null
      ? "No successful LCR sync recorded yet."
      : data.daysSinceLastSync >= 7
        ? "LCR data is more than a week old. Manual update is needed."
        : data.daysSinceLastSync >= 2
          ? "LCR data is getting stale. A manual update is recommended."
          : "LCR data is current.";

  return (
    <div className="space-y-6">
      <header className="space-y-4 rounded-panel-lg border border-line bg-white/95 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">StakeOS Dashboard</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Leadership Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              {selectedMode === "unit-leader"
                ? "A tighter view for bishoprics and ward councils."
                : "Operational snapshot from the local StakeOS intelligence database."}
              {data.selectedUnit ? ` Scoped to ${data.selectedUnit}.` : " Scoped to the entire stake."}
            </p>
          </div>

          <div className={`shrink-0 self-end rounded-2xl border px-4 py-2.5 shadow-sm transition ${freshnessTone} lg:max-w-[18rem]`}>
            <p className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Days Since Last LCR Sync</p>
            <div className="mt-1.5 flex items-end justify-end gap-3 text-right">
              <div className={`text-3xl font-semibold leading-none ${freshnessTextTone}`}>
                {data.daysSinceLastSync === null ? "n/a" : data.daysSinceLastSync}
              </div>
              <div className="min-w-0">
                <p className={`text-xs ${data.daysSinceLastSync !== null && data.daysSinceLastSync >= 7 ? "text-rose-700" : data.daysSinceLastSync !== null && data.daysSinceLastSync >= 2 ? "text-amber-700" : "text-slate-500"}`}>
                  {freshnessCaption}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {data.overview.latestSync?.completedAt
                    ? new Date(data.overview.latestSync.completedAt).toLocaleString()
                    : "No successful sync recorded"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
          <div className="min-w-0 rounded-panel border border-line bg-panel-warm px-5 py-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sections</span>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {viewLinks.map((link) => {
                  const active = selectedView === link.id;
                  return (
                    <Link
                      key={link.id}
                      href={buildHref({ unit: selectedUnit, view: link.id, mode: selectedMode })}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition ${
                        active
                          ? "border-teal-300 bg-teal-50 text-teal-900"
                          : "border-line bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-panel border border-line bg-panel-warm px-5 py-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start">
              <span className="pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Display</span>
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {modeLinks.map((link) => {
                    const active = selectedMode === link.id;
                    return (
                      <Link
                        key={link.id}
                        href={buildHref({ unit: selectedUnit, view: selectedView, mode: link.id })}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm transition ${
                          active
                            ? "border-teal-300 bg-teal-50 text-teal-900"
                            : "border-line bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ward / Branch Scope</div>
                  <DashboardUnitSelect units={data.availableUnits} selectedUnit={data.selectedUnit} compact hideLabel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <DashboardOverviewCards
        overview={{
          totalMembers: data.overview.totalMembers,
          currentCallings: data.overview.currentCallings,
          recommendActive: recommendMap.Active ?? 0,
          missionReady: missionPipelineCount,
          recentBaptismsThisYear: data.recentBaptisms.summary.find((row) => row.label === "This Year")?.value ?? 0
        }}
        recommendRecovered={data.newReturningStrengthening.summary.find((row) => row.label === "Recommend Recovered (1y+)")?.value ?? 0}
        missionReadyLabel="Mission Pipeline"
        missionReadyHint={`Ready ${missionReadyCount} · Progressing ${missionProgressingCount}`}
      />

      {selectedMode === "unit-leader" && !selectedUnit ? (
        <section className="rounded-panel border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
          <h2 className="font-serif text-2xl text-slate-900">Choose A Ward Or Branch First</h2>
          <p className="mt-2 leading-6">
            Unit Leader Mode is meant for bishoprics and ward councils. Use the ward or branch scope picker in the display-mode card, then StakeOS will reduce the page to the most useful follow-up panels for that unit.
          </p>
        </section>
      ) : null}

      {selectedMode === "unit-leader" && selectedUnit ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ward Council Focus</h2>
            <p className="text-sm text-slate-600">This view keeps only the follow-up panels most useful in a unit council setting.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Recommend Expiration Risk</h3>
              <p className="mb-2 text-xs text-slate-600">Expired and next-90-day recommend follow-up for the selected unit.</p>
              <BarMetricsChart data={data.recommendExpirationRisk.summary} href="/reports#recommend-expiration-risk-list" linkLabel="Open expiration list" title="Recommend Expiration Risk" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Mission Readiness (Age 17-25)</h3>
              <p className="mb-2 text-xs text-slate-600">Preparation and readiness signal for upcoming and current mission-age members.</p>
              <BarMetricsChart data={data.missionReadiness.summary} href="/youth#mission-youth-pipeline" linkLabel="Open mission/youth list" title="Mission Readiness (Age 17-25)" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Youth / YSA Progression</h3>
              <p className="mb-2 text-xs text-slate-600">Age-band distribution across youth and YSA progression for the selected unit.</p>
              <BarMetricsChart data={data.youth.map((item) => ({ label: item.ageBand, value: item.count }))} href="/youth" linkLabel="Open youth lists" title="Youth / YSA Progression" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Recent Baptisms</h3>
              <p className="mb-2 text-xs text-slate-600">Recent convert cohort activity and follow-up for the selected unit.</p>
              <BarMetricsChart data={data.recentBaptisms.summary} href="/reports#recent-baptisms-list" linkLabel="Open baptism list" title="Recent Baptisms" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Ministering Coverage</h3>
              <p className="mb-2 text-xs text-slate-600">Coverage categories for the selected unit.</p>
              <MinisteringCoverageUnitChart data={data.ministeringCoverageByUnit} href="/reports#ministering-gap-list" linkLabel="Open ministering gaps" title="Ministering Coverage by Unit" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Household Outreach Opportunities</h3>
              <p className="mb-2 text-xs text-slate-600">Households flagged for youth, recommend, recent baptism, or ministering follow-up.</p>
              <BarMetricsChart data={data.householdOutreach.summary} href="/reports#household-outreach-list" linkLabel="Open household outreach list" title="Household Outreach Opportunities" />
            </div>
          </div>
        </section>
      ) : null}

      {selectedMode === "stake" && selectedView === "overview" ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Temple Recommend Health</h3>
            <p className="mb-2 text-xs text-slate-600">{recommendHistoryNote}</p>
            <BarMetricsChart data={data.templeRecommendHealth.statusCounts} href="/reports#temple-recommend-list" linkLabel="Open recommend list" title="Temple Recommend Health" />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold">Mission Readiness Composite (Age 17-25)</h3>
            <p className="mb-2 text-xs text-slate-600">Score = Active recommend + seminary/institute participation + endowed at 18+.</p>
            <p className="mb-2 text-xs font-medium text-slate-600">{missionGenderNote}</p>
            <BarMetricsChart data={data.missionReadiness.summary} href="/youth#mission-youth-pipeline" linkLabel="Open mission/youth list" title="Mission Readiness (Age 17-25)" />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold">Household Outreach Opportunities</h3>
            <p className="mb-2 text-xs text-slate-600">Households flagged for youth, recent baptisms, recommend risk, or ministering follow-up.</p>
            <BarMetricsChart data={data.householdOutreach.summary} href="/reports#household-outreach-list" linkLabel="Open household outreach list" title="Household Outreach Opportunities" />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold">Recent Baptisms</h3>
            <p className="mb-2 text-xs text-slate-600">Current baptism and early retention snapshot.</p>
            <BarMetricsChart data={data.recentBaptisms.summary} href="/reports#recent-baptisms-list" linkLabel="Open baptism list" title="Recent Baptisms" />
          </div>
        </section>
      ) : null}

      {selectedMode === "stake" && selectedView === "action-needed" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Action Needed</h2>
            <p className="text-sm text-slate-600">These are the panels most likely to turn into immediate bishopric, ward council, or stake follow-up.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Recommend Expiration Risk</h3>
              <p className="mb-2 text-xs text-slate-600">Expired and next-90-day expiration risk based on recommend expiration dates.</p>
              <BarMetricsChart data={data.recommendExpirationRisk.summary} href="/reports#recommend-expiration-risk-list" linkLabel="Open expiration list" title="Recommend Expiration Risk" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Mission Readiness Composite (Age 17-25)</h3>
              <p className="mb-2 text-xs text-slate-600">Preparation view that keeps 17-year-olds visible before formal eligibility at 18.</p>
              <BarMetricsChart data={data.missionReadiness.summary} href="/youth#mission-youth-pipeline" linkLabel="Open mission/youth list" title="Mission Readiness (Age 17-25)" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Ministering Coverage by Unit</h3>
              <p className="mb-2 text-xs text-slate-600">No ministers, brothers only, sisters only, or both assigned.</p>
              <MinisteringCoverageUnitChart data={data.ministeringCoverageByUnit} href="/reports#ministering-gap-list" linkLabel="Open ministering gaps" title="Ministering Coverage by Unit" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Household Outreach Opportunities</h3>
              <p className="mb-2 text-xs text-slate-600">Households flagged for youth, recent baptisms, recommend risk, or ministering follow-up.</p>
              <BarMetricsChart data={data.householdOutreach.summary} href="/reports#household-outreach-list" linkLabel="Open household outreach list" title="Household Outreach Opportunities" />
            </div>
          </div>
        </section>
      ) : null}

      {selectedMode === "stake" && selectedView === "trends" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Trends</h2>
            <p className="text-sm text-slate-600">Longer-horizon formation, growth, and leadership patterns belong here instead of in the action queue.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-semibold">Youth / YSA Progression</h3>
              <p className="mb-2 text-xs text-slate-600">Age-band distribution across the combined youth and YSA pipeline.</p>
              <BarMetricsChart data={data.youth.map((item) => ({ label: item.ageBand, value: item.count }))} href="/youth" linkLabel="Open youth lists" title="Youth / YSA Progression" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Leadership Turnover</h3>
              <LineTrendChart data={data.turnover} variant="turnover" title="Leadership Turnover" />
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
                title="Seminary Participation by Unit"
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
                title="Institute Participation by Unit"
              />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">New/Returning Strengthening Focus</h3>
              <BarMetricsChart data={data.newReturningStrengthening.summary} href="/reports#new-returning-strengthening" linkLabel="Open strengthening list" title="New/Returning Strengthening Focus" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Priesthood Progression Pipeline</h3>
              <BarMetricsChart data={data.priesthoodProgression.summary} href="/reports#priesthood-progression-list" linkLabel="Open progression list" title="Priesthood Progression Pipeline" />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
