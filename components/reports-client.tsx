"use client";

import { useEffect, useState } from "react";
import { RecentBaptismStageChart } from "@/components/charts/recent-baptism-stage-chart";
import { RecentBaptismPathBrowser } from "@/components/recent-baptism-path-browser";
import { RecentBaptismUnitHeatmap } from "@/components/recent-baptism-unit-heatmap";
import { ReportsBrowser } from "@/components/reports-browser";

type ReportsPayload = Awaited<ReturnType<typeof import("@/lib/dashboardData").loadReportsPageData>>;

export function ReportsClient() {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load reports (${response.status})`);
        }

        const payload = (await response.json()) as ReportsPayload;
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reports");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        Reports failed to load. {error}
      </section>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Baptism Follow-Up</h2>
            <p className="text-sm text-slate-600">Loading report data…</p>
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
        </section>
        <div className="h-[120rem] animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      </div>
    );
  }

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
    </>
  );
}
