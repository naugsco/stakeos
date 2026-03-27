"use client";

import { useMemo, useState } from "react";

const minimumColumns = [
  "Preferred Name",
  "Unit",
  "Individual E-mail",
  "Individual Phone"
];

const recommendedGroups: Array<{ title: string; columns: string[] }> = [
  {
    title: "Calling And Unit",
    columns: ["Callings", "Callings with Date Sustained and Set Apart", "Unit Abbreviation"]
  },
  {
    title: "Address And Household",
    columns: [
      "Address - Street 1",
      "Address - Street 2",
      "Address - City",
      "Address - State or Province",
      "Address - Postal Code",
      "Address - Country",
      "Head of House",
      "Household Position"
    ]
  },
  {
    title: "Temple, Ordinances, And Mission",
    columns: [
      "Baptism Date",
      "Confirmation Date",
      "Endowment Status",
      "Endowment Date",
      "Is Endowed",
      "Temple Recommend Status",
      "Temple Recommend Expiration Date",
      "Temple Recommend Type",
      "Mission Language",
      "Mission Country",
      "Is Returned Missionary",
      "Priesthood office",
      "Priesthood"
    ]
  },
  {
    title: "Youth, Ministering, And Family",
    columns: [
      "Institute Status",
      "Seminary Status",
      "Is Attending Seminary",
      "Is Attending Institute",
      "Potential Seminary Student",
      "Potential Institute Student",
      "Has Ministering Sisters",
      "Has Ministering Brothers",
      "Ministering Sisters",
      "Ministering Brothers",
      "Spouse Name",
      "Marriage Date",
      "Marriage Status",
      "Is Married",
      "Is Single",
      "Is Divorced",
      "Is Widowed",
      "Has Children",
      "Is Sealed to Parents",
      "Is Sealed to a Spouse",
      "Is Sealed to Current Spouse",
      "Is Sealed to a Prior Spouse",
      "Sealing to Parents",
      "Sealing to Spouse",
      "Is Born in Covenant",
      "Is Convert",
      "Is Accountable"
    ]
  }
];

const fullRecommendedColumnSet = [
  ...minimumColumns,
  ...recommendedGroups.flatMap((group) => group.columns),
  "Age",
  "Gender",
  "Birth Date (1 Jan 1990)",
  "Birth Country",
  "Birthplace",
  "Move In Date",
  "Ordination Date"
].filter((value, index, array) => array.indexOf(value) === index);

export function LcrReportHelper() {
  const [message, setMessage] = useState<string | null>(null);

  const fullColumnText = useMemo(() => fullRecommendedColumnSet.join("\n"), []);

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(successMessage);
      window.setTimeout(() => setMessage(null), 1800);
    } catch {
      setMessage("Unable to copy right now.");
      window.setTimeout(() => setMessage(null), 1800);
    }
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-amber-900/10 bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl text-slate-900">LCR Report Helper</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            StakeOS expects a person-based LCR custom report. Column order does not matter. Visible column names do matter.
            Units, wards, and branches populate from the report rows themselves after the first sync.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyText(fullColumnText, "Copied the full recommended column list.")}
          className="rounded-full border border-amber-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Copy Full Column List
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-900/10 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Minimum Required</p>
                <p className="mt-1 text-sm text-slate-600">These four headers are the minimum identity and contact base.</p>
              </div>
              <button
                type="button"
                onClick={() => void copyText(minimumColumns.join("\n"), "Copied the minimum required headers.")}
                className="rounded-full border border-amber-900/10 bg-[#fffaf0] px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Copy Minimum
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {minimumColumns.map((column) => (
                <li key={column} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{column}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-900/10 bg-white px-4 py-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Checklist</p>
            <ul className="mt-3 space-y-2">
              <li>Use a custom report in LCR, not a household-based export.</li>
              <li>Keep one row per person.</li>
              <li>Do not rename the visible header labels.</li>
              <li>Paste the full report-details URL into StakeOS.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {recommendedGroups.map((group) => (
            <div key={group.title} className="rounded-2xl border border-amber-900/10 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{group.title}</p>
                  <p className="mt-1 text-sm text-slate-600">Recommended for full dashboard, reports, and follow-up coverage.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(group.columns.join("\n"), `Copied ${group.title} headers.`)}
                  className="rounded-full border border-amber-900/10 bg-[#fffaf0] px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Copy Group
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.columns.map((column) => (
                  <span key={column} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    {column}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
