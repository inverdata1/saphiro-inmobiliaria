#!/usr/bin/env bash
set -euo pipefail
APP=/home/deploy/saphiro-inmobiliaria
LOCK=/tmp/saphiro-inmobiliaria-deploy.lock
LOG=/home/deploy/saphiro-inmobiliaria/scripts/deploy.log

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "$(date -Is) deploy already running" | tee -a "$LOG"
  exit 0
fi

{
  echo "======== $(date -Is) deploy start ========"
  cd "$APP"
  git fetch origin main
  git reset --hard origin/main

  # Frontend
  npm ci --omit=dev=false
  npm run build

  # API
  cd "$APP/api"
  npm ci --omit=dev

  cd "$APP"
  pm2 startOrReload ecosystem.config.cjs --update-env
  pm2 save

  echo "======== $(date -Is) deploy ok $(git rev-parse --short HEAD) ========"
} >>"$LOG" 2>&1
