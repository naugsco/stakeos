import { getSqliteSpikeStatus, openSqliteSpikeDb } from "@/src/sqlite-spike/db";

interface SpikeMemberRow {
  unitName: string | null;
  unitAbbreviation: string | null;
  preferredName: string | null;
  firstName: string;
  lastName: string;
  gender: string | null;
  birthdate: string | null;
  age: number | null;
  memberStatus: string | null;
  baptismDate: string | null;
  templeEndowed: number | null;
  templeRecommendStatus: string | null;
  templeRecommendExpirationDate: string | null;
  missionStatus: string | null;
  missionCountry: string | null;
  isReturnedMissionary: number | null;
  isAttendingSeminary: number | null;
  isAttendingInstitute: number | null;
  hasMinisteringBrothers: number | null;
  hasMinisteringSisters: number | null;
}

interface SpikeCallingRow {
  unitName: string | null;
  isCurrent: number;
}

const unitLabel = (row: { unitName: string | null; unitAbbreviation: string | null }) => row.unitName || row.unitAbbreviation || "Unknown";
const toBool = (value: number | null | undefined) => value === 1;
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
const daysBetween = (left: Date, right: Date) => Math.floor((left.getTime() - right.getTime()) / 86400000);
const daysAgoThreshold = (days: number) => {
  const today = startOfToday();
  today.setDate(today.getDate() - days);
  return today;
};
const safeDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const actualAge = (row: Pick<SpikeMemberRow, "age" | "birthdate">) => {
  if (typeof row.age === "number") {
    return row.age;
  }
  const birthdate = safeDate(row.birthdate);
  if (!birthdate) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const birthdayPassed =
    now.getMonth() > birthdate.getMonth() ||
    (now.getMonth() === birthdate.getMonth() && now.getDate() >= birthdate.getDate());
  if (!birthdayPassed) {
    age -= 1;
  }
  return age;
};
const youthProgramAge = (row: Pick<SpikeMemberRow, "birthdate" | "age">) => {
  const birthdate = safeDate(row.birthdate);
  if (!birthdate) {
    return typeof row.age === "number" ? row.age : null;
  }
  return new Date().getFullYear() - birthdate.getFullYear();
};
const isActiveMember = (status: string | null) => !status || status.trim().toLowerCase().startsWith("active");
const recommendBucket = (status: string | null) => {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (normalized.startsWith("active")) {
    return "Active";
  }
  if (normalized.includes("expired")) {
    return "Expired";
  }
  if (normalized.includes("limited")) {
    return "Limited Use";
  }
  if (!normalized) {
    return "No Status";
  }
  return "Other";
};

export interface SqliteSpikeDashboardData {
  status: ReturnType<typeof getSqliteSpikeStatus>;
  overview: {
    totalMembers: number;
    currentCallings: number;
    recommendActive: number;
    missionReady: number;
    recentBaptismsThisYear: number;
  };
  templeRecommendHealth: Array<{ label: string; value: number }>;
  seminaryByUnit: Array<{ label: string; actual: number; potential: number }>;
  instituteByUnit: Array<{ label: string; actual: number; potential: number }>;
  missionReadiness: Array<{ label: string; value: number }>;
  recentBaptisms: Array<{ label: string; value: number }>;
  recommendExpirationRisk: Array<{ label: string; value: number }>;
  ministeringCoverageByUnit: Array<{
    unitName: string;
    eligibleCount: number;
    noAssignedCount: number;
    brothersOnlyCount: number;
    sistersOnlyCount: number;
    bothAssignedCount: number;
    assignedAnyPct: number;
    noAssignedPct: number;
  }>;
}

