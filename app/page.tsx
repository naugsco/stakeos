import { redirect } from "next/navigation";
import { getRuntimeConfigState } from "@/src/config/runtimeConfigState";

export default async function HomePage() {
  const { snapshot, restartRequired } = await getRuntimeConfigState();
  redirect(snapshot.status.requiredComplete && !restartRequired ? "/dashboard" : `/settings?setup=1${restartRequired ? "&restart=1" : ""}`);
}
