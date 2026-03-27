import { LcrScraper } from "@/src/sync/lcrScraper";
import { getSqliteSpikeDbPath } from "@/src/sqlite/db";
import { persistSqliteSpikeCallingsSnapshot } from "@/src/sqlite/persist";

const main = async () => {
  const scraper = new LcrScraper();
  const snapshot = await scraper.scrapeDirectory();
  const result = await persistSqliteSpikeCallingsSnapshot("sqlite_calling_sync", snapshot);
  console.log(`SQLite calling sync completed. Records processed: ${result.recordsProcessed}`);
  console.log(`SQLite database: ${getSqliteSpikeDbPath()}`);
};

main().catch((error) => {
  console.error("SQLite calling sync failed", error);
  process.exit(1);
});
