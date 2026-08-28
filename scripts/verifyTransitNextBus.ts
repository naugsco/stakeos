import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { parseCsv } from "@/src/transit/csv";
import { loadTransitConfig, CARDERO_WEST_GEORGIA } from "@/src/transit/config";
import {
  buildCatalogFromZip,
  haversineMeters,
  resolveStops,
  type StaticCatalog
} from "@/src/transit/gtfsStatic";
import { decodeTripUpdatesFeed } from "@/src/transit/gtfsRealtime";
import { buildDepartureBoard } from "@/src/transit/nextBus";

/**
 * Offline checks for the transit board. Everything here runs against a
 * synthetic GTFS bundle and a synthetic protobuf feed, so the suite needs no
 * API key and no network.
 */

const NOW = new Date("2026-08-28T22:00:00Z");
const nowSeconds = Math.floor(NOW.getTime() / 1000);

const baseConfig = loadTransitConfig({} as NodeJS.ProcessEnv);

// Two stops at the intersection, one three blocks east (outside the radius).
const stopsCsv = [
  "stop_id,stop_code,stop_name,stop_lat,stop_lon",
  '51474,51474,"Westbound W Georgia St @ Cardero St",49.29115,-123.13505',
  '60645,60645,"Eastbound W Georgia St @ Cardero St",49.29105,-123.13495',
  '99999,99999,"Westbound W Georgia St @ Bute St",49.28850,-123.12800'
].join("\n");

const routesCsv = [
  "route_id,route_short_name,route_long_name",
  "6636,19,Metrotown Station/Stanley Park",
  "6702,250,Horseshoe Bay/Dundarave/Vancouver"
].join("\n");

const tripsCsv = [
  "route_id,trip_id,trip_headsign,direction_id",
  "6636,trip-19-a,Stanley Park,0",
  "6702,trip-250-a,Horseshoe Bay,0",
  "6702,trip-250-b,Vancouver,1"
].join("\n");

const buildZip = () => {
  const zip = new AdmZip();
  zip.addFile("stops.txt", Buffer.from(stopsCsv, "utf8"));
  zip.addFile("routes.txt", Buffer.from(routesCsv, "utf8"));
  zip.addFile("gtfs/trips.txt", Buffer.from(tripsCsv, "utf8"));
  return zip.toBuffer();
};

const encodeFeed = (entities: unknown[]) => {
  const { transit_realtime: transitRealtime } = GtfsRealtimeBindings;
  const message = transitRealtime.FeedMessage.create({
    header: { gtfsRealtimeVersion: "2.0", timestamp: nowSeconds },
    entity: entities as never
  });
  return Buffer.from(transitRealtime.FeedMessage.encode(message).finish());
};

// --- CSV -------------------------------------------------------------------

const quoted = parseCsv('﻿a,b\r\n1,"has, comma"\r\n2,"say ""hi"""\r\n\r\n');
assert.deepEqual(quoted, [
  { a: "1", b: "has, comma" },
  { a: "2", b: 'say "hi"' }
]);

// --- Distance --------------------------------------------------------------

// Cardero to Bute along W Georgia is roughly 600 m.
const carderoToBute = haversineMeters(CARDERO_WEST_GEORGIA, { lat: 49.2885, lon: -123.128 });
assert.ok(carderoToBute > 450 && carderoToBute < 800, `unexpected distance: ${carderoToBute}`);

// --- Static catalog --------------------------------------------------------

const catalog: StaticCatalog = buildCatalogFromZip(buildZip(), "test://bundle.zip");
assert.equal(catalog.stops.length, 3);
assert.equal(catalog.routes["6636"].shortName, "19");
// trips.txt was nested in a folder and must still be found.
assert.deepEqual(catalog.trips["trip-250-a"], ["6702", "Horseshoe Bay", "0"]);

const nearbyStops = resolveStops(catalog, baseConfig);
assert.deepEqual(
  nearbyStops.map((stop) => stop.stopCode).sort(),
  ["51474", "60645"],
  "radius search should find both Cardero platforms and exclude Bute"
);

const byCode = resolveStops(catalog, { ...baseConfig, stopCodes: ["60645"] });
assert.deepEqual(byCode.map((stop) => stop.stopId), ["60645"]);

// --- Realtime decode + board ----------------------------------------------

const feedBuffer = encodeFeed([
  {
    id: "1",
    tripUpdate: {
      trip: { tripId: "trip-250-a", routeId: "6702" },
      vehicle: { id: "v1", label: "18012" },
      stopTimeUpdate: [
        { stopId: "51474", departure: { time: nowSeconds + 8 * 60, delay: 90 } },
        { stopId: "99999", departure: { time: nowSeconds + 12 * 60 } }
      ]
    }
  },
  {
    id: "2",
    tripUpdate: {
      trip: { tripId: "trip-19-a", routeId: "6636" },
      // Arrival-only update: the board should fall back to it.
      stopTimeUpdate: [{ stopId: "51474", arrival: { time: nowSeconds + 3 * 60 } }]
    }
  },
  {
    id: "3",
    tripUpdate: {
      trip: { tripId: "trip-250-b", routeId: "6702" },
      stopTimeUpdate: [
        // Skipped stop, already-departed bus, and one beyond the horizon.
        { stopId: "60645", scheduleRelationship: 1, departure: { time: nowSeconds + 60 } },
        { stopId: "60645", departure: { time: nowSeconds - 15 * 60 } },
        { stopId: "60645", departure: { time: nowSeconds + 10 * 60 * 60 } },
        // Schedule-relative only: no absolute prediction to show.
        { stopId: "60645", departure: { delay: 45 } }
      ]
    }
  }
]);

const feed = decodeTripUpdatesFeed(feedBuffer);
assert.equal(feed.timestamp, nowSeconds);
assert.equal(feed.tripUpdates.length, 3);

const board = buildDepartureBoard({
  catalog,
  feed,
  stops: nearbyStops,
  config: baseConfig,
  now: NOW
});

assert.deepEqual(
  board.departures.map((departure) => [departure.routeShortName, departure.minutesAway]),
  [
    ["19", 3],
    ["250", 8]
  ],
  "board should be sorted by time and exclude stops outside the watched set"
);

const [nineteen, twoFifty] = board.departures;
assert.equal(nineteen.headsign, "Stanley Park");
assert.equal(nineteen.usesDepartureTime, false, "arrival-only update should be flagged");
assert.equal(twoFifty.headsign, "Horseshoe Bay");
assert.equal(twoFifty.delaySeconds, 90);
assert.equal(twoFifty.vehicleLabel, "18012");
assert.equal(twoFifty.stopCode, "51474");
assert.ok(
  board.warnings.some((warning) => warning.includes("schedule delay")),
  "schedule-relative updates should be reported"
);

const filtered = buildDepartureBoard({
  catalog,
  feed,
  stops: nearbyStops,
  config: { ...baseConfig, routeFilter: ["19"] },
  now: NOW
});
assert.deepEqual(filtered.departures.map((departure) => departure.routeShortName), ["19"]);

const capped = buildDepartureBoard({
  catalog,
  feed,
  stops: nearbyStops,
  config: { ...baseConfig, maxDepartures: 1 },
  now: NOW
});
assert.equal(capped.departures.length, 1);

const empty = buildDepartureBoard({
  catalog,
  feed: { timestamp: nowSeconds, tripUpdates: [] },
  stops: nearbyStops,
  config: baseConfig,
  now: NOW
});
assert.ok(empty.warnings.some((warning) => warning.includes("No real-time departures")));

console.log("transit next-bus checks passed");
