#!/usr/bin/env bash
# Publica o canvas em archstudio.mjolnix.com.br.
#
# O site e um unico arquivo estatico servido pelo nginx a partir de
# /var/www/html/archstudio. Nao ha build nem repositorio la: e uma copia.
#
# Este script existe porque a copia era feita a mao, e o inevitavel aconteceu --
# o site ficou 14 commits atras do repositorio sem ninguem perceber, servindo uma
# versao anterior a todo o sistema de familias visuais. Publicar tem de ser um
# comando, nao uma lembranca.
#
#   bash tools/publicar.sh
#
set -euo pipefail

HOST="${ARCHSTUDIO_HOST:-trab}"
DESTINO="${ARCHSTUDIO_WEBROOT:-/var/www/html/archstudio}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARQUIVO="$RAIZ/index.html"

[ -f "$ARQUIVO" ] || { echo "index.html nao encontrado em $RAIZ" >&2; exit 1; }

# trava do projeto: nada de emoji na interface
python "$RAIZ/tools/check_no_emoji.py"

# nao publicar o que ainda nao esta no repositorio: o site tem de ser rastreavel
# a um commit, senao volta a divergir em silencio
if ! git -C "$RAIZ" diff --quiet -- index.html || ! git -C "$RAIZ" diff --cached --quiet -- index.html; then
  echo "index.html tem mudancas nao commitadas. Commit antes de publicar." >&2
  exit 1
fi
COMMIT="$(git -C "$RAIZ" rev-parse --short HEAD)"

echo "publicando $COMMIT ($(wc -c < "$ARQUIVO") bytes) em $HOST:$DESTINO"
scp -q "$ARQUIVO" "$HOST:/tmp/archstudio-index.html"
ssh "$HOST" "set -e
  cp '$DESTINO/index.html' '$DESTINO/index.html.bak-\$(date +%Y%m%d)' 2>/dev/null || true
  install -m 0644 /tmp/archstudio-index.html '$DESTINO/index.html'
  rm -f /tmp/archstudio-index.html"

# confere o que o mundo esta vendo, nao o que mandamos
LOCAL=$(wc -c < "$ARQUIVO")
NOAR=$(curl -sf https://archstudio.mjolnix.com.br/ -o /dev/null -w '%{size_download}')
if [ "$LOCAL" = "$NOAR" ]; then
  echo "no ar: $NOAR bytes, confere com o local"
else
  echo "ATENCAO: no ar $NOAR bytes, local $LOCAL. Cache ou falha na copia." >&2
  exit 1
fi
