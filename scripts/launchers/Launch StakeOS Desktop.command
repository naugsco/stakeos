#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
LOG_FILE="$RUN_DIR/desktop-launcher.log"

mkdir -p "$RUN_DIR"
cd "$PROJECT_DIR"

nohup npm run desktop:start >> "$LOG_FILE" 2>&1 &
