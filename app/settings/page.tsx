import { DesktopSettingsForm } from "@/components/desktop-settings-form";
import { getDesktopConfigSnapshot } from "@/src/config/desktopConfig";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: {
    setup?: string;
  };
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const snapshot = await getDesktopConfigSnapshot();
  const initialSetup = searchParams?.setup === "1";

  return <DesktopSettingsForm initialSnapshot={snapshot} initialSetup={initialSetup} />;
}
