<p align="center">
  <a href="https://archstudio.mjolnix.com.br">
    <img src="assets/banner.png" alt="ArchStudio — diagramas de arquitetura para humanos e agentes de IA" width="100%">
  </a>
</p>

<h1 align="center">ArchStudio</h1>

<p align="center">
  Um editor de diagramas de arquitetura de software que cabe em <strong>um único arquivo HTML</strong> — feito para humanos <em>e</em> agentes de IA.
  <br><br>
  <a href="https://archstudio.mjolnix.com.br"><strong>▶ Demo ao vivo — archstudio.mjolnix.com.br</strong></a>
  ·
  <a href="README.md">🇺🇸 Read in English</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licen%C3%A7a-MIT-a679ff.svg" alt="licença MIT"></a>
  <img src="https://img.shields.io/badge/depend%C3%AAncias-zero-4ade80.svg" alt="zero dependências">
  <img src="https://img.shields.io/badge/app-1%20arquivo%20HTML-ff9900.svg" alt="um único arquivo HTML">
  <img src="https://img.shields.io/badge/IA-agent%20native-7c9eff.svg" alt="nativo para agentes de IA">
</p>

---

## Por quê

Eu estava estudando **arquitetura de software** e **entrevistas de system design**, e esbarrava sempre no mesmo atrito: ferramentas pesadas para rascunhar uma ideia simples, e nenhum jeito bom de deixar um **agente de IA desenhar comigo**. Descrever uma arquitetura no chat é fácil — transformar essa descrição num diagrama limpo e editável, não.

O ArchStudio fecha esse buraco. É um canvas que **fala JSON**: você (ou seu agente de IA) descreve o sistema como uma spec pequena, e o app organiza o layout, renderiza num estilo visual caprichado e exporta. Sem conta, sem build, sem nada no servidor.

## Funcionalidades

- **Um arquivo, zero dependências** — o app inteiro é o [`index.html`](index.html). Baixou, abriu, pronto. Funciona offline.
- **Nativo para agentes de IA** 🤖 — uma spec JSON compacta com **layout automático** (o agente nunca calcula coordenadas). O *Modo Agente* embutido entrega o schema para qualquer LLM.
- **Links compartilháveis** — o diagrama inteiro vai comprimido na URL (`#d=…`). Mande um link, receba um diagrama editável. Agentes podem *entregar diagramas como links clicáveis*.
- **Skill do Claude Code inclusa** — abra este repositório no [Claude Code](https://claude.com/claude-code) e diga *"desenhe a arquitetura do meu sistema"*; a skill faz o resto.
- **Do diagrama à Infra-as-Code** ☁️ — validou o desenho? Um clique empacota o diagrama num prompt que faz um agente de IA gerar **AWS CDK (TypeScript)** ou **Terraform**, derivando IAM de menor privilégio e o wiring de eventos *a partir das setas*.
- **Paleta de componentes** — 60+ componentes: AWS (rede, computação, dados, mensageria, segurança), genéricos/agnósticos de nuvem, serverless e on-premise.
- **12 modelos de solução** — Cache-Aside, Fila + Worker, Outbox, Circuit Breaker, CQRS, Saga, BFF, pipeline serverless de mídia, Strangler Fig, Bulkhead, ingestão Kafka com ordem por chave, híbrido on-prem ↔ nuvem — cada um com o *problema*, o *porquê da solução* e *quando usar*.
- **Delícias de editor** — arrastar e conectar, caixas de grupo que movem o conteúdo, setas livres, anotações, desfazer/refazer, grade magnética, zoom, tema claro/escuro, 7 fontes (incluindo estilo rascunho à mão).
- **Exportação** — PNG (2×) e SVG com fontes embutidas, além de salvar/carregar `.archstudio.json`.
- **Visão limpa** — acrescente `&view=clean` a um link compartilhado e a interface some, com zoom ajustado ao conteúdo: feito para screenshots headless, embeds e revisão visual instantânea.

<p align="center">
  <img src="assets/screenshot-rag.png" alt="Arquitetura RAG serverless desenhada por um agente de IA a partir de uma spec JSON, renderizada pelo ArchStudio" width="100%">
  <br>
  <em>Desenhado por um agente de IA a partir de <a href="examples/rag-serverless-aws.archstudio.json">uma spec JSON</a>, renderizado headless com <code>&view=clean</code> — nenhum humano arrastou uma caixa sequer.</em>
</p>

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
- Os 60+ tipos de componente (`user`, `api`, `queue`, `lambda`, `s3`, `k8s`, `mainframe`, …) estão listados no schema e no Modo Agente do app

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
