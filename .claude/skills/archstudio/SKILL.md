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
    { "from": "api1", "to": "db1", "label": "SQL", "dash": false, "heads": "end", "route": "reta" }
  ],
  "texts": [ { "text": "Decisão arquitetural importante em uma frase.", "size": 14, "bold": false, "italic": false, "color": "#f87171", "align": "left" } ]
}
```

Schema completo em `schema/archstudio.schema.json`; exemplos em `examples/`.

### Regras de ouro
- **Omita `x`/`y`** — o auto-layout organiza o fluxo da esquerda para a direita seguindo as edges.
- **`boxes`** para agrupar por ambiente/domínio (AWS, on-premise, "processamento assíncrono"...). Nós entram com `"box": "<id>"`.
- **`dash: true`** para caminhos assíncronos, de fallback ou de observabilidade.
- **Pode haver mais de uma edge entre o mesmo par** (ex.: `"HTTP"` síncrono e `"evento pedido_criado"` assíncrono): repita o par com labels diferentes — o canvas separa as linhas lado a lado sozinho.
- **`route`** define o traçado: `"reta"` (padrão), `"curva"` (arredondada) ou `"orto"` (ângulos retos, bom para fluxos que voltam ou desviam). No editor dá para arrastar a linha e criar pontos de controle; isso vira o campo `pts`, que você não precisa calcular.
- **Labels de edge curtos** — protocolo ou ação: `"SQL"`, `"publica"`, `"202 Accepted"`, `"fallback"`.
- **`texts`** para as 1–3 decisões que justificam o desenho (idempotência, ordem por chave, TTL...). Cada texto aceita `bold`, `italic`, `color` (hex), `align` (left/center/right) — use para destacar a decisão crítica. Para um destaque em bloco, use `"frame": true` (vira uma caixa de texto com fundo/borda), com `w` (largura) e `bg` (cor de fundo, hex) opcionais.
- **`lock: true`** fixa o item: ele não é movido, copiado, apagado nem pego pelo laço — e a IA também não o remove. Use para molduras e legendas que devem ficar paradas.
- **`rot`** (graus) gira qualquer item. No editor, a alça ⟲ gira arrastando; com o ímã da grade ligado ele trava de 15 em 15° (Shift inverte).
- **`tech`** e **`desc`** valem para **qualquer** componente — não só os C4. `tech` sai como `[Spring Boot]` embaixo do nome; `desc` é uma linha curta de descrição. O cartão cresce sozinho.
- **`multiple: true`** desenha o cartão empilhado, indicando várias instâncias (réplicas, pods, workers).
- **`details`** (drill-down) leva sub-diagramas para DENTRO do nó — no editor, o card ganha um selo e um botão "detalhes" (ou duplo-clique) que abrem uma vista em tela cheia com abas; dá para exportar cada um em PNG e o diagrama inteiro em **PDF (com os detalhes)**. Dois tipos: **`kind:"sequence"`** — `parts:[{id,label,type,color}]` (type: `actor`/`frontend`/`mobile`/`api`/`service`/`worker`/`queue`/`cache`/`db`/`auth`/`ext`), `msgs:[{id,from,to,label,kind,method}]` (kind: `sync`/`async`/`reply` = ponta cheia / aberta / tracejada; method opcional: badge `GET`/`POST`/`PUT`/`PATCH`/`DELETE`) e `frags:[{id,type,label,from,to}]` (caixa loop/alt/opt/par em volta das mensagens `from`..`to`, índices 0-based); **`kind:"state"`** — `states:[{id,kind,label,color,x,y}]` (kind: `start`/`normal`/`end`/`decision` losango/`fork` barra; `x`/`y` = CENTRO) e `trans:[{id,from,to,label}]` (na decisão, rotule as saídas `[sim]`/`[não]`); e **`kind:"arch"`** — `doc:{nodes,edges,boxes,texts}` é uma **prancheta ArchStudio ANINHADA** (drill-down C4: contêiner → componente) com todos os tipos, edges e caixas do canvas, e é **recursiva** (nós lá dentro também podem ter `details`/`doc`). No editor, o card ganha o selo **C4** — clicar (ou o menu de contexto, ou a aba "Sub-arquitetura") entra na prancheta; o breadcrumb no topo ou **Esc** sobem de nível; o **PDF (com detalhes)** inclui cada sub-arquitetura como uma página. `color` é hex opcional. Opcional e retrocompatível. Ex. sequência: `"details":[{"id":"d1","kind":"sequence","name":"Checkout","parts":[{"id":"c","label":"Cliente","type":"actor"},{"id":"a","label":"API","type":"api"}],"msgs":[{"id":"m1","from":"c","to":"a","label":"/pedidos","kind":"sync","method":"POST"}],"frags":[{"id":"f1","type":"loop","label":"por item","from":0,"to":0}]}]`. Ex. C4: `"details":[{"id":"a1","kind":"arch","name":"Interior da API","doc":{"nodes":[{"id":"ctrl","type":"c4component","label":"Controller"},{"id":"svc","type":"c4component","label":"Service"},{"id":"repo","type":"c4component","label":"Repository"}],"edges":[{"from":"ctrl","to":"svc"},{"from":"svc","to":"repo"}]}}]`.
- Cores de box: AWS `#ff9900`, on-prem `#9aa3b5`, novo/nuvem `#4ade80`, crítico `#f87171`, padrão `#a679ff`, C4 `#4d9de0`.

