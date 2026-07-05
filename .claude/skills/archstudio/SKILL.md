---
name: archstudio
description: Draw software architecture diagrams as ArchStudio JSON specs with shareable links, and generate Infrastructure-as-Code (AWS CDK or Terraform) from a user-validated diagram. Use when the user asks to draw/diagram an architecture or system design ("desenhe a arquitetura", "draw the architecture", "faça um diagrama"), or to turn a diagram/spec into infra code ("gere o CDK", "generate terraform", "crie a infra desse desenho").
---

# ArchStudio — diagramas de arquitetura e geração de infra

ArchStudio (https://archstudio.mjolnix.com.br) é um editor de diagramas que carrega specs JSON com **auto-layout**. Você nunca calcula coordenadas: descreve nós e setas, o app desenha. O fluxo completo tem duas fases:

1. **Desenhar** — você gera a spec, o usuário abre o link, ajusta e **valida** o desenho.
2. **Gerar infra** — a partir da spec validada, você escreve o IaC (AWS CDK v2 ou Terraform).

---

## Fase 1 — Desenhar um diagrama

### Fluxo
1. Entenda o sistema (pergunte só o essencial; na dúvida, proponha um desenho inicial razoável).
2. Escreva a spec em `<slug>.archstudio.json` (formato abaixo). Mire em **6–15 nós** — diagrama é comunicação, não inventário.
3. Gere o link (comando abaixo).
4. **Renderize um PNG e confira**: acrescente `&view=clean` ao link (esconde a interface e ajusta o zoom ao conteúdo) e capture com navegador headless (comando abaixo). Depois **leia o PNG** para validar o layout — sobreposições? fluxo legível? Se estiver ruim, ajuste a spec (direção das edges, boxes) e re-renderize.
5. Entregue os três: **o PNG** (análise visual imediata, sem sair do chat), **o link clicável** (editar/validar no navegador) e **o arquivo** `.archstudio.json`.

### Gerando o link (abre o diagrama direto no navegador)

```bash
node -e "console.log('https://archstudio.mjolnix.com.br/#d=j:'+Buffer.from(require('fs').readFileSync(process.argv[1])).toString('base64url'))" <arquivo>.archstudio.json
```

Sem Node, use Python:

```bash
python -c "import base64,sys;print('https://archstudio.mjolnix.com.br/#d=j:'+base64.urlsafe_b64encode(open(sys.argv[1],'rb').read()).decode().rstrip('='))" <arquivo>.archstudio.json
```

### Renderizando o PNG (análise visual imediata)

Acrescente `&view=clean` ao link — o app esconde a interface e ajusta o zoom ao conteúdo — e capture com navegador headless:

```bash
# Windows (Edge)
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --window-size=1600,1000 --screenshot="diagrama.png" "<LINK>&view=clean"

# macOS/Linux (google-chrome ou chromium)
google-chrome --headless=new --disable-gpu --window-size=1600,1000 --screenshot=diagrama.png "<LINK>&view=clean"
```

Aumente `--window-size` para diagramas grandes. **Sempre leia o PNG gerado** antes de entregar — se houver sobreposição ou fluxo confuso, ajuste a spec e re-renderize.

### Formato da spec

```json
{
  "name": "Título do diagrama",
  "boxes": [ { "id": "aws", "label": "AWS us-east-1", "color": "#ff9900" } ],
  "nodes": [
    { "id": "api1", "type": "api", "label": "API Pedidos", "box": "aws" }
  ],
  "edges": [
    { "from": "api1", "to": "db1", "label": "SQL", "dash": false, "heads": "end" }
  ],
  "texts": [ { "text": "Decisão arquitetural importante em uma frase." } ]
}
```

Schema completo em `schema/archstudio.schema.json`; exemplos em `examples/`.

### Regras de ouro
- **Omita `x`/`y`** — o auto-layout organiza o fluxo da esquerda para a direita seguindo as edges.
- **`boxes`** para agrupar por ambiente/domínio (AWS, on-premise, "processamento assíncrono"...). Nós entram com `"box": "<id>"`.
- **`dash: true`** para caminhos assíncronos, de fallback ou de observabilidade.
- **Labels de edge curtos** — protocolo ou ação: `"SQL"`, `"publica"`, `"202 Accepted"`, `"fallback"`.
- **`texts`** para as 1–3 decisões que justificam o desenho (idempotência, ordem por chave, TTL...).
- Cores de box: AWS `#ff9900`, on-prem `#9aa3b5`, novo/nuvem `#4ade80`, crítico `#f87171`, padrão `#a679ff`.

### Tipos de componente (campo `type`)

| Categoria | Tipos |
|---|---|
| Clientes | `user` `browser` `mobile` `iot` `partner` |
| AWS rede/entrada | `route53` `cloudfront` `waf` `apigw` `alb` `nlb` `vpc` |
| AWS computação | `ec2` `ecs` `eks` `fargate` `lambda` `batch` |
| AWS dados | `s3` `rds` `aurora` `dynamodb` `elasticache` `redshift` `opensearch` `glacier` |
| AWS mensageria | `sqs` `sns` `eventbridge` `kinesis` `msk` `stepfn` `ses` |
| AWS segurança/ops | `iam` `cognito` `secretsmgr` `kms` `cloudwatch` `xray` |
| AWS IA & ML | `bedrock` `sagemaker` |
| GCP | `cloudrun` `gke` `cloudfn` `gce` `gcs` `cloudsql` `firestore` `bigquery` `pubsub` `memorystore` `vertexai` |
| Azure | `appservice` `aks` `azfunc` `azvm` `blob` `azsql` `cosmosdb` `servicebus` `eventhubs` `frontdoor` `entra` `azureopenai` |
| IA — modelos/agentes | `llm` `gpu` `aiagent` `orchestrator` `tool` `mcp` `aimemory` `guardrail` |
| IA — RAG | `docsource` `chunking` `embeddings` `vectordb` `retriever` `reranker` `promptbuild` `semcache` `ragas` `llmobs` |
| Serverless genérico | `funcao` `edgefn` `faasqueue` `container` |
| Genéricos | `api` `worker` `queue` `stream` `dlq` `outbox` `db` `cache` `lb` `gateway` `auth` `sched` `obs` `extern` `k8s` `cdngen` `storagegen` |
| On-premise | `server` `vm` `dbonprem` `mainframe` `firewall` `nas` `ad` `vpn` `dc` |

Prefira genéricos quando a nuvem não importa; tipos AWS quando o alvo é AWS (a Fase 2 agradece). Tipo desconhecido vira `api`.

---

## Fase 2 — Do diagrama validado ao IaC (CDK / Terraform)

Quando o usuário pedir a infra de um diagrama ("gera o CDK disso", "quero o terraform desse desenho"):

### Entrada
Aceite qualquer uma destas formas — todas carregam os mesmos `nodes`/`edges`:
- uma spec `*.archstudio.json` (formato acima, ids são strings);
- um arquivo salvo pelo app (`{"format":"archstudio","version":3,"state":{nodes,edges,boxes,...}}` — ids numéricos, membership de box é geométrico: ignore posições, use os labels);
- um link `#d=z:...`/`#d=j:...` — decodifique: `j:` é base64url do JSON; `z:` é base64url de deflate-raw (`node -e` com `zlib.inflateRawSync`).

**Antes de gerar, confirme 1 coisa só:** CDK (TypeScript) ou Terraform? Se o usuário já disse, não pergunte. Depois gere tudo; liste pendências no final em vez de fazer mil perguntas.

### Mapeamento nó → recurso

| type | CDK v2 (TS) | Terraform (AWS) |
|---|---|---|
| `apigw` / `gateway` | `aws-apigateway.RestApi` (ou HttpApi) | `aws_apigatewayv2_api` |
| `lambda` / `funcao` / `worker`* | `aws-lambda.Function` (NodejsFunction) | `aws_lambda_function` |
| `sqs` / `queue` / `faasqueue` | `aws-sqs.Queue` | `aws_sqs_queue` |
| `dlq` | `aws-sqs.Queue` ligada como deadLetterQueue | `aws_sqs_queue` + redrive policy |
| `sns` | `aws-sns.Topic` | `aws_sns_topic` |
| `eventbridge` | `aws-events.EventBus` + Rules | `aws_cloudwatch_event_bus/rule` |
| `kinesis` / `stream` | `aws-kinesis.Stream` | `aws_kinesis_stream` |
| `msk` | MSK Serverless | `aws_msk_serverless_cluster` |
| `stepfn` / `sched` | StateMachine / `events.Rule` cron | `aws_sfn_state_machine` / scheduler |
| `s3` / `storagegen` | `aws-s3.Bucket` | `aws_s3_bucket` |
| `rds` / `db` | `aws-rds.DatabaseInstance` (Postgres) | `aws_db_instance` |
| `aurora` | `rds.DatabaseCluster` (Aurora Serverless v2) | `aws_rds_cluster` |
| `dynamodb` | `aws-dynamodb.Table` (on-demand) | `aws_dynamodb_table` |
| `elasticache` / `cache` | `aws-elasticache` (Redis) | `aws_elasticache_*` |
| `redshift` / `opensearch` / `glacier` | serviço correspondente | idem |
| `ecs` / `fargate` / `container` / `api`* | Fargate Service + ALB (ecs_patterns) | `aws_ecs_service` (Fargate) |
| `eks` / `k8s` | `aws-eks.Cluster` | `aws_eks_cluster` |
| `ec2` / `vm` | `aws-ec2.Instance` | `aws_instance` |
| `alb` / `nlb` / `lb` | `elasticloadbalancingv2` | `aws_lb` |
| `cloudfront` / `cdngen` | `aws-cloudfront.Distribution` | `aws_cloudfront_distribution` |
| `route53` | `aws-route53` records | `aws_route53_record` |
| `waf` | `aws-wafv2.CfnWebACL` | `aws_wafv2_web_acl` |
| `cognito` / `auth` | `aws-cognito.UserPool` + authorizer | `aws_cognito_user_pool` |
| `secretsmgr` | `aws-secretsmanager.Secret` | `aws_secretsmanager_secret` |
| `kms` | `aws-kms.Key` | `aws_kms_key` |
| `cloudwatch` / `obs` | alarms + dashboard | `aws_cloudwatch_*` |
| `xray` | `tracing: ACTIVE` nas Lambdas | idem |
| `ses` | verificação + policy de envio | `aws_ses_*` |
| `vpc` | `aws-ec2.Vpc` (2 AZs) | `aws_vpc` + subnets |
| `vpn` | Site-to-Site VPN / comentário DX | `aws_vpn_*` |

\* `worker` conectado a partir de fila/stream = consumer (Lambda com event source, ou serviço ECS); `api` = serviço HTTP (Fargate+ALB) a menos que o contexto peça Lambda.

**Não viram recurso** (são contexto): `user`, `browser`, `mobile`, `iot`, `partner`, `extern` (vira endpoint/secret de integração), `server`, `mainframe`, `dbonprem`, `nas`, `ad`, `firewall`, `dc`, `iam` (permissões saem das edges), `outbox` (é padrão de aplicação — gere comentário/tabela).

### GCP e Azure

Nós GCP/Azure ⇒ **Terraform** com provider `google`/`azurerm` (CDK clássico é só AWS — se pedirem CDK com esses nós, avise e proponha Terraform ou CDKTF):

- **GCP:** `cloudrun`→`google_cloud_run_v2_service` · `gke`→`google_container_cluster` (Autopilot) · `cloudfn`→`google_cloudfunctions2_function` · `gce`→`google_compute_instance` · `gcs`→`google_storage_bucket` · `cloudsql`→`google_sql_database_instance` · `firestore`→`google_firestore_database` · `bigquery`→`google_bigquery_dataset`(+table) · `pubsub`→`google_pubsub_topic`(+subscription) · `memorystore`→`google_redis_instance` · `vertexai`→endpoint/comentário.
- **Azure:** `appservice`→`azurerm_linux_web_app` · `aks`→`azurerm_kubernetes_cluster` · `azfunc`→`azurerm_linux_function_app` · `azvm`→`azurerm_linux_virtual_machine` · `blob`→`azurerm_storage_account`+container · `azsql`→`azurerm_mssql_server`+database · `cosmosdb`→`azurerm_cosmosdb_account` · `servicebus`→`azurerm_servicebus_namespace`+queue · `eventhubs`→`azurerm_eventhub_namespace`+eventhub · `frontdoor`→`azurerm_cdn_frontdoor_profile` · `entra`→`azuread_*`/comentário.
- As edges seguem a mesma lógica de menor privilégio (ex.: `api → pubsub` = `roles/pubsub.publisher`; `servicebus → worker` = RBAC de receive).

### Tipos de IA, RAG e agentes

**Viram recurso de infra:**
- `llm` → secret com a API key + variável de endpoint; se o box indicar a nuvem, prefira o serviço gerenciado: `bedrock` (IAM `bedrock:InvokeModel`), `vertexai`, `azureopenai` (`azurerm_cognitive_account`).
- `sagemaker` → endpoint de inferência (`aws_sagemaker_endpoint`).
- `aiagent` / `orchestrator` → o serviço que os hospeda (Lambda, Fargate, Cloud Run, Container Apps) com as permissões que as edges pedem.
- `vectordb` → gerenciado equivalente ao contexto (OpenSearch Serverless, pgvector no RDS/Cloud SQL, ou Pinecone como `extern`).
- `semcache` → Redis (ElastiCache/Memorystore) com TTL.
- `aimemory` → tabela NoSQL de sessões/histórico (DynamoDB, Firestore, Cosmos).
- `docsource` → bucket de origem (+ notificação de evento se houver edge para fila/função).
- `embeddings` → função dedicada no compute da nuvem do diagrama.
- `mcp` → serviço de container pequeno (porta HTTP/stdio documentada).
- `gpu` → instância/node pool com GPU (g5/A10G, A100, série NC) — deixe o tamanho como variável.
- `llmobs` → container self-host (Langfuse) ou SaaS como `extern` (só secret/endpoint).

**Camada de aplicação (código, não recurso — gere módulo/comentário no projeto):** `chunking`, `retriever`, `reranker`, `promptbuild`, `tool`, `guardrail` (ou Bedrock Guardrails quando AWS) e `ragas` — se houver edge vindo de `sched`, gere o job agendado de avaliação (ex.: Lambda cron rodando o RAGAS sobre amostras dos traces).

### As edges definem o wiring e o IAM (menor privilégio)
- `api → sqs` ⇒ `queue.grantSendMessages(fn)` / policy `sqs:SendMessage`
- `sqs → worker` ⇒ `SqsEventSource` / `aws_lambda_event_source_mapping`
- `serviço → db|dynamodb|s3` ⇒ grant de leitura/escrita conforme o label da edge (label "leitura" ⇒ só read)
- `s3 → sqs|lambda` ⇒ notificação de evento S3
- `sns → sqs` ⇒ subscription; `eventbridge → *` ⇒ Rule + target
- `* → extern` ⇒ egress + secret para credencial (Secrets Manager)
- edge `dash` ⇒ caminho assíncrono: prefira event source/notificação a chamada síncrona
- `cloudfront → s3` ⇒ OAC; `waf → cloudfront|apigw` ⇒ associação de WebACL; `cognito → apigw` ⇒ authorizer

### Saída
- Projeto completo e compilável: CDK → `bin/`, `lib/<stack>.ts`, `package.json`, `cdk.json`; Terraform → `main.tf`, `variables.tf`, `outputs.tf` (+ `backend` comentado).
- Nomes de recursos derivados dos **labels** dos nós (slug).
- Boas práticas por padrão: encryption at rest, `RemovalPolicy`/`prevent_destroy` explícitos, DLQ com `maxReceiveCount`, timeouts de Lambda coerentes, tags do projeto.
- Termine com **"Decisões assumidas"** (instância/tamanhos, região, VPC nova vs existente) e **"Pendências humanas"** (domínios, certificados, segredos, quotas) — em lista curta.
- Se houver `texts` no diagrama, trate-os como requisitos (ex.: "idempotente" ⇒ comente onde a idempotência entra).
- Renderize o PNG do diagrama aprovado (seção acima) e salve como `docs/architecture.png` do projeto de infra — o desenho validado É a documentação, e o `.archstudio.json` ao lado permite reeditar.
