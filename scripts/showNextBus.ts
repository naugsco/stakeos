import "dotenv/config";
import { loadTransitConfig } from "@/src/transit/config";
import { loadStaticCatalog, findStopsNear, haversineMeters, resolveStops } from "@/src/transit/gtfsStatic";
import { fetchTripUpdates } from "@/src/transit/gtfsRealtime";
import { buildDepartureBoard } from "@/src/transit/nextBus";

/**
 * Terminal view of the same board the /bus page shows.
 *
 *   npm run bus:next            next departures
 *   npm run bus:next -- --stops list nearby stops (no API key needed)
 *   npm run bus:next -- --refresh  re-download the static GTFS bundle first
 */

const args = new Set(process.argv.slice(2));
const config = loadTransitConfig();

const main = async () => {
  const catalog = await loadStaticCatalog(config, { forceRefresh: args.has("--refresh") });

  if (args.has("--stops")) {
    const radius = Math.max(config.radiusMeters, 500);
    const stops = findStopsNear(catalog, config.center, radius);
    console.log(`Stops within ${radius} m of ${config.center.lat}, ${config.center.lon}:\n`);
    for (const stop of stops) {
      const distance = Math.round(haversineMeters(config.center, stop));
      console.log(`  #${stop.stopCode.padEnd(7)} ${String(distance).padStart(4)} m  ${stop.name}`);
    }
    return;
  }

  const stops = resolveStops(catalog, config);
  const feed = await fetchTripUpdates(config);
  const board = buildDepartureBoard({ catalog, feed, stops, config });

  console.log(`Watching ${board.stops.length} stop(s):`);
  for (const stop of board.stops) {
    console.log(`  #${stop.stopCode} ${stop.name} (${stop.distanceMeters} m)`);
  }
  console.log("");

  if (board.departures.length === 0) {
    console.log("  no predicted departures");
  }

  for (const departure of board.departures) {
    const when = new Date(departure.departureTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
    const minutes = departure.minutesAway === 0 ? "due" : `${departure.minutesAway} min`;
    console.log(
      `  ${departure.routeShortName.padEnd(4)} ${departure.headsign.padEnd(28).slice(0, 28)} ` +
        `${minutes.padStart(7)}  ${when}  #${departure.stopCode}`
    );
  }

  for (const warning of board.warnings) {
    console.log(`\n  note: ${warning}`);
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
