"use client";

interface TransitionLaneSegment {
  label: string;
  value: number;
  tone: "women" | "milestone" | "cohort";
}

interface TransitionLaneRow {
  label: string;
  section?: string;
  segments: TransitionLaneSegment[];
}

const toneClasses: Record<TransitionLaneSegment["tone"], string> = {
  women: "bg-rose-500",
  milestone: "bg-blue-700",
  cohort: "bg-teal-700"
};

export function TransitionLaneChart({ rows }: { rows: TransitionLaneRow[] }) {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => row.segments.map((segment) => segment.value))
  );

  let previousSection: string | undefined;

  return (
    <div className="rounded-2xl border border-amber-900/15 bg-[var(--panel)] p-4 shadow-sm">
      <div className="space-y-5">
        {rows.map((row) => {
          const showSection = row.section && row.section !== previousSection;
          previousSection = row.section;

          return (
            <div key={row.label} className="space-y-2">
              {showSection ? (
                <div className="border-b border-slate-200 pb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{row.section}</p>
                </div>
              ) : null}
              <div className="grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
                <div className="pt-1 text-sm font-semibold text-slate-900">{row.label}</div>
                <div className="space-y-2">
                  {row.segments.map((segment) => {
                    const widthPct = Math.max(6, Math.round((segment.value / maxValue) * 100));
                    return (
                      <div key={`${row.label}-${segment.label}`} className="grid items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_3rem]">
                        <div className="text-xs font-medium text-slate-600">{segment.label}</div>
                        <div className="h-6 rounded-full bg-slate-100">
                          <div
                            className={`flex h-6 items-center rounded-full px-2 text-[11px] font-semibold text-white ${toneClasses[segment.tone]}`}
                            style={{ width: `${widthPct}%` }}
                          >
                            {segment.value}
                          </div>
                        </div>
                        <div className="text-right text-xs font-semibold text-slate-600">{segment.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
