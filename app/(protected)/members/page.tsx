export const dynamic = "force-dynamic";

import { MembersTable } from "@/components/members-table";
import { loadMembersPageData } from "@/lib/dashboardData";

export default async function MembersPage() {
  const members = await loadMembersPageData();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Members</h1>
      <MembersTable members={members} />
    </div>
  );
}
