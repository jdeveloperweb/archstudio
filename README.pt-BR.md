<p align="center">
  <a href="https://archstudio.mjolnix.com.br">
    <img src="assets/banner.png" alt="ArchStudio — diagramas de arquitetura para humanos e agentes de IA" width="100%">
  </a>
</p>

<h1 align="center">ArchStudio</h1>

<p align="center">
  Um editor de diagramas de arquitetura de software que cabe em <strong>um único arquivo HTML</strong> — feito para humanos <em>e</em> agentes de IA.
  <br>
  Agora também uma <strong>plataforma hospedada</strong> com contas, projetos privados na nuvem e a <strong>Ari</strong> — uma assistente de IA que projeta e <em>desenha</em> com você.
  <br><br>
  <a href="https://studio.mjolnix.com.br"><strong>✦ Plataforma (contas + IA) — studio.mjolnix.com.br</strong></a>
  ·
  <a href="https://archstudio.mjolnix.com.br"><strong>▶ Canvas standalone — archstudio.mjolnix.com.br</strong></a>
  ·
  <a href="README.md">🇺🇸 Read in English</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-MIT-a679ff.svg" alt="licença MIT"></a>
  <img src="https://img.shields.io/badge/canvas-1%20arquivo%20HTML%20·%20zero%20deps-ff9900.svg" alt="um único arquivo HTML, zero dependências">
  <img src="https://img.shields.io/badge/IA-agent%20native-7c9eff.svg" alt="nativo para agentes de IA">
  <img src="https://img.shields.io/badge/plataforma-Next.js%20·%20Spring%20·%20Postgres-5ee7ff.svg" alt="stack da plataforma">
</p>

---

## Por quê

Aprofundando meus estudos de **arquitetura de software e system design**, fui procurar a melhor ferramenta para desenhar sistemas — e esbarrava sempre no mesmo atrito: ferramentas pesadas para rascunhar uma ideia simples, e nenhum jeito bom de deixar um **agente de IA desenhar comigo**. Descrever uma arquitetura no chat é fácil — transformar essa descrição num diagrama limpo e editável, não.

O ArchStudio fecha esse buraco. É um canvas que **fala JSON**: você (ou seu agente de IA) descreve o sistema como uma spec pequena, e o app organiza o layout, renderiza num estilo visual caprichado e exporta. Sem conta, sem build, sem nada no servidor.

## Funcionalidades

