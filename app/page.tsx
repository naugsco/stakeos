import { redirect } from "next/navigation";
import { getDesktopConfigSnapshot } from "@/src/config/desktopConfig";

export default async function HomePage() {
  const snapshot = await getDesktopConfigSnapshot();
  redirect(snapshot.status.requiredComplete ? "/dashboard" : "/settings?setup=1");
}
