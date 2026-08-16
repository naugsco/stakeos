# Running StakeOS on Windows

StakeOS doesn't have a one-click Windows installer yet. On Windows you run it as a
small program on your own PC that opens in your web browser. It still works fully
offline and keeps all data on your computer — there's no website and nothing is
uploaded anywhere.

**Who this is for:** anyone comfortable installing a program and copying/pasting a
line into a Windows PowerShell window. You do **not** need to be a programmer. Plan
on about 15–20 minutes the first time.

> macOS users: don't use this guide. Download the ready-made app from the
> [GitHub Releases page](https://github.com/naugsco/stakeos/releases) instead.

---

## What you'll end up with

- A "Launch StakeOS Dashboard" shortcut you double-click to open StakeOS.
- StakeOS opens in your normal browser at `http://localhost:3000/dashboard`.
- All data lives privately on your PC (under your Windows user's AppData folder).

---

## Step 1 — Install Node.js (one time)

Node.js is the engine StakeOS runs on.

1. Go to **https://nodejs.org**.
2. Download the **LTS** version (the big green button — the one that says "LTS",
   not "Current").
3. Run the installer and click **Next** through every screen, then **Install**.
   The default options are correct — you don't need to change anything.

You only ever do this once.

## Step 2 — Get the StakeOS files

1. On the [StakeOS GitHub page](https://github.com/naugsco/stakeos), click the
   green **Code** button, then **Download ZIP**.
2. Find the downloaded ZIP (usually in your **Downloads** folder), right-click it,
   and choose **Extract All…**.
3. Pick a permanent home for it that's easy to find — for example
   `C:\Users\<you>\StakeOS`. (Don't run it from inside the Downloads folder.)

## Step 3 — Start StakeOS

1. Open the extracted **stakeos** folder.
2. Go into the `scripts\launchers` folder.
3. **Right-click** the file named **`Launch StakeOS Dashboard.ps1`** and choose
   **Run with PowerShell**.

The first launch takes a few minutes — it's setting itself up and building the
dashboard. When it's ready it opens StakeOS in your browser automatically. Later
launches are much faster.

> **If right-click → "Run with PowerShell" isn't there, or you see a red security
> message,** open it manually instead:
>
> 1. Click the Windows **Start** button, type **PowerShell**, and open it.
> 2. Copy and paste the line below, then press **Enter** (replace the path with
>    wherever you extracted StakeOS):
>
> ```powershell
> powershell -ExecutionPolicy Bypass -File "C:\Users\<you>\StakeOS\scripts\launchers\Launch StakeOS Dashboard.ps1"
> ```
>
> `-ExecutionPolicy Bypass` just tells Windows it's OK to run this one trusted
> script. It doesn't change any system settings.

**Tip:** right-click `Launch StakeOS Dashboard.ps1` → **Send to** → **Desktop
(create shortcut)** so you have a one-click launcher on your desktop afterward.

## Step 4 — First-time setup inside StakeOS

Once the dashboard opens in your browser, StakeOS walks you through setup:

1. **Paste your stake's LCR custom report URL** when asked.
2. If prompted, let it **install Chromium** (a browser component it uses to read
   LCR for you). This is a one-time download.
3. Start the **first full sync**.
4. A browser window opens — **sign in to LCR yourself**, just like you normally
   would. StakeOS never sees or stores your password.

After the first sync finishes, your dashboard is populated and ready.

## Stopping StakeOS

StakeOS keeps running quietly in the background after you close the browser tab.
To fully stop it, run the matching stopper script:

- Right-click `scripts\maintenance\Stop StakeOS Dashboard.ps1` → **Run with
  PowerShell** (or use the same PowerShell command from Step 3, pointing at that
  file).

Simply closing the browser tab does **not** stop it — your data stays put either
way, this just frees up the program.

## Keeping data and updating later

- **Your data is safe across updates.** It's stored under
  `C:\Users\<you>\AppData\Roaming\StakeOS`, not inside the StakeOS program folder.
- **To update to a newer version:** download the new ZIP (Step 2), extract it to a
  fresh folder, and launch it the same way. It picks up your existing data
  automatically because the data lives in AppData, not in the app folder.

---

## If something goes wrong

A small popup will usually tell you what happened. Common cases:

| Message / symptom | What to do |
|---|---|
| "Node.js is not installed" | Finish **Step 1**, then relaunch. |
| "Port 3000 is already in use" | StakeOS may already be running — check your browser for `localhost:3000`. If another program owns that port, close it and relaunch. |
| Red text about scripts being disabled | Use the manual **PowerShell command** in Step 3 (the `-ExecutionPolicy Bypass` one). |
| "Dashboard build failed" / "failed to start" | Open `.run\dashboard.log` inside the StakeOS folder — the last lines explain the error. |
| Browser didn't open on its own | Open a browser and go to **http://localhost:3000/dashboard** manually. |

If you get stuck, the `.run\dashboard.log` file inside the StakeOS folder is the
best place to look — it records exactly what happened during launch, and copies in
the server's own error output whenever startup fails.

The `.run` folder also keeps `server.out.log` and `server.err.log`, which hold the
full output of the running dashboard if you need more detail than the summary in
`dashboard.log`.

---

## Notes

- This is the supported way to run StakeOS on Windows today. A packaged one-click
  Windows installer may come later.
- Everything runs locally on your PC. No StakeOS data ever leaves your computer.

### ChromeOS

This can also work on ChromeOS, but **only if** the Linux development environment is
turned on and Node.js is installed inside it. Without that, ChromeOS isn't a
realistic option.
