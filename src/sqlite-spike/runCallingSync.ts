import { LcrScraper } from "@/src/sync/lcrScraper";
import { getSqliteSpikeDbPath } from "@/src/sqlite-spike/db";
import { persistSqliteSpikeCallingsSnapshot } from "@/src/sqlite-spike/persist";

const main = async () => {
  const scraper = new LcrScraper();
  const snapshot = await scraper.scrapeDirectory();
  const result = await persistSqliteSpikeCallingsSnapshot("sqlite_spike_calling_sync", snapshot);
  console.log(`SQLite spike calling sync completed. Records processed: ${result.recordsProcessed}`);
  console.log(`SQLite spike database: ${getSqliteSpikeDbPath()}`);
};

main().catch((error) => {
  console.error("SQLite spike calling sync failed", error);
  process.exit(1);
});
