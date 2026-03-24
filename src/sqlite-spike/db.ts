import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "@/src/config/env";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(moduleDir, "schema.sql");

export const getSqliteSpikeDbPath = () => {
  const configured = env.SQLITE_SPIKE_DB_PATH?.trim();
  if (configured) {
    return resolve(configured);
  }

  return resolve(homedir(), "Library", "Application Support", "StakeOS", "sqlite-spike", "stakeos-spike.db");
};

export const openSqliteSpikeDb = () => {
  const dbPath = getSqliteSpikeDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
};

export const ensureSqliteSpikeSchema = (db: Database.Database) => {
  const schema = readFileSync(schemaPath, "utf8");
  db.exec(schema);
  const columns = db.prepare("PRAGMA table_info(members)").all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));
  const missingColumns: Array<{ name: string; type: string }> = [
    { name: "household_id", type: "INTEGER" },
    { name: "lcr_household_id", type: "TEXT" },
    { name: "primary_email", type: "TEXT" },
    { name: "primary_phone", type: "TEXT" },
    { name: "address_line1", type: "TEXT" },
    { name: "address_line2", type: "TEXT" },
    { name: "city", type: "TEXT" },
    { name: "state_or_province", type: "TEXT" },
    { name: "postal_code", type: "TEXT" },
    { name: "country", type: "TEXT" },
    { name: "birth_country", type: "TEXT" },
    { name: "birthplace", type: "TEXT" },
    { name: "move_in_date", type: "TEXT" },
    { name: "is_convert", type: "INTEGER" },
    { name: "confirmation_date", type: "TEXT" },
    { name: "endowment_date", type: "TEXT" },
    { name: "endowment_status", type: "TEXT" },
    { name: "temple_recommend_type", type: "TEXT" },
    { name: "mission_language", type: "TEXT" },
    { name: "is_accountable", type: "INTEGER" },
    { name: "is_born_in_covenant", type: "INTEGER" },
    { name: "is_divorced", type: "INTEGER" },
    { name: "is_married", type: "INTEGER" },
    { name: "is_single", type: "INTEGER" },
    { name: "marriage_date", type: "TEXT" },
    { name: "marriage_status", type: "TEXT" },
    { name: "potential_institute_student", type: "INTEGER" },
    { name: "potential_seminary_student", type: "INTEGER" },
    { name: "ministering_brothers", type: "TEXT" },
    { name: "ministering_sisters", type: "TEXT" },
    { name: "spouse_name", type: "TEXT" },
    { name: "head_of_house", type: "TEXT" },
    { name: "household_position", type: "TEXT" },
    { name: "sealing_to_parents", type: "TEXT" },
    { name: "sealing_to_spouse", type: "TEXT" },
    { name: "priesthood_type", type: "TEXT" },
    { name: "priesthood_office", type: "TEXT" },
    { name: "ordination_date", type: "TEXT" },
    { name: "institute_status", type: "TEXT" },
    { name: "seminary_status", type: "TEXT" }
  ];

  for (const column of missingColumns) {
    if (!columnNames.has(column.name)) {
      db.exec(`ALTER TABLE members ADD COLUMN ${column.name} ${column.type}`);
    }
  }

  const callingColumns = db.prepare("PRAGMA table_info(callings)").all() as Array<{ name: string }>;
  const callingColumnNames = new Set(callingColumns.map((column) => column.name));
  const missingCallingColumns: Array<{ name: string; type: string }> = [
    { name: "lcr_organization_id", type: "TEXT" },
    { name: "organization_name", type: "TEXT" },
    { name: "sustained_on", type: "TEXT" },
    { name: "set_apart_on", type: "TEXT" },
    { name: "released_on", type: "TEXT" }
  ];

  for (const column of missingCallingColumns) {
    if (!callingColumnNames.has(column.name)) {
      db.exec(`ALTER TABLE callings ADD COLUMN ${column.name} ${column.type}`);
    }
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_households_unit_number ON households(unit_number)");
};

export const getSqliteSpikeStatus = () => {
  const dbPath = getSqliteSpikeDbPath();
  const exists = existsSync(dbPath);

  if (!exists) {
    return {
      dbPath,
      exists: false,
      members: 0,
      latestSyncCompletedAt: null as string | null
    };
  }

  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
    const memberRow = db.prepare("SELECT COUNT(*) AS count FROM members").get() as { count: number };
    const syncRow = db
      .prepare(
        `SELECT completed_at AS completedAt
         FROM sync_logs
         WHERE status = 'success'
         ORDER BY started_at DESC
         LIMIT 1`
      )
      .get() as { completedAt?: string | null } | undefined;

    return {
      dbPath,
      exists: true,
      members: memberRow.count,
      latestSyncCompletedAt: syncRow?.completedAt ?? null
    };
  } finally {
    db.close();
  }
};
