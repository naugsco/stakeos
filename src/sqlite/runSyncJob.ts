import { LcrScraper } from "@/src/sync/lcrScraper";
import { ensureSqliteSpikeSchema, getSqliteSpikeDbPath, openSqliteSpikeDb } from "@/src/sqlite/db";
import {
  persistSqliteSpikeCallingsSnapshot,
  persistSqliteSpikeSnapshot,
  seedSqliteSpikeSnapshotsFromCurrentState
} from "@/src/sqlite/persist";
import { assertMemberCoverageDidNotCollapse } from "@/src/sqlite/syncHealth";

type SyncKind = "full" | "callings";

const kind = process.argv[2];

const ensureSchema = () => {
  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
  } finally {
    db.close();
  }
};

const runFullSync = async () => {
  ensureSchema();
  const scraper = new LcrScraper();
  const snapshot = await scraper.scrapeDirectory();

  const db = openSqliteSpikeDb();
  try {
    assertMemberCoverageDidNotCollapse(db, snapshot.members);
  } finally {
    db.close();
  }

  const result = await persistSqliteSpikeSnapshot("sqlite_full_sync", snapshot);
  console.log(`SQLite sync completed. Records processed: ${result.recordsProcessed}`);
  const baseline = await seedSqliteSpikeSnapshotsFromCurrentState("sqlite_baseline_seed");
  console.log(`SQLite baseline seed completed. Records processed: ${baseline.recordsProcessed}`);
  console.log(`SQLite database: ${getSqliteSpikeDbPath()}`);
};

const runCallingSync = async () => {
  ensureSchema();
  const scraper = new LcrScraper();
  const snapshot = await scraper.scrapeDirectory();
  const result = await persistSqliteSpikeCallingsSnapshot("sqlite_calling_sync", snapshot);
  console.log(`SQLite calling sync completed. Records processed: ${result.recordsProcessed}`);
  console.log(`SQLite database: ${getSqliteSpikeDbPath()}`);
};

const main = async () => {
  if (kind === "full") {
    await runFullSync();
    return;
  }

  if (kind === "callings") {
    await runCallingSync();
    return;
  }

  throw new Error(`Unsupported sync job kind: ${kind ?? "(missing)"}`);
};

main().catch((error) => {
  console.error("SQLite sync job failed", error);
  process.exit(1);
});
