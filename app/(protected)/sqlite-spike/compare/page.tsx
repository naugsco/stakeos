export const dynamic = "force-dynamic";

import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { buildSqliteComparisonReport } from "@/src/sqlite-spike/compare";

const diffClassName = (diff: number) => {
  if (diff === 0) {
    return "text-emerald-700";
  }

  if (Math.abs(diff) === 1) {
    return "text-amber-700";
  }

  return "text-rose-700";
};

export default async function SqliteSpikeComparePage() {
  const report = await buildSqliteComparisonReport();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">SQLite vs PostgreSQL Comparison</h1>
          <p className="text-sm text-slate-600">
            Stake-level summary comparison for the SQLite spike. Nonzero diffs are highlighted so the next porting work can target the real logic gaps.
          </p>
        </div>
        <Link
          href="/sqlite-spike"
          className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm hover:bg-amber-50"
        >
          Back To SQLite Spike
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Compared Metrics" value={report.rows.length} />
        <StatCard label="Exact Matches" value={report.exactMatchCount} />
        <StatCard label="Nonzero Diffs" value={report.nonZeroCount} />
      </section>

      {report.nonZeroRows.length > 0 ? (
        <section className="rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Nonzero Diffs To Investigate</h2>
          <div className="mt-3 space-y-3">
            {report.nonZeroRows.map((row) => (
              <div key={`${row.category}-${row.metric}`} className="rounded-xl border border-amber-900/10 bg-white/70 px-4 py-3">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{row.category}</p>
                    <p className="font-medium text-slate-900">{row.metric}</p>
                  </div>
                  <p className={`text-sm font-semibold ${diffClassName(row.diff)}`}>
                    PostgreSQL {row.postgresValue} · SQLite {row.sqliteValue} · Diff {row.diff > 0 ? `+${row.diff}` : row.diff}
                  </p>
                </div>
                {row.note ? <p className="mt-2 text-sm text-slate-600">{row.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-amber-900/15 bg-[var(--panel)] shadow-sm">
        <div className="border-b border-amber-900/10 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Metric Comparison Table</h2>
          <p className="text-sm text-slate-600">SQLite minus PostgreSQL is shown in the Diff column.</p>
        </div>
        <div className="max-h-[38rem] overflow-auto">
          <table className="w-full text-left text-sm stakeos-data-table">
            <thead className="bg-[#fffaf0] text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Metric</th>
                <th className="px-4 py-3 font-medium">PostgreSQL</th>
                <th className="px-4 py-3 font-medium">SQLite</th>
                <th className="px-4 py-3 font-medium">Diff</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr
                  key={`${row.category}-${row.metric}`}
                  className={row.diff === 0 ? "border-t border-slate-200/70" : "border-t border-amber-200 bg-amber-50/40"}
                >
                  <td className="px-4 py-3 text-slate-600">{row.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.metric}</td>
                  <td className="px-4 py-3 text-slate-700">{row.postgresValue}</td>
                  <td className="px-4 py-3 text-slate-700">{row.sqliteValue}</td>
                  <td className={`px-4 py-3 font-semibold ${diffClassName(row.diff)}`}>
                    {row.diff > 0 ? `+${row.diff}` : row.diff}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.note ?? "Exact match."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
