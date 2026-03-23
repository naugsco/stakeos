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

const boolLabel = (value: boolean | null) => {
  if (value === null) {
    return "-";
  }
  return value ? "Yes" : "No";
};

type UnitHealthRow = {
  unitName: string;
  memberCount: number;
  currentCallings: number;
  leadershipCallings: number;
  seminaryAttending: number;
  instituteAttending: number;
  convertsLast12Months: number;
};

type LeadershipTenureRow = {
  lcrMemberId: string;
  unitName: string;
  fullName: string;
  callingTitle: string;
  yearsInCalling: number;
};

type RecentMoveInRow = {
  lcrMemberId: string;
  unitName: string;
  fullName: string;
  moveInDate: string | null;
  phoneNumber: string | null;
  email: string | null;
};

type MissionYouthRow = {
  lcrMemberId: string;
  unitName: string;
  fullName: string;
  age: number | null;
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

type TempleRecommendAttentionRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  templeRecommendStatus: string | null;
};

type TempleRecommendRecoveryRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  templeRecommendStatus: string | null;
  reactivatedAt: string;
  inactiveDays: number;
};

type SeminaryInstituteByUnitRow = {
  unitName: string;
  seminaryEligible: number;
  seminaryAttending: number;
  seminaryParticipationPct: number;
  instituteEligible: number;
  instituteAttending: number;
  instituteParticipationPct: number;
};

type NewReturningStrengtheningRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  focusCategory: string;
  focusDate: string | null;
  templeRecommendStatus: string | null;
  hasCurrentCalling: boolean;
  ministeringAssigned: boolean;
  recoveredAfterLongLapse: boolean;
  reactivatedAt: string | null;
  inactiveDays: number | null;
};

type PriesthoodProgressionRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  currentOffice: string | null;
  recommendedNextOffice: string;
};

type RecentBaptismRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  baptismDate: string | null;
  confirmationDate: string | null;
  phoneNumber: string | null;
  email: string | null;
};

type RecommendExpirationRiskRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  templeRecommendStatus: string | null;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
};

type MinisteringGapRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  gapCategory: "No Assigned Ministers";
  hasMinisteringBrothers: boolean | null;
  hasMinisteringSisters: boolean | null;
  ministeringBrothers: string | null;
  ministeringSisters: string | null;
  spouseName: string | null;
  phoneNumber: string | null;
  email: string | null;
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

type HouseholdOutreachRow = {
  householdId: number;
  householdName: string;
  headOfHouse: string | null;
  unitName: string;
  memberCount: number;
  youthCount: number;
  recentBaptismCount: number;
  recommendRiskCount: number;
  ministeringGapCount: number;
  householdEmails: string;
  householdPhones: string;
  focusAreas: string[];
};

type CovenantPathProgressionRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  age: number | null;
  baptismDate: string | null;
  confirmationDate: string | null;
  endowmentDate: string | null;
  ordinationDate: string | null;
  templeRecommendStatus: string | null;
  currentCalling: string | null;
  ministeringAssigned: boolean;
  ordinanceBucket: string;
  templeBucket: string;
  serviceBucket: string;
  youthBucket: string | null;
  familyBucket: string | null;
  overallFocus: string;
  attentionScore: number;
  recentMilestoneDate: string | null;
  milestones: string[];
};

