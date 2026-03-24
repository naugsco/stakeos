"use client";

import { useMemo, useState } from "react";
import { MemberNameLink } from "@/components/member-name-link";

type SortDirection = "asc" | "desc";

const compareValues = (
  a: string | number | boolean | null,
  b: string | number | boolean | null,
  direction: SortDirection
) => {
  const first = a ?? null;
  const second = b ?? null;

  if (first === null && second === null) {
    return 0;
  }
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }

  let result = 0;
  if (typeof first === "number" && typeof second === "number") {
    result = first - second;
  } else if (typeof first === "boolean" && typeof second === "boolean") {
    result = Number(first) - Number(second);
  } else {
    result = String(first).localeCompare(String(second), undefined, { sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
};

type MissionEligibleRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  gender: string | null;
  age: number | null;
  missionStatus: string | null;
  currentCalling: string | null;
};

type CurrentlyServingMissionaryRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string | null;
  gender: string | null;
  age: number | null;
  missionCountry: string | null;
  missionStatus: string | null;
  templeRecommendStatus: string | null;
  email: string | null;
  phoneNumber: string | null;
  currentCalling: string | null;
};

type MissionYouthRow = {
  lcrMemberId: string;
  unitName: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  isAttendingSeminary: boolean | null;
  isAttendingInstitute: boolean | null;
  missionLanguage: string | null;
  missionCountry: string | null;
  missionStatus: string | null;
  templeRecommendStatus: string | null;
  templeEndowed: boolean | null;
  currentCalling: string | null;
  readinessScore: number;
  readinessLevel: "Ready" | "Progressing" | "Needs Focus";
};

type EndowmentRow = {
  lcrMemberId: string;
  fullName: string;
  age: number | null;
  missionStatus: string | null;
  templeEndowed: boolean | null;
};

type SeminaryInstituteOpportunityRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  track: "Seminary" | "Institute";
  attending: boolean | null;
  potentialFlag: boolean | null;
  statusText: string | null;
  phoneNumber: string | null;
  email: string | null;
};

interface YouthBrowserProps {
  currentlyServingMissionaries: CurrentlyServingMissionaryRow[];
  missionEligible: MissionEligibleRow[];
  missionYouthPipeline: MissionYouthRow[];
  seminaryInstituteOpportunity: SeminaryInstituteOpportunityRow[];
  endowment: EndowmentRow[];
}

const boolLabel = (value: boolean | null) => {
  if (value === null) {
    return "-";
  }

  return value ? "Yes" : "No";
};

const missionGenderBucket = (value: string | null | undefined): "Men" | "Women" | "Unknown" => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "m" || normalized === "male") {
    return "Men";
  }
  if (normalized === "f" || normalized === "female") {
    return "Women";
  }
  return "Unknown";
};

