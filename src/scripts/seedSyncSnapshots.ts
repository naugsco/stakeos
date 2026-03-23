import { pool } from "@/src/db/pool";
import { seedSnapshotTablesForSyncLog } from "@/src/sync/persist";

type SyncLogRow = {
  id: number;
  syncType: string;
  completedAt: string;
};

const getLatestSuccessfulSync = async (syncTypes: string[]) => {
  const result = await pool.query<SyncLogRow>(
    `
    SELECT
      id,
      sync_type AS "syncType",
      completed_at::text AS "completedAt"
    FROM sync_logs
    WHERE status = 'success'
      AND sync_type = ANY($1::text[])
      AND completed_at IS NOT NULL
    ORDER BY completed_at DESC, id DESC
    LIMIT 1
    `,
    [syncTypes]
  );

  return result.rows[0] ?? null;
};

const run = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const latestFullSync = await getLatestSuccessfulSync(["nightly_full_directory_sync"]);
    const latestCallingSync = await getLatestSuccessfulSync([
      "nightly_full_directory_sync",
      "hourly_calling_sync",
      "local_calling_rebuild"
    ]);

    if (!latestFullSync && !latestCallingSync) {
      console.log("No successful sync logs found. Nothing to seed.");
      await client.query("COMMIT");
      return;
    }

    if (latestFullSync) {
      await seedSnapshotTablesForSyncLog(client, latestFullSync.id, {
        includeMembers: true,
        includeCallings: latestCallingSync?.id === latestFullSync.id,
        includeEmails: true,
        includePhones: true
      });
      console.log(
        `Seeded full-sync baseline for log ${latestFullSync.id} (${latestFullSync.syncType} at ${latestFullSync.completedAt}).`
      );
    }

    if (latestCallingSync && latestCallingSync.id !== latestFullSync?.id) {
      await seedSnapshotTablesForSyncLog(client, latestCallingSync.id, {
        includeCallings: true
      });
      console.log(
        `Seeded calling baseline for log ${latestCallingSync.id} (${latestCallingSync.syncType} at ${latestCallingSync.completedAt}).`
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error("Failed to seed sync snapshots.", error);
  process.exit(1);
});
