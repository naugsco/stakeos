import { differenceInYears } from "date-fns";
import { pool, query } from "@/src/db/pool";
import { env } from "@/src/config/env";

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

const fullNameExpr = `TRIM(CONCAT(m.first_name, ' ', m.last_name))`;

const actualAgeSql = (alias = "m") => `COALESCE(${alias}.age, EXTRACT(YEAR FROM AGE(NOW(), ${alias}.birthdate))::int)`;

// LCR youth program age starts on January 1 of the year a member turns 12.
const youthProgramAgeSql = (alias = "m") =>
  `CASE WHEN ${alias}.birthdate IS NOT NULL THEN EXTRACT(YEAR FROM CURRENT_DATE)::int - EXTRACT(YEAR FROM ${alias}.birthdate)::int ELSE ${actualAgeSql(alias)} END`;

const isYouthProgramSql = (alias = "m") => `(${youthProgramAgeSql(alias)} BETWEEN 12 AND 18)`;
// Seminary is approximated as freshman year of high school through age 18.
// Without an LCR grade-level field, we use youth-program age 14-18 rather than the broader 12-18 youth band.
const isSeminaryEligibleSql = (alias = "m") => `(${youthProgramAgeSql(alias)} BETWEEN 14 AND 18)`;
const isYsaSql = (alias = "m") => `(${actualAgeSql(alias)} BETWEEN 18 AND 35)`;
const isYouthOrYsaSql = (alias = "m") => `((${isYouthProgramSql(alias)}) OR (${isYsaSql(alias)}))`;
const isUnmarriedSql = (alias = "m") =>
  `(COALESCE(${alias}.is_married, false) = false AND (COALESCE(${alias}.is_single, false) = true OR COALESCE(${alias}.marriage_status, '') ~* '^single$'))`;

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

export const getCallingMembers = async (callingText: string) => {
  const result = await query<CallingMember>(
    `
    SELECT
      m.id AS "memberId",
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      e.email,
      p.phone_number AS "phoneNumber",
      c.title AS "callingTitle",
      o.name AS "organizationName",
      c.sustained_on::text AS "sustainedOn"
    FROM current_callings_dedup c
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN organizations o ON c.organization_id = o.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE c.title ILIKE $1
       OR o.name ILIKE $1
    ORDER BY m.last_name NULLS LAST, m.first_name NULLS LAST
    `,
    [`%${callingText}%`]
  );

  return dedupeRows(
    result.rows.map((row) => ({
      ...row,
      callingTitle: cleanCallingTitle(row.callingTitle)
    })),
    (row) => `${row.lcrMemberId}:${row.callingTitle.toLowerCase()}`
  );
};

export const getSpouse = async (memberSearch: string): Promise<SpouseResult | null> => {
  const memberResult = await query<{
    id: number;
    householdId: number | null;
    fullName: string;
  }>(
    `
    SELECT
      m.id,
      m.household_id AS "householdId",
      ${fullNameExpr} AS "fullName"
    FROM members m
    WHERE m.lcr_member_id = $1 OR ${fullNameExpr} ILIKE $2
    ORDER BY CASE WHEN m.lcr_member_id = $1 THEN 0 ELSE 1 END
    LIMIT 1
    `,
    [memberSearch, `%${memberSearch}%`]
  );

  if (!memberResult.rows[0]) {
    return null;
  }

  const member = memberResult.rows[0];
  if (!member.householdId) {
    return {
      member: member.fullName,
      spouse: null,
      spouseEmail: null,
      spousePhone: null
    };
  }

  const spouseResult = await query<{
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  }>(
    `
    SELECT
      ${fullNameExpr} AS "fullName",
      e.email,
      p.phone_number AS "phoneNumber"
    FROM members m
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE m.household_id = $1
      AND m.id <> $2
    ORDER BY m.age DESC NULLS LAST
    LIMIT 1
    `,
    [member.householdId, member.id]
  );

  const spouse = spouseResult.rows[0];
  return {
    member: member.fullName,
    spouse: spouse?.fullName ?? null,
    spouseEmail: spouse?.email ?? null,
    spousePhone: spouse?.phoneNumber ?? null
  };
};

export const yearsInCalling = async (callingTitle: string, memberName?: string) => {
  const result = await query<{
    fullName: string;
    callingTitle: string;
    sustainedOn: string | null;
  }>(
    `
    SELECT
      ${fullNameExpr} AS "fullName",
      c.title AS "callingTitle",
      c.sustained_on::text AS "sustainedOn"
    FROM current_callings_dedup c
    LEFT JOIN members m ON c.member_id = m.id
    WHERE c.title ILIKE $1
      AND ($2::text IS NULL OR ${fullNameExpr} ILIKE $2)
    ORDER BY c.sustained_on ASC NULLS LAST
    `,
    [`%${callingTitle}%`, memberName ? `%${memberName}%` : null]
  );

  return dedupeRows(
    result.rows.map((row) => ({
      ...row,
      callingTitle: cleanCallingTitle(row.callingTitle),
      years: row.sustainedOn ? differenceInYears(new Date(), new Date(row.sustainedOn)) : null
    })),
    (row) => `${row.fullName}:${row.callingTitle.toLowerCase()}`
  );
};

export const missionEligibleMembers = async (ageMin = 18, ageMax = 25) => {
  const result = await query<MissionEligibleRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS "unitName",
      COALESCE(NULLIF(m.unit_abbreviation, ''), u.name, 'Unknown') AS "unitAbbreviation",
      m.gender,
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.birthdate::text,
      m.mission_status AS "missionStatus",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.is_attending_seminary AS "isAttendingSeminary",
      m.is_attending_institute AS "isAttendingInstitute",
      e.email,
      p.phone_number AS "phoneNumber",
      c.title AS "currentCalling"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN $1 AND $2
      AND (m.member_status IS NULL OR m.member_status ILIKE 'active%')
      AND COALESCE(m.is_returned_missionary, false) = false
      AND NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') IS NULL
      AND NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') IS NULL
    ORDER BY m.age DESC NULLS LAST, m.last_name, m.first_name
    `,
    [ageMin, ageMax]
  );

  return result.rows.map((row) => ({
    ...row,
    currentCalling: cleanCallingTitle(row.currentCalling)
  }));
};

export const getCurrentlyServingMissionaries = async (): Promise<CurrentlyServingMissionaryRow[]> => {
  const result = await query<CurrentlyServingMissionaryRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS "unitName",
      m.gender,
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.mission_country AS "missionCountry",
      m.mission_status AS "missionStatus",
      m.temple_recommend_status AS "templeRecommendStatus",
      e.email,
      p.phone_number AS "phoneNumber",
      c.title AS "currentCalling"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    WHERE
      NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') IS NOT NULL
      OR (
        NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') IS NOT NULL
        AND COALESCE(m.is_returned_missionary, false) = false
      )
    ORDER BY age DESC NULLS LAST, m.last_name, m.first_name
    LIMIT 500
    `
  );

  return result.rows.map((row) => ({
    ...row,
    currentCalling: cleanCallingTitle(row.currentCalling)
  }));
};

const missionEligibleOrderBy: Record<`${MissionEligibleSortBy}_${MissionEligibleSortDirection}`, string> = {
  unit_age_asc:
    `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, ` +
    `COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) ASC NULLS LAST, ` +
    `m.last_name ASC, m.first_name ASC`,
  unit_age_desc:
    `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, ` +
    `COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) DESC NULLS LAST, ` +
    `m.last_name ASC, m.first_name ASC`,
  age_asc:
    `COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) ASC NULLS LAST, ` +
    `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`,
  age_desc:
    `COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) DESC NULLS LAST, ` +
    `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`,
  unit_asc: `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') ASC, m.last_name ASC, m.first_name ASC`,
  unit_desc: `COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') DESC, m.last_name ASC, m.first_name ASC`,
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
  const orderBy = missionEligibleOrderBy[orderKey] ?? missionEligibleOrderBy.unit_age_asc;

  const result = await query<MissionEligibleRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS "unitName",
      COALESCE(NULLIF(m.unit_abbreviation, ''), u.name, 'Unknown') AS "unitAbbreviation",
      m.gender,
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.birthdate::text,
      m.mission_status AS "missionStatus",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.is_attending_seminary AS "isAttendingSeminary",
      m.is_attending_institute AS "isAttendingInstitute",
      e.email,
      p.phone_number AS "phoneNumber",
      c.title AS "currentCalling"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN $1 AND $2
      AND (m.member_status IS NULL OR m.member_status ILIKE 'active%')
      AND COALESCE(m.is_returned_missionary, false) = false
      AND NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') IS NULL
      AND NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') IS NULL
      AND ($3::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $3)
      AND ($4::text IS NULL OR COALESCE(m.gender, '') ILIKE $4)
      AND ($5::boolean = FALSE OR p.phone_number IS NOT NULL)
    ORDER BY ${orderBy}
    LIMIT ${safeLimit}
    `,
    [ageMin, ageMax, unitFilter, genderFilter, requirePhone]
  );

  return result.rows.map((row) => ({
    ...row,
    currentCalling: cleanCallingTitle(row.currentCalling)
  }));
};

export const getLeadershipContactList = async (options: LeadershipContactListOptions = {}) => {
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const callingFilter = options.calling?.trim() ? `%${options.calling.trim()}%` : null;
  const includeSpouses = options.includeSpouses ?? true;
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "unit";

  const result = await query<LeadershipContactRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      c.title AS "callingTitle",
      o.name AS "organizationName",
      c.sustained_on::text AS "sustainedOn",
      p.phone_number AS "phoneNumber",
      e.email,
      CASE WHEN $3::boolean THEN sp."fullName" ELSE NULL END AS "spouseName",
      CASE WHEN $3::boolean THEN sp."phoneNumber" ELSE NULL END AS "spousePhone",
      CASE WHEN $3::boolean THEN sp.email ELSE NULL END AS "spouseEmail"
    FROM current_callings_dedup c
    JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN organizations o ON c.organization_id = o.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        TRIM(CONCAT(sm.first_name, ' ', sm.last_name)) AS "fullName",
        sp.phone_number AS "phoneNumber",
        se.email
      FROM members sm
      LEFT JOIN LATERAL (
        SELECT phone_number
        FROM phone_numbers
        WHERE member_id = sm.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) sp ON TRUE
      LEFT JOIN LATERAL (
        SELECT email
        FROM emails
        WHERE member_id = sm.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) se ON TRUE
      WHERE sm.household_id = m.household_id
        AND sm.id <> m.id
      ORDER BY ABS(COALESCE(sm.age, EXTRACT(YEAR FROM AGE(NOW(), sm.birthdate))::int) - COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int)) ASC NULLS LAST,
        sm.age DESC NULLS LAST,
        sm.last_name,
        sm.first_name
      LIMIT 1
    ) sp ON TRUE
    WHERE (
      c.title ~* '(president|bishop|high councilor)'
      OR COALESCE(o.name, '') ~* '(stake presidency|bishopric|high council|young women presidency|relief society presidency|elders quorum presidency|primary presidency|sunday school presidency)'
    )
      AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $1)
      AND ($2::text IS NULL OR c.title ILIKE $2 OR COALESCE(o.name, '') ILIKE $2)
    `
    ,
    [unitFilter, callingFilter, includeSpouses]
  );

  const rows = result.rows.map((row) => ({
    ...row,
    callingTitle: cleanCallingTitle(row.callingTitle)
  }));

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
};

