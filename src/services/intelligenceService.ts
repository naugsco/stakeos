import { differenceInYears } from "date-fns";
import { openSqliteSpikeDb } from "@/src/sqlite/db";
import { env } from "@/src/config/env";
import { compareStakeDates, formatStakeMonthKey, isOnOrAfterDate, parseStakeDate } from "@/src/utils/date";

export interface CallingMember {
  memberId: number;
  lcrMemberId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  callingTitle: string;
  organizationName: string | null;
  sustainedOn: string | null;
}

export interface SpouseResult {
  member: string;
  spouse: string | null;
  spouseEmail: string | null;
  spousePhone: string | null;
}

export interface MissionEligibleRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  unitAbbreviation: string | null;
  gender: string | null;
  age: number | null;
  birthdate: string | null;
  missionStatus: string | null;
  templeRecommendStatus: string | null;
  isAttendingSeminary: boolean | null;
  isAttendingInstitute: boolean | null;
  email: string | null;
  phoneNumber: string | null;
  currentCalling: string | null;
}

export interface CurrentlyServingMissionaryRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  gender: string | null;
  age: number | null;
  missionCountry: string | null;
  missionStatus: string | null;
  templeRecommendStatus: string | null;
  email: string | null;
  phoneNumber: string | null;
  currentCalling: string | null;
}

export interface MissionaryFamilyMemberRow {
  lcrMemberId: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  householdPosition: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  missionStatus: string | null;
  missionCountry: string | null;
}

export interface MissionaryFamilyInfoResult {
  missionary: {
    lcrMemberId: string;
    fullName: string;
    missionCountry: string | null;
    missionStatus: string | null;
    age: number | null;
    gender: string | null;
    unitName: string | null;
  };
  householdName: string;
  householdId: number;
  emailList: string;
  phoneList: string;
  members: MissionaryFamilyMemberRow[];
}

export type MissionEligibleSortBy = "unit_age" | "age" | "unit" | "name";
export type MissionEligibleSortDirection = "asc" | "desc";

export interface MissionEligibleContactListOptions {
  ageMin?: number;
  ageMax?: number;
  unit?: string;
  gender?: string;
  requirePhone?: boolean;
  sortBy?: MissionEligibleSortBy;
  sortDirection?: MissionEligibleSortDirection;
  limit?: number;
}

export type ContactSortDirection = "asc" | "desc";

export interface LeadershipContactRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  callingTitle: string;
  organizationName: string | null;
  sustainedOn: string | null;
  phoneNumber: string | null;
  email: string | null;
  spouseName: string | null;
  spousePhone: string | null;
  spouseEmail: string | null;
}

export interface LeadershipContactListOptions {
  unit?: string;
  calling?: string;
  includeSpouses?: boolean;
  sortBy?: "unit" | "name" | "calling" | "sustained";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface OrganizationContactRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  organizationName: string | null;
  callingTitle: string;
  phoneNumber: string | null;
  email: string | null;
}

export interface OrganizationContactListOptions {
  organization?: string;
  unit?: string;
  calling?: string;
  sortBy?: "unit" | "name" | "organization" | "calling";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface CommitteeContactRow {
  committeeKey: string;
  committeeName: string;
  fullName: string;
  unitName: string | null;
  committeeRole: string;
  callingTitle: string;
  phoneNumber: string | null;
  email: string | null;
}

export interface CommitteeContactListOptions {
  committee?: string;
  unit?: string;
  sortBy?: "committee" | "unit" | "name" | "role";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface YouthHouseholdContactRow {
  youthLcrMemberId: string;
  youthName: string;
  age: number | null;
  unitName: string;
  youthPhone: string | null;
  youthEmail: string | null;
  parentGuardianNames: string;
  parentGuardianPhones: string;
  parentGuardianEmails: string;
}

export interface YouthHouseholdContactListOptions {
  ageMin?: number;
  ageMax?: number;
  unit?: string;
  requireGuardianContact?: boolean;
  sortBy?: "unit" | "age" | "name";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface MissionReadinessContactListOptions extends MissionEligibleContactListOptions {
  requireTempleRecommendActive?: boolean;
}

export interface EndowmentReadinessContactRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  templeEndowed: boolean | null;
  templeRecommendStatus: string | null;
  missionStatus: string | null;
  currentCalling: string | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface EndowmentReadinessContactListOptions {
  minAge?: number;
  unit?: string;
  requirePhone?: boolean;
  requireTempleRecommendActive?: boolean;
  sortBy?: "unit" | "age" | "name";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface NewMemberContactRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  convertFlag: boolean | null;
  moveInDate: string | null;
  callingTitle: string | null;
  phoneNumber: string | null;
  email: string | null;
  ministeringAssigned: boolean;
}

export interface NewMemberContactListOptions {
  unit?: string;
  includeConverts?: boolean;
  includeMoveIns?: boolean;
  monthsBack?: number;
  requireContact?: boolean;
  sortBy?: "unit" | "name" | "move_in_date";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface MissingContactDataRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  youthFlag: boolean;
  missingPhone: boolean;
  missingEmail: boolean;
  missingAddress: boolean;
  callingTitle: string | null;
}

export interface MissingContactDataListOptions {
  unit?: string;
  youthOnly?: boolean;
  includeAdults?: boolean;
  sortBy?: "unit" | "name" | "age";
  sortDirection?: ContactSortDirection;
  limit?: number;
}

export interface PriesthoodCandidateRow {
  lcrMemberId: string;
  fullName: string;
  age: number | null;
  currentOffice: string | null;
  recommendedNextOffice: string;
}

export interface EndowmentCandidateRow {
  lcrMemberId: string;
  fullName: string;
  age: number | null;
  missionStatus: string | null;
  templeEndowed: boolean | null;
}

export interface AttributeQueryRow {
  lcrMemberId: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  value: string | null;
}

export interface MemberDetail {
  lcrMemberId: string;
  fullName: string;
  preferredName: string | null;
  unitName: string | null;
  age: number | null;
  gender: string | null;
  birthdate: string | null;
  birthCountry: string | null;
  birthplace: string | null;
  moveInDate: string | null;
  memberStatus: string | null;
  baptismDate: string | null;
  confirmationDate: string | null;
  isAccountable: boolean | null;
  isBornInCovenant: boolean | null;
  isDivorced: boolean | null;
  isMarried: boolean | null;
  marriageDate: string | null;
  marriageStatus: string | null;
  endowmentStatus: string | null;
  endowmentDate: string | null;
  templeRecommendStatus: string | null;
  templeRecommendExpirationDate: string | null;
  templeRecommendType: string | null;
  missionStatus: string | null;
  missionLanguage: string | null;
  missionCountry: string | null;
  priesthoodType: string | null;
  priesthoodOffice: string | null;
  ordinationDate: string | null;
  instituteStatus: string | null;
  seminaryStatus: string | null;
  isAttendingSeminary: boolean | null;
  isAttendingInstitute: boolean | null;
  potentialInstituteStudent: boolean | null;
  potentialSeminaryStudent: boolean | null;
  ministeringBrothers: string | null;
  ministeringSisters: string | null;
  spouseName: string | null;
  headOfHouse: string | null;
  householdPosition: string | null;
  sealingToParents: string | null;
  sealingToSpouse: string | null;
  householdId: number | null;
  householdName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string | null;
  country: string | null;
  emails: string[];
  phoneNumbers: string[];
  currentCallings: Array<{
    callingTitle: string;
    organizationName: string | null;
    sustainedOn: string | null;
    setApartOn: string | null;
  }>;
  householdMembers: Array<{
    lcrMemberId: string;
    fullName: string;
    age: number | null;
    gender: string | null;
    householdPosition: string | null;
    relationshipHint: string;
  }>;
}

export interface CommitteeMemberRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  callingTitle: string;
  sustainedOn: string | null;
  email: string | null;
}

export interface CommitteeRoster {
  key: string;
  name: string;
  handbookBasis: string;
  handbookUrl: string;
  members: CommitteeMemberRow[];
}

export interface TempleRecommendAttentionRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  templeRecommendStatus: string | null;
}

export interface TempleRecommendRecoveryRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  templeRecommendStatus: string | null;
  reactivatedAt: string;
  inactiveDays: number;
}

export interface TempleRecommendHealthReport {
  statusCounts: Array<{ label: string; value: number }>;
  attentionMembers: TempleRecommendAttentionRow[];
  recoveredAfterLongLapse: TempleRecommendRecoveryRow[];
  trackingSince: string | null;
  daysTracked: number;
}

export interface SeminaryInstituteByUnitRow {
  unitName: string;
  seminaryEligible: number;
  seminaryAttending: number;
  seminaryParticipationPct: number;
  instituteEligible: number;
  instituteAttending: number;
  instituteParticipationPct: number;
}

export interface YouthTransitionMilestoneRow {
  label: string;
  eligibleCount: number;
  completedCount: number;
  completionPct: number;
}

export interface YouthOrganizationTransitionRow {
  label: string;
  count: number;
}

export interface UnitReadinessScatterRow {
  unitName: string;
  classParticipationPct: number;
  classParticipationLabel: string;
  ministeringAssignmentPct: number;
  activeRecommendPct: number;
  weightedReadinessScore: number;
}

export interface UnitHealthRadarRow {
  unitName: string;
  memberCount: number;
  seminaryParticipationPct: number;
  instituteParticipationPct: number;
  activeRecommendPct: number;
  leadershipPer100: number;
  recentConvertPct: number;
  ministeringCoveragePct: number;
}

export interface MissionYouthPipelineRow {
  lcrMemberId: string;
  unitName: string;
  fullName: string;
  age: number | null;
  gender: string | null;
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

export interface MissionReadinessCompositeReport {
  summary: Array<{ label: string; value: number }>;
  members: MissionYouthPipelineRow[];
}

export interface RecentBaptismPathRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  baptismDate: string | null;
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  currentCalling: string | null;
  ministeringAssigned: boolean;
  assignedAsMinister: boolean | null;
  assignedAsMinisterLabel: string;
}

export interface NewReturningStrengtheningRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  focusCategory: string;
  focusDate: string | null;
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  ministeringAssigned: boolean;
  recoveredAfterLongLapse: boolean;
  reactivatedAt: string | null;
  inactiveDays: number | null;
}

export interface NewReturningStrengtheningReport {
  summary: Array<{ label: string; value: number }>;
  members: NewReturningStrengtheningRow[];
}

export interface PriesthoodProgressionRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  currentOffice: string | null;
  recommendedNextOffice: string;
}

export interface PriesthoodProgressionReport {
  summary: Array<{ label: string; value: number }>;
  members: PriesthoodProgressionRow[];
}

export interface RecentBaptismRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  baptismDate: string | null;
  confirmationDate: string | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface RecentBaptismReport {
  summary: Array<{ label: string; value: number }>;
  members: RecentBaptismRow[];
}

export interface RecommendExpirationRiskRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  templeRecommendStatus: string | null;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
}

export interface RecommendExpirationRiskReport {
  summary: Array<{ label: string; value: number }>;
  members: RecommendExpirationRiskRow[];
}

export interface MinisteringGapRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  gapCategory: "No Assigned Ministers";
  hasMinisteringBrothers: boolean | null;
  hasMinisteringSisters: boolean | null;
  ministeringBrothers: string | null;
  ministeringSisters: string | null;
  spouseName: string | null;
  phoneNumber: string | null;
  email: string | null;
}

export interface MinisteringGapReport {
  summary: Array<{ label: string; value: number }>;
  members: MinisteringGapRow[];
}

export interface MinisteringCoverageUnitRow {
  unitName: string;
  eligibleCount: number;
  noAssignedCount: number;
  brothersOnlyCount: number;
  sistersOnlyCount: number;
  bothAssignedCount: number;
  assignedAnyCount: number;
  assignedAnyPct: number;
  noAssignedPct: number;
}

export interface SeminaryInstituteOpportunityRow {
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
}

export interface HouseholdOutreachRow {
  householdId: number;
  householdName: string;
  headOfHouse: string | null;
  unitName: string;
  memberCount: number;
  youthCount: number;
  recentBaptismCount: number;
  recommendRiskCount: number;
  ministeringGapCount: number;
  householdEmails: string;
  householdPhones: string;
  focusAreas: string[];
}

export interface HouseholdOutreachReport {
  summary: Array<{ label: string; value: number }>;
  households: HouseholdOutreachRow[];
}

export interface HouseholdContactRow {
  householdId: number;
  householdName: string;
  unitName: string;
  headOfHouse: string | null;
  memberCount: number;
  memberNames: string;
  emailList: string;
  phoneList: string;
}

export interface MarriedCoupleContactRow {
  householdId: number;
  householdName: string;
  unitName: string;
  coupleNames: string;
  emailList: string;
  phoneList: string;
}

export interface CovenantPathProgressionRow {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  baptismDate: string | null;
  confirmationDate: string | null;
  endowmentDate: string | null;
  ordinationDate: string | null;
  templeRecommendStatus: string | null;
  currentCalling: string | null;
  ministeringAssigned: boolean;
  ordinanceBucket: string;
  templeBucket: string;
  serviceBucket: string;
  youthBucket: string | null;
  familyBucket: string | null;
  overallFocus: string;
  attentionScore: number;
  recentMilestoneDate: string | null;
  milestones: string[];
}

// ---------------------------------------------------------------------------
// SQLite helper expressions
// ---------------------------------------------------------------------------

const fullNameExpr = `TRIM(m.first_name || ' ' || m.last_name)`;

const isUnmarriedSql = (alias = "m") =>
  `(COALESCE(${alias}.is_married, 0) = 0 AND (COALESCE(${alias}.is_single, 0) = 1 OR LOWER(COALESCE(${alias}.marriage_status, '')) = 'single'))`;

// Current callings subquery (replaces current_callings_dedup view)
const currentCallingSql = `callings c WHERE c.released_on IS NULL AND c.is_current = 1`;

// Unit name resolution: SQLite members carry unit_name directly
const unitNameExpr = (alias = "m") => `COALESCE(NULLIF(${alias}.unit_name, ''), 'Unknown')`;

// NULLS LAST emulation
const nullsLast = (col: string) => `CASE WHEN ${col} IS NULL THEN 1 ELSE 0 END`;

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

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

const dedupeRows = <T>(rows: T[], keyFn: (row: T) => string): T[] => {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(row);
  }
  return output;
};

const resolveSortDirection = (direction?: ContactSortDirection): ContactSortDirection =>
  direction === "desc" ? "desc" : "asc";

const compareNullable = (
  left: string | number | boolean | null | undefined,
  right: string | number | boolean | null | undefined,
  direction: ContactSortDirection
) => {
  const first = left ?? null;
  const second = right ?? null;

  if (first === null && second === null) {
    return 0;
  }
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }

  let result = 0;
  if (typeof first === "number" && typeof second === "number") {
    result = first - second;
  } else if (typeof first === "boolean" && typeof second === "boolean") {
    result = Number(first) - Number(second);
  } else {
    result = String(first).localeCompare(String(second), undefined, { sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const monthsAgoThreshold = (months: number) => {
  const today = startOfToday();
  today.setMonth(today.getMonth() - months);
  return today;
};

const daysAgoThreshold = (days: number) => {
  const today = startOfToday();
  today.setDate(today.getDate() - days);
  return today;
};

const safeDate = (value?: string | null) => {
  return parseStakeDate(value);
};

const daysFromToday = (date: Date) => Math.floor((date.getTime() - startOfToday().getTime()) / 86400000);

const actualAgeFromBirthdate = (birthdate?: string | null, fallbackAge?: number | null) => {
  if (typeof fallbackAge === "number") {
    return fallbackAge;
  }

  const parsed = safeDate(birthdate);
  if (!parsed) {
    return null;
  }

  const today = startOfToday();
  let age = today.getFullYear() - parsed.getFullYear();
  const birthdayPassed =
    today.getMonth() > parsed.getMonth() ||
    (today.getMonth() === parsed.getMonth() && today.getDate() >= parsed.getDate());
  if (!birthdayPassed) {
    age -= 1;
  }
  return age;
};

const youthProgramAgeFromBirthdate = (birthdate?: string | null, fallbackAge?: number | null) => {
  const parsed = safeDate(birthdate);
  if (!parsed) {
    return typeof fallbackAge === "number" ? fallbackAge : null;
  }
  return startOfToday().getFullYear() - parsed.getFullYear();
};

const isSeminaryEligibleAge = (youthProgramAge: number | null) =>
  youthProgramAge !== null && youthProgramAge >= 14 && youthProgramAge <= 18;

const isInstituteEligibleAge = (actualAge: number | null) =>
  actualAge !== null && actualAge >= 18 && actualAge <= 35;

const isOnOrAfter = (value: string | null | undefined, threshold: Date) => {
  return isOnOrAfterDate(value, threshold);
};

const compareDateStrings = (
  left: string | null | undefined,
  right: string | null | undefined,
  direction: ContactSortDirection = "asc"
) => {
  return compareStakeDates(left, right, direction);
};
const monthKeyFromValue = (value?: string | null) => formatStakeMonthKey(value);

const normalizeTempleRecommendStatus = (status: string | null | undefined) => (status ?? "").trim().toLowerCase();

const isActiveTempleRecommendStatus = (status: string | null | undefined) =>
  normalizeTempleRecommendStatus(status).startsWith("active");

const normalizeGenderBucket = (value: string | null | undefined): "Men" | "Women" | "Unknown" => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "m" || normalized === "male" || normalized === "man") {
    return "Men";
  }
  if (normalized === "f" || normalized === "female" || normalized === "woman") {
    return "Women";
  }
  return "Unknown";
};

const normalizeUnitScope = (value?: string | null) => {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
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

const inferCommitteeRole = (callingTitle: string) => {
  if (/president/i.test(callingTitle)) {
    return "President";
  }
  if (/counselor/i.test(callingTitle)) {
    return "Counselor";
  }
  if (/secretary/i.test(callingTitle)) {
    return "Secretary";
  }
  if (/clerk/i.test(callingTitle)) {
    return "Clerk";
  }
  return "Member";
};

// ---------------------------------------------------------------------------
// Helper to convert SQLite integer booleans to JS booleans
// ---------------------------------------------------------------------------
const toBool = (value: unknown): boolean => value === 1 || value === true;
const toBoolOrNull = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  return value === 1 || value === true;
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export const getCallingMembers = async (callingText: string) => {
  const db = openSqliteSpikeDb();
  try {
    const pattern = `%${callingText}%`;
    const rows = db.prepare(
      `
      SELECT
        m.id AS memberId,
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber,
        c.title AS callingTitle,
        c.organization_name AS organizationName,
        c.sustained_on AS sustainedOn
      FROM callings c
      LEFT JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND (c.title LIKE ? OR COALESCE(c.organization_name, '') LIKE ?)
      ORDER BY ${nullsLast('m.last_name')}, m.last_name, ${nullsLast('m.first_name')}, m.first_name
      `
    ).all(pattern, pattern) as CallingMember[];

    return dedupeRows(
      rows.map((row) => ({
        ...row,
        callingTitle: cleanCallingTitle(row.callingTitle)
      })),
      (row) => `${row.lcrMemberId}:${row.callingTitle.toLowerCase()}`
    );
  } finally {
    db.close();
  }
};

export const getSpouse = async (memberSearch: string): Promise<SpouseResult | null> => {
  const db = openSqliteSpikeDb();
  try {
    const member = db.prepare(
      `
      SELECT
        m.id,
        m.household_id AS householdId,
        ${fullNameExpr} AS fullName
      FROM members m
      WHERE m.lcr_member_id = ? OR ${fullNameExpr} LIKE ?
      ORDER BY CASE WHEN m.lcr_member_id = ? THEN 0 ELSE 1 END
      LIMIT 1
      `
    ).get(memberSearch, `%${memberSearch}%`, memberSearch) as { id: number; householdId: number | null; fullName: string } | undefined;

    if (!member) {
      return null;
    }

    if (!member.householdId) {
      return {
        member: member.fullName,
        spouse: null,
        spouseEmail: null,
        spousePhone: null
      };
    }

    const spouse = db.prepare(
      `
      SELECT
        ${fullNameExpr} AS fullName,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber
      FROM members m
      WHERE m.household_id = ?
        AND m.id <> ?
      ORDER BY ${nullsLast('m.age')}, m.age DESC
      LIMIT 1
      `
    ).get(member.householdId, member.id) as { fullName: string; email: string | null; phoneNumber: string | null } | undefined;

    return {
      member: member.fullName,
      spouse: spouse?.fullName ?? null,
      spouseEmail: spouse?.email ?? null,
      spousePhone: spouse?.phoneNumber ?? null
    };
  } finally {
    db.close();
  }
};

export const yearsInCalling = async (callingTitle: string, memberName?: string) => {
  const db = openSqliteSpikeDb();
  try {
    const params: unknown[] = [`%${callingTitle}%`];
    let memberFilter = "";
    if (memberName) {
      memberFilter = `AND ${fullNameExpr} LIKE ?`;
      params.push(`%${memberName}%`);
    }

    const rows = db.prepare(
      `
      SELECT
        ${fullNameExpr} AS fullName,
        c.title AS callingTitle,
        c.sustained_on AS sustainedOn
      FROM callings c
      LEFT JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.title LIKE ?
        ${memberFilter}
      ORDER BY ${nullsLast('c.sustained_on')}, c.sustained_on ASC
      `
    ).all(...params) as Array<{ fullName: string; callingTitle: string; sustainedOn: string | null }>;

    return dedupeRows(
      rows.map((row) => ({
        ...row,
        callingTitle: cleanCallingTitle(row.callingTitle),
        years: row.sustainedOn && safeDate(row.sustainedOn) ? differenceInYears(new Date(), safeDate(row.sustainedOn)!) : null
      })),
      (row) => `${row.fullName}:${row.callingTitle.toLowerCase()}`
    );
  } finally {
    db.close();
  }
};

export const missionEligibleMembers = async (ageMin = 18, ageMax = 25) => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        COALESCE(NULLIF(m.unit_abbreviation, ''), ${unitNameExpr()}) AS unitAbbreviation,
        m.gender,
        m.age,
        m.birthdate,
        m.mission_status AS missionStatus,
        m.temple_recommend_status AS templeRecommendStatus,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling
      FROM members m
      WHERE m.age BETWEEN ? AND ?
        AND (m.member_status IS NULL OR m.member_status LIKE 'active%' OR m.member_status LIKE 'Active%')
        AND COALESCE(m.is_returned_missionary, 0) = 0
        AND NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NULL
        AND NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NULL
      ORDER BY ${nullsLast('m.age')}, m.age DESC, m.last_name, m.first_name
      `
    ).all(ageMin, ageMax) as MissionEligibleRow[];

    return rows.map((row) => ({
      ...row,
      isAttendingSeminary: toBoolOrNull(row.isAttendingSeminary),
      isAttendingInstitute: toBoolOrNull(row.isAttendingInstitute),
      currentCalling: cleanCallingTitle(row.currentCalling)
    }));
  } finally {
    db.close();
  }
};

export const getCurrentlyServingMissionaries = async (): Promise<CurrentlyServingMissionaryRow[]> => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.gender,
        m.age,
        m.mission_country AS missionCountry,
        m.mission_status AS missionStatus,
        m.temple_recommend_status AS templeRecommendStatus,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling
      FROM members m
      WHERE
        NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NOT NULL
        OR (
          NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NOT NULL
          AND COALESCE(m.is_returned_missionary, 0) = 0
        )
      ORDER BY ${nullsLast('m.age')}, m.age DESC, m.last_name, m.first_name
      LIMIT 500
      `
    ).all() as CurrentlyServingMissionaryRow[];

    return rows.map((row) => ({
      ...row,
      currentCalling: cleanCallingTitle(row.currentCalling)
    }));
  } finally {
    db.close();
  }
};

