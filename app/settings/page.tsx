import { DesktopSettingsForm } from "@/components/desktop-settings-form";
import { getRuntimeConfigState } from "@/src/config/runtimeConfigState";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: {
    setup?: string;
    restart?: string;
  };
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { snapshot, restartRequired } = await getRuntimeConfigState();
  const initialSetup = searchParams?.setup === "1";
  const restartNotice = searchParams?.restart === "1" || restartRequired;

  return <DesktopSettingsForm initialSnapshot={snapshot} initialSetup={initialSetup} restartRequired={restartNotice} />;
}