export const getOrganizationContactList = async (options: OrganizationContactListOptions = {}) => {
  const organizationFilter = options.organization?.trim() ? `%${options.organization.trim()}%` : null;
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const callingFilter = options.calling?.trim() ? `%${options.calling.trim()}%` : null;
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "organization";

  const result = await query<OrganizationContactRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      o.name AS "organizationName",
      c.title AS "callingTitle",
      p.phone_number AS "phoneNumber",
      e.email
    FROM current_callings_dedup c
    JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN organizations o ON c.organization_id = o.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE ($1::text IS NULL OR COALESCE(o.name, '') ILIKE $1)
      AND ($2::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $2)
      AND ($3::text IS NULL OR c.title ILIKE $3)
    `
    ,
    [organizationFilter, unitFilter, callingFilter]
  );

  const rows = result.rows.map((row) => ({
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

  const result = await query<EndowmentReadinessContactRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.temple_endowed AS "templeEndowed",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.mission_status AS "missionStatus",
      c.title AS "currentCalling",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) >= $1
      AND COALESCE(m.temple_endowed, false) = false
      AND ($2::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $2)
      AND ($3::boolean = FALSE OR p.phone_number IS NOT NULL)
      AND ($4::boolean = FALSE OR COALESCE(m.temple_recommend_status, '') ILIKE 'active%')
    `
    ,
    [minAge, unitFilter, requirePhone, requireTempleRecommendActive]
  );

  const rows = result.rows.map((row) => ({
    ...row,
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
};

export const getYouthHouseholdContactList = async (options: YouthHouseholdContactListOptions = {}) => {
  const ageMin = options.ageMin ?? 12;
  const ageMax = options.ageMax ?? 18;
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const requireGuardianContact = options.requireGuardianContact ?? false;
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "unit";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));

  const result = await query<YouthHouseholdContactRow>(
    `
    SELECT
      y."youthLcrMemberId",
      y."youthName",
      y.age,
      y."unitName",
      y."youthPhone",
      y."youthEmail",
      COALESCE(g."parentGuardianNames", '') AS "parentGuardianNames",
      COALESCE(g."parentGuardianPhones", '') AS "parentGuardianPhones",
      COALESCE(g."parentGuardianEmails", '') AS "parentGuardianEmails"
    FROM (
      SELECT
        m.id AS "memberId",
        m.household_id AS "householdId",
        m.lcr_member_id AS "youthLcrMemberId",
        ${fullNameExpr} AS "youthName",
        COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        e.email AS "youthEmail",
        p.phone_number AS "youthPhone"
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      LEFT JOIN LATERAL (
        SELECT email
        FROM emails
        WHERE member_id = m.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) e ON TRUE
      LEFT JOIN LATERAL (
        SELECT phone_number
        FROM phone_numbers
        WHERE member_id = m.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) p ON TRUE
      WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN $1 AND $2
        AND (m.member_status IS NULL OR m.member_status ILIKE 'active%')
        AND ($3::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $3)
    ) y
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(TRIM(CONCAT(pm.first_name, ' ', pm.last_name)), ' | ' ORDER BY pm.last_name, pm.first_name) AS "parentGuardianNames",
        STRING_AGG(DISTINCT pp.phone_number, ' | ') AS "parentGuardianPhones",
        STRING_AGG(DISTINCT pe.email, ' | ') AS "parentGuardianEmails"
      FROM members pm
      LEFT JOIN LATERAL (
        SELECT phone_number
        FROM phone_numbers
        WHERE member_id = pm.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) pp ON TRUE
      LEFT JOIN LATERAL (
        SELECT email
        FROM emails
        WHERE member_id = pm.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) pe ON TRUE
      WHERE pm.household_id = y."householdId"
        AND pm.id <> y."memberId"
        AND COALESCE(pm.age, EXTRACT(YEAR FROM AGE(NOW(), pm.birthdate))::int) >= 18
    ) g ON TRUE
    WHERE ($4::boolean = FALSE OR COALESCE(g."parentGuardianPhones", '') <> '' OR COALESCE(g."parentGuardianEmails", '') <> '')
    `
    ,
    [ageMin, ageMax, unitFilter, requireGuardianContact]
  );

  const sorted = [...result.rows].sort((left, right) => {
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

  const result = await query<NewMemberContactRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      m.is_convert AS "convertFlag",
      m.move_in_date::text AS "moveInDate",
      c.title AS "callingTitle",
      p.phone_number AS "phoneNumber",
      e.email,
      (COALESCE(m.has_ministering_brothers, false) OR COALESCE(m.has_ministering_sisters, false)) AS "ministeringAssigned"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $1)
      AND (
        ($2::boolean = TRUE AND m.is_convert = true AND COALESCE(m.baptism_date, m.move_in_date) >= date_trunc('day', NOW()) - ($4::int || ' months')::interval)
        OR ($3::boolean = TRUE AND m.move_in_date IS NOT NULL AND m.move_in_date >= date_trunc('day', NOW()) - ($4::int || ' months')::interval)
      )
      AND ($5::boolean = FALSE OR e.email IS NOT NULL OR p.phone_number IS NOT NULL)
    `
    ,
    [unitFilter, includeConverts, includeMoveIns, monthsBack, requireContact]
  );

  const rows = result.rows.map((row) => ({
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
    return compareNullable(left.moveInDate, right.moveInDate, direction);
  });

  return sorted.slice(0, safeLimit);
};

export const getMissingContactDataList = async (options: MissingContactDataListOptions = {}) => {
  const unitFilter = options.unit?.trim() ? `%${options.unit.trim()}%` : null;
  const youthScope = options.youthOnly || options.includeAdults === false;
  const direction = resolveSortDirection(options.sortDirection);
  const sortBy = options.sortBy ?? "unit";
  const safeLimit = Math.max(1, Math.min(options.limit ?? 500, 5000));

  const result = await query<MissingContactDataRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      (COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN 11 AND 25) AS "youthFlag",
      (p.phone_number IS NULL) AS "missingPhone",
      (e.email IS NULL) AS "missingEmail",
      (
        COALESCE(NULLIF(m.address_line1, ''), NULLIF(h.address_line1, '')) IS NULL
        OR COALESCE(NULLIF(m.address_city, ''), NULLIF(h.city, '')) IS NULL
        OR COALESCE(NULLIF(m.address_postal_code, ''), NULLIF(h.postal_code, '')) IS NULL
      ) AS "missingAddress",
      c.title AS "callingTitle"
    FROM members m
    LEFT JOIN households h ON m.household_id = h.id
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $1)
      AND ($2::boolean = FALSE OR COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN 11 AND 25)
      AND (
        p.phone_number IS NULL
        OR e.email IS NULL
        OR COALESCE(NULLIF(m.address_line1, ''), NULLIF(h.address_line1, '')) IS NULL
        OR COALESCE(NULLIF(m.address_city, ''), NULLIF(h.city, '')) IS NULL
        OR COALESCE(NULLIF(m.address_postal_code, ''), NULLIF(h.postal_code, '')) IS NULL
      )
    `
    ,
    [unitFilter, youthScope]
  );

  const rows = result.rows.map((row) => ({
    ...row,
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
};

export const getHouseholdContactList = async (unit?: string, search?: string): Promise<HouseholdContactRow[]> => {
  const unitFilter = unit?.trim() ? `%${unit.trim()}%` : null;
  const searchFilter = search?.trim() ? `%${search.trim()}%` : null;

  const result = await query<HouseholdContactRow>(
    `
    SELECT
      h.id AS "householdId",
      COALESCE(NULLIF(h.household_name, ''), MAX(NULLIF(m.head_of_house, '')), 'Household') AS "householdName",
      COALESCE(MAX(NULLIF(m.unit_name, '')), MAX(u.name), 'Unknown') AS "unitName",
      MAX(NULLIF(m.head_of_house, '')) AS "headOfHouse",
      COUNT(DISTINCT m.id)::int AS "memberCount",
      STRING_AGG(DISTINCT ${fullNameExpr}, ' | ' ORDER BY ${fullNameExpr}) AS "memberNames",
      COALESCE(STRING_AGG(DISTINCT e.email, ' | ') FILTER (WHERE e.email IS NOT NULL), '') AS "emailList",
      COALESCE(STRING_AGG(DISTINCT p.phone_number, ' | ') FILTER (WHERE p.phone_number IS NOT NULL), '') AS "phoneList"
    FROM households h
    JOIN members m ON m.household_id = h.id
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $1)
      AND (
        $2::text IS NULL
        OR COALESCE(h.household_name, '') ILIKE $2
        OR COALESCE(m.head_of_house, '') ILIKE $2
        OR ${fullNameExpr} ILIKE $2
      )
    GROUP BY h.id, h.household_name
    ORDER BY "unitName", "householdName"
    LIMIT 5000
    `,
    [unitFilter, searchFilter]
  );

  return result.rows;
};

export const getHouseholdMembers = async (search: string) => {
  const householdResult = await query<{
    householdId: number;
    householdName: string;
    unitName: string;
    headOfHouse: string | null;
  }>(
    `
    SELECT DISTINCT ON (h.id)
      h.id AS "householdId",
      COALESCE(NULLIF(h.household_name, ''), NULLIF(m.head_of_house, ''), 'Household') AS "householdName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      m.head_of_house AS "headOfHouse"
    FROM households h
    JOIN members m ON m.household_id = h.id
    LEFT JOIN units u ON m.unit_id = u.id
    WHERE h.id::text = $1
      OR COALESCE(h.household_name, '') ILIKE $2
      OR COALESCE(m.head_of_house, '') ILIKE $2
      OR ${fullNameExpr} ILIKE $2
    ORDER BY h.id, m.last_name, m.first_name
    LIMIT 1
    `,
    [search, `%${search}%`]
  );

  const household = householdResult.rows[0];
  if (!household) {
    return null;
  }

  const [members, contacts] = await Promise.all([
    query<{
      lcrMemberId: string;
      fullName: string;
      age: number | null;
      gender: string | null;
      householdPosition: string | null;
      spouseName: string | null;
    }>(
      `
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
        m.gender,
        m.household_position AS "householdPosition",
        m.spouse_name AS "spouseName"
      FROM members m
      WHERE m.household_id = $1
      ORDER BY m.last_name, m.first_name
      `,
      [household.householdId]
    ),
    query<{ emailList: string; phoneList: string }>(
      `
      SELECT
        COALESCE(STRING_AGG(DISTINCT e.email, ' | ') FILTER (WHERE e.email IS NOT NULL), '') AS "emailList",
        COALESCE(STRING_AGG(DISTINCT p.phone_number, ' | ') FILTER (WHERE p.phone_number IS NOT NULL), '') AS "phoneList"
      FROM members m
      LEFT JOIN LATERAL (
        SELECT email
        FROM emails
        WHERE member_id = m.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) e ON TRUE
      LEFT JOIN LATERAL (
        SELECT phone_number
        FROM phone_numbers
        WHERE member_id = m.id
        ORDER BY is_primary DESC, updated_at DESC
        LIMIT 1
      ) p ON TRUE
      WHERE m.household_id = $1
      `,
      [household.householdId]
    )
  ]);

  return {
    ...household,
    emailList: contacts.rows[0]?.emailList ?? "",
    phoneList: contacts.rows[0]?.phoneList ?? "",
    members: members.rows
  };
};

export const getMarriedCouplesContactList = async (unit?: string): Promise<MarriedCoupleContactRow[]> => {
  const unitFilter = unit?.trim() ? `%${unit.trim()}%` : null;
  const result = await query<MarriedCoupleContactRow>(
    `
    SELECT
      h.id AS "householdId",
      COALESCE(NULLIF(h.household_name, ''), MAX(NULLIF(m.head_of_house, '')), 'Household') AS "householdName",
      COALESCE(MAX(NULLIF(m.unit_name, '')), MAX(u.name), 'Unknown') AS "unitName",
      STRING_AGG(
        ${fullNameExpr},
        ' & '
        ORDER BY CASE
          WHEN COALESCE(m.household_position, '') = 'Head of Household' THEN 0
          WHEN COALESCE(m.household_position, '') = 'Spouse of Head of House' THEN 1
          ELSE 2
        END,
        ${fullNameExpr}
      ) FILTER (
        WHERE COALESCE(m.is_married, false) = true OR COALESCE(m.spouse_name, '') <> ''
      ) AS "coupleNames",
      COALESCE(STRING_AGG(DISTINCT e.email, ' | ') FILTER (WHERE e.email IS NOT NULL), '') AS "emailList",
      COALESCE(STRING_AGG(DISTINCT p.phone_number, ' | ') FILTER (WHERE p.phone_number IS NOT NULL), '') AS "phoneList"
    FROM households h
    JOIN members m ON m.household_id = h.id
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $1)
    GROUP BY h.id, h.household_name
    HAVING COUNT(*) FILTER (WHERE COALESCE(m.is_married, false) = true OR COALESCE(m.spouse_name, '') <> '') >= 2
    ORDER BY "unitName", "householdName"
    LIMIT 5000
    `,
    [unitFilter]
  );

  return result.rows.filter((row) => Boolean(row.coupleNames));
};

export const getRecentBaptismContactList = async (monthsBack = 12, unit?: string): Promise<RecentBaptismRow[]> => {
  const safeMonthsBack = Math.max(1, Math.min(monthsBack, 36));
  const unitFilter = unit?.trim() ? `%${unit.trim()}%` : null;
  const result = await query<RecentBaptismRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.baptism_date::text AS "baptismDate",
      m.confirmation_date::text AS "confirmationDate",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    WHERE m.baptism_date IS NOT NULL
      AND m.baptism_date >= date_trunc('day', NOW()) - ($1::int || ' months')::interval
      AND ($2::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $2)
    ORDER BY m.baptism_date DESC, m.last_name, m.first_name
    LIMIT 5000
    `,
    [safeMonthsBack, unitFilter]
  );

  return result.rows;
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

  const result = await query<{
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
    templeRecommendExpirationDate: string | null;
    isAttendingSeminary: boolean | null;
    isAttendingInstitute: boolean | null;
    potentialSeminaryStudent: boolean | null;
    potentialInstituteStudent: boolean | null;
    isMarried: boolean | null;
    isSealedToParents: boolean | null;
    isSealedToSpouse: boolean | null;
    sealingToParents: string | null;
    sealingToSpouse: string | null;
  }>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.baptism_date::text AS "baptismDate",
      m.confirmation_date::text AS "confirmationDate",
      m.endowment_date::text AS "endowmentDate",
      m.ordination_date::text AS "ordinationDate",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.temple_recommend_expiration_date::text AS "templeRecommendExpirationDate",
      m.is_attending_seminary AS "isAttendingSeminary",
      m.is_attending_institute AS "isAttendingInstitute",
      m.potential_seminary_student AS "potentialSeminaryStudent",
      m.potential_institute_student AS "potentialInstituteStudent",
      m.is_married AS "isMarried",
      m.is_sealed_to_parents AS "isSealedToParents",
      m.is_sealed_to_spouse AS "isSealedToSpouse",
      m.sealing_to_parents AS "sealingToParents",
      m.sealing_to_spouse AS "sealingToSpouse",
      c.title AS "currentCalling",
      (COALESCE(m.has_ministering_brothers, false) OR COALESCE(m.has_ministering_sisters, false)) AS "ministeringAssigned"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, '') ILIKE $1)
    ORDER BY COALESCE(m.confirmation_date, m.baptism_date, m.endowment_date, m.ordination_date) DESC NULLS LAST, m.last_name, m.first_name
    LIMIT ${safeLimit}
    `,
    [unitFilter]
  );

  const today = new Date();
  const isRecent = (value: string | null | undefined, days: number) => {
    if (!value) {
      return false;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    const diffDays = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  };

  const rows = result.rows
    .map<CovenantPathProgressionRow>((row) => {
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

      milestones.sort((left, right) => right.date.localeCompare(left.date));
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
      const serviceBucket = hasCalling && row.ministeringAssigned
        ? "Calling + Ministering"
        : hasCalling
          ? "Calling Only"
          : row.ministeringAssigned
            ? "Ministering Only"
            : "No Current Engagement";

      let youthBucket: string | null = null;
      if ((row.age ?? 0) >= 12 && (row.age ?? 0) <= 18) {
        youthBucket = row.isAttendingSeminary
          ? "Seminary Attending"
          : row.potentialSeminaryStudent
            ? "Seminary Opportunity"
            : "Seminary Not Attending";
      } else if ((row.age ?? 0) > 18 && (row.age ?? 0) <= 25) {
        youthBucket = row.isAttendingInstitute
          ? "Institute Attending"
          : row.potentialInstituteStudent
            ? "Institute Opportunity"
            : "Institute Not Attending";
      }

      const sealedToParents = row.isSealedToParents || Boolean(row.sealingToParents);
      const sealedToSpouse = row.isSealedToSpouse || Boolean(row.sealingToSpouse);
      let familyBucket: string | null = null;
      if (row.isMarried) {
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
        ...row,
        currentCalling: cleanCallingTitle(row.currentCalling) || null,
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
    .sort((left, right) => compareNullable(right.attentionScore, left.attentionScore, "asc"));

  return rows;
};

export const priesthoodAdvancementCandidates = async (nextOffice = "Elder") => {
  const result = await query<PriesthoodCandidateRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      p.current_office AS "currentOffice",
      $1::text AS "recommendedNextOffice"
    FROM members m
    LEFT JOIN priesthood p ON p.member_id = m.id
    WHERE COALESCE(m.gender, '') ~* '^(m|male)$'
      AND (
        ($1 ILIKE 'teacher' AND COALESCE(m.age, 0) >= 14)
        OR ($1 ILIKE 'priest' AND COALESCE(m.age, 0) >= 16)
        OR ($1 ILIKE 'elder' AND COALESCE(m.age, 0) >= 18)
        OR ($1 ILIKE 'high priest' AND COALESCE(m.age, 0) >= 30)
      )
      AND COALESCE(p.current_office, '') !~* $1
    ORDER BY age DESC NULLS LAST, m.last_name, m.first_name
    `,
    [nextOffice]
  );

  return result.rows;
};

export const endowmentCandidates = async (minAge = 18) => {
  const result = await query<EndowmentCandidateRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.mission_status AS "missionStatus",
      m.temple_endowed AS "templeEndowed"
    FROM members m
    WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) >= $1
      AND COALESCE(m.temple_endowed, false) = false
    ORDER BY age DESC NULLS LAST, m.last_name, m.first_name
    `,
    [minAge]
  );

  return result.rows;
};

export const getVacancies = async () => {
  const result = await query<{
    organizationName: string | null;
    callingTitle: string;
    vacancyCount: string;
  }>(
    `
    SELECT
      o.name AS "organizationName",
      c.title AS "callingTitle",
      COUNT(*)::text AS "vacancyCount"
    FROM current_callings_dedup c
    LEFT JOIN organizations o ON c.organization_id = o.id
    WHERE c.member_id IS NULL
    GROUP BY o.name, c.title
    ORDER BY COUNT(*) DESC, c.title
    `
  );

  return result.rows.map((row) => ({
    ...row,
    vacancyCount: Number.parseInt(row.vacancyCount, 10)
  }));
};

export const getLeadershipTurnover = async (unit?: string | null) => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
    month: string;
    sustained: string;
    released: string;
  }>(
    `
    SELECT
      TO_CHAR(month_ref, 'YYYY-MM') AS month,
      COALESCE(s.sustained_count, 0)::text AS sustained,
      COALESCE(r.released_count, 0)::text AS released
    FROM generate_series(
      date_trunc('month', NOW()) - interval '11 months',
      date_trunc('month', NOW()),
      interval '1 month'
    ) month_ref
    LEFT JOIN (
      SELECT
        date_trunc('month', COALESCE(sustained_on, set_apart_on)) AS m,
        COUNT(*) AS sustained_count
      FROM current_callings_dedup
      LEFT JOIN units su ON current_callings_dedup.unit_id = su.id
      WHERE title ~* '(president|bishop|high councilor)'
        AND COALESCE(sustained_on, set_apart_on) IS NOT NULL
        AND ($1::text IS NULL OR COALESCE(NULLIF(su.name, ''), 'Unknown') = $1)
      GROUP BY 1
    ) s ON s.m = month_ref
    LEFT JOIN (
      SELECT
        date_trunc('month', released_on) AS m,
        COUNT(*) AS released_count
      FROM (
        SELECT DISTINCT
          released_on,
          COALESCE(member_id, -1) AS member_key,
          COALESCE(unit_id, -1) AS unit_key,
          BTRIM(REGEXP_REPLACE(LOWER(title), '[^a-z0-9]+', ' ', 'g')) AS title_key
        FROM callings
        LEFT JOIN units ru ON callings.unit_id = ru.id
        WHERE released_on IS NOT NULL
          AND lcr_calling_id NOT LIKE 'generated-calling-%'
          AND title ~* '(president|bishop|high councilor)'
          AND ($1::text IS NULL OR COALESCE(NULLIF(ru.name, ''), 'Unknown') = $1)
      ) released_events
      GROUP BY 1
    ) r ON r.m = month_ref
    ORDER BY month_ref
    `,
    [unitScope]
  );

  return result.rows.map((row) => ({
    month: row.month,
    sustained: Number.parseInt(row.sustained, 10),
    released: Number.parseInt(row.released, 10)
  }));
};

export const getYouthProgression = async (unit?: string | null) => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
    ageBand: string;
    count: string;
  }>(
    `
    SELECT
      CASE
        WHEN ${youthProgramAgeSql()} = 12 THEN 'Turns 12 / 12'
        WHEN ${youthProgramAgeSql()} BETWEEN 13 AND 15 THEN '13-15'
        WHEN ${youthProgramAgeSql()} BETWEEN 16 AND 17 THEN '16-17'
        WHEN ${youthProgramAgeSql()} = 18 THEN '18 Transition'
        WHEN ${actualAgeSql()} BETWEEN 19 AND 25 THEN 'YSA 19-25'
        WHEN ${actualAgeSql()} BETWEEN 26 AND 35 THEN 'YSA 26-35'
      END AS "ageBand",
      CASE
        WHEN ${youthProgramAgeSql()} = 12 THEN 1
        WHEN ${youthProgramAgeSql()} BETWEEN 13 AND 15 THEN 2
        WHEN ${youthProgramAgeSql()} BETWEEN 16 AND 17 THEN 3
        WHEN ${youthProgramAgeSql()} = 18 THEN 4
        WHEN ${actualAgeSql()} BETWEEN 19 AND 25 THEN 5
        ELSE 6
      END AS age_band_order,
      COUNT(*)::text AS count
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    WHERE ${isYouthProgramSql()} OR (${actualAgeSql()} BETWEEN 19 AND 35)
      AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    GROUP BY 1, 2
    ORDER BY 2
    `,
    [unitScope]
  );

  return result.rows.map((row) => ({
    ageBand: row.ageBand,
    count: Number.parseInt(row.count, 10)
  }));
};

export const getYouthTransitionMilestones = async (unit?: string | null): Promise<YouthTransitionMilestoneRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
    label: string;
    eligibleCount: string;
    completedCount: string;
    sortOrder: string;
  }>(
    `
    WITH base AS (
      SELECT
        ${actualAgeSql()} AS actual_age,
        ${youthProgramAgeSql()} AS youth_program_age,
        LOWER(COALESCE(m.gender, '')) AS gender_norm,
        LOWER(COALESCE(NULLIF(p.current_office, ''), NULLIF(m.priesthood_office, ''), '')) AS office_norm,
        m.baptism_date,
        m.confirmation_date,
        m.temple_recommend_status,
        m.temple_recommend_type,
        m.temple_recommend_expiration_date,
        COALESCE(m.is_returned_missionary, false) AS is_returned_missionary,
        NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') AS mission_status,
        NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') AS mission_country,
        COALESCE(m.is_attending_seminary, false) AS is_attending_seminary,
        COALESCE(m.is_attending_institute, false) AS is_attending_institute,
        COALESCE(m.temple_endowed, false) AS temple_endowed
      FROM members m
      LEFT JOIN priesthood p ON p.member_id = m.id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    ),
    milestone_counts AS (
      SELECT
        '8-11 Baptized & Confirmed' AS label,
        1 AS sort_order,
        COUNT(*) FILTER (WHERE actual_age BETWEEN 8 AND 11) AS eligible_count,
        COUNT(*) FILTER (
          WHERE actual_age BETWEEN 8 AND 11
            AND baptism_date IS NOT NULL
            AND confirmation_date IS NOT NULL
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '12-17 Current Recommend' AS label,
        2 AS sort_order,
        COUNT(*) FILTER (WHERE youth_program_age BETWEEN 12 AND 17) AS eligible_count,
        COUNT(*) FILTER (
          WHERE youth_program_age BETWEEN 12 AND 17
            AND (
              COALESCE(temple_recommend_status, '') ~* '^active'
              OR COALESCE(temple_recommend_type, '') ~* 'limited'
            )
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '12-13 Deacon (Men)' AS label,
        3 AS sort_order,
        COUNT(*) FILTER (WHERE youth_program_age BETWEEN 12 AND 13 AND gender_norm IN ('m', 'male')) AS eligible_count,
        COUNT(*) FILTER (
          WHERE youth_program_age BETWEEN 12 AND 13
            AND gender_norm IN ('m', 'male')
            AND office_norm ~* '^(deacon|teacher|priest|elder|high priest)$'
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '14-15 Teacher (Men)' AS label,
        4 AS sort_order,
        COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 15 AND gender_norm IN ('m', 'male')) AS eligible_count,
        COUNT(*) FILTER (
          WHERE youth_program_age BETWEEN 14 AND 15
            AND gender_norm IN ('m', 'male')
            AND office_norm ~* '^(teacher|priest|elder|high priest)$'
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '16-17 Priest (Men)' AS label,
        5 AS sort_order,
        COUNT(*) FILTER (WHERE youth_program_age BETWEEN 16 AND 17 AND gender_norm IN ('m', 'male')) AS eligible_count,
        COUNT(*) FILTER (
          WHERE youth_program_age BETWEEN 16 AND 17
            AND gender_norm IN ('m', 'male')
            AND office_norm ~* '^(priest|elder|high priest)$'
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '18-25 Elder (Men)' AS label,
        6 AS sort_order,
        COUNT(*) FILTER (WHERE actual_age BETWEEN 18 AND 25 AND gender_norm IN ('m', 'male')) AS eligible_count,
        COUNT(*) FILTER (
          WHERE actual_age BETWEEN 18 AND 25
            AND gender_norm IN ('m', 'male')
            AND office_norm ~* '^(elder|high priest)$'
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '17-25 Mission Ready (Men)' AS label,
        7 AS sort_order,
        COUNT(*) FILTER (
          WHERE actual_age BETWEEN 17 AND 25
            AND gender_norm IN ('m', 'male')
            AND is_returned_missionary = false
            AND mission_status IS NULL
            AND mission_country IS NULL
        ) AS eligible_count,
        COUNT(*) FILTER (
          WHERE actual_age BETWEEN 17 AND 25
            AND gender_norm IN ('m', 'male')
            AND is_returned_missionary = false
            AND mission_status IS NULL
            AND mission_country IS NULL
            AND COALESCE(temple_recommend_status, '') ~* '^active'
            AND (is_attending_seminary = true OR is_attending_institute = true)
            AND temple_endowed = true
        ) AS completed_count
      FROM base
      UNION ALL
      SELECT
        '17-25 Mission Ready (Women)' AS label,
        8 AS sort_order,
        COUNT(*) FILTER (
          WHERE actual_age BETWEEN 17 AND 25
            AND gender_norm IN ('f', 'female')
            AND is_returned_missionary = false
            AND mission_status IS NULL
            AND mission_country IS NULL
        ) AS eligible_count,
        COUNT(*) FILTER (
          WHERE actual_age BETWEEN 17 AND 25
            AND gender_norm IN ('f', 'female')
            AND is_returned_missionary = false
            AND mission_status IS NULL
            AND mission_country IS NULL
            AND COALESCE(temple_recommend_status, '') ~* '^active'
            AND (is_attending_seminary = true OR is_attending_institute = true)
            AND temple_endowed = true
        ) AS completed_count
      FROM base
    )
    SELECT
      label,
      eligible_count::text AS "eligibleCount",
      completed_count::text AS "completedCount",
      sort_order::text AS "sortOrder"
    FROM milestone_counts
    ORDER BY sort_order
    `,
    [unitScope]
  );

  return result.rows.map((row) => {
    const eligibleCount = Number.parseInt(row.eligibleCount, 10);
    const completedCount = Number.parseInt(row.completedCount, 10);
    return {
      label: row.label,
      eligibleCount,
      completedCount,
      completionPct: eligibleCount > 0 ? Math.round((completedCount / eligibleCount) * 100) : 0
    };
  });
};

