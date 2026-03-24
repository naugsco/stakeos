# SQLite Spike

This branch is an experimental parallel SQLite path. It does not replace the main PostgreSQL app flow.

## What This Spike Proves

- SQLite can initialize locally without PostgreSQL.
- StakeOS can persist a fresh LCR full-sync snapshot into SQLite.
- A real in-app dashboard-style page can render from SQLite-backed data.

## What Is Included

- SQLite schema init
- SQLite full-sync persistence for:
  - units
  - members
  - callings
  - sync logs
- experimental page:
  - `/sqlite-spike`
- summary charts/cards on that page for:
  - total members
  - current callings
  - recommend active
  - mission readiness
  - recent baptisms
  - temple recommend health
  - recommend expiration risk
  - seminary/institute participation by unit
  - ministering coverage by unit

## What Is Not Included Yet

- full report parity with PostgreSQL
- member detail pages backed by SQLite
- committees, reports, youth, stake overview, or MCP backed by SQLite
- calling-only sync path for SQLite
- migration/import from the current PostgreSQL database
- packaging updates for the SQLite path

## Commands

Initialize the SQLite spike database:

```bash
npm run sqlite:spike:init
```

Run a fresh LCR full sync into SQLite:

```bash
npm run sqlite:spike:sync
```

Open the experimental page in the app:

```text
/sqlite-spike
```

## Database Location

Default path:

```text
~/Library/Application Support/StakeOS/sqlite-spike/stakeos-spike.db
```

Optional override:

```env
SQLITE_SPIKE_DB_PATH=/absolute/path/to/stakeos-spike.db
```
