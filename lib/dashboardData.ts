import {
  getMissionGenderBreakdown
} from "@/src/services/intelligenceService";
import { getEffectiveDesktopEnv, parseHighCouncilUnitAssignments } from "@/src/config/desktopConfig";
import { ensureSqliteSpikeSchema, openSqliteSpikeDb } from "@/src/sqlite/db";
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

export type TrainingFollowUpStateRecord = {
  groupLabel: string;
  lastDraftAt: string | null;
  lastDraftSignature: string | null;
  lastDraftSubject: string | null;
  lastSentAt: string | null;
  lastSentSignature: string | null;
  lastSentSubject: string | null;
};

const splitConfiguredEmails = (value?: string | null) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const dedupeEmails = (items: Array<string | null | undefined>) =>
  Array.from(new Set(items.map((item) => item?.trim() || "").filter(Boolean)));

const loadDynamicTrainingEmailRecipients = () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `SELECT
        c.lcr_member_id AS lcrMemberId,
        lower(trim(c.title)) AS title,
        lower(trim(coalesce(c.organization_name, ''))) AS organizationName,
        COALESCE(NULLIF(m.preferred_name, ''), TRIM(m.first_name || ' ' || m.last_name)) AS fullName,
        m.primary_email AS email
       FROM callings c
       JOIN members m ON m.lcr_member_id = c.lcr_member_id
       WHERE c.is_current = 1
         AND m.primary_email IS NOT NULL`
    ).all() as Array<{ lcrMemberId: string | null; title: string; organizationName: string; fullName: string; email: string }>;

    const lists = {
      stakePresidency: [] as string[],
      highCouncil: [] as string[],
      stakeReliefSociety: [] as string[],
      stakeYoungWomen: [] as string[],
      stakePrimary: [] as string[],
      stakeSundaySchool: [] as string[],
      highCouncilByMemberId: {} as Record<string, { email: string; fullName: string }>
    };

    for (const row of rows) {
      const title = row.title;
      const organizationName = row.organizationName;
      if (
        title === "stake president" ||
        title.includes("stake presidency")
      ) {
        lists.stakePresidency.push(row.email);
        continue;
      }

      if (title === "stake high councilor" || title === "high councilor") {
        lists.highCouncil.push(row.email);
        if (row.lcrMemberId) {
          lists.highCouncilByMemberId[row.lcrMemberId] = { email: row.email, fullName: row.fullName };
        }
        continue;
      }

      if (/^stake relief society (president|first counselor|second counselor)$/.test(title)) {
        lists.stakeReliefSociety.push(row.email);
        continue;
      }

      if (/^stake young women (president|first counselor|second counselor)$/.test(title)) {
        lists.stakeYoungWomen.push(row.email);
        continue;
      }

      if (/^stake primary (president|first counselor|second counselor)$/.test(title)) {
        lists.stakePrimary.push(row.email);
        continue;
      }

      if (
        /^stake sunday school (president|first counselor|second counselor)$/.test(title) ||
        organizationName.includes("stake sunday school")
      ) {
        lists.stakeSundaySchool.push(row.email);
      }
    }

    return {
      stakePresidency: dedupeEmails(lists.stakePresidency),
      highCouncil: dedupeEmails(lists.highCouncil),
      stakeReliefSociety: dedupeEmails(lists.stakeReliefSociety),
      stakeYoungWomen: dedupeEmails(lists.stakeYoungWomen),
      stakePrimary: dedupeEmails(lists.stakePrimary),
      stakeSundaySchool: dedupeEmails(lists.stakeSundaySchool),
      highCouncilByMemberId: lists.highCouncilByMemberId
    };
  } finally {
    db.close();
  }
};

