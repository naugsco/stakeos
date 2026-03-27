import { LcrScraper } from "@/src/sync/lcrScraper";
import { getSqliteSpikeDbPath } from "@/src/sqlite/db";
import { persistSqliteSpikeSnapshot } from "@/src/sqlite/persist";

const main = async () => {
  const scraper = new LcrScraper();
  const snapshot = await scraper.scrapeDirectory();
  const result = await persistSqliteSpikeSnapshot("sqlite_full_sync", snapshot);
  console.log(`SQLite sync completed. Records processed: ${result.recordsProcessed}`);
  console.log(`SQLite database: ${getSqliteSpikeDbPath()}`);
};

main().catch((error) => {
  console.error("SQLite full sync failed", error);
  process.exit(1);
});
