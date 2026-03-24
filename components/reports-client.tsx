"use client";

import { useEffect, useState } from "react";
import { ReportsContent } from "@/components/reports-content";

type ReportsPayload = Awaited<ReturnType<typeof import("@/lib/dashboardData").loadReportsPageData>>;

export function ReportsClient() {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load reports (${response.status})`);
        }

        const payload = (await response.json()) as ReportsPayload;
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reports");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        Reports failed to load. {error}
      </section>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Baptism Follow-Up</h2>
            <p className="text-sm text-slate-600">Loading report data…</p>
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
        </section>
        <div className="h-[120rem] animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  return <ReportsContent data={data} />;
}
