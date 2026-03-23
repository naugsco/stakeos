#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$RUN_DIR/calling-sync-$TIMESTAMP.log"

mkdir -p "$RUN_DIR"
cd "$PROJECT_DIR"

echo "========================================"
echo "StakeOS Quick Calling Update"
echo "Log: $LOG_FILE"
echo "Started: $(date)"
echo "========================================"

action_ok=true
if npm run sync:callings 2>&1 | tee "$LOG_FILE"; then
  echo ""
  echo "Quick calling update completed successfully."
  osascript -e 'display notification "StakeOS calling update completed." with title "StakeOS"'
else
  action_ok=false
  echo ""
  echo "Quick calling update failed. Check log: $LOG_FILE"
  osascript -e 'display alert "StakeOS" message "Quick calling update failed. Check the terminal/log for details." as critical'
fi

echo ""
echo "Finished: $(date)"
echo ""
read -r "?Press Enter to close this window... "

if [ "$action_ok" = false ]; then
  exit 1
fi
