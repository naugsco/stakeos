# StakeOS Installation Guide

This guide is written for a first-time macOS setup.

StakeOS runs locally and uses:
- SQLite for local data
- Playwright for LCR browser automation
- Claude Desktop only if you want optional MCP access

If you want to build the packaged desktop app after setup is working, use [DESKTOP_RELEASE.md](./DESKTOP_RELEASE.md).
If you are the maintainer publishing a GitHub release, use [GITHUB_RELEASE_CHECKLIST.md](./GITHUB_RELEASE_CHECKLIST.md).

## What You Will End Up With

By the end of this guide, you will have:
- a local SQLite database at `~/Library/Application Support/StakeOS/stakeos.db`
- a working first LCR sync
- the StakeOS dashboard available locally
- optional Claude Desktop MCP access if you enable it

If you install StakeOS from an unsigned GitHub desktop release instead of running from source, macOS may ask you to:
- right-click the app and choose `Open`
- or allow it in `System Settings > Privacy & Security`

## Recommended Setup

For most users, this is the best setup:
- Homebrew
- Node.js LTS

## Prerequisites

You should have:
- a Mac
- Terminal access
- permission to log in to LCR manually
- an LCR custom report URL configured for your stake

StakeOS does **not** capture or store your LCR credentials.

## Quickstart

If you already know your way around Terminal, this is the shortest correct path:

```bash
brew install node
git clone <YOUR_GITHUB_REPO_URL>
cd stakeos
npm install
npx playwright install chromium
cp .env.example .env
npm run sqlite:init
npm run sqlite:sync
npm run desktop:start
```

If you want the full walkthrough, continue below.

## 1. Install Homebrew

Check whether Homebrew is installed:

```bash
brew --version
```

If you see `command not found`, install Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the Homebrew instructions shown in Terminal to add `brew` to your shell.

Verify:

```bash
brew --version
```

## 2. Install Node.js

Install Node.js:

```bash
brew install node
```

Verify:

```bash
node -v
npm -v
```

