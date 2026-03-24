import { getSqliteSpikeStatus, openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import type {
  CovenantPathProgressionRow,
  MemberDetail,
  RecentBaptismPathRow,
  RecentBaptismRow,
  RecommendExpirationRiskRow,
  TempleRecommendAttentionRow,
  TempleRecommendHealthReport,
  SeminaryInstituteByUnitRow,
  NewReturningStrengtheningReport,
  PriesthoodProgressionReport,
  MinisteringGapReport,
  HouseholdOutreachReport
} from "@/src/services/intelligenceService";
import type { DashboardOverviewMetrics } from "@/src/types/dashboard";

interface SpikeMemberRow {
  lcrMemberId?: string;
  fullName?: string | null;
  householdId?: number | null;
  lcrHouseholdId?: string | null;
  householdName?: string | null;
  unitName: string | null;
  unitAbbreviation: string | null;
  preferredName: string | null;
  firstName: string;
  lastName: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateOrProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  gender: string | null;
  birthdate: string | null;
  birthCountry?: string | null;
  birthplace?: string | null;
  age: number | null;
  memberStatus: string | null;
  moveInDate?: string | null;
  isConvert?: number | null;
  baptismDate: string | null;
  confirmationDate?: string | null;
  endowmentDate?: string | null;
  endowmentStatus?: string | null;
  templeEndowed: number | null;
  templeRecommendStatus: string | null;
  templeRecommendExpirationDate: string | null;
  templeRecommendType?: string | null;
  missionStatus: string | null;
  missionLanguage?: string | null;
  missionCountry: string | null;
  isReturnedMissionary: number | null;
  isAccountable?: number | null;
  isBornInCovenant?: number | null;
  isDivorced?: number | null;
  isMarried?: number | null;
  marriageDate?: string | null;
  marriageStatus?: string | null;
  isAttendingSeminary: number | null;
  isAttendingInstitute: number | null;
  potentialInstituteStudent?: number | null;
  potentialSeminaryStudent?: number | null;
  hasMinisteringBrothers: number | null;
  hasMinisteringSisters: number | null;
  ministeringBrothers?: string | null;
  ministeringSisters?: string | null;
  spouseName?: string | null;
  headOfHouse?: string | null;
  householdPosition?: string | null;
  sealingToParents?: string | null;
  sealingToSpouse?: string | null;
  priesthoodType?: string | null;
  priesthoodOffice?: string | null;
  ordinationDate?: string | null;
  instituteStatus?: string | null;
  seminaryStatus?: string | null;
}

interface SpikeCallingRow {
  unitName: string | null;
  isCurrent: number;
}

interface SpikeCallingDetailRow {
  lcrMemberId: string | null;
  unitName: string | null;
  title: string;
  organizationName: string | null;
  sustainedOn: string | null;
  setApartOn: string | null;
  isCurrent: number;
}

interface SpikeHouseholdRow {
  id: number;
  householdName: string;
  unitNumber: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

interface SqliteSpikeMissionEligibleRow {
  lcrMemberId: string;
  unitName: string;
  fullName: string;
  age: number | null;
  isAttendingSeminary: boolean | null;
  isAttendingInstitute: boolean | null;
  missionLanguage: string | null;
  missionCountry: string | null;
  missionStatus: string | null;
  templeRecommendStatus: string | null;
  templeEndowed: boolean | null;
  currentCalling: string | null;
  readinessScore: number;
  readinessLevel: "Ready" | "Progressing" | "Needs Focus";
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
const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();
const normalizeTempleRecommendStatus = (status: string | null | undefined) => (status ?? "").trim().toLowerCase();
const isActiveTempleRecommendStatus = (status: string | null | undefined) =>
  normalizeTempleRecommendStatus(status).startsWith("active");
const cleanCallingTitle = (value: string | null): string => {
  if (!value) {
    return "";
  }

  return collapseWhitespace(
    value
      .replace(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g, " ")
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " ")
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
      .replace(/\/\s*(yes|no)(?=[A-Z]|\b|$)/gi, " ")
      .replace(/\b(set\s*apart|sustain(?:ed)?)\b/gi, " ")
      .replace(/\bwith\s+date\b/gi, " ")
      .replace(/[^A-Za-z0-9 '&,.\-()]+/g, " ")
  );
};
const canonicalizeName = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9, ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
const parseMinisteringDisplayName = (value: string) => {
  const trimmed = collapseWhitespace(value);
  if (!trimmed.includes(",")) {
    return trimmed;
  }

  const [lastName, ...rest] = trimmed.split(",");
  return collapseWhitespace(`${rest.join(" ")} ${lastName}`);
};
const buildNameVariants = (value: string | null | undefined) => {
  const trimmed = collapseWhitespace(value ?? "");
  if (!trimmed) {
    return [];
  }

  const parsed = parseMinisteringDisplayName(trimmed);
  const variants = new Set<string>();
  const addVariant = (name: string) => {
    const canonical = canonicalizeName(name);
    if (canonical) {
      variants.add(canonical);
    }

    const tokens = canonical.split(" ").filter(Boolean);
    if (tokens.length >= 2) {
      variants.add(`${tokens[0]} ${tokens[tokens.length - 1]}`);
    }
  };

  addVariant(trimmed);
  addVariant(parsed);

  return Array.from(variants);
};
const splitMinisteringAssignments = (value: string | null | undefined) =>
  (value ?? "")
    .split(/\s*\/\s*/)
    .map((entry) => collapseWhitespace(entry))
    .filter(Boolean);
const yearsBetween = (value: string | null | undefined) => {
  const date = safeDate(value);
  if (!date) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
};
const isMale = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "m" || normalized === "male" || normalized === "man";
};
const isYouthOrYsa = (row: Pick<SpikeMemberRow, "age" | "birthdate">) => {
  const programAge = youthProgramAge(row);
  const age = actualAge(row);
  return (programAge !== null && programAge >= 12 && programAge <= 18) || (age !== null && age >= 18 && age <= 35);
};

export interface SqliteSpikeFullReportsData {
  overview: SqliteSpikeReportsShellData["overview"];
  missionEligible: SqliteSpikeMissionEligibleRow[];
  unitHealth: Array<{
    unitName: string;
    memberCount: number;
    currentCallings: number;
    leadershipCallings: number;
    seminaryAttending: number;
    instituteAttending: number;
    convertsLast12Months: number;
  }>;
  leadershipTenure: Array<{
    lcrMemberId: string;
    unitName: string;
    fullName: string;
    callingTitle: string;
    yearsInCalling: number;
  }>;
  recentMoveIns: Array<{
    lcrMemberId: string;
    unitName: string;
    fullName: string;
    moveInDate: string | null;
    phoneNumber: string | null;
    email: string | null;
  }>;
  templeRecommendHealth: TempleRecommendHealthReport;
  seminaryInstituteByUnit: SeminaryInstituteByUnitRow[];
  newReturningStrengthening: NewReturningStrengtheningReport;
  priesthoodProgression: PriesthoodProgressionReport;
  recentBaptisms: {
    summary: Array<{ label: string; value: number }>;
    members: RecentBaptismRow[];
  };
  recommendExpirationRisk: {
    summary: Array<{ label: string; value: number }>;
    members: RecommendExpirationRiskRow[];
  };
  ministeringGaps: MinisteringGapReport;
  seminaryInstituteOpportunity: Array<{
    lcrMemberId: string;
    fullName: string;
    unitName: string;
    age: number | null;
    track: "Seminary" | "Institute";
    attending: boolean | null;
    potentialFlag: boolean | null;
    statusText: string | null;
    phoneNumber: string | null;
    email: string | null;
  }>;
  householdOutreach: HouseholdOutreachReport;
  covenantPathProgression: CovenantPathProgressionRow[];
  recentBaptismPathCohort: RecentBaptismPathRow[];
}

export interface SqliteSpikeDashboardData {
  status: ReturnType<typeof getSqliteSpikeStatus>;
  overview: DashboardOverviewMetrics;
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

export interface SqliteSpikeMemberRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface SqliteSpikeReportsShellData {
  overview: {
    totalMembers: number;
    unitsRepresented: number;
    leadershipCallings: number;
    missionEligible: number;
    seminaryAttending: number;
    instituteAttending: number;
    activeTempleRecommend: number;
    convertsLast12Months: number;
  };
  templeRecommendHealth: Array<{ label: string; value: number }>;
  recentBaptisms: Array<{ label: string; value: number }>;
  recommendExpirationRisk: Array<{ label: string; value: number }>;
  templeRecommendAttentionMembers: TempleRecommendAttentionRow[];
  recentBaptismMembers: RecentBaptismRow[];
  recommendExpirationMembers: RecommendExpirationRiskRow[];
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
        lcr_member_id AS lcrMemberId,
        unit_name AS unitName,
        unit_abbreviation AS unitAbbreviation,
        preferred_name AS preferredName,
        first_name AS firstName,
        last_name AS lastName,
        address_line1 AS addressLine1,
        address_line2 AS addressLine2,
        city,
        state_or_province AS stateOrProvince,
        postal_code AS postalCode,
        country,
        primary_email AS primaryEmail,
        primary_phone AS primaryPhone,
        gender,
        birthdate,
        birth_country AS birthCountry,
        birthplace,
        age,
        member_status AS memberStatus,
        move_in_date AS moveInDate,
        is_convert AS isConvert,
        baptism_date AS baptismDate,
        confirmation_date AS confirmationDate,
        endowment_date AS endowmentDate,
        endowment_status AS endowmentStatus,
        temple_endowed AS templeEndowed,
        temple_recommend_status AS templeRecommendStatus,
        temple_recommend_expiration_date AS templeRecommendExpirationDate,
        temple_recommend_type AS templeRecommendType,
        mission_status AS missionStatus,
        mission_language AS missionLanguage,
        mission_country AS missionCountry,
        is_returned_missionary AS isReturnedMissionary,
        is_accountable AS isAccountable,
        is_born_in_covenant AS isBornInCovenant,
        is_divorced AS isDivorced,
        is_married AS isMarried,
        marriage_date AS marriageDate,
        marriage_status AS marriageStatus,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute,
        potential_institute_student AS potentialInstituteStudent,
        potential_seminary_student AS potentialSeminaryStudent,
        has_ministering_brothers AS hasMinisteringBrothers,
        has_ministering_sisters AS hasMinisteringSisters,
        ministering_brothers AS ministeringBrothers,
        ministering_sisters AS ministeringSisters,
        spouse_name AS spouseName,
        head_of_house AS headOfHouse,
        household_position AS householdPosition,
        sealing_to_parents AS sealingToParents,
        sealing_to_spouse AS sealingToSpouse,
        priesthood_type AS priesthoodType,
        priesthood_office AS priesthoodOffice,
        ordination_date AS ordinationDate,
        institute_status AS instituteStatus,
        seminary_status AS seminaryStatus
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

export const loadSqliteSpikeMemberList = async (): Promise<SqliteSpikeMemberRow[]> => {
  const status = getSqliteSpikeStatus();
  if (!status.exists || status.members === 0) {
    return [];
  }

  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `SELECT
        lcr_member_id AS lcrMemberId,
        COALESCE(NULLIF(preferred_name, ''), TRIM(first_name || ' ' || last_name)) AS fullName,
        COALESCE(NULLIF(unit_name, ''), NULLIF(unit_abbreviation, ''), 'Unknown') AS unitName,
        age,
        gender,
        primary_email AS email,
        primary_phone AS phoneNumber
       FROM members
       ORDER BY last_name, first_name`
    ).all() as SqliteSpikeMemberRow[];

    return rows.map((row) => ({
      ...row,
      unitName: row.unitName === "Unknown" ? null : row.unitName
    }));
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeMemberDetail = async (lcrMemberId: string): Promise<MemberDetail | null> => {
  const status = getSqliteSpikeStatus();
  if (!status.exists || status.members === 0) {
    return null;
  }

  const db = openSqliteSpikeDb();
  try {
    const member = db.prepare(
      `SELECT
        m.lcr_member_id AS lcrMemberId,
        m.household_id AS householdId,
        m.lcr_household_id AS lcrHouseholdId,
        COALESCE(NULLIF(m.preferred_name, ''), TRIM(m.first_name || ' ' || m.last_name)) AS fullName,
        m.preferred_name AS preferredName,
        m.first_name AS firstName,
        m.last_name AS lastName,
        COALESCE(NULLIF(m.unit_name, ''), NULLIF(m.unit_abbreviation, ''), 'Unknown') AS unitName,
        m.unit_abbreviation AS unitAbbreviation,
        m.age,
        m.gender,
        m.birthdate,
        m.birth_country AS birthCountry,
        m.birthplace,
        m.move_in_date AS moveInDate,
        m.member_status AS memberStatus,
        m.baptism_date AS baptismDate,
        m.confirmation_date AS confirmationDate,
        m.is_accountable AS isAccountable,
        m.is_born_in_covenant AS isBornInCovenant,
        m.is_divorced AS isDivorced,
        m.is_married AS isMarried,
        m.marriage_date AS marriageDate,
        m.marriage_status AS marriageStatus,
        m.endowment_status AS endowmentStatus,
        m.endowment_date AS endowmentDate,
        m.temple_recommend_status AS templeRecommendStatus,
        m.temple_recommend_expiration_date AS templeRecommendExpirationDate,
        m.temple_recommend_type AS templeRecommendType,
        m.mission_status AS missionStatus,
        m.mission_language AS missionLanguage,
        m.mission_country AS missionCountry,
        m.priesthood_type AS priesthoodType,
        m.priesthood_office AS priesthoodOffice,
        m.ordination_date AS ordinationDate,
        m.institute_status AS instituteStatus,
        m.seminary_status AS seminaryStatus,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.potential_institute_student AS potentialInstituteStudent,
        m.potential_seminary_student AS potentialSeminaryStudent,
        m.ministering_brothers AS ministeringBrothers,
        m.ministering_sisters AS ministeringSisters,
        m.spouse_name AS spouseName,
        m.head_of_house AS headOfHouse,
        m.household_position AS householdPosition,
        m.sealing_to_parents AS sealingToParents,
        m.sealing_to_spouse AS sealingToSpouse,
        COALESCE(m.address_line1, h.address_line1) AS addressLine1,
        COALESCE(m.address_line2, h.address_line2) AS addressLine2,
        COALESCE(m.city, h.city) AS city,
        COALESCE(m.state_or_province, h.state) AS stateOrProvince,
        COALESCE(m.postal_code, h.postal_code) AS postalCode,
        COALESCE(m.country, h.country) AS country,
        h.household_name AS householdName,
        m.primary_email AS primaryEmail,
        m.primary_phone AS primaryPhone
       FROM members m
       LEFT JOIN households h ON h.id = m.household_id
       WHERE m.lcr_member_id = ?
       LIMIT 1`
    ).get(lcrMemberId) as SpikeMemberRow | undefined;

    if (!member) {
      return null;
    }

    const currentCallings = db.prepare(
      `SELECT
        title AS callingTitle,
        organization_name AS organizationName,
        sustained_on AS sustainedOn,
        set_apart_on AS setApartOn
       FROM callings
       WHERE is_current = 1
         AND lcr_member_id = ?
       ORDER BY sustained_on DESC, title`
    ).all(lcrMemberId) as MemberDetail["currentCallings"];

    const householdMembers =
      member.householdId === null || member.householdId === undefined
        ? []
        : (db.prepare(
            `SELECT
              lcr_member_id AS lcrMemberId,
              COALESCE(NULLIF(preferred_name, ''), TRIM(first_name || ' ' || last_name)) AS fullName,
              age,
              gender,
              household_position AS householdPosition
             FROM members
             WHERE household_id = ?
             ORDER BY
               CASE
                 WHEN COALESCE(household_position, '') = 'Head of Household' THEN 0
                 WHEN COALESCE(household_position, '') = 'Spouse of Head of House' THEN 1
                 ELSE 2
               END,
               age DESC,
               last_name,
               first_name`
          ).all(member.householdId) as Array<{
            lcrMemberId: string;
            fullName: string;
            age: number | null;
            gender: string | null;
            householdPosition: string | null;
          }>);

    return {
      lcrMemberId: member.lcrMemberId ?? lcrMemberId,
      fullName: member.fullName ?? `${member.preferredName ?? `${member.firstName} ${member.lastName}`}`,
      preferredName: member.preferredName ?? null,
      unitName: member.unitName ?? member.unitAbbreviation ?? null,
      age: member.age ?? actualAge(member),
      gender: member.gender ?? null,
      birthdate: member.birthdate ?? null,
      birthCountry: member.birthCountry ?? null,
      birthplace: member.birthplace ?? null,
      moveInDate: member.moveInDate ?? null,
      memberStatus: member.memberStatus ?? null,
      baptismDate: member.baptismDate ?? null,
      confirmationDate: member.confirmationDate ?? null,
      isAccountable: member.isAccountable === undefined ? null : toBool(member.isAccountable),
      isBornInCovenant: member.isBornInCovenant === undefined ? null : toBool(member.isBornInCovenant),
      isDivorced: member.isDivorced === undefined ? null : toBool(member.isDivorced),
      isMarried: member.isMarried === undefined ? null : toBool(member.isMarried),
      marriageDate: member.marriageDate ?? null,
      marriageStatus: member.marriageStatus ?? null,
      endowmentStatus: member.endowmentStatus ?? null,
      endowmentDate: member.endowmentDate ?? null,
      templeRecommendStatus: member.templeRecommendStatus ?? null,
      templeRecommendExpirationDate: member.templeRecommendExpirationDate ?? null,
      templeRecommendType: member.templeRecommendType ?? null,
      missionStatus: member.missionStatus ?? null,
      missionLanguage: member.missionLanguage ?? null,
      missionCountry: member.missionCountry ?? null,
      priesthoodType: member.priesthoodType ?? null,
      priesthoodOffice: member.priesthoodOffice ?? null,
      ordinationDate: member.ordinationDate ?? null,
      instituteStatus: member.instituteStatus ?? null,
      seminaryStatus: member.seminaryStatus ?? null,
      isAttendingSeminary: member.isAttendingSeminary === undefined ? null : toBool(member.isAttendingSeminary),
      isAttendingInstitute: member.isAttendingInstitute === undefined ? null : toBool(member.isAttendingInstitute),
      potentialInstituteStudent:
        member.potentialInstituteStudent === undefined ? null : toBool(member.potentialInstituteStudent),
      potentialSeminaryStudent:
        member.potentialSeminaryStudent === undefined ? null : toBool(member.potentialSeminaryStudent),
      ministeringBrothers: member.ministeringBrothers ?? null,
      ministeringSisters: member.ministeringSisters ?? null,
      spouseName: member.spouseName ?? null,
      headOfHouse: member.headOfHouse ?? null,
      householdPosition: member.householdPosition ?? null,
      sealingToParents: member.sealingToParents ?? null,
      sealingToSpouse: member.sealingToSpouse ?? null,
      householdId: member.householdId ?? null,
      householdName: member.householdName ?? (member.headOfHouse ? `${member.headOfHouse} Household` : null),
      addressLine1: member.addressLine1 ?? null,
      addressLine2: member.addressLine2 ?? null,
      city: member.city ?? null,
      stateOrProvince: member.stateOrProvince ?? null,
      postalCode: member.postalCode ?? null,
      country: member.country ?? null,
      emails: member.primaryEmail ? [member.primaryEmail] : [],
      phoneNumbers: member.primaryPhone ? [member.primaryPhone] : [],
      currentCallings,
      householdMembers: householdMembers.map((row) => ({
        ...row,
        relationshipHint: row.lcrMemberId === (member.lcrMemberId ?? lcrMemberId) ? "Self" : row.householdPosition ?? "Household"
      }))
    };
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeReportsShellData = async (): Promise<SqliteSpikeReportsShellData> => {
  const dashboard = await loadSqliteSpikeDashboardData();
  const status = getSqliteSpikeStatus();
  if (!status.exists || status.members === 0) {
    return {
      overview: {
        totalMembers: 0,
        unitsRepresented: 0,
        leadershipCallings: 0,
        missionEligible: 0,
        seminaryAttending: 0,
        instituteAttending: 0,
        activeTempleRecommend: 0,
        convertsLast12Months: 0
      },
      templeRecommendHealth: [],
      recentBaptisms: [],
      recommendExpirationRisk: [],
      templeRecommendAttentionMembers: [],
      recentBaptismMembers: [],
      recommendExpirationMembers: []
    };
  }

  const db = openSqliteSpikeDb();
  try {
    const today = startOfToday();
    const members = db.prepare(
      `SELECT
        lcr_member_id AS lcrMemberId,
        preferred_name AS preferredName,
        first_name AS firstName,
        last_name AS lastName,
        unit_name AS unitName,
        unit_abbreviation AS unitAbbreviation,
        age,
        birthdate,
        confirmation_date AS confirmationDate,
        mission_status AS missionStatus,
        mission_country AS missionCountry,
        is_returned_missionary AS isReturnedMissionary,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute,
        temple_recommend_status AS templeRecommendStatus,
        temple_recommend_expiration_date AS templeRecommendExpirationDate,
        is_convert AS isConvert,
        baptism_date AS baptismDate,
        move_in_date AS moveInDate,
        primary_email AS primaryEmail,
        primary_phone AS primaryPhone
       FROM members`
    ).all() as SpikeMemberRow[];

    const callings = db.prepare(
      `SELECT title, lcr_member_id AS lcrMemberId
       FROM callings
       WHERE is_current = 1`
    ).all() as Array<{ title: string; lcrMemberId: string | null }>;

    const leadershipCallings = callings.filter((row) => /(president|bishop|high councilor)/i.test(row.title)).length;
    const unitsRepresented = new Set(members.map((row) => unitLabel(row)).filter(Boolean)).size;
    const missionEligible = members.filter((member) => {
      const age = actualAge(member);
      const onMission = Boolean(member.missionStatus?.trim() || member.missionCountry?.trim());
      return age !== null && age >= 18 && age <= 25 && !toBool(member.isReturnedMissionary) && !onMission;
    }).length;
    const seminaryAttending = members.filter((member) => {
      const age = youthProgramAge(member);
      return age !== null && age >= 14 && age <= 18 && toBool(member.isAttendingSeminary);
    }).length;
    const instituteAttending = members.filter((member) => {
      const age = actualAge(member);
      return age !== null && age >= 18 && age <= 35 && toBool(member.isAttendingInstitute);
    }).length;
    const convertsLast12Months = members.filter((member) => {
      const effectiveDate = safeDate(member.baptismDate) ?? safeDate(member.moveInDate);
      return toBool(member.isConvert) && effectiveDate && effectiveDate >= daysAgoThreshold(365);
    }).length;

    const templeRecommendAttentionMembers = members
      .filter((member) => recommendBucket(member.templeRecommendStatus) !== "Active")
      .map<TempleRecommendAttentionRow>((member) => ({
        lcrMemberId: member.lcrMemberId ?? "",
        fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
        unitName: unitLabel(member),
        age: member.age ?? actualAge(member),
        templeRecommendStatus: member.templeRecommendStatus ?? null
      }))
      .sort((left, right) => left.unitName.localeCompare(right.unitName) || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000);

    const recentBaptismMembers = members
      .filter((member) => {
        const baptismDate = safeDate(member.baptismDate);
        return baptismDate && baptismDate >= daysAgoThreshold(365);
      })
      .map<RecentBaptismRow>((member) => ({
        lcrMemberId: member.lcrMemberId ?? "",
        fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
        unitName: unitLabel(member),
        age: member.age ?? actualAge(member),
        baptismDate: member.baptismDate ?? null,
        confirmationDate: member.confirmationDate ?? null,
        phoneNumber: member.primaryPhone ?? null,
        email: member.primaryEmail ?? null
      }))
      .sort((left, right) => (right.baptismDate ?? "").localeCompare(left.baptismDate ?? "") || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000);

    const recommendExpirationMembers = members
      .filter((member) => {
        const expiration = safeDate(member.templeRecommendExpirationDate);
        if (!expiration) {
          return false;
        }
        const daysUntil = daysBetween(expiration, today);
        return daysUntil <= 90;
      })
      .map<RecommendExpirationRiskRow>((member) => {
        const expiration = safeDate(member.templeRecommendExpirationDate);
        const daysUntilExpiration = expiration ? daysBetween(expiration, today) : null;
        return {
          lcrMemberId: member.lcrMemberId ?? "",
          fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
          unitName: unitLabel(member),
          age: member.age ?? actualAge(member),
          templeRecommendStatus: member.templeRecommendStatus ?? null,
          expirationDate: member.templeRecommendExpirationDate ?? null,
          daysUntilExpiration
        };
      })
      .sort((left, right) => (left.daysUntilExpiration ?? 99999) - (right.daysUntilExpiration ?? 99999) || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000);

    return {
      overview: {
        totalMembers: dashboard.overview.totalMembers,
        unitsRepresented,
        leadershipCallings,
        missionEligible,
        seminaryAttending,
        instituteAttending,
        activeTempleRecommend: dashboard.overview.recommendActive,
        convertsLast12Months
      },
      templeRecommendHealth: dashboard.templeRecommendHealth,
      recentBaptisms: dashboard.recentBaptisms,
      recommendExpirationRisk: dashboard.recommendExpirationRisk,
      templeRecommendAttentionMembers,
      recentBaptismMembers,
      recommendExpirationMembers
    };
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeFullReportsData = async (): Promise<SqliteSpikeFullReportsData> => {
  const [dashboard, shell, status] = await Promise.all([
    loadSqliteSpikeDashboardData(),
    loadSqliteSpikeReportsShellData(),
    Promise.resolve(getSqliteSpikeStatus())
  ]);

  if (!status.exists || status.members === 0) {
    return {
      overview: shell.overview,
      missionEligible: [],
      unitHealth: [],
      leadershipTenure: [],
      recentMoveIns: [],
      templeRecommendHealth: {
        statusCounts: [],
        attentionMembers: [],
        recoveredAfterLongLapse: [],
        trackingSince: null,
        daysTracked: 0
      },
      seminaryInstituteByUnit: [],
      newReturningStrengthening: { summary: [], members: [] },
      priesthoodProgression: { summary: [], members: [] },
      recentBaptisms: { summary: [], members: [] },
      recommendExpirationRisk: { summary: [], members: [] },
      ministeringGaps: { summary: [], members: [] },
      seminaryInstituteOpportunity: [],
      householdOutreach: { summary: [], households: [] },
      covenantPathProgression: [],
      recentBaptismPathCohort: []
    };
  }

  const db = openSqliteSpikeDb();
  try {
    const members = db.prepare(
      `SELECT
        lcr_member_id AS lcrMemberId,
        household_id AS householdId,
        lcr_household_id AS lcrHouseholdId,
        COALESCE(NULLIF(preferred_name, ''), TRIM(first_name || ' ' || last_name)) AS fullName,
        preferred_name AS preferredName,
        first_name AS firstName,
        last_name AS lastName,
        unit_name AS unitName,
        unit_abbreviation AS unitAbbreviation,
        address_line1 AS addressLine1,
        address_line2 AS addressLine2,
        city,
        state_or_province AS stateOrProvince,
        postal_code AS postalCode,
        country,
        primary_email AS primaryEmail,
        primary_phone AS primaryPhone,
        gender,
        birthdate,
        birth_country AS birthCountry,
        birthplace,
        age,
        member_status AS memberStatus,
        move_in_date AS moveInDate,
        is_convert AS isConvert,
        baptism_date AS baptismDate,
        confirmation_date AS confirmationDate,
        endowment_date AS endowmentDate,
        endowment_status AS endowmentStatus,
        temple_endowed AS templeEndowed,
        temple_recommend_status AS templeRecommendStatus,
        temple_recommend_expiration_date AS templeRecommendExpirationDate,
        temple_recommend_type AS templeRecommendType,
        mission_status AS missionStatus,
        mission_language AS missionLanguage,
        mission_country AS missionCountry,
        is_returned_missionary AS isReturnedMissionary,
        is_accountable AS isAccountable,
        is_born_in_covenant AS isBornInCovenant,
        is_divorced AS isDivorced,
        is_married AS isMarried,
        marriage_date AS marriageDate,
        marriage_status AS marriageStatus,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute,
        potential_institute_student AS potentialInstituteStudent,
        potential_seminary_student AS potentialSeminaryStudent,
        has_ministering_brothers AS hasMinisteringBrothers,
        has_ministering_sisters AS hasMinisteringSisters,
        ministering_brothers AS ministeringBrothers,
        ministering_sisters AS ministeringSisters,
        spouse_name AS spouseName,
        head_of_house AS headOfHouse,
        household_position AS householdPosition,
        sealing_to_parents AS sealingToParents,
        sealing_to_spouse AS sealingToSpouse,
        priesthood_type AS priesthoodType,
        priesthood_office AS priesthoodOffice,
        ordination_date AS ordinationDate,
        institute_status AS instituteStatus,
        seminary_status AS seminaryStatus
       FROM members`
    ).all() as SpikeMemberRow[];

    const callings = db.prepare(
      `SELECT
        lcr_member_id AS lcrMemberId,
        unit_name AS unitName,
        title,
        organization_name AS organizationName,
        sustained_on AS sustainedOn,
        set_apart_on AS setApartOn,
        is_current AS isCurrent
       FROM callings`
    ).all() as SpikeCallingDetailRow[];

    const households = db.prepare(
      `SELECT
        id,
        household_name AS householdName,
        unit_number AS unitNumber,
        address_line1 AS addressLine1,
        address_line2 AS addressLine2,
        city,
        state,
        postal_code AS postalCode,
        country
       FROM households`
    ).all() as SpikeHouseholdRow[];

    const membersByUnit = new Map<string, SpikeMemberRow[]>();
    const householdMembersById = new Map<number, SpikeMemberRow[]>();
    for (const member of members) {
      const unit = unitLabel(member);
      const unitBucket = membersByUnit.get(unit) ?? [];
      unitBucket.push(member);
      membersByUnit.set(unit, unitBucket);

      if (member.householdId !== null && member.householdId !== undefined) {
        const householdBucket = householdMembersById.get(member.householdId) ?? [];
        householdBucket.push(member);
        householdMembersById.set(member.householdId, householdBucket);
      }
    }

    const currentCallings = callings.filter((calling) => calling.isCurrent === 1);
    const currentCallingsByMember = new Map<string, SpikeCallingDetailRow[]>();
    for (const calling of currentCallings) {
      if (!calling.lcrMemberId) {
        continue;
      }
      const bucket = currentCallingsByMember.get(calling.lcrMemberId) ?? [];
      bucket.push(calling);
      currentCallingsByMember.set(calling.lcrMemberId, bucket);
    }

    const currentCallingTitleForMember = (lcrMemberId: string) => {
      const rows = currentCallingsByMember.get(lcrMemberId) ?? [];
      const sorted = [...rows].sort(
        (left, right) =>
          (right.sustainedOn ?? "").localeCompare(left.sustainedOn ?? "") ||
          cleanCallingTitle(left.title).localeCompare(cleanCallingTitle(right.title))
      );
      return cleanCallingTitle(sorted[0]?.title ?? null) || null;
    };

    const assignedMinisterVariants = new Set<string>();
    for (const member of members) {
      for (const entry of [...splitMinisteringAssignments(member.ministeringBrothers), ...splitMinisteringAssignments(member.ministeringSisters)]) {
        for (const variant of buildNameVariants(entry)) {
          assignedMinisterVariants.add(variant);
        }
      }
    }

    const recentBaptismPathCohort: RecentBaptismPathRow[] = members
      .filter((member) => {
        const baptismDate = safeDate(member.baptismDate);
        return baptismDate && baptismDate >= daysAgoThreshold(730);
      })
      .map((member) => {
        const fullName = member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`;
        const assignedAsMinister = buildNameVariants(fullName).some((variant) => assignedMinisterVariants.has(variant));
        const currentCalling = member.lcrMemberId ? currentCallingTitleForMember(member.lcrMemberId) : null;
        const hasCurrentCalling = Boolean(currentCalling);
        const ministeringAssigned = toBool(member.hasMinisteringBrothers) || toBool(member.hasMinisteringSisters);

        return {
          lcrMemberId: member.lcrMemberId ?? "",
          fullName,
          unitName: unitLabel(member),
          baptismDate: member.baptismDate ?? null,
          templeRecommendStatus: member.templeRecommendStatus ?? null,
          hasCurrentCalling,
          currentCalling,
          ministeringAssigned,
          assignedAsMinister,
          assignedAsMinisterLabel: assignedAsMinister ? "Yes" : "No"
        };
      })
      .sort((left, right) => (right.baptismDate ?? "").localeCompare(left.baptismDate ?? "") || left.fullName.localeCompare(right.fullName));

    const unitHealth = [...membersByUnit.entries()]
      .map(([unitName, rows]) => ({
        unitName,
        memberCount: rows.length,
        currentCallings: currentCallings.filter((calling) => unitName === (calling.unitName ?? "Unknown")).length,
        leadershipCallings: currentCallings.filter((calling) => unitName === (calling.unitName ?? "Unknown") && /(president|bishop|high councilor)/i.test(calling.title)).length,
        seminaryAttending: rows.filter((member) => {
          const age = youthProgramAge(member);
          return age !== null && age >= 14 && age <= 18 && toBool(member.isAttendingSeminary);
        }).length,
        instituteAttending: rows.filter((member) => {
          const age = actualAge(member);
          return age !== null && age >= 18 && age <= 35 && toBool(member.isAttendingInstitute);
        }).length,
        convertsLast12Months: rows.filter((member) => {
          const effectiveDate = safeDate(member.baptismDate) ?? safeDate(member.moveInDate);
          return toBool(member.isConvert) && effectiveDate && effectiveDate >= daysAgoThreshold(365);
        }).length
      }))
      .sort((left, right) => left.unitName.localeCompare(right.unitName));

    const leadershipTenure = currentCallings
      .filter((calling) => /(president|bishop|high councilor)/i.test(calling.title) && calling.lcrMemberId && calling.sustainedOn)
      .map((calling) => {
        const member = members.find((candidate) => candidate.lcrMemberId === calling.lcrMemberId);
        if (!member) {
          return null;
        }
        return {
          lcrMemberId: member.lcrMemberId ?? "",
          unitName: unitLabel(member),
          fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
          callingTitle: cleanCallingTitle(calling.title),
          yearsInCalling: yearsBetween(calling.sustainedOn) ?? 0
        };
      })
      .filter(Boolean) as SqliteSpikeFullReportsData["leadershipTenure"];

    const recentMoveIns = members
      .filter((member) => {
        const moveInDate = safeDate(member.moveInDate);
        return moveInDate && moveInDate >= daysAgoThreshold(365);
      })
      .map((member) => ({
        lcrMemberId: member.lcrMemberId ?? "",
        unitName: unitLabel(member),
        fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
        moveInDate: member.moveInDate ?? null,
        phoneNumber: member.primaryPhone ?? null,
        email: member.primaryEmail ?? null
      }))
      .sort((left, right) => (right.moveInDate ?? "").localeCompare(left.moveInDate ?? "") || left.fullName.localeCompare(right.fullName))
      .slice(0, 100);

    const seminaryInstituteByUnit: SeminaryInstituteByUnitRow[] = dashboard.seminaryByUnit.map((row) => {
      const instituteRow = dashboard.instituteByUnit.find((candidate) => candidate.label === row.label);
      return {
        unitName: row.label,
        seminaryEligible: row.potential,
        seminaryAttending: row.actual,
        seminaryParticipationPct: row.potential > 0 ? Math.round((row.actual / row.potential) * 100) : 0,
        instituteEligible: instituteRow?.potential ?? 0,
        instituteAttending: instituteRow?.actual ?? 0,
        instituteParticipationPct:
          instituteRow && instituteRow.potential > 0 ? Math.round((instituteRow.actual / instituteRow.potential) * 100) : 0
      };
    });

    const newReturningMembers = members
      .filter((member) => {
        const focusDate = safeDate(member.baptismDate) ?? safeDate(member.moveInDate);
        return (toBool(member.isConvert) || Boolean(member.moveInDate)) && focusDate && focusDate >= daysAgoThreshold(730);
      })
      .map((member) => {
        const currentCalling = member.lcrMemberId ? currentCallingTitleForMember(member.lcrMemberId) : null;
        return {
          lcrMemberId: member.lcrMemberId ?? "",
          fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
          unitName: unitLabel(member),
          focusCategory: toBool(member.isConvert) ? "Convert" : "Move-in",
          focusDate: member.baptismDate ?? member.moveInDate ?? null,
          templeRecommendStatus: member.templeRecommendStatus ?? null,
          hasCurrentCalling: Boolean(currentCalling),
          ministeringAssigned: toBool(member.hasMinisteringBrothers) || toBool(member.hasMinisteringSisters),
          recoveredAfterLongLapse: false,
          reactivatedAt: null,
          inactiveDays: null
        };
      })
      .sort((left, right) => (right.focusDate ?? "").localeCompare(left.focusDate ?? "") || left.fullName.localeCompare(right.fullName));

    const newReturningStrengthening: NewReturningStrengtheningReport = {
      summary: [
        { label: "Convert", value: newReturningMembers.filter((row) => row.focusCategory === "Convert").length },
        { label: "Move-in", value: newReturningMembers.filter((row) => row.focusCategory === "Move-in").length },
        { label: "Recommend Recovered (1y+)", value: 0 }
      ],
      members: newReturningMembers
    };

    const priesthoodMembers = members
      .filter((member) => isMale(member.gender))
      .map((member) => {
        const age = actualAge(member);
        const currentOffice = member.priesthoodOffice ?? null;
        let recommendedNextOffice: string | null = null;
        const office = (currentOffice ?? "").toLowerCase();
        if ((age ?? 0) >= 30 && office === "elder") {
          recommendedNextOffice = "High Priest";
        } else if ((age ?? 0) >= 18 && !/(elder|high priest)/i.test(office)) {
          recommendedNextOffice = "Elder";
        } else if ((age ?? 0) >= 16 && !/(priest|elder|high priest)/i.test(office)) {
          recommendedNextOffice = "Priest";
        } else if ((age ?? 0) >= 14 && !/(teacher|priest|elder|high priest)/i.test(office)) {
          recommendedNextOffice = "Teacher";
        }

        if (!recommendedNextOffice) {
          return null;
        }

        return {
          lcrMemberId: member.lcrMemberId ?? "",
          fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
          unitName: unitLabel(member),
          age,
          currentOffice,
          recommendedNextOffice
        };
      })
      .filter(Boolean) as PriesthoodProgressionReport["members"];

    const priesthoodProgression: PriesthoodProgressionReport = {
      summary: [
        { label: "Teacher", value: priesthoodMembers.filter((row) => row.recommendedNextOffice === "Teacher").length },
        { label: "Priest", value: priesthoodMembers.filter((row) => row.recommendedNextOffice === "Priest").length },
        { label: "Elder", value: priesthoodMembers.filter((row) => row.recommendedNextOffice === "Elder").length },
        { label: "High Priest", value: priesthoodMembers.filter((row) => row.recommendedNextOffice === "High Priest").length }
      ],
      members: priesthoodMembers
    };

    const ministeringGapMembers = members
      .filter((member) => isActiveMember(member.memberStatus) && !toBool(member.hasMinisteringBrothers) && !toBool(member.hasMinisteringSisters))
      .map((member) => ({
        lcrMemberId: member.lcrMemberId ?? "",
        fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
        unitName: unitLabel(member),
        age: member.age ?? actualAge(member),
        gapCategory: "No Assigned Ministers" as const,
        hasMinisteringBrothers: member.hasMinisteringBrothers === undefined ? null : toBool(member.hasMinisteringBrothers),
        hasMinisteringSisters: member.hasMinisteringSisters === undefined ? null : toBool(member.hasMinisteringSisters),
        ministeringBrothers: member.ministeringBrothers ?? null,
        ministeringSisters: member.ministeringSisters ?? null,
        spouseName: member.spouseName ?? null,
        phoneNumber: member.primaryPhone ?? null,
        email: member.primaryEmail ?? null
      }))
      .sort((left, right) => left.unitName.localeCompare(right.unitName) || left.fullName.localeCompare(right.fullName));

    const ministeringGaps: MinisteringGapReport = {
      summary: [{ label: "No Assigned Ministers", value: ministeringGapMembers.length }],
      members: ministeringGapMembers
    };

    const seminaryInstituteOpportunity = members
      .flatMap((member) => {
        const fullName = member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`;
        const age = actualAge(member);
        const programAge = youthProgramAge(member);
        const rows: SqliteSpikeFullReportsData["seminaryInstituteOpportunity"] = [];
        if (programAge !== null && programAge >= 14 && programAge <= 18 && !toBool(member.isAttendingSeminary)) {
          rows.push({
            lcrMemberId: member.lcrMemberId ?? "",
            fullName,
            unitName: unitLabel(member),
            age,
            track: "Seminary",
            attending: member.isAttendingSeminary === undefined ? null : toBool(member.isAttendingSeminary),
            potentialFlag: member.potentialSeminaryStudent === undefined ? null : toBool(member.potentialSeminaryStudent),
            statusText: member.seminaryStatus ?? null,
            phoneNumber: member.primaryPhone ?? null,
            email: member.primaryEmail ?? null
          });
        }
        if (age !== null && age >= 18 && age <= 35 && !toBool(member.isAttendingInstitute)) {
          rows.push({
            lcrMemberId: member.lcrMemberId ?? "",
            fullName,
            unitName: unitLabel(member),
            age,
            track: "Institute",
            attending: member.isAttendingInstitute === undefined ? null : toBool(member.isAttendingInstitute),
            potentialFlag: member.potentialInstituteStudent === undefined ? null : toBool(member.potentialInstituteStudent),
            statusText: member.instituteStatus ?? null,
            phoneNumber: member.primaryPhone ?? null,
            email: member.primaryEmail ?? null
          });
        }
        return rows;
      })
      .sort((left, right) => left.track.localeCompare(right.track) || left.unitName.localeCompare(right.unitName) || (right.age ?? 0) - (left.age ?? 0));

    const householdOutreachHouseholds = households
      .map((household) => {
        const householdMembers = householdMembersById.get(household.id) ?? [];
        const youthCount = householdMembers.filter((member) => isYouthOrYsa(member)).length;
        const recentBaptismCount = householdMembers.filter((member) => {
          const baptismDate = safeDate(member.baptismDate);
          return baptismDate && baptismDate >= daysAgoThreshold(365);
        }).length;
        const recommendRiskCount = householdMembers.filter((member) => {
          const expiration = safeDate(member.templeRecommendExpirationDate);
          if (!expiration) {
            return false;
          }
          return daysBetween(expiration, startOfToday()) <= 90;
        }).length;
        const ministeringGapCount = householdMembers.filter(
          (member) => !toBool(member.hasMinisteringBrothers) && !toBool(member.hasMinisteringSisters)
        ).length;
        const focusAreas = [
          youthCount > 0 ? "Youth / YSA" : null,
          recentBaptismCount > 0 ? "Recent Baptism" : null,
          recommendRiskCount > 0 ? "Recommend Risk" : null,
          ministeringGapCount > 0 ? "Ministering Gap" : null
        ].filter(Boolean) as string[];

        if (focusAreas.length === 0) {
          return null;
        }

        return {
          householdId: household.id,
          householdName: household.householdName,
          headOfHouse: householdMembers.find((member) => member.headOfHouse)?.headOfHouse ?? householdMembers[0]?.headOfHouse ?? null,
          unitName: unitLabel(householdMembers[0] ?? { unitName: null, unitAbbreviation: null }),
          memberCount: householdMembers.length,
          youthCount,
          recentBaptismCount,
          recommendRiskCount,
          ministeringGapCount,
          householdEmails: [...new Set(householdMembers.map((member) => member.primaryEmail).filter(Boolean))].join(" | "),
          householdPhones: [...new Set(householdMembers.map((member) => member.primaryPhone).filter(Boolean))].join(" | "),
          focusAreas
        };
      })
      .filter(Boolean) as HouseholdOutreachReport["households"];

    const householdOutreach: HouseholdOutreachReport = {
      summary: [
        { label: "Youth / YSA", value: householdOutreachHouseholds.filter((row) => row.youthCount > 0).length },
        { label: "Recent Baptism", value: householdOutreachHouseholds.filter((row) => row.recentBaptismCount > 0).length },
        { label: "Recommend Risk", value: householdOutreachHouseholds.filter((row) => row.recommendRiskCount > 0).length },
        { label: "Ministering Gap", value: householdOutreachHouseholds.filter((row) => row.ministeringGapCount > 0).length }
      ],
      households: householdOutreachHouseholds.sort((left, right) => left.unitName.localeCompare(right.unitName) || left.householdName.localeCompare(right.householdName))
    };

    const covenantPathProgression = members
      .map<CovenantPathProgressionRow>((member) => {
        const age = actualAge(member);
        const currentCalling = member.lcrMemberId ? currentCallingTitleForMember(member.lcrMemberId) : null;
        const ministeringAssigned = toBool(member.hasMinisteringBrothers) || toBool(member.hasMinisteringSisters);
        const milestones: Array<{ label: string; date: string }> = [];
        if (member.baptismDate) milestones.push({ label: "Baptized", date: member.baptismDate });
        if (member.confirmationDate) milestones.push({ label: "Confirmed", date: member.confirmationDate });
        if (member.endowmentDate) milestones.push({ label: "Endowed", date: member.endowmentDate });
        if (member.ordinationDate) milestones.push({ label: "Ordained", date: member.ordinationDate });
        milestones.sort((left, right) => right.date.localeCompare(left.date));

        const ordinanceBucket =
          (member.baptismDate && safeDate(member.baptismDate) && safeDate(member.baptismDate)! >= daysAgoThreshold(730)) ||
          (member.confirmationDate && safeDate(member.confirmationDate) && safeDate(member.confirmationDate)! >= daysAgoThreshold(730)) ||
          (member.endowmentDate && safeDate(member.endowmentDate) && safeDate(member.endowmentDate)! >= daysAgoThreshold(730)) ||
          (member.ordinationDate && safeDate(member.ordinationDate) && safeDate(member.ordinationDate)! >= daysAgoThreshold(730))
            ? "Recent Milestone"
            : member.endowmentDate
              ? "Endowed"
              : member.baptismDate && member.confirmationDate
                ? "Baptized + Confirmed"
                : member.baptismDate
                  ? "Baptized"
                  : "No Recorded Ordinance";

        let templeBucket = "No Active Recommend";
        if (isActiveTempleRecommendStatus(member.templeRecommendStatus)) {
          const expiration = safeDate(member.templeRecommendExpirationDate);
          templeBucket = expiration && daysBetween(expiration, startOfToday()) <= 90 ? "Active Recommend (Expiring Soon)" : "Active Recommend";
        }

        const serviceBucket = currentCalling && ministeringAssigned
          ? "Calling + Ministering"
          : currentCalling
            ? "Calling Only"
            : ministeringAssigned
              ? "Ministering Only"
              : "No Current Engagement";

        let youthBucket: string | null = null;
        if ((age ?? 0) >= 12 && (age ?? 0) <= 18) {
          youthBucket = toBool(member.isAttendingSeminary)
            ? "Seminary Attending"
            : toBool(member.potentialSeminaryStudent)
              ? "Seminary Opportunity"
              : "Seminary Not Attending";
        } else if ((age ?? 0) > 18 && (age ?? 0) <= 25) {
          youthBucket = toBool(member.isAttendingInstitute)
            ? "Institute Attending"
            : toBool(member.potentialInstituteStudent)
              ? "Institute Opportunity"
              : "Institute Not Attending";
        }

        const sealedToParents = Boolean(member.sealingToParents);
        const sealedToSpouse = Boolean(member.sealingToSpouse);
        let familyBucket: string | null = null;
        if (toBool(member.isMarried)) {
          familyBucket = sealedToSpouse ? "Sealed to Spouse" : "Not Sealed to Spouse";
        } else if ((age ?? 0) <= 25) {
          familyBucket = sealedToParents ? "Sealed to Parents" : "Not Sealed to Parents";
        }

        const attentionScore =
          Number(templeBucket !== "Active Recommend") +
          Number(serviceBucket === "No Current Engagement") +
          Number(Boolean(youthBucket?.includes("Opportunity") || youthBucket?.includes("Not Attending"))) +
          Number(Boolean(familyBucket?.startsWith("Not Sealed"))) +
          Number(ordinanceBucket === "No Recorded Ordinance");

        let overallFocus = "Steady Progress";
        if (ordinanceBucket === "Recent Milestone") {
          overallFocus = "Recent Ordinance Progress";
        } else if (templeBucket !== "Active Recommend") {
          overallFocus = "Temple Progress Opportunity";
        } else if (Boolean(youthBucket?.includes("Opportunity") || youthBucket?.includes("Not Attending"))) {
          overallFocus = "Youth Formation Opportunity";
        } else if (serviceBucket === "No Current Engagement") {
          overallFocus = "Service Engagement Opportunity";
        } else if (Boolean(familyBucket?.startsWith("Not Sealed"))) {
          overallFocus = "Family Ordinance Opportunity";
        }

        return {
          lcrMemberId: member.lcrMemberId ?? "",
          fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
          unitName: unitLabel(member),
          age,
          baptismDate: member.baptismDate ?? null,
          confirmationDate: member.confirmationDate ?? null,
          endowmentDate: member.endowmentDate ?? null,
          ordinationDate: member.ordinationDate ?? null,
          templeRecommendStatus: member.templeRecommendStatus ?? null,
          currentCalling,
          ministeringAssigned,
          ordinanceBucket,
          templeBucket,
          serviceBucket,
          youthBucket,
          familyBucket,
          overallFocus,
          attentionScore,
          recentMilestoneDate: milestones[0]?.date ?? null,
          milestones: milestones.map((milestone) => `${milestone.label} (${milestone.date})`)
        };
      })
      .filter((row) => row.attentionScore >= 1)
      .sort((left, right) => right.attentionScore - left.attentionScore || (right.recentMilestoneDate ?? "").localeCompare(left.recentMilestoneDate ?? ""));

    return {
      overview: shell.overview,
      missionEligible: [],
      unitHealth,
      leadershipTenure,
      recentMoveIns,
      templeRecommendHealth: {
        statusCounts: shell.templeRecommendHealth,
        attentionMembers: shell.templeRecommendAttentionMembers,
        recoveredAfterLongLapse: [],
        trackingSince: null,
        daysTracked: 0
      },
      seminaryInstituteByUnit,
      newReturningStrengthening,
      priesthoodProgression,
      recentBaptisms: {
        summary: shell.recentBaptisms,
        members: shell.recentBaptismMembers
      },
      recommendExpirationRisk: {
        summary: shell.recommendExpirationRisk,
        members: shell.recommendExpirationMembers
      },
      ministeringGaps,
      seminaryInstituteOpportunity,
      householdOutreach,
      covenantPathProgression,
      recentBaptismPathCohort
    };
  } finally {
    db.close();
  }
};