export const getYouthOrganizationTransitions = async (unit?: string | null): Promise<YouthOrganizationTransitionRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
    label: string;
    count: string;
    sortOrder: string;
  }>(
    `
    WITH base AS (
      SELECT
        ${actualAgeSql()} AS actual_age,
        ${youthProgramAgeSql()} AS youth_program_age,
        LOWER(COALESCE(m.gender, '')) AS gender_norm,
        ${isUnmarriedSql("m")} AS is_unmarried
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    ),
    cohorts AS (
      SELECT 'Young Women 12-13' AS label, 1 AS sort_order, COUNT(*) FILTER (WHERE youth_program_age BETWEEN 12 AND 13 AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'Young Women 14-15' AS label, 2 AS sort_order, COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 15 AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'Young Women 16-17' AS label, 3 AS sort_order, COUNT(*) FILTER (WHERE youth_program_age BETWEEN 16 AND 17 AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'Young Men 12-13' AS label, 4 AS sort_order, COUNT(*) FILTER (WHERE youth_program_age BETWEEN 12 AND 13 AND gender_norm IN ('m', 'male')) AS count FROM base
      UNION ALL
      SELECT 'Young Men 14-15' AS label, 5 AS sort_order, COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 15 AND gender_norm IN ('m', 'male')) AS count FROM base
      UNION ALL
      SELECT 'Young Men 16-17' AS label, 6 AS sort_order, COUNT(*) FILTER (WHERE youth_program_age BETWEEN 16 AND 17 AND gender_norm IN ('m', 'male')) AS count FROM base
      UNION ALL
      SELECT 'Age 18 Transition' AS label, 7 AS sort_order, COUNT(*) FILTER (WHERE actual_age = 18) AS count FROM base
      UNION ALL
      SELECT 'YSA 18-25 (Unmarried)' AS label, 8 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 18 AND 25 AND is_unmarried) AS count FROM base
      UNION ALL
      SELECT 'YSA Women 18-25 (Unmarried)' AS label, 9 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 18 AND 25 AND is_unmarried AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'YSA Men 18-25 (Unmarried)' AS label, 10 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 18 AND 25 AND is_unmarried AND gender_norm IN ('m', 'male')) AS count FROM base
      UNION ALL
      SELECT 'YSA 26-35 (Unmarried)' AS label, 11 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 26 AND 35 AND is_unmarried) AS count FROM base
      UNION ALL
      SELECT 'YSA Women 26-35 (Unmarried)' AS label, 12 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 26 AND 35 AND is_unmarried AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'YSA Men 26-35 (Unmarried)' AS label, 13 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 26 AND 35 AND is_unmarried AND gender_norm IN ('m', 'male')) AS count FROM base
      UNION ALL
      SELECT 'Single Adults 36-45 (Unmarried)' AS label, 14 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 36 AND 45 AND is_unmarried) AS count FROM base
      UNION ALL
      SELECT 'Single Adult Women 36-45 (Unmarried)' AS label, 15 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 36 AND 45 AND is_unmarried AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'Single Adult Men 36-45 (Unmarried)' AS label, 16 AS sort_order, COUNT(*) FILTER (WHERE actual_age BETWEEN 36 AND 45 AND is_unmarried AND gender_norm IN ('m', 'male')) AS count FROM base
      UNION ALL
      SELECT 'Single Adults 46+ (Unmarried)' AS label, 17 AS sort_order, COUNT(*) FILTER (WHERE actual_age >= 46 AND is_unmarried) AS count FROM base
      UNION ALL
      SELECT 'Single Adult Women 46+ (Unmarried)' AS label, 18 AS sort_order, COUNT(*) FILTER (WHERE actual_age >= 46 AND is_unmarried AND gender_norm IN ('f', 'female')) AS count FROM base
      UNION ALL
      SELECT 'Single Adult Men 46+ (Unmarried)' AS label, 19 AS sort_order, COUNT(*) FILTER (WHERE actual_age >= 46 AND is_unmarried AND gender_norm IN ('m', 'male')) AS count FROM base
    )
    SELECT label, count::text AS count, sort_order::text AS "sortOrder"
    FROM cohorts
    ORDER BY sort_order
    `,
    [unitScope]
  );

  return result.rows.map((row) => ({
    label: row.label,
    count: Number.parseInt(row.count, 10)
  }));
};

