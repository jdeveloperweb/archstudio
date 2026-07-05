<p align="center">
  <a href="https://archstudio.mjolnix.com.br">
    <img src="assets/banner.png" alt="ArchStudio — architecture diagrams for humans & AI agents" width="100%">
  </a>
</p>

<h1 align="center">ArchStudio</h1>

<p align="center">
  A software-architecture diagram editor that fits in <strong>a single HTML file</strong> — built for humans <em>and</em> AI agents.
  <br><br>
  <a href="https://archstudio.mjolnix.com.br"><strong>▶ Live demo — archstudio.mjolnix.com.br</strong></a>
  ·
  <a href="README.pt-BR.md">🇧🇷 Leia em Português</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-a679ff.svg" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/dependencies-zero-4ade80.svg" alt="zero dependencies">
  <img src="https://img.shields.io/badge/app-1%20HTML%20file-ff9900.svg" alt="single HTML file">
  <img src="https://img.shields.io/badge/AI-agent%20native-7c9eff.svg" alt="AI agent native">
</p>

---

## Why

I was studying **software architecture** and **system design interviews**, and kept hitting the same friction: heavyweight tools to sketch a simple idea, and no good way to let an **AI agent draw with me**. Describing an architecture in chat is easy — turning that description into a clean, editable diagram is not.

ArchStudio closes that gap. It is a canvas that **speaks JSON**: you (or your AI agent) describe the system as a small spec, and the app lays it out, renders it in a hand-crafted visual style, and exports it. No account, no build step, no server-side anything.

## Features

