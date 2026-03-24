export const dynamic = "force-dynamic";

import Link from "next/link";
import { CallingsBrowser } from "@/components/callings-browser";
import { loadCallingsPageDataBySource } from "@/lib/dashboardData";

export default async function CallingsPage({ searchParams }: { searchParams?: { source?: string } }) {
  const source = searchParams?.source === "postgres" ? "postgres" : "sqlite";
  const { callings } = await loadCallingsPageDataBySource(source);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Callings</h1>
          <p className="text-sm text-slate-600">{source === "sqlite" ? "SQLite-backed callings view." : "PostgreSQL-backed callings view."}</p>
        </div>
        <Link href={source === "sqlite" ? "/callings?source=postgres" : "/callings"} className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50">
          {source === "sqlite" ? "Switch To PostgreSQL Callings" : "Switch To SQLite Callings"}
        </Link>
      </header>
      <CallingsBrowser callings={callings} source={source} />
    </div>
  );
}
