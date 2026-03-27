import { env } from "@/src/config/env";
import { getDesktopConfigSnapshot } from "@/src/config/desktopConfig";

const normalize = (value?: string) => (value ?? "").trim();

export const getRuntimeConfigState = async () => {
  const snapshot = await getDesktopConfigSnapshot();

  const runtimeMatchesDesktopConfig =
    normalize(env.LCR_DIRECTORY_URL) === normalize(snapshot.effectiveConfig.LCR_DIRECTORY_URL) &&
    normalize(env.PLAYWRIGHT_USER_DATA_DIR) === normalize(snapshot.effectiveConfig.PLAYWRIGHT_USER_DATA_DIR) &&
    normalize(String(env.PLAYWRIGHT_HEADLESS ?? false)) === normalize(snapshot.effectiveConfig.PLAYWRIGHT_HEADLESS) &&
    normalize(env.SMTP_HOST) === normalize(snapshot.effectiveConfig.SMTP_HOST) &&
    normalize(String(env.SMTP_PORT ?? "")) === normalize(snapshot.effectiveConfig.SMTP_PORT) &&
    normalize(String(env.SMTP_SECURE ?? false)) === normalize(snapshot.effectiveConfig.SMTP_SECURE) &&
    normalize(env.SMTP_USER) === normalize(snapshot.effectiveConfig.SMTP_USER) &&
    normalize(env.SMTP_PASS) === normalize(snapshot.effectiveConfig.SMTP_PASS) &&
    normalize(env.SMTP_FROM) === normalize(snapshot.effectiveConfig.SMTP_FROM) &&
    normalize(env.STAKE_NAME) === normalize(snapshot.effectiveConfig.STAKE_NAME) &&
    normalize(env.UNIT_NUMBER) === normalize(snapshot.effectiveConfig.UNIT_NUMBER) &&
    normalize(env.STAKE_PRESIDENCY_EMAILS) === normalize(snapshot.effectiveConfig.STAKE_PRESIDENCY_EMAILS) &&
    normalize(env.STAKE_COUNCIL_EMAILS) === normalize(snapshot.effectiveConfig.STAKE_COUNCIL_EMAILS);

  return {
    snapshot,
    runtimeMatchesDesktopConfig,
    restartRequired: snapshot.configExists && !runtimeMatchesDesktopConfig,
    setupComplete: snapshot.status.setupComplete
  };
};
