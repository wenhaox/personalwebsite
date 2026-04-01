#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

EXISTING_PIDS="$(pgrep -f "$PROJECT_DIR/node_modules/.bin/next dev" || true)"
if [[ -n "$EXISTING_PIDS" ]]; then
  echo "Stopping existing Next dev process(es): $EXISTING_PIDS"
  kill $EXISTING_PIDS || true
  sleep 1
fi

if [[ -d ".next/static/development" ]]; then
  rm -rf .next
fi

echo "Starting Next.js dev server in stable mode"
exec next dev
