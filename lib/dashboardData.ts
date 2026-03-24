import {
  getDashboardUnits,
  getCommitteeRosters,
  endowmentCandidates,
  getCurrentlyServingMissionaries,
  getCallingsList,
  getCovenantPathProgressionReport,
  getHouseholdOutreachReport,
  getHouseholdOutreachSummary,
  getMemberDetail,
  getLeadershipTurnover,
  getLeadershipTenureReport,
  getMemberList,
  getMissionYouthPipelineReport,
  getMissionReadinessCompositeReport,
  getMissionGenderBreakdown,
  getMinisteringCoverageByUnit,
  getMinisteringGapReport,
  getNewReturningStrengtheningReport,
  getNewReturningStrengtheningSummary,
  getPriesthoodProgressionReport,
  getPriesthoodProgressionSummary,
  getRecentBaptismReport,
  getRecentBaptismPathCohort,
  getRecentBaptismSummary,
  getRecentConvertGrowth,
  getRecentMoveInsReport,
  getRecommendExpirationRiskReport,
  getRecommendExpirationRiskSummary,
  getReportsOverview,
  getSeminaryInstituteByUnitReport,
  getSeminaryInstituteOpportunityReport,
  getStakeOverview,
  getTempleRecommendHealthReport,
  getTempleRecommendHealthSummary,
  getUnitHealthRadarData,
  getUnitHealthReport,
  getYouthProgression,
  getYouthOrganizationTransitions,
  getYouthTransitionMilestones,
  missionEligibleMembers
} from "@/src/services/intelligenceService";
import { getSyncDiffReport } from "@/src/services/advancedMcpService";
import {
  loadSqliteSpikeDashboardData,
  loadSqliteSpikeFullReportsData,
  loadSqliteSpikeMemberDetail,
  loadSqliteSpikeMemberList,
  loadSqliteSpikeReportsShellData
} from "@/src/sqlite-spike/queries";
import type { DashboardOverviewMetrics } from "@/src/types/dashboard";

export type DashboardDataSource = "postgres" | "sqlite";

export const loadDashboardOverviewMetrics = async (
  source: DashboardDataSource,
  unit?: string | null
): Promise<DashboardOverviewMetrics> => {
  if (source === "sqlite") {
    return (await loadSqliteSpikeDashboardData()).overview;
  }

  const selectedUnit = unit?.trim() ? unit.trim() : null;
  const [overview, templeRecommendHealth, missionReadiness, recentBaptisms] = await Promise.all([
    getStakeOverview(selectedUnit),
    getTempleRecommendHealthSummary(selectedUnit),
    getMissionReadinessCompositeReport(selectedUnit),
    getRecentBaptismSummary(12, selectedUnit)
  ]);

  const recommendActive = templeRecommendHealth.statusCounts.find((row) => row.label === "Active")?.value ?? 0;
  const missionReady = missionReadiness.summary.find((row) => row.label === "Ready")?.value ?? 0;
  const recentBaptismsThisYear = recentBaptisms.summary.find((row) => row.label === "This Year")?.value ?? 0;

  return {
    totalMembers: overview.totalMembers,
    currentCallings: overview.currentCallings,
    recommendActive,
    missionReady,
    recentBaptismsThisYear
  };
};