- **Single file, zero dependencies** — the entire app is [`index.html`](index.html). Download it, open it, done. Works offline.
- **AI-agent native** 🤖 — a compact JSON spec with **automatic layout** (agents never compute coordinates). Built-in *Agent Mode* hands the schema to any LLM.
- **Shareable links** — the whole diagram is compressed into the URL (`#d=…`). Send a link, get an editable diagram. Agents can *deliver diagrams as clickable links*.
- **Claude Code skill included** — open this repo in [Claude Code](https://claude.com/claude-code) and say *"draw my system's architecture"*; the bundled skill does the rest.
- **Diagram → Infrastructure-as-Code** ☁️ — once you've validated the drawing, one click packages it into a prompt that makes an AI agent generate **AWS CDK (TypeScript)** or **Terraform**, deriving least-privilege IAM and event wiring *from the arrows*.
- **Component palette** — 60+ components: AWS (network, compute, data, messaging, security), generic/cloud-agnostic, serverless and on-premise.
- **12 solution templates** — Cache-Aside, Queue + Worker, Outbox, Circuit Breaker, CQRS, Saga, BFF, Serverless media pipeline, Strangler Fig, Bulkhead, keyed Kafka ingestion, Hybrid on-prem ↔ cloud — each with the *problem*, *why the pattern solves it* and *when to use it*.
- **Editor niceties** — drag & connect, group boxes that move their contents, free arrows, notes, undo/redo, snap grid, zoom, dark/light theme, 7 font styles (including sketchy hand-drawn).
- **Export** — PNG (2×) and SVG with embedded fonts, plus save/load as `.archstudio.json`.

## Quick start

**Use it online:** open **[archstudio.mjolnix.com.br](https://archstudio.mjolnix.com.br)**.

**Use it locally:**

```bash
git clone https://github.com/jdeveloperweb/archstudio.git
cd archstudio
# open index.html in your browser — that's the whole install
```

> The UI is currently in Brazilian Portuguese (i18n is on the roadmap — PRs welcome!). The spec format and this documentation are English-friendly.

## Working with AI agents

ArchStudio treats AI agents as first-class users. Three ways to plug one in:

### 1 · Claude Code (recommended)

This repo ships a skill at [`.claude/skills/archstudio/SKILL.md`](.claude/skills/archstudio/SKILL.md). Open the repo in Claude Code and ask:

> *"Draw the architecture of an e-commerce checkout with payment fallback."*

Claude writes the `.archstudio.json` spec **and** returns a link that opens the finished diagram in your browser. To use the skill from any project, copy the folder to `~/.claude/skills/archstudio/`.

### 2 · Any LLM via Agent Mode

Click **🤖 Agente** in the app, copy the schema, paste it into any chat ("draw my architecture in this format"), save the reply as `.json` and load it with **📂 Carregar** — or skip the file entirely with a link (below).

### 3 · Links & URL loading

| URL | What it does |
|---|---|
| `…/#d=z:<base64url>` | Opens a diagram compressed with deflate-raw (what the 🔗 button generates) |
| `…/#d=j:<base64url>` | Opens a plain base64url-encoded JSON — trivial for agents to emit |
| `…/?src=<url>` | Fetches a raw JSON (e.g. a gist) and renders it |

Generate a link from a spec file in one line:

```bash
node -e "console.log('https://archstudio.mjolnix.com.br/#d=j:'+Buffer.from(require('fs').readFileSync(process.argv[1])).toString('base64url'))" diagram.archstudio.json
```

## From diagram to Infrastructure-as-Code

The diagram you validated is not just a picture — it's a machine-readable plan. Inside **🤖 Agent Mode** there are two buttons: **"AWS CDK (TypeScript) prompt"** and **"Terraform prompt"**. Each copies a complete package (instructions + your current diagram as JSON) that you paste into any AI agent. The agent then:

1. maps every node to the equivalent resource (`apigw` → API Gateway, `lambda` → Lambda, `dlq` → dead-letter queue with redrive, …);
2. reads the **edges as wiring and least-privilege IAM** — `api → queue` becomes a send grant, `queue → worker` becomes an event source mapping, dashed edges become async paths;
3. treats client/on-premise nodes as context (not resources) and your `texts` annotations as requirements;
4. outputs a complete, compilable project plus two short lists: *assumed decisions* and *things that need a human* (domains, secrets, sizing).

Using **Claude Code** with this repo, it's even shorter: *"generate the CDK for examples/rag-serverless-aws.archstudio.json"* — the bundled skill knows the whole mapping table.

> **The loop this closes:** describe → AI draws → *you validate on the canvas* → AI generates the infra code from exactly what you approved. The diagram stops being documentation that drifts — it's the source.

## The spec format

Agents (and humans) describe diagrams like this — **omit `x`/`y` and the auto-layout arranges the flow left → right following the edges**:

```json
{
  "name": "Resilient checkout",
  "boxes": [ { "id": "aws", "label": "AWS us-east-1", "color": "#ff9900" } ],
  "nodes": [
    { "id": "u",   "type": "user" },
    { "id": "api", "type": "api",   "label": "Checkout API", "box": "aws" },
    { "id": "q",   "type": "queue", "label": "Orders queue", "box": "aws" },
    { "id": "db",  "type": "db",    "label": "Postgres",     "box": "aws" }
  ],
  "edges": [
    { "from": "u",   "to": "api" },
    { "from": "api", "to": "q",  "label": "202 Accepted" },
    { "from": "q",   "to": "db", "dash": true }
  ],
  "texts": [ { "text": "Idempotent consumer — the queue delivers at-least-once." } ]
}
```

- Full JSON Schema: [`schema/archstudio.schema.json`](schema/archstudio.schema.json)
- Ready-to-load examples: [`examples/`](examples/)
- 60+ component types (`user`, `api`, `queue`, `lambda`, `s3`, `k8s`, `mainframe`, …): listed in the schema and in the in-app Agent Mode

## Built-in templates

Each template answers three questions before touching the canvas: **what problem**, **why this pattern solves it**, and **where it applies**.

| Pattern | Category |
|---|---|
| Cache-Aside | Performance |
| Queue + Worker (load leveling) | Resilience |
| Outbox (dual-write) | Consistency |
| Circuit Breaker + Fallback | Resilience |
| CQRS + Read Model | Scale |
| Choreographed Saga | Distributed systems |
| API Gateway + BFF | API design |
| Serverless media pipeline | Serverless |
| Strangler Fig | Migration |
| Bulkhead (priority queues) | Resilience |
| Event ingestion with per-key ordering | Messaging |
| Hybrid on-premise ↔ cloud | Hybrid |

## Self-hosting

It's a static file — any web server works:

```nginx
server {
    server_name diagrams.example.com;
    root /var/www/archstudio;
    index index.html;
}
```

## Contributing

Issues and PRs are very welcome. Good first contributions:

- **i18n** — extract UI strings and add an English locale
- New components or templates (with the problem/why/when rationale)
- New export targets (Mermaid, draw.io, C4)
- Multi-select, edge routing, alignment guides

Keep the spirit: **one file, zero dependencies, no build step.**

## License

[MIT](LICENSE) © Jaime Vicente Jr — built while studying architecture & system design, with AI as a pair. If this helps you sketch faster, a ⭐ makes my day.
