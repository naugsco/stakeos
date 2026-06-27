"use client";

import { useEffect, useMemo, useState } from "react";
import WardGraph from "@/components/visual-org/ward-graph";
import type { VisualOrgPayload } from "@/src/types/visualOrg";

type VisualOrgBrowserProps = {
  availableUnits: string[];
  initialUnit?: string | null;
};

export function VisualOrgBrowser({ availableUnits, initialUnit = null }: VisualOrgBrowserProps) {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(initialUnit);
  const [data, setData] = useState<VisualOrgPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedUnit) {
          params.set("unit", selectedUnit);
        }

        const response = await fetch(`/api/visual-org${params.toString() ? `?${params.toString()}` : ""}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Failed to load visual org data (${response.status})`);
        }

        const payload = (await response.json()) as VisualOrgPayload;
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load visual org data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedUnit]);

  const scopeLabel = useMemo(() => (selectedUnit ? selectedUnit : "Entire Stake"), [selectedUnit]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Scope</p>
            <h2 className="text-lg font-semibold text-slate-900">{scopeLabel}</h2>
            <p className="text-sm text-slate-600">
              Select a unit to map real leaders into the ward graph. Entire Stake keeps the stake-level roles and meetings visible.
            </p>
          </div>

          <label className="flex min-w-[18rem] flex-col gap-1 text-sm font-medium text-slate-700">
            <span>Unit</span>
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
              value={selectedUnit ?? ""}
              onChange={(event) => setSelectedUnit(event.target.value || null)}
            >
              <option value="">Entire Stake</option>
              {availableUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</section>
      ) : null}

      <WardGraph
        assignments={data?.assignments ?? {}}
        meetings={data?.meetings ?? {}}
        unitTrainingAssignments={data?.unitTrainingAssignments ?? { highCouncilor: null }}
        selectedUnit={selectedUnit}
        loading={loading}
      />
    </div>
  );
}
