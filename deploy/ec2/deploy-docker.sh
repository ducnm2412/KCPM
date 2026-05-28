#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${APP_PATH:-/opt/uth-confms-docker}"
RELEASE_ARCHIVE="${RELEASE_ARCHIVE:?RELEASE_ARCHIVE is required}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

if [ ! -f "$RELEASE_ARCHIVE" ]; then
  echo "Release archive not found: $RELEASE_ARCHIVE" >&2
  exit 1
fi

sudo mkdir -p "$APP_PATH"
sudo chown -R "$USER":"$USER" "$APP_PATH"
tar -xzf "$RELEASE_ARCHIVE" -C "$APP_PATH"

if [ ! -f "$APP_PATH/.env.prod" ]; then
  if [ -f "$APP_PATH/.env.prod.example" ]; then
    cp "$APP_PATH/.env.prod.example" "$APP_PATH/.env.prod"
  fi
  echo "Created $APP_PATH/.env.prod. Update secrets before running production traffic." >&2
fi

cd "$APP_PATH"
docker compose -f "$COMPOSE_FILE" --env-file .env.prod up -d --build
docker image prune -f

rm -f "$RELEASE_ARCHIVE"
