export const dynamic = "force-dynamic";

import { MembersTable } from "@/components/members-table";
import { loadMembersPageDataBySource } from "@/lib/dashboardData";

export default async function MembersPage() {
  const members = await loadMembersPageDataBySource();

  return (
    <div className="space-y-4">
      <div>
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-sm text-slate-600">Directory roster with direct access to member detail, contact, and household information.</p>
        </div>
      </div>
      <MembersTable members={members} />
    </div>
  );
}
