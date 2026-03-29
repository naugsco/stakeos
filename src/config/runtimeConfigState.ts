import { getDesktopConfigSnapshot } from "@/src/config/desktopConfig";

export const getRuntimeConfigState = async () => {
  const snapshot = await getDesktopConfigSnapshot();

  return {
    snapshot,
    runtimeMatchesDesktopConfig: true,
    restartRequired: false,
    setupComplete: snapshot.status.setupComplete
  };
};
