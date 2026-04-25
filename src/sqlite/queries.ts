import { getSqliteSpikeStatus, openSqliteSpikeDb } from "@/src/sqlite/db";
import { getEffectiveDesktopEnv, parseHighCouncilUnitAssignments } from "@/src/config/desktopConfig";
import type {
  CommitteeMemberRow,
  CommitteeRoster,
  CovenantPathProgressionRow,
  CurrentlyServingMissionaryRow,
  EndowmentCandidateRow,
  MemberDetail,
  MissionEligibleRow,
  MissionYouthPipelineRow,
  RecentBaptismPathRow,
  RecentBaptismRow,
  RecommendExpirationRiskRow,
  TempleRecommendAttentionRow,
  TempleRecommendHealthReport,
  SeminaryInstituteByUnitRow,
  NewReturningStrengtheningReport,
  PriesthoodProgressionReport,
  MinisteringGapReport,
  HouseholdOutreachReport,
  UnitHealthRadarRow,
  YouthOrganizationTransitionRow,
  YouthTransitionMilestoneRow
} from "@/src/services/intelligenceService";
import { buildVisualOrgPayload, normalizeVisualOrgUnit, type VisualOrgSourceRow } from "@/src/services/visualOrgService";
import type { DashboardOverviewMetrics } from "@/src/types/dashboard";
import type { VisualOrgPayload } from "@/src/types/visualOrg";

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
  isSingle?: number | null;
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
  lcrMemberId?: string | null;
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
const normalizeSelectedUnit = (unit?: string | null) => {
  const trimmed = unit?.trim();
  return trimmed ? trimmed : null;
};
const matchesSelectedUnit = (
  row: { unitName: string | null; unitAbbreviation?: string | null },
  selectedUnit: string | null
) => {
  if (!selectedUnit) {
    return true;
  }
  return unitLabel({ unitName: row.unitName, unitAbbreviation: row.unitAbbreviation ?? null }) === selectedUnit;
};
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
const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const monthKeyFromValue = (value?: string | null) => {
  const date = safeDate(value);
  return date ? formatMonthKey(date) : null;
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
const normalizeCallingTitleKey = (value: string | null | undefined) =>
  collapseWhitespace(cleanCallingTitle(value ?? null).toLowerCase().replace(/[^a-z0-9]+/g, " "));
const distinctCurrentCallingKeys = (
  rows: Array<{ lcrMemberId: string | null; title: string; unitName?: string | null }>,
  filter?: (row: { lcrMemberId: string | null; title: string; unitName?: string | null }) => boolean
) => {
  const keys = new Set<string>();
  for (const row of rows) {
    if (!row.lcrMemberId) {
      continue;
    }
    if (filter && !filter(row)) {
      continue;
    }
    keys.add(`${row.unitName ?? "Unknown"}::${row.lcrMemberId}::${normalizeCallingTitleKey(row.title)}`);
  }
  return keys;
};
const buildSnapshotCoverage = (latestSnapshotLogId: number | null, previousSnapshotLogId: number | null) => ({
  latestSnapshotLogId,
  previousSnapshotLogId,
  ready: Boolean(latestSnapshotLogId && previousSnapshotLogId),
  status: latestSnapshotLogId
    ? previousSnapshotLogId
      ? "ready"
      : "baseline-established"
    : "not-seeded"
});
const humanizeField = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
const diffSnapshotFields = (
  current: Record<string, unknown>,
  previous: Record<string, unknown>,
  ignoredKeys: string[] = []
) => {
  const ignored = new Set(ignoredKeys);
  const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(previous)]));

  return keys
    .filter((key) => !ignored.has(key))
    .filter((key) => JSON.stringify(current[key] ?? null) !== JSON.stringify(previous[key] ?? null))
    .map(humanizeField);
};
const parseSnapshotData = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
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
const isFemale = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "f" || normalized === "female" || normalized === "woman";
};
const isUnmarried = (member: Pick<SpikeMemberRow, "isMarried" | "isSingle" | "marriageStatus">) =>
  !toBool(member.isMarried) &&
  (toBool(member.isSingle) || /^single$/i.test(member.marriageStatus ?? ""));
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
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  unitName: string | null;
  age: number | null;
  gender: string | null;
  email: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  country: string | null;
  householdId: number | null;
  householdPosition: string | null;
  memberStatus: string | null;
  isMarried: boolean | null;
  isSingle: boolean | null;
  marriageStatus: string | null;
  missionStatus: string | null;
  missionCountry: string | null;
  isReturnedMissionary: boolean | null;
  priesthoodType: string | null;
  priesthoodOffice: string | null;
}

type RawSqliteSpikeMemberRow = Omit<SqliteSpikeMemberRow, "isMarried" | "isSingle" | "isReturnedMissionary"> & {
  isMarried: number | boolean | null;
  isSingle: number | boolean | null;
  isReturnedMissionary: number | boolean | null;
};

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

type SqliteSnapshotLogRow = {
  id: number;
  syncType: string;
  startedAt: string;
  completedAt: string | null;
};

type SqliteMemberSnapshotRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  moveInDate: string | null;
  rowHash: string;
  snapshotData: Record<string, unknown>;
};

type SqliteCallingSnapshotRow = {
  lcrCallingId: string;
  unitName: string | null;
  memberLcrMemberId: string | null;
  memberName: string | null;
  callingTitle: string;
  isCurrent: boolean;
  sustainedOn: string | null;
  releasedOn: string | null;
  rowHash: string;
  snapshotData: Record<string, unknown>;
};

type SqliteContactSnapshotRow = {
  memberLcrMemberId: string;
  fullName: string;
  unitName: string | null;
  value: string;
  rowHash: string;
  snapshotData: Record<string, unknown>;
};

type SqliteSpikeLeadershipTrainingAlert = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  callingTitle: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  sustainedOn: string | null;
  setApartOn: string | null;
  recentDateLabel: "Sustained" | "Set Apart";
  recentDate: string;
  daysAgo: number;
  pendingSetApart: boolean;
  trainerGroup: "stake_presidency" | "high_council" | "stake_rs" | "stake_yw" | "stake_primary" | "stake_ss";
  trainerGroupLabel: string;
};

export type SqliteSpikeSyncDiffReport = {
  latestSync: SqliteSnapshotLogRow | null;
  previousSync: SqliteSnapshotLogRow | null;
  windowStart: string | null;
  windowEnd: string | null;
  coverage: {
    members: { latestSnapshotLogId: number | null; previousSnapshotLogId: number | null; ready: boolean; status: string };
    callings: { latestSnapshotLogId: number | null; previousSnapshotLogId: number | null; ready: boolean; status: string };
    emails: { latestSnapshotLogId: number | null; previousSnapshotLogId: number | null; ready: boolean; status: string };
    phones: { latestSnapshotLogId: number | null; previousSnapshotLogId: number | null; ready: boolean; status: string };
  };
  comparisonWindows: {
    members: { start: string | null; end: string | null };
    callings: { start: string | null; end: string | null };
    emails: { start: string | null; end: string | null };
    phones: { start: string | null; end: string | null };
  };
  counts: {
    membersChanged: number;
    membersAdded: number;
    membersRemoved: number;
    membersUpdated: number;
    callingsChanged: number;
    callingsAdded: number;
    callingsRemoved: number;
    callingsUpdated: number;
    organizationChanged: number;
    unitChanged: number;
    emailChanged: number;
    emailAdded: number;
    emailRemoved: number;
    emailUpdated: number;
    phoneChanged: number;
    phoneAdded: number;
    phoneRemoved: number;
    phoneUpdated: number;
  };
  members: Array<{
    lcrMemberId: string;
    fullName: string;
    unitName: string;
    moveInDate: string | null;
    changeType: "Added" | "Removed" | "Changed";
    changedFields: string[];
    updatedAt: string;
  }>;
  callings: Array<{
    lcrCallingId: string;
    unitName: string;
    callingTitle: string;
    isCurrent: boolean;
    sustainedOn: string | null;
    releasedOn: string | null;
    changeType: "Added" | "Released" | "Removed" | "Updated";
    changedFields: string[];
    updatedAt: string;
  }>;
  contacts: Array<{
    contactType: "Email" | "Phone";
    memberLcrMemberId: string;
    fullName: string;
    unitName: string;
    value: string;
    changeType: "Added" | "Removed" | "Changed";
    changedFields: string[];
    updatedAt: string;
  }>;
};

