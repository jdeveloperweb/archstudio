# ArchStudio

Editor de diagramas de arquitetura em **um único arquivo** (`index.html`) — sem build, sem dependências. Também há uma plataforma (Next.js + Spring + Postgres) em `apps/web`, `services/api` e `infra`, que embute o mesmo `index.html`.

## Regras do projeto

- Todo o canvas (CSS + HTML + JS) vive em `index.html`. Não adicione bundlers, frameworks nem dependências externas (exceção existente: Google Fonts).
- **Sem emojis na interface.** Todo ícone de UI é SVG inline no padrão lucide (`<svg class="ti" ...>`). Toleráveis por serem glifos de texto: `✕` e `✓`. Há uma trava: `python tools/check_no_emoji.py` varre `index.html` + `apps/web/src` e falha se aparecer emoji.
- Não há suíte de testes no repositório: valide abrindo `index.html` no navegador — criar/conectar nós, undo/redo, salvar/carregar, exportar PNG/SVG, copiar link, carregar `examples/*.json` e via `#d=j:<base64url>`.
- O formato de spec está em `schema/archstudio.schema.json`. Mudanças devem manter retrocompatibilidade com `version: 3` e com specs sem `x`/`y` (auto-layout).
- A skill `.claude/skills/archstudio/SKILL.md` ensina agentes a desenhar diagramas e a gerar IaC (CDK/Terraform) a partir deles — mantenha a tabela de tipos dela em sincronia com o `CATALOG` do `index.html`.
- Para desenhar um diagrama ou gerar infra a partir de um, use a skill `archstudio`.
