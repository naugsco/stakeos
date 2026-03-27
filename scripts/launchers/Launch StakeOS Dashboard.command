#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
PORT="${PORT:-3000}"
RUN_DIR="$PROJECT_DIR/.run"
LOG_FILE="$RUN_DIR/dashboard.log"
PID_FILE="$RUN_DIR/dashboard.pid"

mkdir -p "$RUN_DIR"
cd "$PROJECT_DIR"

kill_pid_if_running() {
  local pid="$1"
  if [ -n "${pid:-}" ] && kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

collect_stakeos_next_pids() {
  local pid
  local cmd
  local cwd
  for pid in $(pgrep -f "next/dist/bin/next" 2>/dev/null || true); do
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if [[ "$cmd" != *" next dev"* && "$cmd" != *" next start"* ]]; then
      continue
    fi

    cwd="$(lsof -p "$pid" 2>/dev/null | awk '/ cwd / {print $NF; exit}' || true)"
    if [[ "$cwd" == "$PROJECT_DIR" ]]; then
      echo "$pid"
    fi
  done
}

stop_all_stakeos_next() {
  local pids
  pids="$(collect_stakeos_next_pids | tr '\n' ' ' | sed 's/ $//')"
  if [ -z "$pids" ]; then
    return 0
  fi

  for pid in $pids; do
    kill_pid_if_running "$pid"
  done
  sleep 1
}

is_pid_stakeos_next() {
  local pid="$1"
  if [ -z "${pid:-}" ]; then
    return 1
  fi

  local cmd
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  if [[ "$cmd" != *next* ]]; then
    return 1
  fi

  local cwd
  cwd="$(lsof -p "$pid" 2>/dev/null | awk '/ cwd / {print $NF; exit}' || true)"
  [[ "$cwd" == "$PROJECT_DIR" ]]
}

is_existing_server_healthy() {
  local html
  html="$(curl -sf "http://localhost:$PORT/dashboard" 2>/dev/null || true)"
  if [ -z "$html" ]; then
    return 1
  fi

  local css_path
  css_path="$(echo "$html" | grep -oE '/_next/static/css/[^"]+' | head -n 1 || true)"
  if [ -z "$css_path" ]; then
    return 1
  fi

  local css_status
  css_status="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$css_path" || true)"
  [[ "$css_status" == "200" ]]
}

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "StakeOS" message "npm is not installed. Install Node.js first." as critical'
  exit 1
fi

if [ ! -d "node_modules" ]; then
  npm install
fi

if lsof -i "tcp:$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  if is_existing_server_healthy; then
    open "http://localhost:$PORT/dashboard"
    exit 0
  fi

  existing_pid="$(lsof -ti tcp:$PORT -sTCP:LISTEN | head -n 1 || true)"
  if is_pid_stakeos_next "$existing_pid"; then
    kill_pid_if_running "$existing_pid"
    sleep 1
    if [ -f "$PID_FILE" ]; then
      rm -f "$PID_FILE"
    fi
  else
    osascript -e 'display alert "StakeOS" message "Port 3000 is in use by another app. Close it or set PORT before launching." as critical'
    exit 1
  fi
fi

# Ensure no stray StakeOS Next process on alternate ports can hold .next files.
stop_all_stakeos_next

# Clear stale build artifacts before a fresh production build.
rm -rf "$PROJECT_DIR/.next"

echo "[$(date)] Building StakeOS dashboard..." >> "$LOG_FILE"
if ! npm run build >> "$LOG_FILE" 2>&1; then
  osascript -e 'display alert "StakeOS" message "Dashboard build failed. Check .run/dashboard.log for details." as critical'
  exit 1
fi

echo "[$(date)] Starting StakeOS dashboard..." >> "$LOG_FILE"
nohup npm run start -- --port "$PORT" >> "$LOG_FILE" 2>&1 &

for _ in {1..60}; do
  if curl -sSf "http://localhost:$PORT/dashboard" >/dev/null 2>&1; then
    listener_pid="$(lsof -ti tcp:$PORT -sTCP:LISTEN | head -n 1 || true)"
    if [ -n "$listener_pid" ]; then
      echo "$listener_pid" > "$PID_FILE"
    fi
    open "http://localhost:$PORT/dashboard"
    exit 0
  fi
  sleep 1
done

osascript -e 'display alert "StakeOS" message "Dashboard failed to start on port 3000. Check .run/dashboard.log for details." as critical'
exit 1
