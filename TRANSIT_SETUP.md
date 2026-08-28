# Next Bus Board Setup

StakeOS can show live TransLink departures for a nearby intersection at `/bus`.
It ships pointed at **W Georgia St @ Cardero St** in Vancouver's West End.

## Does this data exist?

Yes. TransLink publishes two open feeds:

| Feed | What it is | Key required |
| --- | --- | --- |
| [GTFS Static](https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data) | Weekly bundle of stops, routes, trips and timetables | No |
| [GTFS-Realtime](https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-realtime) | Live trip updates, vehicle positions, service alerts | Yes |

The older JSON "RTTI" API that most Vancouver next-bus tutorials use was
**retired on 3 December 2024**. GTFS-Realtime is its replacement, and it is the
feed this board reads.

## Setup

1. Register a free developer account at
   [developer.translink.ca](https://developer.translink.ca) and copy your API key.
2. Add it to `.env`:

   ```
   TRANSLINK_API_KEY=your-key-here
   ```

3. Confirm the stops the board will watch:

   ```
   npm run bus:next -- --stops
   ```

   This downloads the static bundle (no key needed) and lists every stop near the
   configured coordinates with its pole number. Cross-check against the number
   printed on the physical stop.

4. Show the live board:

   ```
   npm run bus:next
   ```

   Or open `/bus` in the dashboard, which polls every 30 seconds.

## Configuration

All optional; see `.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `TRANSLINK_API_KEY` | — | Required for live predictions |
| `TRANSLINK_STOP_LAT` / `TRANSLINK_STOP_LON` | `49.2911` / `-123.1350` | Centre of the search, W Georgia @ Cardero |
| `TRANSLINK_STOP_RADIUS_M` | `250` | Search radius around that centre |
| `TRANSLINK_STOP_CODES` | — | Pin exact stop numbers instead of searching by radius |
| `TRANSLINK_ROUTES` | — | Only show these route numbers, e.g. `19,250` |
| `TRANSLINK_HORIZON_MINUTES` | `90` | How far ahead to look |
| `TRANSLINK_MAX_DEPARTURES` | `12` | Rows on the board |
| `TRANSLINK_GTFS_STATIC_URL` | tries three known URLs | Pin the static bundle link |
| `TRANSLINK_STATIC_MAX_AGE_HOURS` | `168` | How long the cached bundle is reused |

The default coordinates are an interpolation of the intersection rather than a
surveyed point, so `--stops` is the authoritative check: it prints real GTFS
coordinates and distances. If the wrong stops come back, either widen the radius
or set `TRANSLINK_STOP_CODES`.

## How it works

- The static bundle is downloaded once, reduced to `stops.txt`, `routes.txt` and
  `trips.txt`, and cached under the StakeOS support directory
  (`transit-cache/`). It refreshes weekly, and a stale copy is preferred over an
  error if the download fails.
- Each poll fetches the GTFS-Realtime **TripUpdates** feed, decodes the
  protobuf, and keeps stop-time updates whose `stop_id` matches a watched stop.
- Route numbers and headsigns come from the static bundle; predicted times,
  delays and vehicle numbers come from the live feed.

## Limitations

- **Real-time only.** Predictions come from the live feed, so outside service
  hours the board is empty rather than falling back to the printed timetable.
  A schedule fallback would mean parsing `stop_times.txt`, the largest file in
  the bundle, on every lookup.
- Updates that carry only a delay against the timetable (no absolute predicted
  time) are skipped and reported in the board's warnings.
- SkyTrain, SeaBus and West Coast Express are not covered by the bus real-time
  feed.

## Tests

```
npm run test:transit
```

Runs offline against a synthetic GTFS bundle and a synthetic protobuf feed —
no API key, no network.
