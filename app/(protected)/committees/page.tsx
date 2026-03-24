export const dynamic = "force-dynamic";

import Link from "next/link";
import { CommitteesBrowser } from "@/components/committees-browser";
import { loadCommitteesPageDataBySource } from "@/lib/dashboardData";

export default async function CommitteesPage({ searchParams }: { searchParams?: { source?: string } }) {
  const source = searchParams?.source === "postgres" ? "postgres" : "sqlite";
  const { committees } = await loadCommitteesPageDataBySource(source);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stake Committees and Meetings</h1>
          <p className="text-sm text-slate-600">
            {source === "sqlite"
              ? "SQLite-backed committee rosters derived from current callings using the same handbook-based patterns."
              : "Rostered from current callings using handbook-based calling patterns. Review for local assignment accuracy."}
          </p>
        </div>
        <Link href={source === "sqlite" ? "/committees?source=postgres" : "/committees"} className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50">
          {source === "sqlite" ? "Switch To PostgreSQL Committees" : "Switch To SQLite Committees"}
        </Link>
      </header>

      <CommitteesBrowser committees={committees} source={source} />
    </div>
  );
}
