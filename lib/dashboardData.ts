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

export const loadMemberDetailPageData = async (lcrMemberId: string) => getMemberDetail(lcrMemberId);

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
    convertTrend,
    turnoverTrend,
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
    getRecentConvertGrowth(),
    getLeadershipTurnover(),
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
    convertTrend,
    turnoverTrend,
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
