import cron from "node-cron";
import { DirectorySyncEngine } from "@/src/sync/directorySyncEngine";
import { generateReport } from "@/src/services/intelligenceService";
import { sendCallingEmail } from "@/src/services/messagingService";

const engine = new DirectorySyncEngine();

const safeTask = async (label: string, task: () => Promise<void>) => {
  try {
    console.log(`[${new Date().toISOString()}] Starting ${label}`);
    await task();
    console.log(`[${new Date().toISOString()}] Completed ${label}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed ${label}`, error);
  }
};

export const registerJobs = () => {
  // Nightly full directory sync at 1:30 AM
  cron.schedule("30 1 * * *", () => {
    void safeTask("nightly full directory sync", async () => {
      await engine.runFullSync();
    });
  });

  // Hourly calling sync at minute 5
  cron.schedule("5 * * * *", () => {
    void safeTask("hourly calling sync", async () => {
      await engine.runCallingSync();
    });
  });

  // Weekly stake presidency report on Sundays at 7:00 AM
  cron.schedule("0 7 * * 0", () => {
    void safeTask("weekly stake presidency report", async () => {
      const report = await generateReport("weekly_stake_presidency_report");
      await sendCallingEmail({
        targetType: "stake_presidency",
        targetValue: "stake_presidency",
        subject: "Weekly Stake Presidency Report",
        body: JSON.stringify(report, null, 2),
        includeSpouses: false
      });
    });
  });

  // Weekly stake council newsletter on Sundays at 8:00 AM
  cron.schedule("0 8 * * 0", () => {
    void safeTask("stake council newsletter", async () => {
      const report = await generateReport("stake_council_newsletter");
      await sendCallingEmail({
        targetType: "stake_council",
        targetValue: "stake_council",
        subject: "Stake Council Newsletter",
        body: JSON.stringify(report, null, 2),
        includeSpouses: true
      });
    });
  });

  // Youth advancement report on Tuesdays at 6:30 AM
  cron.schedule("30 6 * * 2", () => {
    void safeTask("youth advancement report", async () => {
      const report = await generateReport("youth_advancement_report");
      await sendCallingEmail({
        targetType: "organization",
        targetValue: "Young",
        subject: "Youth Advancement Report",
        body: JSON.stringify(report, null, 2),
        includeSpouses: false
      });
    });
  });

  // Mission readiness report on Thursdays at 6:30 AM
  cron.schedule("30 6 * * 4", () => {
    void safeTask("mission readiness report", async () => {
      const report = await generateReport("mission_readiness_report");
      await sendCallingEmail({
        targetType: "organization",
        targetValue: "Mission",
        subject: "Mission Readiness Report",
        body: JSON.stringify(report, null, 2),
        includeSpouses: false
      });
    });
  });
};