### Modelo C4 (níveis)

O C4 é **notação**, não um catálogo à parte: os tipos `c4*` existem para quando você quer a semântica pura, mas `tech`/`desc`/`multiple` funcionam igual num `lambda`, `rds` ou `cloudrun` — dá para desenhar C4 já mostrando a tecnologia real.

| Elemento C4 | `type` | Observação |
|---|---|---|
| Pessoa / ator | `c4person` | `c4extperson` para quem está fora do escopo |
| Sistema de software (o seu) | `c4system` | Nível 1 |
| Sistema externo | `c4extsystem` | sai em cinza, convenção do C4 |
| Contêiner (app, serviço, SPA) | `c4container` | Nível 2 — use `tech` |
| Contêiner de dados / mensageria | `c4db` / `c4queue` | Nível 2 |
| Componente | `c4component` | Nível 3 |

**Um diagrama por nível.** Ponha os elementos do seu escopo numa `box` (a fronteira) e deixe pessoas e sistemas externos **fora dela** — o auto-layout dá uma faixa própria a cada fronteira, então quem não é membro nunca cai dentro. Os modelos prontos `c4_contexto`, `c4_conteineres` e `c4_componentes` no botão **Modelos** são o ponto de partida.

- **Nível 1 (Contexto):** pessoas + seu sistema + sistemas externos. Sem tecnologia interna.
- **Nível 2 (Contêineres):** o que sobe e cai sozinho, cada um com `tech`. Marque réplicas com `multiple`.
- **Nível 3 (Componentes):** por dentro de **um** contêiner; o que é externo a ele aparece na borda.
- **Nível 4 (Código):** normalmente não vale desenhar — gere a partir da IDE.

### Tipos de componente (campo `type`)

| Categoria | Tipos |
|---|---|
| C4 (notação) | `c4person` `c4extperson` `c4system` `c4extsystem` `c4container` `c4component` `c4db` `c4queue` |
| Clientes | `user` `browser` `mobile` `iot` `partner` |
| AWS rede/entrada | `route53` `cloudfront` `waf` `apigw` `alb` `nlb` `vpc` `natgw` `tgw` |
| AWS computação | `ec2` `ecs` `eks` `fargate` `lambda` `batch` `ecr` `apprunner` |
| AWS dados | `s3` `rds` `aurora` `dynamodb` `elasticache` `redshift` `opensearch` `glacier` `efs` `documentdb` `athena` `glue` |
| AWS mensageria | `sqs` `sns` `eventbridge` `kinesis` `msk` `stepfn` `ses` `appsync` `firehose` |
| AWS segurança/ops | `iam` `cognito` `secretsmgr` `kms` `cloudwatch` `xray` `ssm` `acm` `cloudtrail` `guardduty` |
| AWS devops | `cloudformation` `codepipeline` `codebuild` |
| AWS IA & ML | `bedrock` `sagemaker` `rekognition` `textract` `comprehend` |
| GCP | `cloudrun` `gke` `cloudfn` `gce` `appengine` `gcs` `cloudsql` `firestore` `bigquery` `spanner` `bigtable` `dataflow` `pubsub` `cloudtasks` `apigee` `vertexai` `gclb` `cloudarmor` `gcpsecrets` |
| Azure | `appservice` `aks` `azfunc` `azvm` `containerapps` `aci` `blob` `azsql` `cosmosdb` `azredis` `azpostgres` `synapse` `servicebus` `eventhubs` `apim` `eventgrid` `logicapps` `frontdoor` `entra` `keyvault` `azureopenai` `azaisearch` |
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
| `natgw` / `tgw` | NAT Gateway / Transit Gateway na VPC | `aws_nat_gateway` / `aws_ec2_transit_gateway` |
| `ecr` | `aws-ecr.Repository` | `aws_ecr_repository` |
| `apprunner` | App Runner service | `aws_apprunner_service` |
| `efs` | `aws-efs.FileSystem` (+ mount targets) | `aws_efs_file_system` (+ mount) |
| `documentdb` | DocumentDB cluster | `aws_docdb_cluster` |
| `athena` / `glue` | Athena workgroup / Glue jobs+catalog | `aws_athena_workgroup` / `aws_glue_*` |
| `appsync` | `aws-appsync.GraphqlApi` | `aws_appsync_graphql_api` |
| `firehose` | Kinesis Data Firehose delivery stream | `aws_kinesis_firehose_delivery_stream` |
| `ssm` | Parameter Store params / `secretsmgr` p/ segredos | `aws_ssm_parameter` |
| `acm` | `aws-certificatemanager.Certificate` | `aws_acm_certificate` (+ validation) |
| `cloudtrail` | `aws-cloudtrail.Trail` | `aws_cloudtrail` |
| `guardduty` | GuardDuty detector | `aws_guardduty_detector` |
| `rekognition`/`textract`/`comprehend` | IAM p/ invocar a API (sem recurso a provisionar) | idem — grants na role |
| `cloudformation`/`codepipeline`/`codebuild` | é a própria entrega: gere o projeto CDK/pipeline, não um recurso dentro do stack | `aws_codepipeline` / `aws_codebuild_project` |