export const loadDashboardData = async (unit?: string | null) => {
  const selectedUnit = unit?.trim() ? unit.trim() : null;
  const [
    availableUnits,
    overview,
    turnover,
    youth,
    templeRecommendHealth,
    seminaryInstituteByUnit,
    missionReadiness,
    newReturningStrengthening,
    priesthoodProgression,
    recentBaptisms,
    recommendExpirationRisk,
    ministeringCoverageByUnit,
    householdOutreach
  ] = await Promise.all([
    getDashboardUnits(),
    getStakeOverview(selectedUnit),
    getLeadershipTurnover(selectedUnit),
    getYouthProgression(selectedUnit),
    getTempleRecommendHealthSummary(selectedUnit),
    getSeminaryInstituteByUnitReport(selectedUnit),
    getMissionReadinessCompositeReport(selectedUnit),
    getNewReturningStrengtheningSummary(selectedUnit),
    getPriesthoodProgressionSummary(selectedUnit),
    getRecentBaptismSummary(12, selectedUnit),
    getRecommendExpirationRiskSummary(selectedUnit),
    getMinisteringCoverageByUnit(selectedUnit),
    getHouseholdOutreachSummary(selectedUnit)
  ]);

  return {
    availableUnits,
    selectedUnit,
    overview,
    daysSinceLastSync: overview.latestSync?.completedAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(overview.latestSync.completedAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null,
    turnover,
    youth,
    templeRecommendHealth,
    seminaryInstituteByUnit,
    missionReadiness,
    missionGenderBreakdown: getMissionGenderBreakdown(missionReadiness.members),
    newReturningStrengthening,
    priesthoodProgression,
    recentBaptisms,
    recommendExpirationRisk,
    ministeringCoverageByUnit,
    householdOutreach
  };
};

export const loadMembersPageData = async () => getMemberList();
export const loadMembersPageDataBySource = async (source: DashboardDataSource) =>
  source === "sqlite" ? loadSqliteSpikeMemberList() : getMemberList();

export const loadMemberDetailPageData = async (lcrMemberId: string) => getMemberDetail(lcrMemberId);
export const loadMemberDetailPageDataBySource = async (lcrMemberId: string, source: DashboardDataSource) =>
  source === "sqlite" ? loadSqliteSpikeMemberDetail(lcrMemberId) : getMemberDetail(lcrMemberId);

export const loadCallingsPageData = async () => ({
  callings: await getCallingsList()
});

export const loadCommitteesPageData = async () => ({
  committees: await getCommitteeRosters()
});

export const loadReportsPageData = async () => {
  const [
    overview,
    missionEligible,
    unitHealth,
    leadershipTenure,
    recentMoveIns,
    templeRecommendHealth,
    seminaryInstituteByUnit,
    newReturningStrengthening,
    priesthoodProgression,
    recentBaptisms,
    recommendExpirationRisk,
    ministeringGaps,
    seminaryInstituteOpportunity,
    householdOutreach,
    covenantPathProgression,
    recentBaptismPathCohort
  ] = await Promise.all([
    getReportsOverview(),
    missionEligibleMembers(),
    getUnitHealthReport(),
    getLeadershipTenureReport(),
    getRecentMoveInsReport(),
    getTempleRecommendHealthReport(),
    getSeminaryInstituteByUnitReport(),
    getNewReturningStrengtheningReport(),
    getPriesthoodProgressionReport(),
    getRecentBaptismReport(),
    getRecommendExpirationRiskReport(),
    getMinisteringGapReport(),
    getSeminaryInstituteOpportunityReport(),
    getHouseholdOutreachReport(),
    getCovenantPathProgressionReport(),
    getRecentBaptismPathCohort()
  ]);

  return {
    overview,
    missionEligible,
    unitHealth,
    leadershipTenure,
    recentMoveIns,
    templeRecommendHealth,
    seminaryInstituteByUnit,
    newReturningStrengthening,
    priesthoodProgression,
    recentBaptisms,
    recommendExpirationRisk,
    ministeringGaps,
    seminaryInstituteOpportunity,
    householdOutreach,
    covenantPathProgression,
    recentBaptismPathCohort
  };
};

export const loadReportsPageDataBySource = async (source: DashboardDataSource) =>
  source === "sqlite" ? loadSqliteSpikeFullReportsData() : loadReportsPageData();

export const loadReportsPageShellData = async () => ({
  overview: await getReportsOverview()
});

export const loadReportsPageShellDataBySource = async (source: DashboardDataSource) =>
  source === "sqlite"
    ? (() => loadSqliteSpikeReportsShellData().then((data) => ({
        source,
        overview: data.overview,
        sqliteSummaries: {
          templeRecommendHealth: data.templeRecommendHealth,
          recentBaptisms: data.recentBaptisms,
          recommendExpirationRisk: data.recommendExpirationRisk
        },
        sqliteDetails: {
          templeRecommendAttentionMembers: data.templeRecommendAttentionMembers,
          recentBaptismMembers: data.recentBaptismMembers,
          recommendExpirationMembers: data.recommendExpirationMembers
        }
      })))()
    : {
        source,
        overview: await getReportsOverview(),
        sqliteSummaries: null,
        sqliteDetails: null
      };

export const loadYouthPageData = async () => ({
  currentlyServingMissionaries: await getCurrentlyServingMissionaries(),
  missionEligible: await missionEligibleMembers(),
  missionYouthPipeline: await getMissionYouthPipelineReport(),
  seminaryInstituteOpportunity: await getSeminaryInstituteOpportunityReport(),
  progression: await getYouthProgression(),
  organizationTransitions: await getYouthOrganizationTransitions(),
  transitionMilestones: await getYouthTransitionMilestones(),
  endowment: await endowmentCandidates()
});

export const loadStakeOverviewPageData = async () => {
  const [overview, turnover, converts, syncDiff, unitHealthRadar] = await Promise.all([
    getStakeOverview(),
    getLeadershipTurnover(),
    getRecentConvertGrowth(),
    getSyncDiffReport({ limit: 30 }),
    getUnitHealthRadarData()
  ]);

  return { overview, turnover, converts, syncDiff, unitHealthRadar };
};
