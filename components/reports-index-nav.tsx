"use client";

import { useEffect, useMemo, useState } from "react";

interface ReportGroupItem {
  id: string;
  label: string;
}

interface ReportGroup {
  heading: string;
  items: ReportGroupItem[];
}

function getInitialHashId(reportGroups: ReportGroup[]) {
  if (typeof window === "undefined") {
    return reportGroups[0]?.items[0]?.id ?? "";
  }

  return window.location.hash.replace(/^#/, "") || reportGroups[0]?.items[0]?.id || "";
}

export function ReportsIndexNav({ reportGroups }: { reportGroups: ReportGroup[] }) {
  const fallbackId = useMemo(() => reportGroups[0]?.items[0]?.id ?? "", [reportGroups]);
  const [activeId, setActiveId] = useState(() => getInitialHashId(reportGroups));

  useEffect(() => {
    const updateActiveId = () => {
      const hashId = window.location.hash.replace(/^#/, "");
      setActiveId(hashId || fallbackId);
    };

    updateActiveId();
    window.addEventListener("hashchange", updateActiveId);

    return () => window.removeEventListener("hashchange", updateActiveId);
  }, [fallbackId]);

  return (
    <div className="sticky top-24 rounded-panel border border-line bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Reports Index</div>
      <p className="mt-2 text-sm text-slate-600">
        Jump by report family instead of scanning the entire page top to bottom.
      </p>
      <div className="mt-5 space-y-5">
        {reportGroups.map((group) => (
          <div key={group.heading}>
            <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{group.heading}</div>
            <nav className="mt-2 space-y-2">
              {group.items.map((section) => {
                const active = activeId === section.id;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveId(section.id)}
                    className={[
                      "block rounded-2xl border px-4 py-3 text-sm font-medium transition",
                      active
                        ? "border-teal-600/20 bg-teal-50 text-teal-800 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.08)]"
                        : "border-transparent bg-panel-warm text-slate-700 hover:border-amber-300 hover:bg-white"
                    ].join(" ")}
                    aria-current={active ? "location" : undefined}
                  >
                    {section.label}
                  </a>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
}
