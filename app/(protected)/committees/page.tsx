export const dynamic = "force-dynamic";

import { CommitteesBrowser } from "@/components/committees-browser";
import { loadCommitteesPageData } from "@/lib/dashboardData";

export default async function CommitteesPage() {
  const { committees } = await loadCommitteesPageData();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Stake Committees and Meetings</h1>
        <p className="text-sm text-slate-600">
          Rostered from current callings using handbook-based calling patterns. Review for local assignment accuracy.
        </p>
      </header>

      <CommitteesBrowser committees={committees} />
    </div>
  );
}