export const getMissionaryFamilyInfo = async (search: string): Promise<MissionaryFamilyInfoResult | null> => {
  const db = openSqliteSpikeDb();
  try {
    const missionary = db.prepare(
      `
      SELECT
        m.id AS memberId,
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.gender,
        m.age,
        m.mission_country AS missionCountry,
        m.mission_status AS missionStatus,
        m.household_id AS householdId
      FROM members m
      WHERE
        (
          NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NOT NULL
          OR (
            NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NOT NULL
            AND COALESCE(m.is_returned_missionary, 0) = 0
          )
        )
        AND (
          m.lcr_member_id = ?
          OR ${fullNameExpr} LIKE ?
        )
      ORDER BY m.last_name, m.first_name
      LIMIT 1
      `
    ).get(search.trim(), `%${search.trim()}%`) as {
      memberId: number;
      lcrMemberId: string;
      fullName: string;
      unitName: string | null;
      gender: string | null;
      age: number | null;
      missionCountry: string | null;
      missionStatus: string | null;
      householdId: number | null;
    } | undefined;

    if (!missionary || !missionary.householdId) {
      return null;
    }

    const householdId = missionary.householdId;

    const household = db.prepare(
      `
      SELECT
        h.id AS householdId,
        COALESCE(NULLIF(h.household_name, ''), NULLIF(m.head_of_house, ''), 'Household') AS householdName
      FROM households h
      JOIN members m ON m.household_id = h.id
      WHERE h.id = ?
      ORDER BY m.last_name, m.first_name
      LIMIT 1
      `
    ).get(householdId) as { householdId: number; householdName: string } | undefined;

    const members = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        m.age,
        m.gender,
        m.household_position AS householdPosition,
        m.primary_email AS primaryEmail,
        m.primary_phone AS primaryPhone,
        m.mission_status AS missionStatus,
        m.mission_country AS missionCountry
      FROM members m
      WHERE m.household_id = ?
      ORDER BY m.last_name, m.first_name
      `
    ).all(householdId) as MissionaryFamilyMemberRow[];

    const contacts = db.prepare(
      `
      SELECT
        COALESCE((SELECT GROUP_CONCAT(e, ' | ') FROM (SELECT DISTINCT primary_email AS e FROM members WHERE household_id = ? AND primary_email IS NOT NULL)), '') AS emailList,
        COALESCE((SELECT GROUP_CONCAT(p, ' | ') FROM (SELECT DISTINCT primary_phone AS p FROM members WHERE household_id = ? AND primary_phone IS NOT NULL)), '') AS phoneList
      `
    ).get(householdId, householdId) as { emailList: string; phoneList: string } | undefined;

    return {
      missionary: {
        lcrMemberId: missionary.lcrMemberId,
        fullName: missionary.fullName,
        missionCountry: missionary.missionCountry,
        missionStatus: missionary.missionStatus,
        age: missionary.age,
        gender: missionary.gender,
        unitName: missionary.unitName
      },
      householdName: household?.householdName ?? "Household",
      householdId,
      emailList: contacts?.emailList ?? "",
      phoneList: contacts?.phoneList ?? "",
      members
    };
  } finally {
    db.close();
  }
};

const missionEligibleOrderBySqlite: Record<`${MissionEligibleSortBy}_${MissionEligibleSortDirection}`, string> = {
  unit_age_asc:
    `${unitNameExpr()} ASC, ` +
    `${nullsLast('m.age')}, m.age ASC, ` +
    `m.last_name ASC, m.first_name ASC`,
  unit_age_desc:
    `${unitNameExpr()} ASC, ` +
    `${nullsLast('m.age')}, m.age DESC, ` +
    `m.last_name ASC, m.first_name ASC`,
  age_asc:
    `${nullsLast('m.age')}, m.age ASC, ` +
    `${unitNameExpr()} ASC, m.last_name ASC, m.first_name ASC`,
  age_desc:
    `${nullsLast('m.age')}, m.age DESC, ` +
    `${unitNameExpr()} ASC, m.last_name ASC, m.first_name ASC`,
  unit_asc: `${unitNameExpr()} ASC, m.last_name ASC, m.first_name ASC`,
  unit_desc: `${unitNameExpr()} DESC, m.last_name ASC, m.first_name ASC`,
  name_asc: "m.last_name ASC, m.first_name ASC",
  name_desc: "m.last_name DESC, m.first_name DESC"
};

export const missionEligibleContactList = async (options: MissionEligibleContactListOptions = {}) => {
  const ageMin = options.ageMin ?? 18;
  const ageMax = options.ageMax ?? 25;
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const genderFilter = options.gender?.trim() ? `%${options.gender.trim()}%` : null;
  const requirePhone = options.requirePhone ?? false;
  const sortBy = options.sortBy ?? "unit_age";
  const sortDirection = options.sortDirection ?? "asc";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 2000));
  const orderKey = `${sortBy}_${sortDirection}` as const;
  const orderBy = missionEligibleOrderBySqlite[orderKey] ?? missionEligibleOrderBySqlite.unit_age_asc;

  const conditions: string[] = [
    `m.age BETWEEN ? AND ?`,
    `(m.member_status IS NULL OR m.member_status LIKE 'active%' OR m.member_status LIKE 'Active%')`,
    `COALESCE(m.is_returned_missionary, 0) = 0`,
    `NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NULL`,
    `NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NULL`
  ];
  const params: unknown[] = [ageMin, ageMax];

  if (unitFilter) {
    conditions.push(`${unitNameExpr()} LIKE ?`);
    params.push(unitFilter);
  }
  if (genderFilter) {
    conditions.push(`COALESCE(m.gender, '') LIKE ?`);
    params.push(genderFilter);
  }
  if (requirePhone) {
    conditions.push(`m.primary_phone IS NOT NULL`);
  }

  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        COALESCE(NULLIF(m.unit_abbreviation, ''), ${unitNameExpr()}) AS unitAbbreviation,
        m.gender,
        m.age,
        m.birthdate,
        m.mission_status AS missionStatus,
        m.temple_recommend_status AS templeRecommendStatus,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling
      FROM members m
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ${safeLimit}
      `
    ).all(...params) as MissionEligibleRow[];

    return rows.map((row) => ({
      ...row,
      isAttendingSeminary: toBoolOrNull(row.isAttendingSeminary),
      isAttendingInstitute: toBoolOrNull(row.isAttendingInstitute),
      currentCalling: cleanCallingTitle(row.currentCalling)
    }));
  } finally {
    db.close();
  }
};

export const getLeadershipContactList = async (options: LeadershipContactListOptions = {}) => {
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const callingFilter = options.calling?.trim() ? `%${options.calling.trim()}%` : null;
  const includeSpouses = options.includeSpouses ?? true;
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "unit";

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `c.released_on IS NULL AND c.is_current = 1`,
      `(c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%'
        OR COALESCE(c.organization_name, '') LIKE '%Stake Presidency%' OR COALESCE(c.organization_name, '') LIKE '%Bishopric%' OR COALESCE(c.organization_name, '') LIKE '%High Council%'
        OR COALESCE(c.organization_name, '') LIKE '%Young Women Presidency%' OR COALESCE(c.organization_name, '') LIKE '%Relief Society Presidency%'
        OR COALESCE(c.organization_name, '') LIKE '%Elders Quorum Presidency%' OR COALESCE(c.organization_name, '') LIKE '%Primary Presidency%'
        OR COALESCE(c.organization_name, '') LIKE '%Sunday School Presidency%')`
    ];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }
    if (callingFilter) {
      conditions.push(`(c.title LIKE ? OR COALESCE(c.organization_name, '') LIKE ?)`);
      params.push(callingFilter, callingFilter);
    }

    const rawRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        c.title AS callingTitle,
        c.organization_name AS organizationName,
        c.sustained_on AS sustainedOn,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email,
        m.household_id AS householdId,
        m.id AS memberId
      FROM callings c
      JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as Array<
      Omit<LeadershipContactRow, "spouseName" | "spousePhone" | "spouseEmail"> & {
        householdId: number | null;
        memberId: number;
      }
    >;

    const rows = rawRows.map((row) => {
      let spouseName: string | null = null;
      let spousePhone: string | null = null;
      let spouseEmail: string | null = null;

      if (includeSpouses && row.householdId) {
        const spouse = db.prepare(
          `
          SELECT
            TRIM(sm.first_name || ' ' || sm.last_name) AS fullName,
            sm.primary_phone AS phoneNumber,
            sm.primary_email AS email
          FROM members sm
          WHERE sm.household_id = ?
            AND sm.id <> ?
          ORDER BY ${nullsLast('sm.age')}, sm.age DESC, sm.last_name, sm.first_name
          LIMIT 1
          `
        ).get(row.householdId, row.memberId) as { fullName: string; phoneNumber: string | null; email: string | null } | undefined;
        if (spouse) {
          spouseName = spouse.fullName;
          spousePhone = spouse.phoneNumber;
          spouseEmail = spouse.email;
        }
      }

      return {
        lcrMemberId: row.lcrMemberId,
        fullName: row.fullName,
        unitName: row.unitName,
        callingTitle: cleanCallingTitle(row.callingTitle),
        organizationName: row.organizationName,
        sustainedOn: row.sustainedOn,
        phoneNumber: row.phoneNumber,
        email: row.email,
        spouseName,
        spousePhone,
        spouseEmail
      };
    });

    const sorted = [...rows].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.fullName, right.fullName, direction);
      }
      if (sortBy === "calling") {
        return compareNullable(left.callingTitle, right.callingTitle, direction);
      }
      if (sortBy === "sustained") {
        return compareNullable(left.sustainedOn, right.sustainedOn, direction);
      }
      const byUnit = compareNullable(left.unitName, right.unitName, direction);
      if (byUnit !== 0) {
        return byUnit;
      }
      return compareNullable(left.fullName, right.fullName, "asc");
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getOrganizationContactList = async (options: OrganizationContactListOptions = {}) => {
  const organizationFilter = options.organization?.trim() ? `%${options.organization.trim()}%` : null;
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const callingFilter = options.calling?.trim() ? `%${options.calling.trim()}%` : null;
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "organization";

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [`c.released_on IS NULL AND c.is_current = 1`];
    const params: unknown[] = [];

    if (organizationFilter) {
      conditions.push(`COALESCE(c.organization_name, '') LIKE ?`);
      params.push(organizationFilter);
    }
    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }
    if (callingFilter) {
      conditions.push(`c.title LIKE ?`);
      params.push(callingFilter);
    }

    const rawRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        c.organization_name AS organizationName,
        c.title AS callingTitle,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM callings c
      JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as OrganizationContactRow[];

    const rows = rawRows.map((row) => ({
      ...row,
      callingTitle: cleanCallingTitle(row.callingTitle)
    }));

    const sorted = [...rows].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.fullName, right.fullName, direction);
      }
      if (sortBy === "unit") {
        const byUnit = compareNullable(left.unitName, right.unitName, direction);
        if (byUnit !== 0) {
          return byUnit;
        }
        return compareNullable(left.fullName, right.fullName, "asc");
      }
      if (sortBy === "calling") {
        return compareNullable(left.callingTitle, right.callingTitle, direction);
      }
      const byOrg = compareNullable(left.organizationName, right.organizationName, direction);
      if (byOrg !== 0) {
        return byOrg;
      }
      return compareNullable(left.fullName, right.fullName, "asc");
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getMissionReadinessContactList = async (options: MissionReadinessContactListOptions = {}) => {
  const rows = await missionEligibleContactList(options);
  if (!options.requireTempleRecommendActive) {
    return rows;
  }

  return rows.filter((row) => (row.templeRecommendStatus ?? "").toLowerCase().includes("active"));
};

export const getEndowmentReadinessContactList = async (options: EndowmentReadinessContactListOptions = {}) => {
  const minAge = options.minAge ?? 18;
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const requirePhone = options.requirePhone ?? false;
  const requireTempleRecommendActive = options.requireTempleRecommendActive ?? false;
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "age";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `m.age >= ?`,
      `COALESCE(m.temple_endowed, 0) = 0`
    ];
    const params: unknown[] = [minAge];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }
    if (requirePhone) {
      conditions.push(`m.primary_phone IS NOT NULL`);
    }
    if (requireTempleRecommendActive) {
      conditions.push(`COALESCE(m.temple_recommend_status, '') LIKE 'active%' OR COALESCE(m.temple_recommend_status, '') LIKE 'Active%'`);
    }

    const rawRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.temple_endowed AS templeEndowed,
        m.temple_recommend_status AS templeRecommendStatus,
        m.mission_status AS missionStatus,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as EndowmentReadinessContactRow[];

    const rows = rawRows.map((row) => ({
      ...row,
      templeEndowed: toBoolOrNull(row.templeEndowed),
      currentCalling: cleanCallingTitle(row.currentCalling)
    }));

    const sorted = [...rows].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.fullName, right.fullName, direction);
      }
      if (sortBy === "unit") {
        const byUnit = compareNullable(left.unitName, right.unitName, direction);
        if (byUnit !== 0) {
          return byUnit;
        }
        return compareNullable(left.fullName, right.fullName, "asc");
      }
      return compareNullable(left.age, right.age, direction);
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getYouthHouseholdContactList = async (options: YouthHouseholdContactListOptions = {}) => {
  const ageMin = options.ageMin ?? 12;
  const ageMax = options.ageMax ?? 18;
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const requireGuardianContact = options.requireGuardianContact ?? false;
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "unit";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `m.age BETWEEN ? AND ?`,
      `(m.member_status IS NULL OR m.member_status LIKE 'active%' OR m.member_status LIKE 'Active%')`
    ];
    const params: unknown[] = [ageMin, ageMax];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }

    const youthRows = db.prepare(
      `
      SELECT
        m.id AS memberId,
        m.household_id AS householdId,
        m.lcr_member_id AS youthLcrMemberId,
        ${fullNameExpr} AS youthName,
        m.age,
        ${unitNameExpr()} AS unitName,
        m.primary_email AS youthEmail,
        m.primary_phone AS youthPhone
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as Array<{
      memberId: number;
      householdId: number | null;
      youthLcrMemberId: string;
      youthName: string;
      age: number | null;
      unitName: string;
      youthEmail: string | null;
      youthPhone: string | null;
    }>;

    const guardianStmt = db.prepare(
      `
      SELECT
        GROUP_CONCAT(TRIM(pm.first_name || ' ' || pm.last_name), ' | ') AS parentGuardianNames,
        (SELECT GROUP_CONCAT(p, ' | ') FROM (SELECT DISTINCT primary_phone AS p FROM members WHERE household_id = ? AND id <> ? AND age >= 18 AND primary_phone IS NOT NULL)) AS parentGuardianPhones,
        (SELECT GROUP_CONCAT(e, ' | ') FROM (SELECT DISTINCT primary_email AS e FROM members WHERE household_id = ? AND id <> ? AND age >= 18 AND primary_email IS NOT NULL)) AS parentGuardianEmails
      FROM members pm
      WHERE pm.household_id = ?
        AND pm.id <> ?
        AND pm.age >= 18
      `
    );

    const resultRows: YouthHouseholdContactRow[] = [];
    for (const youth of youthRows) {
      let parentGuardianNames = "";
      let parentGuardianPhones = "";
      let parentGuardianEmails = "";

      if (youth.householdId) {
        const guardian = guardianStmt.get(youth.householdId, youth.memberId, youth.householdId, youth.memberId, youth.householdId, youth.memberId) as {
          parentGuardianNames: string | null;
          parentGuardianPhones: string | null;
          parentGuardianEmails: string | null;
        } | undefined;
        parentGuardianNames = guardian?.parentGuardianNames ?? "";
        parentGuardianPhones = guardian?.parentGuardianPhones ?? "";
        parentGuardianEmails = guardian?.parentGuardianEmails ?? "";
      }

      if (requireGuardianContact && !parentGuardianPhones && !parentGuardianEmails) {
        continue;
      }

      resultRows.push({
        youthLcrMemberId: youth.youthLcrMemberId,
        youthName: youth.youthName,
        age: youth.age,
        unitName: youth.unitName,
        youthPhone: youth.youthPhone,
        youthEmail: youth.youthEmail,
        parentGuardianNames,
        parentGuardianPhones,
        parentGuardianEmails
      });
    }

    const sorted = [...resultRows].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.youthName, right.youthName, direction);
      }
      if (sortBy === "age") {
        return compareNullable(left.age, right.age, direction);
      }
      const byUnit = compareNullable(left.unitName, right.unitName, direction);
      if (byUnit !== 0) {
        return byUnit;
      }
      return compareNullable(left.youthName, right.youthName, "asc");
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getNewMemberContactList = async (options: NewMemberContactListOptions = {}) => {
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const includeConverts = options.includeConverts ?? true;
  const includeMoveIns = options.includeMoveIns ?? true;
  const monthsBack = Math.max(1, Math.min(options.monthsBack ?? 12, 60));
  const requireContact = options.requireContact ?? false;
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "move_in_date";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));
  const cutoffDate = monthsAgoThreshold(monthsBack);

  const db = openSqliteSpikeDb();
  try {
    const convertCondition = includeConverts
      ? `(m.is_convert = 1 AND (NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL OR NULLIF(TRIM(COALESCE(m.move_in_date, '')), '') IS NOT NULL))`
      : `0`;
    const moveInCondition = includeMoveIns
      ? `NULLIF(TRIM(COALESCE(m.move_in_date, '')), '') IS NOT NULL`
      : `0`;

    const conditions: string[] = [`(${convertCondition} OR ${moveInCondition})`];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }
    if (requireContact) {
      conditions.push(`(m.primary_email IS NOT NULL OR m.primary_phone IS NOT NULL)`);
    }

    const rawRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.is_convert AS convertFlag,
        m.baptism_date AS baptismDate,
        m.move_in_date AS moveInDate,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS callingTitle,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email,
        (COALESCE(m.has_ministering_brothers, 0) OR COALESCE(m.has_ministering_sisters, 0)) AS ministeringAssigned
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as Array<
      Omit<NewMemberContactRow, "convertFlag" | "ministeringAssigned"> & {
        convertFlag: number | null;
        baptismDate: string | null;
        ministeringAssigned: number;
      }
    >;

    const rows = rawRows
      .filter((row) => {
        const isRecentConvert =
          includeConverts &&
          toBool(row.convertFlag) &&
          (isOnOrAfter(row.baptismDate, cutoffDate) || isOnOrAfter(row.moveInDate, cutoffDate));
        const isRecentMoveIn = includeMoveIns && isOnOrAfter(row.moveInDate, cutoffDate);
        return isRecentConvert || isRecentMoveIn;
      })
      .map(({ baptismDate: _baptismDate, ...row }) => ({
        ...row,
        convertFlag: toBoolOrNull(row.convertFlag),
        callingTitle: cleanCallingTitle(row.callingTitle),
        ministeringAssigned: toBool(row.ministeringAssigned)
      }));

    const sorted = [...rows].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.fullName, right.fullName, direction);
      }
      if (sortBy === "unit") {
        const byUnit = compareNullable(left.unitName, right.unitName, direction);
        if (byUnit !== 0) {
          return byUnit;
        }
        return compareNullable(left.fullName, right.fullName, "asc");
      }
      return compareDateStrings(left.moveInDate, right.moveInDate, direction);
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getMissingContactDataList = async (options: MissingContactDataListOptions = {}) => {
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const youthScope = options.youthOnly || options.includeAdults === false;
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "unit";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `(m.primary_phone IS NULL OR m.primary_email IS NULL OR COALESCE(NULLIF(m.address_line1, ''), NULLIF(h.address_line1, '')) IS NULL OR COALESCE(NULLIF(m.city, ''), NULLIF(h.city, '')) IS NULL OR COALESCE(NULLIF(m.postal_code, ''), NULLIF(h.postal_code, '')) IS NULL)`
    ];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }
    if (youthScope) {
      conditions.push(`m.age BETWEEN 11 AND 25`);
    }

    const rawRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        (m.age BETWEEN 11 AND 25) AS youthFlag,
        (m.primary_phone IS NULL) AS missingPhone,
        (m.primary_email IS NULL) AS missingEmail,
        (
          COALESCE(NULLIF(m.address_line1, ''), NULLIF(h.address_line1, '')) IS NULL
          OR COALESCE(NULLIF(m.city, ''), NULLIF(h.city, '')) IS NULL
          OR COALESCE(NULLIF(m.postal_code, ''), NULLIF(h.postal_code, '')) IS NULL
        ) AS missingAddress,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS callingTitle
      FROM members m
      LEFT JOIN households h ON m.household_id = h.id
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as MissingContactDataRow[];

    const rows = rawRows.map((row) => ({
      ...row,
      youthFlag: toBool(row.youthFlag),
      missingPhone: toBool(row.missingPhone),
      missingEmail: toBool(row.missingEmail),
      missingAddress: toBool(row.missingAddress),
      callingTitle: cleanCallingTitle(row.callingTitle)
    }));

    const sorted = [...rows].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.fullName, right.fullName, direction);
      }
      if (sortBy === "age") {
        return compareNullable(left.age, right.age, direction);
      }
      const byUnit = compareNullable(left.unitName, right.unitName, direction);
      if (byUnit !== 0) {
        return byUnit;
      }
      return compareNullable(left.fullName, right.fullName, "asc");
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getHouseholdContactList = async (unit?: string, search?: string): Promise<HouseholdContactRow[]> => {
  const unitFilter = unit?.trim() ? `%${unit.trim()}%` : null;
  const searchFilter = search?.trim() ? `%${search.trim()}%` : null;

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }
    if (searchFilter) {
      conditions.push(
        `(COALESCE(h.household_name, '') LIKE ? OR COALESCE(m.head_of_house, '') LIKE ? OR ${fullNameExpr} LIKE ?)`
      );
      params.push(searchFilter, searchFilter, searchFilter);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = db.prepare(
      `
      SELECT
        h.id AS householdId,
        COALESCE(NULLIF(h.household_name, ''), MAX(NULLIF(m.head_of_house, '')), 'Household') AS householdName,
        COALESCE(MAX(NULLIF(m.unit_name, '')), 'Unknown') AS unitName,
        MAX(NULLIF(m.head_of_house, '')) AS headOfHouse,
        COUNT(DISTINCT m.id) AS memberCount,
        (SELECT GROUP_CONCAT(n, ' | ') FROM (SELECT DISTINCT TRIM(first_name || ' ' || last_name) AS n FROM members WHERE household_id = h.id)) AS memberNames,
        COALESCE((SELECT GROUP_CONCAT(e, ' | ') FROM (SELECT DISTINCT primary_email AS e FROM members WHERE household_id = h.id AND primary_email IS NOT NULL)), '') AS emailList,
        COALESCE((SELECT GROUP_CONCAT(p, ' | ') FROM (SELECT DISTINCT primary_phone AS p FROM members WHERE household_id = h.id AND primary_phone IS NOT NULL)), '') AS phoneList
      FROM households h
      JOIN members m ON m.household_id = h.id
      ${whereClause}
      GROUP BY h.id, h.household_name
      ORDER BY unitName, householdName
      LIMIT 5000
      `
    ).all(...params) as HouseholdContactRow[];

    return rows;
  } finally {
    db.close();
  }
};

export const getHouseholdMembers = async (search: string) => {
  const db = openSqliteSpikeDb();
  try {
    const household = db.prepare(
      `
      SELECT
        h.id AS householdId,
        COALESCE(NULLIF(h.household_name, ''), NULLIF(m.head_of_house, ''), 'Household') AS householdName,
        ${unitNameExpr()} AS unitName,
        m.head_of_house AS headOfHouse
      FROM households h
      JOIN members m ON m.household_id = h.id
      WHERE CAST(h.id AS TEXT) = ?
        OR COALESCE(h.household_name, '') LIKE ?
        OR COALESCE(m.head_of_house, '') LIKE ?
        OR ${fullNameExpr} LIKE ?
      ORDER BY h.id, m.last_name, m.first_name
      LIMIT 1
      `
    ).get(search, `%${search}%`, `%${search}%`, `%${search}%`) as {
      householdId: number;
      householdName: string;
      unitName: string;
      headOfHouse: string | null;
    } | undefined;

    if (!household) {
      return null;
    }

    const members = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        m.age,
        m.gender,
        m.household_position AS householdPosition,
        m.spouse_name AS spouseName,
        m.mission_status AS missionStatus,
        m.mission_country AS missionCountry
      FROM members m
      WHERE m.household_id = ?
      ORDER BY m.last_name, m.first_name
      `
    ).all(household.householdId) as Array<{
      lcrMemberId: string;
      fullName: string;
      age: number | null;
      gender: string | null;
      householdPosition: string | null;
      spouseName: string | null;
      missionStatus: string | null;
      missionCountry: string | null;
    }>;

    const contacts = db.prepare(
      `
      SELECT
        COALESCE((SELECT GROUP_CONCAT(e, ' | ') FROM (SELECT DISTINCT primary_email AS e FROM members WHERE household_id = ? AND primary_email IS NOT NULL)), '') AS emailList,
        COALESCE((SELECT GROUP_CONCAT(p, ' | ') FROM (SELECT DISTINCT primary_phone AS p FROM members WHERE household_id = ? AND primary_phone IS NOT NULL)), '') AS phoneList
      `
    ).get(household.householdId, household.householdId) as { emailList: string; phoneList: string } | undefined;

    return {
      ...household,
      emailList: contacts?.emailList ?? "",
      phoneList: contacts?.phoneList ?? "",
      members
    };
  } finally {
    db.close();
  }
};

