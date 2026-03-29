#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
LOG_FILE="$RUN_DIR/desktop-launcher.log"
SHELL_LOG="$RUN_DIR/desktop-shell.log"
NEXT_LOG="$RUN_DIR/desktop-next.log"
LOCK_DIR="$RUN_DIR/desktop-launch.lock"
LOCK_PID_FILE="$LOCK_DIR/pid"

mkdir -p "$RUN_DIR"
cd "$PROJECT_DIR"

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

resolve_binary() {
  local binary_name="$1"
  shift

  if command -v "$binary_name" >/dev/null 2>&1; then
    command -v "$binary_name"
    return 0
  fi

  local candidate
  for candidate in "$@"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

NODE_BIN="$(resolve_binary node /usr/local/bin/node /opt/homebrew/bin/node)" || true
NPM_BIN="$(resolve_binary npm /usr/local/bin/npm /opt/homebrew/bin/npm)" || true

cleanup_lock() {
  rm -f "$LOCK_PID_FILE" >/dev/null 2>&1 || true
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" > "$LOCK_PID_FILE"
    trap cleanup_lock EXIT
    return 0
  fi

  local existing_pid=""
  if [[ -f "$LOCK_PID_FILE" ]]; then
    existing_pid="$(cat "$LOCK_PID_FILE" 2>/dev/null || true)"
  fi

  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" >/dev/null 2>&1; then
    echo "[$(date)] Local desktop launch already in progress (pid $existing_pid)." >> "$LOG_FILE"
    osascript -e 'display alert "StakeOS Desktop Launcher" message "StakeOS Desktop Launcher is already building or starting. Wait a moment and try again." as warning'
    exit 0
  fi

  rm -rf "$LOCK_DIR"
  mkdir "$LOCK_DIR"
  printf '%s\n' "$$" > "$LOCK_PID_FILE"
  trap cleanup_lock EXIT
}

acquire_lock

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

if [[ -z "${NODE_BIN:-}" || -z "${NPM_BIN:-}" ]]; then
  osascript -e 'display alert "StakeOS Desktop Launcher" message "npm is not installed. Install Node.js to run StakeOS from source." as critical'
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[$(date)] Installing source dependencies..." >> "$LOG_FILE"
  if ! "$NPM_BIN" install >> "$LOG_FILE" 2>&1; then
    osascript -e 'display alert "StakeOS Desktop Launcher" message "npm install failed. Check .run/desktop-launcher.log for details." as critical'
    exit 1
  fi
fi

echo "[$(date)] Checking local SQLite native module..." >> "$LOG_FILE"
if ! "$NODE_BIN" -e "const Database=require('better-sqlite3'); new Database(':memory:').close()" >> "$LOG_FILE" 2>&1; then
  echo "[$(date)] Rebuilding better-sqlite3 for local Node runtime..." >> "$LOG_FILE"
  if ! "$NPM_BIN" rebuild better-sqlite3 --build-from-source >> "$LOG_FILE" 2>&1; then
    osascript -e 'display alert "StakeOS Desktop Launcher" message "better-sqlite3 rebuild failed. Check .run/desktop-launcher.log for details." as critical'
    exit 1
  fi
fi

echo "[$(date)] Clearing stale local build output..." >> "$LOG_FILE"
rm -rf .next dist

echo "[$(date)] Building local StakeOS source..." >> "$LOG_FILE"
if ! "$NPM_BIN" run build >> "$LOG_FILE" 2>&1; then
  osascript -e 'display alert "StakeOS Desktop Launcher" message "Local build failed. Check .run/desktop-launcher.log for details." as critical'
  exit 1
fi

kill_stakeos_desktop_processes
rm -f "$SHELL_LOG" "$NEXT_LOG"

echo "[$(date)] Launching local StakeOS desktop..." >> "$LOG_FILE"
exec "$NPM_BIN" run desktop:start >> "$LOG_FILE" 2>&1
