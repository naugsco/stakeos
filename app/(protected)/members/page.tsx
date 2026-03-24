export const dynamic = "force-dynamic";

import { MembersTable } from "@/components/members-table";
import { loadMembersPageDataBySource } from "@/lib/dashboardData";
import Link from "next/link";

export default async function MembersPage({
  searchParams
}: {
  searchParams?: { source?: string };
}) {
  const source = searchParams?.source === "postgres" ? "postgres" : "sqlite";
  const members = await loadMembersPageDataBySource(source);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-sm text-slate-600">
            {source === "sqlite" ? "SQLite-backed members view on the spike branch." : "PostgreSQL-backed members view."}
          </p>
        </div>
      <div className="flex gap-2">
          <Link
            href={source === "sqlite" ? "/members?source=postgres" : "/members"}
            className="inline-flex rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50"
          >
            {source === "sqlite" ? "Switch To PostgreSQL Members" : "Switch To SQLite Members"}
          </Link>
        </div>
      </div>
      <MembersTable members={members} source={source} />
    </div>
  );
}
