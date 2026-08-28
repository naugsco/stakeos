import AdmZip from "adm-zip";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDesktopConfigDir } from "@/src/config/desktopConfig";
import { parseCsv } from "@/src/transit/csv";
import type { TransitConfig } from "@/src/transit/config";

/**
 * Static GTFS is the half of the feed that changes weekly rather than every
 * few seconds: which stops exist, what they are called, and which route each
 * trip belongs to. The real-time feed only carries ids, so a departure board
 * needs this bundle to turn `route_id=6636` into "19 Metrotown Station".
 *
 * The bundle is downloaded once, reduced to the three files we need, and
 * cached on disk. `stop_times.txt` is deliberately not loaded — it is by far
 * the largest file in the bundle and the real-time feed already carries
 * absolute arrival/departure timestamps.
 */

export interface TransitStop {
  /** GTFS `stop_id` — the value the real-time feed references. */
  stopId: string;
  /** GTFS `stop_code` — the number printed on the bus stop pole. */
  stopCode: string;
  name: string;
  lat: number;
  lon: number;
}

/** `[route_id, trip_headsign, direction_id]`, kept as a tuple to keep the cache file small. */
export type TripSummary = [string, string, string];

export interface RouteSummary {
  shortName: string;
  longName: string;
}

export interface StaticCatalog {
  fetchedAt: string;
  sourceUrl: string;
  stops: TransitStop[];
  routes: Record<string, RouteSummary>;
  trips: Record<string, TripSummary>;
}

const CACHE_VERSION = 1;

export const getTransitCacheDir = () => path.join(getDesktopConfigDir(), "transit-cache");

export const getStaticCatalogPath = () =>
  path.join(getTransitCacheDir(), `translink-static-v${CACHE_VERSION}.json`);

/** Great-circle distance in metres. */
export const haversineMeters = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
) => {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
};

const readZipEntry = (zip: AdmZip, fileName: string) => {
  // Some bundles nest the .txt files inside a folder, so match on basename.
  const entry = zip
    .getEntries()
    .find((candidate) => path.basename(candidate.entryName).toLowerCase() === fileName);
  return entry ? entry.getData().toString("utf8") : null;
};

export const buildCatalogFromZip = (buffer: Buffer, sourceUrl: string): StaticCatalog => {
  const zip = new AdmZip(buffer);

  const stopsCsv = readZipEntry(zip, "stops.txt");
  const routesCsv = readZipEntry(zip, "routes.txt");
  const tripsCsv = readZipEntry(zip, "trips.txt");

  if (!stopsCsv || !routesCsv) {
    throw new Error("GTFS bundle is missing stops.txt or routes.txt");
  }

  const stops: TransitStop[] = [];
  for (const row of parseCsv(stopsCsv)) {
    const lat = Number.parseFloat(row.stop_lat);
    const lon = Number.parseFloat(row.stop_lon);
    if (!row.stop_id || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }
    stops.push({
      stopId: row.stop_id,
      stopCode: row.stop_code || row.stop_id,
      name: row.stop_name || row.stop_id,
      lat,
      lon
    });
  }

  const routes: Record<string, RouteSummary> = {};
  for (const row of parseCsv(routesCsv)) {
    if (!row.route_id) {
      continue;
    }
    routes[row.route_id] = {
      shortName: row.route_short_name || row.route_id,
      longName: row.route_long_name || ""
    };
  }

  // trips.txt is optional: without it the board still works, it just falls back
  // to the route long name instead of the trip headsign.
  const trips: Record<string, TripSummary> = {};
  if (tripsCsv) {
    for (const row of parseCsv(tripsCsv)) {
      if (!row.trip_id) {
        continue;
      }
      trips[row.trip_id] = [row.route_id ?? "", row.trip_headsign ?? "", row.direction_id ?? ""];
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    sourceUrl,
    stops,
    routes,
    trips
  };
};

const downloadCatalog = async (config: TransitConfig): Promise<StaticCatalog> => {
  const failures: string[] = [];

  for (const url of config.staticFeedUrls) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) {
        failures.push(`${url} -> HTTP ${response.status}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return buildCatalogFromZip(buffer, url);
    } catch (error) {
      failures.push(`${url} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Could not download the TransLink static GTFS bundle. Tried:\n  ${failures.join("\n  ")}\n` +
      "Set TRANSLINK_GTFS_STATIC_URL to the current link from " +
      "https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data"
  );
};

const readCachedCatalog = (): StaticCatalog | null => {
  const cachePath = getStaticCatalogPath();
  if (!existsSync(cachePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(cachePath, "utf8")) as StaticCatalog;
  } catch {
    return null;
  }
};

const writeCachedCatalog = (catalog: StaticCatalog) => {
  mkdirSync(getTransitCacheDir(), { recursive: true });
  writeFileSync(getStaticCatalogPath(), JSON.stringify(catalog), "utf8");
};

const ageInHours = (isoTimestamp: string) => {
  const fetchedAt = Date.parse(isoTimestamp);
  if (!Number.isFinite(fetchedAt)) {
    return Number.POSITIVE_INFINITY;
  }
  return (Date.now() - fetchedAt) / (1000 * 60 * 60);
};

// Parsing the bundle costs a second or two, so hold it for the life of the
// process rather than re-reading it on every dashboard poll.
let memoizedCatalog: StaticCatalog | null = null;

export const clearStaticCatalogMemo = () => {
  memoizedCatalog = null;
};

export const loadStaticCatalog = async (
  config: TransitConfig,
  options: { forceRefresh?: boolean } = {}
): Promise<StaticCatalog> => {
  if (!options.forceRefresh && memoizedCatalog && ageInHours(memoizedCatalog.fetchedAt) < config.staticMaxAgeHours) {
    return memoizedCatalog;
  }

  if (!options.forceRefresh) {
    const cached = readCachedCatalog();
    if (cached && ageInHours(cached.fetchedAt) < config.staticMaxAgeHours) {
      memoizedCatalog = cached;
      return cached;
    }
  }

  try {
    const downloaded = await downloadCatalog(config);
    writeCachedCatalog(downloaded);
    memoizedCatalog = downloaded;
    return downloaded;
  } catch (error) {
    // A stale bundle still names stops and routes correctly for the vast
    // majority of trips, so prefer it over failing the whole board.
    const cached = memoizedCatalog ?? readCachedCatalog();
    if (cached) {
      memoizedCatalog = cached;
      return cached;
    }
    throw error;
  }
};

export const findStopsNear = (
  catalog: StaticCatalog,
  center: { lat: number; lon: number },
  radiusMeters: number
): TransitStop[] =>
  catalog.stops
    .map((stop) => ({ stop, distance: haversineMeters(center, stop) }))
    .filter((entry) => entry.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.stop);

/**
 * Resolves the stops the board should watch: an explicit
 * `TRANSLINK_STOP_CODES` list when configured (matched against either the pole
 * number or the GTFS id), otherwise everything within the configured radius of
 * the configured intersection.
 */
export const resolveStops = (catalog: StaticCatalog, config: TransitConfig): TransitStop[] => {
  if (config.stopCodes.length === 0) {
    return findStopsNear(catalog, config.center, config.radiusMeters);
  }

  const wanted = new Set(config.stopCodes.map((code) => code.trim()));
  return catalog.stops.filter((stop) => wanted.has(stop.stopCode) || wanted.has(stop.stopId));
};
