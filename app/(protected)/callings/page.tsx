export const dynamic = "force-dynamic";

import { CallingsBrowser } from "@/components/callings-browser";
import { getEffectiveDesktopEnv } from "@/src/config/desktopConfig";
import { loadCallingsPageDataBySource } from "@/lib/dashboardData";

export default async function CallingsPage() {
  const { callings, availableUnits } = await loadCallingsPageDataBySource();
  const stakeName = getEffectiveDesktopEnv().STAKE_NAME || "StakeOS Stake";

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-semibold">Callings</h1>
          <p className="text-sm text-slate-600">Current calling assignments grouped by unit with leadership and sustain-date context.</p>
        </div>
      </header>
      <CallingsBrowser callings={callings} availableUnits={availableUnits} stakeName={stakeName} />
    </div>
  );
}