\* `worker` conectado a partir de fila/stream = consumer (Lambda com event source, ou serviço ECS); `api` = serviço HTTP (Fargate+ALB) a menos que o contexto peça Lambda.

**Não viram recurso** (são contexto): `user`, `browser`, `mobile`, `iot`, `partner`, `extern` (vira endpoint/secret de integração), `server`, `mainframe`, `dbonprem`, `nas`, `ad`, `firewall`, `dc`, `iam` (permissões saem das edges), `outbox` (é padrão de aplicação — gere comentário/tabela).

### GCP e Azure

Nós GCP/Azure ⇒ **Terraform** com provider `google`/`azurerm` (CDK clássico é só AWS — se pedirem CDK com esses nós, avise e proponha Terraform ou CDKTF):

- **GCP:** `cloudrun`→`google_cloud_run_v2_service` · `gke`→`google_container_cluster` (Autopilot) · `cloudfn`→`google_cloudfunctions2_function` · `gce`→`google_compute_instance` · `appengine`→`google_app_engine_*` · `gcs`→`google_storage_bucket` · `cloudsql`→`google_sql_database_instance` · `firestore`→`google_firestore_database` · `bigquery`→`google_bigquery_dataset`(+table) · `spanner`→`google_spanner_instance`(+database) · `bigtable`→`google_bigtable_instance` · `dataflow`→`google_dataflow_job` · `pubsub`→`google_pubsub_topic`(+subscription) · `cloudtasks`→`google_cloud_tasks_queue` · `apigee`→`google_apigee_*`/API Gateway · `memorystore`→`google_redis_instance` · `gclb`→`google_compute_*` (LB) · `cloudarmor`→`google_compute_security_policy` · `gcpsecrets`→`google_secret_manager_secret` · `vertexai`→endpoint/comentário.
- **Azure:** `appservice`→`azurerm_linux_web_app` · `aks`→`azurerm_kubernetes_cluster` · `azfunc`→`azurerm_linux_function_app` · `azvm`→`azurerm_linux_virtual_machine` · `containerapps`→`azurerm_container_app` · `aci`→`azurerm_container_group` · `blob`→`azurerm_storage_account`+container · `azsql`→`azurerm_mssql_server`+database · `cosmosdb`→`azurerm_cosmosdb_account` · `azredis`→`azurerm_redis_cache` · `azpostgres`→`azurerm_postgresql_flexible_server` · `synapse`→`azurerm_synapse_workspace` · `servicebus`→`azurerm_servicebus_namespace`+queue · `eventhubs`→`azurerm_eventhub_namespace`+eventhub · `apim`→`azurerm_api_management` · `eventgrid`→`azurerm_eventgrid_topic` · `logicapps`→`azurerm_logic_app_workflow` · `frontdoor`→`azurerm_cdn_frontdoor_profile` · `entra`→`azuread_*`/comentário · `keyvault`→`azurerm_key_vault` · `azaisearch`→`azurerm_search_service`.
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
