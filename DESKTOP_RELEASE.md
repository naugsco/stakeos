# StakeOS Desktop Release Guide

This guide is for maintainers building and sharing the Electron desktop version of StakeOS.

If you are a normal user trying to install StakeOS, use [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md) instead.

For a short maintainer publish checklist, use [GITHUB_RELEASE_CHECKLIST.md](./GITHUB_RELEASE_CHECKLIST.md).

## Current Release Model

StakeOS Desktop is currently packaged for macOS through Electron.

Important constraints:
- the desktop app uses an embedded local SQLite database
- on first launch the user only needs a valid LCR custom report URL
- the user still logs in to LCR manually through the Playwright browser session
- the packaged app does not require a separate PostgreSQL install
- if Apple signing/notarization credentials are not present, the release will still build with ad-hoc signing and skip notarization automatically

## What the Release Produces

Run:

```bash
npm run desktop:check-release
npm run desktop:release
```

This does three things:
1. removes the previous `release/` folder
2. builds the Next.js app and backend bundles
3. packages macOS desktop release artifacts

Use `npm run desktop:check-release` first to verify whether this Mac is ready for a signed/notarized build.

Release artifacts are written to:

```text
release/
```

Typical artifact names:

```text
StakeOS-Desktop-<version>-<arch>.zip
StakeOS-Desktop-<version>-<arch>.dmg
```

Example:

```text
release/StakeOS-Desktop-1.0.0-arm64.zip
release/StakeOS-Desktop-1.0.0-arm64.dmg
```

## Fast Validation Build

If you only want to verify the packaged app structure without generating the final zip, run:

```bash
npm run desktop:pack
```

This creates the unpacked macOS app bundle in:

```text
release/mac-arm64/StakeOS Desktop.app
```

## Recommended Release Checklist

Use the dedicated checklist in [GITHUB_RELEASE_CHECKLIST.md](./GITHUB_RELEASE_CHECKLIST.md).

## Apple Signing And Notarization

StakeOS Desktop now supports optional notarization during `npm run desktop:release`.

If no Apple credentials are configured:
- the build still succeeds
- the app uses ad-hoc signing
- notarization is skipped automatically

If Apple credentials are configured, the same release command will:
- sign the app with your Developer ID identity
- notarize the app with `notarytool`
- produce the release zip and dmg

### Supported Credential Options

Use one of these approaches.

### Option 1: Keychain profile

Recommended if you already use `xcrun notarytool store-credentials`.

Environment variable:

```bash
export APPLE_KEYCHAIN_PROFILE="stakeos-notary"
```

### Option 2: App Store Connect API key

Environment variables:

```bash
export APPLE_API_KEY="/absolute/path/to/AuthKey_ABC123XYZ.p8"
export APPLE_API_KEY_ID="ABC123XYZ"
export APPLE_API_ISSUER="00000000-0000-0000-0000-000000000000"
```

### Option 3: Apple ID + app-specific password

Environment variables:

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="TEAMID1234"
```

### Signing Requirements

For a proper outside-the-App-Store macOS release, your machine should have a valid:

```text
Developer ID Application
```

certificate in Keychain.

If no matching identity is available, `electron-builder` falls back to ad-hoc signing.

### Skip Notarization Explicitly

If you want to build release artifacts without notarization even though credentials are present:

```bash
export SKIP_STAKEOS_NOTARIZE=1
npm run desktop:release
```

## What To Share With Another User

For a GitHub release or direct handoff, share:
- the GitHub Release page
- the desktop `.dmg` as the primary install artifact
- the `.zip` as a fallback artifact
- the installation guide: [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)
- the LCR report guide: [LCR_REPORT_SETUP.md](./LCR_REPORT_SETUP.md)

If you are publishing unsigned macOS builds, also tell users:
- macOS may block the first launch
- they can right-click the app and choose `Open`
- or use `System Settings > Privacy & Security > Open Anyway`
- if needed, they can run:

```bash
xattr -dr com.apple.quarantine "/Applications/StakeOS Desktop.app"
```

The receiving user still needs:
- their own LCR custom report URL
- the first sync to run successfully

If they are using the packaged desktop app, StakeOS can install Chromium from the in-app setup flow.

## Packaging Notes

StakeOS Desktop currently uses:
- `electron-builder`
- `@electron/notarize`
- `asar: false`

That `asar: false` setting is intentional for now. Next.js production runtime expects a real working directory for `.next` and related server assets. This should be revisited later, but it is the correct pragmatic choice for a working release today.

## GitHub Release Workflow

A practical GitHub workflow is:

1. push the source changes to `main`
2. run `npm run desktop:release`
3. upload the generated zip and/or dmg from `release/` to a GitHub Release
4. link users to:
   - the release asset
   - [FIRST_TIME_SETUP.md](./FIRST_TIME_SETUP.md)
   - [LCR_REPORT_SETUP.md](./LCR_REPORT_SETUP.md)

## Not Yet Included

These are not done yet:
- automated signing identity discovery guidance inside the app
- notarization verification UI inside the repo tooling
- fully automatic first-run Chromium installation without the user clicking the in-app setup action

Those are the next packaging-quality steps after this release baseline.