export const getMarriedCouplesContactList = async (unit?: string): Promise<MarriedCoupleContactRow[]> => {
  const unitFilter = unit?.trim() ? `%${unit.trim()}%` : null;

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = db.prepare(
      `
      SELECT
        h.id AS householdId,
        COALESCE(NULLIF(h.household_name, ''), MAX(NULLIF(m.head_of_house, '')), 'Household') AS householdName,
        COALESCE(MAX(NULLIF(m.unit_name, '')), 'Unknown') AS unitName,
        GROUP_CONCAT(
          CASE WHEN COALESCE(m.is_married, 0) = 1 OR COALESCE(m.spouse_name, '') <> '' THEN ${fullNameExpr} END,
          ' & '
        ) AS coupleNames,
        COALESCE((SELECT GROUP_CONCAT(e, ' | ') FROM (SELECT DISTINCT primary_email AS e FROM members WHERE household_id = h.id AND primary_email IS NOT NULL)), '') AS emailList,
        COALESCE((SELECT GROUP_CONCAT(p, ' | ') FROM (SELECT DISTINCT primary_phone AS p FROM members WHERE household_id = h.id AND primary_phone IS NOT NULL)), '') AS phoneList
      FROM households h
      JOIN members m ON m.household_id = h.id
      ${whereClause}
      GROUP BY h.id, h.household_name
      HAVING COUNT(CASE WHEN COALESCE(m.is_married, 0) = 1 OR COALESCE(m.spouse_name, '') <> '' THEN 1 END) >= 2
      ORDER BY unitName, householdName
      LIMIT 5000
      `
    ).all(...params) as MarriedCoupleContactRow[];

    return rows.filter((row) => Boolean(row.coupleNames));
  } finally {
    db.close();
  }
};

export const getRecentBaptismContactList = async (monthsBack = 12, unit?: string): Promise<RecentBaptismRow[]> => {
  const safeMonthsBack = Math.max(1, Math.min(monthsBack, 36));
  const unitFilter = unit?.trim() ? `%${unit.trim()}%` : null;
  const cutoffDate = monthsAgoThreshold(safeMonthsBack);

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL`
    ];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }

    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.baptism_date AS baptismDate,
        m.confirmation_date AS confirmationDate,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as RecentBaptismRow[];

    return rows
      .filter((row) => isOnOrAfter(row.baptismDate, cutoffDate))
      .sort((left, right) => compareDateStrings(left.baptismDate, right.baptismDate, "desc") || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000);
  } finally {
    db.close();
  }
};

export const getMembersWithoutMinisteringContactList = async (unit?: string): Promise<MinisteringGapRow[]> => {
  const report = await getMinisteringGapReport();
  if (!unit?.trim()) {
    return report.members.filter((row) => row.gapCategory === "No Assigned Ministers");
  }
  const unitFilter = unit.trim().toLowerCase();
  return report.members.filter(
    (row) => row.gapCategory === "No Assigned Ministers" && row.unitName.toLowerCase().includes(unitFilter)
  );
};

export const getCovenantPathProgressionReport = async (
  options: { unit?: string; minScore?: number; limit?: number } = {}
): Promise<CovenantPathProgressionRow[]> => {
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));
  const minScore = Math.max(0, Math.min(options.minScore ?? 1, 6));

  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (unitFilter) {
      conditions.push(`${unitNameExpr()} LIKE ?`);
      params.push(unitFilter);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rawRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.baptism_date AS baptismDate,
        m.confirmation_date AS confirmationDate,
        m.endowment_date AS endowmentDate,
        m.ordination_date AS ordinationDate,
        m.temple_recommend_status AS templeRecommendStatus,
        m.temple_recommend_expiration_date AS templeRecommendExpirationDate,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.potential_seminary_student AS potentialSeminaryStudent,
        m.potential_institute_student AS potentialInstituteStudent,
        m.is_married AS isMarried,
        m.sealing_to_parents AS sealingToParents,
        m.sealing_to_spouse AS sealingToSpouse,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling,
        (COALESCE(m.has_ministering_brothers, 0) OR COALESCE(m.has_ministering_sisters, 0)) AS ministeringAssigned
      FROM members m
      ${whereClause}
      `
    ).all(...params) as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      age: number | null;
      baptismDate: string | null;
      confirmationDate: string | null;
      endowmentDate: string | null;
      ordinationDate: string | null;
      templeRecommendStatus: string | null;
      templeRecommendExpirationDate: string | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
      potentialSeminaryStudent: number | null;
      potentialInstituteStudent: number | null;
      isMarried: number | null;
      sealingToParents: string | null;
      sealingToSpouse: string | null;
      currentCalling: string | null;
      ministeringAssigned: number;
    }>;

    const isRecent = (value: string | null | undefined, days: number) => {
      const date = safeDate(value);
      if (!date) {
        return false;
      }
      const diffDays = (startOfToday().getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= days;
    };

    const rows = rawRows
      .map<CovenantPathProgressionRow>((row) => {
        const ministeringAssigned = toBool(row.ministeringAssigned);
        const milestones: Array<{ label: string; date: string }> = [];
        if (row.baptismDate) {
          milestones.push({ label: "Baptized", date: row.baptismDate });
        }
        if (row.confirmationDate) {
          milestones.push({ label: "Confirmed", date: row.confirmationDate });
        }
        if (row.endowmentDate) {
          milestones.push({ label: "Endowed", date: row.endowmentDate });
        }
        if (row.ordinationDate) {
          milestones.push({ label: "Ordained", date: row.ordinationDate });
        }

        milestones.sort((left, right) => compareDateStrings(left.date, right.date, "desc"));
        const ordinanceBucket = isRecent(row.baptismDate, 730) || isRecent(row.confirmationDate, 730) || isRecent(row.endowmentDate, 730) || isRecent(row.ordinationDate, 730)
          ? "Recent Milestone"
          : row.endowmentDate
            ? "Endowed"
            : row.baptismDate && row.confirmationDate
              ? "Baptized + Confirmed"
              : row.baptismDate
                ? "Baptized"
                : "No Recorded Ordinance";

        let templeBucket = "No Active Recommend";
        if (isActiveTempleRecommendStatus(row.templeRecommendStatus)) {
          const expiringSoon =
            row.templeRecommendExpirationDate && isRecent(row.templeRecommendExpirationDate, 90);
          templeBucket = expiringSoon ? "Active Recommend (Expiring Soon)" : "Active Recommend";
        }

        const hasCalling = Boolean(cleanCallingTitle(row.currentCalling));
        const serviceBucket = hasCalling && ministeringAssigned
          ? "Calling + Ministering"
          : hasCalling
            ? "Calling Only"
            : ministeringAssigned
              ? "Ministering Only"
              : "No Current Engagement";

        let youthBucket: string | null = null;
        if ((row.age ?? 0) >= 12 && (row.age ?? 0) <= 18) {
          youthBucket = toBool(row.isAttendingSeminary)
            ? "Seminary Attending"
            : toBool(row.potentialSeminaryStudent)
              ? "Seminary Opportunity"
              : "Seminary Not Attending";
        } else if ((row.age ?? 0) > 18 && (row.age ?? 0) <= 25) {
          youthBucket = toBool(row.isAttendingInstitute)
            ? "Institute Attending"
            : toBool(row.potentialInstituteStudent)
              ? "Institute Opportunity"
              : "Institute Not Attending";
        }

        const sealedToParents = Boolean(row.sealingToParents);
        const sealedToSpouse = Boolean(row.sealingToSpouse);
        let familyBucket: string | null = null;
        if (toBool(row.isMarried)) {
          familyBucket = sealedToSpouse ? "Sealed to Spouse" : "Not Sealed to Spouse";
        } else if ((row.age ?? 0) <= 25) {
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
          lcrMemberId: row.lcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName,
          age: row.age,
          baptismDate: row.baptismDate,
          confirmationDate: row.confirmationDate,
          endowmentDate: row.endowmentDate,
          ordinationDate: row.ordinationDate,
          templeRecommendStatus: row.templeRecommendStatus,
          currentCalling: cleanCallingTitle(row.currentCalling) || null,
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
      .filter((row) => row.attentionScore >= minScore)
      .sort(
        (left, right) =>
          compareNullable(right.attentionScore, left.attentionScore, "asc") ||
          compareDateStrings(left.recentMilestoneDate, right.recentMilestoneDate, "desc")
      )
      .slice(0, safeLimit);

    return rows;
  } finally {
    db.close();
  }
};

export const priesthoodAdvancementCandidates = async (nextOffice = "Elder") => {
  const db = openSqliteSpikeDb();
  try {
    const officeLower = nextOffice.toLowerCase();
    const conditions: string[] = [
      `LOWER(COALESCE(m.gender, '')) IN ('m', 'male')`,
      `LOWER(COALESCE(m.priesthood_office, '')) NOT LIKE ?`
    ];
    const params: unknown[] = [`%${officeLower}%`];

    if (officeLower === "teacher") {
      conditions.push(`COALESCE(m.age, 0) >= 14`);
    } else if (officeLower === "priest") {
      conditions.push(`COALESCE(m.age, 0) >= 16`);
    } else if (officeLower === "elder") {
      conditions.push(`COALESCE(m.age, 0) >= 18`);
    } else if (officeLower === "high priest") {
      conditions.push(`COALESCE(m.age, 0) >= 30`);
    }

    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        m.age,
        m.priesthood_office AS currentOffice,
        ? AS recommendedNextOffice
      FROM members m
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${nullsLast('m.age')}, m.age DESC, m.last_name, m.first_name
      `
    ).all(nextOffice, ...params) as PriesthoodCandidateRow[];

    return rows;
  } finally {
    db.close();
  }
};

export const endowmentCandidates = async (minAge = 18) => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        m.age,
        m.mission_status AS missionStatus,
        m.temple_endowed AS templeEndowed
      FROM members m
      WHERE m.age >= ?
        AND COALESCE(m.temple_endowed, 0) = 0
      ORDER BY ${nullsLast('m.age')}, m.age DESC, m.last_name, m.first_name
      `
    ).all(minAge) as EndowmentCandidateRow[];

    return rows.map((row) => ({
      ...row,
      templeEndowed: toBoolOrNull(row.templeEndowed)
    }));
  } finally {
    db.close();
  }
};

export const getVacancies = async () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        c.organization_name AS organizationName,
        c.title AS callingTitle,
        CAST(COUNT(*) AS TEXT) AS vacancyCount
      FROM callings c
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.lcr_member_id IS NULL
      GROUP BY c.organization_name, c.title
      ORDER BY COUNT(*) DESC, c.title
      `
    ).all() as Array<{ organizationName: string | null; callingTitle: string; vacancyCount: string }>;

    return rows.map((row) => ({
      ...row,
      vacancyCount: Number.parseInt(row.vacancyCount, 10)
    }));
  } finally {
    db.close();
  }
};

export const getLeadershipTurnover = async (unit?: string | null) => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    // Generate last 12 months in JS
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const sustainedRows = db.prepare(
      `
      SELECT
        COALESCE(c.sustained_on, c.set_apart_on) AS sustainedDate
      FROM callings c
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%')
        AND COALESCE(c.sustained_on, c.set_apart_on) IS NOT NULL
        AND (? IS NULL OR c.unit_name = ?)
      `
    ).all(unitScope, unitScope) as Array<{ sustainedDate: string | null }>;

    const releasedRows = db.prepare(
      `
      SELECT
        c.released_on AS releasedDate
      FROM callings c
      WHERE c.released_on IS NOT NULL
        AND c.lcr_calling_id NOT LIKE 'generated-calling-%'
        AND (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%')
        AND (? IS NULL OR c.unit_name = ?)
      `
    ).all(unitScope, unitScope) as Array<{ releasedDate: string | null }>;

    const sustainedMap = new Map(months.map((month) => [month, 0]));
    const releasedMap = new Map(months.map((month) => [month, 0]));
    for (const row of sustainedRows) {
      const month = monthKeyFromValue(row.sustainedDate);
      if (month && sustainedMap.has(month)) {
        sustainedMap.set(month, (sustainedMap.get(month) ?? 0) + 1);
      }
    }
    for (const row of releasedRows) {
      const month = monthKeyFromValue(row.releasedDate);
      if (month && releasedMap.has(month)) {
        releasedMap.set(month, (releasedMap.get(month) ?? 0) + 1);
      }
    }

    return months.map((month) => ({
      month,
      sustained: sustainedMap.get(month) ?? 0,
      released: releasedMap.get(month) ?? 0
    }));
  } finally {
    db.close();
  }
};

export const getYouthProgression = async (unit?: string | null) => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const members = db.prepare(
      `
      SELECT
        m.birthdate,
        m.age
      FROM members m
      ${whereClause}
      `
    ).all(...params) as Array<{ birthdate: string | null; age: number | null }>;

    const bands = new Map<string, { ageBand: string; ageBandOrder: number; count: number }>();
    const addBand = (ageBand: string, ageBandOrder: number) => {
      const existing = bands.get(ageBand) ?? { ageBand, ageBandOrder, count: 0 };
      existing.count++;
      bands.set(ageBand, existing);
    };

    for (const member of members) {
      const actualAge = actualAgeFromBirthdate(member.birthdate, member.age);
      const youthProgramAge = youthProgramAgeFromBirthdate(member.birthdate, member.age);
      if (youthProgramAge === 12) addBand("Turns 12 / 12", 1);
      else if (youthProgramAge !== null && youthProgramAge >= 13 && youthProgramAge <= 15) addBand("13-15", 2);
      else if (youthProgramAge !== null && youthProgramAge >= 16 && youthProgramAge <= 17) addBand("16-17", 3);
      else if (youthProgramAge === 18) addBand("18 Transition", 4);
      else if (actualAge !== null && actualAge >= 19 && actualAge <= 25) addBand("YSA 19-25", 5);
      else if (actualAge !== null && actualAge >= 26 && actualAge <= 35) addBand("YSA 26-35", 6);
    }

    return Array.from(bands.values())
      .sort((left, right) => left.ageBandOrder - right.ageBandOrder)
      .map((row) => ({
        ageBand: row.ageBand,
        count: row.count
      }));
  } finally {
    db.close();
  }
};

export const getYouthTransitionMilestones = async (unit?: string | null): Promise<YouthTransitionMilestoneRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const unitCondition = unitScope ? `AND ${unitNameExpr()} = ?` : "";
    const params: unknown[] = unitScope ? [unitScope] : [];

    // Fetch all members for milestone computation
    const members = db.prepare(
      `
      SELECT
        m.birthdate,
        m.age,
        LOWER(COALESCE(m.gender, '')) AS genderNorm,
        LOWER(COALESCE(m.priesthood_office, '')) AS officeNorm,
        m.baptism_date AS baptismDate,
        m.confirmation_date AS confirmationDate,
        m.temple_recommend_status AS templeRecommendStatus,
        m.temple_recommend_type AS templeRecommendType,
        COALESCE(m.is_returned_missionary, 0) AS isReturnedMissionary,
        NULLIF(TRIM(COALESCE(m.mission_status, '')), '') AS missionStatus,
        NULLIF(TRIM(COALESCE(m.mission_country, '')), '') AS missionCountry,
        COALESCE(m.is_attending_seminary, 0) AS isAttendingSeminary,
        COALESCE(m.is_attending_institute, 0) AS isAttendingInstitute,
        COALESCE(m.temple_endowed, 0) AS templeEndowed
      FROM members m
      WHERE 1=1 ${unitCondition}
      `
    ).all(...params) as Array<{
      birthdate: string | null;
      age: number | null;
      genderNorm: string;
      officeNorm: string;
      baptismDate: string | null;
      confirmationDate: string | null;
      templeRecommendStatus: string | null;
      templeRecommendType: string | null;
      isReturnedMissionary: number;
      missionStatus: string | null;
      missionCountry: string | null;
      isAttendingSeminary: number;
      isAttendingInstitute: number;
      templeEndowed: number;
    }>;

    const isMale = (g: string) => g === "m" || g === "male";
    const isFemale = (g: string) => g === "f" || g === "female";
    const officeAtLeast = (office: string, target: string) => {
      const hierarchy = ["deacon", "teacher", "priest", "elder", "high priest"];
      const officeIndex = hierarchy.indexOf(office);
      const targetIndex = hierarchy.indexOf(target);
      return officeIndex >= 0 && officeIndex >= targetIndex;
    };
    const hasActiveRecommend = (status: string | null, type: string | null) =>
      (status ?? "").toLowerCase().startsWith("active") || (type ?? "").toLowerCase().includes("limited");

    const milestones: Array<{ label: string; sortOrder: number; eligibleCount: number; completedCount: number }> = [
      { label: "8-11 Baptized & Confirmed", sortOrder: 1, eligibleCount: 0, completedCount: 0 },
      { label: "12-17 Current Recommend", sortOrder: 2, eligibleCount: 0, completedCount: 0 },
      { label: "12-13 Deacon (Men)", sortOrder: 3, eligibleCount: 0, completedCount: 0 },
      { label: "14-15 Teacher (Men)", sortOrder: 4, eligibleCount: 0, completedCount: 0 },
      { label: "16-17 Priest (Men)", sortOrder: 5, eligibleCount: 0, completedCount: 0 },
      { label: "18-25 Elder (Men)", sortOrder: 6, eligibleCount: 0, completedCount: 0 },
      { label: "17-25 Mission Ready (Men)", sortOrder: 7, eligibleCount: 0, completedCount: 0 },
      { label: "17-25 Mission Ready (Women)", sortOrder: 8, eligibleCount: 0, completedCount: 0 }
    ];

    for (const m of members) {
      const aa = actualAgeFromBirthdate(m.birthdate, m.age) ?? 0;
      const ypa = youthProgramAgeFromBirthdate(m.birthdate, m.age) ?? 0;

      // 8-11 Baptized & Confirmed
      if (aa >= 8 && aa <= 11) {
        milestones[0].eligibleCount++;
        if (m.baptismDate && m.confirmationDate) milestones[0].completedCount++;
      }
      // 12-17 Current Recommend
      if (ypa >= 12 && ypa <= 17) {
        milestones[1].eligibleCount++;
        if (hasActiveRecommend(m.templeRecommendStatus, m.templeRecommendType)) milestones[1].completedCount++;
      }
      // 12-13 Deacon (Men)
      if (ypa >= 12 && ypa <= 13 && isMale(m.genderNorm)) {
        milestones[2].eligibleCount++;
        if (officeAtLeast(m.officeNorm, "deacon")) milestones[2].completedCount++;
      }
      // 14-15 Teacher (Men)
      if (ypa >= 14 && ypa <= 15 && isMale(m.genderNorm)) {
        milestones[3].eligibleCount++;
        if (officeAtLeast(m.officeNorm, "teacher")) milestones[3].completedCount++;
      }
      // 16-17 Priest (Men)
      if (ypa >= 16 && ypa <= 17 && isMale(m.genderNorm)) {
        milestones[4].eligibleCount++;
        if (officeAtLeast(m.officeNorm, "priest")) milestones[4].completedCount++;
      }
      // 18-25 Elder (Men)
      if (aa >= 18 && aa <= 25 && isMale(m.genderNorm)) {
        milestones[5].eligibleCount++;
        if (officeAtLeast(m.officeNorm, "elder")) milestones[5].completedCount++;
      }
      // 17-25 Mission Ready (Men)
      if (aa >= 17 && aa <= 25 && isMale(m.genderNorm) && !m.isReturnedMissionary && !m.missionStatus && !m.missionCountry) {
        milestones[6].eligibleCount++;
        if (hasActiveRecommend(m.templeRecommendStatus, null) && (m.isAttendingSeminary || m.isAttendingInstitute) && m.templeEndowed) {
          milestones[6].completedCount++;
        }
      }
      // 17-25 Mission Ready (Women)
      if (aa >= 17 && aa <= 25 && isFemale(m.genderNorm) && !m.isReturnedMissionary && !m.missionStatus && !m.missionCountry) {
        milestones[7].eligibleCount++;
        if (hasActiveRecommend(m.templeRecommendStatus, null) && (m.isAttendingSeminary || m.isAttendingInstitute) && m.templeEndowed) {
          milestones[7].completedCount++;
        }
      }
    }

    return milestones.map((m) => ({
      label: m.label,
      eligibleCount: m.eligibleCount,
      completedCount: m.completedCount,
      completionPct: m.eligibleCount > 0 ? Math.round((m.completedCount / m.eligibleCount) * 100) : 0
    }));
  } finally {
    db.close();
  }
};

export const getYouthOrganizationTransitions = async (unit?: string | null): Promise<YouthOrganizationTransitionRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const unitCondition = unitScope ? `AND ${unitNameExpr()} = ?` : "";
    const params: unknown[] = unitScope ? [unitScope] : [];

    const members = db.prepare(
      `
      SELECT
        m.birthdate,
        m.age,
        LOWER(COALESCE(m.gender, '')) AS genderNorm,
        ${isUnmarriedSql("m")} AS isUnmarried
      FROM members m
      WHERE 1=1 ${unitCondition}
      `
    ).all(...params) as Array<{ birthdate: string | null; age: number | null; genderNorm: string; isUnmarried: number }>;

    const isMale = (g: string) => g === "m" || g === "male";
    const isFemale = (g: string) => g === "f" || g === "female";

    const cohorts: Array<{ label: string; sortOrder: number; count: number }> = [
      { label: "Young Women 12-13", sortOrder: 1, count: 0 },
      { label: "Young Women 14-15", sortOrder: 2, count: 0 },
      { label: "Young Women 16-17", sortOrder: 3, count: 0 },
      { label: "Young Men 12-13", sortOrder: 4, count: 0 },
      { label: "Young Men 14-15", sortOrder: 5, count: 0 },
      { label: "Young Men 16-17", sortOrder: 6, count: 0 },
      { label: "Age 18 Transition", sortOrder: 7, count: 0 },
      { label: "YSA 18-25 (Unmarried)", sortOrder: 8, count: 0 },
      { label: "YSA Women 18-25 (Unmarried)", sortOrder: 9, count: 0 },
      { label: "YSA Men 18-25 (Unmarried)", sortOrder: 10, count: 0 },
      { label: "YSA 26-35 (Unmarried)", sortOrder: 11, count: 0 },
      { label: "YSA Women 26-35 (Unmarried)", sortOrder: 12, count: 0 },
      { label: "YSA Men 26-35 (Unmarried)", sortOrder: 13, count: 0 },
      { label: "Single Adults 36-45 (Unmarried)", sortOrder: 14, count: 0 },
      { label: "Single Adult Women 36-45 (Unmarried)", sortOrder: 15, count: 0 },
      { label: "Single Adult Men 36-45 (Unmarried)", sortOrder: 16, count: 0 },
      { label: "Single Adults 46+ (Unmarried)", sortOrder: 17, count: 0 },
      { label: "Single Adult Women 46+ (Unmarried)", sortOrder: 18, count: 0 },
      { label: "Single Adult Men 46+ (Unmarried)", sortOrder: 19, count: 0 }
    ];

    for (const m of members) {
      const aa = actualAgeFromBirthdate(m.birthdate, m.age) ?? 0;
      const ypa = youthProgramAgeFromBirthdate(m.birthdate, m.age) ?? 0;
      const unmarried = toBool(m.isUnmarried);

      if (ypa >= 12 && ypa <= 13 && isFemale(m.genderNorm)) cohorts[0].count++;
      if (ypa >= 14 && ypa <= 15 && isFemale(m.genderNorm)) cohorts[1].count++;
      if (ypa >= 16 && ypa <= 17 && isFemale(m.genderNorm)) cohorts[2].count++;
      if (ypa >= 12 && ypa <= 13 && isMale(m.genderNorm)) cohorts[3].count++;
      if (ypa >= 14 && ypa <= 15 && isMale(m.genderNorm)) cohorts[4].count++;
      if (ypa >= 16 && ypa <= 17 && isMale(m.genderNorm)) cohorts[5].count++;
      if (aa === 18) cohorts[6].count++;
      if (aa >= 18 && aa <= 25 && unmarried) cohorts[7].count++;
      if (aa >= 18 && aa <= 25 && unmarried && isFemale(m.genderNorm)) cohorts[8].count++;
      if (aa >= 18 && aa <= 25 && unmarried && isMale(m.genderNorm)) cohorts[9].count++;
      if (aa >= 26 && aa <= 35 && unmarried) cohorts[10].count++;
      if (aa >= 26 && aa <= 35 && unmarried && isFemale(m.genderNorm)) cohorts[11].count++;
      if (aa >= 26 && aa <= 35 && unmarried && isMale(m.genderNorm)) cohorts[12].count++;
      if (aa >= 36 && aa <= 45 && unmarried) cohorts[13].count++;
      if (aa >= 36 && aa <= 45 && unmarried && isFemale(m.genderNorm)) cohorts[14].count++;
      if (aa >= 36 && aa <= 45 && unmarried && isMale(m.genderNorm)) cohorts[15].count++;
      if (aa >= 46 && unmarried) cohorts[16].count++;
      if (aa >= 46 && unmarried && isFemale(m.genderNorm)) cohorts[17].count++;
      if (aa >= 46 && unmarried && isMale(m.genderNorm)) cohorts[18].count++;
    }

    return cohorts.map((c) => ({ label: c.label, count: c.count }));
  } finally {
    db.close();
  }
};

export const getRecentConvertGrowth = async () => {
  const db = openSqliteSpikeDb();
  try {
    // Generate last 12 months
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const rows = db.prepare(
      `
      SELECT
        baptism_date AS baptismDate,
        move_in_date AS moveInDate
      FROM members
      WHERE is_convert = 1
        AND COALESCE(baptism_date, move_in_date) IS NOT NULL
      `
    ).all() as Array<{ baptismDate: string | null; moveInDate: string | null }>;

    const convertMap = new Map(months.map((month) => [month, 0]));
    for (const row of rows) {
      const month = monthKeyFromValue(row.baptismDate ?? row.moveInDate);
      if (month && convertMap.has(month)) {
        convertMap.set(month, (convertMap.get(month) ?? 0) + 1);
      }
    }

    return months.map((month) => ({
      month,
      converts: convertMap.get(month) ?? 0
    }));
  } finally {
    db.close();
  }
};

export const generateReport = async (reportType: string) => {
  const [vacancies, turnover, missionCandidates, endowmentRows, baptisms, recommendRisk, ministeringGaps] = await Promise.all([
    getVacancies(),
    getLeadershipTurnover(),
    missionEligibleMembers(),
    endowmentCandidates(),
    getRecentBaptismReport(),
    getRecommendExpirationRiskReport(),
    getMinisteringGapReport()
  ]);

  const summary = {
    stake: env.STAKE_NAME,
    generatedAt: new Date().toISOString(),
    reportType,
    metrics: {
      openCallings: vacancies.reduce((acc, row) => acc + row.vacancyCount, 0),
      missionEligibleCount: missionCandidates.length,
      endowmentCandidateCount: endowmentRows.length,
      turnoverLast30Days: turnover.slice(-1)[0] ?? { month: null, sustained: 0, released: 0 },
      baptismsThisYear: baptisms.summary.find((row) => row.label === "This Year")?.value ?? 0,
      expiredOrExpiringRecommends: recommendRisk.members.length,
      ministeringGaps: ministeringGaps.members.length
    },
    details: {
      vacancies,
      missionCandidates: missionCandidates.slice(0, 50),
      endowmentCandidates: endowmentRows.slice(0, 50),
      recentBaptisms: baptisms.members.slice(0, 50),
      recommendRisk: recommendRisk.members.slice(0, 50),
      ministeringGaps: ministeringGaps.members.slice(0, 50)
    }
  };

  return summary;
};

export const getMemberList = async () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.gender,
        m.primary_email AS email,
        m.primary_phone AS phoneNumber
      FROM members m
      ORDER BY m.last_name, m.first_name
      LIMIT 1000
      `
    ).all() as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string | null;
      age: number | null;
      gender: string | null;
      email: string | null;
      phoneNumber: string | null;
    }>;

    return rows;
  } finally {
    db.close();
  }
};

