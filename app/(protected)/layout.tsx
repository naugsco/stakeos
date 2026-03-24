import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRuntimeConfigState } from "@/src/config/runtimeConfigState";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { snapshot, restartRequired } = await getRuntimeConfigState();

  if (!snapshot.status.requiredComplete || restartRequired) {
    redirect(`/settings?setup=1${restartRequired ? "&restart=1" : ""}`);
  }

  return children;
}
