# ArchStudio Platform — Build Contract (source of truth)

Turns the single-file ArchStudio canvas into a multi-tenant SaaS **without breaking** the existing canvas engine (`/index.html` stays and keeps working; we only add a backward-compatible postMessage bridge).

## Topology
- **Next.js 14** web app (`apps/web`) — App Router, TypeScript, Tailwind. Served at `/`.
- **Spring Boot 3 / Java 17** API (`services/api`) — served at `/api` (same origin, nginx routes `/api/*` → api).
- **Postgres 16** (`infra/docker-compose.yml`) — internal only.
- Public origin: `https://studio.mjolnix.com.br` (new subdomain). Same-origin → no CORS in prod.
- The **canvas engine** is the repo-root `index.html`, copied into `apps/web/public/canvas/index.html` at build. The editor embeds it in an `<iframe src="/canvas/index.html?embed=1">`.

## Ports (host, bound to 127.0.0.1)
- web → `127.0.0.1:3020` (container 3000)
- api → `127.0.0.1:8090` (container 8090)
- postgres → internal docker network only (no host port)

## Auth model
- JWT (HS256) in an **httpOnly, Secure, SameSite=Lax** cookie named `as_session`, 7-day expiry, path `/`.
- Passwords: BCrypt strength 12.
- Email verification **required** before login. Login on unverified account → 403 `EMAIL_NOT_VERIFIED`.
- Rate limiting (Bucket4j) on `/api/v1/auth/*` (10 req/min/IP) and `/api/v1/ai/*` (30 req/min/user).
- CSRF: state-changing requests are same-origin + SameSite cookie; also require header `X-Requested-With: fetch` on mutations (checked by a filter).

## REST API — base `/api/v1`, JSON. Error shape: `{ "error": "CODE", "message": "human text" }`.
### Auth
- `POST /auth/register` `{name,email,password}` → 201 `{message}`. Sends verification email (dev: logs the link at INFO). password ≥ 8 chars.
- `GET  /auth/verify?token=…` → 302 redirect to `/login?verified=1` (or `?verified=0` on failure).
- `POST /auth/resend` `{email}` → 200 (always 200, no user enumeration).
- `POST /auth/login` `{email,password}` → 200 `{user}` + sets `as_session` cookie. 403 `EMAIL_NOT_VERIFIED`; 401 `BAD_CREDENTIALS`.
- `POST /auth/logout` → 200, clears cookie.
- `POST /auth/forgot` `{email}` → 200 always. Sends reset link (dev: logs).
- `POST /auth/reset` `{token,password}` → 200.
- `GET  /me` → 200 `{id,name,email,createdAt}` (401 if no/invalid cookie).

### Projects (auth required; scoped to current user)
- `GET    /projects` → `[{id,name,updatedAt}]` (newest first).
- `POST   /projects` `{name, doc}` → 201 `{id,name,updatedAt}`. `doc` = ArchStudio document JSON (jsonb).
- `GET    /projects/{id}` → `{id,name,doc,updatedAt}` (404 if not owner).
- `PUT    /projects/{id}` `{name?, doc?}` → 200 `{id,name,updatedAt}`.
- `DELETE /projects/{id}` → 204.

### Settings (auth required)
- `GET /settings` → `{provider, model, baseUrl, hasKey}` (never returns the raw key; `hasKey` boolean).
- `PUT /settings` `{provider, model, baseUrl?, apiKey?}` → 200 (same shape). If `apiKey` omitted/empty, keep existing.

### AI
- `POST /ai/chat` `{messages:[{role,content}], diagram?}` → 200 `{reply, spec?}`.
  Backend calls the user's configured provider with a system prompt (below). If the model returns a fenced ```archstudio JSON block, backend parses it into `spec` (validated shape) so the client can apply it to the canvas. `diagram` is the current doc (for context/edits).

## Providers (combo, preconfigured)
`provider` enum + default model + endpoint style:
- `openai` → `gpt-4o-mini` — OpenAI Chat Completions (`https://api.openai.com/v1`)
- `anthropic` → `claude-3-5-sonnet-latest` — Anthropic Messages (`https://api.anthropic.com/v1`)
- `google` → `gemini-1.5-flash` — Gemini generateContent (`https://generativelanguage.googleapis.com/v1beta`)
- `groq` → `llama-3.3-70b-versatile` — OpenAI-compatible (`https://api.groq.com/openai/v1`)
- `mistral` → `mistral-large-latest` — OpenAI-compatible (`https://api.mistral.ai/v1`)
- `deepseek` → `deepseek-chat` — OpenAI-compatible (`https://api.deepseek.com/v1`)
- `openrouter` → `openai/gpt-4o-mini` — OpenAI-compatible (`https://openrouter.ai/api/v1`)
- `custom` → user-provided `baseUrl` — OpenAI-compatible (e.g. Ollama `http://host:11434/v1`)

The AI system prompt instructs the model to converse about architecture in Portuguese and, when the user asks to draw/change, emit exactly one fenced block:
\`\`\`archstudio
{ ...ArchStudio spec (name, boxes, nodes, edges, texts) ... }
\`\`\`
Spec format = the ArchStudio agent schema (see repo `schema/archstudio.schema.json`). Auto-layout means x/y are optional.

## DB (Flyway V1)
- `users(id uuid pk, name, email unique citext, password_hash, email_verified bool, created_at, updated_at)`
- `email_tokens(id uuid pk, user_id fk, token unique, type ['VERIFY'|'RESET'], expires_at, used bool, created_at)`
- `projects(id uuid pk, user_id fk, name, doc jsonb, created_at, updated_at)`
- `user_settings(user_id uuid pk fk, provider, model, base_url, api_key_enc, updated_at)`

## Encryption
- API keys stored AES-256-GCM. Key from env `APP_ENC_KEY` (base64, 32 bytes). Util `CryptoService.encrypt/decrypt`.

## Env (`infra/.env`)
`POSTGRES_PASSWORD, APP_JWT_SECRET (>=32 chars), APP_ENC_KEY (base64 32B), APP_PUBLIC_URL=https://studio.mjolnix.com.br, MAIL_* (host,port,user,pass,from), MAIL_ENABLED (true/false — false = log links)`.

## Non-negotiables
- Do not change the runtime behavior of `/index.html` when NOT embedded. The bridge activates only when `?embed=1` (or inside an iframe) and only listens for `postMessage` from same origin.
- All secrets via env. No secret committed. `.env.example` documents them.