export const getRecentConvertGrowth = async () => {
  const result = await query<{
    month: string;
    converts: string;
  }>(
    `
    SELECT
      TO_CHAR(month_ref, 'YYYY-MM') AS month,
      COALESCE(c.converts, 0)::text AS converts
    FROM generate_series(
      date_trunc('month', NOW()) - interval '11 months',
      date_trunc('month', NOW()),
      interval '1 month'
    ) month_ref
    LEFT JOIN (
      SELECT
        date_trunc('month', COALESCE(baptism_date, move_in_date)) AS m,
        COUNT(*) AS converts
      FROM members
      WHERE is_convert = true
        AND COALESCE(baptism_date, move_in_date) IS NOT NULL
      GROUP BY 1
    ) c ON c.m = month_ref
    ORDER BY month_ref
    `
  );

  return result.rows.map((row) => ({
    month: row.month,
    converts: Number.parseInt(row.converts, 10)
  }));
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
  const result = await query<{
    lcrMemberId: string;
    fullName: string;
    unitName: string | null;
    age: number | null;
    gender: string | null;
    email: string | null;
    phoneNumber: string | null;
  }>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(m.unit_name, u.name, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.gender,
      e.email,
      p.phone_number AS "phoneNumber"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    ORDER BY m.last_name, m.first_name
    LIMIT 1000
    `
  );

  return result.rows;
};

const memberAttributeColumnMap: Record<string, string> = {
  preferred_name: "m.preferred_name",
  unit: "m.unit_name",
  unit_abbreviation: "m.unit_abbreviation",
  age: "m.age::text",
  gender: "m.gender",
  birth_date: "m.birthdate::text",
  birthdate: "m.birthdate::text",
  birth_country: "m.birth_country",
  birthplace: "m.birthplace",
  address_state_or_province: "m.address_state_or_province",
  address_country: "m.address_country",
  endowment_status: "m.endowment_status",
  endowment_date: "m.endowment_date::text",
  is_endowed: "m.temple_endowed::text",
  is_widowed: "m.is_widowed::text",
  is_returned_missionary: "m.is_returned_missionary::text",
  is_convert: "m.is_convert::text",
  is_accountable: "m.is_accountable::text",
  is_born_in_covenant: "m.is_born_in_covenant::text",
  is_divorced: "m.is_divorced::text",
  is_married: "m.is_married::text",
  has_children: "m.has_children::text",
  is_sealed_to_parents: "m.is_sealed_to_parents::text",
  is_single: "m.is_single::text",
  is_sealed_to_spouse: "m.is_sealed_to_spouse::text",
  is_sealed_to_current_spouse: "m.is_sealed_to_current_spouse::text",
  is_sealed_to_prior_spouse: "m.is_sealed_to_prior_spouse::text",
  baptism_date: "m.baptism_date::text",
  confirmation_date: "m.confirmation_date::text",
  confirmed_date: "m.confirmation_date::text",
  temple_recommend_status: "m.temple_recommend_status",
  temple_recommend_expiration_date: "m.temple_recommend_expiration_date::text",
  temple_recommend_type: "m.temple_recommend_type",
  mission_language: "m.mission_language",
  mission_country: "m.mission_country",
  priesthood: "m.priesthood",
  ordination_date: "m.ordination_date::text",
  callings: "m.callings_text",
  callings_with_dates: "m.callings_with_dates_text",
  move_in_date: "m.move_in_date::text",
  institute_status: "m.institute_status",
  seminary_status: "m.seminary_status",
  is_attending_seminary: "m.is_attending_seminary::text",
  is_attending_institute: "m.is_attending_institute::text",
  potential_institute_student: "m.potential_institute_student::text",
  potential_seminary_student: "m.potential_seminary_student::text",
  has_ministering_sisters: "m.has_ministering_sisters::text",
  has_ministering_brothers: "m.has_ministering_brothers::text",
  ministering_brothers: "m.ministering_brothers",
  ministering_sisters: "m.ministering_sisters",
  marriage_date: "m.marriage_date::text",
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
    return "true";
  }
  if (["no", "n", "0", "false"].includes(normalized)) {
    return "false";
  }

  return value;
};

export const queryMembersByAttribute = async (attribute: string, value: string, limit = 100) => {
  const normalizedAttribute = attribute.trim().toLowerCase().replace(/\s+/g, "_");
  const normalizedValue = normalizeQueryValue(normalizedAttribute, value);
  const column = memberAttributeColumnMap[normalizedAttribute];
  const safeLimit = Math.max(1, Math.min(limit, 500));

  if (column) {
    const result = await query<AttributeQueryRow>(
      `
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
        m.gender,
        ${column} AS value
      FROM members m
      WHERE ${column} ILIKE $1
      ORDER BY m.last_name, m.first_name
      LIMIT ${safeLimit}
      `,
      [`%${normalizedValue}%`]
    );
    return result.rows;
  }

  const result = await query<AttributeQueryRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.gender,
      m.profile_data ->> $1 AS value
    FROM members m
    WHERE (m.profile_data ->> $1) ILIKE $2
       OR m.profile_data::text ILIKE $2
    ORDER BY m.last_name, m.first_name
    LIMIT ${safeLimit}
    `,
    [attribute, `%${normalizedValue}%`]
  );

  return result.rows;
};

