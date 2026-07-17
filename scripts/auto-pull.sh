#!/usr/bin/env bash
set -euo pipefail
APP=/home/deploy/saphiro-inmobiliaria
cd "$APP"
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "$(date -Is) new commits $LOCAL -> $REMOTE"
  "$APP/scripts/deploy.sh"
fi
