#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.run/dashboard.pid"
PORT="${PORT:-3000}"

collect_stakeos_next_pids() {
  local pid
  local cmd
  local cwd
  for pid in $(pgrep -f "next/dist/bin/next" 2>/dev/null || true); do
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if [[ "$cmd" != *" next dev"* ]]; then
      continue
    fi

    cwd="$(lsof -p "$pid" 2>/dev/null | awk '/ cwd / {print $NF; exit}' || true)"
    if [[ "$cwd" == "$PROJECT_DIR" ]]; then
      echo "$pid"
    fi
  done
}

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE" 2>/dev/null || true)
  if [ -n "${PID:-}" ] && kill -0 "$PID" >/dev/null 2>&1; then
    kill "$PID"
    rm -f "$PID_FILE"
    osascript -e 'display notification "StakeOS dashboard stopped." with title "StakeOS"'
    exit 0
  fi
fi

pids="$(collect_stakeos_next_pids | tr '\n' ' ' | sed 's/ $//')"
if [ -n "$pids" ]; then
  for pid in $pids; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  rm -f "$PID_FILE"
  osascript -e 'display notification "Stopped StakeOS dashboard process(es)." with title "StakeOS"'
  exit 0
fi

osascript -e 'display notification "No running dashboard process found." with title "StakeOS"'