const memberAttributeColumnMap: Record<string, string> = {
  preferred_name: "m.preferred_name",
  unit: "m.unit_name",
  unit_abbreviation: "m.unit_abbreviation",
  age: "CAST(m.age AS TEXT)",
  gender: "m.gender",
  birth_date: "m.birthdate",
  birthdate: "m.birthdate",
  birth_country: "m.birth_country",
  birthplace: "m.birthplace",
  address_state_or_province: "m.state_or_province",
  address_country: "m.country",
  endowment_status: "m.endowment_status",
  endowment_date: "m.endowment_date",
  is_endowed: "CAST(m.temple_endowed AS TEXT)",
  is_returned_missionary: "CAST(m.is_returned_missionary AS TEXT)",
  is_convert: "CAST(m.is_convert AS TEXT)",
  is_accountable: "CAST(m.is_accountable AS TEXT)",
  is_born_in_covenant: "CAST(m.is_born_in_covenant AS TEXT)",
  is_divorced: "CAST(m.is_divorced AS TEXT)",
  is_married: "CAST(m.is_married AS TEXT)",
  is_single: "CAST(m.is_single AS TEXT)",
  baptism_date: "m.baptism_date",
  confirmation_date: "m.confirmation_date",
  confirmed_date: "m.confirmation_date",
  temple_recommend_status: "m.temple_recommend_status",
  temple_recommend_expiration_date: "m.temple_recommend_expiration_date",
  temple_recommend_type: "m.temple_recommend_type",
  mission_language: "m.mission_language",
  mission_country: "m.mission_country",
  priesthood: "m.priesthood_type",
  ordination_date: "m.ordination_date",
  move_in_date: "m.move_in_date",
  institute_status: "m.institute_status",
  seminary_status: "m.seminary_status",
  is_attending_seminary: "CAST(m.is_attending_seminary AS TEXT)",
  is_attending_institute: "CAST(m.is_attending_institute AS TEXT)",
  potential_institute_student: "CAST(m.potential_institute_student AS TEXT)",
  potential_seminary_student: "CAST(m.potential_seminary_student AS TEXT)",
  has_ministering_sisters: "CAST(m.has_ministering_sisters AS TEXT)",
  has_ministering_brothers: "CAST(m.has_ministering_brothers AS TEXT)",
  ministering_brothers: "m.ministering_brothers",
  ministering_sisters: "m.ministering_sisters",
  marriage_date: "m.marriage_date",
  marriage_status: "m.marriage_status",
  sealing_to_parents: "m.sealing_to_parents",
  sealing_to_spouse: "m.sealing_to_spouse",
  spouse_name: "m.spouse_name",
  head_of_house: "m.head_of_house",
  household_position: "m.household_position"
};

const booleanLikeAttributes = new Set<string>([
  "is_endowed",
  "is_widowed",
  "is_returned_missionary",
  "is_convert",
  "is_accountable",
  "is_born_in_covenant",
  "is_divorced",
  "is_married",
  "has_children",
  "is_sealed_to_parents",
  "is_single",
  "is_sealed_to_spouse",
  "is_sealed_to_current_spouse",
  "is_sealed_to_prior_spouse",
  "is_attending_seminary",
  "is_attending_institute",
  "potential_institute_student",
  "potential_seminary_student",
  "has_ministering_sisters",
  "has_ministering_brothers"
]);

const normalizeQueryValue = (attribute: string, value: string) => {
  if (!booleanLikeAttributes.has(attribute)) {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (["yes", "y", "1", "true"].includes(normalized)) {
    return "1";
  }
  if (["no", "n", "0", "false"].includes(normalized)) {
    return "0";
  }

  return value;
};

export const queryMembersByAttribute = async (attribute: string, value: string, limit = 100) => {
  const normalizedAttribute = attribute.trim().toLowerCase().replace(/\s+/g, "_");
  const normalizedValue = normalizeQueryValue(normalizedAttribute, value);
  const column = memberAttributeColumnMap[normalizedAttribute];
  const safeLimit = Math.max(1, Math.min(limit, 500));

  const db = openSqliteSpikeDb();
  try {
    if (column) {
      const rows = db.prepare(
        `
        SELECT
          m.lcr_member_id AS lcrMemberId,
          ${fullNameExpr} AS fullName,
          m.age,
          m.gender,
          ${column} AS value
        FROM members m
        WHERE ${column} LIKE ?
        ORDER BY m.last_name, m.first_name
        LIMIT ${safeLimit}
        `
      ).all(`%${normalizedValue}%`) as AttributeQueryRow[];
      return rows;
    }

    // Fallback: no profile_data in SQLite, return empty
    return [] as AttributeQueryRow[];
  } finally {
    db.close();
  }
};

export const getCallingsList = async () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        c.title AS callingTitle,
        c.organization_name AS organizationName,
        m.lcr_member_id AS lcrMemberId,
        CASE WHEN m.id IS NULL THEN NULL ELSE ${fullNameExpr} END AS fullName,
        ${unitNameExpr()} AS unitName,
        (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%'
          OR COALESCE(c.organization_name, '') LIKE '%Stake Presidency%' OR COALESCE(c.organization_name, '') LIKE '%Bishopric%' OR COALESCE(c.organization_name, '') LIKE '%High Council%') AS isLeadership,
        c.sustained_on AS sustainedOn,
        c.is_current AS isCurrent
      FROM callings c
      LEFT JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
      ORDER BY unitName, isLeadership DESC, c.title
      LIMIT 5000
      `
    ).all() as Array<{
      callingTitle: string;
      organizationName: string | null;
      lcrMemberId: string | null;
      fullName: string | null;
      unitName: string;
      isLeadership: number;
      sustainedOn: string | null;
      isCurrent: number;
    }>;

    const byKey = new Map<
      string,
      {
        callingTitle: string;
        organizationName: string | null;
        lcrMemberId: string | null;
        fullName: string | null;
        unitName: string;
        isLeadership: boolean;
        sustainedOn: string | null;
        isCurrent: boolean;
        rawTitle: string;
      }
    >();

    const noisePattern = /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\/\s*(yes|no))/i;
    const score = (row: { rawTitle: string; sustainedOn: string | null }) => {
      let value = 0;
      if (!noisePattern.test(row.rawTitle)) {
        value += 2;
      }
      if (row.sustainedOn) {
        value += 1;
      }
      return value;
    };

    for (const row of rows) {
      const cleanedTitle = cleanCallingTitle(row.callingTitle);
      const key = `${row.lcrMemberId ?? "vacant"}:${row.unitName}:${cleanedTitle.toLowerCase()}`;
      const candidate = {
        callingTitle: cleanedTitle,
        organizationName: row.organizationName,
        lcrMemberId: row.lcrMemberId,
        fullName: row.fullName,
        unitName: row.unitName,
        isLeadership: toBool(row.isLeadership),
        sustainedOn: row.sustainedOn,
        isCurrent: toBool(row.isCurrent),
        rawTitle: row.callingTitle
      };
      const existing = byKey.get(key);
      if (!existing || score(candidate) > score(existing)) {
        byKey.set(key, candidate);
      }
    }

    const dedupedRows = Array.from(byKey.values()).map(({ rawTitle: _rawTitle, ...row }) => row);

    return dedupedRows.filter((row, index) => {
      const rowTitle = row.callingTitle.toLowerCase();
      return !dedupedRows.some((other, otherIndex) => {
        if (otherIndex === index) {
          return false;
        }
        if (other.lcrMemberId !== row.lcrMemberId || other.unitName !== row.unitName) {
          return false;
        }
        if ((other.sustainedOn ?? "") !== (row.sustainedOn ?? "")) {
          return false;
        }
        const otherTitle = other.callingTitle.toLowerCase();
        return otherTitle.length > rowTitle.length + 4 && otherTitle.includes(rowTitle);
      });
    });
  } finally {
    db.close();
  }
};

export const getReportsOverview = async () => {
  const db = openSqliteSpikeDb();
  try {
    const totalMembers = (db.prepare(`SELECT COUNT(*) AS count FROM members`).get() as { count: number }).count;

    const unitsRepresented = (db.prepare(
      `SELECT COUNT(DISTINCT ${unitNameExpr()}) AS count FROM members m`
    ).get() as { count: number }).count;

    const leadershipCallings = (db.prepare(
      `
      SELECT COUNT(*) AS count
      FROM callings c
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.lcr_member_id IS NOT NULL
        AND (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%')
      `
    ).get() as { count: number }).count;

    const missionEligible = (db.prepare(
      `
      SELECT COUNT(*) AS count
      FROM members m
      WHERE m.age BETWEEN 18 AND 25
        AND COALESCE(m.is_returned_missionary, 0) = 0
        AND NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NULL
        AND NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NULL
      `
    ).get() as { count: number }).count;

    const classRows = db.prepare(
      `
      SELECT
        birthdate,
        age,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute
      FROM members
      `
    ).all() as Array<{
      birthdate: string | null;
      age: number | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
    }>;
    const seminaryAttending = classRows.filter((row) => {
      const youthProgramAge = youthProgramAgeFromBirthdate(row.birthdate, row.age);
      return isSeminaryEligibleAge(youthProgramAge) && toBool(row.isAttendingSeminary);
    }).length;
    const instituteAttending = classRows.filter((row) => {
      const actualAge = actualAgeFromBirthdate(row.birthdate, row.age);
      return isInstituteEligibleAge(actualAge) && toBool(row.isAttendingInstitute);
    }).length;

    const activeTempleRecommend = (db.prepare(
      `SELECT COUNT(*) AS count FROM members WHERE temple_recommend_status LIKE 'active%' OR temple_recommend_status LIKE 'Active%'`
    ).get() as { count: number }).count;

    const recentConvertRows = db.prepare(
      `
      SELECT
        baptism_date AS baptismDate,
        move_in_date AS moveInDate
      FROM members
      WHERE is_convert = 1
      `
    ).all() as Array<{ baptismDate: string | null; moveInDate: string | null }>;
    const recentConvertThreshold = monthsAgoThreshold(12);
    const convertsLast12Months = recentConvertRows.filter(
      (row) => isOnOrAfter(row.baptismDate, recentConvertThreshold) || isOnOrAfter(row.moveInDate, recentConvertThreshold)
    ).length;

    return {
      totalMembers: String(totalMembers),
      unitsRepresented: String(unitsRepresented),
      leadershipCallings: String(leadershipCallings),
      missionEligible: String(missionEligible),
      seminaryAttending: String(seminaryAttending),
      instituteAttending: String(instituteAttending),
      activeTempleRecommend: String(activeTempleRecommend),
      convertsLast12Months: String(convertsLast12Months)
    };
  } finally {
    db.close();
  }
};

export const getUnitHealthReport = async () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        COUNT(DISTINCT m.id) AS memberCount,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id) THEN m.id END) AS currentCallings,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id AND (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%')) THEN m.id END) AS leadershipCallings,
        0 AS seminaryAttending,
        0 AS instituteAttending,
        0 AS convertsLast12Months
      FROM members m
      GROUP BY ${unitNameExpr()}
      ORDER BY ${unitNameExpr()}
      `
    ).all() as Array<{
      unitName: string;
      memberCount: number;
      currentCallings: number;
      leadershipCallings: number;
      seminaryAttending: number;
      instituteAttending: number;
      convertsLast12Months: number;
    }>;

    const classRows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        m.birthdate,
        m.age,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute
      FROM members m
      `
    ).all() as Array<{
      unitName: string;
      birthdate: string | null;
      age: number | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
    }>;
    const classCounts = classRows.reduce((counts, row) => {
      const existing = counts.get(row.unitName) ?? { seminaryAttending: 0, instituteAttending: 0 };
      const youthProgramAge = youthProgramAgeFromBirthdate(row.birthdate, row.age);
      const actualAge = actualAgeFromBirthdate(row.birthdate, row.age);
      if (isSeminaryEligibleAge(youthProgramAge) && toBool(row.isAttendingSeminary)) {
        existing.seminaryAttending++;
      }
      if (isInstituteEligibleAge(actualAge) && toBool(row.isAttendingInstitute)) {
        existing.instituteAttending++;
      }
      counts.set(row.unitName, existing);
      return counts;
    }, new Map<string, { seminaryAttending: number; instituteAttending: number }>());

    const recentConvertRows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        m.baptism_date AS baptismDate,
        m.move_in_date AS moveInDate
      FROM members m
      WHERE m.is_convert = 1
      `
    ).all() as Array<{ unitName: string; baptismDate: string | null; moveInDate: string | null }>;
    const recentConvertThreshold = monthsAgoThreshold(12);
    const recentConvertCounts = recentConvertRows.reduce((counts, row) => {
      if (isOnOrAfter(row.baptismDate, recentConvertThreshold) || isOnOrAfter(row.moveInDate, recentConvertThreshold)) {
        counts.set(row.unitName, (counts.get(row.unitName) ?? 0) + 1);
      }
      return counts;
    }, new Map<string, number>());

    return rows.map((row) => ({
      ...row,
      ...(classCounts.get(row.unitName) ?? { seminaryAttending: 0, instituteAttending: 0 }),
      convertsLast12Months: recentConvertCounts.get(row.unitName) ?? 0
    }));
  } finally {
    db.close();
  }
};

