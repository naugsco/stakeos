export const dynamic = "force-dynamic";

import { TransitionLaneChart } from "@/components/charts/transition-lane-chart";
import { YouthBrowser } from "@/components/youth-browser";
import { loadYouthPageData } from "@/lib/dashboardData";

export default async function YouthPage() {
  const data = await loadYouthPageData();
  const milestoneMap = new Map(data.transitionMilestones.map((row) => [row.label, row]));
  const organizationMap = new Map(data.organizationTransitions.map((row) => [row.label, row]));
  const womenMissionReady = milestoneMap.get("17-25 Mission Ready (Women)")?.completedCount ?? 0;
  const menMissionReady = milestoneMap.get("17-25 Mission Ready (Men)")?.completedCount ?? 0;
  const menMissionEligible = data.missionEligible.filter((row) => {
    const gender = (row.gender ?? "").trim().toLowerCase();
    return gender === "m" || gender === "male";
  }).length;
  const youthTransitionRows = [
    {
      label: "12-13 Transition",
      segments: [
        { label: "W 12-13", value: organizationMap.get("Young Women 12-13")?.count ?? 0, tone: "women" as const },
        { label: "M Deacons", value: milestoneMap.get("12-13 Deacon (Men)")?.completedCount ?? 0, tone: "milestone" as const },
        { label: "M 12-13", value: organizationMap.get("Young Men 12-13")?.count ?? 0, tone: "cohort" as const }
      ]
    },
    {
      label: "14-15 Transition",
      segments: [
        { label: "W 14-15", value: organizationMap.get("Young Women 14-15")?.count ?? 0, tone: "women" as const },
        { label: "M Teachers", value: milestoneMap.get("14-15 Teacher (Men)")?.completedCount ?? 0, tone: "milestone" as const },
        { label: "M 14-15", value: organizationMap.get("Young Men 14-15")?.count ?? 0, tone: "cohort" as const }
      ]
    },
    {
      label: "16-17 Transition",
      segments: [
        { label: "W 16-17", value: organizationMap.get("Young Women 16-17")?.count ?? 0, tone: "women" as const },
        { label: "M Priests", value: milestoneMap.get("16-17 Priest (Men)")?.completedCount ?? 0, tone: "milestone" as const },
        { label: "M 16-17", value: organizationMap.get("Young Men 16-17")?.count ?? 0, tone: "cohort" as const }
      ]
    },
    {
      label: "Shared Milestones",
      segments: [
        { label: "8-11 Bap+Conf", value: milestoneMap.get("8-11 Baptized & Confirmed")?.completedCount ?? 0, tone: "milestone" as const },
        { label: "12-17 Recommend", value: milestoneMap.get("12-17 Current Recommend")?.completedCount ?? 0, tone: "cohort" as const },
        { label: "Age 18", value: organizationMap.get("Age 18 Transition")?.count ?? 0, tone: "women" as const }
      ]
    }
  ];
  const youngAdultTransitionRows = [
    {
      label: "17-25 Mission Readiness",
      segments: [
        { label: "W Ready", value: womenMissionReady, tone: "women" as const },
        { label: "M Ready", value: menMissionReady, tone: "milestone" as const },
        { label: "M Eligible", value: menMissionEligible, tone: "cohort" as const }
      ]
    },
    {
      label: "YSA 18-25",
      segments: [
        { label: "W YSA", value: organizationMap.get("YSA Women 18-25 (Unmarried)")?.count ?? 0, tone: "women" as const },
        { label: "M YSA", value: organizationMap.get("YSA Men 18-25 (Unmarried)")?.count ?? 0, tone: "milestone" as const },
        { label: "All YSA", value: organizationMap.get("YSA 18-25 (Unmarried)")?.count ?? 0, tone: "cohort" as const }
      ]
    },
    {
      label: "YSA 26-35 To Single Adults 36-45",
      segments: [
        { label: "W 26-35", value: organizationMap.get("YSA Women 26-35 (Unmarried)")?.count ?? 0, tone: "women" as const },
        { label: "M 26-35", value: organizationMap.get("YSA Men 26-35 (Unmarried)")?.count ?? 0, tone: "milestone" as const },
        { label: "36-45 Single", value: organizationMap.get("Single Adults 36-45 (Unmarried)")?.count ?? 0, tone: "cohort" as const }
      ]
    },
    {
      label: "Single Adults 46+",
      segments: [
        { label: "W 46+", value: organizationMap.get("Single Adult Women 46+ (Unmarried)")?.count ?? 0, tone: "women" as const },
        { label: "M 46+", value: organizationMap.get("Single Adult Men 46+ (Unmarried)")?.count ?? 0, tone: "milestone" as const },
        { label: "All 46+", value: organizationMap.get("Single Adults 46+ (Unmarried)")?.count ?? 0, tone: "cohort" as const }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Youth</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Youth Transitions</h2>
        <p className="mb-2 text-xs text-slate-600">
          Each row pairs the women in that age lane, the men who have completed the matching milestone, and the full male cohort for comparison.
        </p>
        <p className="mb-3 text-xs text-slate-500">
          Shared milestones are included here because they align with the youth transition years. Rose bars are women, navy bars are milestone completion, and teal bars are the full comparison cohort.
        </p>
        <TransitionLaneChart rows={youthTransitionRows} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Young Adult Transitions</h2>
        <p className="mb-2 text-xs text-slate-600">
          These rows track mission preparation, YSA cohorts, and the transition from YSA into older single-adult groups.
        </p>
        <p className="mb-3 text-xs text-slate-500">
          Rose bars are women, navy bars are men who have completed the milestone or current age lane, and teal bars are the full comparison cohort.
        </p>
        <TransitionLaneChart rows={youngAdultTransitionRows} />
      </section>

      <YouthBrowser
        currentlyServingMissionaries={data.currentlyServingMissionaries}
        missionEligible={data.missionEligible}
        missionYouthPipeline={data.missionYouthPipeline}
        seminaryInstituteOpportunity={data.seminaryInstituteOpportunity}
        endowment={data.endowment}
      />
    </div>
  );
}
