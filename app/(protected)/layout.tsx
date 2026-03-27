import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRuntimeConfigState } from "@/src/config/runtimeConfigState";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { setupComplete, restartRequired } = await getRuntimeConfigState();

  if (!setupComplete || restartRequired) {
    redirect(`/settings?setup=1${restartRequired ? "&restart=1" : ""}`);
  }

  return children;
}
