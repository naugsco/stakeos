export const dynamic = "force-dynamic";

import { CommitteesBrowser } from "@/components/committees-browser";
import { loadCommitteesPageDataBySource } from "@/lib/dashboardData";

export default async function CommitteesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  void searchParams;
  const { committees } = await loadCommitteesPageDataBySource("sqlite");

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-semibold">Stake Committees and Meetings</h1>
          <p className="text-sm text-slate-600">
            Rostered from current callings using handbook-based calling patterns. Review for local assignment accuracy.
          </p>
        </div>
      </header>

      <CommitteesBrowser committees={committees} />
    </div>
  );
}
