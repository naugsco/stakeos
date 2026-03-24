import { LcrScraper } from "@/src/sync/lcrScraper";
import { getSqliteSpikeDbPath } from "@/src/sqlite-spike/db";
import { persistSqliteSpikeSnapshot } from "@/src/sqlite-spike/persist";

const main = async () => {
  const scraper = new LcrScraper();
  const snapshot = await scraper.scrapeDirectory();
  const result = await persistSqliteSpikeSnapshot("sqlite_spike_full_sync", snapshot);
  console.log(`SQLite spike sync completed. Records processed: ${result.recordsProcessed}`);
  console.log(`SQLite spike database: ${getSqliteSpikeDbPath()}`);
};

main().catch((error) => {
  console.error("SQLite spike full sync failed", error);
  process.exit(1);
});
