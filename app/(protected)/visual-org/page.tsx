import { getDashboardUnits } from "@/src/services/intelligenceService";
import { VisualOrgBrowser } from "@/components/visual-org/visual-org-browser";

export const dynamic = "force-dynamic";

export default async function VisualOrgPage() {
  const availableUnits = await getDashboardUnits();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Visual Org</h1>
        <p className="text-sm text-slate-600">
          Interactive visualization of stake and ward leadership structure, meetings, and handbook responsibilities.
        </p>
      </header>

      <VisualOrgBrowser availableUnits={availableUnits} />
    </div>
  );
}
