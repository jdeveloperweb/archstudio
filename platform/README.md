# ArchStudio Platform

Multi-tenant SaaS around the ArchStudio canvas: accounts with email verification,
private cloud-saved projects, user profiles, and **Ari** — an AI assistant
(bring-your-own API key) that designs and **draws** architecture into the canvas.

**Live:** https://studio.mjolnix.com.br

## Architecture

- **Web** — Next.js 14 + Tailwind (`apps/web`), served at `/`. Icons via `lucide-react`.
- **API** — Spring Boot 3 / Java 17 (`services/api`), served at `/api`.
- **DB** — Postgres 16, schema owned by Flyway (`V1__init.sql`, `V2__user_avatar.sql`).
- **Canvas** — the repo-root `index.html` engine, embedded via `<iframe src="/canvas/index.html?embed=1&theme=…">`
  and driven over `postMessage` (`load` / `change` / `apply` / `get` / `theme`). The standalone canvas keeps working unchanged.

See `platform/CONTRACT.md` for the full API/DB/auth contract.

## Features

- **Auth** — email-verified sign-up, login, logout, forgot/reset password. JWT in an httpOnly + SameSite cookie.
- **Projects** — private per user, saved as `jsonb`, autosaved from the editor.
- **Profile** (`/app/settings`) — avatar (resized client-side to a 256px JPEG data URL), display name, password change, and account deletion (FKs `ON DELETE CASCADE`).
- **Ari, the AI assistant** — editor side panel. Discusses trade-offs and returns an ArchStudio spec that the canvas **applies incrementally** (`mergeEmbedSpec`: matches by agent id / numeric id / label, preserves user positions, animates only what changed).
- **BYO provider key** — OpenAI · Anthropic (Claude) · Google (Gemini) · Groq · Mistral · DeepSeek · OpenRouter · custom (any OpenAI-compatible endpoint). Key stored **encrypted (AES-256-GCM)**; the API proxies the call so the key never reaches the browser.
- **Themes** — Light (default), Dark, Midnight, or System; the embedded canvas follows the app theme.

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

1. **DNS** — create an `A` record `studio.mjolnix.com.br → <server IP>` (Hostinger panel). Required before certbot/HTTPS. ✅ done.
2. **HTTPS** — `certbot --nginx -d studio.mjolnix.com.br --redirect`. ✅ done; `APP_COOKIE_SECURE=true`, http→https redirect.
3. **Email (SMTP)** — set `MAIL_ENABLED=true` + `MAIL_*` in `infra/.env` for real confirmation emails (Hostinger: `smtp.hostinger.com:465`, `MAIL_SSL=true`, `MAIL_STARTTLS=false`). Until a valid mailbox password is set, `MAIL_ENABLED=false` and verification/reset links are printed in the API logs: `docker compose logs -f api | grep MAIL`.
4. **Secrets** — `infra/deploy.sh` generates them; rotate `APP_JWT_SECRET` / `APP_ENC_KEY` for production and keep `infra/.env` out of git (it is `.gitignore`d).

## Security

BCrypt(12) passwords · JWT in httpOnly + SameSite=Lax cookie · email-verification gate ·
per-IP/user rate limiting · CSRF header check on mutations · provider API keys encrypted at rest (AES-256-GCM) ·
account deletion requires the password · each user only ever sees their own projects.
