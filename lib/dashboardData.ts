import {
  getMissionGenderBreakdown
} from "@/src/services/intelligenceService";
import {
  loadSqliteSpikeCallingsList,
  loadSqliteSpikeAvailableUnits,
  loadSqliteSpikeCommitteesPageData,
  loadSqliteSpikeDashboardData,
  loadSqliteSpikeFullReportsData,
  loadSqliteSpikeMemberDetail,
  loadSqliteSpikeMemberList,
  loadSqliteSpikeReportsShellData,
  loadSqliteSpikeStakeOverviewPageData,
  loadSqliteSpikeYouthPageData
} from "@/src/sqlite/queries";
import type { DashboardOverviewMetrics } from "@/src/types/dashboard";

export const loadDashboardOverviewMetrics = async (
  unit?: string | null
): Promise<DashboardOverviewMetrics> => {
  return (await loadSqliteSpikeDashboardData(unit)).overview;
};

export const loadDashboardDataBySource = async (unit?: string | null) => {
  const selectedUnit = unit?.trim() ? unit.trim() : null;
  const [availableUnits, dashboard, fullReports, youth, stakeOverview] = await Promise.all([
    loadSqliteSpikeAvailableUnits(),
    loadSqliteSpikeDashboardData(selectedUnit),
    loadSqliteSpikeFullReportsData(selectedUnit),
    loadSqliteSpikeYouthPageData(selectedUnit),
    loadSqliteSpikeStakeOverviewPageData(selectedUnit)
  ]);

  const missionSummary = ["Ready", "Progressing", "Needs Focus"].map((label) => ({
    label,
    value: youth.missionYouthPipeline.filter((row) => row.readinessLevel === label).length
  }));

  return {
    availableUnits,
    selectedUnit,
    overview: {
      totalMembers: stakeOverview.overview.totalMembers,
      currentCallings: dashboard.overview.currentCallings,
      latestSync: stakeOverview.overview.latestSync
    },
    daysSinceLastSync: dashboard.status.latestSyncCompletedAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(dashboard.status.latestSyncCompletedAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null,
    turnover: stakeOverview.turnover,
    youth: youth.progression,
    templeRecommendHealth: fullReports.templeRecommendHealth,
    seminaryInstituteByUnit: fullReports.seminaryInstituteByUnit,
    missionReadiness: {
      summary: missionSummary,
      members: youth.missionYouthPipeline
    },
    missionGenderBreakdown: getMissionGenderBreakdown(youth.missionYouthPipeline),
    newReturningStrengthening: fullReports.newReturningStrengthening,
    priesthoodProgression: fullReports.priesthoodProgression,
    recentBaptisms: fullReports.recentBaptisms,
    recommendExpirationRisk: fullReports.recommendExpirationRisk,
    ministeringCoverageByUnit: dashboard.ministeringCoverageByUnit,
    householdOutreach: fullReports.householdOutreach
  };
};

export const loadMembersPageDataBySource = async () => loadSqliteSpikeMemberList();

export const loadMemberDetailPageDataBySource = async (lcrMemberId: string) =>
  loadSqliteSpikeMemberDetail(lcrMemberId);

export const loadCallingsPageDataBySource = async () =>
  ({
    callings: await loadSqliteSpikeCallingsList(),
    availableUnits: await loadSqliteSpikeAvailableUnits()
  });

export const loadCommitteesPageDataBySource = async () =>
  loadSqliteSpikeCommitteesPageData();

export const loadReportsPageDataBySource = async () =>
  loadSqliteSpikeFullReportsData();

export const loadReportsPageShellDataBySource = async () => {
  const data = await loadSqliteSpikeReportsShellData();
  return {
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
  };
};

export const loadYouthPageDataBySource = async () =>
  loadSqliteSpikeYouthPageData();

export const loadStakeOverviewPageDataBySource = async () =>
  loadSqliteSpikeStakeOverviewPageData();
