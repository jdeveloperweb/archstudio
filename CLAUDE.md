# ArchStudio (canvas)

Editor de diagramas de arquitetura em **um único arquivo** (`index.html`): sem build, sem dependências, sem servidor. Este repositório é open source (MIT).

## Regras do projeto

- Todo o canvas (CSS + HTML + JS) vive em `index.html`. Não adicione bundlers, frameworks nem dependências externas (exceção existente: Google Fonts).
- **Sem emojis na interface.** Todo ícone de UI é SVG inline no padrão lucide (`<svg class="ti" ...>`). Toleráveis por serem glifos de texto: `✕` e `✓`. Há uma trava: `python tools/check_no_emoji.py`.
- Não há suíte de testes: valide abrindo `index.html` no navegador — criar/conectar nós, undo/redo, salvar/carregar, exportar PNG/SVG, copiar link, carregar `examples/*.json` e via `#d=j:<base64url>`.
- O formato de spec está em `schema/archstudio.schema.json`. Mudanças devem manter retrocompatibilidade com `version: 3` e com specs sem `x`/`y` (auto-layout).
- A skill `.claude/skills/archstudio/SKILL.md` ensina agentes a desenhar diagramas e a gerar IaC (CDK/Terraform) a partir deles — mantenha a tabela de tipos dela em sincronia com o `CATALOG` do `index.html`.
- Para desenhar um diagrama ou gerar infra a partir de um, use a skill `archstudio`.

## Publicar

O canvas roda em **archstudio.mjolnix.com.br**, servido pelo nginx como arquivo estático
em `/var/www/html/archstudio/index.html` (host SSH `trab`). Não há build nem repositório lá:
o site é uma cópia.

`bash tools/publicar.sh` — commita antes, o script recusa publicar arquivo sujo e confere o
tamanho do que ficou no ar. **Toda mudança em `index.html` termina aqui**: enquanto isso foi
manual, o site ficou 14 commits atrás sem ninguém notar.

A plataforma (studio.mjolnix.com.br) tem a própria cópia vendorizada e é atualizada pelo
deploy dela, separadamente.

## Fora de escopo

A plataforma hospedada (contas, times, colaboração) vive em outro repositório, privado. Nada aqui deve depender dela.