export const getLeadershipTenureReport = async () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${unitNameExpr()} AS unitName,
        ${fullNameExpr} AS fullName,
        c.title AS callingTitle,
        c.sustained_on AS sustainedOn
      FROM callings c
      JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.sustained_on IS NOT NULL
        AND (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%')
      `
    ).all() as Array<{
      lcrMemberId: string;
      unitName: string;
      fullName: string;
      callingTitle: string;
      sustainedOn: string;
    }>;

    return rows
      .map((row) => ({
        ...row,
        callingTitle: cleanCallingTitle(row.callingTitle),
        yearsInCalling: row.sustainedOn && safeDate(row.sustainedOn) ? differenceInYears(new Date(), safeDate(row.sustainedOn)!) : 0
      }))
      .sort((left, right) => compareDateStrings(left.sustainedOn, right.sustainedOn, "asc") || left.fullName.localeCompare(right.fullName))
      .slice(0, 40);
  } finally {
    db.close();
  }
};

export const getMissionYouthPipelineReport = async (unit?: string | null): Promise<MissionYouthPipelineRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `m.age BETWEEN 17 AND 25`,
      `COALESCE(m.is_returned_missionary, 0) = 0`,
      `NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NULL`,
      `NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NULL`
    ];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${unitNameExpr()} AS unitName,
        ${fullNameExpr} AS fullName,
        m.age,
        m.gender,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.mission_language AS missionLanguage,
        m.mission_country AS missionCountry,
        m.mission_status AS missionStatus,
        m.temple_recommend_status AS templeRecommendStatus,
        m.temple_endowed AS templeEndowed,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling
      FROM members m
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${nullsLast('m.age')}, m.age DESC, m.last_name, m.first_name
      LIMIT 600
      `
    ).all(...params) as Array<{
      lcrMemberId: string;
      unitName: string;
      fullName: string;
      age: number | null;
      gender: string | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
      missionLanguage: string | null;
      missionCountry: string | null;
      missionStatus: string | null;
      templeRecommendStatus: string | null;
      templeEndowed: number | null;
      currentCalling: string | null;
    }>;

    return rows.map((row) => {
      const hasActiveRecommend = isActiveTempleRecommendStatus(row.templeRecommendStatus);
      const inReligiousClass = toBool(row.isAttendingSeminary) || toBool(row.isAttendingInstitute);
      const ordinanceReady = toBool(row.templeEndowed);
      const readinessScore = Number(hasActiveRecommend) + Number(inReligiousClass) + Number(ordinanceReady);
      const readinessLevel = readinessScore >= 3 ? "Ready" : readinessScore === 2 ? "Progressing" : "Needs Focus";

      return {
        lcrMemberId: row.lcrMemberId,
        unitName: row.unitName,
        fullName: row.fullName,
        age: row.age,
        gender: row.gender,
        isAttendingSeminary: toBoolOrNull(row.isAttendingSeminary),
        isAttendingInstitute: toBoolOrNull(row.isAttendingInstitute),
        missionLanguage: row.missionLanguage,
        missionCountry: row.missionCountry,
        missionStatus: row.missionStatus,
        templeRecommendStatus: row.templeRecommendStatus,
        templeEndowed: toBoolOrNull(row.templeEndowed),
        currentCalling: cleanCallingTitle(row.currentCalling) || null,
        readinessScore,
        readinessLevel
      };
    });
  } finally {
    db.close();
  }
};

export const getMissionReadinessCompositeReport = async (unit?: string | null): Promise<MissionReadinessCompositeReport> => {
  const members = await getMissionYouthPipelineReport(unit);

  const counts = members.reduce<Record<string, number>>((acc, member) => {
    acc[member.readinessLevel] = (acc[member.readinessLevel] ?? 0) + 1;
    return acc;
  }, {});

  return {
    summary: [
      { label: "Ready", value: counts.Ready ?? 0 },
      { label: "Progressing", value: counts.Progressing ?? 0 },
      { label: "Needs Focus", value: counts["Needs Focus"] ?? 0 }
    ],
    members
  };
};

export const getMissionReadinessCompositeSummary = async (unit?: string | null): Promise<Array<{ label: string; value: number }>> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `m.age BETWEEN 17 AND 25`,
      `COALESCE(m.is_returned_missionary, 0) = 0`,
      `NULLIF(TRIM(COALESCE(m.mission_status, '')), '') IS NULL`,
      `NULLIF(TRIM(COALESCE(m.mission_country, '')), '') IS NULL`
    ];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const rows = db.prepare(
      `
      SELECT
        CASE
          WHEN (
            (CASE WHEN COALESCE(m.temple_recommend_status, '') LIKE 'active%' OR COALESCE(m.temple_recommend_status, '') LIKE 'Active%' THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.is_attending_seminary, 0) = 1 OR COALESCE(m.is_attending_institute, 0) = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.temple_endowed, 0) = 1 THEN 1 ELSE 0 END)
          ) >= 3 THEN 'Ready'
          WHEN (
            (CASE WHEN COALESCE(m.temple_recommend_status, '') LIKE 'active%' OR COALESCE(m.temple_recommend_status, '') LIKE 'Active%' THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.is_attending_seminary, 0) = 1 OR COALESCE(m.is_attending_institute, 0) = 1 THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.temple_endowed, 0) = 1 THEN 1 ELSE 0 END)
          ) = 2 THEN 'Progressing'
          ELSE 'Needs Focus'
        END AS label,
        COUNT(*) AS value
      FROM members m
      WHERE ${conditions.join(" AND ")}
      GROUP BY label
      ORDER BY CASE label WHEN 'Ready' THEN 1 WHEN 'Progressing' THEN 2 ELSE 3 END
      `
    ).all(...params) as Array<{ label: string; value: number }>;

    return rows;
  } finally {
    db.close();
  }
};

export const getMissionGenderBreakdown = (rows: Array<{ gender: string | null; readinessLevel?: "Ready" | "Progressing" | "Needs Focus" }>) => {
  const summary = {
    menEligible: 0,
    womenEligible: 0,
    unknownEligible: 0,
    menReady: 0,
    womenReady: 0,
    unknownReady: 0
  };

  for (const row of rows) {
    const bucket = normalizeGenderBucket(row.gender);
    if (bucket === "Men") {
      summary.menEligible += 1;
      if (row.readinessLevel === "Ready") {
        summary.menReady += 1;
      }
    } else if (bucket === "Women") {
      summary.womenEligible += 1;
      if (row.readinessLevel === "Ready") {
        summary.womenReady += 1;
      }
    } else {
      summary.unknownEligible += 1;
      if (row.readinessLevel === "Ready") {
        summary.unknownReady += 1;
      }
    }
  }

  return summary;
};

const mapSummaryRows = (rows: Array<{ label: string; value: number }>) =>
  rows.map((row) => ({ label: row.label, value: row.value }));

export const getTempleRecommendHealthReport = async (): Promise<TempleRecommendHealthReport> => {
  const db = openSqliteSpikeDb();
  try {
    const statusRows = db.prepare(
      `
      SELECT
        CASE
          WHEN COALESCE(m.temple_recommend_status, '') LIKE 'active%' OR COALESCE(m.temple_recommend_status, '') LIKE 'Active%' THEN 'Active'
          WHEN LOWER(COALESCE(m.temple_recommend_status, '')) LIKE '%expired%' THEN 'Expired'
          WHEN LOWER(COALESCE(m.temple_recommend_status, '')) LIKE '%limited%' THEN 'Limited Use'
          WHEN COALESCE(TRIM(m.temple_recommend_status), '') = '' THEN 'No Status'
          ELSE 'Other'
        END AS label,
        COUNT(*) AS value
      FROM members m
      GROUP BY label
      ORDER BY CASE label WHEN 'Active' THEN 1 WHEN 'Expired' THEN 2 WHEN 'Limited Use' THEN 3 WHEN 'No Status' THEN 4 ELSE 5 END
      `
    ).all() as Array<{ label: string; value: number }>;

    const attentionRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.temple_recommend_status AS templeRecommendStatus
      FROM members m
      WHERE COALESCE(m.temple_recommend_status, '') NOT LIKE 'active%' AND COALESCE(m.temple_recommend_status, '') NOT LIKE 'Active%'
      ORDER BY unitName, m.last_name, m.first_name
      LIMIT 5000
      `
    ).all() as TempleRecommendAttentionRow[];

    // No member_status_history table in SQLite, return empty for recovered
    return {
      statusCounts: statusRows,
      attentionMembers: attentionRows,
      recoveredAfterLongLapse: [],
      trackingSince: null,
      daysTracked: 0
    };
  } finally {
    db.close();
  }
};

export const getTempleRecommendHealthSummary = async (unit?: string | null): Promise<TempleRecommendHealthReport> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const statusRows = db.prepare(
      `
      SELECT
        CASE
          WHEN COALESCE(m.temple_recommend_status, '') LIKE 'active%' OR COALESCE(m.temple_recommend_status, '') LIKE 'Active%' THEN 'Active'
          WHEN LOWER(COALESCE(m.temple_recommend_status, '')) LIKE '%expired%' THEN 'Expired'
          WHEN LOWER(COALESCE(m.temple_recommend_status, '')) LIKE '%limited%' THEN 'Limited Use'
          WHEN COALESCE(TRIM(m.temple_recommend_status), '') = '' THEN 'No Status'
          ELSE 'Other'
        END AS label,
        COUNT(*) AS value
      FROM members m
      ${whereClause}
      GROUP BY label
      ORDER BY CASE label WHEN 'Active' THEN 1 WHEN 'Expired' THEN 2 WHEN 'Limited Use' THEN 3 WHEN 'No Status' THEN 4 ELSE 5 END
      `
    ).all(...params) as Array<{ label: string; value: number }>;

    return {
      statusCounts: mapSummaryRows(statusRows),
      attentionMembers: [],
      recoveredAfterLongLapse: [],
      trackingSince: null,
      daysTracked: 0
    };
  } finally {
    db.close();
  }
};

export const getRecentBaptismSummary = async (monthsBack = 12, unit?: string | null): Promise<RecentBaptismReport> => {
  const safeMonthsBack = Math.max(1, Math.min(monthsBack, 36));
  const unitScope = normalizeUnitScope(unit);
  const cutoffDate = monthsAgoThreshold(safeMonthsBack);
  const last30DaysThreshold = daysAgoThreshold(30);
  const last90DaysThreshold = daysAgoThreshold(90);
  const thisYear = startOfToday().getFullYear();
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL`
    ];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const rows = db.prepare(
      `
      SELECT m.baptism_date AS baptismDate
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as Array<{ baptismDate: string | null }>;

    const recentDates = rows
      .map((row) => safeDate(row.baptismDate))
      .filter((date): date is Date => Boolean(date && date >= cutoffDate));

    return {
      summary: [
        { label: "Last 30 Days", value: recentDates.filter((date) => date >= last30DaysThreshold).length },
        { label: "Last 90 Days", value: recentDates.filter((date) => date >= last90DaysThreshold).length },
        { label: "This Year", value: recentDates.filter((date) => date.getFullYear() === thisYear).length }
      ],
      members: []
    };
  } finally {
    db.close();
  }
};

export const getRecommendExpirationRiskSummary = async (unit?: string | null): Promise<RecommendExpirationRiskReport> => {
  const unitScope = normalizeUnitScope(unit);
  const today = startOfToday();
  const next90Threshold = new Date(today);
  next90Threshold.setDate(next90Threshold.getDate() + 90);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `NULLIF(TRIM(COALESCE(m.temple_recommend_expiration_date, '')), '') IS NOT NULL`
    ];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const rows = db.prepare(
      `
      SELECT
        m.temple_recommend_expiration_date AS expirationDate
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as Array<{ expirationDate: string | null }>;

    const summary = { expired: 0, next30: 0, next90: 0 };
    for (const row of rows) {
      const expiration = safeDate(row.expirationDate);
      if (!expiration || expiration > next90Threshold) {
        continue;
      }
      const days = daysFromToday(expiration);
      if (days < 0) {
        summary.expired++;
      } else if (days <= 30) {
        summary.next30++;
      } else {
        summary.next90++;
      }
    }

    return {
      summary: [
        { label: "Expired", value: summary.expired },
        { label: "Next 30 Days", value: summary.next30 },
        { label: "31-90 Days", value: summary.next90 }
      ],
      members: []
    };
  } finally {
    db.close();
  }
};

export const getMinisteringGapSummary = async (): Promise<MinisteringGapReport> => {
  const db = openSqliteSpikeDb();
  try {
    const row = db.prepare(
      `
      SELECT COUNT(*) AS value
      FROM members m
      WHERE (m.member_status IS NULL OR m.member_status LIKE 'active%' OR m.member_status LIKE 'Active%')
        AND COALESCE(m.has_ministering_brothers, 0) = 0
        AND COALESCE(m.has_ministering_sisters, 0) = 0
      `
    ).get() as { value: number };

    return {
      summary: [{ label: "No Assigned Ministers", value: row.value }],
      members: []
    };
  } finally {
    db.close();
  }
};

export const getMinisteringCoverageByUnit = async (unit?: string | null): Promise<MinisteringCoverageUnitRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [
      `(m.member_status IS NULL OR m.member_status LIKE 'active%' OR m.member_status LIKE 'Active%')`
    ];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const rows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        COUNT(*) AS eligibleCount,
        COUNT(CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 0 AND COALESCE(m.has_ministering_sisters, 0) = 0 THEN 1 END) AS noAssignedCount,
        COUNT(CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 1 AND COALESCE(m.has_ministering_sisters, 0) = 0 THEN 1 END) AS brothersOnlyCount,
        COUNT(CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 0 AND COALESCE(m.has_ministering_sisters, 0) = 1 THEN 1 END) AS sistersOnlyCount,
        COUNT(CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 1 AND COALESCE(m.has_ministering_sisters, 0) = 1 THEN 1 END) AS bothAssignedCount
      FROM members m
      WHERE ${conditions.join(" AND ")}
      GROUP BY ${unitNameExpr()}
      ORDER BY noAssignedCount DESC, unitName
      `
    ).all(...params) as Array<{
      unitName: string;
      eligibleCount: number;
      noAssignedCount: number;
      brothersOnlyCount: number;
      sistersOnlyCount: number;
      bothAssignedCount: number;
    }>;

    return rows.map((row) => {
      const assignedAnyCount = row.brothersOnlyCount + row.sistersOnlyCount + row.bothAssignedCount;
      return {
        ...row,
        assignedAnyCount,
        assignedAnyPct: row.eligibleCount > 0 ? Math.round((assignedAnyCount / row.eligibleCount) * 100) : 0,
        noAssignedPct: row.eligibleCount > 0 ? Math.round((row.noAssignedCount / row.eligibleCount) * 100) : 0
      };
    });
  } finally {
    db.close();
  }
};

export const getHouseholdOutreachSummary = async (unit?: string | null): Promise<HouseholdOutreachReport> => {
  const unitScope = normalizeUnitScope(unit);
  const next90Threshold = new Date(startOfToday());
  next90Threshold.setDate(next90Threshold.getDate() + 90);
  const db = openSqliteSpikeDb();
  try {
    const unitCondition = unitScope ? `AND ${unitNameExpr()} = ?` : "";
    const params: unknown[] = unitScope ? [unitScope] : [];

    const rows = db.prepare(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN m.age BETWEEN 12 AND 35 THEN h.id END) AS youthYsa,
        0 AS recentBaptism,
        0 AS recommendRisk,
        COUNT(DISTINCT CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 0 AND COALESCE(m.has_ministering_sisters, 0) = 0 THEN h.id END) AS ministeringGap
      FROM households h
      JOIN members m ON m.household_id = h.id
      WHERE 1=1 ${unitCondition}
      `
    ).get(...params) as {
      youthYsa: number;
      recentBaptism: number;
      recommendRisk: number;
      ministeringGap: number;
    };

    const recentBaptismRows = db.prepare(
      `
      SELECT DISTINCT
        h.id AS householdId,
        m.baptism_date AS baptismDate
      FROM households h
      JOIN members m ON m.household_id = h.id
      WHERE NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL ${unitCondition}
      `
    ).all(...params) as Array<{ householdId: number; baptismDate: string | null }>;
    const recentBaptismThreshold = monthsAgoThreshold(12);
    const recentBaptismHouseholds = new Set(
      recentBaptismRows
        .filter((row) => isOnOrAfter(row.baptismDate, recentBaptismThreshold))
        .map((row) => row.householdId)
    );
    const recommendRiskRows = db.prepare(
      `
      SELECT DISTINCT
        h.id AS householdId,
        m.temple_recommend_expiration_date AS expirationDate
      FROM households h
      JOIN members m ON m.household_id = h.id
      WHERE NULLIF(TRIM(COALESCE(m.temple_recommend_expiration_date, '')), '') IS NOT NULL ${unitCondition}
      `
    ).all(...params) as Array<{ householdId: number; expirationDate: string | null }>;
    const recommendRiskHouseholds = new Set(
      recommendRiskRows
        .filter((row) => {
          const expiration = safeDate(row.expirationDate);
          return Boolean(expiration && expiration <= next90Threshold);
        })
        .map((row) => row.householdId)
    );

    return {
      summary: [
        { label: "Youth / YSA", value: rows.youthYsa },
        { label: "Recent Baptism", value: recentBaptismHouseholds.size },
        { label: "Recommend Risk", value: recommendRiskHouseholds.size },
        { label: "Ministering Gap", value: rows.ministeringGap }
      ],
      households: []
    };
  } finally {
    db.close();
  }
};

export const getNewReturningStrengtheningSummary = async (unit?: string | null): Promise<NewReturningStrengtheningReport> => {
  const unitScope = normalizeUnitScope(unit);
  const cutoffDate = daysAgoThreshold(730);
  const db = openSqliteSpikeDb();
  try {
    const unitCondition = unitScope ? `WHERE ${unitNameExpr()} = ?` : "";
    const params: unknown[] = unitScope ? [unitScope] : [];

    const rows = db.prepare(
      `
      SELECT
        m.is_convert AS isConvert,
        m.baptism_date AS baptismDate,
        m.move_in_date AS moveInDate
      FROM members m
      ${unitCondition}
      `
    ).all(...params) as Array<{ isConvert: number | null; baptismDate: string | null; moveInDate: string | null }>;

    const convertCount = rows.filter((row) => toBool(row.isConvert) && (isOnOrAfter(row.baptismDate, cutoffDate) || isOnOrAfter(row.moveInDate, cutoffDate))).length;
    const moveInCount = rows.filter((row) => isOnOrAfter(row.moveInDate, cutoffDate)).length;

    // No member_status_history in SQLite, so no recommend recovered data
    return {
      summary: [
        { label: "Convert", value: convertCount },
        { label: "Move-in", value: moveInCount },
        { label: "Recommend Recovered (1y+)", value: 0 }
      ],
      members: []
    };
  } finally {
    db.close();
  }
};

export const getPriesthoodProgressionSummary = async (unit?: string | null): Promise<PriesthoodProgressionReport> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [`LOWER(COALESCE(m.gender, '')) IN ('m', 'male')`];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const members = db.prepare(
      `
      SELECT
        m.age,
        COALESCE(m.priesthood_office, '') AS currentOffice
      FROM members m
      WHERE ${conditions.join(" AND ")}
      `
    ).all(...params) as Array<{ age: number | null; currentOffice: string }>;

    const counts: Record<string, number> = { Teacher: 0, Priest: 0, Elder: 0, "High Priest": 0 };
    for (const m of members) {
      const age = m.age ?? 0;
      const office = m.currentOffice.toLowerCase();
      if (age >= 30 && office === "elder") {
        counts["High Priest"]++;
      } else if (age >= 18 && !/(elder|high priest)/i.test(office)) {
        counts.Elder++;
      } else if (age >= 16 && !/(priest|elder|high priest)/i.test(office)) {
        counts.Priest++;
      } else if (age >= 14 && !/(teacher|priest|elder|high priest)/i.test(office)) {
        counts.Teacher++;
      }
    }

    return {
      summary: [
        { label: "Teacher", value: counts.Teacher },
        { label: "Priest", value: counts.Priest },
        { label: "Elder", value: counts.Elder },
        { label: "High Priest", value: counts["High Priest"] }
      ],
      members: []
    };
  } finally {
    db.close();
  }
};

