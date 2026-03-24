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
