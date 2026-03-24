import type Database from "better-sqlite3";
import { ensureSqliteSpikeSchema, openSqliteSpikeDb } from "@/src/sqlite-spike/db";
import type { DirectorySnapshot } from "@/src/types/directory";

interface PersistResult {
  recordsProcessed: number;
}

const boolToInt = (value?: boolean) => (value ? 1 : 0);
const isoNow = () => new Date().toISOString();

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
      is_divorced, is_married, marriage_date, marriage_status,
      is_attending_seminary, is_attending_institute, potential_institute_student, potential_seminary_student,
      has_ministering_brothers, has_ministering_sisters, ministering_brothers, ministering_sisters,
      spouse_name, head_of_house, household_position, sealing_to_parents, sealing_to_spouse,
      priesthood_type, priesthood_office, ordination_date, institute_status, seminary_status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