export const getSeminaryInstituteByUnitReport = async (unit?: string | null): Promise<SeminaryInstituteByUnitRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (unitScope) {
      conditions.push(`${unitNameExpr()} = ?`);
      params.push(unitScope);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        m.birthdate,
        m.age,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute
      FROM members m
      ${whereClause}
      ORDER BY ${unitNameExpr()}
      `
    ).all(...params) as Array<{
      unitName: string;
      birthdate: string | null;
      age: number | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
    }>;

    const unitRows = rows.reduce((groups, row) => {
      const existing = groups.get(row.unitName) ?? {
        unitName: row.unitName,
        seminaryEligible: 0,
        seminaryAttending: 0,
        instituteEligible: 0,
        instituteAttending: 0
      };
      const youthProgramAge = youthProgramAgeFromBirthdate(row.birthdate, row.age);
      const actualAge = actualAgeFromBirthdate(row.birthdate, row.age);
      if (isSeminaryEligibleAge(youthProgramAge)) {
        existing.seminaryEligible++;
        if (toBool(row.isAttendingSeminary)) existing.seminaryAttending++;
      }
      if (isInstituteEligibleAge(actualAge)) {
        existing.instituteEligible++;
        if (toBool(row.isAttendingInstitute)) existing.instituteAttending++;
      }
      groups.set(row.unitName, existing);
      return groups;
    }, new Map<string, Omit<SeminaryInstituteByUnitRow, "seminaryParticipationPct" | "instituteParticipationPct">>());

    return Array.from(unitRows.values()).map((row) => ({
      ...row,
      seminaryParticipationPct: row.seminaryEligible > 0 ? Math.round((row.seminaryAttending / row.seminaryEligible) * 100) : 0,
      instituteParticipationPct: row.instituteEligible > 0 ? Math.round((row.instituteAttending / row.instituteEligible) * 100) : 0
    }));
  } finally {
    db.close();
  }
};

export const getUnitHealthRadarData = async (): Promise<UnitHealthRadarRow[]> => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        COUNT(DISTINCT m.id) AS memberCount,
        0 AS seminaryEligible,
        0 AS seminaryAttending,
        0 AS instituteEligible,
        0 AS instituteAttending,
        COUNT(DISTINCT CASE WHEN COALESCE(m.temple_recommend_status, '') LIKE 'active%' OR COALESCE(m.temple_recommend_status, '') LIKE 'Active%' THEN m.id END) AS activeRecommendCount,
        0 AS recentConvertCount,
        COUNT(DISTINCT CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 1 OR COALESCE(m.has_ministering_sisters, 0) = 1 THEN m.id END) AS ministeringCoverageCount
      FROM members m
      GROUP BY ${unitNameExpr()}
      ORDER BY ${unitNameExpr()}
      `
    ).all() as Array<{
      unitName: string;
      memberCount: number;
      seminaryEligible: number;
      seminaryAttending: number;
      instituteEligible: number;
      instituteAttending: number;
      activeRecommendCount: number;
      recentConvertCount: number;
      ministeringCoverageCount: number;
    }>;

    // Get leadership callings per unit
    const leadershipRows = db.prepare(
      `
      SELECT
        COALESCE(NULLIF(m.unit_name, ''), NULLIF(c.unit_name, ''), 'Unknown') AS unitName,
        COUNT(*) AS leadershipCallings
      FROM callings c
      LEFT JOIN members m ON m.lcr_member_id = c.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.lcr_member_id IS NOT NULL
        AND (c.title LIKE '%president%' OR c.title LIKE '%President%' OR c.title LIKE '%bishop%' OR c.title LIKE '%Bishop%' OR c.title LIKE '%high councilor%' OR c.title LIKE '%High Councilor%')
      GROUP BY 1
      `
    ).all() as Array<{ unitName: string; leadershipCallings: number }>;
    const leadershipMap = new Map(leadershipRows.map((r) => [r.unitName, r.leadershipCallings]));

    const classRows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        m.birthdate,
        m.age,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute
      FROM members m
      `
    ).all() as Array<{
      unitName: string;
      birthdate: string | null;
      age: number | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
    }>;
    const classCounts = classRows.reduce((counts, row) => {
      const existing = counts.get(row.unitName) ?? { seminaryEligible: 0, seminaryAttending: 0, instituteEligible: 0, instituteAttending: 0 };
      const youthProgramAge = youthProgramAgeFromBirthdate(row.birthdate, row.age);
      const actualAge = actualAgeFromBirthdate(row.birthdate, row.age);
      if (isSeminaryEligibleAge(youthProgramAge)) {
        existing.seminaryEligible++;
        if (toBool(row.isAttendingSeminary)) existing.seminaryAttending++;
      }
      if (isInstituteEligibleAge(actualAge)) {
        existing.instituteEligible++;
        if (toBool(row.isAttendingInstitute)) existing.instituteAttending++;
      }
      counts.set(row.unitName, existing);
      return counts;
    }, new Map<string, { seminaryEligible: number; seminaryAttending: number; instituteEligible: number; instituteAttending: number }>());

    const recentConvertRows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        m.baptism_date AS baptismDate,
        m.move_in_date AS moveInDate
      FROM members m
      WHERE m.is_convert = 1
      `
    ).all() as Array<{ unitName: string; baptismDate: string | null; moveInDate: string | null }>;
    const recentConvertThreshold = monthsAgoThreshold(12);
    const recentConvertCounts = recentConvertRows.reduce((counts, row) => {
      if (isOnOrAfter(row.baptismDate, recentConvertThreshold) || isOnOrAfter(row.moveInDate, recentConvertThreshold)) {
        counts.set(row.unitName, (counts.get(row.unitName) ?? 0) + 1);
      }
      return counts;
    }, new Map<string, number>());

    return rows.map((row) => {
      const leadershipCallings = leadershipMap.get(row.unitName) ?? 0;
      const recentConvertCount = recentConvertCounts.get(row.unitName) ?? 0;
      const classCount = classCounts.get(row.unitName) ?? { seminaryEligible: 0, seminaryAttending: 0, instituteEligible: 0, instituteAttending: 0 };
      return {
        unitName: row.unitName,
        memberCount: row.memberCount,
        seminaryParticipationPct: classCount.seminaryEligible > 0 ? Math.round((classCount.seminaryAttending / classCount.seminaryEligible) * 100) : 0,
        instituteParticipationPct: classCount.instituteEligible > 0 ? Math.round((classCount.instituteAttending / classCount.instituteEligible) * 100) : 0,
        activeRecommendPct: row.memberCount > 0 ? Math.round((row.activeRecommendCount / row.memberCount) * 100) : 0,
        leadershipPer100: row.memberCount > 0 ? Math.round((leadershipCallings / row.memberCount) * 100) : 0,
        recentConvertPct: row.memberCount > 0 ? Math.round((recentConvertCount / row.memberCount) * 100) : 0,
        ministeringCoveragePct: row.memberCount > 0 ? Math.round((row.ministeringCoverageCount / row.memberCount) * 100) : 0
      };
    });
  } finally {
    db.close();
  }
};

export const getUnitReadinessScatterData = async (): Promise<UnitReadinessScatterRow[]> => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        ${unitNameExpr()} AS unitName,
        m.birthdate,
        m.age,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.temple_recommend_status AS templeRecommendStatus,
        m.has_ministering_brothers AS hasMinisteringBrothers,
        m.has_ministering_sisters AS hasMinisteringSisters
      FROM members m
      ORDER BY ${unitNameExpr()}
      `
    ).all() as Array<{
      unitName: string;
      birthdate: string | null;
      age: number | null;
      isAttendingSeminary: number | null;
      isAttendingInstitute: number | null;
      templeRecommendStatus: string | null;
      hasMinisteringBrothers: number | null;
      hasMinisteringSisters: number | null;
    }>;

    const unitRows = rows.reduce((groups, row) => {
      const existing = groups.get(row.unitName) ?? {
        unitName: row.unitName,
        seminaryEligible: 0,
        seminaryAttending: 0,
        instituteEligible: 0,
        instituteAttending: 0,
        readinessEligibleCount: 0,
        activeRecommendCount: 0,
        ministeringAssignedCount: 0
      };
      const youthProgramAge = youthProgramAgeFromBirthdate(row.birthdate, row.age);
      const actualAge = actualAgeFromBirthdate(row.birthdate, row.age);
      const seminaryEligible = isSeminaryEligibleAge(youthProgramAge);
      const instituteEligible = isInstituteEligibleAge(actualAge);
      const readinessEligible = (youthProgramAge !== null && youthProgramAge >= 12 && youthProgramAge <= 18) || instituteEligible;
      if (seminaryEligible) {
        existing.seminaryEligible++;
        if (toBool(row.isAttendingSeminary)) existing.seminaryAttending++;
      }
      if (instituteEligible) {
        existing.instituteEligible++;
        if (toBool(row.isAttendingInstitute)) existing.instituteAttending++;
      }
      if (readinessEligible) {
        existing.readinessEligibleCount++;
        if (isActiveTempleRecommendStatus(row.templeRecommendStatus)) existing.activeRecommendCount++;
        if (toBool(row.hasMinisteringBrothers) || toBool(row.hasMinisteringSisters)) existing.ministeringAssignedCount++;
      }
      groups.set(row.unitName, existing);
      return groups;
    }, new Map<string, {
      unitName: string;
      seminaryEligible: number;
      seminaryAttending: number;
      instituteEligible: number;
      instituteAttending: number;
      readinessEligibleCount: number;
      activeRecommendCount: number;
      ministeringAssignedCount: number;
    }>());

    return Array.from(unitRows.values())
      .map((row) => {
        const seminaryParticipationPct = row.seminaryEligible > 0 ? Math.round((row.seminaryAttending / row.seminaryEligible) * 100) : 0;
        const instituteParticipationPct = row.instituteEligible > 0 ? Math.round((row.instituteAttending / row.instituteEligible) * 100) : 0;
        const activeRecommendPct = row.readinessEligibleCount > 0 ? Math.round((row.activeRecommendCount / row.readinessEligibleCount) * 100) : 0;
        const ministeringAssignmentPct = row.readinessEligibleCount > 0 ? Math.round((row.ministeringAssignedCount / row.readinessEligibleCount) * 100) : 0;
        const useInstituteForUnit = row.unitName.toLowerCase().includes("ysa");

        return {
          unitName: row.unitName,
          classParticipationPct: useInstituteForUnit ? instituteParticipationPct : seminaryParticipationPct,
          classParticipationLabel: useInstituteForUnit ? "Institute" : "Seminary",
          ministeringAssignmentPct,
          activeRecommendPct,
          weightedReadinessScore: Math.round(activeRecommendPct * 0.7 + ministeringAssignmentPct * 0.3)
        };
      })
      .filter((row) => row.classParticipationPct > 0 || row.activeRecommendPct > 0 || row.ministeringAssignmentPct > 0);
  } finally {
    db.close();
  }
};

export const getRecentBaptismReport = async (monthsBack = 12): Promise<RecentBaptismReport> => {
  const safeMonthsBack = Math.max(1, Math.min(monthsBack, 36));
  const cutoffDate = monthsAgoThreshold(safeMonthsBack);
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.baptism_date AS baptismDate,
        m.confirmation_date AS confirmationDate,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      WHERE NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL
      `
    ).all() as RecentBaptismRow[];

    const recentRows = rows
      .filter((row) => isOnOrAfter(row.baptismDate, cutoffDate))
      .sort((left, right) => compareDateStrings(left.baptismDate, right.baptismDate, "desc") || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000);

    const now = new Date();
    const currentYear = now.getFullYear();
    const summary = {
      last30: 0,
      last90: 0,
      thisYear: 0
    };

    for (const row of recentRows) {
      if (!row.baptismDate) {
        continue;
      }
      const baptismDate = safeDate(row.baptismDate);
      if (!baptismDate) {
        continue;
      }
      const daysAgo = Math.floor((now.getTime() - baptismDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo <= 30) {
        summary.last30 += 1;
      }
      if (daysAgo <= 90) {
        summary.last90 += 1;
      }
      if (baptismDate.getFullYear() === currentYear) {
        summary.thisYear += 1;
      }
    }

    return {
      summary: [
        { label: "Last 30 Days", value: summary.last30 },
        { label: "Last 90 Days", value: summary.last90 },
        { label: "This Year", value: summary.thisYear }
      ],
      members: recentRows
    };
  } finally {
    db.close();
  }
};

export const getRecentBaptismPathCohort = async (): Promise<RecentBaptismPathRow[]> => {
  const cutoffDate = daysAgoThreshold(730);
  const db = openSqliteSpikeDb();
  try {
    const cohortRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.baptism_date AS baptismDate,
        m.temple_recommend_status AS templeRecommendStatus,
        EXISTS (SELECT 1 FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id) AS hasCurrentCalling,
        (SELECT c.title FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id ORDER BY c.sustained_on DESC LIMIT 1) AS currentCalling,
        (COALESCE(m.has_ministering_brothers, 0) OR COALESCE(m.has_ministering_sisters, 0)) AS ministeringAssigned
      FROM members m
      WHERE NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL
      `
    ).all() as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      baptismDate: string | null;
      templeRecommendStatus: string | null;
      hasCurrentCalling: number;
      currentCalling: string | null;
      ministeringAssigned: number;
    }>;

    const ministeringRows = db.prepare(
      `
      SELECT
        m.ministering_brothers AS ministeringBrothers,
        m.ministering_sisters AS ministeringSisters
      FROM members m
      WHERE NULLIF(TRIM(COALESCE(m.ministering_brothers, '')), '') IS NOT NULL
         OR NULLIF(TRIM(COALESCE(m.ministering_sisters, '')), '') IS NOT NULL
      `
    ).all() as Array<{ ministeringBrothers: string | null; ministeringSisters: string | null }>;

    const assignedMinisterVariants = new Set<string>();
    for (const row of ministeringRows) {
      for (const entry of [...splitMinisteringAssignments(row.ministeringBrothers), ...splitMinisteringAssignments(row.ministeringSisters)]) {
        for (const variant of buildNameVariants(entry)) {
          assignedMinisterVariants.add(variant);
        }
      }
    }

    return cohortRows
      .filter((row) => isOnOrAfter(row.baptismDate, cutoffDate))
      .sort((left, right) => compareDateStrings(left.baptismDate, right.baptismDate, "desc") || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000)
      .map((row) => {
        const assignedAsMinister = buildNameVariants(row.fullName).some((variant) => assignedMinisterVariants.has(variant));

        return {
          lcrMemberId: row.lcrMemberId,
          fullName: row.fullName,
          unitName: row.unitName,
          baptismDate: row.baptismDate,
          templeRecommendStatus: row.templeRecommendStatus,
          hasCurrentCalling: toBool(row.hasCurrentCalling),
          currentCalling: cleanCallingTitle(row.currentCalling) || null,
          ministeringAssigned: toBool(row.ministeringAssigned),
          assignedAsMinister,
          assignedAsMinisterLabel: assignedAsMinister ? "Yes" : "No"
        };
      });
  } finally {
    db.close();
  }
};

export const getRecommendExpirationRiskReport = async (): Promise<RecommendExpirationRiskReport> => {
  const today = startOfToday();
  const next90Threshold = new Date(today);
  next90Threshold.setDate(next90Threshold.getDate() + 90);
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.temple_recommend_status AS templeRecommendStatus,
        m.temple_recommend_expiration_date AS expirationDate
      FROM members m
      WHERE NULLIF(TRIM(COALESCE(m.temple_recommend_expiration_date, '')), '') IS NOT NULL
      `
    ).all() as Array<Omit<RecommendExpirationRiskRow, "daysUntilExpiration">>;

    const summary = {
      expired: 0,
      next30: 0,
      next90: 0
    };

    const members: RecommendExpirationRiskRow[] = rows
      .flatMap((row) => {
        const expiration = safeDate(row.expirationDate);
        if (!expiration || expiration > next90Threshold) {
          return [];
        }
        return [{
          ...row,
          daysUntilExpiration: daysFromToday(expiration)
        }];
      })
      .sort(
        (left, right) =>
          compareDateStrings(left.expirationDate, right.expirationDate, "asc") ||
          left.unitName.localeCompare(right.unitName) ||
          left.fullName.localeCompare(right.fullName)
      )
      .slice(0, 5000);

    for (const row of members) {
      const days = row.daysUntilExpiration ?? 0;
      if (days < 0) {
        summary.expired += 1;
      } else if (days <= 30) {
        summary.next30 += 1;
      } else {
        summary.next90 += 1;
      }
    }

    return {
      summary: [
        { label: "Expired", value: summary.expired },
        { label: "Next 30 Days", value: summary.next30 },
        { label: "31-90 Days", value: summary.next90 }
      ],
      members
    };
  } finally {
    db.close();
  }
};

export const getMinisteringGapReport = async (): Promise<MinisteringGapReport> => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        'No Assigned Ministers' AS gapCategory,
        m.has_ministering_brothers AS hasMinisteringBrothers,
        m.has_ministering_sisters AS hasMinisteringSisters,
        m.ministering_brothers AS ministeringBrothers,
        m.ministering_sisters AS ministeringSisters,
        m.spouse_name AS spouseName,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      WHERE (m.member_status IS NULL OR m.member_status LIKE 'active%' OR m.member_status LIKE 'Active%')
        AND COALESCE(m.has_ministering_brothers, 0) = 0
        AND COALESCE(m.has_ministering_sisters, 0) = 0
      ORDER BY unitName, m.last_name, m.first_name
      LIMIT 5000
      `
    ).all() as Array<
      Omit<MinisteringGapRow, "hasMinisteringBrothers" | "hasMinisteringSisters"> & {
        hasMinisteringBrothers: number | null;
        hasMinisteringSisters: number | null;
      }
    >;

    const mappedRows = rows.map((row) => ({
      ...row,
      hasMinisteringBrothers: toBoolOrNull(row.hasMinisteringBrothers),
      hasMinisteringSisters: toBoolOrNull(row.hasMinisteringSisters)
    })) as MinisteringGapRow[];

    const summaryMap = mappedRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.gapCategory] = (acc[row.gapCategory] ?? 0) + 1;
      return acc;
    }, {});

    return {
      summary: [{ label: "No Assigned Ministers", value: summaryMap["No Assigned Ministers"] ?? 0 }],
      members: mappedRows
    };
  } finally {
    db.close();
  }
};

export const getSeminaryInstituteOpportunityReport = async (): Promise<SeminaryInstituteOpportunityRow[]> => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.birthdate,
        m.age,
        m.is_attending_seminary AS isAttendingSeminary,
        m.is_attending_institute AS isAttendingInstitute,
        m.potential_seminary_student AS potentialSeminaryStudent,
        m.potential_institute_student AS potentialInstituteStudent,
        m.seminary_status AS seminaryStatus,
        m.institute_status AS instituteStatus,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      ORDER BY unitName, ${nullsLast('m.age')}, m.age DESC, m.last_name, m.first_name
      `
    ).all() as Array<
      Omit<SeminaryInstituteOpportunityRow, "age" | "track" | "attending" | "potentialFlag" | "statusText"> & {
        birthdate: string | null;
        age: number | null;
        isAttendingSeminary: number | null;
        isAttendingInstitute: number | null;
        potentialSeminaryStudent: number | null;
        potentialInstituteStudent: number | null;
        seminaryStatus: string | null;
        instituteStatus: string | null;
      }
    >;

    return rows
      .flatMap<SeminaryInstituteOpportunityRow>((row) => {
        const age = actualAgeFromBirthdate(row.birthdate, row.age);
        const youthProgramAge = youthProgramAgeFromBirthdate(row.birthdate, row.age);
        const seminaryEligible = isSeminaryEligibleAge(youthProgramAge);
        const instituteEligible = isInstituteEligibleAge(age);
        if (seminaryEligible && !toBool(row.isAttendingSeminary)) {
          return [{
            ...row,
            age,
            track: "Seminary" as const,
            attending: toBoolOrNull(row.isAttendingSeminary),
            potentialFlag: toBoolOrNull(row.potentialSeminaryStudent),
            statusText: row.seminaryStatus
          }];
        }
        if (instituteEligible && !toBool(row.isAttendingInstitute)) {
          return [{
            ...row,
            age,
            track: "Institute" as const,
            attending: toBoolOrNull(row.isAttendingInstitute),
            potentialFlag: toBoolOrNull(row.potentialInstituteStudent),
            statusText: row.instituteStatus
          }];
        }
        return [];
      })
      .sort(
        (left, right) =>
          left.track.localeCompare(right.track) ||
          left.unitName.localeCompare(right.unitName) ||
          ((right.age ?? -1) - (left.age ?? -1)) ||
          left.fullName.localeCompare(right.fullName)
      )
      .slice(0, 5000);
  } finally {
    db.close();
  }
};

