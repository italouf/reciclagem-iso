# -*- coding: utf-8 -*-
"""Extrai a camada de dados do painel a partir das fontes primárias.
Saida: src/00-data.json  (fonte de verdade gerada; nao editada a mao)"""
import json, io, os, re, unicodedata

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
import openpyxl

def slug(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

# ---------- fontes (XLSX aba Fontes) ----------
wb = openpyxl.load_workbook(os.path.join(ROOT, 'fontes_cadeia_isopor_bahia.xlsx'))
ws = wb['Fontes']
fontes = []
for row in ws.iter_rows(min_row=2, values_only=True):
    if not row or not row[0]:
        continue
    fid = str(row[0]).strip()
    titulo = (row[1] or '').strip()
    tipo = (row[2] or '').strip()
    data = (row[3] or '').strip()
    urlfield = (row[4] or '').strip()
    suporta = (row[5] or '').strip()
    # multiplas URLs: separate por ';' ou por ' | '  -> lista
    parts = [p.strip() for p in re.split(r'\s*\|\s*|;\s*', urlfield) if p.strip()]
    urls = [p for p in parts if p.lower().startswith('http')]
    nao_url = [p for p in parts if not p.lower().startswith('http')]
    urls = [u.replace('http://', 'https://') if u.startswith('http://') else u for u in urls]
    local = nao_url[0] if nao_url else None
    fontes.append({
        'id': fid, 'titulo': titulo, 'tipo': tipo, 'data': data,
        'urls': urls, 'local': local,
        'naoDisponivel': len(urls) == 0,
        'suporta': suporta,
        'slug': 'fonte-' + fid.lower().replace('.', '').replace('b', '-b')
    })

# Alvos relativos reais para registros que apontam para material desta pasta.
# Nada de link ficticio: se o arquivo nao existe, o registro aparece como
# material nao disponibilizado.
LOCAL_LINK = {
    'S-43': 'rfb/rfb_agregados.json',   # anexos reproduziveis desta pesquisa
}

print('fontes:', len(fontes))
print('sem URL:', [f['id'] for f in fontes if f['naoDisponivel']])
print('multi URL:', [(f['id'], len(f['urls'])) for f in fontes if len(f['urls']) > 1])

with io.open(os.path.join(os.path.dirname(BASE), 'src', 'fontes.json'), 'w', encoding='utf-8') as fh:
    fh.write(u'[\n')
    for i, f in enumerate(fontes):
        f['localLink'] = LOCAL_LINK.get(f['id'])
        fh.write(json.dumps(f, ensure_ascii=False, indent=2))
        fh.write(u',\n' if i < len(fontes) - 1 else u'\n')
    fh.write(u']\n')
print('OK -> src/fontes.json')

