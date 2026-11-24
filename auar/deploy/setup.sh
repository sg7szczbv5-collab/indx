#!/usr/bin/env bash
# AUAR one-time server setup (Ubuntu / Debian). Run from the auar folder:  sudo bash deploy/setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "→ Installing Docker…"
  curl -fsSL https://get.docker.com | sh
fi

if [ ! -f .env ]; then
  read -rp "Domain (e.g. auar.example.com — leave empty to use the server IP over HTTP): " DOMAIN
  read -rp "Admin email: " ADMIN_EMAIL
  read -rsp "Admin password (12+ characters): " ADMIN_PASSWORD; echo
  if [ ${#ADMIN_PASSWORD} -lt 12 ]; then echo "Password too short"; exit 1; fi
  if [ -n "$DOMAIN" ]; then PUBLIC_URL="https://$DOMAIN"; else DOMAIN=":80"; PUBLIC_URL="http://$(curl -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"; fi
  cat > .env <<ENV
DOMAIN=$DOMAIN
PUBLIC_URL=$PUBLIC_URL
AUAR_DEMO=1
DEMO_ADMIN_LOGIN=1
DEMO_RESET_HOURS=6
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
AUTH_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '=+/')
SMS_PROVIDER=console
PAYMENTS_PROVIDER=mock
CORS_ORIGIN=$PUBLIC_URL
ENV
  chmod 600 .env
  echo "→ Wrote .env"
fi

docker compose up -d --build
echo
echo "✓ AUAR is running. Open: $(grep ^PUBLIC_URL .env | cut -d= -f2)"
echo "  Logs:    docker compose logs -f app"
echo "  Update:  git pull && docker compose up -d --build"
