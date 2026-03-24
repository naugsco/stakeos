export const dynamic = "force-dynamic";

import { CallingsBrowser } from "@/components/callings-browser";
import { loadCallingsPageData } from "@/lib/dashboardData";

export default async function CallingsPage() {
  const { callings } = await loadCallingsPageData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Callings</h1>
      <CallingsBrowser callings={callings} />
    </div>
  );
}
