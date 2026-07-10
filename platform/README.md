# ArchStudio Platform

Multi-tenant SaaS around the ArchStudio canvas: accounts with email verification,
private cloud-saved projects, and an AI assistant (bring-your-own API key) that
designs and **draws** architecture into the canvas.

- **Web** — Next.js 14 (`apps/web`), served at `/`.
- **API** — Spring Boot 3 / Java 17 (`services/api`), served at `/api`.
- **DB** — Postgres 16 (`infra/docker-compose.yml`).
- **Canvas** — the repo-root `index.html` engine, embedded via `<iframe src="/canvas/index.html?embed=1">`
  and driven over `postMessage` (load / change / apply-spec). The standalone canvas keeps working unchanged.

See `platform/CONTRACT.md` for the full API/DB/auth contract.

## Run it (server, Docker)

```bash
# in the repo root, on the server
bash infra/deploy.sh          # generates infra/.env secrets, builds & starts db+api+web
```

Then expose it:

```bash
sudo cp infra/nginx/studio.mjolnix.com.br.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d studio.mjolnix.com.br --redirect --non-interactive --agree-tos
```

Ports (bound to 127.0.0.1): web `3020`, api `8090`. Postgres stays on the internal Docker network.

## Local dev

```bash
# API
cd services/api && mvn spring-boot:run          # needs a local Postgres or point SPRING_DATASOURCE_URL at one
# Web
cd apps/web && cp ../../index.html public/canvas/index.html && npm install && npm run dev
# set API_INTERNAL_URL=http://localhost:8090 for the web server, and run the API with APP_COOKIE_SECURE=false
```

## Manual steps (only these need a human)

1. **DNS** — create an `A` record `studio.mjolnix.com.br → <server IP>` (Hostinger panel). Required before certbot/HTTPS.
2. **Email** — set `MAIL_ENABLED=true` + `MAIL_*` (SMTP) in `infra/.env` for real confirmation emails. Until then, verification/reset links are printed in the API logs: `docker compose logs -f api | grep MAIL`.
3. **Secrets** — `infra/deploy.sh` generates them; rotate `APP_JWT_SECRET` / `APP_ENC_KEY` for production and keep `infra/.env` out of git (it is `.gitignore`d).

## Security

BCrypt(12) passwords · JWT in httpOnly+SameSite=Lax cookie · email verification gate ·
per-IP/user rate limiting · CSRF header check on mutations · provider API keys encrypted at rest (AES-256-GCM) ·
each user only ever sees their own projects.
