# ArchStudio

Editor de diagramas de arquitetura em **um único arquivo** (`index.html`) — sem build, sem dependências. Versão publicada: https://archstudio.mjolnix.com.br

## Regras do projeto

- Todo o app (CSS + HTML + JS) vive em `index.html`. Não adicione bundlers, frameworks nem dependências externas (exceção existente: Google Fonts).
- Não há suíte de testes: valide abrindo `index.html` no navegador — criar/conectar nós, undo/redo, salvar/carregar, exportar PNG/SVG, botão 🔗 Link, carregar `examples/*.json` pelo 📂 e via `#d=j:<base64url>`.
- O formato de spec está em `schema/archstudio.schema.json`. Mudanças devem manter retrocompatibilidade com `version: 3` e com specs sem `x`/`y` (auto-layout).
- A skill `.claude/skills/archstudio/SKILL.md` ensina agentes a desenhar diagramas e a gerar IaC (CDK/Terraform) a partir deles — mantenha a tabela de tipos dela em sincronia com o `CATALOG` do `index.html`.
- Para desenhar um diagrama ou gerar infra a partir de um, use a skill `archstudio`.
