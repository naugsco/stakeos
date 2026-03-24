import { getDashboardUnits } from "@/src/services/intelligenceService";
import { VisualOrgBrowser } from "@/components/visual-org/visual-org-browser";
import { loadSqliteSpikeAvailableUnits } from "@/src/sqlite-spike/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VisualOrgPage({
  searchParams
}: {
  searchParams?: { source?: string };
}) {
  const source = searchParams?.source === "postgres" ? "postgres" : "sqlite";
  const availableUnits = source === "sqlite" ? await loadSqliteSpikeAvailableUnits() : await getDashboardUnits();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Visual Org</h1>
        <p className="text-sm text-slate-600">
          {source === "sqlite"
            ? "SQLite-backed visualization of stake and ward leadership structure, meetings, and handbook responsibilities."
            : "PostgreSQL-backed visualization of stake and ward leadership structure, meetings, and handbook responsibilities."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {source === "sqlite" ? "SQLite Default View" : "PostgreSQL View"}
          </span>
          <Link
            href={source === "sqlite" ? "/visual-org?source=postgres" : "/visual-org"}
            className="text-sm font-medium text-teal-700 underline decoration-teal-300 underline-offset-4"
          >
            {source === "sqlite" ? "Switch To PostgreSQL Visual Org" : "Return To SQLite Visual Org"}
          </Link>
        </div>
      </header>

      <VisualOrgBrowser availableUnits={availableUnits} source={source} />
    </div>
  );
}
