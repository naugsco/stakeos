import { VisualOrgBrowser } from "@/components/visual-org/visual-org-browser";
import { loadSqliteSpikeAvailableUnits } from "@/src/sqlite-spike/queries";

export const dynamic = "force-dynamic";

export default async function VisualOrgPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  void searchParams;
  const availableUnits = await loadSqliteSpikeAvailableUnits();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Visual Org</h1>
        <p className="text-sm text-slate-600">
          Visualization of stake and ward leadership structure, meetings, and handbook responsibilities.
        </p>
      </header>

      <VisualOrgBrowser availableUnits={availableUnits} />
    </div>
  );
}
