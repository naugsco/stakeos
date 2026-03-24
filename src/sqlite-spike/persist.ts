import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { ensureSqliteSpikeSchema, openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import type { CallingRecord, DirectorySnapshot, MemberRecord } from "@/src/types/directory";

interface PersistResult {
  recordsProcessed: number;
}

interface SqliteMemberSnapshotSeedRow {
  lcrMemberId: string;
  lcrHouseholdId: string | null;
  unitNumber: string;
  unitName: string | null;
  unitAbbreviation: string | null;
  preferredName: string | null;
  firstName: string;
  lastName: string;
  gender: string | null;
  birthdate: string | null;
  birthCountry: string | null;
  birthplace: string | null;
  age: number | null;
  memberStatus: string | null;
  moveInDate: string | null;
  isConvert: number | null;
  baptismDate: string | null;
  confirmationDate: string | null;
  endowmentDate: string | null;
  endowmentStatus: string | null;
  templeEndowed: number | null;
  templeRecommendStatus: string | null;
  templeRecommendExpirationDate: string | null;
  templeRecommendType: string | null;
  missionStatus: string | null;
  missionLanguage: string | null;
  missionCountry: string | null;
  isReturnedMissionary: number | null;
  isAccountable: number | null;
  isBornInCovenant: number | null;
  isDivorced: number | null;
  isMarried: number | null;
  isSingle: number | null;
  marriageDate: string | null;
  marriageStatus: string | null;
  isAttendingSeminary: number | null;
  isAttendingInstitute: number | null;
  potentialInstituteStudent: number | null;
  potentialSeminaryStudent: number | null;
  hasMinisteringBrothers: number | null;
  hasMinisteringSisters: number | null;
  ministeringBrothers: string | null;
  ministeringSisters: string | null;
  spouseName: string | null;
  headOfHouse: string | null;
  householdPosition: string | null;
  sealingToParents: string | null;
  sealingToSpouse: string | null;
  priesthoodType: string | null;
  priesthoodOffice: string | null;
  ordinationDate: string | null;
  instituteStatus: string | null;
  seminaryStatus: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressStateOrProvince: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
}

interface SqliteCallingSnapshotSeedRow {
  lcrCallingId: string;
  unitNumber: string;
  unitName: string | null;
  lcrMemberId: string | null;
  lcrOrganizationId: string | null;
  organizationName: string | null;
  title: string;
  sustainedOn: string | null;
  setApartOn: string | null;
  releasedOn: string | null;
  isCurrent: number;
}

const boolToInt = (value?: boolean) => (value ? 1 : 0);
const isoNow = () => new Date().toISOString();
const fullName = (member: Pick<MemberRecord, "firstName" | "lastName">) => `${member.firstName} ${member.lastName}`.trim();
const hashSnapshot = (value: Record<string, unknown>) =>
  createHash("md5").update(JSON.stringify(value)).digest("hex");
const normalizeDelimitedNames = (value?: string | null) => {
  const normalized = (value ?? "")
    .split(/\s*\/\s*/)
    .map((entry) => entry.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  return normalized.length ? normalized.join(" / ") : null;
};

const insertSyncLog = (db: Database.Database, syncType: string) => {
  const startedAt = isoNow();
  const result = db
    .prepare(
      `INSERT INTO sync_logs (sync_type, status, started_at)
       VALUES (?, 'running', ?)`
    )
    .run(syncType, startedAt);

  return Number(result.lastInsertRowid);
};

const completeSyncLog = (
  db: Database.Database,
  logId: number,
  status: "success" | "error",
  recordsProcessed: number,
  errorMessage?: string
) => {
  db.prepare(
    `UPDATE sync_logs
     SET status = ?, completed_at = ?, records_processed = ?, error_message = ?
     WHERE id = ?`
  ).run(status, isoNow(), recordsProcessed, errorMessage ?? null, logId);
};

const persistUnits = (db: Database.Database, snapshot: DirectorySnapshot) => {
  db.prepare("DELETE FROM units").run();

  const insertUnit = db.prepare(
    `INSERT INTO units (unit_number, name, unit_type, updated_at)
     VALUES (?, ?, ?, ?)`
  );

  for (const unit of snapshot.units) {
    insertUnit.run(unit.unitNumber, unit.name, unit.unitType ?? null, isoNow());
  }

  const rows = db.prepare(`SELECT id, unit_number AS unitNumber FROM units`).all() as Array<{ id: number; unitNumber: string }>;
  return new Map(rows.map((row) => [row.unitNumber, row.id]));
};

const persistHouseholds = (db: Database.Database, snapshot: DirectorySnapshot) => {
  db.prepare("DELETE FROM households").run();

  const insertHousehold = db.prepare(
    `INSERT INTO households (
      lcr_household_id, unit_number, household_name, address_line1, address_line2, city, state, postal_code, country, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const household of snapshot.households) {
    insertHousehold.run(
      household.lcrHouseholdId,
      household.unitNumber,
      household.householdName,
      household.addressLine1 ?? null,
      household.addressLine2 ?? null,
      household.city ?? null,
      household.state ?? null,
      household.postalCode ?? null,
      household.country ?? null,
      isoNow()
    );
  }

  const rows = db.prepare(
    `SELECT id, lcr_household_id AS lcrHouseholdId
     FROM households`
  ).all() as Array<{ id: number; lcrHouseholdId: string }>;

  return new Map(rows.map((row) => [row.lcrHouseholdId, row.id]));
};

const persistMembers = (
  db: Database.Database,
  snapshot: DirectorySnapshot,
  unitMap: Map<string, number>,
  householdMap: Map<string, number>
) => {
  db.prepare("DELETE FROM members").run();

  const insertMember = db.prepare(
    `INSERT INTO members (
      lcr_member_id, unit_id, household_id, lcr_household_id, unit_number, unit_name, unit_abbreviation, preferred_name,
      first_name, last_name, gender, address_line1, address_line2, city, state_or_province, postal_code, country,
      primary_email, primary_phone, birthdate, birth_country, birthplace, age, member_status, move_in_date, is_convert,
      baptism_date, confirmation_date, endowment_date, endowment_status, temple_endowed,
      temple_recommend_status, temple_recommend_expiration_date, temple_recommend_type,
      mission_status, mission_language, mission_country, is_returned_missionary, is_accountable, is_born_in_covenant,
      is_divorced, is_married, is_single, marriage_date, marriage_status,
      is_attending_seminary, is_attending_institute, potential_institute_student, potential_seminary_student,
      has_ministering_brothers, has_ministering_sisters, ministering_brothers, ministering_sisters,
      spouse_name, head_of_house, household_position, sealing_to_parents, sealing_to_spouse,
      priesthood_type, priesthood_office, ordination_date, institute_status, seminary_status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const member of snapshot.members) {
    insertMember.run(
      member.lcrMemberId,
      unitMap.get(member.unitNumber) ?? null,
      member.lcrHouseholdId ? householdMap.get(member.lcrHouseholdId) ?? null : null,
      member.lcrHouseholdId ?? null,
      member.unitNumber,
      member.unitName ?? null,
      member.unitAbbreviation ?? null,
      member.preferredName ?? null,
      member.firstName,
      member.lastName,
      member.gender ?? null,
      member.addressLine1 ?? null,
      member.addressLine2 ?? null,
      member.addressCity ?? null,
      member.addressStateOrProvince ?? null,
      member.addressPostalCode ?? null,
      member.addressCountry ?? null,
      member.emails[0]?.email ?? null,
      member.phoneNumbers[0]?.phoneNumber ?? null,
      member.birthdate ?? null,
      member.birthCountry ?? null,
      member.birthplace ?? null,
      member.age ?? null,
      member.memberStatus ?? null,
      member.moveInDate ?? null,
      boolToInt(member.isConvert),
      member.baptismDate ?? null,
      member.confirmationDate ?? null,
      member.endowmentDate ?? null,
      member.endowmentStatus ?? null,
      boolToInt(member.templeEndowed),
      member.templeRecommendStatus ?? null,
      member.templeRecommendExpirationDate ?? null,
      member.templeRecommendType ?? null,
      member.missionStatus ?? null,
      member.missionLanguage ?? null,
      member.missionCountry ?? null,
      boolToInt(member.isReturnedMissionary),
      boolToInt(member.isAccountable),
      boolToInt(member.isBornInCovenant),
      boolToInt(member.isDivorced),
      boolToInt(member.isMarried),
      boolToInt(member.isSingle),
      member.marriageDate ?? null,
      member.marriageStatus ?? null,
      boolToInt(member.isAttendingSeminary),
      boolToInt(member.isAttendingInstitute),
      boolToInt(member.potentialInstituteStudent),
      boolToInt(member.potentialSeminaryStudent),
      boolToInt(member.hasMinisteringBrothers),
      boolToInt(member.hasMinisteringSisters),
      member.ministeringBrothers ?? null,
      member.ministeringSisters ?? null,
      member.spouseName ?? null,
      member.headOfHouse ?? null,
      member.householdPosition ?? null,
      member.sealingToParents ?? null,
      member.sealingToSpouse ?? null,
      member.priesthoodType ?? null,
      member.priesthoodOffice ?? null,
      member.ordinationDate ?? null,
      member.instituteStatus ?? null,
      member.seminaryStatus ?? null,
      isoNow()
    );
  }
};

const persistCallings = (db: Database.Database, snapshot: DirectorySnapshot) => {
  db.prepare("DELETE FROM callings").run();
  const unitNameByNumber = new Map(snapshot.units.map((unit) => [unit.unitNumber, unit.name]));
  const organizationNameById = new Map(snapshot.organizations.map((org) => [org.lcrOrganizationId, org.name]));

  const insertCalling = db.prepare(
    `INSERT INTO callings (
      lcr_calling_id, unit_number, unit_name, lcr_member_id, lcr_organization_id, organization_name,
      title, sustained_on, set_apart_on, released_on, is_current, updated_at
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const calling of snapshot.callings) {
    insertCalling.run(
      calling.lcrCallingId,
      calling.unitNumber,
      unitNameByNumber.get(calling.unitNumber) ?? null,
      calling.lcrMemberId ?? null,
      calling.lcrOrganizationId ?? null,
      calling.lcrOrganizationId ? organizationNameById.get(calling.lcrOrganizationId) ?? null : null,
      calling.title,
      calling.sustainedOn ?? null,
      calling.setApartOn ?? null,
      calling.releasedOn ?? null,
      boolToInt(calling.isCurrent),
      isoNow()
    );
  }
};

const insertMemberSnapshots = (db: Database.Database, syncLogId: number, snapshot: DirectorySnapshot) => {
  const unitNameByNumber = new Map(snapshot.units.map((unit) => [unit.unitNumber, unit.name]));
  const insertSnapshot = db.prepare(
    `INSERT INTO sync_member_snapshots (
      sync_log_id, lcr_member_id, full_name, unit_name, move_in_date, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const member of snapshot.members) {
    const snapshotData = {
      lcrHouseholdId: member.lcrHouseholdId ?? null,
      unitNumber: member.unitNumber,
      unitName: member.unitName ?? null,
      unitAbbreviation: member.unitAbbreviation ?? null,
      preferredName: member.preferredName ?? null,
      firstName: member.firstName,
      lastName: member.lastName,
      gender: member.gender ?? null,
      birthdate: member.birthdate ?? null,
      birthCountry: member.birthCountry ?? null,
      birthplace: member.birthplace ?? null,
      age: member.age ?? null,
      memberStatus: member.memberStatus ?? null,
      moveInDate: member.moveInDate ?? null,
      isConvert: Boolean(member.isConvert),
      baptismDate: member.baptismDate ?? null,
      confirmationDate: member.confirmationDate ?? null,
      endowmentDate: member.endowmentDate ?? null,
      endowmentStatus: member.endowmentStatus ?? null,
      templeEndowed: Boolean(member.templeEndowed),
      templeRecommendStatus: member.templeRecommendStatus ?? null,
      templeRecommendExpirationDate: member.templeRecommendExpirationDate ?? null,
      templeRecommendType: member.templeRecommendType ?? null,
      missionStatus: member.missionStatus ?? null,
      missionLanguage: member.missionLanguage ?? null,
      missionCountry: member.missionCountry ?? null,
      isReturnedMissionary: Boolean(member.isReturnedMissionary),
      isAccountable: Boolean(member.isAccountable),
      isBornInCovenant: Boolean(member.isBornInCovenant),
      isDivorced: Boolean(member.isDivorced),
      isMarried: Boolean(member.isMarried),
      isSingle: Boolean(member.isSingle),
      marriageDate: member.marriageDate ?? null,
      marriageStatus: member.marriageStatus ?? null,
      isAttendingSeminary: Boolean(member.isAttendingSeminary),
      isAttendingInstitute: Boolean(member.isAttendingInstitute),
      potentialInstituteStudent: Boolean(member.potentialInstituteStudent),
      potentialSeminaryStudent: Boolean(member.potentialSeminaryStudent),
      hasMinisteringBrothers: Boolean(member.hasMinisteringBrothers),
      hasMinisteringSisters: Boolean(member.hasMinisteringSisters),
      ministeringBrothers: normalizeDelimitedNames(member.ministeringBrothers),
      ministeringSisters: normalizeDelimitedNames(member.ministeringSisters),
      spouseName: member.spouseName ?? null,
      headOfHouse: member.headOfHouse ?? null,
      householdPosition: member.householdPosition ?? null,
      sealingToParents: member.sealingToParents ?? null,
      sealingToSpouse: member.sealingToSpouse ?? null,
      priesthoodType: member.priesthoodType ?? null,
      priesthoodOffice: member.priesthoodOffice ?? null,
      ordinationDate: member.ordinationDate ?? null,
      instituteStatus: member.instituteStatus ?? null,
      seminaryStatus: member.seminaryStatus ?? null,
      addressLine1: member.addressLine1 ?? null,
      addressLine2: member.addressLine2 ?? null,
      addressCity: member.addressCity ?? null,
      addressStateOrProvince: member.addressStateOrProvince ?? null,
      addressPostalCode: member.addressPostalCode ?? null,
      addressCountry: member.addressCountry ?? null
    } satisfies Record<string, unknown>;

    insertSnapshot.run(
      syncLogId,
      member.lcrMemberId,
      fullName(member),
      member.unitName ?? unitNameByNumber.get(member.unitNumber) ?? member.unitAbbreviation ?? "Unknown",
      member.moveInDate ?? null,
      hashSnapshot(snapshotData),
      JSON.stringify(snapshotData)
    );
  }
};

const insertCallingSnapshots = (db: Database.Database, syncLogId: number, snapshot: DirectorySnapshot) => {
  const unitNameByNumber = new Map(snapshot.units.map((unit) => [unit.unitNumber, unit.name]));
  const memberNameById = new Map(snapshot.members.map((member) => [member.lcrMemberId, fullName(member)]));
  const insertSnapshot = db.prepare(
    `INSERT INTO sync_calling_snapshots (
      sync_log_id, lcr_calling_id, unit_name, member_lcr_member_id, member_name, calling_title,
      is_current, sustained_on, released_on, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const calling of snapshot.callings) {
    const snapshotData = {
      unitNumber: calling.unitNumber,
      lcrMemberId: calling.lcrMemberId ?? null,
      lcrOrganizationId: calling.lcrOrganizationId ?? null,
      title: calling.title,
      standardName: calling.standardName ?? null,
      sustainedOn: calling.sustainedOn ?? null,
      setApartOn: calling.setApartOn ?? null,
      releasedOn: calling.releasedOn ?? null,
      isCurrent: calling.isCurrent
    } satisfies Record<string, unknown>;

    insertSnapshot.run(
      syncLogId,
      calling.lcrCallingId,
      unitNameByNumber.get(calling.unitNumber) ?? "Unknown",
      calling.lcrMemberId ?? null,
      calling.lcrMemberId ? memberNameById.get(calling.lcrMemberId) ?? null : null,
      calling.title,
      boolToInt(calling.isCurrent),
      calling.sustainedOn ?? null,
      calling.releasedOn ?? null,
      hashSnapshot(snapshotData),
      JSON.stringify(snapshotData)
    );
  }
};

const insertEmailSnapshots = (db: Database.Database, syncLogId: number, snapshot: DirectorySnapshot) => {
  const unitNameByNumber = new Map(snapshot.units.map((unit) => [unit.unitNumber, unit.name]));
  const insertSnapshot = db.prepare(
    `INSERT INTO sync_email_snapshots (
      sync_log_id, member_lcr_member_id, full_name, unit_name, email, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const member of snapshot.members) {
    for (const email of member.emails) {
      const snapshotData = {
        email: email.email,
        type: email.type ?? null,
        isPrimary: Boolean(email.isPrimary)
      } satisfies Record<string, unknown>;

      insertSnapshot.run(
        syncLogId,
        member.lcrMemberId,
        fullName(member),
        member.unitName ?? unitNameByNumber.get(member.unitNumber) ?? member.unitAbbreviation ?? "Unknown",
        email.email,
        hashSnapshot(snapshotData),
        JSON.stringify(snapshotData)
      );
    }
  }
};

const insertPhoneSnapshots = (db: Database.Database, syncLogId: number, snapshot: DirectorySnapshot) => {
  const unitNameByNumber = new Map(snapshot.units.map((unit) => [unit.unitNumber, unit.name]));
  const insertSnapshot = db.prepare(
    `INSERT INTO sync_phone_snapshots (
      sync_log_id, member_lcr_member_id, full_name, unit_name, phone_number, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const member of snapshot.members) {
    for (const phone of member.phoneNumbers) {
      const snapshotData = {
        phoneNumber: phone.phoneNumber,
        type: phone.type ?? null,
        isPrimary: Boolean(phone.isPrimary),
        canText: Boolean(phone.canText)
      } satisfies Record<string, unknown>;

      insertSnapshot.run(
        syncLogId,
        member.lcrMemberId,
        fullName(member),
        member.unitName ?? unitNameByNumber.get(member.unitNumber) ?? member.unitAbbreviation ?? "Unknown",
        phone.phoneNumber,
        hashSnapshot(snapshotData),
        JSON.stringify(snapshotData)
      );
    }
  }
};

const insertMemberSnapshotsFromCurrentState = (db: Database.Database, syncLogId: number) => {
  const rows = db.prepare(
    `SELECT
      lcr_member_id AS lcrMemberId,
      lcr_household_id AS lcrHouseholdId,
      unit_number AS unitNumber,
      unit_name AS unitName,
      unit_abbreviation AS unitAbbreviation,
      preferred_name AS preferredName,
      first_name AS firstName,
      last_name AS lastName,
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
      is_single AS isSingle,
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
      seminary_status AS seminaryStatus,
      address_line1 AS addressLine1,
      address_line2 AS addressLine2,
      city AS addressCity,
      state_or_province AS addressStateOrProvince,
      postal_code AS addressPostalCode,
      country AS addressCountry,
      primary_email AS primaryEmail,
      primary_phone AS primaryPhone
     FROM members`
  ).all() as SqliteMemberSnapshotSeedRow[];

  const insertSnapshot = db.prepare(
    `INSERT INTO sync_member_snapshots (
      sync_log_id, lcr_member_id, full_name, unit_name, move_in_date, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const row of rows) {
    const snapshotData = {
      lcrHouseholdId: row.lcrHouseholdId,
      unitNumber: row.unitNumber,
      unitName: row.unitName,
      unitAbbreviation: row.unitAbbreviation,
      preferredName: row.preferredName,
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      birthdate: row.birthdate,
      birthCountry: row.birthCountry,
      birthplace: row.birthplace,
      age: row.age,
      memberStatus: row.memberStatus,
      moveInDate: row.moveInDate,
      isConvert: Boolean(row.isConvert),
      baptismDate: row.baptismDate,
      confirmationDate: row.confirmationDate,
      endowmentDate: row.endowmentDate,
      endowmentStatus: row.endowmentStatus,
      templeEndowed: Boolean(row.templeEndowed),
      templeRecommendStatus: row.templeRecommendStatus,
      templeRecommendExpirationDate: row.templeRecommendExpirationDate,
      templeRecommendType: row.templeRecommendType,
      missionStatus: row.missionStatus,
      missionLanguage: row.missionLanguage,
      missionCountry: row.missionCountry,
      isReturnedMissionary: Boolean(row.isReturnedMissionary),
      isAccountable: Boolean(row.isAccountable),
      isBornInCovenant: Boolean(row.isBornInCovenant),
      isDivorced: Boolean(row.isDivorced),
      isMarried: Boolean(row.isMarried),
      isSingle: Boolean(row.isSingle),
      marriageDate: row.marriageDate,
      marriageStatus: row.marriageStatus,
      isAttendingSeminary: Boolean(row.isAttendingSeminary),
      isAttendingInstitute: Boolean(row.isAttendingInstitute),
      potentialInstituteStudent: Boolean(row.potentialInstituteStudent),
      potentialSeminaryStudent: Boolean(row.potentialSeminaryStudent),
      hasMinisteringBrothers: Boolean(row.hasMinisteringBrothers),
      hasMinisteringSisters: Boolean(row.hasMinisteringSisters),
      ministeringBrothers: normalizeDelimitedNames(row.ministeringBrothers),
      ministeringSisters: normalizeDelimitedNames(row.ministeringSisters),
      spouseName: row.spouseName,
      headOfHouse: row.headOfHouse,
      householdPosition: row.householdPosition,
      sealingToParents: row.sealingToParents,
      sealingToSpouse: row.sealingToSpouse,
      priesthoodType: row.priesthoodType,
      priesthoodOffice: row.priesthoodOffice,
      ordinationDate: row.ordinationDate,
      instituteStatus: row.instituteStatus,
      seminaryStatus: row.seminaryStatus,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      addressCity: row.addressCity,
      addressStateOrProvince: row.addressStateOrProvince,
      addressPostalCode: row.addressPostalCode,
      addressCountry: row.addressCountry
    } satisfies Record<string, unknown>;

    insertSnapshot.run(
      syncLogId,
      row.lcrMemberId,
      fullName(row),
      row.unitName ?? row.unitAbbreviation ?? "Unknown",
      row.moveInDate ?? null,
      hashSnapshot(snapshotData),
      JSON.stringify(snapshotData)
    );
  }

  return rows;
};

const insertCallingSnapshotsFromCurrentState = (db: Database.Database, syncLogId: number) => {
  const memberNameById = new Map(
    (
      db.prepare(
        `SELECT lcr_member_id AS lcrMemberId, first_name AS firstName, last_name AS lastName
         FROM members`
      ).all() as Array<{ lcrMemberId: string; firstName: string; lastName: string }>
    ).map((row) => [row.lcrMemberId, fullName(row)])
  );

  const rows = db.prepare(
    `SELECT
      lcr_calling_id AS lcrCallingId,
      unit_number AS unitNumber,
      unit_name AS unitName,
      lcr_member_id AS lcrMemberId,
      lcr_organization_id AS lcrOrganizationId,
      organization_name AS organizationName,
      title,
      sustained_on AS sustainedOn,
      set_apart_on AS setApartOn,
      released_on AS releasedOn,
      is_current AS isCurrent
     FROM callings`
  ).all() as SqliteCallingSnapshotSeedRow[];

  const insertSnapshot = db.prepare(
    `INSERT INTO sync_calling_snapshots (
      sync_log_id, lcr_calling_id, unit_name, member_lcr_member_id, member_name, calling_title,
      is_current, sustained_on, released_on, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const row of rows) {
    const snapshotData = {
      unitNumber: row.unitNumber,
      lcrMemberId: row.lcrMemberId,
      lcrOrganizationId: row.lcrOrganizationId,
      title: row.title,
      standardName: null,
      sustainedOn: row.sustainedOn,
      setApartOn: row.setApartOn,
      releasedOn: row.releasedOn,
      isCurrent: Boolean(row.isCurrent)
    } satisfies Record<string, unknown>;

    insertSnapshot.run(
      syncLogId,
      row.lcrCallingId,
      row.unitName ?? "Unknown",
      row.lcrMemberId,
      row.lcrMemberId ? memberNameById.get(row.lcrMemberId) ?? null : null,
      row.title,
      row.isCurrent,
      row.sustainedOn,
      row.releasedOn,
      hashSnapshot(snapshotData),
      JSON.stringify(snapshotData)
    );
  }

  return rows;
};

const insertPrimaryEmailSnapshotsFromCurrentState = (db: Database.Database, syncLogId: number) => {
  const rows = db.prepare(
    `SELECT
      lcr_member_id AS lcrMemberId,
      first_name AS firstName,
      last_name AS lastName,
      unit_name AS unitName,
      unit_abbreviation AS unitAbbreviation,
      primary_email AS primaryEmail
     FROM members
     WHERE primary_email IS NOT NULL
       AND trim(primary_email) <> ''`
  ).all() as Array<{
    lcrMemberId: string;
    firstName: string;
    lastName: string;
    unitName: string | null;
    unitAbbreviation: string | null;
    primaryEmail: string;
  }>;

  const insertSnapshot = db.prepare(
    `INSERT INTO sync_email_snapshots (
      sync_log_id, member_lcr_member_id, full_name, unit_name, email, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const row of rows) {
    const snapshotData = {
      email: row.primaryEmail,
      type: null,
      isPrimary: true
    } satisfies Record<string, unknown>;

    insertSnapshot.run(
      syncLogId,
      row.lcrMemberId,
      fullName(row),
      row.unitName ?? row.unitAbbreviation ?? "Unknown",
      row.primaryEmail,
      hashSnapshot(snapshotData),
      JSON.stringify(snapshotData)
    );
  }

  return rows;
};

const insertPrimaryPhoneSnapshotsFromCurrentState = (db: Database.Database, syncLogId: number) => {
  const rows = db.prepare(
    `SELECT
      lcr_member_id AS lcrMemberId,
      first_name AS firstName,
      last_name AS lastName,
      unit_name AS unitName,
      unit_abbreviation AS unitAbbreviation,
      primary_phone AS primaryPhone
     FROM members
     WHERE primary_phone IS NOT NULL
       AND trim(primary_phone) <> ''`
  ).all() as Array<{
    lcrMemberId: string;
    firstName: string;
    lastName: string;
    unitName: string | null;
    unitAbbreviation: string | null;
    primaryPhone: string;
  }>;

  const insertSnapshot = db.prepare(
    `INSERT INTO sync_phone_snapshots (
      sync_log_id, member_lcr_member_id, full_name, unit_name, phone_number, row_hash, snapshot_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const row of rows) {
    const snapshotData = {
      phoneNumber: row.primaryPhone,
      type: null,
      isPrimary: true,
      canText: false
    } satisfies Record<string, unknown>;

    insertSnapshot.run(
      syncLogId,
      row.lcrMemberId,
      fullName(row),
      row.unitName ?? row.unitAbbreviation ?? "Unknown",
      row.primaryPhone,
      hashSnapshot(snapshotData),
      JSON.stringify(snapshotData)
    );
  }

  return rows;
};

export const persistSqliteSpikeSnapshot = async (syncType: string, snapshot: DirectorySnapshot): Promise<PersistResult> => {
  const db = openSqliteSpikeDb();
  ensureSqliteSpikeSchema(db);
  const logId = insertSyncLog(db, syncType);

  try {
    const persist = db.transaction(() => {
      const unitMap = persistUnits(db, snapshot);
      const householdMap = persistHouseholds(db, snapshot);
      persistMembers(db, snapshot, unitMap, householdMap);
      persistCallings(db, snapshot);
      insertMemberSnapshots(db, logId, snapshot);
      insertCallingSnapshots(db, logId, snapshot);
      insertEmailSnapshots(db, logId, snapshot);
      insertPhoneSnapshots(db, logId, snapshot);
    });

    persist();

    const recordsProcessed = snapshot.members.length + snapshot.callings.length + snapshot.units.length + snapshot.households.length;
    completeSyncLog(db, logId, "success", recordsProcessed);
    return { recordsProcessed };
  } catch (error) {
    completeSyncLog(db, logId, "error", 0, error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    db.close();
  }
};

export const seedSqliteSpikeSnapshotsFromCurrentState = async (
  syncType = "sqlite_spike_baseline_seed"
): Promise<PersistResult> => {
  const db = openSqliteSpikeDb();
  ensureSqliteSpikeSchema(db);
  const logId = insertSyncLog(db, syncType);

  try {
    const persist = db.transaction(() => {
      const members = insertMemberSnapshotsFromCurrentState(db, logId);
      const callings = insertCallingSnapshotsFromCurrentState(db, logId);
      const emails = insertPrimaryEmailSnapshotsFromCurrentState(db, logId);
      const phones = insertPrimaryPhoneSnapshotsFromCurrentState(db, logId);
      return { members, callings, emails, phones };
    });

    const result = persist();
    const recordsProcessed =
      result.members.length + result.callings.length + result.emails.length + result.phones.length;

    completeSyncLog(db, logId, "success", recordsProcessed);
    return { recordsProcessed };
  } catch (error) {
    completeSyncLog(db, logId, "error", 0, error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    db.close();
  }
};

export const seedSqliteSpikeSnapshotsForSyncLog = async (syncLogId: number): Promise<PersistResult> => {
  const db = openSqliteSpikeDb();
  ensureSqliteSpikeSchema(db);

  try {
    const persist = db.transaction(() => {
      db.prepare("DELETE FROM sync_member_snapshots WHERE sync_log_id = ?").run(syncLogId);
      db.prepare("DELETE FROM sync_calling_snapshots WHERE sync_log_id = ?").run(syncLogId);
      db.prepare("DELETE FROM sync_email_snapshots WHERE sync_log_id = ?").run(syncLogId);
      db.prepare("DELETE FROM sync_phone_snapshots WHERE sync_log_id = ?").run(syncLogId);

      const members = insertMemberSnapshotsFromCurrentState(db, syncLogId);
      const callings = insertCallingSnapshotsFromCurrentState(db, syncLogId);
      const emails = insertPrimaryEmailSnapshotsFromCurrentState(db, syncLogId);
      const phones = insertPrimaryPhoneSnapshotsFromCurrentState(db, syncLogId);
      return { members, callings, emails, phones };
    });

    const result = persist();
    return {
      recordsProcessed: result.members.length + result.callings.length + result.emails.length + result.phones.length
    };
  } finally {
    db.close();
  }
};
