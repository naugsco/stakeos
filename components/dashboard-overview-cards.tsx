import { StatCard } from "@/components/stat-card";
import type { DashboardOverviewMetrics } from "@/src/types/dashboard";

export function DashboardOverviewCards({
  overview,
  recommendRecovered,
  showRecommendRecovered = true,
  missionReadyHint,
  missionReadyLabel = "Mission Ready"
}: {
  overview: DashboardOverviewMetrics;
  recommendRecovered?: number;
  showRecommendRecovered?: boolean;
  missionReadyHint?: string;
  missionReadyLabel?: string;
}) {
  return (
    <section className={`grid gap-4 md:grid-cols-2 ${showRecommendRecovered ? "xl:grid-cols-5" : "xl:grid-cols-5"}`}>
      <StatCard label="Total Members" value={overview.totalMembers} />
      <StatCard label="Current Callings" value={overview.currentCallings} />
      <StatCard label="Recommend Active" value={overview.recommendActive} />
      {showRecommendRecovered ? (
        <StatCard label="Recommend Recovered (1y+)" value={recommendRecovered ?? 0} />
      ) : (
        <StatCard label="Recent Baptisms This Year" value={overview.recentBaptismsThisYear} />
      )}
      <StatCard label={missionReadyLabel} value={overview.missionReady} hint={missionReadyHint} />
    </section>
  );
}