export const loadSqliteSpikeDashboardData = async (selectedUnitArg?: string | null): Promise<SqliteSpikeDashboardData> => {
  const selectedUnit = normalizeSelectedUnit(selectedUnitArg);
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
    const allMembers = db.prepare(
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

    const allCallings = db.prepare(
      `SELECT
        COALESCE(NULLIF(m.unit_name, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName,
        c.is_current AS isCurrent,
        c.lcr_member_id AS lcrMemberId
       FROM callings c
       LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id`
    ).all() as SpikeCallingRow[];

    const members = allMembers.filter((member) => matchesSelectedUnit(member, selectedUnit));
    const memberIds = new Set(members.map((member) => member.lcrMemberId ?? ""));
    const callings = selectedUnit
      ? allCallings.filter(
          (calling) =>
            (calling.lcrMemberId && memberIds.has(calling.lcrMemberId)) ||
            (calling.unitName ?? "Unknown") === selectedUnit
        )
      : allCallings;

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
        first_name AS firstName,
        last_name AS lastName,
        COALESCE(NULLIF(preferred_name, ''), TRIM(first_name || ' ' || last_name)) AS fullName,
        COALESCE(NULLIF(unit_name, ''), NULLIF(unit_abbreviation, ''), 'Unknown') AS unitName,
        age,
        gender,
        primary_email AS email,
        primary_phone AS phoneNumber,
        address_line1 AS addressLine1,
        address_line2 AS addressLine2,
        city,
        state_or_province AS stateOrProvince,
        postal_code AS postalCode,
        country,
        household_id AS householdId,
        household_position AS householdPosition,
        member_status AS memberStatus,
        is_married AS isMarried,
        is_single AS isSingle,
        marriage_status AS marriageStatus,
        mission_status AS missionStatus,
        mission_country AS missionCountry,
        is_returned_missionary AS isReturnedMissionary,
        priesthood_type AS priesthoodType,
        priesthood_office AS priesthoodOffice
       FROM members
       ORDER BY last_name, first_name`
    ).all() as RawSqliteSpikeMemberRow[];

    return rows.map((row) => ({
      ...row,
      unitName: row.unitName === "Unknown" ? null : row.unitName,
      isMarried: row.isMarried === null || row.isMarried === undefined ? null : row.isMarried === 1 || row.isMarried === true,
      isSingle: row.isSingle === null || row.isSingle === undefined ? null : row.isSingle === 1 || row.isSingle === true,
      isReturnedMissionary:
        row.isReturnedMissionary === null || row.isReturnedMissionary === undefined
          ? null
          : row.isReturnedMissionary === 1 || row.isReturnedMissionary === true
    }));
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeAvailableUnits = async (): Promise<string[]> => {
  const status = getSqliteSpikeStatus();
  if (!status.exists || status.members === 0) {
    return [];
  }

  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `SELECT DISTINCT COALESCE(NULLIF(unit_name, ''), NULLIF(unit_abbreviation, ''), 'Unknown') AS unitName
       FROM members
       ORDER BY unitName`
    ).all() as Array<{ unitName: string }>;

    return rows.map((row) => row.unitName).filter((unitName) => unitName && unitName !== "Unknown");
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

export const loadSqliteSpikeReportsShellData = async (selectedUnitArg?: string | null): Promise<SqliteSpikeReportsShellData> => {
  const selectedUnit = normalizeSelectedUnit(selectedUnitArg);
  const dashboard = await loadSqliteSpikeDashboardData(selectedUnit);
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
    const allMembers = db.prepare(
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

    const allCallings = db.prepare(
      `SELECT title, lcr_member_id AS lcrMemberId
       FROM callings
       WHERE is_current = 1`
    ).all() as Array<{ title: string; lcrMemberId: string | null }>;

    const members = allMembers.filter((member) => matchesSelectedUnit(member, selectedUnit));
    const memberIds = new Set(members.map((member) => member.lcrMemberId ?? ""));
    const callings = allCallings.filter((calling) => !selectedUnit || (calling.lcrMemberId ? memberIds.has(calling.lcrMemberId) : false));

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

export const loadSqliteSpikeFullReportsData = async (selectedUnitArg?: string | null): Promise<SqliteSpikeFullReportsData> => {
  const selectedUnit = normalizeSelectedUnit(selectedUnitArg);
  const [dashboard, shell, status] = await Promise.all([
    loadSqliteSpikeDashboardData(selectedUnit),
    loadSqliteSpikeReportsShellData(selectedUnit),
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
    const allMembers = db.prepare(
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

    const allCallings = db.prepare(
      `SELECT
        c.lcr_member_id AS lcrMemberId,
        COALESCE(NULLIF(m.unit_name, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName,
        c.title,
        c.organization_name AS organizationName,
        c.sustained_on AS sustainedOn,
        c.set_apart_on AS setApartOn,
        c.is_current AS isCurrent
       FROM callings c
       LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id`
    ).all() as SpikeCallingDetailRow[];

    const allHouseholds = db.prepare(
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

    const members = allMembers.filter((member) => matchesSelectedUnit(member, selectedUnit));
    const householdIds = new Set(
      members
        .map((member) => member.householdId)
        .filter((value): value is number => value !== null && value !== undefined)
    );
    const memberIds = new Set(members.map((member) => member.lcrMemberId ?? ""));
    const callings = allCallings.filter((calling) =>
      !selectedUnit
        ? true
        : (calling.lcrMemberId && memberIds.has(calling.lcrMemberId)) ||
          matchesSelectedUnit({ unitName: calling.unitName, unitAbbreviation: null }, selectedUnit)
    );
    const households = allHouseholds.filter((household) => householdIds.has(household.id));

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
        currentCallings: distinctCurrentCallingKeys(currentCallings, (calling) => unitName === (calling.unitName ?? "Unknown")).size,
        leadershipCallings: distinctCurrentCallingKeys(
          currentCallings,
          (calling) => unitName === (calling.unitName ?? "Unknown") && /(president|bishop|high councilor)/i.test(calling.title)
        ).size,
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


const sqliteCommitteeRules: Array<{
  key: string;
  name: string;
  handbookBasis: string;
  handbookUrl: string;
  patterns: RegExp[];
}> = [
  {
    key: "stake-presidency-meeting",
    name: "Stake Presidency Meeting",
    handbookBasis: "General Handbook 29.3.1",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [/\bstake president\b/i, /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i, /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i, /\bstake clerk\b/i, /\bstake executive secretary\b/i]
  },
  {
    key: "stake-council",
    name: "Stake Council",
    handbookBasis: "General Handbook 29.3.5",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [/\bstake president\b/i, /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i, /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i, /\bhigh council(or)?\b/i, /\bstake clerk\b/i, /\bstake executive secretary\b/i, /\bstake relief society president\b/i, /\bstake young women president\b/i, /\bstake primary president\b/i, /\bstake young men president\b/i, /\bstake sunday school president\b/i, /\bstake young single adult\b/i, /\bstake single adult\b/i]
  },
  {
    key: "stake-adult-leadership-committee",
    name: "Stake Adult Leadership Committee",
    handbookBasis: "General Handbook 29.3.8",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [/\bstake president\b/i, /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i, /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i, /\bstake relief society (president|counselor|secretary)\b/i, /\bhigh council(or)?\b/i]
  },
  {
    key: "stake-youth-leadership-committee",
    name: "Stake Youth Leadership Committee",
    handbookBasis: "General Handbook 29.3.9",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [/\bstake president\b/i, /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i, /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i, /\bstake young men (president|counselor|secretary)\b/i, /\bstake young women (president|counselor|secretary)\b/i]
  },
  {
    key: "bishops-council",
    name: "Bishops' Council",
    handbookBasis: "General Handbook 29.3.10",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [/\bstake president\b/i, /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i, /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i, /\bbishop\b/i, /\bbranch president\b/i]
  },
  {
    key: "high-council-meeting",
    name: "High Council Meeting",
    handbookBasis: "General Handbook 29.3.12",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [/\bstake president\b/i, /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i, /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i, /\bhigh council(or)?\b/i, /\bstake clerk\b/i, /\bstake executive secretary\b/i]
  },
  {
    key: "stake-single-adult-committee",
    name: "Stake Single Adult Committee",
    handbookBasis: "General Handbook 6.2.2.1",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/6-leadership-in-the-church?lang=eng",
    patterns: [/\bstake single adult\b/i, /\bstake young single adult\b/i]
  },
  {
    key: "stake-audit-committee",
    name: "Stake Audit Committee",
    handbookBasis: "General Handbook 6.2.1.3",
    handbookUrl: "https://www.churchofjesuschrist.org/study/manual/general-handbook/6-leadership-in-the-church?lang=eng",
    patterns: [/\bstake audit\b/i, /\baudit specialist\b/i]
  }
];

const dedupeSqliteCommitteeMembers = (rows: CommitteeMemberRow[]) => {
  const seen = new Set<string>();
  const output: CommitteeMemberRow[] = [];
  for (const row of rows) {
    const key = `${row.lcrMemberId}:${cleanCallingTitle(row.callingTitle).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ ...row, callingTitle: cleanCallingTitle(row.callingTitle) });
  }
  return output;
};

export const loadSqliteSpikeCallingsList = async () => {
  const status = getSqliteSpikeStatus();
  if (!status.exists || status.members === 0) return [];
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(`SELECT
      c.title AS callingTitle,
      c.organization_name AS organizationName,
      c.lcr_member_id AS lcrMemberId,
      m.primary_email AS email,
      m.primary_phone AS phoneNumber,
      m.first_name AS firstName,
      m.last_name AS lastName,
      COALESCE(m.address_line1, h.address_line1) AS addressLine1,
      COALESCE(m.address_line2, h.address_line2) AS addressLine2,
      COALESCE(m.city, h.city) AS city,
      COALESCE(m.state_or_province, h.state) AS stateOrProvince,
      COALESCE(m.postal_code, h.postal_code) AS postalCode,
      COALESCE(m.country, h.country) AS country,
      COALESCE(NULLIF(m.preferred_name, ''), TRIM(m.first_name || ' ' || m.last_name)) AS fullName,
      COALESCE(NULLIF(m.unit_name, ''), NULLIF(m.unit_abbreviation, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName,
      c.sustained_on AS sustainedOn,
      c.is_current AS isCurrent
    FROM callings c
    LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id
    LEFT JOIN households h ON h.id = m.household_id
    ORDER BY unitName, c.title`).all() as Array<{
      callingTitle: string;
      organizationName: string | null;
      lcrMemberId: string | null;
      email: string | null;
      phoneNumber: string | null;
      firstName: string | null;
      lastName: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      stateOrProvince: string | null;
      postalCode: string | null;
      country: string | null;
      fullName: string | null;
      unitName: string;
      sustainedOn: string | null;
      isCurrent: number;
    }>;

    const byKey = new Map<string, {
      callingTitle: string;
        organizationName: string | null;
        lcrMemberId: string | null;
        email: string | null;
        phoneNumber: string | null;
        firstName: string | null;
        lastName: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        stateOrProvince: string | null;
        postalCode: string | null;
        country: string | null;
        fullName: string | null;
        unitName: string;
        isLeadership: boolean;
      sustainedOn: string | null;
      isCurrent: boolean;
      rawTitle: string;
    }>();

    const noisePattern = /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\/\s*(yes|no))/i;
    const score = (row: { rawTitle: string; sustainedOn: string | null }) => (noisePattern.test(row.rawTitle) ? 0 : 2) + (row.sustainedOn ? 1 : 0);

    for (const row of rows) {
      const cleanedTitle = cleanCallingTitle(row.callingTitle);
      const key = `${row.lcrMemberId ?? 'vacant'}:${row.unitName}:${cleanedTitle.toLowerCase()}:${row.isCurrent}`;
      const candidate = {
        ...row,
        callingTitle: cleanedTitle,
        isLeadership: /(president|bishop|high councilor)/i.test(cleanedTitle) || /(stake presidency|bishopric|high council)/i.test(row.organizationName ?? ''),
        isCurrent: row.isCurrent === 1,
        rawTitle: row.callingTitle
      };
      const existing = byKey.get(key);
      if (!existing || score(candidate) > score(existing)) byKey.set(key, candidate);
    }

    return Array.from(byKey.values()).map(({ rawTitle, ...row }) => row);
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeCommitteesPageData = async (): Promise<{ committees: CommitteeRoster[] }> => {
  const callings = await loadSqliteSpikeCallingsList();
  const members = (await loadSqliteSpikeMemberList()).reduce((acc, row) => { acc.set(row.lcrMemberId, row); return acc; }, new Map<string, SqliteSpikeMemberRow>());
  const rosterRows: CommitteeMemberRow[] = callings
    .filter((row) => row.isCurrent && row.lcrMemberId && row.fullName)
    .map((row) => ({
      lcrMemberId: row.lcrMemberId!,
      fullName: row.fullName!,
      unitName: row.unitName ?? null,
      callingTitle: row.callingTitle,
      sustainedOn: row.sustainedOn ?? null,
      email: members.get(row.lcrMemberId!)?.email ?? null
    }));

  return {
    committees: sqliteCommitteeRules.map((rule) => ({
      key: rule.key,
      name: rule.name,
      handbookBasis: rule.handbookBasis,
      handbookUrl: rule.handbookUrl,
      members: dedupeSqliteCommitteeMembers(rosterRows.filter((row) => rule.patterns.some((pattern) => pattern.test(row.callingTitle))))
    }))
  };
};

export const loadSqliteSpikeVisualOrgData = async (selectedUnitArg?: string | null): Promise<VisualOrgPayload> => {
  const status = getSqliteSpikeStatus();
  const selectedUnit = normalizeVisualOrgUnit(selectedUnitArg);
  if (!status.exists || status.members === 0) {
    return buildVisualOrgPayload([], selectedUnit);
  }

  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(m.first_name || ' ' || m.last_name) AS fullName,
        COALESCE(NULLIF(m.unit_name, ''), NULLIF(m.unit_abbreviation, ''), 'Unknown') AS unitName,
        c.title AS callingTitle,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber
      FROM callings c
      JOIN members m ON m.lcr_member_id = c.lcr_member_id
      WHERE c.is_current = 1
        AND (
          ? IS NULL
          OR COALESCE(NULLIF(m.unit_name, ''), NULLIF(m.unit_abbreviation, ''), 'Unknown') = ?
          OR c.title LIKE 'Stake %'
        )
        AND (m.member_status IS NULL OR lower(m.member_status) LIKE 'active%')
      ORDER BY unitName, c.title, m.last_name, m.first_name`
    ).all(selectedUnit, selectedUnit) as VisualOrgSourceRow[];

    const highCouncilAssignments = parseHighCouncilUnitAssignments(getEffectiveDesktopEnv().HIGH_COUNCIL_UNIT_ASSIGNMENTS);
    const assignedHighCouncilorId = selectedUnit ? highCouncilAssignments[selectedUnit] : undefined;
    const assignedHighCouncilorRow =
      assignedHighCouncilorId
        ? rows.find(
            (row) =>
              row.lcrMemberId === assignedHighCouncilorId &&
              /^\s*(stake high councilor|high councilor)\s*$/i.test(row.callingTitle)
          ) ?? null
        : null;

    return buildVisualOrgPayload(rows, selectedUnit, {
      highCouncilor: assignedHighCouncilorRow
        ? {
            roleId: "highCouncilor",
            roleTitle: "Assigned High Councilor",
            lcrMemberId: assignedHighCouncilorRow.lcrMemberId ?? "",
            fullName: assignedHighCouncilorRow.fullName,
            unitName: assignedHighCouncilorRow.unitName,
            callingTitle: assignedHighCouncilorRow.callingTitle,
            email: assignedHighCouncilorRow.email,
            phoneNumber: assignedHighCouncilorRow.phoneNumber
          }
        : null
    });
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeYouthPageData = async (selectedUnitArg?: string | null) => {
  const selectedUnit = normalizeSelectedUnit(selectedUnitArg);
  const status = getSqliteSpikeStatus();
  if (!status.exists || status.members === 0) {
    return {
      missionEligible: [] as MissionEligibleRow[],
      missionYouthPipeline: [] as MissionYouthPipelineRow[],
      seminaryInstituteOpportunity: [] as SqliteSpikeFullReportsData["seminaryInstituteOpportunity"],
      progression: [] as Array<{ ageBand: string; count: number }>,
      organizationTransitions: [] as YouthOrganizationTransitionRow[],
      transitionMilestones: [] as YouthTransitionMilestoneRow[],
      endowment: [] as EndowmentCandidateRow[]
    };
  }

  const [reports, members, currentCallingsRows] = await Promise.all([
    loadSqliteSpikeFullReportsData(selectedUnit),
    (async () => {
      const db = openSqliteSpikeDb();
      try {
        const rows = db.prepare(`SELECT
          lcr_member_id AS lcrMemberId,
          unit_name AS unitName,
          unit_abbreviation AS unitAbbreviation,
          preferred_name AS preferredName,
          first_name AS firstName,
          last_name AS lastName,
          gender,
          age,
          birthdate,
          member_status AS memberStatus,
          mission_status AS missionStatus,
          mission_country AS missionCountry,
          mission_language AS missionLanguage,
          temple_recommend_status AS templeRecommendStatus,
          temple_recommend_type AS templeRecommendType,
          temple_endowed AS templeEndowed,
          is_attending_seminary AS isAttendingSeminary,
          is_attending_institute AS isAttendingInstitute,
          is_returned_missionary AS isReturnedMissionary,
          is_married AS isMarried,
          is_single AS isSingle,
          marriage_status AS marriageStatus,
          primary_email AS primaryEmail,
          primary_phone AS primaryPhone,
          priesthood_office AS priesthoodOffice,
          baptism_date AS baptismDate,
          confirmation_date AS confirmationDate
        FROM members`).all() as SpikeMemberRow[];
        return rows.filter((member) => matchesSelectedUnit(member, selectedUnit));
      } finally { db.close(); }
    })(),
    (async () => {
      const db = openSqliteSpikeDb();
      try {
        return db.prepare(`SELECT c.lcr_member_id AS lcrMemberId, c.title, c.sustained_on AS sustainedOn, COALESCE(NULLIF(m.unit_name, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName FROM callings c LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id WHERE c.is_current = 1`).all() as Array<{ lcrMemberId: string | null; title: string; sustainedOn: string | null; unitName: string | null }>;
      } finally { db.close(); }
    })()
  ]);

  const memberIds = new Set(members.map((member) => member.lcrMemberId ?? ""));
  const currentCallings = currentCallingsRows.filter(
    (calling) =>
      !selectedUnit ||
      (calling.lcrMemberId && memberIds.has(calling.lcrMemberId)) ||
      (calling.unitName ?? "Unknown") === selectedUnit
  );

  const callingMap = new Map<string, { title: string; sustainedOn: string | null }>();
  for (const row of currentCallings) {
    if (!row.lcrMemberId) continue;
    const existing = callingMap.get(row.lcrMemberId);
    const cleaned = cleanCallingTitle(row.title);
    if (!existing || (row.sustainedOn ?? '') > (existing.sustainedOn ?? '') || cleaned < existing.title) {
      callingMap.set(row.lcrMemberId, { title: cleaned, sustainedOn: row.sustainedOn ?? null });
    }
  }

  const missionEligible: MissionEligibleRow[] = members.filter((member) => {
    const age = actualAge(member);
    return age !== null && age >= 18 && age <= 25 && isUnmarried(member) && isActiveMember(member.memberStatus) && !toBool(member.isReturnedMissionary) && !String(member.missionStatus ?? '').trim() && !String(member.missionCountry ?? '').trim();
  }).map((member) => ({
    lcrMemberId: member.lcrMemberId ?? '',
    fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
    unitName: member.unitName ?? member.unitAbbreviation ?? null,
    unitAbbreviation: member.unitAbbreviation ?? null,
    gender: member.gender ?? null,
    age: actualAge(member),
    birthdate: member.birthdate ?? null,
    missionStatus: member.missionStatus ?? null,
    templeRecommendStatus: member.templeRecommendStatus ?? null,
    isAttendingSeminary: member.isAttendingSeminary === undefined ? null : toBool(member.isAttendingSeminary),
    isAttendingInstitute: member.isAttendingInstitute === undefined ? null : toBool(member.isAttendingInstitute),
    email: member.primaryEmail ?? null,
    phoneNumber: member.primaryPhone ?? null,
    currentCalling: callingMap.get(member.lcrMemberId ?? '')?.title ?? null
  })).sort((a,b)=>(b.age ?? 0)-(a.age ?? 0) || a.fullName.localeCompare(b.fullName));

  const missionYouthPipeline: MissionYouthPipelineRow[] = members.filter((member) => {
    const age = actualAge(member);
    return age !== null && age >= 17 && age <= 25 && isUnmarried(member) && !toBool(member.isReturnedMissionary) && !String(member.missionStatus ?? '').trim() && !String(member.missionCountry ?? '').trim();
  }).map((member) => {
    const hasActiveRecommend = isActiveTempleRecommendStatus(member.templeRecommendStatus);
    const inReligiousClass = toBool(member.isAttendingSeminary) || toBool(member.isAttendingInstitute);
    const ordinanceReady = toBool(member.templeEndowed);
    const readinessScore = Number(hasActiveRecommend) + Number(inReligiousClass) + Number(ordinanceReady);
    const readinessLevel: MissionYouthPipelineRow["readinessLevel"] = readinessScore >= 3 ? "Ready" : readinessScore === 2 ? "Progressing" : "Needs Focus";
    return {
      lcrMemberId: member.lcrMemberId ?? '',
      unitName: unitLabel(member),
      fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
      age: actualAge(member),
      gender: member.gender ?? null,
      isAttendingSeminary: member.isAttendingSeminary === undefined ? null : toBool(member.isAttendingSeminary),
      isAttendingInstitute: member.isAttendingInstitute === undefined ? null : toBool(member.isAttendingInstitute),
      missionLanguage: member.missionLanguage ?? null,
      missionCountry: member.missionCountry ?? null,
      missionStatus: member.missionStatus ?? null,
      templeRecommendStatus: member.templeRecommendStatus ?? null,
      templeEndowed: member.templeEndowed === undefined ? null : toBool(member.templeEndowed),
      currentCalling: callingMap.get(member.lcrMemberId ?? '')?.title ?? null,
      readinessScore,
      readinessLevel
    };
  }).sort((a,b)=>(b.readinessScore-a.readinessScore) || ((b.age ?? 0)-(a.age ?? 0)) || a.fullName.localeCompare(b.fullName));

  const transitionMilestones: YouthTransitionMilestoneRow[] = [
    { label: '8-11 Baptized & Confirmed', eligibleCount: members.filter(m => { const age=actualAge(m); return age !== null && age >=8 && age <=11; }).length, completedCount: members.filter(m => { const age=actualAge(m); return age !== null && age >=8 && age <=11 && Boolean(m.baptismDate) && Boolean(m.confirmationDate); }).length, completionPct: 0 },
    { label: '12-17 Current Recommend', eligibleCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=12 && age <=17; }).length, completedCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=12 && age <=17 && (isActiveTempleRecommendStatus(m.templeRecommendStatus) || /limited/i.test(m.templeRecommendType ?? '')); }).length, completionPct: 0 },
    { label: '12-13 Deacon (Men)', eligibleCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=12 && age <=13 && isMale(m.gender); }).length, completedCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=12 && age <=13 && isMale(m.gender) && /^(deacon|teacher|priest|elder|high priest)$/i.test(m.priesthoodOffice ?? ''); }).length, completionPct: 0 },
    { label: '14-15 Teacher (Men)', eligibleCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=14 && age <=15 && isMale(m.gender); }).length, completedCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=14 && age <=15 && isMale(m.gender) && /^(teacher|priest|elder|high priest)$/i.test(m.priesthoodOffice ?? ''); }).length, completionPct: 0 },
    { label: '16-17 Priest (Men)', eligibleCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=16 && age <=17 && isMale(m.gender); }).length, completedCount: members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=16 && age <=17 && isMale(m.gender) && /^(priest|elder|high priest)$/i.test(m.priesthoodOffice ?? ''); }).length, completionPct: 0 },
    { label: '18-25 Elder (Men)', eligibleCount: members.filter(m => { const age=actualAge(m); return age !== null && age >=18 && age <=25 && isMale(m.gender); }).length, completedCount: members.filter(m => { const age=actualAge(m); return age !== null && age >=18 && age <=25 && isMale(m.gender) && /^(elder|high priest)$/i.test(m.priesthoodOffice ?? ''); }).length, completionPct: 0 },
    { label: '17-25 Mission Ready (Men)', eligibleCount: missionYouthPipeline.filter(m => isMale(m.gender)).length, completedCount: missionYouthPipeline.filter(m => isMale(m.gender) && m.readinessLevel === 'Ready').length, completionPct: 0 },
    { label: '17-25 Mission Ready (Women)', eligibleCount: missionYouthPipeline.filter(m => isFemale(m.gender)).length, completedCount: missionYouthPipeline.filter(m => isFemale(m.gender) && m.readinessLevel === 'Ready').length, completionPct: 0 }
  ].map((row) => ({ ...row, completionPct: row.eligibleCount > 0 ? Math.round((row.completedCount / row.eligibleCount) * 100) : 0 }));

  const organizationTransitions: YouthOrganizationTransitionRow[] = [
    ['Young Women 12-13', members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=12 && age <=13 && isFemale(m.gender); }).length],
    ['Young Women 14-15', members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=14 && age <=15 && isFemale(m.gender); }).length],
    ['Young Women 16-17', members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=16 && age <=17 && isFemale(m.gender); }).length],
    ['Young Men 12-13', members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=12 && age <=13 && isMale(m.gender); }).length],
    ['Young Men 14-15', members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=14 && age <=15 && isMale(m.gender); }).length],
    ['Young Men 16-17', members.filter(m => { const age=youthProgramAge(m); return age !== null && age >=16 && age <=17 && isMale(m.gender); }).length],
    ['Age 18 Transition', members.filter(m => actualAge(m) === 18).length],
    ['YSA 18-25 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=18 && age <=25 && isUnmarried(m); }).length],
    ['YSA Women 18-25 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=18 && age <=25 && isUnmarried(m) && isFemale(m.gender); }).length],
    ['YSA Men 18-25 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=18 && age <=25 && isUnmarried(m) && isMale(m.gender); }).length],
    ['YSA 26-35 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=26 && age <=35 && isUnmarried(m); }).length],
    ['YSA Women 26-35 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=26 && age <=35 && isUnmarried(m) && isFemale(m.gender); }).length],
    ['YSA Men 26-35 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=26 && age <=35 && isUnmarried(m) && isMale(m.gender); }).length],
    ['Single Adults 36-45 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=36 && age <=45 && isUnmarried(m); }).length],
    ['Single Adult Women 36-45 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=36 && age <=45 && isUnmarried(m) && isFemale(m.gender); }).length],
    ['Single Adult Men 36-45 (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=36 && age <=45 && isUnmarried(m) && isMale(m.gender); }).length],
    ['Single Adults 46+ (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=46 && isUnmarried(m); }).length],
    ['Single Adult Women 46+ (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=46 && isUnmarried(m) && isFemale(m.gender); }).length],
    ['Single Adult Men 46+ (Unmarried)', members.filter(m => { const age=actualAge(m); return age !== null && age >=46 && isUnmarried(m) && isMale(m.gender); }).length]
  ].map(([label, count]) => ({ label: label as string, count: count as number }));

  const progression = [
    { ageBand: 'Turns 12 / 12', count: members.filter(m => youthProgramAge(m) === 12).length },
    { ageBand: '13-15', count: members.filter(m => { const age = youthProgramAge(m); return age !== null && age >= 13 && age <= 15; }).length },
    { ageBand: '16-17', count: members.filter(m => { const age = youthProgramAge(m); return age !== null && age >= 16 && age <= 17; }).length },
    { ageBand: '18 Transition', count: members.filter(m => youthProgramAge(m) === 18).length },
    { ageBand: 'YSA 19-25', count: members.filter(m => { const age = actualAge(m); return age !== null && age >= 19 && age <= 25; }).length },
    { ageBand: 'YSA 26-35', count: members.filter(m => { const age = actualAge(m); return age !== null && age >= 26 && age <= 35; }).length }
  ];

  const endowment: EndowmentCandidateRow[] = members.filter((member) => {
    const age = actualAge(member);
    return age !== null && age >= 18 && !toBool(member.templeEndowed);
  }).map((member) => ({
    lcrMemberId: member.lcrMemberId ?? '',
    fullName: member.fullName ?? member.preferredName ?? `${member.firstName} ${member.lastName}`,
    age: actualAge(member),
    missionStatus: member.missionStatus ?? null,
    templeEndowed: member.templeEndowed === undefined ? null : toBool(member.templeEndowed)
  })).sort((a,b)=>(b.age ?? 0)-(a.age ?? 0) || a.fullName.localeCompare(b.fullName));

  return {
    missionEligible,
    missionYouthPipeline,
    seminaryInstituteOpportunity: reports.seminaryInstituteOpportunity,
    progression,
    organizationTransitions,
    transitionMilestones,
    endowment
  };
};

const loadLatestSqliteSuccessLogs = (db: ReturnType<typeof openSqliteSpikeDb>, limit: number) =>
  db.prepare(
    `SELECT
      id,
      sync_type AS syncType,
      started_at AS startedAt,
      completed_at AS completedAt
     FROM sync_logs
     WHERE status = 'success'
     ORDER BY completed_at DESC, started_at DESC
     LIMIT ?`
  ).all(limit) as SqliteSnapshotLogRow[];

const loadSqliteSnapshotLog = (db: ReturnType<typeof openSqliteSpikeDb>, syncLogId: number) =>
  (db.prepare(
    `SELECT
      id,
      sync_type AS syncType,
      started_at AS startedAt,
      completed_at AS completedAt
     FROM sync_logs
     WHERE id = ?
     LIMIT 1`
  ).get(syncLogId) as SqliteSnapshotLogRow | undefined) ?? null;

const latestSqliteSnapshotLog = (db: ReturnType<typeof openSqliteSpikeDb>, tableName: string) => {
  const row = db.prepare(
    `SELECT t.sync_log_id AS syncLogId
     FROM ${tableName} t
     JOIN sync_logs s ON s.id = t.sync_log_id
     WHERE s.status = 'success'
       AND s.completed_at IS NOT NULL
     GROUP BY t.sync_log_id
     ORDER BY MAX(s.completed_at) DESC, t.sync_log_id DESC
     LIMIT 1`
  ).get() as { syncLogId?: number } | undefined;

  return row?.syncLogId ?? null;
};

const previousSqliteSnapshotLog = (db: ReturnType<typeof openSqliteSpikeDb>, tableName: string, latestSyncId: number) => {
  const row = db.prepare(
    `SELECT DISTINCT t.sync_log_id AS syncLogId
     FROM ${tableName} t
     JOIN sync_logs s ON s.id = t.sync_log_id
     WHERE s.status = 'success'
       AND t.sync_log_id < ?
     ORDER BY t.sync_log_id DESC
     LIMIT 1`
  ).get(latestSyncId) as { syncLogId?: number } | undefined;

  return row?.syncLogId ?? null;
};

const loadSqliteMemberSnapshots = (db: ReturnType<typeof openSqliteSpikeDb>, syncLogId: number) =>
  db.prepare(
    `SELECT
      lcr_member_id AS lcrMemberId,
      full_name AS fullName,
      unit_name AS unitName,
      move_in_date AS moveInDate,
      row_hash AS rowHash,
      snapshot_data AS snapshotData
     FROM sync_member_snapshots
     WHERE sync_log_id = ?`
  ).all(syncLogId).map((row) => ({
    ...(row as Omit<SqliteMemberSnapshotRow, "snapshotData"> & { snapshotData: string }),
    snapshotData: parseSnapshotData((row as { snapshotData: string }).snapshotData)
  })) as SqliteMemberSnapshotRow[];

const loadSqliteCallingSnapshots = (db: ReturnType<typeof openSqliteSpikeDb>, syncLogId: number) =>
  db.prepare(
    `SELECT
      lcr_calling_id AS lcrCallingId,
      unit_name AS unitName,
      member_lcr_member_id AS memberLcrMemberId,
      member_name AS memberName,
      calling_title AS callingTitle,
      is_current AS isCurrent,
      sustained_on AS sustainedOn,
      released_on AS releasedOn,
      row_hash AS rowHash,
      snapshot_data AS snapshotData
     FROM sync_calling_snapshots
     WHERE sync_log_id = ?`
  ).all(syncLogId).map((row) => ({
    ...(row as Omit<SqliteCallingSnapshotRow, "snapshotData" | "isCurrent"> & { snapshotData: string; isCurrent: number }),
    isCurrent: (row as { isCurrent: number }).isCurrent === 1,
    snapshotData: parseSnapshotData((row as { snapshotData: string }).snapshotData)
  })) as SqliteCallingSnapshotRow[];

const loadSqliteEmailSnapshots = (db: ReturnType<typeof openSqliteSpikeDb>, syncLogId: number) =>
  db.prepare(
    `SELECT
      member_lcr_member_id AS memberLcrMemberId,
      full_name AS fullName,
      unit_name AS unitName,
      email AS value,
      row_hash AS rowHash,
      snapshot_data AS snapshotData
     FROM sync_email_snapshots
     WHERE sync_log_id = ?`
  ).all(syncLogId).map((row) => ({
    ...(row as Omit<SqliteContactSnapshotRow, "snapshotData"> & { snapshotData: string }),
    snapshotData: parseSnapshotData((row as { snapshotData: string }).snapshotData)
  })) as SqliteContactSnapshotRow[];

const loadSqlitePhoneSnapshots = (db: ReturnType<typeof openSqliteSpikeDb>, syncLogId: number) =>
  db.prepare(
    `SELECT
      member_lcr_member_id AS memberLcrMemberId,
      full_name AS fullName,
      unit_name AS unitName,
      phone_number AS value,
      row_hash AS rowHash,
      snapshot_data AS snapshotData
     FROM sync_phone_snapshots
     WHERE sync_log_id = ?`
  ).all(syncLogId).map((row) => ({
    ...(row as Omit<SqliteContactSnapshotRow, "snapshotData"> & { snapshotData: string }),
    snapshotData: parseSnapshotData((row as { snapshotData: string }).snapshotData)
  })) as SqliteContactSnapshotRow[];

const getLeadershipTrainingGroup = (callingTitle: string) => {
  const title = normalizeCallingTitleKey(callingTitle);

  if (
    /(^| )(bishop|branch president|bishopric first counselor|bishopric second counselor|branch presidency first counselor|branch presidency second counselor|ward clerk|branch clerk|executive secretary)( |$)/.test(title)
  ) {
    return {
      key: "stake_presidency" as const,
      label: "Stake Presidency"
    };
  }

  if (/(^| )elders quorum president( |$)/.test(title)) {
    return {
      key: "high_council" as const,
      label: "High Council"
    };
  }

  if (/(^| )relief society president( |$)/.test(title)) {
    return {
      key: "stake_rs" as const,
      label: "Stake Relief Society"
    };
  }

  if (/(^| )young women president( |$)/.test(title)) {
    return {
      key: "stake_yw" as const,
      label: "Stake Young Women"
    };
  }

  if (/(^| )primary president( |$)/.test(title)) {
    return {
      key: "stake_primary" as const,
      label: "Stake Primary"
    };
  }

  if (/(^| )sunday school president( |$)/.test(title)) {
    return {
      key: "stake_ss" as const,
      label: "Stake Sunday School"
    };
  }

  return null;
};

const loadSqliteLeadershipTrainingAlerts = (db: ReturnType<typeof openSqliteSpikeDb>): SqliteSpikeLeadershipTrainingAlert[] => {
  const today = startOfToday();
  const threshold = daysAgoThreshold(60);
  const currentLeadershipRows = db.prepare(
    `SELECT
      c.lcr_member_id AS lcrMemberId,
      c.title AS callingTitle,
      c.sustained_on AS sustainedOn,
      c.set_apart_on AS setApartOn,
      COALESCE(NULLIF(m.unit_name, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName,
      m.preferred_name AS preferredName,
      m.first_name AS firstName,
      m.last_name AS lastName,
      m.primary_email AS primaryEmail,
      m.primary_phone AS primaryPhone
     FROM callings c
     LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id
     WHERE c.is_current = 1
       AND c.lcr_member_id IS NOT NULL`
  ).all() as Array<{
    lcrMemberId: string;
    callingTitle: string;
    sustainedOn: string | null;
    setApartOn: string | null;
    unitName: string;
    preferredName: string | null;
    firstName: string | null;
    lastName: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
  }>;

  return currentLeadershipRows
    .map((row) => {
      const trainerGroup = getLeadershipTrainingGroup(row.callingTitle);
      if (!trainerGroup) {
        return null;
      }

      const setApartDate = safeDate(row.setApartOn);
      const sustainedDate = safeDate(row.sustainedOn);
      const recentSetApart = setApartDate && setApartDate <= today && setApartDate >= threshold ? setApartDate : null;
      const recentSustained = sustainedDate && sustainedDate <= today && sustainedDate >= threshold ? sustainedDate : null;
      const recentDate = recentSetApart ?? recentSustained;

      if (!recentDate) {
        return null;
      }

      const fullName = collapseWhitespace(
        row.preferredName?.trim() || `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || "Unknown"
      );

      return {
        lcrMemberId: row.lcrMemberId,
        fullName,
        unitName: row.unitName || "Unknown",
        callingTitle: cleanCallingTitle(row.callingTitle),
        primaryEmail: row.primaryEmail,
        primaryPhone: row.primaryPhone,
        sustainedOn: row.sustainedOn,
        setApartOn: row.setApartOn,
        recentDateLabel: recentSetApart ? "Set Apart" : "Sustained",
        recentDate: recentDate.toISOString(),
        daysAgo: daysBetween(today, recentDate),
        pendingSetApart: Boolean(recentSustained && !setApartDate),
        trainerGroup: trainerGroup.key,
        trainerGroupLabel: trainerGroup.label
      } satisfies SqliteSpikeLeadershipTrainingAlert;
    })
    .filter(Boolean)
    .sort((left, right) => {
      const first = left as SqliteSpikeLeadershipTrainingAlert;
      const second = right as SqliteSpikeLeadershipTrainingAlert;
      return (
        first.trainerGroupLabel.localeCompare(second.trainerGroupLabel) ||
        first.daysAgo - second.daysAgo ||
        first.unitName.localeCompare(second.unitName) ||
        first.callingTitle.localeCompare(second.callingTitle)
      );
    }) as SqliteSpikeLeadershipTrainingAlert[];
};

export const getSqliteSpikeSyncDiffReport = async (options: { limit?: number } = {}): Promise<SqliteSpikeSyncDiffReport> => {
  const safeLimit = Math.max(1, Math.min(options.limit ?? 30, 200));
  const status = getSqliteSpikeStatus();

  if (!status.exists) {
    return {
      latestSync: null,
      previousSync: null,
      windowStart: null,
      windowEnd: null,
      coverage: {
        members: buildSnapshotCoverage(null, null),
        callings: buildSnapshotCoverage(null, null),
        emails: buildSnapshotCoverage(null, null),
        phones: buildSnapshotCoverage(null, null)
      },
      comparisonWindows: {
        members: { start: null, end: null },
        callings: { start: null, end: null },
        emails: { start: null, end: null },
        phones: { start: null, end: null }
      },
      counts: {
        membersChanged: 0,
        membersAdded: 0,
        membersRemoved: 0,
        membersUpdated: 0,
        callingsChanged: 0,
        callingsAdded: 0,
        callingsRemoved: 0,
        callingsUpdated: 0,
        organizationChanged: 0,
        unitChanged: 0,
        emailChanged: 0,
        emailAdded: 0,
        emailRemoved: 0,
        emailUpdated: 0,
        phoneChanged: 0,
        phoneAdded: 0,
        phoneRemoved: 0,
        phoneUpdated: 0
      },
      members: [],
      callings: [],
      contacts: []
    };
  }

  const db = openSqliteSpikeDb();
  try {
    const logs = loadLatestSqliteSuccessLogs(db, 10);
    const latest = logs[0] ?? null;
    const previous = logs[1] ?? null;

    if (!latest?.completedAt) {
      return {
        latestSync: latest,
        previousSync: previous,
        windowStart: null,
        windowEnd: null,
        coverage: {
          members: buildSnapshotCoverage(null, null),
          callings: buildSnapshotCoverage(null, null),
          emails: buildSnapshotCoverage(null, null),
          phones: buildSnapshotCoverage(null, null)
        },
        comparisonWindows: {
          members: { start: null, end: null },
          callings: { start: null, end: null },
          emails: { start: null, end: null },
          phones: { start: null, end: null }
        },
        counts: {
          membersChanged: 0,
          membersAdded: 0,
          membersRemoved: 0,
          membersUpdated: 0,
          callingsChanged: 0,
          callingsAdded: 0,
          callingsRemoved: 0,
          callingsUpdated: 0,
          organizationChanged: 0,
          unitChanged: 0,
          emailChanged: 0,
          emailAdded: 0,
          emailRemoved: 0,
          emailUpdated: 0,
          phoneChanged: 0,
          phoneAdded: 0,
          phoneRemoved: 0,
          phoneUpdated: 0
        },
        members: [],
        callings: [],
        contacts: []
      };
    }

    const windowEnd = latest.completedAt;
    const windowStart = previous?.completedAt ?? null;

    const latestMemberSnapshotLogId = latestSqliteSnapshotLog(db, "sync_member_snapshots");
    const latestCallingSnapshotLogId = latestSqliteSnapshotLog(db, "sync_calling_snapshots");
    const latestEmailSnapshotLogId = latestSqliteSnapshotLog(db, "sync_email_snapshots");
    const latestPhoneSnapshotLogId = latestSqliteSnapshotLog(db, "sync_phone_snapshots");

    const previousMemberSnapshotLogId = latestMemberSnapshotLogId ? previousSqliteSnapshotLog(db, "sync_member_snapshots", latestMemberSnapshotLogId) : null;
    const previousCallingSnapshotLogId = latestCallingSnapshotLogId ? previousSqliteSnapshotLog(db, "sync_calling_snapshots", latestCallingSnapshotLogId) : null;
    const previousEmailSnapshotLogId = latestEmailSnapshotLogId ? previousSqliteSnapshotLog(db, "sync_email_snapshots", latestEmailSnapshotLogId) : null;
    const previousPhoneSnapshotLogId = latestPhoneSnapshotLogId ? previousSqliteSnapshotLog(db, "sync_phone_snapshots", latestPhoneSnapshotLogId) : null;

    const memberCoverage = buildSnapshotCoverage(latestMemberSnapshotLogId, previousMemberSnapshotLogId);
    const callingCoverage = buildSnapshotCoverage(latestCallingSnapshotLogId, previousCallingSnapshotLogId);
    const emailCoverage = buildSnapshotCoverage(latestEmailSnapshotLogId, previousEmailSnapshotLogId);
    const phoneCoverage = buildSnapshotCoverage(latestPhoneSnapshotLogId, previousPhoneSnapshotLogId);

    const latestMemberSnapshotLog = latestMemberSnapshotLogId ? loadSqliteSnapshotLog(db, latestMemberSnapshotLogId) : null;
    const previousMemberSnapshotLog = previousMemberSnapshotLogId ? loadSqliteSnapshotLog(db, previousMemberSnapshotLogId) : null;
    const latestCallingSnapshotLog = latestCallingSnapshotLogId ? loadSqliteSnapshotLog(db, latestCallingSnapshotLogId) : null;
    const previousCallingSnapshotLog = previousCallingSnapshotLogId ? loadSqliteSnapshotLog(db, previousCallingSnapshotLogId) : null;
    const latestEmailSnapshotLog = latestEmailSnapshotLogId ? loadSqliteSnapshotLog(db, latestEmailSnapshotLogId) : null;
    const previousEmailSnapshotLog = previousEmailSnapshotLogId ? loadSqliteSnapshotLog(db, previousEmailSnapshotLogId) : null;
    const latestPhoneSnapshotLog = latestPhoneSnapshotLogId ? loadSqliteSnapshotLog(db, latestPhoneSnapshotLogId) : null;
    const previousPhoneSnapshotLog = previousPhoneSnapshotLogId ? loadSqliteSnapshotLog(db, previousPhoneSnapshotLogId) : null;

    const memberWindowEnd = latestMemberSnapshotLog?.completedAt ?? windowEnd;
    const callingWindowEnd = latestCallingSnapshotLog?.completedAt ?? windowEnd;
    const emailWindowEnd = latestEmailSnapshotLog?.completedAt ?? windowEnd;
    const phoneWindowEnd = latestPhoneSnapshotLog?.completedAt ?? windowEnd;

    const latestMemberSnapshots = latestMemberSnapshotLogId && previousMemberSnapshotLogId ? loadSqliteMemberSnapshots(db, latestMemberSnapshotLogId) : [];
    const previousMemberSnapshots = previousMemberSnapshotLogId ? loadSqliteMemberSnapshots(db, previousMemberSnapshotLogId) : [];
    const latestCallingSnapshots = latestCallingSnapshotLogId && previousCallingSnapshotLogId ? loadSqliteCallingSnapshots(db, latestCallingSnapshotLogId) : [];
    const previousCallingSnapshots = previousCallingSnapshotLogId ? loadSqliteCallingSnapshots(db, previousCallingSnapshotLogId) : [];
    const latestEmailSnapshots = latestEmailSnapshotLogId && previousEmailSnapshotLogId ? loadSqliteEmailSnapshots(db, latestEmailSnapshotLogId) : [];
    const previousEmailSnapshots = previousEmailSnapshotLogId ? loadSqliteEmailSnapshots(db, previousEmailSnapshotLogId) : [];
    const latestPhoneSnapshots = latestPhoneSnapshotLogId && previousPhoneSnapshotLogId ? loadSqlitePhoneSnapshots(db, latestPhoneSnapshotLogId) : [];
    const previousPhoneSnapshots = previousPhoneSnapshotLogId ? loadSqlitePhoneSnapshots(db, previousPhoneSnapshotLogId) : [];

    const memberChanges: SqliteSpikeSyncDiffReport["members"] = [];
    let membersAdded = 0;
    let membersRemoved = 0;
    let membersUpdated = 0;

    if (latestMemberSnapshotLogId && previousMemberSnapshotLogId) {
      const previousById = new Map(previousMemberSnapshots.map((row) => [row.lcrMemberId, row]));

      for (const row of latestMemberSnapshots) {
        const previousRow = previousById.get(row.lcrMemberId);
        if (!previousRow) {
          membersAdded += 1;
          memberChanges.push({
            lcrMemberId: row.lcrMemberId,
            fullName: row.fullName,
            unitName: row.unitName ?? "Unknown",
            moveInDate: row.moveInDate,
            changeType: "Added",
            changedFields: [],
            updatedAt: memberWindowEnd
          });
          continue;
        }

        if (row.rowHash !== previousRow.rowHash) {
          membersUpdated += 1;
          memberChanges.push({
            lcrMemberId: row.lcrMemberId,
            fullName: row.fullName,
            unitName: row.unitName ?? "Unknown",
            moveInDate: row.moveInDate,
            changeType: "Changed",
            changedFields: diffSnapshotFields(row.snapshotData, previousRow.snapshotData, ["unitId", "householdId"]),
            updatedAt: memberWindowEnd
          });
        }

        previousById.delete(row.lcrMemberId);
      }

      for (const row of previousById.values()) {
        membersRemoved += 1;
        memberChanges.push({
          lcrMemberId: row.lcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName ?? "Unknown",
          moveInDate: row.moveInDate,
          changeType: "Removed",
          changedFields: [],
          updatedAt: memberWindowEnd
        });
      }
    }

    const callingChanges: SqliteSpikeSyncDiffReport["callings"] = [];
    let callingsAdded = 0;
    let callingsRemoved = 0;
    let callingsUpdated = 0;

    if (latestCallingSnapshotLogId && previousCallingSnapshotLogId) {
      const previousById = new Map(previousCallingSnapshots.map((row) => [row.lcrCallingId, row]));

      for (const row of latestCallingSnapshots) {
        const previousRow = previousById.get(row.lcrCallingId);
        if (!previousRow) {
          callingsAdded += 1;
          callingChanges.push({
            lcrCallingId: row.lcrCallingId,
            unitName: row.unitName ?? "Unknown",
            callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle,
            isCurrent: row.isCurrent,
            sustainedOn: row.sustainedOn,
            releasedOn: row.releasedOn,
            changeType: "Added",
            changedFields: [],
            updatedAt: callingWindowEnd
          });
          continue;
        }

        if (row.rowHash !== previousRow.rowHash) {
          callingsUpdated += 1;
          callingChanges.push({
            lcrCallingId: row.lcrCallingId,
            unitName: row.unitName ?? previousRow.unitName ?? "Unknown",
            callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle,
            isCurrent: row.isCurrent,
            sustainedOn: row.sustainedOn,
            releasedOn: row.releasedOn,
            changeType: previousRow.isCurrent && !row.isCurrent ? "Released" : "Updated",
            changedFields: diffSnapshotFields(row.snapshotData, previousRow.snapshotData, ["unitNumber", "lcrMemberId", "lcrOrganizationId"]),
            updatedAt: callingWindowEnd
          });
        }

        previousById.delete(row.lcrCallingId);
      }

      for (const row of previousById.values()) {
        callingsRemoved += 1;
        callingChanges.push({
          lcrCallingId: row.lcrCallingId,
          unitName: row.unitName ?? "Unknown",
          callingTitle: cleanCallingTitle(row.callingTitle) ?? row.callingTitle,
          isCurrent: row.isCurrent,
          sustainedOn: row.sustainedOn,
          releasedOn: row.releasedOn,
          changeType: "Removed",
          changedFields: [],
          updatedAt: callingWindowEnd
        });
      }
    }

    const contactChanges: SqliteSpikeSyncDiffReport["contacts"] = [];
    let emailAdded = 0;
    let emailRemoved = 0;
    let emailUpdated = 0;
    let phoneAdded = 0;
    let phoneRemoved = 0;
    let phoneUpdated = 0;

    const diffContacts = (
      contactType: "Email" | "Phone",
      currentRows: SqliteContactSnapshotRow[],
      previousRows: SqliteContactSnapshotRow[]
    ) => {
      const previousByKey = new Map(previousRows.map((row) => [`${row.memberLcrMemberId}|${row.value}`, row]));

      for (const row of currentRows) {
        const key = `${row.memberLcrMemberId}|${row.value}`;
        const previousRow = previousByKey.get(key);
        if (!previousRow) {
          if (contactType === "Email") {
            emailAdded += 1;
          } else {
            phoneAdded += 1;
          }
          contactChanges.push({
            contactType,
            memberLcrMemberId: row.memberLcrMemberId,
            fullName: row.fullName,
            unitName: row.unitName ?? "Unknown",
            value: row.value,
            changeType: "Added",
            changedFields: [],
            updatedAt: contactType === "Email" ? emailWindowEnd : phoneWindowEnd
          });
          continue;
        }

        if (row.rowHash !== previousRow.rowHash) {
          if (contactType === "Email") {
            emailUpdated += 1;
          } else {
            phoneUpdated += 1;
          }
          contactChanges.push({
            contactType,
            memberLcrMemberId: row.memberLcrMemberId,
            fullName: row.fullName,
            unitName: row.unitName ?? "Unknown",
            value: row.value,
            changeType: "Changed",
            changedFields: diffSnapshotFields(row.snapshotData, previousRow.snapshotData),
            updatedAt: contactType === "Email" ? emailWindowEnd : phoneWindowEnd
          });
        }

        previousByKey.delete(key);
      }

      for (const row of previousByKey.values()) {
        if (contactType === "Email") {
          emailRemoved += 1;
        } else {
          phoneRemoved += 1;
        }
        contactChanges.push({
          contactType,
          memberLcrMemberId: row.memberLcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName ?? "Unknown",
          value: row.value,
          changeType: "Removed",
          changedFields: [],
          updatedAt: contactType === "Email" ? emailWindowEnd : phoneWindowEnd
        });
      }
    };

    if (latestEmailSnapshotLogId && previousEmailSnapshotLogId) {
      diffContacts("Email", latestEmailSnapshots, previousEmailSnapshots);
    }
    if (latestPhoneSnapshotLogId && previousPhoneSnapshotLogId) {
      diffContacts("Phone", latestPhoneSnapshots, previousPhoneSnapshots);
    }

    return {
      latestSync: latest,
      previousSync: previous,
      windowStart,
      windowEnd,
      coverage: {
        members: memberCoverage,
        callings: callingCoverage,
        emails: emailCoverage,
        phones: phoneCoverage
      },
      comparisonWindows: {
        members: { start: previousMemberSnapshotLog?.completedAt ?? null, end: latestMemberSnapshotLog?.completedAt ?? null },
        callings: { start: previousCallingSnapshotLog?.completedAt ?? null, end: latestCallingSnapshotLog?.completedAt ?? null },
        emails: { start: previousEmailSnapshotLog?.completedAt ?? null, end: latestEmailSnapshotLog?.completedAt ?? null },
        phones: { start: previousPhoneSnapshotLog?.completedAt ?? null, end: latestPhoneSnapshotLog?.completedAt ?? null }
      },
      counts: {
        membersChanged: membersAdded + membersRemoved + membersUpdated,
        membersAdded,
        membersRemoved,
        membersUpdated,
        callingsChanged: callingsAdded + callingsRemoved + callingsUpdated,
        callingsAdded,
        callingsRemoved,
        callingsUpdated,
        organizationChanged: 0,
        unitChanged: 0,
        emailChanged: emailAdded + emailRemoved + emailUpdated,
        emailAdded,
        emailRemoved,
        emailUpdated,
        phoneChanged: phoneAdded + phoneRemoved + phoneUpdated,
        phoneAdded,
        phoneRemoved,
        phoneUpdated
      },
      members: memberChanges.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.fullName.localeCompare(right.fullName)).slice(0, safeLimit),
      callings: callingChanges.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.callingTitle.localeCompare(right.callingTitle)).slice(0, safeLimit),
      contacts: contactChanges.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.fullName.localeCompare(right.fullName)).slice(0, safeLimit)
    };
  } finally {
    db.close();
  }
};

