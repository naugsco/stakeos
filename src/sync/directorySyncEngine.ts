import { LcrScraper } from "@/src/sync/lcrScraper";
import { persistCallingSnapshot, persistSnapshot } from "@/src/sync/persist";

export class DirectorySyncEngine {
  private readonly scraper = new LcrScraper();

  async runFullSync() {
    const snapshot = await this.scraper.scrapeDirectory();
    return persistSnapshot("nightly_full_directory_sync", snapshot);
  }

  async runCallingSync() {
    const payload = await this.scraper.scrapeCallingsOnly();
    return persistCallingSnapshot("hourly_calling_sync", payload);
  }
}
