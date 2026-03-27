# StakeOS

StakeOS is a private local desktop and MCP system for stake leadership. It syncs LCR data through a user-controlled Playwright browser session, stores the result locally in SQLite, and exposes that data through the dashboard and optional Claude Desktop MCP tools.

## Download The App

Most users should **not** clone this repository.

Install StakeOS from GitHub Releases:

- [Download StakeOS Desktop](https://github.com/naugsco/stakeos/releases)

Normal install path:

1. open the GitHub Releases page
2. download the latest `.dmg`
3. drag `StakeOS Desktop.app` into `Applications`
4. open the app
5. paste the stake's LCR custom report URL
6. run the first sync

Use the `.zip` only if the `.dmg` does not work for you.

## Start Here

- Normal users installing StakeOS Desktop: [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)
- Creating the LCR custom report: [LCR_REPORT_SETUP.md](./LCR_REPORT_SETUP.md)
- Developers running StakeOS from source: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)
- Maintainers building the desktop app: [DESKTOP_RELEASE.md](./DESKTOP_RELEASE.md)
- Maintainers publishing a GitHub release: [GITHUB_RELEASE_CHECKLIST.md](./GITHUB_RELEASE_CHECKLIST.md)

## Stack

- Node.js + TypeScript
- Playwright (LCR browser automation)
- SQLite (better-sqlite3)
- Next.js + Tailwind + Recharts (dashboard)
- MCP server for Claude Desktop
- Nodemailer email delivery (optional MCP/email workflows)
- dotenv configuration

## Services

1. Directory Sync Engine
- Playwright automation for LCR directory data extraction.
- Manual login flow (no credential capture/storage in StakeOS).
- Manual full directory sync + manual calling sync.

2. Leadership Intelligence Database
- SQLite database for leadership/member intelligence.

3. MCP Server for Claude
- Local MCP tools powered by local data.
- Tools:
  - `get_calling_members`
  - `get_spouse`
  - `years_in_calling`
  - `generate_report`
  - `send_calling_email`
  - `create_whatsapp_invite_list`
  - `mission_eligible_members`
  - `priesthood_advancement_candidates`
  - `endowment_candidates`
  - `query_member_attribute` (query any custom-report field, including values in `profile_data`)

4. Web Dashboard
- Next.js pages:
  - `/dashboard`
  - `/members`
  - `/callings`
  - `/reports`
  - `/youth`
  - `/stake-overview`
- Charts include:
  - leadership turnover
  - calling coverage
  - mission eligibility
  - youth progression
  - recent convert growth

## Source Setup

If you are developing StakeOS from source, use [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md).

## Running StakeOS

### Desktop Shell

```bash
npm run desktop:start
```

What it does:
- builds StakeOS if needed
- starts a local desktop-only StakeOS server on port `3232`
- opens StakeOS in an Electron app window instead of the browser

### Desktop Release

Validation build:

```bash
npm run desktop:pack
```

Release zip:

```bash
npm run desktop:release
```

Release artifacts are written to `release/` and now include:
- `.zip`
- `.dmg`

If Apple signing/notarization credentials are configured, the same release command can notarize the macOS build. See [DESKTOP_RELEASE.md](./DESKTOP_RELEASE.md).
For a clean publish flow, use [GITHUB_RELEASE_CHECKLIST.md](./GITHUB_RELEASE_CHECKLIST.md).

If you distribute unsigned macOS builds through GitHub, users may need to:
- right-click the app and choose `Open`
- or use `System Settings > Privacy & Security > Open Anyway`

### Dashboard

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

### Build everything

```bash
npm run build
```

## MCP Server for Claude Desktop

### Build MCP server

```bash
npm run mcp:build
```

### Start MCP server manually

```bash
npm run mcp:start
```

### Claude Desktop configuration

Preferred path:
- in StakeOS Desktop, open `Settings`
- go to the `Claude Desktop MCP` section
- use `Enable StakeOS MCP In Claude Desktop`
- then fully restart Claude Desktop

Manual fallback:

On macOS, edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "stakeos": {
      "command": "node",
      "args": ["/absolute/path/to/stakeos/dist/server.cjs"]
    }
  }
}
```

Example:

```json
{
  "mcpServers": {
    "stakeos": {
      "command": "node",
      "args": ["/Users/yourname/path/to/stakeos/dist/server.cjs"]
    }
  }
}
```

Then restart Claude Desktop.

## Important Security Constraint

- StakeOS does not request, capture, or persist LCR credentials.
- Authentication is manual in the browser window you control.
- Playwright user data stores browser session state only in `PLAYWRIGHT_USER_DATA_DIR`.

## Typical User Path

1. Download the DMG from GitHub Releases
2. Install `StakeOS Desktop.app`
3. Paste the LCR custom report URL
4. Let StakeOS install Chromium if needed
5. Run the first full sync and log in to LCR manually
6. Use the dashboard
7. Optionally enable Claude Desktop MCP from StakeOS Settings

## Useful Commands

```bash
npm run typecheck
npm run lint
npm run sqlite:sync
npm run sqlite:callings
npm run mcp:build
npm run mcp:start
npm run desktop:start
npm run desktop:pack
npm run desktop:release
```

## Project Structure

- `src/sync/*` - Playwright sync engine + normalization + persistence
- `src/sqlite/*` - SQLite database, schema, sync, and queries
- `src/services/*` - intelligence, reports, email, WhatsApp data services
- `src/mcp/server.ts` - MCP server/tool definitions
- `app/*` + `components/*` - Next.js dashboard UI
