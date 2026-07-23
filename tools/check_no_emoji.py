# -*- coding: utf-8 -*-
"""Trava: nada de emoji na interface — os ícones do sistema são SVG."""
import io, os, re, collections, sys

RAIZ = r'c:\Users\Jaime.Vicente\Projetos\archstudio'
EMOJI = re.compile(u'[\U0001F000-\U0001FAFF☀-➿️]')
TOLERADOS = {0x2715, 0x2713}   # X e check: glifos de texto, monocromáticos

alvos = [os.path.join(RAIZ, 'index.html')]
for root, _d, fs in os.walk(os.path.join(RAIZ, 'apps', 'web', 'src')):
    for f in fs:
        if f.endswith(('.tsx', '.ts', '.css')):
            alvos.append(os.path.join(root, f))

ruim = 0
for p in alvos:
    s = io.open(p, encoding='utf-8').read()
    c = collections.Counter(ch for ch in EMOJI.findall(s) if ord(ch) not in TOLERADOS)
    if c:
        ruim += 1
        rel = os.path.relpath(p, RAIZ).replace(os.sep, '/')
        print('EMOJI EM %s: %s' % (rel, ' '.join('U+%04X x%d' % (ord(k), v) for k, v in c.items())))

print('%d arquivos verificados, %d com emoji' % (len(alvos), ruim))
sys.exit(1 if ruim else 0)