export const loadSqliteSpikeDashboardData = async (): Promise<SqliteSpikeDashboardData> => {
  const status = getSqliteSpikeStatus();

  if (!status.exists || status.members === 0) {
    return {
      status,
      overview: {
        totalMembers: 0,
        currentCallings: 0,
        recommendActive: 0,
        missionReady: 0,
        recentBaptismsThisYear: 0
      },
      templeRecommendHealth: [],
      seminaryByUnit: [],
      instituteByUnit: [],
      missionReadiness: [],
      recentBaptisms: [],
      recommendExpirationRisk: [],
      ministeringCoverageByUnit: []
    };
  }

  const db = openSqliteSpikeDb();
  try {
    const members = db.prepare(
      `SELECT
        unit_name AS unitName,
        unit_abbreviation AS unitAbbreviation,
        preferred_name AS preferredName,
        first_name AS firstName,
        last_name AS lastName,
        gender,
        birthdate,
        age,
        member_status AS memberStatus,
        baptism_date AS baptismDate,
        temple_endowed AS templeEndowed,
        temple_recommend_status AS templeRecommendStatus,
        temple_recommend_expiration_date AS templeRecommendExpirationDate,
        mission_status AS missionStatus,
        mission_country AS missionCountry,
        is_returned_missionary AS isReturnedMissionary,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute,
        has_ministering_brothers AS hasMinisteringBrothers,
        has_ministering_sisters AS hasMinisteringSisters
       FROM members`
    ).all() as SpikeMemberRow[];

    const callings = db.prepare(
      `SELECT unit_name AS unitName, is_current AS isCurrent
       FROM callings`
    ).all() as SpikeCallingRow[];

    const today = startOfToday();
    const last30DaysThreshold = daysAgoThreshold(30);
    const last90DaysThreshold = daysAgoThreshold(90);
    const thisYear = today.getFullYear();

    const templeRecommendHealthMap = new Map<string, number>();
    const missionReadinessMap = new Map<string, number>();
    const recentBaptismMap = new Map<string, number>([
      ["Last 30 Days", 0],
      ["Last 90 Days", 0],
      ["This Year", 0]
    ]);
    const recommendRiskMap = new Map<string, number>([
      ["Expired", 0],
      ["Next 30 Days", 0],
      ["31-90 Days", 0]
    ]);
    const seminaryUnitMap = new Map<string, { eligible: number; attending: number }>();
    const instituteUnitMap = new Map<string, { eligible: number; attending: number }>();
    const ministeringUnitMap = new Map<string, { eligible: number; none: number; brothersOnly: number; sistersOnly: number; both: number }>();

    let recommendActive = 0;
    let missionReady = 0;
    let recentBaptismsThisYear = 0;

    for (const member of members) {
      const unit = unitLabel(member);
      const recommend = recommendBucket(member.templeRecommendStatus);
      templeRecommendHealthMap.set(recommend, (templeRecommendHealthMap.get(recommend) ?? 0) + 1);
      if (recommend === "Active") {
        recommendActive += 1;
      }

      const baptismDate = safeDate(member.baptismDate);
      if (baptismDate) {
        if (baptismDate >= last30DaysThreshold) {
          recentBaptismMap.set("Last 30 Days", (recentBaptismMap.get("Last 30 Days") ?? 0) + 1);
        }
        if (baptismDate >= last90DaysThreshold) {
          recentBaptismMap.set("Last 90 Days", (recentBaptismMap.get("Last 90 Days") ?? 0) + 1);
        }
        if (baptismDate.getFullYear() === thisYear) {
          recentBaptismMap.set("This Year", (recentBaptismMap.get("This Year") ?? 0) + 1);
          recentBaptismsThisYear += 1;
        }
      }

      const expiration = safeDate(member.templeRecommendExpirationDate);
      if (expiration) {
        const daysUntil = daysBetween(expiration, today);
        if (daysUntil < 0) {
          recommendRiskMap.set("Expired", (recommendRiskMap.get("Expired") ?? 0) + 1);
        } else if (daysUntil <= 30) {
          recommendRiskMap.set("Next 30 Days", (recommendRiskMap.get("Next 30 Days") ?? 0) + 1);
        } else if (daysUntil <= 90) {
          recommendRiskMap.set("31-90 Days", (recommendRiskMap.get("31-90 Days") ?? 0) + 1);
        }
      }

      const programAge = youthProgramAge(member);
      const age = actualAge(member);
      const seminaryRow = seminaryUnitMap.get(unit) ?? { eligible: 0, attending: 0 };
      if (programAge !== null && programAge >= 14 && programAge <= 18) {
        seminaryRow.eligible += 1;
        if (toBool(member.isAttendingSeminary)) {
          seminaryRow.attending += 1;
        }
      }
      seminaryUnitMap.set(unit, seminaryRow);

      const instituteRow = instituteUnitMap.get(unit) ?? { eligible: 0, attending: 0 };
      if (age !== null && age >= 18 && age <= 35) {
        instituteRow.eligible += 1;
        if (toBool(member.isAttendingInstitute)) {
          instituteRow.attending += 1;
        }
      }
      instituteUnitMap.set(unit, instituteRow);

      if (isActiveMember(member.memberStatus)) {
        const coverageRow = ministeringUnitMap.get(unit) ?? { eligible: 0, none: 0, brothersOnly: 0, sistersOnly: 0, both: 0 };
        coverageRow.eligible += 1;
        const hasBrothers = toBool(member.hasMinisteringBrothers);
        const hasSisters = toBool(member.hasMinisteringSisters);
        if (hasBrothers && hasSisters) {
          coverageRow.both += 1;
        } else if (hasBrothers) {
          coverageRow.brothersOnly += 1;
        } else if (hasSisters) {
          coverageRow.sistersOnly += 1;
        } else {
          coverageRow.none += 1;
        }
        ministeringUnitMap.set(unit, coverageRow);
      }

      const readinessAge = age;
      const onMission = Boolean(member.missionStatus?.trim() || member.missionCountry?.trim());
      if (readinessAge !== null && readinessAge >= 17 && readinessAge <= 25 && !toBool(member.isReturnedMissionary) && !onMission) {
        let score = 0;
        if (recommend === "Active") {
          score += 1;
        }
        if (toBool(member.isAttendingSeminary) || toBool(member.isAttendingInstitute)) {
          score += 1;
        }
        if (toBool(member.templeEndowed)) {
          score += 1;
        }

        const label = score >= 3 ? "Ready" : score === 2 ? "Progressing" : "Needs Focus";
        missionReadinessMap.set(label, (missionReadinessMap.get(label) ?? 0) + 1);
        if (label === "Ready") {
          missionReady += 1;
        }
      }
    }

    return {
      status,
      overview: {
        totalMembers: members.length,
        currentCallings: callings.filter((calling) => calling.isCurrent === 1).length,
        recommendActive,
        missionReady,
        recentBaptismsThisYear
      },
      templeRecommendHealth: ["Active", "Expired", "Limited Use", "No Status", "Other"].map((label) => ({
        label,
        value: templeRecommendHealthMap.get(label) ?? 0
      })),
      seminaryByUnit: [...seminaryUnitMap.entries()]
        .map(([label, row]) => ({ label, actual: row.attending, potential: row.eligible }))
        .sort((left, right) => right.potential - left.potential || left.label.localeCompare(right.label)),
      instituteByUnit: [...instituteUnitMap.entries()]
        .map(([label, row]) => ({ label, actual: row.attending, potential: row.eligible }))
        .sort((left, right) => right.potential - left.potential || left.label.localeCompare(right.label)),
      missionReadiness: ["Ready", "Progressing", "Needs Focus"].map((label) => ({
        label,
        value: missionReadinessMap.get(label) ?? 0
      })),
      recentBaptisms: ["Last 30 Days", "Last 90 Days", "This Year"].map((label) => ({
        label,
        value: recentBaptismMap.get(label) ?? 0
      })),
      recommendExpirationRisk: ["Expired", "Next 30 Days", "31-90 Days"].map((label) => ({
        label,
        value: recommendRiskMap.get(label) ?? 0
      })),
      ministeringCoverageByUnit: [...ministeringUnitMap.entries()]
        .map(([unitName, row]) => {
          const assignedAnyCount = row.brothersOnly + row.sistersOnly + row.both;
          return {
            unitName,
            eligibleCount: row.eligible,
            noAssignedCount: row.none,
            brothersOnlyCount: row.brothersOnly,
            sistersOnlyCount: row.sistersOnly,
            bothAssignedCount: row.both,
            assignedAnyPct: row.eligible > 0 ? Math.round((assignedAnyCount / row.eligible) * 100) : 0,
            noAssignedPct: row.eligible > 0 ? Math.round((row.none / row.eligible) * 100) : 0
          };
        })
        .sort((left, right) => right.noAssignedCount - left.noAssignedCount || left.unitName.localeCompare(right.unitName))
    };
  } finally {
    db.close();
  }
};
