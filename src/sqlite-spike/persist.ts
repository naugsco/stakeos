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

const persistMembers = (db: Database.Database, snapshot: DirectorySnapshot, unitMap: Map<string, number>) => {
  db.prepare("DELETE FROM members").run();

  const insertMember = db.prepare(
    `INSERT INTO members (
      lcr_member_id, unit_id, unit_number, unit_name, unit_abbreviation, preferred_name,
      first_name, last_name, gender, birthdate, age, member_status, baptism_date,
      temple_endowed, temple_recommend_status, temple_recommend_expiration_date,
      mission_status, mission_country, is_returned_missionary,
      is_attending_seminary, is_attending_institute,
      has_ministering_brothers, has_ministering_sisters, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const member of snapshot.members) {
    insertMember.run(
      member.lcrMemberId,
      unitMap.get(member.unitNumber) ?? null,
      member.unitNumber,
      member.unitName ?? null,
      member.unitAbbreviation ?? null,
      member.preferredName ?? null,
      member.firstName,
      member.lastName,
      member.gender ?? null,
      member.birthdate ?? null,
      member.age ?? null,
      member.memberStatus ?? null,
      member.baptismDate ?? null,
      boolToInt(member.templeEndowed),
      member.templeRecommendStatus ?? null,
      member.templeRecommendExpirationDate ?? null,
      member.missionStatus ?? null,
      member.missionCountry ?? null,
      boolToInt(member.isReturnedMissionary),
      boolToInt(member.isAttendingSeminary),
      boolToInt(member.isAttendingInstitute),
      boolToInt(member.hasMinisteringBrothers),
      boolToInt(member.hasMinisteringSisters),
      isoNow()
    );
  }
};

const persistCallings = (db: Database.Database, snapshot: DirectorySnapshot) => {
  db.prepare("DELETE FROM callings").run();
  const unitNameByNumber = new Map(snapshot.units.map((unit) => [unit.unitNumber, unit.name]));

  const insertCalling = db.prepare(
    `INSERT INTO callings (lcr_calling_id, unit_number, unit_name, lcr_member_id, title, is_current, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const calling of snapshot.callings) {
    insertCalling.run(
      calling.lcrCallingId,
      calling.unitNumber,
      unitNameByNumber.get(calling.unitNumber) ?? null,
      calling.lcrMemberId ?? null,
      calling.title,
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
      persistMembers(db, snapshot, unitMap);
      persistCallings(db, snapshot);
    });

    persist();

    const recordsProcessed = snapshot.members.length + snapshot.callings.length + snapshot.units.length;
    completeSyncLog(db, logId, "success", recordsProcessed);
    return { recordsProcessed };
  } catch (error) {
    completeSyncLog(db, logId, "error", 0, error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    db.close();
  }
};