## 3. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd stakeos
```

If you already have the repo locally, just change into it:

```bash
cd /path/to/stakeos
```

## 4. Install App Dependencies

Install Node packages:

```bash
npm install
```

Install the Playwright browser used for LCR sync:

```bash
npx playwright install chromium
```

## 5. Create and Configure `.env`

Copy the template:

```bash
cp .env.example .env
```

Then edit `.env`.

Minimum required values:

```env
NODE_ENV=development
PLAYWRIGHT_USER_DATA_DIR=.playwright/profile
PLAYWRIGHT_HEADLESS=false
LCR_DIRECTORY_URL=https://lcr.churchofjesuschrist.org/mlt/report/create-a-report/custom-reports-details/YOUR-REPORT-ID
LCR_TIMEOUT_MS=180000
STAKE_NAME=Your Stake Name
UNIT_NUMBER=000000
```

Notes:
- `PLAYWRIGHT_HEADLESS=false` is recommended for first sync so you can log in manually.
- `LCR_DIRECTORY_URL` should be your stake's LCR custom report URL.
- `SMTP_*` settings are not required for normal desktop use.

## 6. LCR Custom Report Specification

StakeOS expects the LCR custom report to return **one row per person**.

### Important Rules

- **Column order does not matter**
- **Column names do matter**
- the report must remain person-based, not household-based
- if you rename headers in a way that LCR changes the visible column label, the scraper may stop recognizing them

StakeOS matches columns by header name, not by position.

### Minimum Required Columns

These should be present in every StakeOS LCR report:

- `Preferred Name`
- `Unit`
- `Individual E-mail`
- `Individual Phone`

At least one stable identity/contact combination is needed so StakeOS can continue matching rows reliably.

### Core Calling And Unit Columns

- `Callings`
- `Callings with Date Sustained and Set Apart`
- `Unit Abbreviation`

### Core Address And Household Columns

- `Address - Street 1`
- `Address - Street 2`
- `Address - City`
- `Address - State or Province`
- `Address - Postal Code`
- `Address - Country`
- `Head of House`
- `Household Position`

### Core Member Profile Columns

- `Age`
- `Gender`
- `Birth Date (1 Jan 1990)`
- `Birth Country`
- `Birthplace`
- `Move In Date`

### Core Ordinance And Temple Columns

- `Endowment Status`
- `Endowment Date`
- `Is Endowed`
- `Temple Recommend Status`
- `Temple Recommend Expiration Date`
- `Temple Recommend Type`
- `Baptism Date`
- `Confirmation Date`
- `Ordination Date`

### Core Mission And Priesthood Columns

- `Mission Language`
- `Mission Country`
- `Priesthood office`
- `Priesthood`
- `Is Returned Missionary`

### Core Seminary / Institute Columns

- `Institute Status`
- `Seminary Status`
- `Is Attending Seminary`
- `Is Attending Institute`
- `Potential Seminary Student`
- `Potential Institute Student`

### Core Ministering Columns

- `Has Ministering Sisters`
- `Has Ministering Brothers`
- `Ministering Sisters`
- `Ministering Brothers`

### Core Family And Sealing Columns

- `Spouse Name`
- `Marriage Date`
- `Marriage Status`
- `Is Married`
- `Is Single`
- `Is Divorced`
- `Is Widowed`
- `Has Children`
- `Is Sealed to Parents`
- `Is Sealed to a Spouse`
- `Is Sealed to Current Spouse`
- `Is Sealed to a Prior Spouse`
- `Sealing to Parents`
- `Sealing to Spouse`
- `Is Born in Covenant`

### Additional Supported Columns

These are also supported and useful if available:

- `Is Convert`
- `Is Accountable`

### Recommended Full Column Set

If you want the broadest StakeOS functionality, use this full set:

```text
Preferred Name
Individual Phone
Individual E-mail
Callings with Date Sustained and Set Apart
Unit
Unit Abbreviation
Address - Street 1
Address - Street 2
Address - City
Address - Postal Code
Age
Endowment Status
Gender
Mission Language
Priesthood office
Is Endowed
Is Widowed
Is Returned Missionary
Is Convert
Has Children
Is Sealed to Parents
Is Single
Is Sealed to a Spouse
Is Sealed to Current Spouse
Is Sealed to a Prior Spouse
Temple Recommend Status
Mission Country
Callings
Move In Date
Institute Status
Is Attending Seminary
Is Attending Institute
Has Ministering Sisters
Has Ministering Brothers
Birth Country
Birthplace
Confirmation Date
Baptism Date
Endowment Date
Is Accountable
Is Born in Covenant
Is Divorced
Is Married
Marriage Date
Marriage Status
Ministering Brothers
Ministering Sisters
Ordination Date
Potential Institute Student
Potential Seminary Student
Sealing to Parents
Sealing to Spouse
Seminary Status
Spouse Name
Temple Recommend Expiration Date
Temple Recommend Type
Birth Date (1 Jan 1990)
Address - State or Province
Priesthood
Head of House
Household Position
Address - Country
```

### Notes On Column Order

You do **not** need to preserve the exact order shown above.

StakeOS reads the report by column header name, so this works:
- adding new supported columns
- moving supported columns to a different position
- keeping optional columns empty

What will break the sync:
- removing required identity columns
- changing the report into something other than one row per person
- changing column labels so they no longer match the expected LCR headers

## 7. Initialize the Database

Run:

```bash
npm run sqlite:init
```

This creates the SQLite database and schema automatically.

If you are using StakeOS Desktop instead of the source workflow, the Settings page can also initialize the local store for you.

## 8. Run the First Full Sync

Run:

```bash
npm run sqlite:sync
```

What happens:
- Playwright opens Chromium
- you log in manually
- StakeOS opens your configured `LCR_DIRECTORY_URL`
- it waits for the report to finish loading
- it stores normalized data in local SQLite

Important:
- StakeOS does not ask for or store your password
- local session state is stored only in `PLAYWRIGHT_USER_DATA_DIR`

## 9. Run the Desktop App

Recommended:

```bash
npm run desktop:start
```

Developer/browser mode still exists if you need it:

```bash
npm run dev
```

Then open:

[http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## 10. Optional: Seed the Baseline for Sync Comparison

Run:

```bash
npm run sqlite:seed-baseline
```

Do this once after the first successful sync if you want exact sync-diff history.

This allows StakeOS to report exact changes between future syncs.

## 11. Build the MCP Server

Build it:

```bash
npm run mcp:build
```

Start it manually if needed:

```bash
npm run mcp:start
```

## 12. Connect StakeOS to Claude Desktop

Preferred desktop-app path:
- open `Settings` in StakeOS Desktop
- find `Claude Desktop MCP`
- click `Enable StakeOS MCP In Claude Desktop`
- then fully restart Claude Desktop

Manual fallback:

On macOS, edit:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add:

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
      "args": ["/Users/yourname/Code/stakeos/dist/server.cjs"]
    }
  }
}
```

Then fully restart Claude Desktop.

## How MCP Works in a Shared Repo

The StakeOS MCP server is already included in the repository.

That means a user who clones the repo does **not** need to build their own MCP server from scratch.

What the repo already provides:
- the MCP server code
- the StakeOS tool definitions
- the database query logic behind those tools
- the build scripts for the MCP server

What each user still must do locally:
- install dependencies
- configure their own `.env`
- build the MCP server with `npm run mcp:build`
- add their own local path to `dist/server.cjs` in Claude Desktop config

Important:
- the MCP server code is shared through Git
- the Claude Desktop connection to that MCP server is always local to each user's machine
- each user needs their own local database, LCR report URL, and Claude Desktop config entry

## 13. Useful Commands

Run the dashboard:

```bash
npm run dev
```

Run a full sync:

```bash
npm run sqlite:sync
```

Run a calling-only sync:

```bash
npm run sqlite:callings
```

Seed baseline snapshots:

```bash
npm run sqlite:seed-baseline
```

Build the MCP server:

```bash
npm run mcp:build
```

Typecheck the code:

```bash
npm run typecheck
```

## Troubleshooting

### Dashboard fails to start

Check:

```bash
cat .run/dashboard.log
```

Then also run:

```bash
npm run typecheck
```

### Full sync opens the browser but no data is imported

Common causes:
- `LCR_DIRECTORY_URL` is incorrect
- the LCR report columns changed
- the LCR page has not fully loaded yet
- you are not fully signed in

## Security Notes

Do not commit:
- `.env`
- `.playwright/profile`
- your SQLite database file
- exported member data
- browser session files

StakeOS is designed so that:
- LCR authentication is manual
- credentials are not captured by the application
- the database remains local unless you explicitly export or back it up