export const getCallingsList = async () => {
  const result = await query<{
    callingTitle: string;
    organizationName: string | null;
    lcrMemberId: string | null;
    fullName: string | null;
    unitName: string;
    isLeadership: boolean;
    sustainedOn: string | null;
    isCurrent: boolean;
  }>(
    `
    SELECT
      c.title AS "callingTitle",
      o.name AS "organizationName",
      m.lcr_member_id AS "lcrMemberId",
      CASE WHEN m.id IS NULL THEN NULL ELSE ${fullNameExpr} END AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      (
        c.title ~* '(president|bishop|high councilor)'
        OR COALESCE(o.name, '') ~* '(stake presidency|bishopric|high council)'
      ) AS "isLeadership",
      c.sustained_on::text AS "sustainedOn",
      c.is_current AS "isCurrent"
    FROM current_callings_dedup c
    LEFT JOIN organizations o ON c.organization_id = o.id
    LEFT JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON c.unit_id = u.id
    ORDER BY "unitName", "isLeadership" DESC, c.title
    LIMIT 5000
    `
  );

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

  for (const row of result.rows) {
    const cleanedTitle = cleanCallingTitle(row.callingTitle);
    const key = `${row.lcrMemberId ?? "vacant"}:${row.unitName}:${cleanedTitle.toLowerCase()}`;
    const candidate = { ...row, callingTitle: cleanedTitle, rawTitle: row.callingTitle };
    const existing = byKey.get(key);
    if (!existing || score(candidate) > score(existing)) {
      byKey.set(key, candidate);
    }
  }

  const rows = Array.from(byKey.values()).map(({ rawTitle: _rawTitle, ...row }) => row);

  return rows.filter((row, index) => {
    const rowTitle = row.callingTitle.toLowerCase();
    return !rows.some((other, otherIndex) => {
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
};

export const getReportsOverview = async () => {
  const result = await query<{
    totalMembers: string;
    unitsRepresented: string;
    leadershipCallings: string;
    missionEligible: string;
    seminaryAttending: string;
    instituteAttending: string;
    activeTempleRecommend: string;
    convertsLast12Months: string;
  }>(
    `
    SELECT
      (SELECT COUNT(*)::text FROM members) AS "totalMembers",
      (
        SELECT COUNT(DISTINCT COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown'))::text
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
      ) AS "unitsRepresented",
      (
        SELECT COUNT(*)::text
        FROM current_callings_dedup c
        WHERE c.member_id IS NOT NULL
          AND c.title ~* '(president|bishop|high councilor)'
      ) AS "leadershipCallings",
      (
        SELECT COUNT(*)::text
        FROM members m
        WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN 18 AND 25
          AND COALESCE(m.is_returned_missionary, false) = false
          AND NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') IS NULL
          AND NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') IS NULL
      ) AS "missionEligible",
      (
        SELECT COUNT(*)::text FROM members m WHERE ${isSeminaryEligibleSql()} AND m.is_attending_seminary = true
      ) AS "seminaryAttending",
      (
        SELECT COUNT(*)::text FROM members m WHERE ${isYsaSql()} AND m.is_attending_institute = true
      ) AS "instituteAttending",
      (
        SELECT COUNT(*)::text
        FROM members
        WHERE temple_recommend_status ILIKE 'active%'
      ) AS "activeTempleRecommend",
      (
        SELECT COUNT(*)::text
        FROM members
        WHERE is_convert = true
          AND COALESCE(baptism_date, move_in_date) >= date_trunc('day', NOW()) - interval '12 months'
      ) AS "convertsLast12Months"
    `
  );

  return result.rows[0];
};

export const getUnitHealthReport = async () => {
  const result = await query<{
    unitName: string;
    memberCount: string;
    currentCallings: string;
    leadershipCallings: string;
    seminaryAttending: string;
    instituteAttending: string;
    convertsLast12Months: string;
  }>(
    `
    WITH member_units AS (
      SELECT
        m.id,
        COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS unit_name,
        ${youthProgramAgeSql()} AS youth_program_age,
        ${actualAgeSql()} AS actual_age,
        m.is_attending_seminary,
        m.is_attending_institute,
        m.is_convert,
        COALESCE(m.baptism_date, m.move_in_date) AS convert_date
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
    ),
    member_callings AS (
      SELECT
        c.member_id,
        c.title,
        BTRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  LOWER(c.title),
                  '(\\d{1,2}\\s+[a-z]{3,9}\\s+\\d{4}|\\d{1,2}/\\d{1,2}/\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|yes|no|sustain(?:ed)?|set\\s*apart|with\\s+date)',
                  ' ',
                  'gi'
                ),
                '[^a-z0-9]+',
                ' ',
                'g'
              ),
              '\\s+',
              ' ',
              'g'
            ),
            '^\\s+|\\s+$',
            '',
            'g'
          )
        ) AS title_norm
      FROM current_callings_dedup c
    )
    SELECT
      mu.unit_name AS "unitName",
      COUNT(DISTINCT mu.id)::text AS "memberCount",
      COUNT(DISTINCT (mc.member_id::text || ':' || mc.title_norm))::text AS "currentCallings",
      COUNT(DISTINCT (mc.member_id::text || ':' || mc.title_norm)) FILTER (
        WHERE mc.title ~* '(president|bishop|high councilor)'
      )::text AS "leadershipCallings",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.youth_program_age BETWEEN 14 AND 18 AND mu.is_attending_seminary = true)::text AS "seminaryAttending",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.actual_age BETWEEN 18 AND 35 AND mu.is_attending_institute = true)::text AS "instituteAttending",
      COUNT(DISTINCT mu.id) FILTER (
        WHERE mu.is_convert = true
          AND mu.convert_date >= date_trunc('day', NOW()) - interval '12 months'
      )::text AS "convertsLast12Months"
    FROM member_units mu
    LEFT JOIN member_callings mc ON mc.member_id = mu.id
    GROUP BY mu.unit_name
    ORDER BY mu.unit_name
    `
  );

  return result.rows.map((row) => ({
    ...row,
    memberCount: Number.parseInt(row.memberCount, 10),
    currentCallings: Number.parseInt(row.currentCallings, 10),
    leadershipCallings: Number.parseInt(row.leadershipCallings, 10),
    seminaryAttending: Number.parseInt(row.seminaryAttending, 10),
    instituteAttending: Number.parseInt(row.instituteAttending, 10),
    convertsLast12Months: Number.parseInt(row.convertsLast12Months, 10)
  }));
};

export const getLeadershipTenureReport = async () => {
  const result = await query<{
    lcrMemberId: string;
    unitName: string;
    fullName: string;
    callingTitle: string;
    sustainedOn: string;
    yearsInCalling: string;
  }>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS "unitName",
      ${fullNameExpr} AS "fullName",
      c.title AS "callingTitle",
      c.sustained_on::text AS "sustainedOn",
      EXTRACT(YEAR FROM AGE(NOW(), c.sustained_on))::int::text AS "yearsInCalling"
    FROM current_callings_dedup c
    JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON m.unit_id = u.id
    WHERE c.sustained_on IS NOT NULL
      AND c.title ~* '(president|bishop|high councilor)'
    ORDER BY EXTRACT(YEAR FROM AGE(NOW(), c.sustained_on)) DESC, c.sustained_on ASC
    LIMIT 40
    `
  );

  return result.rows.map((row) => ({
    ...row,
    callingTitle: cleanCallingTitle(row.callingTitle),
    yearsInCalling: Number.parseInt(row.yearsInCalling, 10)
  }));
};

export const getMissionYouthPipelineReport = async (unit?: string | null): Promise<MissionYouthPipelineRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
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
  }>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS "unitName",
      ${fullNameExpr} AS "fullName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.gender,
      m.is_attending_seminary AS "isAttendingSeminary",
      m.is_attending_institute AS "isAttendingInstitute",
      m.mission_language AS "missionLanguage",
      m.mission_country AS "missionCountry",
      m.mission_status AS "missionStatus",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.temple_endowed AS "templeEndowed",
      c.title AS "currentCalling"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT title
      FROM current_callings_dedup
      WHERE member_id = m.id
      ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
      LIMIT 1
    ) c ON TRUE
    WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN 17 AND 25
      AND COALESCE(m.is_returned_missionary, false) = false
      AND NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') IS NULL
      AND NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') IS NULL
      AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    ORDER BY age DESC NULLS LAST, m.last_name, m.first_name
    LIMIT 600
    `,
    [unitScope]
  );

  return result.rows.map((row) => {
    const hasActiveRecommend = isActiveTempleRecommendStatus(row.templeRecommendStatus);
    const inReligiousClass = Boolean(row.isAttendingSeminary) || Boolean(row.isAttendingInstitute);
    const ordinanceReady = Boolean(row.templeEndowed);
    const readinessScore = Number(hasActiveRecommend) + Number(inReligiousClass) + Number(ordinanceReady);
    const readinessLevel = readinessScore >= 3 ? "Ready" : readinessScore === 2 ? "Progressing" : "Needs Focus";

    return {
      ...row,
      currentCalling: cleanCallingTitle(row.currentCalling) || null,
      readinessScore,
      readinessLevel
    };
  });
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
  const result = await query<{ label: string; value: string }>(
    `
    WITH scoped AS (
      SELECT
        CASE
          WHEN (
            (CASE WHEN COALESCE(m.temple_recommend_status, '') ~* '^active' THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.is_attending_seminary, false) = true OR COALESCE(m.is_attending_institute, false) = true THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.temple_endowed, false) = true THEN 1 ELSE 0 END)
          ) >= 3 THEN 'Ready'
          WHEN (
            (CASE WHEN COALESCE(m.temple_recommend_status, '') ~* '^active' THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.is_attending_seminary, false) = true OR COALESCE(m.is_attending_institute, false) = true THEN 1 ELSE 0 END) +
            (CASE WHEN COALESCE(m.temple_endowed, false) = true THEN 1 ELSE 0 END)
          ) = 2 THEN 'Progressing'
          ELSE 'Needs Focus'
        END AS label
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) BETWEEN 17 AND 25
        AND COALESCE(m.is_returned_missionary, false) = false
        AND NULLIF(BTRIM(COALESCE(m.mission_status, '')), '') IS NULL
        AND NULLIF(BTRIM(COALESCE(m.mission_country, '')), '') IS NULL
        AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    )
    SELECT label, COUNT(*)::text AS value
    FROM scoped
    GROUP BY label
    ORDER BY CASE label WHEN 'Ready' THEN 1 WHEN 'Progressing' THEN 2 ELSE 3 END
    `,
    [unitScope]
  );

  return result.rows.map((row) => ({ label: row.label, value: Number.parseInt(row.value, 10) }));
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

const mapSummaryRows = (rows: Array<{ label: string; value: string }>) =>
  rows.map((row) => ({ label: row.label, value: Number.parseInt(row.value, 10) }));

const getHistoryCoverage = async () => {
  const historyCoverage = await query<{ firstSnapshotAt: string | null; latestSnapshotAt: string | null }>(
    `
    SELECT
      MIN(snapshot_at)::text AS "firstSnapshotAt",
      MAX(snapshot_at)::text AS "latestSnapshotAt"
    FROM member_status_history
    `
  );

  const firstSnapshotAt = historyCoverage.rows[0]?.firstSnapshotAt ?? null;
  const latestSnapshotAt = historyCoverage.rows[0]?.latestSnapshotAt ?? null;
  const daysTracked =
    firstSnapshotAt && latestSnapshotAt
      ? Math.max(0, Math.floor((new Date(latestSnapshotAt).getTime() - new Date(firstSnapshotAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return { firstSnapshotAt, daysTracked };
};

export const getTempleRecommendHealthReport = async (): Promise<TempleRecommendHealthReport> => {
  const [statusRows, attentionRows, recoveryRows, historyCoverage] = await Promise.all([
    query<{ label: string; value: string }>(
      `
      WITH status_buckets AS (
        SELECT
          CASE
            WHEN COALESCE(m.temple_recommend_status, '') ~* '^active' THEN 'Active'
            WHEN COALESCE(m.temple_recommend_status, '') ~* 'expired' THEN 'Expired'
            WHEN COALESCE(m.temple_recommend_status, '') ~* 'limited' THEN 'Limited Use'
            WHEN COALESCE(BTRIM(m.temple_recommend_status), '') = '' THEN 'No Status'
            ELSE 'Other'
          END AS label
        FROM members m
      )
      SELECT label, COUNT(*)::text AS value
      FROM status_buckets
      GROUP BY label
      ORDER BY
        CASE label
          WHEN 'Active' THEN 1
          WHEN 'Expired' THEN 2
          WHEN 'Limited Use' THEN 3
          WHEN 'No Status' THEN 4
          ELSE 5
        END
      `
    ),
    query<TempleRecommendAttentionRow>(
      `
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
        m.temple_recommend_status AS "templeRecommendStatus"
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE COALESCE(m.temple_recommend_status, '') !~* '^active'
      ORDER BY "unitName", m.last_name, m.first_name
      LIMIT 5000
      `
    ),
    query<TempleRecommendRecoveryRow>(
      `
      WITH normalized_history AS (
        SELECT
          h.member_id,
          h.snapshot_at,
          COALESCE(h.temple_recommend_status, '') ~* '^active' AS is_active,
          LAG(COALESCE(h.temple_recommend_status, '') ~* '^active')
            OVER (PARTITION BY h.member_id ORDER BY h.snapshot_at) AS prev_is_active,
          MAX(
            CASE WHEN COALESCE(h.temple_recommend_status, '') !~* '^active' THEN h.snapshot_at END
          ) OVER (
            PARTITION BY h.member_id
            ORDER BY h.snapshot_at
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
          ) AS last_non_active_at
        FROM member_status_history h
      ),
      reactivations AS (
        SELECT
          member_id,
          snapshot_at AS reactivated_at,
          last_non_active_at,
          EXTRACT(DAY FROM snapshot_at - last_non_active_at)::int AS inactive_days
        FROM normalized_history
        WHERE is_active = true
          AND COALESCE(prev_is_active, false) = false
          AND last_non_active_at IS NOT NULL
      ),
      latest_reactivation AS (
        SELECT DISTINCT ON (r.member_id)
          r.member_id,
          r.reactivated_at,
          r.inactive_days
        FROM reactivations r
        WHERE r.inactive_days >= 365
        ORDER BY r.member_id, r.reactivated_at DESC
      )
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        m.temple_recommend_status AS "templeRecommendStatus",
        lr.reactivated_at::text AS "reactivatedAt",
        lr.inactive_days AS "inactiveDays"
      FROM latest_reactivation lr
      JOIN members m ON m.id = lr.member_id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE COALESCE(m.temple_recommend_status, '') ~* '^active'
      ORDER BY lr.reactivated_at DESC
      LIMIT 400
      `
    ),
    query<{ firstSnapshotAt: string | null; latestSnapshotAt: string | null }>(
      `
      SELECT
        MIN(snapshot_at)::text AS "firstSnapshotAt",
        MAX(snapshot_at)::text AS "latestSnapshotAt"
      FROM member_status_history
      `
    )
  ]);

  const firstSnapshotAt = historyCoverage.rows[0]?.firstSnapshotAt ?? null;
  const latestSnapshotAt = historyCoverage.rows[0]?.latestSnapshotAt ?? null;
  const daysTracked =
    firstSnapshotAt && latestSnapshotAt
      ? Math.max(0, Math.floor((new Date(latestSnapshotAt).getTime() - new Date(firstSnapshotAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return {
    statusCounts: statusRows.rows.map((row) => ({ label: row.label, value: Number.parseInt(row.value, 10) })),
    attentionMembers: attentionRows.rows,
    recoveredAfterLongLapse: recoveryRows.rows,
    trackingSince: firstSnapshotAt,
    daysTracked
  };
};

export const getTempleRecommendHealthSummary = async (unit?: string | null): Promise<TempleRecommendHealthReport> => {
  const unitScope = normalizeUnitScope(unit);
  const [statusRows, history] = await Promise.all([
    query<{ label: string; value: string }>(
      `
      WITH status_buckets AS (
        SELECT
          CASE
            WHEN COALESCE(m.temple_recommend_status, '') ~* '^active' THEN 'Active'
            WHEN COALESCE(m.temple_recommend_status, '') ~* 'expired' THEN 'Expired'
            WHEN COALESCE(m.temple_recommend_status, '') ~* 'limited' THEN 'Limited Use'
            WHEN COALESCE(BTRIM(m.temple_recommend_status), '') = '' THEN 'No Status'
            ELSE 'Other'
          END AS label
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
      )
      SELECT label, COUNT(*)::text AS value
      FROM status_buckets
      GROUP BY label
      ORDER BY CASE label WHEN 'Active' THEN 1 WHEN 'Expired' THEN 2 WHEN 'Limited Use' THEN 3 WHEN 'No Status' THEN 4 ELSE 5 END
      `,
      [unitScope]
    ),
    getHistoryCoverage()
  ]);

  return {
    statusCounts: mapSummaryRows(statusRows.rows),
    attentionMembers: [],
    recoveredAfterLongLapse: [],
    trackingSince: history.firstSnapshotAt,
    daysTracked: history.daysTracked
  };
};

export const getRecentBaptismSummary = async (monthsBack = 12, unit?: string | null): Promise<RecentBaptismReport> => {
  const safeMonthsBack = Math.max(1, Math.min(monthsBack, 36));
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{ label: string; value: string }>(
    `
    WITH scoped AS (
      SELECT
        m.baptism_date,
        CASE
          WHEN m.baptism_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'Last 30 Days'
          WHEN m.baptism_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'Last 90 Days'
          WHEN EXTRACT(YEAR FROM m.baptism_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 'This Year'
          ELSE NULL
        END AS primary_bucket
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE m.baptism_date IS NOT NULL
        AND m.baptism_date >= date_trunc('day', NOW()) - ($1::int || ' months')::interval
        AND ($2::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $2)
    )
    SELECT label, COUNT(*)::text AS value
    FROM (
      SELECT 'Last 30 Days' AS label FROM scoped WHERE baptism_date >= CURRENT_DATE - INTERVAL '30 days'
      UNION ALL
      SELECT 'Last 90 Days' AS label FROM scoped WHERE baptism_date >= CURRENT_DATE - INTERVAL '90 days'
      UNION ALL
      SELECT 'This Year' AS label FROM scoped WHERE EXTRACT(YEAR FROM baptism_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    ) counts
    GROUP BY label
    ORDER BY CASE label WHEN 'Last 30 Days' THEN 1 WHEN 'Last 90 Days' THEN 2 ELSE 3 END
    `,
    [safeMonthsBack, unitScope]
  );

  const summaryMap = new Map(mapSummaryRows(result.rows).map((row) => [row.label, row.value]));

  return {
    summary: [
      { label: "Last 30 Days", value: summaryMap.get("Last 30 Days") ?? 0 },
      { label: "Last 90 Days", value: summaryMap.get("Last 90 Days") ?? 0 },
      { label: "This Year", value: summaryMap.get("This Year") ?? 0 }
    ],
    members: []
  };
};

export const getRecommendExpirationRiskSummary = async (unit?: string | null): Promise<RecommendExpirationRiskReport> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{ label: string; value: string }>(
    `
    WITH scoped AS (
      SELECT
        CASE
          WHEN m.temple_recommend_expiration_date < CURRENT_DATE THEN 'Expired'
          WHEN m.temple_recommend_expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Next 30 Days'
          ELSE '31-90 Days'
        END AS label
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE m.temple_recommend_expiration_date IS NOT NULL
        AND m.temple_recommend_expiration_date <= CURRENT_DATE + INTERVAL '90 days'
        AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    )
    SELECT label, COUNT(*)::text AS value
    FROM scoped
    GROUP BY label
    ORDER BY CASE label WHEN 'Expired' THEN 1 WHEN 'Next 30 Days' THEN 2 ELSE 3 END
    `,
    [unitScope]
  );

  const summaryMap = new Map(mapSummaryRows(result.rows).map((row) => [row.label, row.value]));

  return {
    summary: [
      { label: "Expired", value: summaryMap.get("Expired") ?? 0 },
      { label: "Next 30 Days", value: summaryMap.get("Next 30 Days") ?? 0 },
      { label: "31-90 Days", value: summaryMap.get("31-90 Days") ?? 0 }
    ],
    members: []
  };
};

export const getMinisteringGapSummary = async (): Promise<MinisteringGapReport> => {
  const result = await query<{ label: string; value: string }>(
    `
    WITH scoped AS (
      SELECT 'No Assigned Ministers' AS label
      FROM members m
      WHERE (m.member_status IS NULL OR m.member_status ILIKE 'active%')
        AND COALESCE(m.has_ministering_brothers, false) = false
        AND COALESCE(m.has_ministering_sisters, false) = false
    )
    SELECT label, COUNT(*)::text AS value
    FROM scoped
    GROUP BY label
    ORDER BY label
    `
  );

  const summaryMap = new Map(mapSummaryRows(result.rows).map((row) => [row.label, row.value]));

  return {
    summary: [{ label: "No Assigned Ministers", value: summaryMap.get("No Assigned Ministers") ?? 0 }],
    members: []
  };
};

export const getMinisteringCoverageByUnit = async (unit?: string | null): Promise<MinisteringCoverageUnitRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
    unitName: string;
    eligibleCount: string;
    noAssignedCount: string;
    brothersOnlyCount: string;
    sistersOnlyCount: string;
    bothAssignedCount: string;
  }>(
    `
    WITH scoped AS (
      SELECT
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unit_name,
        CASE
          WHEN COALESCE(m.has_ministering_brothers, false) = true
            AND COALESCE(m.has_ministering_sisters, false) = true THEN 'both'
          WHEN COALESCE(m.has_ministering_brothers, false) = true THEN 'brothers_only'
          WHEN COALESCE(m.has_ministering_sisters, false) = true THEN 'sisters_only'
          ELSE 'none'
        END AS assignment_bucket
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE m.member_status IS NULL OR m.member_status ILIKE 'active%'
        AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    )
    SELECT
      unit_name AS "unitName",
      COUNT(*)::text AS "eligibleCount",
      COUNT(*) FILTER (WHERE assignment_bucket = 'none')::text AS "noAssignedCount",
      COUNT(*) FILTER (WHERE assignment_bucket = 'brothers_only')::text AS "brothersOnlyCount",
      COUNT(*) FILTER (WHERE assignment_bucket = 'sisters_only')::text AS "sistersOnlyCount",
      COUNT(*) FILTER (WHERE assignment_bucket = 'both')::text AS "bothAssignedCount"
    FROM scoped
    GROUP BY unit_name
    ORDER BY COUNT(*) FILTER (WHERE assignment_bucket = 'none') DESC, unit_name
    `,
    [unitScope]
  );

  return result.rows.map((row) => {
    const eligibleCount = Number.parseInt(row.eligibleCount, 10);
    const noAssignedCount = Number.parseInt(row.noAssignedCount, 10);
    const brothersOnlyCount = Number.parseInt(row.brothersOnlyCount, 10);
    const sistersOnlyCount = Number.parseInt(row.sistersOnlyCount, 10);
    const bothAssignedCount = Number.parseInt(row.bothAssignedCount, 10);
    const assignedAnyCount = brothersOnlyCount + sistersOnlyCount + bothAssignedCount;

    return {
      unitName: row.unitName,
      eligibleCount,
      noAssignedCount,
      brothersOnlyCount,
      sistersOnlyCount,
      bothAssignedCount,
      assignedAnyCount,
      assignedAnyPct: eligibleCount > 0 ? Math.round((assignedAnyCount / eligibleCount) * 100) : 0,
      noAssignedPct: eligibleCount > 0 ? Math.round((noAssignedCount / eligibleCount) * 100) : 0
    };
  });
};

export const getHouseholdOutreachSummary = async (unit?: string | null): Promise<HouseholdOutreachReport> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{ label: string; value: string }>(
    `
    WITH household_flags AS (
      SELECT
        h.id,
        COUNT(DISTINCT m.id) FILTER (
          WHERE ${isYouthOrYsaSql()}
        ) > 0 AS has_youth,
        COUNT(DISTINCT m.id) FILTER (
          WHERE m.baptism_date IS NOT NULL
            AND m.baptism_date >= date_trunc('day', NOW()) - interval '12 months'
        ) > 0 AS has_recent_baptism,
        COUNT(DISTINCT m.id) FILTER (
          WHERE m.temple_recommend_expiration_date IS NOT NULL
            AND m.temple_recommend_expiration_date <= CURRENT_DATE + INTERVAL '90 days'
        ) > 0 AS has_recommend_risk,
        COUNT(DISTINCT m.id) FILTER (
          WHERE COALESCE(m.has_ministering_brothers, false) = false
            AND COALESCE(m.has_ministering_sisters, false) = false
        ) > 0 AS has_ministering_gap
      FROM households h
      JOIN members m ON m.household_id = h.id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
      GROUP BY h.id
    )
    SELECT label, COUNT(*)::text AS value
    FROM (
      SELECT 'Youth / YSA' AS label FROM household_flags WHERE has_youth
      UNION ALL
      SELECT 'Recent Baptism' AS label FROM household_flags WHERE has_recent_baptism
      UNION ALL
      SELECT 'Recommend Risk' AS label FROM household_flags WHERE has_recommend_risk
      UNION ALL
      SELECT 'Ministering Gap' AS label FROM household_flags WHERE has_ministering_gap
    ) counts
    GROUP BY label
    ORDER BY CASE label WHEN 'Youth / YSA' THEN 1 WHEN 'Recent Baptism' THEN 2 WHEN 'Recommend Risk' THEN 3 ELSE 4 END
    `,
    [unitScope]
  );

  const summaryMap = new Map(mapSummaryRows(result.rows).map((row) => [row.label, row.value]));

  return {
    summary: [
      { label: "Youth / YSA", value: summaryMap.get("Youth / YSA") ?? 0 },
      { label: "Recent Baptism", value: summaryMap.get("Recent Baptism") ?? 0 },
      { label: "Recommend Risk", value: summaryMap.get("Recommend Risk") ?? 0 },
      { label: "Ministering Gap", value: summaryMap.get("Ministering Gap") ?? 0 }
    ],
    households: []
  };
};

export const getNewReturningStrengtheningSummary = async (unit?: string | null): Promise<NewReturningStrengtheningReport> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{ label: string; value: string }>(
    `
    WITH normalized_history AS (
      SELECT
        h.member_id,
        h.snapshot_at,
        COALESCE(h.temple_recommend_status, '') ~* '^active' AS is_active,
        LAG(COALESCE(h.temple_recommend_status, '') ~* '^active')
          OVER (PARTITION BY h.member_id ORDER BY h.snapshot_at) AS prev_is_active,
        MAX(
          CASE WHEN COALESCE(h.temple_recommend_status, '') !~* '^active' THEN h.snapshot_at END
        ) OVER (
          PARTITION BY h.member_id
          ORDER BY h.snapshot_at
          ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS last_non_active_at
      FROM member_status_history h
    ),
    reactivations AS (
      SELECT member_id, EXTRACT(DAY FROM snapshot_at - last_non_active_at)::int AS inactive_days
      FROM normalized_history
      WHERE is_active = true
        AND COALESCE(prev_is_active, false) = false
        AND last_non_active_at IS NOT NULL
    ),
    latest_reactivation AS (
      SELECT DISTINCT ON (member_id)
        member_id,
        inactive_days
      FROM reactivations
      WHERE inactive_days >= 365
      ORDER BY member_id, inactive_days DESC
    ),
    scoped AS (
      SELECT
        CASE
          WHEN lr.member_id IS NOT NULL THEN 'Recommend Recovered (1y+)'
          WHEN m.is_convert = true THEN 'Convert'
          WHEN m.move_in_date IS NOT NULL THEN 'Move-in'
          ELSE 'Returning Member'
        END AS label
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      LEFT JOIN latest_reactivation lr ON lr.member_id = m.id
      WHERE (
          (
            m.is_convert = true
            AND COALESCE(m.baptism_date, m.move_in_date) >= date_trunc('day', NOW()) - interval '24 months'
          )
          OR (
            m.move_in_date IS NOT NULL
            AND m.move_in_date >= date_trunc('day', NOW()) - interval '24 months'
          )
          OR lr.member_id IS NOT NULL
        )
        AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    )
    SELECT label, COUNT(*)::text AS value
    FROM scoped
    GROUP BY label
    ORDER BY CASE label WHEN 'Convert' THEN 1 WHEN 'Move-in' THEN 2 WHEN 'Recommend Recovered (1y+)' THEN 3 ELSE 4 END
    `,
    [unitScope]
  );

  const summaryMap = new Map(mapSummaryRows(result.rows).map((row) => [row.label, row.value]));

  return {
    summary: [
      { label: "Convert", value: summaryMap.get("Convert") ?? 0 },
      { label: "Move-in", value: summaryMap.get("Move-in") ?? 0 },
      { label: "Recommend Recovered (1y+)", value: summaryMap.get("Recommend Recovered (1y+)") ?? 0 }
    ],
    members: []
  };
};

export const getPriesthoodProgressionSummary = async (unit?: string | null): Promise<PriesthoodProgressionReport> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{ label: string; value: string }>(
    `
    WITH base AS (
      SELECT
        COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
        COALESCE(NULLIF(p.current_office, ''), NULLIF(m.priesthood_office, '')) AS current_office
      FROM members m
      LEFT JOIN priesthood p ON p.member_id = m.id
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE COALESCE(m.gender, '') ~* '^(m|male)$'
        AND ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    ),
    scoped AS (
      SELECT
        CASE
          WHEN age >= 30 AND COALESCE(current_office, '') ~* '^elder$' THEN 'High Priest'
          WHEN age >= 18 AND COALESCE(current_office, '') !~* '(elder|high priest)' THEN 'Elder'
          WHEN age >= 16 AND COALESCE(current_office, '') !~* '(priest|elder|high priest)' THEN 'Priest'
          WHEN age >= 14 AND COALESCE(current_office, '') !~* '(teacher|priest|elder|high priest)' THEN 'Teacher'
          ELSE NULL
        END AS label
      FROM base
    )
    SELECT label, COUNT(*)::text AS value
    FROM scoped
    WHERE label IS NOT NULL
    GROUP BY label
    ORDER BY CASE label WHEN 'Teacher' THEN 1 WHEN 'Priest' THEN 2 WHEN 'Elder' THEN 3 ELSE 4 END
    `,
    [unitScope]
  );

  const summaryMap = new Map(mapSummaryRows(result.rows).map((row) => [row.label, row.value]));

  return {
    summary: [
      { label: "Teacher", value: summaryMap.get("Teacher") ?? 0 },
      { label: "Priest", value: summaryMap.get("Priest") ?? 0 },
      { label: "Elder", value: summaryMap.get("Elder") ?? 0 },
      { label: "High Priest", value: summaryMap.get("High Priest") ?? 0 }
    ],
    members: []
  };
};

export const getSeminaryInstituteByUnitReport = async (unit?: string | null): Promise<SeminaryInstituteByUnitRow[]> => {
  const unitScope = normalizeUnitScope(unit);
  const result = await query<{
    unitName: string;
    seminaryEligible: string;
    seminaryAttending: string;
    instituteEligible: string;
    instituteAttending: string;
  }>(
    `
    WITH scoped AS (
      SELECT
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS unit_name,
        ${actualAgeSql()} AS age,
        ${youthProgramAgeSql()} AS youth_program_age,
        m.is_attending_seminary,
        m.is_attending_institute
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
    )
    SELECT
      unit_name AS "unitName",
      COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 18)::text AS "seminaryEligible",
      COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 18 AND is_attending_seminary = true)::text AS "seminaryAttending",
      COUNT(*) FILTER (WHERE age BETWEEN 18 AND 35)::text AS "instituteEligible",
      COUNT(*) FILTER (WHERE age BETWEEN 18 AND 35 AND is_attending_institute = true)::text AS "instituteAttending"
    FROM scoped
    GROUP BY unit_name
    ORDER BY unit_name
    `,
    [unitScope]
  );

  return result.rows.map((row) => {
    const seminaryEligible = Number.parseInt(row.seminaryEligible, 10);
    const seminaryAttending = Number.parseInt(row.seminaryAttending, 10);
    const instituteEligible = Number.parseInt(row.instituteEligible, 10);
    const instituteAttending = Number.parseInt(row.instituteAttending, 10);

    return {
      unitName: row.unitName,
      seminaryEligible,
      seminaryAttending,
      seminaryParticipationPct: seminaryEligible > 0 ? Math.round((seminaryAttending / seminaryEligible) * 100) : 0,
      instituteEligible,
      instituteAttending,
      instituteParticipationPct: instituteEligible > 0 ? Math.round((instituteAttending / instituteEligible) * 100) : 0
    };
  });
};

export const getUnitHealthRadarData = async (): Promise<UnitHealthRadarRow[]> => {
  const result = await query<{
    unitName: string;
    memberCount: string;
    seminaryEligible: string;
    seminaryAttending: string;
    instituteEligible: string;
    instituteAttending: string;
    activeRecommendCount: string;
    leadershipCallings: string;
    recentConvertCount: string;
    ministeringCoverageCount: string;
  }>(
    `
    WITH member_units AS (
      SELECT
        m.id,
        COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS unit_name,
        ${actualAgeSql()} AS actual_age,
        ${youthProgramAgeSql()} AS youth_program_age,
        m.is_attending_seminary,
        m.is_attending_institute,
        m.temple_recommend_status,
        m.is_convert,
        COALESCE(m.baptism_date, m.move_in_date) AS convert_date,
        (COALESCE(m.has_ministering_brothers, false) OR COALESCE(m.has_ministering_sisters, false)) AS ministering_covered
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
    ),
    calling_units AS (
      SELECT
        COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS unit_name,
        COUNT(*) FILTER (WHERE c.title ~* '(president|bishop|high councilor)')::text AS leadership_callings
      FROM current_callings_dedup c
      JOIN members m ON c.member_id = m.id
      LEFT JOIN units u ON m.unit_id = u.id
      GROUP BY 1
    )
    SELECT
      mu.unit_name AS "unitName",
      COUNT(DISTINCT mu.id)::text AS "memberCount",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.youth_program_age BETWEEN 14 AND 18)::text AS "seminaryEligible",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.youth_program_age BETWEEN 14 AND 18 AND mu.is_attending_seminary = true)::text AS "seminaryAttending",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.actual_age BETWEEN 18 AND 35)::text AS "instituteEligible",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.actual_age BETWEEN 18 AND 35 AND mu.is_attending_institute = true)::text AS "instituteAttending",
      COUNT(DISTINCT mu.id) FILTER (WHERE COALESCE(mu.temple_recommend_status, '') ~* '^active')::text AS "activeRecommendCount",
      COALESCE(MAX(cu.leadership_callings), '0') AS "leadershipCallings",
      COUNT(DISTINCT mu.id) FILTER (
        WHERE mu.is_convert = true
          AND mu.convert_date >= date_trunc('day', NOW()) - interval '12 months'
      )::text AS "recentConvertCount",
      COUNT(DISTINCT mu.id) FILTER (WHERE mu.ministering_covered = true)::text AS "ministeringCoverageCount"
    FROM member_units mu
    LEFT JOIN calling_units cu ON cu.unit_name = mu.unit_name
    GROUP BY mu.unit_name
    ORDER BY mu.unit_name
    `
  );

  return result.rows.map((row) => {
    const memberCount = Number.parseInt(row.memberCount, 10);
    const seminaryEligible = Number.parseInt(row.seminaryEligible, 10);
    const seminaryAttending = Number.parseInt(row.seminaryAttending, 10);
    const instituteEligible = Number.parseInt(row.instituteEligible, 10);
    const instituteAttending = Number.parseInt(row.instituteAttending, 10);
    const activeRecommendCount = Number.parseInt(row.activeRecommendCount, 10);
    const leadershipCallings = Number.parseInt(row.leadershipCallings, 10);
    const recentConvertCount = Number.parseInt(row.recentConvertCount, 10);
    const ministeringCoverageCount = Number.parseInt(row.ministeringCoverageCount, 10);

    return {
      unitName: row.unitName,
      memberCount,
      seminaryParticipationPct: seminaryEligible > 0 ? Math.round((seminaryAttending / seminaryEligible) * 100) : 0,
      instituteParticipationPct: instituteEligible > 0 ? Math.round((instituteAttending / instituteEligible) * 100) : 0,
      activeRecommendPct: memberCount > 0 ? Math.round((activeRecommendCount / memberCount) * 100) : 0,
      leadershipPer100: memberCount > 0 ? Math.round((leadershipCallings / memberCount) * 100) : 0,
      recentConvertPct: memberCount > 0 ? Math.round((recentConvertCount / memberCount) * 100) : 0,
      ministeringCoveragePct: memberCount > 0 ? Math.round((ministeringCoverageCount / memberCount) * 100) : 0
    };
  });
};

export const getUnitReadinessScatterData = async (): Promise<UnitReadinessScatterRow[]> => {
  const result = await query<{
    unitName: string;
    seminaryEligible: string;
    seminaryAttending: string;
    instituteEligible: string;
    instituteAttending: string;
    readinessEligibleCount: string;
    activeRecommendCount: string;
    ministeringAssignedCount: string;
  }>(
    `
    WITH scoped AS (
      SELECT
        COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS unit_name,
        ${youthProgramAgeSql()} AS youth_program_age,
        ${actualAgeSql()} AS actual_age,
        COALESCE(m.is_attending_seminary, false) AS is_attending_seminary,
        COALESCE(m.is_attending_institute, false) AS is_attending_institute,
        COALESCE(m.temple_recommend_status, '') ~* '^active' AS has_active_recommend,
        (COALESCE(m.has_ministering_brothers, false) OR COALESCE(m.has_ministering_sisters, false)) AS has_assigned_ministers
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
    )
    SELECT
      unit_name AS "unitName",
      COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 18)::text AS "seminaryEligible",
      COUNT(*) FILTER (WHERE youth_program_age BETWEEN 14 AND 18 AND is_attending_seminary = true)::text AS "seminaryAttending",
      COUNT(*) FILTER (WHERE actual_age BETWEEN 18 AND 35)::text AS "instituteEligible",
      COUNT(*) FILTER (WHERE actual_age BETWEEN 18 AND 35 AND COALESCE(is_attending_institute, false) = true)::text AS "instituteAttending",
      COUNT(*) FILTER (WHERE (youth_program_age BETWEEN 12 AND 18) OR (actual_age BETWEEN 18 AND 35))::text AS "readinessEligibleCount",
      COUNT(*) FILTER (
        WHERE ((youth_program_age BETWEEN 12 AND 18) OR (actual_age BETWEEN 18 AND 35))
          AND has_active_recommend = true
      )::text AS "activeRecommendCount",
      COUNT(*) FILTER (
        WHERE ((youth_program_age BETWEEN 12 AND 18) OR (actual_age BETWEEN 18 AND 35))
          AND has_assigned_ministers = true
      )::text AS "ministeringAssignedCount"
    FROM scoped
    GROUP BY unit_name
    ORDER BY unit_name
    `
  );

  return result.rows
    .map((row) => {
      const seminaryEligible = Number.parseInt(row.seminaryEligible, 10);
      const seminaryAttending = Number.parseInt(row.seminaryAttending, 10);
      const instituteEligible = Number.parseInt(row.instituteEligible, 10);
      const instituteAttending = Number.parseInt(row.instituteAttending, 10);
      const readinessEligibleCount = Number.parseInt(row.readinessEligibleCount, 10);
      const activeRecommendCount = Number.parseInt(row.activeRecommendCount, 10);
      const ministeringAssignedCount = Number.parseInt(row.ministeringAssignedCount, 10);
      const seminaryParticipationPct =
        seminaryEligible > 0 ? Math.round((seminaryAttending / seminaryEligible) * 100) : 0;
      const instituteParticipationPct =
        instituteEligible > 0 ? Math.round((instituteAttending / instituteEligible) * 100) : 0;
      const activeRecommendPct =
        readinessEligibleCount > 0 ? Math.round((activeRecommendCount / readinessEligibleCount) * 100) : 0;
      const ministeringAssignmentPct =
        readinessEligibleCount > 0 ? Math.round((ministeringAssignedCount / readinessEligibleCount) * 100) : 0;
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
};

export const getRecentBaptismReport = async (monthsBack = 12): Promise<RecentBaptismReport> => {
  const safeMonthsBack = Math.max(1, Math.min(monthsBack, 36));
  const result = await query<RecentBaptismRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.baptism_date::text AS "baptismDate",
      m.confirmation_date::text AS "confirmationDate",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    WHERE m.baptism_date IS NOT NULL
      AND m.baptism_date >= date_trunc('day', NOW()) - ($1::int || ' months')::interval
    ORDER BY m.baptism_date DESC, m.last_name, m.first_name
    LIMIT 5000
    `,
    [safeMonthsBack]
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const summary = {
    last30: 0,
    last90: 0,
    thisYear: 0
  };

  for (const row of result.rows) {
    if (!row.baptismDate) {
      continue;
    }
    const baptismDate = new Date(row.baptismDate);
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
    members: result.rows
  };
};

export const getRecentBaptismPathCohort = async (): Promise<RecentBaptismPathRow[]> => {
  const [cohortRows, ministeringRows] = await Promise.all([
    query<{
      lcrMemberId: string;
      fullName: string;
      unitName: string;
      baptismDate: string | null;
      templeRecommendStatus: string | null;
      hasCurrentCalling: boolean;
      currentCalling: string | null;
      ministeringAssigned: boolean;
    }>(
      `
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        m.baptism_date::text AS "baptismDate",
        m.temple_recommend_status AS "templeRecommendStatus",
        EXISTS (SELECT 1 FROM current_callings_dedup c WHERE c.member_id = m.id) AS "hasCurrentCalling",
        c.title AS "currentCalling",
        (COALESCE(m.has_ministering_brothers, false) OR COALESCE(m.has_ministering_sisters, false)) AS "ministeringAssigned"
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      LEFT JOIN LATERAL (
        SELECT title
        FROM current_callings_dedup
        WHERE member_id = m.id
        ORDER BY sustained_on DESC NULLS LAST, updated_at DESC
        LIMIT 1
      ) c ON TRUE
      WHERE m.baptism_date IS NOT NULL
        AND m.baptism_date >= date_trunc('day', NOW()) - interval '24 months'
      ORDER BY m.baptism_date DESC, m.last_name, m.first_name
      LIMIT 5000
      `
    ),
    query<{ ministeringBrothers: string | null; ministeringSisters: string | null }>(
      `
      SELECT
        m.ministering_brothers AS "ministeringBrothers",
        m.ministering_sisters AS "ministeringSisters"
      FROM members m
      WHERE NULLIF(BTRIM(COALESCE(m.ministering_brothers, '')), '') IS NOT NULL
         OR NULLIF(BTRIM(COALESCE(m.ministering_sisters, '')), '') IS NOT NULL
      `
    )
  ]);

  const assignedMinisterVariants = new Set<string>();
  for (const row of ministeringRows.rows) {
    for (const entry of [...splitMinisteringAssignments(row.ministeringBrothers), ...splitMinisteringAssignments(row.ministeringSisters)]) {
      for (const variant of buildNameVariants(entry)) {
        assignedMinisterVariants.add(variant);
      }
    }
  }

  return cohortRows.rows.map((row) => {
    const assignedAsMinister = buildNameVariants(row.fullName).some((variant) => assignedMinisterVariants.has(variant));

    return {
      ...row,
      currentCalling: cleanCallingTitle(row.currentCalling) || null,
      assignedAsMinister,
      assignedAsMinisterLabel: assignedAsMinister ? "Yes" : "No"
    };
  });
};

export const getRecommendExpirationRiskReport = async (): Promise<RecommendExpirationRiskReport> => {
  const result = await query<RecommendExpirationRiskRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.temple_recommend_status AS "templeRecommendStatus",
      m.temple_recommend_expiration_date::text AS "expirationDate",
      CASE
        WHEN m.temple_recommend_expiration_date IS NULL THEN NULL
        ELSE (m.temple_recommend_expiration_date - CURRENT_DATE)
      END AS "daysUntilExpiration"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    WHERE m.temple_recommend_expiration_date IS NOT NULL
      AND m.temple_recommend_expiration_date <= CURRENT_DATE + INTERVAL '90 days'
    ORDER BY m.temple_recommend_expiration_date ASC, "unitName", m.last_name, m.first_name
    LIMIT 5000
    `
  );

  const summary = {
    expired: 0,
    next30: 0,
    next90: 0
  };

  for (const row of result.rows) {
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
    members: result.rows
  };
};

export const getMinisteringGapReport = async (): Promise<MinisteringGapReport> => {
  const result = await query<MinisteringGapRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      'No Assigned Ministers' AS "gapCategory",
      m.has_ministering_brothers AS "hasMinisteringBrothers",
      m.has_ministering_sisters AS "hasMinisteringSisters",
      m.ministering_brothers AS "ministeringBrothers",
      m.ministering_sisters AS "ministeringSisters",
      m.spouse_name AS "spouseName",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    WHERE (m.member_status IS NULL OR m.member_status ILIKE 'active%')
      AND COALESCE(m.has_ministering_brothers, false) = false
      AND COALESCE(m.has_ministering_sisters, false) = false
    ORDER BY "unitName", m.last_name, m.first_name
    LIMIT 5000
    `
  );

  const summaryMap = result.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.gapCategory] = (acc[row.gapCategory] ?? 0) + 1;
    return acc;
  }, {});

  return {
    summary: [{ label: "No Assigned Ministers", value: summaryMap["No Assigned Ministers"] ?? 0 }],
    members: result.rows
  };
};

export const getSeminaryInstituteOpportunityReport = async (): Promise<SeminaryInstituteOpportunityRow[]> => {
  const result = await query<SeminaryInstituteOpportunityRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      ${actualAgeSql()} AS age,
      CASE
        WHEN ${isSeminaryEligibleSql()} THEN 'Seminary'
        ELSE 'Institute'
      END AS track,
      CASE
        WHEN ${isSeminaryEligibleSql()} THEN m.is_attending_seminary
        ELSE m.is_attending_institute
      END AS attending,
      CASE
        WHEN ${isSeminaryEligibleSql()} THEN m.potential_seminary_student
        ELSE m.potential_institute_student
      END AS "potentialFlag",
      CASE
        WHEN ${isSeminaryEligibleSql()} THEN m.seminary_status
        ELSE m.institute_status
      END AS "statusText",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    WHERE (
        ${isSeminaryEligibleSql()}
        AND COALESCE(m.is_attending_seminary, false) = false
      )
      OR (
        ${actualAgeSql()} BETWEEN 18 AND 35
        AND COALESCE(m.is_attending_institute, false) = false
      )
    ORDER BY track, "unitName", age DESC NULLS LAST, m.last_name, m.first_name
    LIMIT 5000
    `
  );

  return result.rows;
};

export const getHouseholdOutreachReport = async (): Promise<HouseholdOutreachReport> => {
  const result = await query<{
    householdId: number;
    householdName: string;
    headOfHouse: string | null;
    unitName: string;
    memberCount: string;
    youthCount: string;
    recentBaptismCount: string;
    recommendRiskCount: string;
    ministeringGapCount: string;
    householdEmails: string | null;
    householdPhones: string | null;
  }>(
    `
    SELECT
      h.id AS "householdId",
      COALESCE(NULLIF(h.household_name, ''), MAX(NULLIF(m.head_of_house, '')), 'Household') AS "householdName",
      MAX(NULLIF(m.head_of_house, '')) AS "headOfHouse",
      COALESCE(MAX(NULLIF(m.unit_name, '')), MAX(u.name), 'Unknown') AS "unitName",
      COUNT(DISTINCT m.id)::text AS "memberCount",
      COUNT(DISTINCT m.id) FILTER (
        WHERE ${isYouthOrYsaSql()}
      )::text AS "youthCount",
      COUNT(DISTINCT m.id) FILTER (
        WHERE m.baptism_date IS NOT NULL
          AND m.baptism_date >= date_trunc('day', NOW()) - interval '12 months'
      )::text AS "recentBaptismCount",
      COUNT(DISTINCT m.id) FILTER (
        WHERE m.temple_recommend_expiration_date IS NOT NULL
          AND m.temple_recommend_expiration_date <= CURRENT_DATE + INTERVAL '90 days'
      )::text AS "recommendRiskCount",
      COUNT(DISTINCT m.id) FILTER (
        WHERE COALESCE(m.has_ministering_brothers, false) = false
          AND COALESCE(m.has_ministering_sisters, false) = false
      )::text AS "ministeringGapCount",
      STRING_AGG(DISTINCT e.email, ' | ') FILTER (WHERE e.email IS NOT NULL) AS "householdEmails",
      STRING_AGG(DISTINCT p.phone_number, ' | ') FILTER (WHERE p.phone_number IS NOT NULL) AS "householdPhones"
    FROM households h
    JOIN members m ON m.household_id = h.id
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    GROUP BY h.id, h.household_name
    HAVING
      COUNT(DISTINCT m.id) FILTER (
        WHERE ${isYouthOrYsaSql()}
      ) > 0
      OR COUNT(DISTINCT m.id) FILTER (
        WHERE m.baptism_date IS NOT NULL
          AND m.baptism_date >= date_trunc('day', NOW()) - interval '12 months'
      ) > 0
      OR COUNT(DISTINCT m.id) FILTER (
        WHERE m.temple_recommend_expiration_date IS NOT NULL
          AND m.temple_recommend_expiration_date <= CURRENT_DATE + INTERVAL '90 days'
      ) > 0
      OR COUNT(DISTINCT m.id) FILTER (
        WHERE COALESCE(m.has_ministering_brothers, false) = false
          AND COALESCE(m.has_ministering_sisters, false) = false
      ) > 0
    ORDER BY "unitName", "householdName"
    LIMIT 5000
    `
  );

  const households = result.rows.map<HouseholdOutreachRow>((row) => {
    const youthCount = Number.parseInt(row.youthCount, 10);
    const recentBaptismCount = Number.parseInt(row.recentBaptismCount, 10);
    const recommendRiskCount = Number.parseInt(row.recommendRiskCount, 10);
    const ministeringGapCount = Number.parseInt(row.ministeringGapCount, 10);
    const focusAreas = [
      youthCount > 0 ? "Youth / YSA" : null,
      recentBaptismCount > 0 ? "Recent Baptism" : null,
      recommendRiskCount > 0 ? "Recommend Risk" : null,
      ministeringGapCount > 0 ? "Ministering Gap" : null
    ].filter(Boolean) as string[];

    return {
      householdId: row.householdId,
      householdName: row.householdName,
      headOfHouse: row.headOfHouse,
      unitName: row.unitName,
      memberCount: Number.parseInt(row.memberCount, 10),
      youthCount,
      recentBaptismCount,
      recommendRiskCount,
      ministeringGapCount,
      householdEmails: row.householdEmails ?? "",
      householdPhones: row.householdPhones ?? "",
      focusAreas
    };
  });

  const summary = [
    { label: "Youth / YSA", value: households.filter((household) => household.youthCount > 0).length },
    { label: "Recent Baptism", value: households.filter((household) => household.recentBaptismCount > 0).length },
    { label: "Recommend Risk", value: households.filter((household) => household.recommendRiskCount > 0).length },
    { label: "Ministering Gap", value: households.filter((household) => household.ministeringGapCount > 0).length }
  ];

  return { summary, households };
};

export const getNewReturningStrengtheningReport = async (): Promise<NewReturningStrengtheningReport> => {
  const result = await query<NewReturningStrengtheningRow>(
    `
    WITH normalized_history AS (
      SELECT
        h.member_id,
        h.snapshot_at,
        COALESCE(h.temple_recommend_status, '') ~* '^active' AS is_active,
        LAG(COALESCE(h.temple_recommend_status, '') ~* '^active')
          OVER (PARTITION BY h.member_id ORDER BY h.snapshot_at) AS prev_is_active,
        MAX(
          CASE WHEN COALESCE(h.temple_recommend_status, '') !~* '^active' THEN h.snapshot_at END
        ) OVER (
          PARTITION BY h.member_id
          ORDER BY h.snapshot_at
          ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS last_non_active_at
      FROM member_status_history h
    ),
    reactivations AS (
      SELECT
        member_id,
        snapshot_at AS reactivated_at,
        EXTRACT(DAY FROM snapshot_at - last_non_active_at)::int AS inactive_days
      FROM normalized_history
      WHERE is_active = true
        AND COALESCE(prev_is_active, false) = false
        AND last_non_active_at IS NOT NULL
    ),
    latest_reactivation AS (
      SELECT DISTINCT ON (member_id)
        member_id,
        reactivated_at,
        inactive_days
      FROM reactivations
      WHERE inactive_days >= 365
      ORDER BY member_id, reactivated_at DESC
    )
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      CASE
        WHEN lr.member_id IS NOT NULL THEN 'Recommend Recovered (1y+)'
        WHEN m.is_convert = true THEN 'Convert'
        WHEN m.move_in_date IS NOT NULL THEN 'Move-in'
        ELSE 'Returning Member'
      END AS "focusCategory",
      COALESCE(m.baptism_date, m.move_in_date)::text AS "focusDate",
      m.temple_recommend_status AS "templeRecommendStatus",
      EXISTS (SELECT 1 FROM current_callings_dedup c WHERE c.member_id = m.id) AS "hasCurrentCalling",
      (COALESCE(m.has_ministering_brothers, false) OR COALESCE(m.has_ministering_sisters, false)) AS "ministeringAssigned",
      (lr.member_id IS NOT NULL) AS "recoveredAfterLongLapse",
      lr.reactivated_at::text AS "reactivatedAt",
      lr.inactive_days AS "inactiveDays"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN latest_reactivation lr ON lr.member_id = m.id
    WHERE (
        m.is_convert = true
        AND COALESCE(m.baptism_date, m.move_in_date) >= date_trunc('day', NOW()) - interval '24 months'
      )
      OR (
        m.move_in_date IS NOT NULL
        AND m.move_in_date >= date_trunc('day', NOW()) - interval '24 months'
      )
      OR lr.member_id IS NOT NULL
    ORDER BY COALESCE(m.baptism_date, m.move_in_date) DESC NULLS LAST, m.last_name, m.first_name
    LIMIT 5000
    `
  );

  const summaryMap = result.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.focusCategory] = (acc[row.focusCategory] ?? 0) + 1;
    return acc;
  }, {});

  return {
    summary: [
      { label: "Convert", value: summaryMap.Convert ?? 0 },
      { label: "Move-in", value: summaryMap["Move-in"] ?? 0 },
      { label: "Recommend Recovered (1y+)", value: summaryMap["Recommend Recovered (1y+)"] ?? 0 }
    ],
    members: result.rows
  };
};

export const getPriesthoodProgressionReport = async (): Promise<PriesthoodProgressionReport> => {
  const result = await query<PriesthoodProgressionRow>(
    `
    WITH base AS (
      SELECT
        m.lcr_member_id AS "lcrMemberId",
        ${fullNameExpr} AS "fullName",
        COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
        COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
        COALESCE(NULLIF(p.current_office, ''), NULLIF(m.priesthood_office, '')) AS "currentOffice"
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      LEFT JOIN priesthood p ON p.member_id = m.id
      WHERE COALESCE(m.gender, '') ~* '^(m|male)$'
    ),
    candidates AS (
      SELECT
        b.*,
        CASE
          WHEN age >= 30 AND COALESCE("currentOffice", '') ~* '^elder$' THEN 'High Priest'
          WHEN age >= 18 AND COALESCE("currentOffice", '') !~* '(elder|high priest)' THEN 'Elder'
          WHEN age >= 16 AND COALESCE("currentOffice", '') !~* '(priest|elder|high priest)' THEN 'Priest'
          WHEN age >= 14 AND COALESCE("currentOffice", '') !~* '(teacher|priest|elder|high priest)' THEN 'Teacher'
          ELSE NULL
        END AS "recommendedNextOffice"
      FROM base b
    )
    SELECT
      "lcrMemberId",
      "fullName",
      "unitName",
      age,
      "currentOffice",
      "recommendedNextOffice"
    FROM candidates
    WHERE "recommendedNextOffice" IS NOT NULL
    ORDER BY "recommendedNextOffice", age DESC NULLS LAST, "unitName", "fullName"
    LIMIT 5000
    `
  );

  const summaryMap = result.rows.reduce<Record<string, number>>((acc, row) => {
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
    members: result.rows
  };
};

export const getRecentMoveInsReport = async () => {
  const result = await query<{
    lcrMemberId: string;
    unitName: string;
    fullName: string;
    moveInDate: string | null;
    phoneNumber: string | null;
    email: string | null;
  }>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      COALESCE(NULLIF(m.unit_name, ''), u.name, 'Unknown') AS "unitName",
      ${fullNameExpr} AS "fullName",
      m.move_in_date::text AS "moveInDate",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    WHERE m.move_in_date IS NOT NULL
      AND m.move_in_date >= date_trunc('day', NOW()) - interval '12 months'
    ORDER BY m.move_in_date DESC, m.last_name, m.first_name
    LIMIT 100
    `
  );

  return result.rows;
};

export const getMemberDetail = async (lcrMemberId: string): Promise<MemberDetail | null> => {
  const memberResult = await query<{
    id: number;
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
  }>(
    `
    SELECT
      m.id,
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      m.preferred_name AS "preferredName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      COALESCE(m.age, EXTRACT(YEAR FROM AGE(NOW(), m.birthdate))::int) AS age,
      m.gender,
      m.birthdate::text,
      m.birth_country AS "birthCountry",
      m.birthplace,
      m.move_in_date::text AS "moveInDate",
      m.member_status AS "memberStatus",
      m.baptism_date::text AS "baptismDate",
      m.confirmation_date::text AS "confirmationDate",
      m.is_accountable AS "isAccountable",
      m.is_born_in_covenant AS "isBornInCovenant",
      m.is_divorced AS "isDivorced",
      m.is_married AS "isMarried",
      m.marriage_date::text AS "marriageDate",
      m.marriage_status AS "marriageStatus",
      m.endowment_status AS "endowmentStatus",
      m.endowment_date::text AS "endowmentDate",
      m.temple_recommend_status AS "templeRecommendStatus",
      m.temple_recommend_expiration_date::text AS "templeRecommendExpirationDate",
      m.temple_recommend_type AS "templeRecommendType",
      m.mission_status AS "missionStatus",
      m.mission_language AS "missionLanguage",
      m.mission_country AS "missionCountry",
      m.priesthood AS "priesthoodType",
      m.priesthood_office AS "priesthoodOffice",
      m.ordination_date::text AS "ordinationDate",
      m.institute_status AS "instituteStatus",
      m.seminary_status AS "seminaryStatus",
      m.is_attending_seminary AS "isAttendingSeminary",
      m.is_attending_institute AS "isAttendingInstitute",
      m.potential_institute_student AS "potentialInstituteStudent",
      m.potential_seminary_student AS "potentialSeminaryStudent",
      m.ministering_brothers AS "ministeringBrothers",
      m.ministering_sisters AS "ministeringSisters",
      m.spouse_name AS "spouseName",
      m.head_of_house AS "headOfHouse",
      m.household_position AS "householdPosition",
      m.sealing_to_parents AS "sealingToParents",
      m.sealing_to_spouse AS "sealingToSpouse",
      m.household_id AS "householdId",
      h.household_name AS "householdName",
      COALESCE(m.address_line1, h.address_line1) AS "addressLine1",
      COALESCE(m.address_line2, h.address_line2) AS "addressLine2",
      COALESCE(m.address_city, h.city) AS city,
      COALESCE(m.address_state_or_province, h.state) AS "stateOrProvince",
      COALESCE(m.address_postal_code, h.postal_code) AS "postalCode",
      COALESCE(m.address_country, h.country) AS country
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    LEFT JOIN households h ON m.household_id = h.id
    WHERE m.lcr_member_id = $1
    LIMIT 1
    `,
    [lcrMemberId]
  );

  const member = memberResult.rows[0];
  if (!member) {
    return null;
  }

  const [emailRows, phoneRows, callingRows, householdRows] = await Promise.all([
    query<{ email: string }>(
      `
      SELECT email
      FROM emails
      WHERE member_id = $1
      ORDER BY is_primary DESC, updated_at DESC
      `,
      [member.id]
    ),
    query<{ phoneNumber: string }>(
      `
      SELECT phone_number AS "phoneNumber"
      FROM phone_numbers
      WHERE member_id = $1
      ORDER BY is_primary DESC, updated_at DESC
      `,
      [member.id]
    ),
    query<{
      callingTitle: string;
      organizationName: string | null;
      sustainedOn: string | null;
      setApartOn: string | null;
    }>(
      `
      SELECT
        c.title AS "callingTitle",
        o.name AS "organizationName",
        c.sustained_on::text AS "sustainedOn",
        c.set_apart_on::text AS "setApartOn"
      FROM current_callings_dedup c
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE c.member_id = $1
      ORDER BY c.sustained_on DESC NULLS LAST, c.title
      `,
      [member.id]
    ),
    member.householdId
      ? query<{
          lcrMemberId: string;
          fullName: string;
          age: number | null;
          gender: string | null;
          householdPosition: string | null;
        }>(
          `
          SELECT
            hm.lcr_member_id AS "lcrMemberId",
            TRIM(CONCAT(hm.first_name, ' ', hm.last_name)) AS "fullName",
            COALESCE(hm.age, EXTRACT(YEAR FROM AGE(NOW(), hm.birthdate))::int) AS age,
            hm.gender,
            hm.household_position AS "householdPosition"
          FROM members hm
          WHERE hm.household_id = $1
          ORDER BY age DESC NULLS LAST, hm.last_name, hm.first_name
          `,
          [member.householdId]
        )
      : Promise.resolve({
          rows: [] as Array<{
            lcrMemberId: string;
            fullName: string;
            age: number | null;
            gender: string | null;
            householdPosition: string | null;
          }>
        })
  ]);

  const byCallingTitle = new Map<string, { callingTitle: string; organizationName: string | null; sustainedOn: string | null; setApartOn: string | null }>();
  for (const row of callingRows.rows) {
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

  return {
    ...member,
    emails: emailRows.rows.map((row) => row.email),
    phoneNumbers: phoneRows.rows.map((row) => row.phoneNumber),
    currentCallings,
    householdMembers: householdRows.rows.map((row) => ({
      ...row,
      relationshipHint: row.lcrMemberId === member.lcrMemberId ? "Self" : row.householdPosition ?? "Household"
    }))
  };
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
  const rosterRows = await query<CommitteeMemberRow>(
    `
    SELECT
      m.lcr_member_id AS "lcrMemberId",
      ${fullNameExpr} AS "fullName",
      COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName",
      c.title AS "callingTitle",
      c.sustained_on::text AS "sustainedOn",
      e.email
    FROM current_callings_dedup c
    JOIN members m ON c.member_id = m.id
    LEFT JOIN units u ON c.unit_id = u.id
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    ORDER BY "unitName", m.last_name, m.first_name
    `
  );

  const cleanedRosterRows = rosterRows.rows.map((row) => ({
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
      email: null
    }))
  );

  const filtered = flattened.filter((row) => (unitFilter ? (row.unitName ?? "").toLowerCase().includes(unitFilter) : true));
  if (filtered.length === 0) {
    return [];
  }

  const uniqueNames = Array.from(new Set(filtered.map((row) => row.fullName)));
  const contactRows = await query<{
    fullName: string;
    phoneNumber: string | null;
    email: string | null;
  }>(
    `
    SELECT
      ${fullNameExpr} AS "fullName",
      p.phone_number AS "phoneNumber",
      e.email
    FROM members m
    LEFT JOIN LATERAL (
      SELECT phone_number
      FROM phone_numbers
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT email
      FROM emails
      WHERE member_id = m.id
      ORDER BY is_primary DESC, updated_at DESC
      LIMIT 1
    ) e ON TRUE
    WHERE ${fullNameExpr} = ANY($1::text[])
    `
    ,
    [uniqueNames]
  );

  const contactMap = new Map<string, { phoneNumber: string | null; email: string | null }>();
  for (const row of contactRows.rows) {
    if (!contactMap.has(row.fullName)) {
      contactMap.set(row.fullName, { phoneNumber: row.phoneNumber, email: row.email });
    }
  }

  const enriched = filtered.map((row) => ({
    ...row,
    phoneNumber: contactMap.get(row.fullName)?.phoneNumber ?? null,
    email: contactMap.get(row.fullName)?.email ?? null
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
};

export const getDashboardUnits = async () => {
  const result = await query<{ unitName: string }>(
    `
    SELECT DISTINCT COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') AS "unitName"
    FROM members m
    LEFT JOIN units u ON m.unit_id = u.id
    WHERE COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') IS NOT NULL
      AND COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') <> 'Unknown'
    ORDER BY 1
    `
  );

  return result.rows.map((row) => row.unitName);
};

export const getStakeOverview = async (unit?: string | null) => {
  const unitScope = normalizeUnitScope(unit);
  const [members, callings, memberCallingCoverage, latestSync] = await Promise.all([
    query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
      `,
      [unitScope]
    ),
    query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM current_callings_dedup c
      LEFT JOIN units u ON c.unit_id = u.id
      WHERE c.member_id IS NOT NULL
        AND ($1::text IS NULL OR COALESCE(NULLIF(u.name, ''), 'Unknown') = $1)
      `,
      [unitScope]
    ),
    query<{ withCurrentCalling: string; withoutCurrentCalling: string }>(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM current_callings_dedup c
            WHERE c.member_id = m.id
          )
        )::text AS "withCurrentCalling",
        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM current_callings_dedup c
            WHERE c.member_id = m.id
          )
        )::text AS "withoutCurrentCalling"
      FROM members m
      LEFT JOIN units u ON m.unit_id = u.id
      WHERE ($1::text IS NULL OR COALESCE(NULLIF(m.unit_name, ''), u.name, m.unit_abbreviation, 'Unknown') = $1)
      `,
      [unitScope]
    ),
    query<{
      syncType: string;
      status: string;
      completedAt: string | null;
    }>(
      `
      SELECT
        sync_type AS "syncType",
        status,
        completed_at::text AS "completedAt"
      FROM sync_logs
      WHERE status = 'success'
        AND sync_type IN ('nightly_full_directory_sync', 'hourly_calling_sync')
      ORDER BY started_at DESC
      LIMIT 1
      `
    )
  ]);

  return {
    totalMembers: Number.parseInt(members.rows[0]?.count ?? "0", 10),
    currentCallings: Number.parseInt(callings.rows[0]?.count ?? "0", 10),
    membersWithCurrentCalling: Number.parseInt(memberCallingCoverage.rows[0]?.withCurrentCalling ?? "0", 10),
    membersWithoutCurrentCalling: Number.parseInt(memberCallingCoverage.rows[0]?.withoutCurrentCalling ?? "0", 10),
    latestSync: latestSync.rows[0] ?? null
  };
};

export const closePool = async () => {
  await pool.end();
};
