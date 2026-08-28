import type { TransitConfig } from "@/src/transit/config";
import { loadTransitConfig } from "@/src/transit/config";
import {
  haversineMeters,
  loadStaticCatalog,
  resolveStops,
  type StaticCatalog,
  type TransitStop
} from "@/src/transit/gtfsStatic";
import {
  fetchTripUpdates,
  SCHEDULE_RELATIONSHIP_SKIPPED,
  type RealtimeFeed
} from "@/src/transit/gtfsRealtime";

/**
 * Joins the real-time TripUpdates feed against the static catalog to answer
 * one question: which buses are next at these stops, and in how many minutes.
 */

export interface Departure {
  tripId: string | null;
  routeId: string | null;
  routeShortName: string;
  routeLongName: string;
  headsign: string;
  stopId: string;
  stopCode: string;
  stopName: string;
  /** Predicted departure (or arrival, when the feed omits departure). */
  departureTime: string;
  minutesAway: number;
  /** Seconds behind schedule; negative means running early. */
  delaySeconds: number | null;
  vehicleLabel: string | null;
  /** False when the feed only offered an arrival time for this stop. */
  usesDepartureTime: boolean;
}

export interface BoardStop {
  stopId: string;
  stopCode: string;
  name: string;
  distanceMeters: number;
}

export interface DepartureBoard {
  generatedAt: string;
  feedTimestamp: string | null;
  staticFeedFetchedAt: string;
  staticFeedSourceUrl: string;
  center: { lat: number; lon: number };
  stops: BoardStop[];
  departures: Departure[];
  warnings: string[];
}

const toIso = (epochSeconds: number) => new Date(epochSeconds * 1000).toISOString();

/**
 * Builds the board from already-fetched inputs. Kept free of IO so it can be
 * exercised against a synthetic feed in `scripts/verifyTransitNextBus.ts`.
 */
export const buildDepartureBoard = ({
  catalog,
  feed,
  stops,
  config,
  now = new Date()
}: {
  catalog: StaticCatalog;
  feed: RealtimeFeed;
  stops: TransitStop[];
  config: TransitConfig;
  now?: Date;
}): DepartureBoard => {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const horizonSeconds = nowSeconds + config.horizonMinutes * 60;
  // A bus that left in the last minute is still worth showing: the prediction
  // and the passenger's watch are rarely in perfect agreement.
  const floorSeconds = nowSeconds - 60;

  const stopsById = new Map(stops.map((stop) => [stop.stopId, stop]));
  const routeFilter = new Set(config.routeFilter.map((route) => route.toUpperCase()));
  const warnings: string[] = [];
  const departures: Departure[] = [];
  const seen = new Set<string>();

  let scheduleRelativeUpdates = 0;

  for (const update of feed.tripUpdates) {
    const tripId = update.trip?.tripId ?? null;
    const tripSummary = tripId ? catalog.trips[tripId] : undefined;
    const routeId = update.trip?.routeId || tripSummary?.[0] || null;
    const route = routeId ? catalog.routes[routeId] : undefined;
    const routeShortName = route?.shortName ?? routeId ?? "?";

    if (routeFilter.size > 0 && !routeFilter.has(routeShortName.toUpperCase())) {
      continue;
    }

    for (const stopTime of update.stopTimeUpdate ?? []) {
      if (!stopTime.stopId) {
        continue;
      }

      const stop = stopsById.get(stopTime.stopId);
      if (!stop) {
        continue;
      }

      if (stopTime.scheduleRelationship === SCHEDULE_RELATIONSHIP_SKIPPED) {
        continue;
      }

      const usesDepartureTime = typeof stopTime.departure?.time === "number";
      const time = stopTime.departure?.time ?? stopTime.arrival?.time;

      if (typeof time !== "number") {
        // Some producers send a delay against the published timetable instead
        // of an absolute prediction; resolving those needs stop_times.txt.
        scheduleRelativeUpdates += 1;
        continue;
      }

      if (time < floorSeconds || time > horizonSeconds) {
        continue;
      }

      const key = `${tripId ?? "?"}|${stop.stopId}|${time}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const delaySeconds =
        stopTime.departure?.delay ?? stopTime.arrival?.delay ?? update.delay ?? null;

      departures.push({
        tripId,
        routeId,
        routeShortName,
        routeLongName: route?.longName ?? "",
        headsign: tripSummary?.[1] || route?.longName || "",
        stopId: stop.stopId,
        stopCode: stop.stopCode,
        stopName: stop.name,
        departureTime: toIso(time),
        minutesAway: Math.max(0, Math.round((time - nowSeconds) / 60)),
        delaySeconds: typeof delaySeconds === "number" ? delaySeconds : null,
        vehicleLabel: update.vehicle?.label ?? update.vehicle?.id ?? null,
        usesDepartureTime
      });
    }
  }

  departures.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  if (stops.length === 0) {
    warnings.push(
      config.stopCodes.length > 0
        ? `None of the configured stop codes (${config.stopCodes.join(", ")}) exist in the current GTFS bundle.`
        : `No stops found within ${config.radiusMeters} m of ${config.center.lat}, ${config.center.lon}. Widen TRANSLINK_STOP_RADIUS_M.`
    );
  } else if (departures.length === 0) {
    warnings.push(
      `No real-time departures in the next ${config.horizonMinutes} minutes. Outside service hours the feed carries no predictions for these stops.`
    );
  }

  if (scheduleRelativeUpdates > 0) {
    warnings.push(
      `${scheduleRelativeUpdates} update(s) carried only a schedule delay rather than a predicted time and were skipped.`
    );
  }

  return {
    generatedAt: now.toISOString(),
    feedTimestamp: feed.timestamp === null ? null : toIso(feed.timestamp),
    staticFeedFetchedAt: catalog.fetchedAt,
    staticFeedSourceUrl: catalog.sourceUrl,
    center: config.center,
    stops: stops.map((stop) => ({
      stopId: stop.stopId,
      stopCode: stop.stopCode,
      name: stop.name,
      distanceMeters: Math.round(haversineMeters(config.center, stop))
    })),
    departures: departures.slice(0, config.maxDepartures),
    warnings
  };
};

/** Fetches both feeds and returns the board. */
export const getDepartureBoard = async (
  config: TransitConfig = loadTransitConfig()
): Promise<DepartureBoard> => {
  const catalog = await loadStaticCatalog(config);
  const stops = resolveStops(catalog, config);
  const feed = await fetchTripUpdates(config);
  return buildDepartureBoard({ catalog, feed, stops, config });
};
