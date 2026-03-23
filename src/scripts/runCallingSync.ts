import { DirectorySyncEngine } from "@/src/sync/directorySyncEngine";
import { pool } from "@/src/db/pool";

const main = async () => {
  const engine = new DirectorySyncEngine();
  const result = await engine.runCallingSync();
  console.log(`Calling sync completed. Records processed: ${result.recordsProcessed}`);
  await pool.end();
};

main().catch(async (error) => {
  console.error("Calling sync failed", error);
  await pool.end();
  process.exit(1);
});