export const getHouseholdOutreachReport = async (): Promise<HouseholdOutreachReport> => {
  const next90Threshold = new Date(startOfToday());
  next90Threshold.setDate(next90Threshold.getDate() + 90);
  const db = openSqliteSpikeDb();
  try {
    const rawRows = db.prepare(
      `
      SELECT
        h.id AS householdId,
        COALESCE(NULLIF(h.household_name, ''), MAX(NULLIF(m.head_of_house, '')), 'Household') AS householdName,
        MAX(NULLIF(m.head_of_house, '')) AS headOfHouse,
        COALESCE(MAX(NULLIF(m.unit_name, '')), 'Unknown') AS unitName,
        COUNT(DISTINCT m.id) AS memberCount,
        COUNT(DISTINCT CASE WHEN m.age BETWEEN 12 AND 35 THEN m.id END) AS youthCount,
        GROUP_CONCAT(NULLIF(m.baptism_date, ''), ' | ') AS baptismDates,
        GROUP_CONCAT(NULLIF(m.temple_recommend_expiration_date, ''), ' | ') AS recommendExpirationDates,
        COUNT(DISTINCT CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 0 AND COALESCE(m.has_ministering_sisters, 0) = 0 THEN m.id END) AS ministeringGapCount,
        (SELECT GROUP_CONCAT(e, ' | ') FROM (SELECT DISTINCT primary_email AS e FROM members WHERE household_id = h.id AND primary_email IS NOT NULL)) AS householdEmails,
        (SELECT GROUP_CONCAT(p, ' | ') FROM (SELECT DISTINCT primary_phone AS p FROM members WHERE household_id = h.id AND primary_phone IS NOT NULL)) AS householdPhones
      FROM households h
      JOIN members m ON m.household_id = h.id
      GROUP BY h.id, h.household_name
      HAVING
        COUNT(DISTINCT CASE WHEN m.age BETWEEN 12 AND 35 THEN m.id END) > 0
        OR COUNT(DISTINCT CASE WHEN NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL THEN m.id END) > 0
        OR COUNT(DISTINCT CASE WHEN NULLIF(TRIM(COALESCE(m.temple_recommend_expiration_date, '')), '') IS NOT NULL THEN m.id END) > 0
        OR COUNT(DISTINCT CASE WHEN COALESCE(m.has_ministering_brothers, 0) = 0 AND COALESCE(m.has_ministering_sisters, 0) = 0 THEN m.id END) > 0
      ORDER BY unitName, householdName
      LIMIT 5000
      `
    ).all() as Array<{
      householdId: number;
      householdName: string;
      headOfHouse: string | null;
      unitName: string;
      memberCount: number;
      youthCount: number;
      baptismDates: string | null;
      recommendExpirationDates: string | null;
      ministeringGapCount: number;
      householdEmails: string | null;
      householdPhones: string | null;
    }>;

    const recentBaptismThreshold = monthsAgoThreshold(12);
    const households = rawRows.map<HouseholdOutreachRow>((row) => {
      const recentBaptismCount = (row.baptismDates ?? "")
        .split(" | ")
        .filter((value) => isOnOrAfter(value, recentBaptismThreshold)).length;
      const recommendRiskCount = (row.recommendExpirationDates ?? "")
        .split(" | ")
        .filter((value) => {
          const expiration = safeDate(value);
          return Boolean(expiration && expiration <= next90Threshold);
        }).length;
      const focusAreas = [
        row.youthCount > 0 ? "Youth / YSA" : null,
        recentBaptismCount > 0 ? "Recent Baptism" : null,
        recommendRiskCount > 0 ? "Recommend Risk" : null,
        row.ministeringGapCount > 0 ? "Ministering Gap" : null
      ].filter(Boolean) as string[];

      return {
        householdId: row.householdId,
        householdName: row.householdName,
        headOfHouse: row.headOfHouse,
        unitName: row.unitName,
        memberCount: row.memberCount,
        youthCount: row.youthCount,
        recentBaptismCount,
        recommendRiskCount,
        ministeringGapCount: row.ministeringGapCount,
        householdEmails: row.householdEmails ?? "",
        householdPhones: row.householdPhones ?? "",
        focusAreas
      };
    }).filter((household) => household.focusAreas.length > 0);

    const summary = [
      { label: "Youth / YSA", value: households.filter((household) => household.youthCount > 0).length },
      { label: "Recent Baptism", value: households.filter((household) => household.recentBaptismCount > 0).length },
      { label: "Recommend Risk", value: households.filter((household) => household.recommendRiskCount > 0).length },
      { label: "Ministering Gap", value: households.filter((household) => household.ministeringGapCount > 0).length }
    ];

    return { summary, households };
  } finally {
    db.close();
  }
};

export const getNewReturningStrengtheningReport = async (): Promise<NewReturningStrengtheningReport> => {
  const cutoffDate = daysAgoThreshold(730);
  const db = openSqliteSpikeDb();
  try {
    // No member_status_history in SQLite, so no recommend recovered data
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        CASE
          WHEN m.is_convert = 1 THEN 'Convert'
          WHEN m.move_in_date IS NOT NULL THEN 'Move-in'
          ELSE 'Returning Member'
        END AS focusCategory,
        m.baptism_date AS baptismDate,
        m.move_in_date AS moveInDate,
        COALESCE(m.baptism_date, m.move_in_date) AS focusDate,
        m.temple_recommend_status AS templeRecommendStatus,
        EXISTS (SELECT 1 FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id) AS hasCurrentCalling,
        (COALESCE(m.has_ministering_brothers, 0) OR COALESCE(m.has_ministering_sisters, 0)) AS ministeringAssigned,
        0 AS recoveredAfterLongLapse,
        NULL AS reactivatedAt,
        NULL AS inactiveDays
      FROM members m
      WHERE (
          m.is_convert = 1
          AND (NULLIF(TRIM(COALESCE(m.baptism_date, '')), '') IS NOT NULL OR NULLIF(TRIM(COALESCE(m.move_in_date, '')), '') IS NOT NULL)
        )
        OR NULLIF(TRIM(COALESCE(m.move_in_date, '')), '') IS NOT NULL
      `
    ).all() as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      focusCategory: string;
      baptismDate: string | null;
      moveInDate: string | null;
      focusDate: string | null;
      templeRecommendStatus: string | null;
      hasCurrentCalling: number;
      ministeringAssigned: number;
      recoveredAfterLongLapse: number;
      reactivatedAt: string | null;
      inactiveDays: number | null;
    }>;

    const mappedRows: NewReturningStrengtheningRow[] = rows
      .filter((row) => {
        const isRecentConvert = row.focusCategory === "Convert" && (isOnOrAfter(row.baptismDate, cutoffDate) || isOnOrAfter(row.moveInDate, cutoffDate));
        const isRecentMoveIn = isOnOrAfter(row.moveInDate, cutoffDate);
        return isRecentConvert || isRecentMoveIn;
      })
      .map((row) => ({
        lcrMemberId: row.lcrMemberId,
        fullName: row.fullName,
        unitName: row.unitName,
        focusCategory: row.focusCategory,
        focusDate: row.focusDate,
        templeRecommendStatus: row.templeRecommendStatus,
        hasCurrentCalling: toBool(row.hasCurrentCalling),
        ministeringAssigned: toBool(row.ministeringAssigned),
        recoveredAfterLongLapse: false,
        reactivatedAt: null,
        inactiveDays: null
      }))
      .sort((left, right) => compareDateStrings(left.focusDate, right.focusDate, "desc") || left.fullName.localeCompare(right.fullName))
      .slice(0, 5000);

    const summaryMap = mappedRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.focusCategory] = (acc[row.focusCategory] ?? 0) + 1;
      return acc;
    }, {});

    return {
      summary: [
        { label: "Convert", value: summaryMap.Convert ?? 0 },
        { label: "Move-in", value: summaryMap["Move-in"] ?? 0 },
        { label: "Recommend Recovered (1y+)", value: summaryMap["Recommend Recovered (1y+)"] ?? 0 }
      ],
      members: mappedRows
    };
  } finally {
    db.close();
  }
};

export const getPriesthoodProgressionReport = async (): Promise<PriesthoodProgressionReport> => {
  const db = openSqliteSpikeDb();
  try {
    const members = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        m.age,
        m.priesthood_office AS currentOffice
      FROM members m
      WHERE LOWER(COALESCE(m.gender, '')) IN ('m', 'male')
      `
    ).all() as Array<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      age: number | null;
      currentOffice: string | null;
    }>;

    const candidates: PriesthoodProgressionRow[] = [];
    for (const m of members) {
      const age = m.age ?? 0;
      const office = (m.currentOffice ?? "").toLowerCase();
      let recommendedNextOffice: string | null = null;

      if (age >= 30 && office === "elder") {
        recommendedNextOffice = "High Priest";
      } else if (age >= 18 && !/(elder|high priest)/i.test(office)) {
        recommendedNextOffice = "Elder";
      } else if (age >= 16 && !/(priest|elder|high priest)/i.test(office)) {
        recommendedNextOffice = "Priest";
      } else if (age >= 14 && !/(teacher|priest|elder|high priest)/i.test(office)) {
        recommendedNextOffice = "Teacher";
      }

      if (recommendedNextOffice) {
        candidates.push({
          lcrMemberId: m.lcrMemberId,
          fullName: m.fullName,
          unitName: m.unitName,
          age: m.age,
          currentOffice: m.currentOffice,
          recommendedNextOffice
        });
      }
    }

    candidates.sort((a, b) => {
      const officeOrder: Record<string, number> = { Teacher: 1, Priest: 2, Elder: 3, "High Priest": 4 };
      const orderDiff = (officeOrder[a.recommendedNextOffice] ?? 0) - (officeOrder[b.recommendedNextOffice] ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return compareNullable(b.age, a.age, "asc");
    });

    const summaryMap = candidates.reduce<Record<string, number>>((acc, row) => {
      acc[row.recommendedNextOffice] = (acc[row.recommendedNextOffice] ?? 0) + 1;
      return acc;
    }, {});

    return {
      summary: [
        { label: "Teacher", value: summaryMap.Teacher ?? 0 },
        { label: "Priest", value: summaryMap.Priest ?? 0 },
        { label: "Elder", value: summaryMap.Elder ?? 0 },
        { label: "High Priest", value: summaryMap["High Priest"] ?? 0 }
      ],
      members: candidates
    };
  } finally {
    db.close();
  }
};

export const getRecentMoveInsReport = async () => {
  const cutoffDate = daysAgoThreshold(365);
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${unitNameExpr()} AS unitName,
        ${fullNameExpr} AS fullName,
        m.move_in_date AS moveInDate,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      WHERE NULLIF(TRIM(COALESCE(m.move_in_date, '')), '') IS NOT NULL
      `
    ).all() as Array<{
      lcrMemberId: string;
      unitName: string;
      fullName: string;
      moveInDate: string | null;
      phoneNumber: string | null;
      email: string | null;
    }>;

    return rows
      .filter((row) => isOnOrAfter(row.moveInDate, cutoffDate))
      .sort((left, right) => compareDateStrings(left.moveInDate, right.moveInDate, "desc") || left.fullName.localeCompare(right.fullName))
      .slice(0, 100);
  } finally {
    db.close();
  }
};

export const getMemberDetail = async (lcrMemberId: string): Promise<MemberDetail | null> => {
  const db = openSqliteSpikeDb();
  try {
    const member = db.prepare(
      `
      SELECT
        m.id,
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        m.preferred_name AS preferredName,
        ${unitNameExpr()} AS unitName,
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
        m.household_id AS householdId,
        h.household_name AS householdName,
        COALESCE(m.address_line1, h.address_line1) AS addressLine1,
        COALESCE(m.address_line2, h.address_line2) AS addressLine2,
        COALESCE(m.city, h.city) AS city,
        COALESCE(m.state_or_province, h.state) AS stateOrProvince,
        COALESCE(m.postal_code, h.postal_code) AS postalCode,
        COALESCE(m.country, h.country) AS country,
        m.primary_email AS primaryEmail,
        m.primary_phone AS primaryPhone
      FROM members m
      LEFT JOIN households h ON m.household_id = h.id
      WHERE m.lcr_member_id = ?
      LIMIT 1
      `
    ).get(lcrMemberId) as (MemberDetail & { id: number; primaryEmail: string | null; primaryPhone: string | null; isAccountable: number | null; isBornInCovenant: number | null; isDivorced: number | null; isMarried: number | null; isAttendingSeminary: number | null; isAttendingInstitute: number | null; potentialInstituteStudent: number | null; potentialSeminaryStudent: number | null }) | undefined;

    if (!member) {
      return null;
    }

    const callingRows = db.prepare(
      `
      SELECT
        c.title AS callingTitle,
        c.organization_name AS organizationName,
        c.sustained_on AS sustainedOn,
        c.set_apart_on AS setApartOn
      FROM callings c
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.lcr_member_id = ?
      ORDER BY ${nullsLast('c.sustained_on')}, c.sustained_on DESC, c.title
      `
    ).all(lcrMemberId) as Array<{
      callingTitle: string;
      organizationName: string | null;
      sustainedOn: string | null;
      setApartOn: string | null;
    }>;

    const householdRows = member.householdId
      ? db.prepare(
          `
          SELECT
            hm.lcr_member_id AS lcrMemberId,
            TRIM(hm.first_name || ' ' || hm.last_name) AS fullName,
            hm.age,
            hm.gender,
            hm.household_position AS householdPosition
          FROM members hm
          WHERE hm.household_id = ?
          ORDER BY ${nullsLast('hm.age')}, hm.age DESC, hm.last_name, hm.first_name
          `
        ).all(member.householdId) as Array<{
          lcrMemberId: string;
          fullName: string;
          age: number | null;
          gender: string | null;
          householdPosition: string | null;
        }>
      : [];

    // Deduplicate callings
    const byCallingTitle = new Map<string, { callingTitle: string; organizationName: string | null; sustainedOn: string | null; setApartOn: string | null }>();
    for (const row of callingRows) {
      const cleanedTitle = cleanCallingTitle(row.callingTitle);
      const key = cleanedTitle.toLowerCase();
      const existing = byCallingTitle.get(key);
      const candidate = { ...row, callingTitle: cleanedTitle };
      const existingScore = existing ? Number(Boolean(existing.sustainedOn)) + Number(Boolean(existing.setApartOn)) : -1;
      const candidateScore = Number(Boolean(candidate.sustainedOn)) + Number(Boolean(candidate.setApartOn));
      if (!existing || candidateScore > existingScore) {
        byCallingTitle.set(key, candidate);
      }
    }
    const dedupedCallings = Array.from(byCallingTitle.values());

    const currentCallings = dedupedCallings.filter((row, index) => {
      const rowTitle = row.callingTitle.toLowerCase();
      return !dedupedCallings.some((other, otherIndex) => {
        if (otherIndex === index) {
          return false;
        }
        if ((other.sustainedOn ?? "") !== (row.sustainedOn ?? "")) {
          return false;
        }
        const otherTitle = other.callingTitle.toLowerCase();
        return otherTitle.length > rowTitle.length + 4 && otherTitle.includes(rowTitle);
      });
    });

    const emails = member.primaryEmail ? [member.primaryEmail] : [];
    const phoneNumbers = member.primaryPhone ? [member.primaryPhone] : [];

    return {
      lcrMemberId: member.lcrMemberId,
      fullName: member.fullName,
      preferredName: member.preferredName,
      unitName: member.unitName,
      age: member.age,
      gender: member.gender,
      birthdate: member.birthdate,
      birthCountry: member.birthCountry,
      birthplace: member.birthplace,
      moveInDate: member.moveInDate,
      memberStatus: member.memberStatus,
      baptismDate: member.baptismDate,
      confirmationDate: member.confirmationDate,
      isAccountable: toBoolOrNull(member.isAccountable),
      isBornInCovenant: toBoolOrNull(member.isBornInCovenant),
      isDivorced: toBoolOrNull(member.isDivorced),
      isMarried: toBoolOrNull(member.isMarried),
      marriageDate: member.marriageDate,
      marriageStatus: member.marriageStatus,
      endowmentStatus: member.endowmentStatus,
      endowmentDate: member.endowmentDate,
      templeRecommendStatus: member.templeRecommendStatus,
      templeRecommendExpirationDate: member.templeRecommendExpirationDate,
      templeRecommendType: member.templeRecommendType,
      missionStatus: member.missionStatus,
      missionLanguage: member.missionLanguage,
      missionCountry: member.missionCountry,
      priesthoodType: member.priesthoodType,
      priesthoodOffice: member.priesthoodOffice,
      ordinationDate: member.ordinationDate,
      instituteStatus: member.instituteStatus,
      seminaryStatus: member.seminaryStatus,
      isAttendingSeminary: toBoolOrNull(member.isAttendingSeminary),
      isAttendingInstitute: toBoolOrNull(member.isAttendingInstitute),
      potentialInstituteStudent: toBoolOrNull(member.potentialInstituteStudent),
      potentialSeminaryStudent: toBoolOrNull(member.potentialSeminaryStudent),
      ministeringBrothers: member.ministeringBrothers,
      ministeringSisters: member.ministeringSisters,
      spouseName: member.spouseName,
      headOfHouse: member.headOfHouse,
      householdPosition: member.householdPosition,
      sealingToParents: member.sealingToParents,
      sealingToSpouse: member.sealingToSpouse,
      householdId: member.householdId,
      householdName: member.householdName,
      addressLine1: member.addressLine1,
      addressLine2: member.addressLine2,
      city: member.city,
      stateOrProvince: member.stateOrProvince,
      postalCode: member.postalCode,
      country: member.country,
      emails,
      phoneNumbers,
      currentCallings,
      householdMembers: householdRows.map((row) => ({
        ...row,
        relationshipHint: row.lcrMemberId === lcrMemberId ? "Self" : row.householdPosition ?? "Household"
      }))
    };
  } finally {
    db.close();
  }
};

interface CommitteeRule {
  key: string;
  name: string;
  handbookBasis: string;
  handbookUrl: string;
  patterns: RegExp[];
}

const stakePresidentPattern = /\bstake president\b/i;
const stakePresidencyCounselorPattern = /\bstake (?:presidency\s+)?(?:first|1st|second|2nd)\s+couns(?:e|ou)lor\b/i;
const stakePresidentCounselorPattern = /\bstake president(?:\s+(?:first|1st|second|2nd)\s+couns(?:e|ou)lor)\b/i;

const committeeRules: CommitteeRule[] = [
  {
    key: "stake-presidency-meeting",
    name: "Stake Presidency Meeting",
    handbookBasis: "General Handbook 29.3.1",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [
      stakePresidentPattern,
      stakePresidencyCounselorPattern,
      stakePresidentCounselorPattern,
      /\bstake clerk\b/i,
      /\bstake executive secretary\b/i
    ]
  },
  {
    key: "stake-council",
    name: "Stake Council",
    handbookBasis: "General Handbook 29.3.5",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [
      stakePresidentPattern,
      stakePresidencyCounselorPattern,
      stakePresidentCounselorPattern,
      /\bhigh council(or)?\b/i,
      /\bstake clerk\b/i,
      /\bstake executive secretary\b/i,
      /\bstake relief society president\b/i,
      /\bstake young women president\b/i,
      /\bstake primary president\b/i,
      /\bstake young men president\b/i,
      /\bstake sunday school president\b/i,
      /\bstake young single adult\b/i,
      /\bstake single adult\b/i
    ]
  },
  {
    key: "stake-adult-leadership-committee",
    name: "Stake Adult Leadership Committee",
    handbookBasis: "General Handbook 29.3.8",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [
      stakePresidentPattern,
      stakePresidencyCounselorPattern,
      stakePresidentCounselorPattern,
      /\bstake relief society (president|counselor|secretary)\b/i,
      /\bhigh council(or)?\b/i
    ]
  },
  {
    key: "stake-youth-leadership-committee",
    name: "Stake Youth Leadership Committee",
    handbookBasis: "General Handbook 29.3.9",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [
      stakePresidentPattern,
      stakePresidencyCounselorPattern,
      stakePresidentCounselorPattern,
      /\bstake young men (president|counselor|secretary)\b/i,
      /\bstake young women (president|counselor|secretary)\b/i
    ]
  },
  {
    key: "bishops-council",
    name: "Bishops' Council",
    handbookBasis: "General Handbook 29.3.10",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [
      stakePresidentPattern,
      stakePresidencyCounselorPattern,
      stakePresidentCounselorPattern,
      /\bbishop\b/i,
      /\bbranch president\b/i
    ]
  },
  {
    key: "high-council-meeting",
    name: "High Council Meeting",
    handbookBasis: "General Handbook 29.3.12",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/29-meetings-in-the-church?lang=eng",
    patterns: [
      stakePresidentPattern,
      stakePresidencyCounselorPattern,
      stakePresidentCounselorPattern,
      /\bhigh council(or)?\b/i,
      /\bstake clerk\b/i,
      /\bstake executive secretary\b/i
    ]
  },
  {
    key: "stake-single-adult-committee",
    name: "Stake Single Adult Committee",
    handbookBasis: "General Handbook 6.2.2.1",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/6-leadership-in-the-church?lang=eng",
    patterns: [/\bstake single adult\b/i, /\bstake young single adult\b/i]
  },
  {
    key: "stake-audit-committee",
    name: "Stake Audit Committee",
    handbookBasis: "General Handbook 6.2.1.3",
    handbookUrl:
      "https://www.churchofjesuschrist.org/study/manual/general-handbook/6-leadership-in-the-church?lang=eng",
    patterns: [/\bstake audit\b/i, /\baudit specialist\b/i]
  }
];

const dedupeCommitteeMembers = (rows: CommitteeMemberRow[]) => {
  const seen = new Set<string>();
  const output: CommitteeMemberRow[] = [];
  for (const row of rows) {
    const key = `${row.lcrMemberId}:${cleanCallingTitle(row.callingTitle).toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(row);
  }
  return output;
};

export const getCommitteeRosters = async (): Promise<CommitteeRoster[]> => {
  const db = openSqliteSpikeDb();
  try {
    const rosterRows = db.prepare(
      `
      SELECT
        m.lcr_member_id AS lcrMemberId,
        ${fullNameExpr} AS fullName,
        ${unitNameExpr()} AS unitName,
        c.title AS callingTitle,
        c.sustained_on AS sustainedOn,
        m.primary_email AS email
      FROM callings c
      JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
      ORDER BY unitName, m.last_name, m.first_name
      `
    ).all() as CommitteeMemberRow[];

    const cleanedRosterRows = rosterRows.map((row) => ({
      ...row,
      callingTitle: cleanCallingTitle(row.callingTitle)
    }));

    return committeeRules.map((rule) => {
      const members = cleanedRosterRows.filter((row) => rule.patterns.some((pattern) => pattern.test(row.callingTitle)));

      return {
        key: rule.key,
        name: rule.name,
        handbookBasis: rule.handbookBasis,
        handbookUrl: rule.handbookUrl,
        members: dedupeCommitteeMembers(members)
      };
    });
  } finally {
    db.close();
  }
};