interface ReportsBrowserProps {
  unitHealth: UnitHealthRow[];
  leadershipTenure: LeadershipTenureRow[];
  recentMoveIns: RecentMoveInRow[];
  templeRecommendHealth: {
    statusCounts: Array<{ label: string; value: number }>;
    attentionMembers: TempleRecommendAttentionRow[];
    recoveredAfterLongLapse: TempleRecommendRecoveryRow[];
    trackingSince: string | null;
    daysTracked: number;
  };
  seminaryInstituteByUnit: SeminaryInstituteByUnitRow[];
  newReturningStrengthening: {
    summary: Array<{ label: string; value: number }>;
    members: NewReturningStrengtheningRow[];
  };
  priesthoodProgression: {
    summary: Array<{ label: string; value: number }>;
    members: PriesthoodProgressionRow[];
  };
  recentBaptisms: {
    summary: Array<{ label: string; value: number }>;
    members: RecentBaptismRow[];
  };
  recommendExpirationRisk: {
    summary: Array<{ label: string; value: number }>;
    members: RecommendExpirationRiskRow[];
  };
  ministeringGaps: {
    summary: Array<{ label: string; value: number }>;
    members: MinisteringGapRow[];
  };
  seminaryInstituteOpportunity: SeminaryInstituteOpportunityRow[];
  householdOutreach: {
    summary: Array<{ label: string; value: number }>;
    households: HouseholdOutreachRow[];
  };
  covenantPathProgression: CovenantPathProgressionRow[];
}

