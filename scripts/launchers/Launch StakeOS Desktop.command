#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
LOG_FILE="$RUN_DIR/desktop-launcher.log"
SHELL_LOG="$RUN_DIR/desktop-shell.log"
NEXT_LOG="$RUN_DIR/desktop-next.log"

mkdir -p "$RUN_DIR"
cd "$PROJECT_DIR"

kill_stakeos_desktop_processes() {
  local pid
  local cwd
  for pid in $(pgrep -f "electron/main.cjs|next/dist/bin/next|StakeOS Desktop" 2>/dev/null || true); do
    cwd="$(lsof -p "$pid" 2>/dev/null | awk '/ cwd / {print $NF; exit}' || true)"
    if [[ "$cwd" == "$PROJECT_DIR" ]]; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "StakeOS Desktop Launcher" message "npm is not installed. Install Node.js to run StakeOS from source." as critical'
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[$(date)] Installing source dependencies..." >> "$LOG_FILE"
  if ! npm install >> "$LOG_FILE" 2>&1; then
    osascript -e 'display alert "StakeOS Desktop Launcher" message "npm install failed. Check .run/desktop-launcher.log for details." as critical'
    exit 1
  fi
fi

echo "[$(date)] Checking local SQLite native module..." >> "$LOG_FILE"
if ! node -e "const Database=require('better-sqlite3'); new Database(':memory:').close()" >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] Rebuilding better-sqlite3 for local Node runtime..." >> "$LOG_FILE"
  if ! npm rebuild better-sqlite3 --build-from-source >> "$LOG_FILE" 2>&1; then
    osascript -e 'display alert "StakeOS Desktop Launcher" message "better-sqlite3 rebuild failed. Check .run/desktop-launcher.log for details." as critical'
    exit 1
  fi
fi

echo "[$(date)] Clearing stale local build output..." >> "$LOG_FILE"
rm -rf .next dist

echo "[$(date)] Building local StakeOS source..." >> "$LOG_FILE"
if ! npm run build >> "$LOG_FILE" 2>&1; then
  osascript -e 'display alert "StakeOS Desktop Launcher" message "Local build failed. Check .run/desktop-launcher.log for details." as critical'
  exit 1
fi

kill_stakeos_desktop_processes
rm -f "$SHELL_LOG" "$NEXT_LOG"

echo "[$(date)] Launching local StakeOS desktop..." >> "$LOG_FILE"
exec npm run desktop:start >> "$LOG_FILE" 2>&1
