import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getDesktopConfigSnapshot } from "@/src/config/desktopConfig";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const snapshot = await getDesktopConfigSnapshot();

  if (!snapshot.status.requiredComplete) {
    redirect("/settings?setup=1");
  }

  return children;
}