const loadTrainingFollowUpState = () => {
  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
    const rows = db.prepare(
      `SELECT
        group_key AS groupKey,
        group_label AS groupLabel,
        last_draft_at AS lastDraftAt,
        last_draft_signature AS lastDraftSignature,
        last_draft_subject AS lastDraftSubject,
        last_sent_at AS lastSentAt,
        last_sent_signature AS lastSentSignature,
        last_sent_subject AS lastSentSubject
       FROM training_follow_up_state`
    ).all() as Array<
      {
        groupKey: string;
      } & TrainingFollowUpStateRecord
    >;

    return Object.fromEntries(rows.map((row) => [row.groupKey, {
      groupLabel: row.groupLabel,
      lastDraftAt: row.lastDraftAt,
      lastDraftSignature: row.lastDraftSignature,
      lastDraftSubject: row.lastDraftSubject,
      lastSentAt: row.lastSentAt,
      lastSentSignature: row.lastSentSignature,
      lastSentSubject: row.lastSentSubject
    }]));
  } finally {
    db.close();
  }
};

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

export const loadStakeOverviewPageDataBySource = async () => {
  const data = await loadSqliteSpikeStakeOverviewPageData();
  const desktopEnv = getEffectiveDesktopEnv();
  const dynamicRecipients = loadDynamicTrainingEmailRecipients();
  const trainingFollowUpState = loadTrainingFollowUpState();
  const highCouncilUnitAssignments = parseHighCouncilUnitAssignments(desktopEnv.HIGH_COUNCIL_UNIT_ASSIGNMENTS);

  return {
    ...data,
    trainingEmailRecipients: {
      stakePresidency: dedupeEmails([...dynamicRecipients.stakePresidency, ...splitConfiguredEmails(desktopEnv.STAKE_PRESIDENCY_EMAILS)]),
      stakeCouncil: dedupeEmails([
        ...dynamicRecipients.stakePresidency,
        ...dynamicRecipients.highCouncil,
        ...dynamicRecipients.stakeReliefSociety,
        ...dynamicRecipients.stakeYoungWomen,
        ...dynamicRecipients.stakePrimary,
        ...dynamicRecipients.stakeSundaySchool,
        ...splitConfiguredEmails(desktopEnv.STAKE_COUNCIL_EMAILS)
      ]),
      highCouncil: dedupeEmails([...dynamicRecipients.highCouncil, ...splitConfiguredEmails(desktopEnv.HIGH_COUNCIL_EMAILS)]),
      stakeReliefSociety: dedupeEmails([
        ...(dynamicRecipients.stakeReliefSociety.length > 0 ? dynamicRecipients.stakeReliefSociety : dynamicRecipients.stakePresidency),
        ...splitConfiguredEmails(desktopEnv.STAKE_RELIEF_SOCIETY_EMAILS)
      ]),
      stakeYoungWomen: dedupeEmails([
        ...(dynamicRecipients.stakeYoungWomen.length > 0 ? dynamicRecipients.stakeYoungWomen : dynamicRecipients.stakePresidency),
        ...splitConfiguredEmails(desktopEnv.STAKE_YOUNG_WOMEN_EMAILS)
      ]),
      stakePrimary: dedupeEmails([
        ...(dynamicRecipients.stakePrimary.length > 0 ? dynamicRecipients.stakePrimary : dynamicRecipients.stakePresidency),
        ...splitConfiguredEmails(desktopEnv.STAKE_PRIMARY_EMAILS)
      ]),
      stakeSundaySchool: dedupeEmails([
        ...(dynamicRecipients.stakeSundaySchool.length > 0 ? dynamicRecipients.stakeSundaySchool : dynamicRecipients.stakePresidency),
        ...splitConfiguredEmails(desktopEnv.STAKE_SUNDAY_SCHOOL_EMAILS)
      ])
    },
    trainingFollowUpState,
    highCouncilTrainingAssignments: {
      assignments: highCouncilUnitAssignments,
      availableRecipientsByMemberId: dynamicRecipients.highCouncilByMemberId,
      fallbackRecipients: dedupeEmails([...dynamicRecipients.highCouncil, ...splitConfiguredEmails(desktopEnv.HIGH_COUNCIL_EMAILS)])
    }
  };
};
