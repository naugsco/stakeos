import { getSqliteSpikeStatus, openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import type { MemberDetail } from "@/src/services/intelligenceService";
import type { DashboardOverviewMetrics } from "@/src/types/dashboard";

interface SpikeMemberRow {
  lcrMemberId?: string;
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
        lcr_member_id AS lcrMemberId,
        COALESCE(NULLIF(preferred_name, ''), TRIM(first_name || ' ' || last_name)) AS fullName,
        preferred_name AS preferredName,
        COALESCE(NULLIF(unit_name, ''), NULLIF(unit_abbreviation, ''), 'Unknown') AS unitName,
        age,
        gender,
        birthdate,
        birth_country AS birthCountry,
        birthplace,
        move_in_date AS moveInDate,
        member_status AS memberStatus,
        baptism_date AS baptismDate,
        confirmation_date AS confirmationDate,
        is_accountable AS isAccountable,
        is_born_in_covenant AS isBornInCovenant,
        is_divorced AS isDivorced,
        is_married AS isMarried,
        marriage_date AS marriageDate,
        marriage_status AS marriageStatus,
        endowment_status AS endowmentStatus,
        endowment_date AS endowmentDate,
        temple_recommend_status AS templeRecommendStatus,
        temple_recommend_expiration_date AS templeRecommendExpirationDate,
        temple_recommend_type AS templeRecommendType,
        mission_status AS missionStatus,
        mission_language AS missionLanguage,
        mission_country AS missionCountry,
        priesthood_type AS priesthoodType,
        priesthood_office AS priesthoodOffice,
        ordination_date AS ordinationDate,
        institute_status AS instituteStatus,
        seminary_status AS seminaryStatus,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute,
        potential_institute_student AS potentialInstituteStudent,
        potential_seminary_student AS potentialSeminaryStudent,
        ministering_brothers AS ministeringBrothers,
        ministering_sisters AS ministeringSisters,
        spouse_name AS spouseName,
        head_of_house AS headOfHouse,
        household_position AS householdPosition,
        sealing_to_parents AS sealingToParents,
        sealing_to_spouse AS sealingToSpouse,
        address_line1 AS addressLine1,
        address_line2 AS addressLine2,
        city,
        state_or_province AS stateOrProvince,
        postal_code AS postalCode,
        country,
        primary_email AS primaryEmail,
        primary_phone AS primaryPhone
       FROM members
       WHERE lcr_member_id = ?
       LIMIT 1`
    ).get(lcrMemberId) as SpikeMemberRow | undefined;

    if (!member) {
      return null;
    }

    const currentCallings = db.prepare(
      `SELECT
        title AS callingTitle,
        NULL AS organizationName,
        NULL AS sustainedOn,
        NULL AS setApartOn
       FROM callings
       WHERE is_current = 1
         AND lcr_member_id = ?
       ORDER BY title`
    ).all(lcrMemberId) as MemberDetail["currentCallings"];

    return {
      lcrMemberId: member.lcrMemberId ?? lcrMemberId,
      fullName: `${member.preferredName ?? `${member.firstName} ${member.lastName}`}`,
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
      householdId: null,
      householdName: null,
      addressLine1: member.addressLine1 ?? null,
      addressLine2: member.addressLine2 ?? null,
      city: member.city ?? null,
      stateOrProvince: member.stateOrProvince ?? null,
      postalCode: member.postalCode ?? null,
      country: member.country ?? null,
      emails: member.primaryEmail ? [member.primaryEmail] : [],
      phoneNumbers: member.primaryPhone ? [member.primaryPhone] : [],
      currentCallings,
      householdMembers: []
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
      recommendExpirationRisk: []
    };
  }

  const db = openSqliteSpikeDb();
  try {
    const members = db.prepare(
      `SELECT
        unit_name AS unitName,
        unit_abbreviation AS unitAbbreviation,
        age,
        birthdate,
        mission_status AS missionStatus,
        mission_country AS missionCountry,
        is_returned_missionary AS isReturnedMissionary,
        is_attending_seminary AS isAttendingSeminary,
        is_attending_institute AS isAttendingInstitute,
        temple_recommend_status AS templeRecommendStatus,
        is_convert AS isConvert,
        baptism_date AS baptismDate,
        move_in_date AS moveInDate
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
      recommendExpirationRisk: dashboard.recommendExpirationRisk
    };
  } finally {
    db.close();
  }
};
