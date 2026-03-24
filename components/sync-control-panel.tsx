"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface SyncControlPanelProps {
  daysSinceLastSync: number | null;
  latestCompletedAt: string | null;
  units: string[];
  selectedUnit: string | null;
}

export function SyncControlPanel({ daysSinceLastSync, latestCompletedAt, units, selectedUnit }: SyncControlPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUnit = (nextUnit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!nextUnit) {
      params.delete("unit");
    } else {
      params.set("unit", nextUnit);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const runSync = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);
    try {
      const response = await fetch("/api/sync/full", {
        method: "POST"
      });
      const payload = (await response.json()) as {
        started?: boolean;
        message?: string;
        logFile?: string;
      };

      if (!response.ok) {
        setIsError(true);
        setMessage(payload.message ?? "Unable to start sync.");
        return;
      }

      const summary = payload.logFile
        ? `${payload.message ?? "Sync started."} Log: ${payload.logFile}`
        : (payload.message ?? "Sync started.");
      setMessage(summary);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to start sync.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const freshnessTone =
    daysSinceLastSync === null
      ? "border-slate-200 bg-white"
      : daysSinceLastSync >= 7
        ? "border-rose-300 bg-rose-50/90 animate-pulse"
        : daysSinceLastSync >= 2
          ? "border-amber-300 bg-amber-50/90"
          : "border-emerald-200 bg-emerald-50/70";

  const freshnessTextTone =
    daysSinceLastSync === null
      ? "text-slate-900"
      : daysSinceLastSync >= 7
        ? "text-rose-800"
        : daysSinceLastSync >= 2
          ? "text-amber-900"
          : "text-slate-900";

  const freshnessCaption =
    daysSinceLastSync === null
      ? "No successful LCR sync recorded yet."
      : daysSinceLastSync >= 7
        ? "LCR data is more than a week old. Run an update now."
        : daysSinceLastSync >= 2
          ? "LCR data is getting stale. A manual update is recommended."
          : "LCR data is current.";

  return (
    <section className={`rounded-2xl border px-4 py-3 shadow-sm transition ${freshnessTone}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <div>
              <label htmlFor="dashboard-unit-filter" className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Dashboard Scope
              </label>
              <div className="mt-1">
                <select
                  id="dashboard-unit-filter"
                  value={selectedUnit ?? ""}
                  onChange={(event) => updateUnit(event.target.value)}
                  className="min-w-[16rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600"
                >
                  <option value="">Entire Stake</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Days Since Last LCR Sync</p>
            <div className="mt-1 flex items-end gap-3">
              <p className={`text-2xl font-semibold ${freshnessTextTone}`}>
                {daysSinceLastSync === null ? "n/a" : daysSinceLastSync}
              </p>
              <p className={`pb-1 text-xs ${daysSinceLastSync !== null && daysSinceLastSync >= 7 ? "text-rose-700" : daysSinceLastSync !== null && daysSinceLastSync >= 2 ? "text-amber-700" : "text-slate-500"}`}>
                Last successful sync:{" "}
                {latestCompletedAt ? new Date(latestCompletedAt).toLocaleString() : "No successful sync recorded"}
              </p>
            </div>
            <p className={`mt-1 text-xs ${daysSinceLastSync !== null && daysSinceLastSync >= 7 ? "text-rose-700" : daysSinceLastSync !== null && daysSinceLastSync >= 2 ? "text-amber-700" : "text-slate-500"}`}>
              {freshnessCaption}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runSync}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Starting..." : "Run Update Stake Directory"}
        </button>
      </div>
      {message ? (
        <p className={`mt-2 text-sm ${isError ? "text-red-700" : "text-emerald-700"}`}>{message}</p>
      ) : null}
    </section>
  );
}
