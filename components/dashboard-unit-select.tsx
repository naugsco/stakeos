"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DashboardUnitSelectProps = {
  units: string[];
  selectedUnit: string | null;
  compact?: boolean;
};

export function DashboardUnitSelect({ units, selectedUnit, compact = false }: DashboardUnitSelectProps) {
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

  return (
    <div className={compact ? "flex min-w-0 flex-wrap items-center gap-2 sm:gap-3" : undefined}>
      <label
        htmlFor="dashboard-unit-filter"
        className={`text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 ${compact ? "whitespace-nowrap" : ""}`}
      >
        Ward / Branch Scope
      </label>
      <select
        id="dashboard-unit-filter"
        value={selectedUnit ?? ""}
        onChange={(event) => updateUnit(event.target.value)}
        className={`w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 ${compact ? "mt-0 flex-1 basis-full sm:basis-[14rem]" : "mt-2"}`}
      >
        <option value="">Entire Stake</option>
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  );
}
