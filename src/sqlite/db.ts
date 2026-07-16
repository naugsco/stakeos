import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getDesktopConfigDir } from "@/src/config/desktopConfig";
import { env } from "@/src/config/env";

// Resolved from the same per-platform support directory the desktop config uses, so the
// app and the setup diagnostics always agree on which database file is live. On macOS this
// is the unchanged ~/Library/Application Support/StakeOS path.
const legacyDbPath = resolve(getDesktopConfigDir(), "sqlite-spike", "stakeos-spike.db");
const defaultDbPath = resolve(getDesktopConfigDir(), "stakeos.db");

const getSchemaPath = () => {
  const candidates = [
    resolve(process.cwd(), "src", "sqlite", "schema.sql"),
    resolve(process.cwd(), "dist", "sqlite", "schema.sql"),
    resolve(dirname(process.argv[1] ?? process.cwd()), "..", "src", "sqlite", "schema.sql"),
    resolve(dirname(process.argv[1] ?? process.cwd()), "schema.sql")
  ];

  const schemaPath = candidates.find((candidate) => existsSync(candidate));
  if (!schemaPath) {
    throw new Error("SQLite schema.sql could not be located.");
  }

  return schemaPath;
};

const resolveDefaultDbPath = () => {
  if (!existsSync(defaultDbPath) && existsSync(legacyDbPath)) {
    mkdirSync(dirname(defaultDbPath), { recursive: true });
    renameSync(legacyDbPath, defaultDbPath);
  }

  return defaultDbPath;
};

export const getSqliteSpikeDbPath = () => {
  const configured = env.SQLITE_DB_PATH?.trim();
  if (configured) {
    return resolve(configured);
  }

  return resolveDefaultDbPath();
};

const tableExists = (db: Database.Database, table: string) =>
  Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));

const hasColumn = (db: Database.Database, table: string, column: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).some((row) => row.name === column);

const ensureColumn = (db: Database.Database, table: string, column: string, type: string) => {
  if (!tableExists(db, table) || hasColumn(db, table, column)) {
    return;
  }

  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (error) {
    // Another process may have added the column first; only surface a real failure.
    if (!hasColumn(db, table, column)) {
      throw error;
    }
  }
};

// Columns that reads depend on, added here rather than only in ensureSqliteSpikeSchema so
// that consumers which never run a sync (the MCP server, dashboard reads) cannot observe a
// database that is missing them. schema.sql is not readable from every bundle, so these are
// applied directly.
const ensureReadCriticalColumns = (db: Database.Database) => {
  ensureColumn(db, "callings", "is_set_apart", "INTEGER");
  ensureColumn(db, "members", "callings_text", "TEXT");
};

export const openSqliteSpikeDb = () => {
  const dbPath = getSqliteSpikeDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  ensureReadCriticalColumns(db);
  return db;
};

export const ensureSqliteSpikeSchema = (db: Database.Database) => {
  const schema = readFileSync(getSchemaPath(), "utf8");
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
    { name: "seminary_status", type: "TEXT" },
    { name: "callings_text", type: "TEXT" }
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
    { name: "released_on", type: "TEXT" },
    { name: "is_set_apart", type: "INTEGER" }
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
