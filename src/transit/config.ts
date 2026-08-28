/**
 * Configuration for the TransLink next-bus board.
 *
 * This module intentionally reads `process.env` directly instead of going
 * through `src/config/env.ts`. The transit board is an optional side panel: it
 * must not force a value into the strict StakeOS desktop config schema, and it
 * must keep working when LCR setup has never been run.
 */

/** W Georgia St @ Cardero St, Vancouver — the default board location. */
export const CARDERO_WEST_GEORGIA = {
  lat: 49.2911,
  lon: -123.135
};

/**
 * Candidate URLs for the weekly static GTFS bundle, tried in order.
 *
 * TransLink has moved this file between hosts over the years and publishes the
 * link on the GTFS Static Data page rather than as a documented API route, so
 * the loader falls through the list and reports which one answered. Set
 * `TRANSLINK_GTFS_STATIC_URL` to pin an exact URL.
 */
export const DEFAULT_STATIC_FEED_URLS = [
  "https://gtfs-static.translink.ca/gtfs/google_transit.zip",
  "https://gtfs.translink.ca/static/latest",
  "https://gtfs.translink.ca/gtfs/google_transit.zip"
];

export const DEFAULT_REALTIME_TRIP_UPDATES_URL = "https://gtfsapi.translink.ca/v3/gtfsrealtime";

export interface TransitConfig {
  /** TransLink developer API key. Real-time data is unavailable without one. */
  apiKey: string | null;
  /** Explicit stop numbers/ids. When empty, stops are found by proximity. */
  stopCodes: string[];
  center: { lat: number; lon: number };
  radiusMeters: number;
  /** Optional route short-name allowlist, e.g. ["19", "250"]. */
  routeFilter: string[];
  staticFeedUrls: string[];
  tripUpdatesUrl: string;
  /** How far ahead to look, in minutes. */
  horizonMinutes: number;
  maxDepartures: number;
  /** Age at which the cached static bundle is re-downloaded. */
  staticMaxAgeHours: number;
}

const readList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseFloat((value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const loadTransitConfig = (env: NodeJS.ProcessEnv = process.env): TransitConfig => {
  const apiKey = (env.TRANSLINK_API_KEY ?? "").trim();
  const staticUrl = (env.TRANSLINK_GTFS_STATIC_URL ?? "").trim();

  return {
    apiKey: apiKey.length > 0 ? apiKey : null,
    stopCodes: readList(env.TRANSLINK_STOP_CODES),
    center: {
      lat: readNumber(env.TRANSLINK_STOP_LAT, CARDERO_WEST_GEORGIA.lat),
      lon: readNumber(env.TRANSLINK_STOP_LON, CARDERO_WEST_GEORGIA.lon)
    },
    radiusMeters: readNumber(env.TRANSLINK_STOP_RADIUS_M, 250),
    routeFilter: readList(env.TRANSLINK_ROUTES),
    staticFeedUrls: staticUrl.length > 0 ? [staticUrl] : DEFAULT_STATIC_FEED_URLS,
    tripUpdatesUrl: (env.TRANSLINK_GTFS_RT_URL ?? "").trim() || DEFAULT_REALTIME_TRIP_UPDATES_URL,
    horizonMinutes: readNumber(env.TRANSLINK_HORIZON_MINUTES, 90),
    maxDepartures: readNumber(env.TRANSLINK_MAX_DEPARTURES, 12),
    staticMaxAgeHours: readNumber(env.TRANSLINK_STATIC_MAX_AGE_HOURS, 24 * 7)
  };
};
