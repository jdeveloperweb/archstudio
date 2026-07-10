#!/usr/bin/env bash
# Deploy the ArchStudio platform on the server.
# Usage (on the server, in the repo root):  bash infra/deploy.sh
set -euo pipefail

cd "$(dirname "$0")"   # infra/

if [ ! -f .env ]; then
  echo "==> Creating infra/.env with generated secrets"
  cp .env.example .env
  JWT=$(openssl rand -hex 24)
  ENC=$(openssl rand -base64 32)
  PGP=$(openssl rand -hex 16)
  sed -i "s|^APP_JWT_SECRET=.*|APP_JWT_SECRET=${JWT}|" .env
  sed -i "s|^APP_ENC_KEY=.*|APP_ENC_KEY=${ENC}|" .env
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PGP}|" .env
  echo "    -> secrets generated. Edit infra/.env to set MAIL_* for real email."
fi

echo "==> Building and starting containers"
docker compose --env-file .env up -d --build

echo "==> Waiting for API health"
for i in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8090/actuator/health >/dev/null 2>&1; then
    echo "    API healthy"; break
  fi
  sleep 3
done

echo "==> Status"
docker compose ps
echo
echo "Web:  http://127.0.0.1:3020"
echo "API:  http://127.0.0.1:8090/actuator/health"
echo "Next: install infra/nginx/studio.mjolnix.com.br.conf into /etc/nginx/conf.d/ and run certbot."
