# StakeOS Desktop Install Guide

This guide is for normal users installing StakeOS on a Mac.

If you are trying to run StakeOS from source, use [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) instead.

## What To Download

Do **not** start from the GitHub code page.

Use the **GitHub Releases** page for StakeOS and download:

1. `StakeOS-Desktop-<version>-<arch>.dmg`
2. If the DMG does not work for you, use the `.zip` instead

The DMG is the main install file for normal users.

GitHub Releases:

- [https://github.com/naugsco/stakeos/releases](https://github.com/naugsco/stakeos/releases)

## Install StakeOS

1. Open the downloaded `.dmg`
2. Drag `StakeOS Desktop.app` into `Applications`
3. Open `Applications` and launch `StakeOS Desktop`

If macOS blocks the app because Apple cannot confirm it is free of malware:

1. Right-click `StakeOS Desktop.app`
2. Choose `Open`
3. If needed, use `System Settings > Privacy & Security > Open Anyway`

If that still does not work, use Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/StakeOS Desktop.app"
```

Then try opening the app again.

## What StakeOS Stores On Your Mac

StakeOS stores its local data here:

- App data: `~/Library/Application Support/StakeOS/`
- SQLite database: `~/Library/Application Support/StakeOS/stakeos.db`
- App settings: `~/Library/Application Support/StakeOS/config.json`

You do **not** need PostgreSQL.
You do **not** need a `.env` file.
You do **not** need to install Node.js to use the packaged desktop app.
You do **not** need any `Launcher.app` helper from the source repository.

## Before First Launch

You need one thing ready:

- your stake's **LCR custom report URL**

Nothing else needs to be configured in Terminal first.

If you still need to create that report, use [LCR_REPORT_SETUP.md](./LCR_REPORT_SETUP.md).

If you are not sure where to start with the report, open the app first. StakeOS includes an in-app helper with copyable column lists.

## First Launch

When you open StakeOS Desktop for the first time:

1. Paste the LCR custom report URL
2. If StakeOS says Chromium is missing, click `Install Chromium And Continue`
3. Run the first full sync
4. Log in to LCR manually when the browser opens
5. Wait for the sync to finish
6. Open the dashboard

StakeOS creates the local SQLite database automatically during setup and sync.

## Optional: Claude Desktop MCP

StakeOS can also connect to Claude Desktop through MCP.

This is optional.

If you want it:

1. Open `Settings` in StakeOS
2. Find the `Claude Desktop MCP` section
3. Click `Enable StakeOS MCP In Claude Desktop`
4. Fully restart Claude Desktop

## Normal User Path

For most people, the whole process should be:

1. Download the DMG from GitHub Releases
2. Drag the app into `Applications`
3. Open StakeOS Desktop
4. Paste the LCR report URL
5. Install Chromium if prompted
6. Run the first sync
7. Use the dashboard

## If You Need Help

Use these docs based on what you are trying to do:

- Create the LCR custom report: [LCR_REPORT_SETUP.md](./LCR_REPORT_SETUP.md)
- Run StakeOS from source: [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)
- Build a new desktop release: [DESKTOP_RELEASE.md](./DESKTOP_RELEASE.md)
