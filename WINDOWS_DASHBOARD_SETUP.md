# StakeOS Dashboard From Source on Windows

This guide is for technical users who want to run the browser dashboard from the repository on Windows.

This is **not** the normal end-user install path.

If you want the packaged app, use the macOS desktop release from [GitHub Releases](https://github.com/naugsco/stakeos/releases).

## What This Path Is

This starts the StakeOS dashboard as a local web app and opens it in your browser.

It does **not** require Electron.
It does require:

- Node.js
- npm
- the repository source code

## Install Prerequisites

1. Install Node.js for Windows
2. Download or clone this repository
3. Open PowerShell in the repo folder

## First-Time Source Setup

```powershell
npm install
```

Then run the dashboard launcher:

```powershell
powershell -ExecutionPolicy Bypass -File ".\\scripts\\launchers\\Launch StakeOS Dashboard.ps1"
```

That script will:

1. install dependencies if needed
2. build the dashboard
3. start the local server on port `3000`
4. open `http://localhost:3000/dashboard`

## Stop the Dashboard

```powershell
powershell -ExecutionPolicy Bypass -File ".\\scripts\\maintenance\\Stop StakeOS Dashboard.ps1"
```

## Setup Inside StakeOS

After the dashboard opens:

1. paste the stake's LCR custom report URL
2. install Chromium if prompted
3. run the first full sync
4. sign in to LCR manually in the browser window that opens

## Important Notes

- This is a **source/developer** workflow.
- It is appropriate for Windows users who are comfortable with PowerShell and Node.js.
- It is not intended to be simpler than the packaged desktop app.
- The local data is still stored in the StakeOS application-support location, not in the app bundle.

## ChromeOS

This path can also work on ChromeOS **only if** Linux development tools are enabled and Node.js is installed inside that Linux environment.

Without the Linux development environment, ChromeOS is not a realistic source-run path for StakeOS.
