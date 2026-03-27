# StakeOS Developer Setup

This guide is for developers running StakeOS from source.

If you are a normal user installing the app, use [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md) instead.

## Source Install

```bash
brew install node
git clone <YOUR_GITHUB_REPO_URL>
cd stakeos
npm install
npm run desktop:start
```

Then complete setup inside StakeOS Desktop:

1. paste the stake's `LCR_DIRECTORY_URL`
2. install Chromium from the in-app setup flow if needed
3. run the first full sync
4. log in to LCR manually

## `.env`

The packaged desktop app does not require `.env`.

For source development, `.env` is still supported as a developer fallback.

Copy the template:

```bash
cp .env.example .env
```

Useful development values:

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

- `LCR_DIRECTORY_URL` is the one value that really matters for first setup
- `PLAYWRIGHT_HEADLESS=false` is recommended while developing sync flows
- `SMTP_*` values are optional

## Common Commands

```bash
npm run desktop:start
npm run build
npm run typecheck
npm run sqlite:init
npm run sqlite:sync
npm run sqlite:callings
npm run mcp:build
npm run mcp:start
```

## Docs

- End-user install: [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)
- LCR report creation: [LCR_REPORT_SETUP.md](./LCR_REPORT_SETUP.md)
- Desktop release build: [DESKTOP_RELEASE.md](./DESKTOP_RELEASE.md)
- GitHub release publish flow: [GITHUB_RELEASE_CHECKLIST.md](./GITHUB_RELEASE_CHECKLIST.md)
