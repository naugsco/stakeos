"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface UnitHealthRadarRow {
  unitName: string;
  memberCount: number;
  seminaryParticipationPct: number;
  instituteParticipationPct: number;
  activeRecommendPct: number;
  leadershipPer100: number;
  recentConvertPct: number;
  ministeringCoveragePct: number;
}

interface UnitHealthRadarPanelProps {
  rows: UnitHealthRadarRow[];
}

const metrics = [
  { key: "seminaryParticipationPct", label: "Seminary %" },
  { key: "instituteParticipationPct", label: "Institute %" },
  { key: "activeRecommendPct", label: "Recommend %" },
  { key: "leadershipPer100", label: "Leadership /100" },
  { key: "recentConvertPct", label: "Recent Converts %" },
  { key: "ministeringCoveragePct", label: "Ministering %" }
] as const;

const colors = ["#0f766e", "#b45309", "#1d4ed8"];

export function UnitHealthRadarPanel({ rows }: UnitHealthRadarPanelProps) {
  const defaultUnits = useMemo(
    () => rows.slice().sort((left, right) => right.memberCount - left.memberCount).slice(0, 3).map((row) => row.unitName),
    [rows]
  );
  const [selectedUnits, setSelectedUnits] = useState<[string, string, string]>([
    defaultUnits[0] ?? "",
    defaultUnits[1] ?? "",
    defaultUnits[2] ?? ""
  ]);

  const seriesUnits = useMemo(() => {
    const seen = new Set<string>();
    return selectedUnits.filter((unit) => {
      if (!unit || seen.has(unit)) {
        return false;
      }
      seen.add(unit);
      return true;
    });
  }, [selectedUnits]);

  const chartData = useMemo(() => {
    return metrics.map((metric) => {
      const row: Record<string, number | string> = { metric: metric.label };
      for (const unitName of seriesUnits) {
        const unit = rows.find((entry) => entry.unitName === unitName);
        row[unitName] = unit ? unit[metric.key] : 0;
      }
      return row;
    });
  }, [rows, seriesUnits]);

  const handleSelection = (index: number, value: string) => {
    setSelectedUnits((current) => {
      const next: [string, string, string] = [...current] as [string, string, string];
      next[index] = value;
      return next;
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Compare up to three units across normalized indicators.</p>
          <p className="text-xs text-slate-600">Seminary and institute use the updated youth/YSA age bands. Leadership is scaled per 100 members.</p>
        </div>
        <Link
          href="/reports#unit-health-list"
          className="rounded-md border border-amber-300 bg-white/95 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-white"
        >
          Open unit health table
        </Link>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <label key={index} className="text-sm text-slate-700">
            Unit {index + 1}
            <select
              value={selectedUnits[index]}
              onChange={(event) => handleSelection(index, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0"
            >
              <option value="">None</option>
              {rows.map((row) => (
                <option key={row.unitName} value={row.unitName}>
                  {row.unitName}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="h-[26rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="72%">
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }
                return (
                  <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg">
                    <div className="font-semibold text-slate-900">{label}</div>
                    {payload.map((entry) => (
                      <div key={String(entry.name)} className="text-slate-600">
                        {entry.name}: {entry.value}
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            {seriesUnits.map((unitName, index) => (
              <Radar
                key={unitName}
                name={unitName}
                dataKey={unitName}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
