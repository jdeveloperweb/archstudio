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
3. Gere o link e entregue **o arquivo + o link clicável**, avisando que dá para editar no navegador e re-salvar.

### Gerando o link (abre o diagrama direto no navegador)

```bash
node -e "console.log('https://archstudio.mjolnix.com.br/#d=j:'+Buffer.from(require('fs').readFileSync(process.argv[1])).toString('base64url'))" <arquivo>.archstudio.json
```

Sem Node, use Python:

```bash
python -c "import base64,sys;print('https://archstudio.mjolnix.com.br/#d=j:'+base64.urlsafe_b64encode(open(sys.argv[1],'rb').read()).decode().rstrip('='))" <arquivo>.archstudio.json
```

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

**Antes de gerar, confirme 1 coisa só:** CDK (TypeScript) ou Terraform? Se o usuário já disse, não pergunte. Depois gere tudo; liste pendências no final em vez de entrevistar.

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