export const getCommitteeContactList = async (options: CommitteeContactListOptions = {}) => {
  const committeeFilter = options.committee?.trim().toLowerCase() ?? "";
  const unitFilter = options.unit?.trim().toLowerCase() ?? "";
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "committee";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));

  const rosters = await getCommitteeRosters();
  const selectedRosters = rosters.filter((roster) => {
    if (!committeeFilter) {
      return true;
    }
    return (
      roster.key.toLowerCase().includes(committeeFilter) ||
      roster.name.toLowerCase().includes(committeeFilter) ||
      roster.handbookBasis.toLowerCase().includes(committeeFilter)
    );
  });

  const flattened = selectedRosters.flatMap((roster) =>
    roster.members.map<CommitteeContactRow>((member) => ({
      committeeKey: roster.key,
      committeeName: roster.name,
      fullName: member.fullName,
      unitName: member.unitName,
      committeeRole: inferCommitteeRole(member.callingTitle),
      callingTitle: member.callingTitle,
      phoneNumber: null,
      email: member.email ?? null
    }))
  );

  const filtered = flattened.filter((row) => (unitFilter ? (row.unitName ?? "").toLowerCase().includes(unitFilter) : true));
  if (filtered.length === 0) {
    return [];
  }

  // Enrich with phone contact
  const db = openSqliteSpikeDb();
  try {
    const uniqueNames = Array.from(new Set(filtered.map((row) => row.fullName)));
    const placeholders = uniqueNames.map(() => "?").join(",");
    const contactRows = db.prepare(
      `
      SELECT
        ${fullNameExpr} AS fullName,
        m.primary_phone AS phoneNumber,
        m.primary_email AS email
      FROM members m
      WHERE ${fullNameExpr} IN (${placeholders})
      `
    ).all(...uniqueNames) as Array<{ fullName: string; phoneNumber: string | null; email: string | null }>;

    const contactMap = new Map<string, { phoneNumber: string | null; email: string | null }>();
    for (const row of contactRows) {
      if (!contactMap.has(row.fullName)) {
        contactMap.set(row.fullName, { phoneNumber: row.phoneNumber, email: row.email });
      }
    }

    const enriched = filtered.map((row) => ({
      ...row,
      phoneNumber: contactMap.get(row.fullName)?.phoneNumber ?? null,
      email: row.email ?? contactMap.get(row.fullName)?.email ?? null
    }));

    const deduped = dedupeRows(
      enriched,
      (row) => `${row.committeeKey}:${row.fullName.toLowerCase()}:${row.callingTitle.toLowerCase()}`
    );

    const sorted = [...deduped].sort((left, right) => {
      if (sortBy === "name") {
        return compareNullable(left.fullName, right.fullName, direction);
      }
      if (sortBy === "unit") {
        return compareNullable(left.unitName, right.unitName, direction);
      }
      if (sortBy === "role") {
        return compareNullable(left.committeeRole, right.committeeRole, direction);
      }
      return compareNullable(left.committeeName, right.committeeName, direction);
    });

    return sorted.slice(0, safeLimit);
  } finally {
    db.close();
  }
};

export const getDashboardUnits = async () => {
  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(
      `
      SELECT DISTINCT ${unitNameExpr()} AS unitName
      FROM members m
      WHERE ${unitNameExpr()} IS NOT NULL
        AND ${unitNameExpr()} <> 'Unknown'
      ORDER BY 1
      `
    ).all() as Array<{ unitName: string }>;

    return rows.map((row) => row.unitName);
  } finally {
    db.close();
  }
};

export const getStakeOverview = async (unit?: string | null) => {
  const unitScope = normalizeUnitScope(unit);
  const db = openSqliteSpikeDb();
  try {
    const unitCondition = unitScope ? `AND ${unitNameExpr()} = ?` : "";
    const params: unknown[] = unitScope ? [unitScope] : [];

    const memberCount = (db.prepare(
      `SELECT COUNT(*) AS count FROM members m WHERE 1=1 ${unitCondition}`
    ).get(...params) as { count: number }).count;

    const callingCount = (db.prepare(
      `
      SELECT COUNT(*) AS count
      FROM callings c
      LEFT JOIN members m ON c.lcr_member_id = m.lcr_member_id
      WHERE c.released_on IS NULL AND c.is_current = 1
        AND c.lcr_member_id IS NOT NULL
        ${unitCondition ? unitCondition.replace('m.', 'c.').replace(unitNameExpr(), `COALESCE(NULLIF(c.unit_name, ''), 'Unknown')`) : ""}
      `
    ).get(...(unitScope ? [unitScope] : [])) as { count: number }).count;

    const callingCoverage = db.prepare(
      `
      SELECT
        COUNT(CASE WHEN EXISTS (SELECT 1 FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id) THEN 1 END) AS withCurrentCalling,
        COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM ${currentCallingSql} AND c.lcr_member_id = m.lcr_member_id) THEN 1 END) AS withoutCurrentCalling
      FROM members m
      WHERE 1=1 ${unitCondition}
      `
    ).get(...params) as { withCurrentCalling: number; withoutCurrentCalling: number };

    const latestSync = db.prepare(
      `
      SELECT
        sync_type AS syncType,
        status,
        completed_at AS completedAt
      FROM sync_logs
      WHERE status = 'success'
        AND sync_type IN ('nightly_full_directory_sync', 'hourly_calling_sync')
      ORDER BY started_at DESC
      LIMIT 1
      `
    ).get() as { syncType: string; status: string; completedAt: string | null } | undefined;

    return {
      totalMembers: memberCount,
      currentCallings: callingCount,
      membersWithCurrentCalling: callingCoverage.withCurrentCalling,
      membersWithoutCurrentCalling: callingCoverage.withoutCurrentCalling,
      latestSync: latestSync ?? null
    };
  } finally {
    db.close();
  }
};

export const closePool = async () => {
  // No-op for SQLite (connections are opened/closed per call)
};

// ── Shared helpers ─────────────────────────────────────────────────────────────

const splitMinisteringNames = (value: string | null): string[] =>
  (value ?? "")
    .split("/")
    .map((n) => n.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const memberLookupSql = (alias = "m") => `
  SELECT
    ${alias}.lcr_member_id AS lcrMemberId,
    TRIM(COALESCE(NULLIF(${alias}.preferred_name, ''), ${alias}.first_name) || ' ' || ${alias}.last_name) AS fullName,
    TRIM(${alias}.first_name || ' ' || ${alias}.last_name) AS legalFullName,
    ${unitNameExpr(alias)} AS unitName
  FROM members ${alias}
`;

// ── ministering_assignments ────────────────────────────────────────────────────

export interface MinisteringAssignmentResult {
  query: string;
  matched: boolean;
  member?: { lcrMemberId: string; fullName: string; unitName: string | null };
  ministeringBrothers: string[];
  ministeringSisters: string[];
  candidates?: Array<{ lcrMemberId: string; fullName: string; unitName: string | null }>;
  note?: string;
}

export async function getMinisteringAssignments(member: string): Promise<MinisteringAssignmentResult> {
  const search = member.trim();
  const base: MinisteringAssignmentResult = { query: search, matched: false, ministeringBrothers: [], ministeringSisters: [] };
  if (!search) return { ...base, note: "No member name or LCR id provided." };

  const db = openSqliteSpikeDb();
  try {
    const like = `%${search.replace(/\s+/g, "%")}%`;
    const rows = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        TRIM(m.first_name || ' ' || m.last_name) AS legalFullName,
        ${unitNameExpr()} AS unitName,
        m.ministering_brothers AS ministeringBrothers,
        m.ministering_sisters AS ministeringSisters
      FROM members m
      WHERE m.lcr_member_id = @search
         OR LOWER(TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name)) = LOWER(@search)
         OR LOWER(TRIM(m.first_name || ' ' || m.last_name)) = LOWER(@search)
         OR (COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) LIKE @like
         OR (m.first_name || ' ' || m.last_name) LIKE @like
      ORDER BY
        (m.lcr_member_id = @search) DESC,
        (LOWER(TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name)) = LOWER(@search)) DESC
      LIMIT 25
    `).all({ search, like }) as Array<{
      lcrMemberId: string; fullName: string; legalFullName: string;
      unitName: string | null; ministeringBrothers: string | null; ministeringSisters: string | null;
    }>;

    if (rows.length === 0) return { ...base, note: "No member matched that name or id." };

    const top = rows[0];
    const exact =
      top.lcrMemberId === search ||
      top.fullName.toLowerCase() === search.toLowerCase() ||
      top.legalFullName.toLowerCase() === search.toLowerCase();

    if (!exact && rows.length > 1) {
      return {
        ...base,
        note: `Multiple members matched "${search}". Re-run with a full name or LCR id.`,
        candidates: rows.map((r) => ({ lcrMemberId: r.lcrMemberId, fullName: r.fullName, unitName: r.unitName }))
      };
    }

    const brothers = splitMinisteringNames(top.ministeringBrothers);
    const sisters = splitMinisteringNames(top.ministeringSisters);
    return {
      query: search,
      matched: true,
      member: { lcrMemberId: top.lcrMemberId, fullName: top.fullName, unitName: top.unitName },
      ministeringBrothers: brothers,
      ministeringSisters: sisters,
      note: brothers.length === 0 && sisters.length === 0
        ? "No ministering brothers or sisters on record for this member."
        : undefined
    };
  } finally {
    db.close();
  }
}

// ── reverse_ministering_lookup ─────────────────────────────────────────────────

export interface ReverseMinisteringResult {
  query: string;
  matched: boolean;
  minister?: { lcrMemberId: string; fullName: string; unitName: string | null };
  assignedTo: Array<{ lcrMemberId: string; fullName: string; unitName: string | null; type: "brother" | "sister" }>;
  candidates?: Array<{ lcrMemberId: string; fullName: string; unitName: string | null }>;
  note?: string;
}

export async function getReverseMinisteringLookup(member: string): Promise<ReverseMinisteringResult> {
  const search = member.trim();
  const base: ReverseMinisteringResult = { query: search, matched: false, assignedTo: [] };
  if (!search) return { ...base, note: "No member name or LCR id provided." };

  const db = openSqliteSpikeDb();
  try {
    // First resolve the minister
    const like = `%${search.replace(/\s+/g, "%")}%`;
    const candidates = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        TRIM(m.first_name || ' ' || m.last_name) AS legalFullName,
        ${unitNameExpr()} AS unitName
      FROM members m
      WHERE m.lcr_member_id = @search
         OR LOWER(TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name)) = LOWER(@search)
         OR LOWER(TRIM(m.first_name || ' ' || m.last_name)) = LOWER(@search)
         OR (COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) LIKE @like
         OR (m.first_name || ' ' || m.last_name) LIKE @like
      ORDER BY
        (m.lcr_member_id = @search) DESC,
        (LOWER(TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name)) = LOWER(@search)) DESC
      LIMIT 25
    `).all({ search, like }) as Array<{ lcrMemberId: string; fullName: string; legalFullName: string; unitName: string | null }>;

    if (candidates.length === 0) return { ...base, note: "No member matched that name or id." };

    const top = candidates[0];
    const exact =
      top.lcrMemberId === search ||
      top.fullName.toLowerCase() === search.toLowerCase() ||
      top.legalFullName.toLowerCase() === search.toLowerCase();

    if (!exact && candidates.length > 1) {
      return {
        ...base,
        note: `Multiple members matched "${search}". Re-run with a full name or LCR id.`,
        candidates: candidates.map((r) => ({ lcrMemberId: r.lcrMemberId, fullName: r.fullName, unitName: r.unitName }))
      };
    }

    const name = top.fullName;

    // Scan all members whose ministering_brothers or ministering_sisters contains this name
    const brotherMatches = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        ${unitNameExpr()} AS unitName
      FROM members m
      WHERE m.ministering_brothers LIKE @pat
      ORDER BY fullName
    `).all({ pat: `%${name}%` }) as Array<{ lcrMemberId: string; fullName: string; unitName: string | null }>;

    const sisterMatches = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        ${unitNameExpr()} AS unitName
      FROM members m
      WHERE m.ministering_sisters LIKE @pat
      ORDER BY fullName
    `).all({ pat: `%${name}%` }) as Array<{ lcrMemberId: string; fullName: string; unitName: string | null }>;

    const assignedTo = [
      ...brotherMatches.map((r) => ({ ...r, type: "brother" as const })),
      ...sisterMatches.map((r) => ({ ...r, type: "sister" as const }))
    ];

    return {
      query: search,
      matched: true,
      minister: { lcrMemberId: top.lcrMemberId, fullName: top.fullName, unitName: top.unitName },
      assignedTo,
      note: assignedTo.length === 0 ? "No households found assigned to this minister." : undefined
    };
  } finally {
    db.close();
  }
}

// ── member_profile (360 card) ──────────────────────────────────────────────────

export interface MemberProfileResult {
  query: string;
  matched: boolean;
  profile?: {
    lcrMemberId: string;
    fullName: string;
    unitName: string | null;
    age: number | null;
    birthdate: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    isConvert: boolean;
    isReturnedMissionary: boolean;
    templeRecommendStatus: string | null;
    callings: Array<{ title: string; organization: string | null; sustainedOn: string | null }>;
    spouse: { fullName: string; email: string | null; phone: string | null } | null;
    ministeringBrothers: string[];
    ministeringSisters: string[];
  };
  candidates?: Array<{ lcrMemberId: string; fullName: string; unitName: string | null }>;
  note?: string;
}

export async function getMemberProfile(member: string): Promise<MemberProfileResult> {
  const search = member.trim();
  const base: MemberProfileResult = { query: search, matched: false };
  if (!search) return { ...base, note: "No member name or LCR id provided." };

  const db = openSqliteSpikeDb();
  try {
    const like = `%${search.replace(/\s+/g, "%")}%`;
    const candidates = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        TRIM(m.first_name || ' ' || m.last_name) AS legalFullName,
        ${unitNameExpr()} AS unitName,
        m.id AS internalId,
        m.household_id AS householdId,
        m.age,
        m.birthdate,
        m.primary_email AS primaryEmail,
        m.primary_phone AS primaryPhone,
        m.is_convert AS isConvert,
        m.is_returned_missionary AS isReturnedMissionary,
        m.temple_recommend_status AS templeRecommendStatus,
        m.ministering_brothers AS ministeringBrothers,
        m.ministering_sisters AS ministeringSisters
      FROM members m
      WHERE m.lcr_member_id = @search
         OR LOWER(TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name)) = LOWER(@search)
         OR LOWER(TRIM(m.first_name || ' ' || m.last_name)) = LOWER(@search)
         OR (COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) LIKE @like
         OR (m.first_name || ' ' || m.last_name) LIKE @like
      ORDER BY
        (m.lcr_member_id = @search) DESC,
        (LOWER(TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name)) = LOWER(@search)) DESC
      LIMIT 25
    `).all({ search, like }) as Array<{
      lcrMemberId: string; fullName: string; legalFullName: string; unitName: string | null;
      internalId: number; householdId: number | null; age: number | null; birthdate: string | null;
      primaryEmail: string | null; primaryPhone: string | null;
      isConvert: number | null; isReturnedMissionary: number | null; templeRecommendStatus: string | null;
      ministeringBrothers: string | null; ministeringSisters: string | null;
    }>;

    if (candidates.length === 0) return { ...base, note: "No member matched that name or id." };

    const top = candidates[0];
    const exact =
      top.lcrMemberId === search ||
      top.fullName.toLowerCase() === search.toLowerCase() ||
      top.legalFullName.toLowerCase() === search.toLowerCase();

    if (!exact && candidates.length > 1) {
      return {
        ...base,
        note: `Multiple members matched "${search}". Re-run with a full name or LCR id.`,
        candidates: candidates.map((r) => ({ lcrMemberId: r.lcrMemberId, fullName: r.fullName, unitName: r.unitName }))
      };
    }

    // Callings
    const callings = db.prepare(`
      SELECT c.title, c.organization, c.sustained_on AS sustainedOn
      FROM callings c
      WHERE c.lcr_member_id = ? AND c.released_on IS NULL AND c.is_current = 1
      ORDER BY c.sustained_on DESC
    `).all(top.lcrMemberId) as Array<{ title: string; organization: string | null; sustainedOn: string | null }>;

    // Spouse
    let spouse: { fullName: string; email: string | null; phone: string | null } | null = null;
    if (top.householdId) {
      const spouseRow = db.prepare(`
        SELECT
          TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
          m.primary_email AS email,
          m.primary_phone AS phone
        FROM members m
        WHERE m.household_id = ? AND m.id <> ?
        LIMIT 1
      `).get(top.householdId, top.internalId) as { fullName: string; email: string | null; phone: string | null } | undefined;
      if (spouseRow) spouse = spouseRow;
    }

    return {
      query: search,
      matched: true,
      profile: {
        lcrMemberId: top.lcrMemberId,
        fullName: top.fullName,
        unitName: top.unitName,
        age: top.age,
        birthdate: top.birthdate,
        primaryEmail: top.primaryEmail,
        primaryPhone: top.primaryPhone,
        isConvert: Boolean(top.isConvert),
        isReturnedMissionary: Boolean(top.isReturnedMissionary),
        templeRecommendStatus: top.templeRecommendStatus,
        callings,
        spouse,
        ministeringBrothers: splitMinisteringNames(top.ministeringBrothers),
        ministeringSisters: splitMinisteringNames(top.ministeringSisters)
      }
    };
  } finally {
    db.close();
  }
}

// ── upcoming_birthdays ─────────────────────────────────────────────────────────

export interface UpcomingBirthdayResult {
  windowDays: number;
  unit: string | null;
  minAge: number | null;
  maxAge: number | null;
  members: Array<{
    lcrMemberId: string;
    fullName: string;
    unitName: string | null;
    birthdate: string;
    age: number | null;
    turningAge: number | null;
    daysUntil: number;
  }>;
}

export async function getUpcomingBirthdays(
  windowDays = 30,
  unit?: string | null,
  minAge?: number | null,
  maxAge?: number | null
): Promise<UpcomingBirthdayResult> {
  const db = openSqliteSpikeDb();
  try {
    const today = new Date();
    const todayMD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + windowDays);
    const endMD = `${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const conditions: string[] = ["m.birthdate IS NOT NULL", "m.birthdate <> ''"];
    const params: Record<string, unknown> = { todayMD, endMD };

    if (unit) {
      conditions.push(`${unitNameExpr()} = @unit`);
      params.unit = unit;
    }
    if (minAge != null) {
      conditions.push("m.age >= @minAge");
      params.minAge = minAge;
    }
    if (maxAge != null) {
      conditions.push("m.age <= @maxAge");
      params.maxAge = maxAge;
    }

    const where = conditions.map((c) => `AND ${c}`).join("\n        ");

    const rows = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        ${unitNameExpr()} AS unitName,
        m.birthdate,
        m.age,
        SUBSTR(m.birthdate, 6, 5) AS birthdayMD
      FROM members m
      WHERE 1=1
        ${where}
    `).all(params) as Array<{
      lcrMemberId: string; fullName: string; unitName: string | null;
      birthdate: string; age: number | null; birthdayMD: string;
    }>;

    const todayTime = today.getTime();
    const thisYear = today.getFullYear();

    const withDays = rows
      .map((r) => {
        const [mm, dd] = r.birthdayMD.split("-").map(Number);
        let candidate = new Date(thisYear, mm - 1, dd);
        if (candidate.getTime() < todayTime) candidate = new Date(thisYear + 1, mm - 1, dd);
        const daysUntil = Math.round((candidate.getTime() - todayTime) / 86400000);
        const birthYear = Number(r.birthdate.substring(0, 4));
        const turningAge = candidate.getFullYear() - birthYear;
        return { ...r, daysUntil, turningAge };
      })
      .filter((r) => r.daysUntil <= windowDays)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      windowDays,
      unit: unit ?? null,
      minAge: minAge ?? null,
      maxAge: maxAge ?? null,
      members: withDays.map(({ lcrMemberId, fullName, unitName, birthdate, age, turningAge, daysUntil }) => ({
        lcrMemberId, fullName, unitName, birthdate, age, turningAge, daysUntil
      }))
    };
  } finally {
    db.close();
  }
}

// ── unit_ministering_coverage ──────────────────────────────────────────────────

export interface UnitMinisteringCoverageResult {
  unit: string;
  totalHouseholds: number;
  assignedBrothers: number;
  assignedSisters: number;
  unassignedBrothers: number;
  unassignedSisters: number;
  households: Array<{
    lcrMemberId: string;
    fullName: string;
    ministeringBrothers: string[];
    ministeringSisters: string[];
    hasBrothers: boolean;
    hasSisters: boolean;
  }>;
}

export async function getUnitMinisteringCoverage(unit: string): Promise<UnitMinisteringCoverageResult | { error: string }> {
  if (!unit?.trim()) return { error: "A unit name is required." };

  const db = openSqliteSpikeDb();
  try {
    const rows = db.prepare(`
      SELECT
        m.lcr_member_id AS lcrMemberId,
        TRIM(COALESCE(NULLIF(m.preferred_name, ''), m.first_name) || ' ' || m.last_name) AS fullName,
        m.ministering_brothers AS ministeringBrothers,
        m.ministering_sisters AS ministeringSisters,
        m.has_ministering_brothers AS hasMinisteringBrothers,
        m.has_ministering_sisters AS hasMinisteringSisters
      FROM members m
      WHERE ${unitNameExpr()} = @unit
      ORDER BY m.last_name, m.first_name
    `).all({ unit: unit.trim() }) as Array<{
      lcrMemberId: string; fullName: string;
      ministeringBrothers: string | null; ministeringSisters: string | null;
      hasMinisteringBrothers: number | null; hasMinisteringSisters: number | null;
    }>;

    const households = rows.map((r) => ({
      lcrMemberId: r.lcrMemberId,
      fullName: r.fullName,
      ministeringBrothers: splitMinisteringNames(r.ministeringBrothers),
      ministeringSisters: splitMinisteringNames(r.ministeringSisters),
      hasBrothers: Boolean(r.hasMinisteringBrothers),
      hasSisters: Boolean(r.hasMinisteringSisters)
    }));

    return {
      unit: unit.trim(),
      totalHouseholds: households.length,
      assignedBrothers: households.filter((h) => h.hasBrothers).length,
      assignedSisters: households.filter((h) => h.hasSisters).length,
      unassignedBrothers: households.filter((h) => !h.hasBrothers).length,
      unassignedSisters: households.filter((h) => !h.hasSisters).length,
      households
    };
  } finally {
    db.close();
  }
}
