import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import type { TransitConfig } from "@/src/transit/config";

/**
 * Thin wrapper around the GTFS-realtime TripUpdates feed.
 *
 * The feed is protobuf, so it is decoded and then flattened into plain JSON
 * with 64-bit timestamps widened to numbers. Everything downstream works on
 * these plain shapes, which keeps the board logic testable without a network
 * call or a protobuf runtime.
 */

/** Mirrors `transit_realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship`. */
export const SCHEDULE_RELATIONSHIP_SKIPPED = 1;

export interface StopTimeEvent {
  time?: number;
  delay?: number;
}

export interface StopTimeUpdate {
  stopId?: string;
  stopSequence?: number;
  scheduleRelationship?: number;
  arrival?: StopTimeEvent;
  departure?: StopTimeEvent;
}

export interface TripUpdate {
  trip?: { tripId?: string; routeId?: string; directionId?: number };
  vehicle?: { id?: string; label?: string };
  delay?: number;
  stopTimeUpdate?: StopTimeUpdate[];
}

export interface RealtimeFeed {
  /** Feed publication time, in seconds since the epoch. */
  timestamp: number | null;
  tripUpdates: TripUpdate[];
}

export const decodeTripUpdatesFeed = (buffer: Buffer | Uint8Array): RealtimeFeed => {
  const { transit_realtime: transitRealtime } = GtfsRealtimeBindings;
  const message = transitRealtime.FeedMessage.decode(
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  );
  const feed = transitRealtime.FeedMessage.toObject(message, {
    longs: Number,
    enums: Number,
    defaults: false
  }) as {
    header?: { timestamp?: number };
    entity?: Array<{ tripUpdate?: TripUpdate }>;
  };

  return {
    timestamp: typeof feed.header?.timestamp === "number" ? feed.header.timestamp : null,
    tripUpdates: (feed.entity ?? [])
      .map((entity) => entity.tripUpdate)
      .filter((update): update is TripUpdate => Boolean(update))
  };
};

export class TransitApiKeyMissingError extends Error {
  constructor() {
    super(
      "TRANSLINK_API_KEY is not set. Register a free key at https://developer.translink.ca " +
        "and add it to your .env file."
    );
    this.name = "TransitApiKeyMissingError";
  }
}

export const fetchTripUpdates = async (config: TransitConfig): Promise<RealtimeFeed> => {
  if (!config.apiKey) {
    throw new TransitApiKeyMissingError();
  }

  const url = new URL(config.tripUpdatesUrl);
  url.searchParams.set("apikey", config.apiKey);

  const response = await fetch(url, { cache: "no-store" });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `TransLink rejected the API key (HTTP ${response.status}). Check TRANSLINK_API_KEY at https://developer.translink.ca`
    );
  }

  if (!response.ok) {
    throw new Error(`TransLink real-time feed returned HTTP ${response.status}`);
  }

  return decodeTripUpdatesFeed(Buffer.from(await response.arrayBuffer()));
};
