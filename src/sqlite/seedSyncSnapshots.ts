import { openSqliteSpikeDb, ensureSqliteSpikeSchema } from "@/src/sqlite/db";
import { seedSqliteSpikeSnapshotsForSyncLog } from "@/src/sqlite/persist";

type SyncLogRow = {
  id: number;
  syncType: string;
  completedAt: string;
};

const getLatestSuccessfulSqliteSyncs = (limit: number) => {
  const db = openSqliteSpikeDb();
  try {
    ensureSqliteSpikeSchema(db);
    return db
      .prepare(
        `SELECT
          id,
          sync_type AS syncType,
          completed_at AS completedAt
           FROM sync_logs
           WHERE status = 'success'
           AND sync_type IN ('sqlite_full_sync', 'sqlite_spike_full_sync')
           AND completed_at IS NOT NULL
         ORDER BY completed_at DESC, id DESC
         LIMIT ?`
      )
      .all(limit) as SyncLogRow[];
  } finally {
    db.close();
  }
};

const run = async () => {
  const targetLogs = getLatestSuccessfulSqliteSyncs(2);

  if (targetLogs.length === 0) {
    console.log("No successful SQLite full sync logs found. Run sqlite:sync first.");
    return;
  }

  for (const log of targetLogs) {
    const result = await seedSqliteSpikeSnapshotsForSyncLog(log.id);
    console.log(
      `Seeded SQLite snapshot baseline for log ${log.id} (${log.syncType} at ${log.completedAt}). Records processed: ${result.recordsProcessed}.`
    );
  }

  console.log(
    "Contact snapshots are seeded from the current primary email and primary phone values stored in SQLite."
  );
};

run().catch((error) => {
  console.error("Failed to seed SQLite snapshots.", error);
  process.exit(1);
});