export function YouthBrowser({
  currentlyServingMissionaries,
  missionEligible,
  missionYouthPipeline,
  seminaryInstituteOpportunity,
  endowment,
  source = "postgres"
}: YouthBrowserProps & { source?: "postgres" | "sqlite" }) {
  const [servingSortKey, setServingSortKey] = useState<
    "unitName" | "fullName" | "age" | "missionCountry" | "missionStatus"
  >("unitName");
  const [servingSortDirection, setServingSortDirection] = useState<SortDirection>("asc");
  const [missionSortKey, setMissionSortKey] = useState<
    "unitName" | "fullName" | "age" | "gender" | "missionStatus" | "currentCalling"
  >("age");
  const [missionSortDirection, setMissionSortDirection] = useState<SortDirection>("desc");
  const [pipelineSortKey, setPipelineSortKey] = useState<
    | "unitName"
    | "fullName"
    | "age"
    | "gender"
    | "readinessLevel"
    | "readinessScore"
    | "templeRecommendStatus"
    | "templeEndowed"
    | "isAttendingSeminary"
    | "isAttendingInstitute"
    | "missionLanguage"
    | "missionCountry"
    | "missionStatus"
  >("readinessScore");
  const [pipelineSortDirection, setPipelineSortDirection] = useState<SortDirection>("desc");
  const [seminarySortKey, setSeminarySortKey] = useState<
    "unitName" | "fullName" | "age" | "potentialFlag" | "statusText"
  >("unitName");
  const [seminarySortDirection, setSeminarySortDirection] = useState<SortDirection>("asc");
  const [endowmentSortKey, setEndowmentSortKey] = useState<"fullName" | "age" | "missionStatus" | "templeEndowed">("age");
  const [endowmentSortDirection, setEndowmentSortDirection] = useState<SortDirection>("desc");

  const sortedMissionEligible = useMemo(() => {
    return [...missionEligible]
      .sort((left, right) => compareValues(left[missionSortKey], right[missionSortKey], missionSortDirection));
  }, [missionEligible, missionSortDirection, missionSortKey]);

  const sortedCurrentlyServing = useMemo(() => {
    return [...currentlyServingMissionaries]
      .sort((left, right) => compareValues(left[servingSortKey], right[servingSortKey], servingSortDirection));
  }, [currentlyServingMissionaries, servingSortDirection, servingSortKey]);

  const sortedPipeline = useMemo(() => {
    return [...missionYouthPipeline]
      .sort((left, right) => compareValues(left[pipelineSortKey], right[pipelineSortKey], pipelineSortDirection));
  }, [missionYouthPipeline, pipelineSortDirection, pipelineSortKey]);

  const sortedEndowment = useMemo(() => {
    return [...endowment]
      .sort((left, right) => compareValues(left[endowmentSortKey], right[endowmentSortKey], endowmentSortDirection));
  }, [endowment, endowmentSortDirection, endowmentSortKey]);

  const sortedSeminaryOpportunity = useMemo(() => {
    return seminaryInstituteOpportunity
      .filter((row) => row.track === "Seminary")
      .sort((left, right) => compareValues(left[seminarySortKey], right[seminarySortKey], seminarySortDirection));
  }, [seminaryInstituteOpportunity, seminarySortDirection, seminarySortKey]);

  const missionEligibleSummary = useMemo(() => {
    return missionEligible.reduce(
      (acc, row) => {
        const bucket = missionGenderBucket(row.gender);
        if (bucket === "Men") {
          acc.men += 1;
        } else if (bucket === "Women") {
          acc.women += 1;
        } else {
          acc.unknown += 1;
        }
        return acc;
      },
      { men: 0, women: 0, unknown: 0 }
    );
  }, [missionEligible]);

  const pipelineSummary = useMemo(() => {
    return missionYouthPipeline.reduce(
      (acc, row) => {
        const bucket = missionGenderBucket(row.gender);
        if (bucket === "Men") {
          acc.men += 1;
          if (row.readinessLevel === "Ready") {
            acc.menReady += 1;
          }
        } else if (bucket === "Women") {
          acc.women += 1;
          if (row.readinessLevel === "Ready") {
            acc.womenReady += 1;
          }
        } else {
          acc.unknown += 1;
          if (row.readinessLevel === "Ready") {
            acc.unknownReady += 1;
          }
        }
        return acc;
      },
      { men: 0, women: 0, unknown: 0, menReady: 0, womenReady: 0, unknownReady: 0 }
    );
  }, [missionYouthPipeline]);

  const toggleMissionSort = (key: "unitName" | "fullName" | "age" | "gender" | "missionStatus" | "currentCalling") => {
    if (key === missionSortKey) {
      setMissionSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setMissionSortKey(key);
    setMissionSortDirection("asc");
  };

  const toggleServingSort = (key: "unitName" | "fullName" | "age" | "missionCountry" | "missionStatus") => {
    if (key === servingSortKey) {
      setServingSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setServingSortKey(key);
    setServingSortDirection("asc");
  };

  const togglePipelineSort = (
    key:
      | "unitName"
      | "fullName"
      | "age"
      | "gender"
      | "readinessLevel"
      | "readinessScore"
      | "templeRecommendStatus"
      | "templeEndowed"
      | "isAttendingSeminary"
      | "isAttendingInstitute"
      | "missionLanguage"
      | "missionCountry"
      | "missionStatus"
  ) => {
    if (key === pipelineSortKey) {
      setPipelineSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setPipelineSortKey(key);
    setPipelineSortDirection("asc");
  };

  const toggleEndowmentSort = (key: "fullName" | "age" | "missionStatus" | "templeEndowed") => {
    if (key === endowmentSortKey) {
      setEndowmentSortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setEndowmentSortKey(key);
    setEndowmentSortDirection("asc");
  };

  const toggleSeminarySort = (key: "unitName" | "fullName" | "age" | "potentialFlag" | "statusText") => {
    if (key === seminarySortKey) {
      setSeminarySortDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSeminarySortKey(key);
    setSeminarySortDirection("asc");
  };

  return (
    <section className="space-y-6">
      <div id="currently-serving-missionaries" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-lg font-semibold">Currently Serving Missionaries</h2>
          <p className="text-xs text-slate-600">
            Counted only when LCR shows a nonblank mission status, or a mission country while returned missionary is false.
          </p>
        </header>
        {sortedCurrentlyServing.length === 0 ? (
          <div className="px-4 py-4 text-sm text-slate-600">
            No currently serving missionaries matched the current LCR data. In this sync, `mission status` is blank and every populated `mission country` belongs to a returned missionary.
          </div>
        ) : (
          <div className="max-h-[24rem] overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  {[
                    { key: "unitName", label: "Unit" },
                    { key: "fullName", label: "Member" },
                    { key: "age", label: "Age" },
                    { key: "missionCountry", label: "Mission Country" },
                    { key: "missionStatus", label: "Mission Status" }
                  ].map((column) => {
                    const key = column.key as "unitName" | "fullName" | "age" | "missionCountry" | "missionStatus";
                    const active = servingSortKey === key;
                    return (
                      <th key={column.key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleServingSort(key)}
                          className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">{active ? (servingSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCurrentlyServing.map((member) => (
                  <tr key={member.lcrMemberId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{member.unitName ?? "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <MemberNameLink lcrMemberId={member.lcrMemberId} fullName={member.fullName} />
                    </td>
                    <td className="px-4 py-3">{member.age ?? "-"}</td>
                    <td className="px-4 py-3">{member.missionCountry ?? "-"}</td>
                    <td className="px-4 py-3">{member.missionStatus ?? "-"}</td>
                    <td className="px-4 py-3">{member.phoneNumber ?? member.email ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div id="mission-youth-pipeline" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-lg font-semibold">Mission & Youth Pipeline (Age 17-25)</h2>
          <p className="text-xs text-slate-600">
            Readiness score uses 3 points: active recommend, seminary/institute participation, and endowed at 18+. The preparation view now includes age 17 so upcoming candidates can be monitored before formal mission eligibility.
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Men: {pipelineSummary.men} in cohort, {pipelineSummary.menReady} ready. Women: {pipelineSummary.women} in cohort, {pipelineSummary.womenReady} ready.
          </p>
        </header>
        <div className="max-h-[36rem] overflow-auto">
          <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                  {[
                    { key: "unitName", label: "Unit" },
                    { key: "fullName", label: "Member" },
                    { key: "age", label: "Age" },
                    { key: "gender", label: "Gender" },
                    { key: "readinessLevel", label: "Readiness" },
                    { key: "readinessScore", label: "Score" },
                  { key: "templeRecommendStatus", label: "Recommend" },
                  { key: "templeEndowed", label: "Endowed" },
                  { key: "isAttendingSeminary", label: "Seminary" },
                  { key: "isAttendingInstitute", label: "Institute" },
                  { key: "missionLanguage", label: "Mission Language" },
                  { key: "missionCountry", label: "Mission Country" },
                  { key: "missionStatus", label: "Mission Status" }
                ].map((column) => {
                  const key = column.key as
                    | "unitName"
                    | "fullName"
                    | "age"
                    | "gender"
                    | "readinessLevel"
                    | "readinessScore"
                    | "templeRecommendStatus"
                    | "templeEndowed"
                    | "isAttendingSeminary"
                    | "isAttendingInstitute"
                    | "missionLanguage"
                    | "missionCountry"
                    | "missionStatus";
                  const active = pipelineSortKey === key;
                  return (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => togglePipelineSort(key)}
                        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">{active ? (pipelineSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPipeline.map((row, index) => (
                <tr key={`${row.lcrMemberId}-${index}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{row.unitName}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} source={source} />
                  </td>
                  <td className="px-4 py-3">{row.age ?? "-"}</td>
                  <td className="px-4 py-3">{row.gender ?? "-"}</td>
                  <td className="px-4 py-3">{row.readinessLevel}</td>
                  <td className="px-4 py-3">{row.readinessScore}</td>
                  <td className="px-4 py-3">{row.templeRecommendStatus ?? "-"}</td>
                  <td className="px-4 py-3">{boolLabel(row.templeEndowed)}</td>
                  <td className="px-4 py-3">{boolLabel(row.isAttendingSeminary)}</td>
                  <td className="px-4 py-3">{boolLabel(row.isAttendingInstitute)}</td>
                  <td className="px-4 py-3">{row.missionLanguage ?? "-"}</td>
                  <td className="px-4 py-3">{row.missionCountry ?? "-"}</td>
                  <td className="px-4 py-3">{row.missionStatus ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="seminary-opportunity-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-lg font-semibold">Potential Seminary Students</h2>
          <p className="text-xs text-slate-600">Youth in the seminary age range who are not currently marked as attending.</p>
        </header>
        <div className="max-h-[32rem] overflow-auto">
          <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                {[
                  { key: "unitName", label: "Unit" },
                  { key: "fullName", label: "Member" },
                  { key: "age", label: "Age" },
                  { key: "potentialFlag", label: "Potential" },
                  { key: "statusText", label: "Status" }
                ].map((column) => {
                  const key = column.key as "unitName" | "fullName" | "age" | "potentialFlag" | "statusText";
                  const active = seminarySortKey === key;
                  return (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSeminarySort(key)}
                        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">{active ? (seminarySortDirection === "asc" ? "▲" : "▼") : ""}</span>
                      </button>
                    </th>
                  );
                })}
                <th className="px-4 py-3">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSeminaryOpportunity.map((row) => (
                <tr key={row.lcrMemberId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{row.unitName}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} source={source} />
                  </td>
                  <td className="px-4 py-3">{row.age ?? "-"}</td>
                  <td className="px-4 py-3">{boolLabel(row.potentialFlag)}</td>
                  <td className="px-4 py-3">{row.statusText ?? "-"}</td>
                  <td className="px-4 py-3">{row.phoneNumber ?? row.email ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Mission Eligible Members (Age 18-25)</h2>
            <p className="text-xs text-slate-600">Men are expected to serve. Women are shown as eligible candidates but are not under the same expectation.</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Men: {missionEligibleSummary.men}. Women: {missionEligibleSummary.women}.
            </p>
          </header>
          <div className="max-h-[32rem] overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  {[
                    { key: "unitName", label: "Unit" },
                    { key: "fullName", label: "Member" },
                    { key: "age", label: "Age" },
                    { key: "gender", label: "Gender" },
                    { key: "missionStatus", label: "Mission Status" },
                    { key: "currentCalling", label: "Current Calling" }
                  ].map((column) => {
                    const key = column.key as "unitName" | "fullName" | "age" | "gender" | "missionStatus" | "currentCalling";
                    const active = missionSortKey === key;
                    return (
                      <th key={column.key} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleMissionSort(key)}
                          className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">{active ? (missionSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedMissionEligible.map((member) => (
                  <tr key={member.lcrMemberId} className="hover:bg-slate-50">
                    <td className="px-3 py-2">{member.unitName ?? "-"}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      <MemberNameLink lcrMemberId={member.lcrMemberId} fullName={member.fullName} />
                    </td>
                    <td className="px-3 py-2">{member.age ?? "-"}</td>
                    <td className="px-3 py-2">{member.gender ?? "-"}</td>
                    <td className="px-3 py-2">{member.missionStatus ?? "-"}</td>
                    <td className="px-3 py-2">{member.currentCalling ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Endowment Candidates</h2>
          </header>
          <div className="max-h-[32rem] overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  {[
                    { key: "fullName", label: "Member" },
                    { key: "age", label: "Age" },
                    { key: "missionStatus", label: "Mission Status" },
                    { key: "templeEndowed", label: "Endowed" }
                  ].map((column) => {
                    const key = column.key as "fullName" | "age" | "missionStatus" | "templeEndowed";
                    const active = endowmentSortKey === key;
                    return (
                      <th key={column.key} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleEndowmentSort(key)}
                          className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">{active ? (endowmentSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedEndowment.map((member) => (
                  <tr key={member.lcrMemberId} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      <MemberNameLink lcrMemberId={member.lcrMemberId} fullName={member.fullName} />
                    </td>
                    <td className="px-3 py-2">{member.age ?? "-"}</td>
                    <td className="px-3 py-2">{member.missionStatus ?? "-"}</td>
                    <td className="px-3 py-2">{member.templeEndowed === null ? "-" : member.templeEndowed ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
