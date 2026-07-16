"use client";

import { useState } from "react";
import { ContactMethodsInline, EmailListInline } from "@/components/contact-links";
import type { TrainingFollowUpStateRecord } from "@/lib/dashboardData";

type TrainingGroupRow = {
  lcrMemberId: string;
  fullName: string;
  unitName: string;
  callingTitle: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  sustainedOn: string | null;
  setApartOn: string | null;
  recentDateLabel: "Sustained" | "Set Apart";
  recentDate: string;
  daysAgo: number;
  pendingSetApart: boolean;
  trainerGroup: "stake_presidency" | "high_council" | "stake_rs" | "stake_yw" | "stake_primary" | "stake_ss";
  trainerGroupLabel: string;
};

type TrainingGroup = {
  groupKey: string;
  label: string;
  recipients: string[];
  rows: TrainingGroupRow[];
  subject: string;
  notifyHref: string;
  signature: string;
};

type TrainingFollowUpPanelProps = {
  groups: TrainingGroup[];
  pendingSetApartCount: number;
  initialState: Record<string, TrainingFollowUpStateRecord>;
};

type GroupStatus = {
  label: string;
  tone: "slate" | "sky" | "amber" | "emerald";
  detail: string;
};

const formatLeadershipDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const formatDaysAgo = (daysAgo: number, label: "Sustained" | "Set Apart") =>
  daysAgo === 0 ? `${label} today` : `${label} ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;

const formatTimestamp = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : null;

const statusClasses: Record<GroupStatus["tone"], string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  sky: "bg-sky-100 text-sky-800 ring-sky-200",
  amber: "bg-amber-100 text-amber-900 ring-amber-200",
  emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200"
};

const getGroupStatus = (group: TrainingGroup, state: TrainingFollowUpStateRecord | undefined): GroupStatus => {
  if (state?.lastSentAt && state.lastSentSignature === group.signature) {
    return {
      label: "Sent",
      tone: "emerald",
      detail: `Confirmed sent ${formatTimestamp(state.lastSentAt)}.`
    };
  }

  if (state?.lastDraftAt && state.lastDraftSignature === group.signature) {
    const sentReference = state.lastSentAt ? ` Last confirmed send was ${formatTimestamp(state.lastSentAt)}.` : "";
    return {
      label: "Draft opened",
      tone: "sky",
      detail: `Draft opened ${formatTimestamp(state.lastDraftAt)}. This queue still needs a send confirmation.${sentReference}`
    };
  }

  if (state?.lastSentAt) {
    return {
      label: "Needs resend",
      tone: "amber",
      detail: `Last confirmed sent ${formatTimestamp(state.lastSentAt)}. The queue changed after that send.`
    };
  }

  if (state?.lastDraftAt) {
    return {
      label: "Draft outdated",
      tone: "amber",
      detail: `An older draft was opened ${formatTimestamp(state.lastDraftAt)}. Open a fresh draft for the current queue.`
    };
  }

  return {
    label: "Not sent",
    tone: "slate",
    detail: "No draft or send confirmation has been recorded for this queue yet."
  };
};

export function TrainingFollowUpPanel({ groups, pendingSetApartCount, initialState }: TrainingFollowUpPanelProps) {
  const [stateByGroup, setStateByGroup] = useState(initialState);
  const [busyGroupKey, setBusyGroupKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateGroupState = async (action: "drafted" | "sent", group: TrainingGroup) => {
    setBusyGroupKey(group.groupKey);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/stake-overview/training-follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          groupKey: group.groupKey,
          groupLabel: group.label,
          signature: group.signature,
          subject: group.subject
        })
      });

      if (!response.ok) {
        throw new Error("Unable to save follow-up status.");
      }

      const payload = await response.json() as { state: TrainingFollowUpStateRecord };
      setStateByGroup((current) => ({
        ...current,
        [group.groupKey]: payload.state
      }));
    } catch {
      setErrorMessage("Unable to save follow-up status right now.");
    } finally {
      setBusyGroupKey(null);
    }
  };

  return (
    <div className="rounded-panel border border-slate-200 bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_42%,#f7fbff_100%)] p-5 shadow-sm ring-1 ring-amber-100/70">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="max-w-3xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">Training Group Follow-Up</h3>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              {pendingSetApartCount} recent calling{pendingSetApartCount === 1 ? " is" : "s are"} not yet set apart
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Draft the email, then explicitly mark it sent. Once the queue changes, the card flips back to a resend state so you can see where follow-up is still open.
          </p>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => {
          const state = stateByGroup[group.groupKey];
          const status = getGroupStatus(group, state);
          const pendingRows = group.rows.filter((row) => row.pendingSetApart).length;
          const isBusy = busyGroupKey === group.groupKey;

          return (
            <article key={group.groupKey} className="overflow-hidden rounded-panel border border-slate-200 bg-white shadow-[0_18px_55px_-35px_rgba(15,23,42,0.35)]">
              <header className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-slate-900">{group.label}</h4>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClasses[status.tone]}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {group.rows.length} recent calling{group.rows.length === 1 ? "" : "s"} in this queue.
                      {" "}
                      {group.recipients.length > 0
                        ? `${group.recipients.length} trainer recipient${group.recipients.length === 1 ? "" : "s"} will be prefilled.`
                        : "No trainer recipients are configured, so the draft opens blank."}
                    </p>
                    <p className="text-xs leading-5 text-slate-500">{status.detail}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={group.notifyHref}
                      onClick={() => {
                        void updateGroupState("drafted", group);
                      }}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900"
                    >
                      Draft Email
                    </a>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        void updateGroupState("sent", group);
                      }}
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? "Saving..." : "Mark Sent"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recipients</p>
                    <div className="mt-2 text-sm text-slate-700">
                      {group.recipients.length > 0 ? <EmailListInline emails={group.recipients} /> : "No recipients configured."}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-panel-warm px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Queue</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{group.rows.length}</p>
                      <p className="text-xs text-slate-500">current follow-up items</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{pendingRows}</p>
                      <p className="text-xs text-slate-500">not yet set apart</p>
                    </div>
                  </div>
                </div>
              </header>

              <div className="max-h-[24rem] overflow-auto">
                <table className="sticky-pane min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Leader</th>
                      <th className="px-5 py-3">Unit</th>
                      <th className="px-5 py-3">Calling</th>
                      <th className="px-5 py-3">Sustained</th>
                      <th className="px-5 py-3">Set Apart</th>
                      <th className="px-5 py-3">How Long Ago</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.rows.map((row) => (
                      <tr key={`${row.trainerGroup}-${row.unitName}-${row.callingTitle}-${row.lcrMemberId}`} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-5 py-3 text-slate-700">{row.unitName}</td>
                        <td className="px-5 py-3 text-slate-700">{row.callingTitle}</td>
                        <td className="px-5 py-3 text-slate-700">{formatLeadershipDate(row.sustainedOn)}</td>
                        <td className="px-5 py-3 text-slate-700">{formatLeadershipDate(row.setApartOn)}</td>
                        <td className="px-5 py-3 text-slate-700">{formatDaysAgo(row.daysAgo, row.recentDateLabel)}</td>
                        <td className="px-5 py-3 text-slate-700"><ContactMethodsInline email={row.primaryEmail} phone={row.primaryPhone} /></td>
                        <td className="px-5 py-3">
                          {row.pendingSetApart ? (
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              Sustained, not set apart
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              {row.recentDateLabel}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
