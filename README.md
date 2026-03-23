# StakeOS

StakeOS is a private local AI assistant system for stake leadership, built around LCR browser automation and a local leadership intelligence database.

For a first-time public installation walkthrough, start with [StakeOS Installation Guide](./FIRST_TIME_SETUP.md).

## Stack

- Node.js + TypeScript
- Playwright (LCR browser automation)
- PostgreSQL
- Next.js + Tailwind + Recharts (dashboard)
- MCP server for Claude Desktop
- node-cron automations
- Nodemailer email delivery
- dotenv configuration

## Services

1. Directory Sync Engine
- Playwright automation for LCR directory data extraction.
- Manual login flow (no credential capture/storage in StakeOS).
- Nightly full directory sync + hourly calling sync.

2. Leadership Intelligence Database
- PostgreSQL schema for leadership/member intelligence.
- Tables: `members`, `households`, `callings`, `units`, `organizations`, `priesthood`, `emails`, `phone_numbers`, `meeting_assignments`, `sync_logs`.

3. MCP Server for Claude
- Local MCP tools powered only by PostgreSQL data.
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
  - calling vacancies
  - mission eligibility
  - youth progression
  - recent convert growth

## Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `.env` values:
- `DATABASE_URL`
- `SMTP_*` values (for email tools/automation)
- `STAKE_*` metadata and report recipients

### 3. Create schema

```bash
npm run db:migrate
```

### 4. First sync (manual login)

```bash
npm run sync:full
```

What happens:
- Playwright opens Chromium.
- You manually log in to LCR.
- StakeOS navigates to `LCR_DIRECTORY_URL` (defaults to your custom report URL), waits for report rows to fully load, then stores normalized records in PostgreSQL.

## Running StakeOS

### Dashboard

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

### Scheduler (automations + recurring sync)

```bash
npm run scheduler
```

Scheduled tasks:
- Nightly full directory sync (`1:30 AM`)
- Hourly calling sync (`HH:05`)
- Weekly stake presidency report
- Weekly stake council newsletter
- Youth advancement report
- Mission readiness report

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

## Useful Commands

```bash
npm run typecheck
npm run lint
npm run sync:full
npm run sync:callings
npm run scheduler
npm run mcp:dev
npm run mcp:build
npm run mcp:start
```

## Project Structure

- `src/sync/*` - Playwright sync engine + normalization + persistence
- `src/db/*` - PostgreSQL schema and migration
- `src/services/*` - intelligence, reports, email, WhatsApp data services
- `src/mcp/server.ts` - MCP server/tool definitions
- `src/scheduler/*` - node-cron automation jobs
- `app/*` + `components/*` - Next.js dashboard UI