- **Um arquivo, zero dependências** — o app inteiro é o [`index.html`](index.html). Baixou, abriu, pronto. Funciona offline.
- **Nativo para agentes de IA** 🤖 — uma spec JSON compacta com **layout automático** (o agente nunca calcula coordenadas). O *Modo Agente* embutido entrega o schema para qualquer LLM.
- **Links compartilháveis** — o diagrama inteiro vai comprimido na URL (`#d=…`). Mande um link, receba um diagrama editável. Agentes podem *entregar diagramas como links clicáveis*.
- **Vários espaços privados** — cada diagrama é um espaço próprio, salvo localmente no seu navegador (nada sai da sua máquina, sem conta). O gerenciador 📁 Projetos cria, troca, renomeia, duplica e exclui — pessoas em navegadores diferentes nunca veem o trabalho uma da outra.
- **Skill do Claude Code inclusa** — abra este repositório no [Claude Code](https://claude.com/claude-code) e diga *"desenhe a arquitetura do meu sistema"*; a skill faz o resto.
- **Do diagrama à Infra-as-Code** ☁️ — validou o desenho? Um clique empacota o diagrama num prompt que faz um agente de IA gerar **AWS CDK (TypeScript)** ou **Terraform**, derivando IAM de menor privilégio e o wiring de eventos *a partir das setas*.
- **Paleta de componentes** — 100+ componentes, com **AWS, GCP e Azure organizados por área de serviço** (rede, computação, dados, mensageria, segurança, IA) e uma seção completa de **IA & LLM**: o pipeline de RAG como peças de primeira classe (fontes de documentos, chunking, embeddings, banco vetorial, retriever, re-ranker, cache semântico), orquestração de agentes (orquestrador, agentes, ferramentas, servidores MCP, memória compartilhada) e qualidade (avaliação RAGAS, observabilidade de LLM, guardrails) — além de genéricos, serverless e on-premise.
- **14 modelos de solução** — Cache-Aside, Fila + Worker, Outbox, Circuit Breaker, CQRS, Saga, BFF, pipeline serverless de mídia, Strangler Fig, Bulkhead, ingestão Kafka com ordem por chave, híbrido on-prem ↔ nuvem, **RAG completo (com avaliação RAGAS)** e **orquestração multi-agente** — cada um com o *problema*, o *porquê da solução* e *quando usar*.
- **Delícias de editor** — arrastar e conectar, caixas de grupo que movem o conteúdo, setas livres, anotações, desfazer/refazer, grade magnética, zoom, tema claro/escuro, 7 fontes (incluindo estilo rascunho à mão).
- **Exportação** — PNG (2×) e SVG com fontes embutidas, além de salvar/carregar `.archstudio.json`.
- **Visão limpa** — acrescente `&view=clean` a um link compartilhado e a interface some, com zoom ajustado ao conteúdo: feito para screenshots headless, embeds e revisão visual instantânea.

<p align="center">
  <img src="assets/screenshot-rag.png" alt="Arquitetura RAG serverless desenhada por um agente de IA a partir de uma spec JSON, renderizada pelo ArchStudio" width="100%">
  <br>
  <em>Desenhado por um agente de IA a partir de <a href="examples/rag-serverless-aws.archstudio.json">uma spec JSON</a>, renderizado headless com <code>&view=clean</code> — nenhum humano arrastou uma caixa sequer.</em>
</p>

## A plataforma hospedada — [studio.mjolnix.com.br](https://studio.mjolnix.com.br)

O mesmo canvas, agora um produto completo: você entra, guarda seus diagramas na nuvem e projeta com a **Ari**, uma assistente de IA que desenha junto com você.

<p align="center">
  <img src="assets/platform-editor.png" alt="O editor do ArchStudio: uma arquitetura RAG na AWS no canvas ao lado da Ari, o painel da assistente de IA" width="100%">
  <br>
  <em>O editor: seu diagrama no canvas, a <strong>Ari</strong> (assistente de IA) à direita — descreva um sistema e ela desenha; depois vocês refinam juntos.</em>
</p>

- **Contas & privacidade** — cadastro com confirmação de e-mail, redefinição de senha e projetos privados por usuário. Senhas com BCrypt(12); a sessão vive num cookie httpOnly + SameSite.
- **Ari, a assistente de IA** — um painel lateral no editor que discute trade-offs e **desenha no canvas**. Descreva um sistema (*"um checkout resiliente na AWS com fila e fallback de pagamento"*) e veja aparecer. A Ari edita de forma **incremental** — preserva o seu layout, muda só o que precisa e anima as partes novas (caixas → nós → setas).
- **Sua própria chave** — escolha o provedor (OpenAI, Anthropic/Claude, Google/Gemini, Groq, Mistral, DeepSeek, OpenRouter, ou qualquer endpoint OpenAI-compatível como Ollama) e cole sua chave de API. Ela é guardada **cifrada (AES-256-GCM)** e usada só para chamar o modelo em seu nome.
- **Perfil & configurações** — foto, nome, troca de senha, exclusão de conta, e a configuração do provedor de IA.
- **Temas** — Claro (padrão), Escuro, Meia-noite, ou seguir o sistema; o canvas do editor acompanha o tema do app.
- **Sobre o canvas** — a plataforma embute o mesmo motor [`index.html`](index.html) via `<iframe>` + ponte `postMessage` (nada de fork). O canvas open-source standalone continua funcionando igual.

**Stack:** Next.js 14 · Spring Boot 3 / Java 17 · Postgres 16 · Docker Compose · nginx — código em [`apps/web/`](apps/web/), [`services/api/`](services/api/) e [`infra/`](infra/).
**Hospede você mesmo:** `bash infra/deploy.sh` builda e sobe db + api + web. Veja [`platform/README.md`](platform/README.md) e o contrato completo de API/DB/auth em [`platform/CONTRACT.md`](platform/CONTRACT.md).

> A plataforma foi mesclada na `main` e é **aditiva**: o `index.html` na raiz continua um arquivo único, sem dependências, e funciona sozinho. Endurecimento de segurança já aplicado: isolamento por usuário, BCrypt, cookies httpOnly+Secure, chaves de provedor cifradas, rate limiting, proteção anti-SSRF no endpoint de IA custom e headers HSTS/CSP.

## Começando

**Use online:** abra **[archstudio.mjolnix.com.br](https://archstudio.mjolnix.com.br)**.

**Use localmente:**

```bash
git clone https://github.com/jdeveloperweb/archstudio.git
cd archstudio
# abra o index.html no navegador — a instalação é isso
```

## Trabalhando com agentes de IA

O ArchStudio trata agentes de IA como usuários de primeira classe. Três jeitos de plugar um:

### 1 · Claude Code (recomendado)

Este repositório traz uma skill em [`.claude/skills/archstudio/SKILL.md`](.claude/skills/archstudio/SKILL.md). Abra o repo no Claude Code e peça:

> *"Desenhe a arquitetura de um checkout de e-commerce com fallback de pagamento."*

O Claude escreve a spec `.archstudio.json`, **renderiza um PNG do diagrama direto no chat** (e confere antes de entregar), e devolve um link que abre o diagrama editável no navegador. Para usar a skill em qualquer projeto, copie a pasta para `~/.claude/skills/archstudio/`.

### 2 · Qualquer LLM via Modo Agente

Clique em **🤖 Agente** no app, copie o schema, cole em qualquer chat ("desenhe minha arquitetura neste formato"), salve a resposta como `.json` e carregue pelo **📂 Carregar** — ou pule o arquivo e use um link (abaixo).

### 3 · Links e carregamento por URL

| URL | O que faz |
|---|---|
| `…/#d=z:<base64url>` | Abre um diagrama comprimido com deflate-raw (o que o botão 🔗 gera) |
| `…/#d=j:<base64url>` | Abre um JSON puro em base64url — trivial para agentes emitirem |
| `…/?src=<url>` | Busca um JSON cru (ex.: raw de um gist) e renderiza |
| `…&view=clean` (depois de `#d=…`) | Esconde a interface e ajusta o zoom ao diagrama — feito para screenshots headless |

Gerando um link a partir de um arquivo de spec:

```bash
node -e "console.log('https://archstudio.mjolnix.com.br/#d=j:'+Buffer.from(require('fs').readFileSync(process.argv[1])).toString('base64url'))" diagrama.archstudio.json
```

## Do diagrama à Infra-as-Code

O diagrama que você validou não é só uma figura — é um plano legível por máquina. Dentro do **🤖 Modo Agente** há dois botões: **"Prompt AWS CDK (TypeScript)"** e **"Prompt Terraform"**. Cada um copia um pacote completo (instruções + seu diagrama atual em JSON) para colar em qualquer agente de IA. O agente então:

1. mapeia cada nó para o recurso equivalente (`apigw` → API Gateway, `lambda` → Lambda, `dlq` → fila dead-letter com redrive, …);
2. lê as **setas como wiring e IAM de menor privilégio** — `api → fila` vira permissão de envio, `fila → worker` vira event source mapping, setas tracejadas viram caminhos assíncronos;
3. trata nós de cliente/on-premise como contexto (não recursos) e suas anotações (`texts`) como requisitos;
4. entrega um projeto completo e compilável, mais duas listas curtas: *decisões assumidas* e *o que precisa de um humano* (domínios, segredos, tamanhos).

Com o **Claude Code** neste repositório é ainda mais curto: *"gere o CDK do examples/rag-serverless-aws.archstudio.json"* — a skill inclusa conhece a tabela de mapeamento inteira.

> **O ciclo que isso fecha:** descrever → a IA desenha → *você valida no canvas* → a IA gera o código da infra a partir de exatamente o que você aprovou. O diagrama deixa de ser documentação que envelhece — ele é a fonte.

## O formato de spec

Agentes (e humanos) descrevem diagramas assim — **omita `x`/`y` e o layout automático organiza o fluxo da esquerda para a direita seguindo as setas**:

```json
{
  "name": "Checkout resiliente",
  "boxes": [ { "id": "aws", "label": "AWS us-east-1", "color": "#ff9900" } ],
  "nodes": [
    { "id": "u",   "type": "user" },
    { "id": "api", "type": "api",   "label": "API Checkout",   "box": "aws" },
    { "id": "q",   "type": "queue", "label": "Fila de pedidos","box": "aws" },
    { "id": "db",  "type": "db",    "label": "Postgres",       "box": "aws" }
  ],
  "edges": [
    { "from": "u",   "to": "api" },
    { "from": "api", "to": "q",  "label": "202 Accepted" },
    { "from": "q",   "to": "db", "dash": true }
  ],
  "texts": [ { "text": "Consumidor idempotente — a fila entrega at-least-once." } ]
}
```

- JSON Schema completo: [`schema/archstudio.schema.json`](schema/archstudio.schema.json)
- Exemplos prontos para carregar: [`examples/`](examples/)
- Os 100+ tipos de componente (`user`, `api`, `queue`, `lambda`, `cloudrun`, `cosmosdb`, `retriever`, `reranker`, `ragas`, `orchestrator`, `mcp`, `mainframe`, …) estão listados no schema e no Modo Agente do app

## Modelos embutidos

Cada modelo responde três perguntas antes de tocar no canvas: **qual problema**, **por que este padrão resolve** e **onde se aplica**.

| Padrão | Categoria |
|---|---|
| Cache-Aside | Performance |
| Fila + Worker (nivelamento de carga) | Resiliência |
| Outbox (dual-write) | Consistência |
| Circuit Breaker + Fallback | Resiliência |
| CQRS + Read Model | Escala |
| Saga coreografada | Sistemas distribuídos |
| API Gateway + BFF | Design de API |
| Pipeline serverless de mídia | Serverless |
| Strangler Fig | Migração |
| Bulkhead (filas por prioridade) | Resiliência |
| Ingestão de eventos com ordem por chave | Mensageria |
| Híbrido on-premise ↔ nuvem | Híbrido |
| RAG completo (ingestão → consulta → avaliação RAGAS) | IA / RAG |
| Orquestração multi-agente (orquestrador, ferramentas MCP, guardrails) | IA / Agentes |

## Hospedando você mesmo

É um arquivo estático — qualquer servidor web serve:

```nginx
server {
    server_name diagramas.exemplo.com.br;
    root /var/www/archstudio;
    index index.html;
}
```

## Contribuindo

Issues e PRs são muito bem-vindos. Boas primeiras contribuições:

- **i18n** — extrair as strings da UI e adicionar inglês
- Novos componentes ou modelos (com a justificativa problema/porquê/quando)
- Novos alvos de exportação (Mermaid, draw.io, C4)
- Multi-seleção, roteamento de setas, guias de alinhamento

Mantenha o espírito: **um arquivo, zero dependências, sem build.**

## Licença

[MIT](LICENSE) © Jaime Vicente Jr — construído estudando arquitetura e system design, com IA de par. Se isso te ajudar a rascunhar mais rápido, uma ⭐ faz meu dia.
