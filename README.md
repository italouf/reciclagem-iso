# Painel de Inteligência de Mercado — Reciclagem de EPS na Bahia

Painel executivo de apoio à decisão de investimento sobre a captura da etapa de
densificação de poliestireno expandido (EPS) na Bahia, com foco em Feira de Santana.

**A recomendação do painel é condicional.** Ele recomenda **validar antes de
investir** — não recomenda liberar capital. Os três *gates* de decisão iniciam no
estado **“não verificado”**, e nenhuma evidência de contrato, cotação ou conclusão
de gate é representada.

---

## Como usar

Abra `index.html` no navegador. **Funciona direto do disco, sem servidor e sem
rede.** Não há build, dependência, CDN ou requisição externa — todo o conteúdo é
embutido no arquivo.

Alternativamente, sirva a pasta:

```bash
python -m http.server 8000     # depois abra http://127.0.0.1:8000/
```

---

## Publicação no GitHub Pages

O repositório já está preparado para publicação como site estático:

| Item | Valor |
|---|---|
| Entrada | `index.html` na raiz |
| Origem sugerida | branch `main` (ou `master`), pasta `/ (root)` |
| `.nojekyll` | presente — os arquivos são servidos **verbatim**, sem transformação |
| Índice do relatório | `relatorio_mercado_isopor_bahia.pdf` |

**Ativação em três passos:** *Settings → Pages → Build and deployment → Deploy from
a branch* → escolha `main` e `/ (root)`.

O arquivo `.nojekyll` desliga o processamento Jekyll. Isso é intencional: o painel
precisa ser servido byte a byte como foi construído, porque é desenhado para abrir
offline e sem dependências.

### Por que `index.html` e não só o painel

`index.html` e `painel_isopor_bahia_retrofit.html` são **byte a byte idênticos**
(mesmo hash SHA-256), gerados pelo mesmo comando. O primeiro existe porque o
GitHub Pages serve `/` a partir de `index.html`; o segundo é o nome do entregável
descrito na especificação. Não edite um sem o outro — rode `python tools/build.py`.

---

## Estrutura do repositório

```
index.html                          entrada do GitHub Pages  ─┐
painel_isopor_bahia_retrofit.html   entregável nomeado       ─┴─ idênticos
painel_isopor_bahia.html            versão anterior, preservada para comparação

relatorio_mercado_isopor_bahia.md    relatório da pesquisa (texto)
relatorio_mercado_isopor_bahia.docx  mesma versão, editável
relatorio_mercado_isopor_bahia.pdf   mesma versão, apresentação
fontes_cadeia_isopor_bahia.xlsx      fontes, premissas, atores e cadastros

rfb/                                scripts e dados brutos reproduzíveis
src/                                fonte do painel (dados, cálculo, UI)
tools/                              montagem e testes
docs/retrofit/                      diagnóstico, especificação e validação
design-system/                      direção visual validada
_audit/                             capturas de validação
```

### O que **não** está versionado

`rfb/cache/` — cerca de 3,1 MB de arquivos Parquet. É cache de extração e se
regenera pela BigQuery a partir de `rfb/extrair_rfb.py`. O que o painel usa
(`rfb/rfb_agregados.json` e `rfb/rfb_players_ba.csv`) está versionado.

---

## Reconstruir e verificar

```bash
python tools/extract_fontes.py   # extrai as 49 fontes da planilha -> src/fontes.json
python tools/build.py            # gera index.html + o entregável, e confere a igualdade
node tools/test_engine.js        # 147 asserções de cálculo
```

Requer Python 3 e Node.js apenas para **reconstruir**. Nenhum dos dois é necessário
para **usar** o painel.

---

## Documentação do retrofit

| Documento | Conteúdo |
|---|---|
| [`docs/retrofit/diagnostico.md`](docs/retrofit/diagnostico.md) | Auditoria da versão anterior: problema → efeito → intervenção → verificação |
| [`docs/retrofit/spec.md`](docs/retrofit/spec.md) | Especificação, requisitos rastreáveis e decisões de design |
| [`docs/retrofit/dados-e-evidencias.md`](docs/retrofit/dados-e-evidencias.md) | Matriz de reconciliação e contratos de dados |
| [`docs/retrofit/plano.md`](docs/retrofit/plano.md) | Ciclos de implementação |
| [`docs/retrofit/validacao.md`](docs/retrofit/validacao.md) | O que foi verificado, como, e o que **não** foi |

---

## natureza dos dados

Cada afirmação quantitativa do painel carrega um identificador `S-nn` que abre o
registro da fonte correspondente. As naturezas são rotuladas no ponto de uso e
**nunca** comunicadas apenas por cor:

- **Dado publicado** · **Dado cadastral oficial** — contagens verificáveis
- **Declaração empresarial/setorial** — numbers das próprias empresas, não auditados
- **Estimativa da pesquisa** — extrapolação com hipótese explícita
- **Premissa editável** — parâmetro de simulação
- **Pendente de validação** — informação que ainda não foi confirmada

Os dimensionamentos de EPS na Bahia são **extrapolação**: não existe estudo público
dimensionando EPS exclusivamente para o estado. As faixas são apresentadas como
faixas, nunca como pontos.

---

## Licença e limites de uso

Material de análise de mercado para apoio à decisão de investimento.
**Não constitui aconselhamento jurídico, tributário ou financeiro.** Nenhuma
afirmação de elegibilidade a incentivo, contrato, carta de intenção ou disponibilidade
comercial foi confirmada. Dados com corte em **outubro de 2026**; a evidência
cadastral vem da base oficial de CNPJ da Receita Federal, partição de **11/01/2026**.