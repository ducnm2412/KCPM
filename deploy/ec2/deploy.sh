#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/uth-confms}"
FRONTEND_PATH="${FRONTEND_PATH:-/var/www/uth-confms}"
SERVICE_NAME="${SERVICE_NAME:-uth-confms}"
RELEASE_ARCHIVE="${RELEASE_ARCHIVE:?RELEASE_ARCHIVE is required}"
RELEASE_ID="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$DEPLOY_PATH/releases/$RELEASE_ID"

if [ ! -f "$RELEASE_ARCHIVE" ]; then
  echo "Release archive not found: $RELEASE_ARCHIVE" >&2
  exit 1
fi

sudo mkdir -p "$RELEASE_DIR" "$DEPLOY_PATH" "$FRONTEND_PATH"
sudo tar -xzf "$RELEASE_ARCHIVE" -C "$RELEASE_DIR"

sudo install -m 755 -d "$DEPLOY_PATH"
sudo install -m 644 "$RELEASE_DIR/backend/app.jar" "$DEPLOY_PATH/app.jar"

sudo rsync -a --delete "$RELEASE_DIR/frontend/" "$FRONTEND_PATH/"

sudo systemctl daemon-reload
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl reload nginx || true

sudo find "$DEPLOY_PATH/releases" -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | xargs -r sudo rm -rf
rm -f "$RELEASE_ARCHIVE"

echo "Deployed release $RELEASE_ID"
