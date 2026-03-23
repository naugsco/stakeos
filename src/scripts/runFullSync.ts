import { DirectorySyncEngine } from "@/src/sync/directorySyncEngine";
import { pool } from "@/src/db/pool";

const main = async () => {
  const engine = new DirectorySyncEngine();
  const result = await engine.runFullSync();
  console.log(`Full sync completed. Records processed: ${result.recordsProcessed}`);
  await pool.end();
};

main().catch(async (error) => {
  console.error("Full sync failed", error);
  await pool.end();
  process.exit(1);
});
