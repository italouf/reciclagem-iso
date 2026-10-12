# -*- coding: utf-8 -*-
"""Monta o painel a partir de src/.
Gera dois artefatos byte-identicos:
  - painel_isopor_bahia_retrofit.html : entregavel nomeado na especificacao
  - index.html                          : entrada do GitHub Pages
Nenhum deles exige build para ser consumido; sao arquivos autonomos.
Uso: python tools/build.py
"""
import io, json, os, sys, filecmp

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
SRC = os.path.join(ROOT, 'src')
OUT_MAIN = os.path.join(ROOT, 'painel_isopor_bahia_retrofit.html')
OUT_INDEX = os.path.join(ROOT, 'index.html')


def read(name):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        sys.exit('FALTA: ' + name)
    with io.open(p, encoding='utf-8') as fh:
        return fh.read()


# --- guarda contra '</script>' acidental dentro dos blocos inline ----------
def safe(js, label):
    if '</script' in js.lower():
        sys.exit('ERRO: </script> encontrado dentro do bloco ' + label)
    return js


fontes = read('fontes.json')
styles = read('styles.css')
body = read('body.html')
data = safe(read('data.js'), 'data.js')
engine = safe(read('engine.js'), 'engine.js')
app = safe(read('app.js'), 'app.js')

FONTES = json.loads(fontes)

# gera o catalogo de fontes como array JS, agrupando urls repetidas
lines = ['[']
for i, f in enumerate(FONTES):
    lines.append('  ' + json.dumps(f, ensure_ascii=False) + (',' if i < len(FONTES) - 1 else ''))
lines.append(']')
fontes_js = '\n'.join(lines)

html = u'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="description" content="Painel de inteligencia de mercado para a reciclagem de EPS na Bahia, com foco em Feira de Santana. Auxilia a decisao de investimento: recomenda validar antes de investir.">
<title>EPS Bahia — Painel de decisão · Reciclagem de EPS</title>
<link rel="icon" href="data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%%3E%%3Crect width='32' height='32' rx='6' fill='%%23123C35'/%%3E%%3Ctext x='16' y='22' font-family='sans-serif' font-size='15' font-weight='700' fill='%%23fff' text-anchor='middle'%%3EE%%3C/text%%3E%%3C/svg%%3E">
<style>
%s
</style>
</head>
<body>
%s

<script id="catalogo-fontes" type="application/json">%s</script>
<script>
/* ===== DADOS ===== */
const FONTES = %s;
%s
</script>
<script>
/* ===== CALCULO ===== */
%s
</script>
<script>
/* ===== APLICACAO ===== */
%s
</script>
</body>
</html>
''' % (styles, body, fontes, fontes_js, data, engine, app)

with io.open(OUT_MAIN, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(html)

# Entrada do GitHub Pages: copia byte-identica do entregavel.
with io.open(OUT_INDEX, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(html)

identico = filecmp.cmp(OUT_MAIN, OUT_INDEX, shallow=False)

print('OK -> %s (%d bytes)' % (os.path.basename(OUT_MAIN), os.path.getsize(OUT_MAIN)))
print('OK -> %s (%d bytes)' % (os.path.basename(OUT_INDEX), os.path.getsize(OUT_INDEX)))
print('   identicos: %s' % ('sim' if identico else 'NAO -- divergiram'))
print('   fontes: %d' % len(FONTES))
print('   sem URL: %s' % ', '.join(f['id'] for f in FONTES if not f['urls']))
if not identico:
    sys.exit('ERRO: index.html e o entregavel divergiram.')