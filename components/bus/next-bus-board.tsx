"use client";

import { useCallback, useEffect, useState } from "react";
import type { Departure, DepartureBoard } from "@/src/transit/nextBus";

const REFRESH_MS = 30_000;

interface BoardError {
  error: string;
  needsApiKey?: boolean;
}

const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const formatCountdown = (minutes: number) => (minutes <= 0 ? "Due" : `${minutes}`);

/** Turns a GTFS delay in seconds into a short, human phrase. */
const describeDelay = (delaySeconds: number | null) => {
  if (delaySeconds === null) {
    return null;
  }

  const minutes = Math.round(delaySeconds / 60);

  if (minutes === 0) {
    return { label: "On time", tone: "on-time" as const };
  }

  return minutes > 0
    ? { label: `${minutes} min late`, tone: "late" as const }
    : { label: `${Math.abs(minutes)} min early`, tone: "early" as const };
};

const delayToneClasses = {
  "on-time": "border-teal-200 bg-teal-50 text-teal-800",
  late: "border-amber-300 bg-amber-50 text-amber-900",
  early: "border-sky-200 bg-sky-50 text-sky-800"
};

function DepartureRow({ departure }: { departure: Departure }) {
  const delay = describeDelay(departure.delaySeconds);

  return (
    <li className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
      <span className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-card bg-teal-700 px-2 text-lg font-semibold text-white">
        {departure.routeShortName}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">
          {departure.headsign || departure.routeLongName || "Destination unavailable"}
        </p>
        <p className="truncate text-xs text-slate-500">
          {departure.stopName} · #{departure.stopCode}
          {departure.vehicleLabel ? ` · bus ${departure.vehicleLabel}` : ""}
          {departure.usesDepartureTime ? "" : " · arrival estimate"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-3xl font-semibold leading-none text-slate-900">
          {formatCountdown(departure.minutesAway)}
          {departure.minutesAway > 0 ? (
            <span className="ml-1 text-xs font-medium uppercase tracking-wide text-slate-500">min</span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-slate-500">{formatClock(departure.departureTime)}</p>
        {delay ? (
          <span
            className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${delayToneClasses[delay.tone]}`}
          >
            {delay.label}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function SetupHelp() {
  return (
    <div className="rounded-panel border border-line bg-panel-warm p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">One-time setup</h2>
      <p className="mt-2 text-sm text-slate-600">
        Real-time bus predictions come from TransLink&apos;s GTFS-Realtime feed, which needs a free
        developer key.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>
          Register at{" "}
          <a href="https://developer.translink.ca" rel="noreferrer" target="_blank">
            developer.translink.ca
          </a>{" "}
          and copy your API key.
        </li>
        <li>
          Add <code className="rounded bg-white/70 px-1 py-0.5 text-xs">TRANSLINK_API_KEY=your-key</code> to
          your <code className="rounded bg-white/70 px-1 py-0.5 text-xs">.env</code> file.
        </li>
        <li>Restart StakeOS and reload this page.</li>
      </ol>
    </div>
  );
}

export function NextBusBoard() {
  const [board, setBoard] = useState<DepartureBoard | null>(null);
  const [error, setError] = useState<BoardError | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bus/next", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload as BoardError);
        setBoard(null);
      } else {
        setBoard(payload as DepartureBoard);
        setError(null);
      }
    } catch (fetchError) {
      setError({
        error: fetchError instanceof Error ? fetchError.message : "Could not reach the StakeOS server."
      });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const stopSummary = board?.stops.map((stop) => stop.name).join(" · ");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Next Bus</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {stopSummary || "W Georgia St @ Cardero St, Vancouver"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {lastUpdated ? (
            <span className="text-slate-500">Updated {formatClock(lastUpdated.toISOString())}</span>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error?.needsApiKey ? <SetupHelp /> : null}

      {error && !error.needsApiKey ? (
        <div className="rounded-panel border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          {error.error}
        </div>
      ) : null}

      {board ? (
        <>
          <div className="overflow-hidden rounded-panel border border-line bg-panel-warm shadow-sm">
            {board.departures.length > 0 ? (
              <ul>
                {board.departures.map((departure) => (
                  <DepartureRow
                    key={`${departure.tripId}-${departure.stopId}-${departure.departureTime}`}
                    departure={departure}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-600">
                No buses predicted at these stops right now.
              </p>
            )}
          </div>

          {board.warnings.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-500">
              {board.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          ) : null}

          <footer className="rounded-panel border border-line bg-panel p-5 text-xs text-slate-500 shadow-sm">
            <p className="font-semibold uppercase tracking-wide text-slate-600">Watching</p>
            <ul className="mt-2 space-y-1">
              {board.stops.map((stop) => (
                <li key={stop.stopId}>
                  #{stop.stopCode} — {stop.name} ({stop.distanceMeters} m)
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Predictions from the TransLink GTFS-Realtime feed
              {board.feedTimestamp ? `, published ${formatClock(board.feedTimestamp)}` : ""}. Stop and
              route names from the static GTFS bundle downloaded{" "}
              {new Date(board.staticFeedFetchedAt).toLocaleDateString()}.
            </p>
          </footer>
        </>
      ) : null}

      {!board && !error && loading ? (
        <div className="rounded-panel border border-line bg-panel-warm p-8 text-center text-sm text-slate-600 shadow-sm">
          Loading departures…
        </div>
      ) : null}
    </div>
  );
}
