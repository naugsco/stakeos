#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$RUN_DIR/full-sync-$TIMESTAMP.log"

mkdir -p "$RUN_DIR"
cd "$PROJECT_DIR"

echo "========================================"
echo "StakeOS Directory Update"
echo "Project: $PROJECT_DIR"
echo "Log: $LOG_FILE"
echo "Started: $(date)"
echo "========================================"

echo ""
echo "Step 1/2: Ensure database schema is up to date"
npm run db:migrate

echo ""
echo "Step 2/2: Run full directory sync"
echo "A browser window may open. Complete LCR login manually and wait for the report rows to load."

action_ok=true
if npm run sync:full 2>&1 | tee "$LOG_FILE"; then
  echo ""
  echo "Directory update completed successfully."
  osascript -e 'display notification "StakeOS full directory update completed." with title "StakeOS"'
else
  action_ok=false
  echo ""
  echo "Directory update failed. Check log: $LOG_FILE"
  osascript -e 'display alert "StakeOS" message "Directory update failed. Check the terminal/log for details." as critical'
fi

echo ""
echo "Finished: $(date)"
echo ""
read -r "?Press Enter to close this window... "

if [ "$action_ok" = false ]; then
  exit 1
fi