export function ReportsBrowser({
  unitHealth,
  leadershipTenure,
  recentMoveIns,
  templeRecommendHealth,
  seminaryInstituteByUnit,
  newReturningStrengthening,
  priesthoodProgression,
  recentBaptisms,
  recommendExpirationRisk,
  ministeringGaps,
  seminaryInstituteOpportunity,
  householdOutreach,
  covenantPathProgression
}: ReportsBrowserProps) {
  const [unitSortKey, setUnitSortKey] = useState<keyof UnitHealthRow>("unitName");
  const [unitSortDirection, setUnitSortDirection] = useState<SortDirection>("asc");

  const [tenureSortKey, setTenureSortKey] = useState<"unitName" | "fullName" | "callingTitle" | "yearsInCalling">("yearsInCalling");
  const [tenureSortDirection, setTenureSortDirection] = useState<SortDirection>("desc");

  const [moveSortKey, setMoveSortKey] = useState<"moveInDate" | "unitName" | "fullName" | "contact">("moveInDate");
  const [moveSortDirection, setMoveSortDirection] = useState<SortDirection>("desc");

  const [recommendSortKey, setRecommendSortKey] = useState<"unitName" | "fullName" | "age" | "templeRecommendStatus">("unitName");
  const [recommendSortDirection, setRecommendSortDirection] = useState<SortDirection>("asc");

  const [recoverySortKey, setRecoverySortKey] = useState<"unitName" | "fullName" | "inactiveDays" | "reactivatedAt">("inactiveDays");
  const [recoverySortDirection, setRecoverySortDirection] = useState<SortDirection>("desc");

  const [seminarySortKey, setSeminarySortKey] = useState<keyof SeminaryInstituteByUnitRow>("unitName");
  const [seminarySortDirection, setSeminarySortDirection] = useState<SortDirection>("asc");

  const [strengthSortKey, setStrengthSortKey] = useState<
    | "unitName"
    | "fullName"
    | "focusCategory"
    | "focusDate"
    | "templeRecommendStatus"
    | "hasCurrentCalling"
    | "ministeringAssigned"
    | "recoveredAfterLongLapse"
    | "inactiveDays"
  >("focusDate");
  const [strengthSortDirection, setStrengthSortDirection] = useState<SortDirection>("desc");

  const [priesthoodSortKey, setPriesthoodSortKey] = useState<
    "unitName" | "fullName" | "age" | "currentOffice" | "recommendedNextOffice"
  >("recommendedNextOffice");
  const [priesthoodSortDirection, setPriesthoodSortDirection] = useState<SortDirection>("asc");

  const [baptismSortKey, setBaptismSortKey] = useState<"baptismDate" | "unitName" | "fullName" | "age">("baptismDate");
  const [baptismSortDirection, setBaptismSortDirection] = useState<SortDirection>("desc");

  const [expirationSortKey, setExpirationSortKey] = useState<
    "expirationDate" | "daysUntilExpiration" | "unitName" | "fullName" | "templeRecommendStatus"
  >("expirationDate");
  const [expirationSortDirection, setExpirationSortDirection] = useState<SortDirection>("asc");

  const [ministeringSortKey, setMinisteringSortKey] = useState<
    "unitName" | "fullName" | "age" | "gapCategory" | "hasMinisteringBrothers" | "hasMinisteringSisters"
  >("gapCategory");
  const [ministeringSortDirection, setMinisteringSortDirection] = useState<SortDirection>("asc");

  const [opportunitySortKey, setOpportunitySortKey] = useState<
    "unitName" | "fullName" | "age" | "potentialFlag"
  >("unitName");
  const [opportunitySortDirection, setOpportunitySortDirection] = useState<SortDirection>("asc");

  const [householdSortKey, setHouseholdSortKey] = useState<
    "unitName" | "householdName" | "memberCount" | "youthCount" | "recentBaptismCount" | "recommendRiskCount" | "ministeringGapCount"
  >("unitName");
  const [householdSortDirection, setHouseholdSortDirection] = useState<SortDirection>("asc");

  const [progressionSortKey, setProgressionSortKey] = useState<
    "unitName" | "fullName" | "age" | "attentionScore" | "recentMilestoneDate" | "overallFocus"
  >("attentionScore");
  const [progressionSortDirection, setProgressionSortDirection] = useState<SortDirection>("desc");

  const sortedUnitHealth = useMemo(
    () => [...unitHealth].sort((left, right) => compareValues(left[unitSortKey], right[unitSortKey], unitSortDirection)),
    [unitHealth, unitSortDirection, unitSortKey]
  );

  const sortedLeadershipTenure = useMemo(
    () => [...leadershipTenure].sort((left, right) => compareValues(left[tenureSortKey], right[tenureSortKey], tenureSortDirection)).slice(0, 40),
    [leadershipTenure, tenureSortDirection, tenureSortKey]
  );

  const sortedMoveIns = useMemo(
    () =>
      [...recentMoveIns]
        .sort((left, right) => {
          const leftValue = moveSortKey === "contact" ? (left.phoneNumber ?? left.email ?? "") : left[moveSortKey];
          const rightValue = moveSortKey === "contact" ? (right.phoneNumber ?? right.email ?? "") : right[moveSortKey];
          return compareValues(leftValue, rightValue, moveSortDirection);
        })
        .slice(0, 40),
    [moveSortDirection, moveSortKey, recentMoveIns]
  );

  const sortedRecommendAttention = useMemo(
    () =>
      [...templeRecommendHealth.attentionMembers].sort((left, right) =>
        compareValues(left[recommendSortKey], right[recommendSortKey], recommendSortDirection)
      ),
    [recommendSortDirection, recommendSortKey, templeRecommendHealth.attentionMembers]
  );

  const sortedRecoveries = useMemo(
    () =>
      [...templeRecommendHealth.recoveredAfterLongLapse].sort((left, right) =>
        compareValues(left[recoverySortKey], right[recoverySortKey], recoverySortDirection)
      ),
    [recoverySortDirection, recoverySortKey, templeRecommendHealth.recoveredAfterLongLapse]
  );

  const sortedSeminary = useMemo(
    () => [...seminaryInstituteByUnit].sort((left, right) => compareValues(left[seminarySortKey], right[seminarySortKey], seminarySortDirection)),
    [seminaryInstituteByUnit, seminarySortDirection, seminarySortKey]
  );

  const sortedStrengthening = useMemo(
    () => [...newReturningStrengthening.members].sort((left, right) => compareValues(left[strengthSortKey], right[strengthSortKey], strengthSortDirection)),
    [newReturningStrengthening.members, strengthSortDirection, strengthSortKey]
  );

  const sortedPriesthood = useMemo(
    () => [...priesthoodProgression.members].sort((left, right) => compareValues(left[priesthoodSortKey], right[priesthoodSortKey], priesthoodSortDirection)),
    [priesthoodProgression.members, priesthoodSortDirection, priesthoodSortKey]
  );

  const sortedBaptisms = useMemo(
    () => [...recentBaptisms.members].sort((left, right) => compareValues(left[baptismSortKey], right[baptismSortKey], baptismSortDirection)),
    [baptismSortDirection, baptismSortKey, recentBaptisms.members]
  );

  const sortedExpirationRisk = useMemo(
    () =>
      [...recommendExpirationRisk.members].sort((left, right) =>
        compareValues(left[expirationSortKey], right[expirationSortKey], expirationSortDirection)
      ),
    [expirationSortDirection, expirationSortKey, recommendExpirationRisk.members]
  );

  const sortedMinisteringGaps = useMemo(
    () => [...ministeringGaps.members].sort((left, right) => compareValues(left[ministeringSortKey], right[ministeringSortKey], ministeringSortDirection)),
    [ministeringGaps.members, ministeringSortDirection, ministeringSortKey]
  );

  const sortedInstituteOpportunities = useMemo(
    () =>
      seminaryInstituteOpportunity
        .filter((row) => row.track === "Institute")
        .sort((left, right) => compareValues(left[opportunitySortKey], right[opportunitySortKey], opportunitySortDirection)),
    [opportunitySortDirection, opportunitySortKey, seminaryInstituteOpportunity]
  );

  const sortedHouseholds = useMemo(
    () => [...householdOutreach.households].sort((left, right) => compareValues(left[householdSortKey], right[householdSortKey], householdSortDirection)),
    [householdOutreach.households, householdSortDirection, householdSortKey]
  );

  const sortedProgression = useMemo(
    () => [...covenantPathProgression].sort((left, right) => compareValues(left[progressionSortKey], right[progressionSortKey], progressionSortDirection)),
    [covenantPathProgression, progressionSortDirection, progressionSortKey]
  );

  const toggleSort = <T extends string>(
    key: T,
    sortKey: T,
    setSortKey: (value: T) => void,
    setDirection: (value: SortDirection | ((current: SortDirection) => SortDirection)) => void
  ) => {
    if (key === sortKey) {
      setDirection((value) => (value === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection("asc");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Temple And Covenants</h2>
          <p className="text-sm text-slate-600">Temple status, expiration risk, and covenant progression belong together because they describe the same recommend and ordinance stewardship.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <article id="recommend-expiration-risk-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Recommend Expiration Risk</h2>
            </header>
            <div className="max-h-[30rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "expirationDate", label: "Expiration" },
                      { key: "daysUntilExpiration", label: "Days" },
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "templeRecommendStatus", label: "Status" }
                    ].map((column) => {
                      const key = column.key as
                        | "expirationDate"
                        | "daysUntilExpiration"
                        | "unitName"
                        | "fullName"
                        | "templeRecommendStatus";
                      const active = expirationSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, expirationSortKey, setExpirationSortKey, setExpirationSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (expirationSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedExpirationRisk.map((row) => (
                    <tr key={`${row.lcrMemberId}-${row.expirationDate ?? "none"}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.expirationDate ?? "-"}</td>
                      <td className="px-4 py-3">{row.daysUntilExpiration ?? "-"}</td>
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.templeRecommendStatus ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <section id="temple-recommend-list" className="grid gap-6">
            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h2 className="text-lg font-semibold">Temple Recommend Attention List</h2>
              </header>
              <div className="max-h-[30rem] overflow-auto">
                <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      {[
                        { key: "unitName", label: "Unit" },
                        { key: "fullName", label: "Member" },
                        { key: "age", label: "Age" },
                        { key: "templeRecommendStatus", label: "Recommend Status" }
                      ].map((column) => {
                        const key = column.key as "unitName" | "fullName" | "age" | "templeRecommendStatus";
                        const active = recommendSortKey === key;
                        return (
                          <th key={column.key} className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleSort(key, recommendSortKey, setRecommendSortKey, setRecommendSortDirection)}
                              className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                            >
                              <span>{column.label}</span>
                              <span aria-hidden="true">{active ? (recommendSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedRecommendAttention.map((row) => (
                      <tr key={row.lcrMemberId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{row.unitName}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                        </td>
                        <td className="px-4 py-3">{row.age ?? "-"}</td>
                        <td className="px-4 py-3">{row.templeRecommendStatus ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h2 className="text-lg font-semibold">Recommend Reactivated After 1+ Year</h2>
                <p className="text-xs text-slate-600">
                  {templeRecommendHealth.trackingSince
                    ? `Tracking since ${new Date(templeRecommendHealth.trackingSince).toLocaleDateString()} (${templeRecommendHealth.daysTracked} days).`
                    : "No status history captured yet."}
                </p>
              </header>
              <div className="max-h-[30rem] overflow-auto">
                <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      {[
                        { key: "unitName", label: "Unit" },
                        { key: "fullName", label: "Member" },
                        { key: "inactiveDays", label: "Inactive Days" },
                        { key: "reactivatedAt", label: "Reactivated" }
                      ].map((column) => {
                        const key = column.key as "unitName" | "fullName" | "inactiveDays" | "reactivatedAt";
                        const active = recoverySortKey === key;
                        return (
                          <th key={column.key} className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleSort(key, recoverySortKey, setRecoverySortKey, setRecoverySortDirection)}
                              className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                            >
                              <span>{column.label}</span>
                              <span aria-hidden="true">{active ? (recoverySortDirection === "asc" ? "▲" : "▼") : ""}</span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedRecoveries.map((row) => (
                      <tr key={`${row.lcrMemberId}-${row.reactivatedAt}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{row.unitName}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                        </td>
                        <td className="px-4 py-3">{row.inactiveDays}</td>
                        <td className="px-4 py-3">{row.reactivatedAt}</td>
                      </tr>
                    ))}
                    {sortedRecoveries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No long-lapse recommend reactivations recorded yet. This fills as status history accumulates each sync.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </section>

        <section id="covenant-path-progression-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Covenant Path Progression</h2>
            <p className="text-xs text-slate-600">Leadership buckets show ordinance, temple, service, youth formation, and family ordinance progress.</p>
          </header>
          <div className="max-h-[36rem] overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  {[
                    { key: "attentionScore", label: "Attention" },
                    { key: "recentMilestoneDate", label: "Latest Milestone" },
                    { key: "overallFocus", label: "Focus" },
                    { key: "unitName", label: "Unit" },
                    { key: "fullName", label: "Member" },
                    { key: "age", label: "Age" }
                  ].map((column) => {
                    const key = column.key as "attentionScore" | "recentMilestoneDate" | "overallFocus" | "unitName" | "fullName" | "age";
                    const active = progressionSortKey === key;
                    return (
                      <th key={column.key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort(key, progressionSortKey, setProgressionSortKey, setProgressionSortDirection)}
                          className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">{active ? (progressionSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3">Buckets</th>
                  <th className="px-4 py-3">Milestones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProgression.map((row) => (
                  <tr key={row.lcrMemberId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{row.attentionScore}</td>
                    <td className="px-4 py-3">{row.recentMilestoneDate ?? "-"}</td>
                    <td className="px-4 py-3">{row.overallFocus}</td>
                    <td className="px-4 py-3">{row.unitName}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                    </td>
                    <td className="px-4 py-3">{row.age ?? "-"}</td>
                    <td className="px-4 py-3">
                      {[row.ordinanceBucket, row.templeBucket, row.serviceBucket, row.youthBucket, row.familyBucket].filter(Boolean).join(" | ") || "-"}
                    </td>
                    <td className="px-4 py-3">{row.milestones.join(" | ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Youth And Formation</h2>
          <p className="text-sm text-slate-600">Seminary and institute participation, plus the institute follow-up list, should stay together because they support the same formation discussion.</p>
        </div>

        <section id="seminary-institute-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Seminary/Institute Participation by Unit</h2>
          </header>
          <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                {[
                  { key: "unitName", label: "Unit" },
                  { key: "seminaryEligible", label: "Seminary Eligible" },
                  { key: "seminaryAttending", label: "Seminary Attending" },
                  { key: "seminaryParticipationPct", label: "Seminary %" },
                  { key: "instituteEligible", label: "Institute Eligible" },
                  { key: "instituteAttending", label: "Institute Attending" },
                  { key: "instituteParticipationPct", label: "Institute %" }
                ].map((column) => {
                  const key = column.key as keyof SeminaryInstituteByUnitRow;
                  const active = seminarySortKey === key;
                  return (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort(key, seminarySortKey, setSeminarySortKey, setSeminarySortDirection)}
                        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">{active ? (seminarySortDirection === "asc" ? "▲" : "▼") : ""}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSeminary.map((row) => (
                <tr key={row.unitName} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.unitName}</td>
                  <td className="px-4 py-3">{row.seminaryEligible}</td>
                  <td className="px-4 py-3">{row.seminaryAttending}</td>
                  <td className="px-4 py-3">{row.seminaryParticipationPct}%</td>
                  <td className="px-4 py-3">{row.instituteEligible}</td>
                  <td className="px-4 py-3">{row.instituteAttending}</td>
                  <td className="px-4 py-3">{row.instituteParticipationPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="seminary-institute-opportunity-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Institute Opportunity List</h2>
            <p className="text-xs text-slate-600">Institute-age members not currently marked as attending.</p>
          </header>
          <div className="max-h-[32rem] overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  {[
                    { key: "unitName", label: "Unit" },
                    { key: "fullName", label: "Member" },
                    { key: "age", label: "Age" },
                    { key: "potentialFlag", label: "Potential" }
                  ].map((column) => {
                    const key = column.key as "unitName" | "fullName" | "age" | "potentialFlag";
                    const active = opportunitySortKey === key;
                    return (
                      <th key={column.key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort(key, opportunitySortKey, setOpportunitySortKey, setOpportunitySortDirection)}
                          className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">{active ? (opportunitySortDirection === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedInstituteOpportunities.map((row) => (
                  <tr key={`${row.lcrMemberId}-${row.track}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{row.unitName}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                    </td>
                    <td className="px-4 py-3">{row.age ?? "-"}</td>
                    <td className="px-4 py-3">{boolLabel(row.potentialFlag)}</td>
                    <td className="px-4 py-3">{row.statusText ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ministering And Household Care</h2>
          <p className="text-sm text-slate-600">These lists are immediate pastoral follow-up queues: move-ins, missing ministering coverage, and households that need contact.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Recent Move-Ins (12 months)</h2>
            </header>
            <div className="max-h-[20rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "moveInDate", label: "Date" },
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "contact", label: "Contact" }
                    ].map((column) => {
                      const key = column.key as "moveInDate" | "unitName" | "fullName" | "contact";
                      const active = moveSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, moveSortKey, setMoveSortKey, setMoveSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (moveSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedMoveIns.map((row, index) => (
                    <tr key={`${row.fullName}-${index}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.moveInDate ?? "-"}</td>
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.phoneNumber ?? row.email ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <section id="ministering-gap-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Ministering Gap List</h2>
            </header>
            <div className="max-h-[36rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "gapCategory", label: "Gap" },
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "age", label: "Age" },
                      { key: "hasMinisteringBrothers", label: "Brothers" },
                      { key: "hasMinisteringSisters", label: "Sisters" }
                    ].map((column) => {
                      const key = column.key as
                        | "gapCategory"
                        | "unitName"
                        | "fullName"
                        | "age"
                        | "hasMinisteringBrothers"
                        | "hasMinisteringSisters";
                      const active = ministeringSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, ministeringSortKey, setMinisteringSortKey, setMinisteringSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (ministeringSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedMinisteringGaps.map((row) => (
                    <tr key={`${row.lcrMemberId}-${row.gapCategory}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.gapCategory}</td>
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.age ?? "-"}</td>
                      <td className="px-4 py-3">{boolLabel(row.hasMinisteringBrothers)}</td>
                      <td className="px-4 py-3">{boolLabel(row.hasMinisteringSisters)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section id="household-outreach-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Household Outreach Opportunities</h2>
          </header>
          <div className="max-h-[36rem] overflow-auto">
            <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  {[
                    { key: "unitName", label: "Unit" },
                    { key: "householdName", label: "Household" },
                    { key: "memberCount", label: "Members" },
                    { key: "youthCount", label: "Youth / YSA" },
                    { key: "recentBaptismCount", label: "Recent Baptisms" },
                    { key: "recommendRiskCount", label: "Recommend Risk" },
                    { key: "ministeringGapCount", label: "Ministering Gaps" }
                  ].map((column) => {
                    const key = column.key as
                      | "unitName"
                      | "householdName"
                      | "memberCount"
                      | "youthCount"
                      | "recentBaptismCount"
                      | "recommendRiskCount"
                      | "ministeringGapCount";
                    const active = householdSortKey === key;
                    return (
                      <th key={column.key} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSort(key, householdSortKey, setHouseholdSortKey, setHouseholdSortDirection)}
                          className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                        >
                          <span>{column.label}</span>
                          <span aria-hidden="true">{active ? (householdSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3">Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedHouseholds.map((row) => (
                  <tr key={row.householdId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{row.unitName}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.householdName}</td>
                    <td className="px-4 py-3">{row.memberCount}</td>
                    <td className="px-4 py-3">{row.youthCount}</td>
                    <td className="px-4 py-3">{row.recentBaptismCount}</td>
                    <td className="px-4 py-3">{row.recommendRiskCount}</td>
                    <td className="px-4 py-3">{row.ministeringGapCount}</td>
                    <td className="px-4 py-3">{row.focusAreas.join(" | ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Growth And Leadership</h2>
          <p className="text-sm text-slate-600">Unit-level health, baptisms, leadership tenure, strengthening, and priesthood progression are the broader leadership review lists.</p>
        </div>

        <section id="unit-health-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold">Unit Health</h2>
          </header>
          <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                {[
                  { key: "unitName", label: "Unit" },
                  { key: "memberCount", label: "Members" },
                  { key: "currentCallings", label: "Current Callings" },
                  { key: "leadershipCallings", label: "Leadership Callings" },
                  { key: "seminaryAttending", label: "Seminary" },
                  { key: "instituteAttending", label: "Institute" },
                  { key: "convertsLast12Months", label: "Converts (12m)" }
                ].map((column) => {
                  const key = column.key as keyof UnitHealthRow;
                  const active = unitSortKey === key;
                  return (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort(key, unitSortKey, setUnitSortKey, setUnitSortDirection)}
                        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true">{active ? (unitSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedUnitHealth.map((row) => (
                <tr key={row.unitName} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.unitName}</td>
                  <td className="px-4 py-3">{row.memberCount}</td>
                  <td className="px-4 py-3">{row.currentCallings}</td>
                  <td className="px-4 py-3">{row.leadershipCallings}</td>
                  <td className="px-4 py-3">{row.seminaryAttending}</td>
                  <td className="px-4 py-3">{row.instituteAttending}</td>
                  <td className="px-4 py-3">{row.convertsLast12Months}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Leadership Tenure</h2>
            </header>
            <div className="max-h-[20rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "callingTitle", label: "Calling" },
                      { key: "yearsInCalling", label: "Years" }
                    ].map((column) => {
                      const key = column.key as "unitName" | "fullName" | "callingTitle" | "yearsInCalling";
                      const active = tenureSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, tenureSortKey, setTenureSortKey, setTenureSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (tenureSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedLeadershipTenure.map((row, index) => (
                    <tr key={`${row.fullName}-${index}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.callingTitle}</td>
                      <td className="px-4 py-3">{row.yearsInCalling}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article id="recent-baptisms-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Recent Baptisms</h2>
            </header>
            <div className="max-h-[30rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "baptismDate", label: "Baptism Date" },
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "age", label: "Age" }
                    ].map((column) => {
                      const key = column.key as "baptismDate" | "unitName" | "fullName" | "age";
                      const active = baptismSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, baptismSortKey, setBaptismSortKey, setBaptismSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (baptismSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedBaptisms.map((row) => (
                    <tr key={`${row.lcrMemberId}-${row.baptismDate ?? "baptism"}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.baptismDate ?? "-"}</td>
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.age ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <section id="new-returning-strengthening" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">New/Returning Member Strengthening</h2>
            </header>
            <div className="max-h-[36rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "focusCategory", label: "Category" },
                      { key: "focusDate", label: "Date" },
                      { key: "templeRecommendStatus", label: "Recommend" },
                      { key: "hasCurrentCalling", label: "Has Calling" },
                      { key: "ministeringAssigned", label: "Ministering" },
                      { key: "recoveredAfterLongLapse", label: "Recovered 1y+" },
                      { key: "inactiveDays", label: "Inactive Days" }
                    ].map((column) => {
                      const key = column.key as
                        | "unitName"
                        | "fullName"
                        | "focusCategory"
                        | "focusDate"
                        | "templeRecommendStatus"
                        | "hasCurrentCalling"
                        | "ministeringAssigned"
                        | "recoveredAfterLongLapse"
                        | "inactiveDays";
                      const active = strengthSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, strengthSortKey, setStrengthSortKey, setStrengthSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (strengthSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStrengthening.map((row) => (
                    <tr key={`${row.lcrMemberId}-${row.focusCategory}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.focusCategory}</td>
                      <td className="px-4 py-3">{row.focusDate ?? "-"}</td>
                      <td className="px-4 py-3">{row.templeRecommendStatus ?? "-"}</td>
                      <td className="px-4 py-3">{row.hasCurrentCalling ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{row.ministeringAssigned ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{row.recoveredAfterLongLapse ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{row.inactiveDays ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="priesthood-progression-list" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold">Priesthood Progression Candidates</h2>
            </header>
            <div className="max-h-[36rem] overflow-auto">
              <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      { key: "unitName", label: "Unit" },
                      { key: "fullName", label: "Member" },
                      { key: "age", label: "Age" },
                      { key: "currentOffice", label: "Current Office" },
                      { key: "recommendedNextOffice", label: "Recommended" }
                    ].map((column) => {
                      const key = column.key as "unitName" | "fullName" | "age" | "currentOffice" | "recommendedNextOffice";
                      const active = priesthoodSortKey === key;
                      return (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleSort(key, priesthoodSortKey, setPriesthoodSortKey, setPriesthoodSortDirection)}
                            className="inline-flex items-center gap-1 text-left hover:text-slate-900"
                          >
                            <span>{column.label}</span>
                            <span aria-hidden="true">{active ? (priesthoodSortDirection === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPriesthood.map((row) => (
                    <tr key={`${row.lcrMemberId}-${row.recommendedNextOffice}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.unitName}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <MemberNameLink lcrMemberId={row.lcrMemberId} fullName={row.fullName} />
                      </td>
                      <td className="px-4 py-3">{row.age ?? "-"}</td>
                      <td className="px-4 py-3">{row.currentOffice ?? "-"}</td>
                      <td className="px-4 py-3">{row.recommendedNextOffice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </section>
    </div>
  );
}