export const loadSqliteSpikeStakeOverviewPageData = async (selectedUnitArg?: string | null) => {
  const selectedUnit = normalizeSelectedUnit(selectedUnitArg);
  const status = getSqliteSpikeStatus();
  const fullReports = await loadSqliteSpikeFullReportsData(selectedUnit);
  const dashboard = await loadSqliteSpikeDashboardData(selectedUnit);
  const syncDiff = await getSqliteSpikeSyncDiffReport({ limit: 30 });
  if (!status.exists || status.members === 0) {
    return {
      overview: { totalMembers: 0, currentCallings: 0, membersWithCurrentCalling: 0, membersWithoutCurrentCalling: 0, latestSync: null },
      turnover: [],
      converts: [],
      syncDiff,
      unitHealthRadar: [] as UnitHealthRadarRow[],
      newLeadershipAlerts: [] as SqliteSpikeLeadershipTrainingAlert[]
    };
  }
  const db = openSqliteSpikeDb();
  try {
    const allCallings = db.prepare(`SELECT c.title, COALESCE(NULLIF(m.unit_name, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName, c.sustained_on AS sustainedOn, c.set_apart_on AS setApartOn, c.released_on AS releasedOn, c.is_current AS isCurrent, c.lcr_member_id AS lcrMemberId FROM callings c LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id`).all() as Array<{ title: string; unitName: string | null; sustainedOn: string | null; setApartOn: string | null; releasedOn: string | null; isCurrent: number; lcrMemberId: string | null }>;
    const allMembers = db.prepare(`SELECT lcr_member_id AS lcrMemberId, unit_name AS unitName, unit_abbreviation AS unitAbbreviation, temple_recommend_status AS templeRecommendStatus, is_convert AS isConvert, baptism_date AS baptismDate, move_in_date AS moveInDate, has_ministering_brothers AS hasMinisteringBrothers, has_ministering_sisters AS hasMinisteringSisters, age, birthdate, is_attending_seminary AS isAttendingSeminary, is_attending_institute AS isAttendingInstitute FROM members`).all() as SpikeMemberRow[];
    const syncRow = db.prepare(`SELECT sync_type AS syncType, status, completed_at AS completedAt FROM sync_logs WHERE status = 'success' ORDER BY completed_at DESC LIMIT 1`).get() as { syncType: string; status: string; completedAt: string | null } | undefined;
    const callings = allCallings.filter((calling) => !selectedUnit || (calling.unitName ?? "Unknown") === selectedUnit);
    const members = allMembers.filter((member) => matchesSelectedUnit(member, selectedUnit));
    const newLeadershipAlerts = loadSqliteLeadershipTrainingAlerts(db).filter(
      (row) => !selectedUnit || row.unitName === selectedUnit
    );

    const membersWithCurrentCalling = new Set(callings.filter(c => c.isCurrent === 1 && c.lcrMemberId).map(c => c.lcrMemberId!)).size;
    const overview = {
      totalMembers: members.length,
      currentCallings: callings.filter(c => c.isCurrent === 1 && c.lcrMemberId).length,
      membersWithCurrentCalling,
      membersWithoutCurrentCalling: Math.max(0, members.length - membersWithCurrentCalling),
      latestSync: syncRow ?? null
    };

    const monthKeys: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    const sustainedMap = new Map(monthKeys.map(k => [k, 0]));
    const releasedMap = new Map(monthKeys.map(k => [k, 0]));
    const convertMap = new Map(monthKeys.map(k => [k, 0]));
    for (const calling of callings) {
      if (/(president|bishop|high councilor)/i.test(calling.title)) {
        const sustainKey = monthKeyFromValue(calling.sustainedOn ?? calling.setApartOn);
        if (sustainKey && sustainedMap.has(sustainKey)) {
          sustainedMap.set(sustainKey, (sustainedMap.get(sustainKey) ?? 0) + 1);
        }
        const releasedKey = monthKeyFromValue(calling.releasedOn);
        if (releasedKey && releasedMap.has(releasedKey)) {
          releasedMap.set(releasedKey, (releasedMap.get(releasedKey) ?? 0) + 1);
        }
      }
    }
    for (const member of members) {
      if (toBool(member.isConvert)) {
        const monthKey = monthKeyFromValue(member.baptismDate ?? member.moveInDate);
        if (monthKey && convertMap.has(monthKey)) {
          convertMap.set(monthKey, (convertMap.get(monthKey) ?? 0) + 1);
        }
      }
    }

    const unitHealthRadar: UnitHealthRadarRow[] = fullReports.unitHealth.map((row) => {
      const unitMembers = members.filter((m) => unitLabel(m) === row.unitName);
      const semEligible = unitMembers.filter((m) => { const a = youthProgramAge(m); return a !== null && a >= 14 && a <= 18; }).length;
      const instEligible = unitMembers.filter((m) => { const a = actualAge(m); return a !== null && a >= 18 && a <= 35; }).length;
      const activeRecommend = unitMembers.filter((m) => isActiveTempleRecommendStatus(m.templeRecommendStatus)).length;
      const recentConvertCount = unitMembers.filter((m) => { const d = safeDate(m.baptismDate) ?? safeDate(m.moveInDate); return toBool(m.isConvert) && d && d >= daysAgoThreshold(365); }).length;
      const ministeringCoverageCount = unitMembers.filter((m) => toBool(m.hasMinisteringBrothers) || toBool(m.hasMinisteringSisters)).length;
      return {
        unitName: row.unitName,
        memberCount: row.memberCount,
        seminaryParticipationPct: semEligible > 0 ? Math.round((row.seminaryAttending / semEligible) * 100) : 0,
        instituteParticipationPct: instEligible > 0 ? Math.round((row.instituteAttending / instEligible) * 100) : 0,
        activeRecommendPct: row.memberCount > 0 ? Math.round((activeRecommend / row.memberCount) * 100) : 0,
        leadershipPer100: row.memberCount > 0 ? Math.round((row.leadershipCallings / row.memberCount) * 100) : 0,
        recentConvertPct: row.memberCount > 0 ? Math.round((recentConvertCount / row.memberCount) * 100) : 0,
        ministeringCoveragePct: row.memberCount > 0 ? Math.round((ministeringCoverageCount / row.memberCount) * 100) : 0
      };
    });

    return {
      overview,
      turnover: monthKeys.map((month) => ({ month, sustained: sustainedMap.get(month) ?? 0, released: releasedMap.get(month) ?? 0 })),
      converts: monthKeys.map((month) => ({ month, converts: convertMap.get(month) ?? 0 })),
      syncDiff,
      unitHealthRadar,
      newLeadershipAlerts
    };
  } finally {
    db.close();
  }
};
