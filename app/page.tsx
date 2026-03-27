import { redirect } from "next/navigation";
import { getRuntimeConfigState } from "@/src/config/runtimeConfigState";

export default async function HomePage() {
  const { setupComplete, restartRequired } = await getRuntimeConfigState();
  redirect(setupComplete && !restartRequired ? "/dashboard" : `/settings?setup=1${restartRequired ? "&restart=1" : ""}`);
}
