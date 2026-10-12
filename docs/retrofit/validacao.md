# Validação — Painel de Inteligência de Mercado (EPS/Bahia) · Retrofit

**Data:** 12/10/2026
**Entregável validado:** `painel_isopor_bahia_retrofit.html` (231 KB, artefato único)
**Navegador:** Chromium (Playwright), viewport 1440×900, DPR 1, `scale: css`
**Servidor de ensaio:** `python -m http.server 8765` a partir da pasta do projeto

---

## 1. Como foi validado

| Camada | Ferramenta | Verificações |
|---|---|---|
| Cálculo | **Node.js** (`node tools/test_engine.js`) | 147 asserções numéricas |
| Interface | **Playwright / Chromium** headless | Execução de cenários no DOM real |
| Visual | Capturas de tela em 1440 px e 375 px | 7 áreas × 2 larguras |
| Contraste | Cálculo de razão WCAG no DOM real | 20 pares de cor |
| Console | Listener de `pageerror` e `console.error` | Toda a sessão |

**Reproduzir:**

```bash
node tools/test_engine.js          # 147 asserções de cálculo
python tools/build.py              # monta o HTML a partir de src/
python -m http.server 8765         # abre http://127.0.0.1:8765/painel_isopor_bahia_retrofit.html
```

---

## 2. Resultado por requisito

### 2.1 Visão executiva

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| EX-01 | A primeira tela apresenta a decisão e suas condições | **Atendido** | `final-1440-visao.png`; recomendação como `h1`, 3 fundamentos, 3 condições com prazos, 3 riscos, próximo passo |
| EX-02 | Cada indicador preserva escopo, unidade, período e natureza | **Atendido** | 4 indicadores da abertura, cada um com valor, unidade, escopo, natureza e fonte |
| EX-03 | No máximo 4 indicadores na abertura | **Atendido** | Contagem inspecionada: `#kpis-visao .kpi` = **4** |
| EX-04 | Afirmações absolutas trazem cobertura, data e limitação | **Atendido** | Substituída por “Não foram identificados operadores especializados em EPS no levantamento realizado”, seguido dos três limites (CNAE não isola material, base formal, partição 11/01/2026) |

### 2.2 Evidência

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| EV-01 | Cada `[S-nn]` leva ao registro e permite retorno | **Atendido** | 40+ tokens clicaveis; painel abre **dentro da seção ativa**; botão “Voltar ao ponto de leitura” devolve o foco ao token de origem (verificado) |
| EV-02 | Divergências registradas e representadas | **Atendido** | Matriz com 10 linhas renderizada em Fontes; `dados-e-evidencias.md` traz 19 indicadores reconciliados |
| EV-03 | Natureza da evidência textual, não só cromática | **Atendido** | 8 variantes com rótulo textual e marca; todas com `<abbr>`-free texto visível |
| EV-04 | Nenhum número sem fonte, unidade e período | **Atendido** | Verificado por construção: `number` só na camada de dados, `pt-BR` só na apresentação |

### 2.3 Design system

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| DS-01 | Componentes compartilham tokens | **Atendido** | `src/styles.css` — cor, tipografia, espaçamento, raio, borda, sombra, camada e movimento em `:root` |
| DS-02 | Estados de evidência com rótulo textual | **Atendido** | 8/8 variantes renderizadas com texto |
| DS-03 | Verde não indica aprovação nem “não verificado” | **Atendido** | Gates usam `badge--neutro` + rótulo “não verificado”; o verde fica reservado a ação do usuário e resultado **calculado** |

### 2.4 Navegação e estado

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| NV-01 | Link direto e histórico funcional | **Atendido** | `voltar` → mercado, `avançar` → plano, deep link `#area-cadeia`, `aria-current` único após cada transição |
| NV-02 | Navegação utilizável ao rolar, em toda largura | **Atendido** | 375 px com `scrollY=1600`: `nav.top = 130`, `topbar.bottom = 130` → **não encoberta**. Captura `_audit/final-375-nav-sticky.png` |
| ST-01 | Cenários e premissas com comportamento previsível | **Atendido** | Edição → estado “Personalizado”; botão restaura o conjunto base; premissa **37** sobrevive ao recarregamento |
| ST-02 | Trocar de área preserva premissas, cenário e filtros | **Atendido** | `plano → mercado → viabilidade` manteve o volume editado |
| ST-03 | Estado sobrevive a `localStorage` indisponível | **Atendido** | Com `localStorage` bloqueado, o painel inicializa, as 7 áreas abrem e o rodapé informa a degradação |

**Correção de D-24 (falha mais grave da versão anterior):** na versão anterior, em 375 px o `.topbar` media 139,5 px enquanto a navegação ficava presa em `top: 52px` — a barra de navegação **desaparecia** ao rolar. O retrofit separa `--topbar-min` (constante) de `--nav-top` e `--scroll-offset` (medidos por `ResizeObserver` sobre o cabeçalho e a navegação, nunca sobre o `body`, para não realimentar a medição).

### 2.5 Cálculo — 147 asserções, 0 falhas

| ID | Requisito | Resultado |
|---|---|---|
| CL-01 | Reproduz os casos de referência | **Atendido — 147/147** |
| CL-02 | Dados inválidos não produzem resultado plausível | **Atendido** |
| CL-03 | Margem e payback só nas condições definidas | **Atendido** |
| OP-01 | Capacidade insuficiente é explicitada | **Atendido** |
| OP-02 | Resultado econômico e compatibilidade separados | **Atendido** |

**Casos de referência verificados (CL-01):**

| Grandeza | Com créditos | Sem créditos |
|---|---:|---:|
| Massa de saída | 18.400 kg | 18.400 kg |
| Receita com material | R$ 38.640 | R$ 38.640 |
| Receita hipotética com créditos | R$ 1.200 | — |
| Receita total | R$ 39.840 | R$ 38.640 |
| Custo total | R$ 30.400 | R$ 30.400 |
| Resultado mensal | **R$ 9.440** | **R$ 8.240** |
| Margem sobre receita | **23,69%** | 21,33% |
| Payback simples | **29,13 meses** | **33,37 meses** |

**Cruzamento externo (não exigido, mas registrado):** com as premissas base, `coef = 1000×0,92×2,10 − 1000×0,50 − 120 = 1.312 R$/t` e `v* = 18.000 ÷ 1.312 =` **13,72 t/mês**. A pesquisa (seção 10.1) declara ponto de equilíbrio de **“~12–15 t/mês”**. O modelo independente reproduz o intervalo declarado — evidência de que a fórmula é coerente com a pesquisa.

**Casos de erro verificados (CL-02):** campo vazio · volume 0 · volume negativo · perda 150% · perda −5% · texto não numérico · vírgula decimal · `Infinity` · `NaN` · valor absurdo (1e12) · utilização 0% e 150% · qtd 0 · horas 0 · CAPEX negativo · preço negativo · massa elegível > comprovada · massa comprovada > entrada. **Nenhum produz resultado numérico.** O painel exibe “Resultado não calculado” e lista os campos com a mensagem específica.

**Regressões diretas dos defeitos da versão anterior**, todas confirmadas como corrigidas:

| Defeito | Antes | Agora |
|---|---|---|
| D-16 campo vazio | virava 0,|resultado “−R$ 18.000” | estado “vazio”, **sem resultado** |
| D-17 volume −5 | receita “−R$ 9.660” | erro, **sem resultado** |
| D-18 perda 150% | **“Resultado mensal +R$ 50.200”** | erro, **sem resultado** |
| D-19 CAPEX 0 | “Payback 0,0 anos” | “CAPEX não informado — payback não aplicável” |
| D-20 receita 0 | margem −2.433,3% | margem calculada apenas com receita > 0; caso contrário, estado explicado |
| D-21 créditos | sobre todo o volume bruto | desligados por padrão; massa elegível explícita e validada contra a massa comprovada |
| D-22 capacidade | inexistente | `18–22 kg/h → 2,88–3,52 t/mês` por equipamento em 160 h; aviso quando o volume excede; **nenhum volume ajustado** |

**Correção de bug próprio descoberta durante a execução:** editar qualquer premissa muda o estado para `"personalizado"`, que não é uma entrada de `PRESETS` — a renderização seguinte lançava `TypeError: Cannot read properties of undefined (reading 'valores')` e **quebrava o painel**. Corrigido com fallback explícito (`PRESETS[State.preset] || PRESETS.base`). Este defeito só apareceu porque os testes disparam eventos com `bubbles: true`; a primeira rodada de testes sintéticos o mascarou.

### 2.6 Operacional

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| OP-03 | Filtros e busca com estado programático | **Atendido** | 27 atores; busca “artemares” → 1; busca sem resultado → estado vazio com ação; chips com `aria-pressed` |
| OP-04 | Impressão inclui conteúdo, unidades e fontes | **Atendido** | Ver §3 |

### 2.7 Acessibilidade

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| AC-01 | Funções essenciais por teclado | **Atendido** | Skip link, navegação por link, filtros, linhas da tabela de atores (`role=button`, Enter/Espaço), barras do gráfico (`tabindex=0`) |
| AC-02 | Um `h1`, hierarquia sem salto, skip link | **Atendido** | `h1` = 1; 7 seções com `aria-labelledby`; `lang="pt-BR"` |
| AC-03 | Foco visível e nunca encoberto | **Atendido** | Anel em todos os controles; sticky medido; regiões de foco programático sem anel visual sobre o bloco inteiro |
| AC-04 | Valores de gráfico por teclado e toque, com tabela | **Atendido** | 17 barras focáveis com `aria-label` contendo ano e valor; **tooltip aparece no foco**, não só no mouse; tabela alternativa sempre presente |
| AC-05 | `prefers-reduced-motion` respeitado | **Atendido** | Bloco dedicado no CSS; nenhum movimento contínuo no painel |
| AC-06 | Contraste medido | **Atendido com correção** | Ver §3.2 |

### 2.8 Responsividade

| ID | Requisito | Resultado |
|---|---|---|
| RS-01 | Layout íntegro em 375 / 768 / 1024 / 1440 | **Atendido** |
| RS-02 | Sem overflow horizontal da página | **Atendido** — verificado também em 320, 360, 640, 1280 e 1920 |
| RS-03 | Sem corte de títulos ou indicadores | **Atendido** — rótulos refluem, `text-overflow: ellipsis` removido |
| RS-04 | Integridade em 320 px | **Atendido** |

Teste automatizado em **9 larguras × 7 áreas = 63 combinações**, medindo `scrollWidth > clientWidth`, elementos que vazam fora da viewport (ignorando containers com rolagem própria) e elementos com `scrollWidth > clientWidth` (texto cortado). **63/63 sem ocorrência.**

### 2.9 Técnica

| ID | Requisito | Resultado | Evidência |
|---|---|---|---|
| OF-01 | Funciona sem rede, em `file://`, sem build | **Atendido** | Ver §3.3 |
| OF-02 | Zero erros de console | **Atendido** | Listener ativo durante toda a validação |
| QA-01 | O que foi verificado e o que ficou pendente | **Atendido** | Este documento |

---

## 3. Verificações detalhadas

### 3.1 Cobertura de conteúdo

**50 de 50** assuntos verificados presentes no `textContent` do painel (inclui as seções ocultas). Os oito assuntos da versão anterior estão preservados e redistribuídos:

| Original | Destino no retrofit |
|---|---|
| Decisão | `visao` + `plano` |
| Dados & Insights | `mercado` |
| Bahia & Feira | `mercado` (cenários) + `territorio` (Feira) |
| Roadmap | `plano` (história setorial, secundária) |
| Cadeia | `cadeia` |
| Vantagens × Riscos | `visao` (3 riscos) + `plano` (11 trade-offs + SWOT) |
| Viabilidade | `viabilidade` |
| Fontes | `fontes` |

Nenhum assunto foi perdido. Reuniões repetidas foram consolidadas.

### 3.2 Contraste (AC-06)

Medido no DOM real com a fórmula de luminância relativa da WCAG 2.2.

| Par | Razão | Mínimo exigido |
|---|---:|---:|
| Corpo sobre fundo | 14,63:1 | 4,5:1 |
| Título `h1` | 12,18:1 | 4,5:1 |
| `h2` de bloco | 14,63:1 | 4,5:1 |
| `ink-3` sobre branco | 5,34:1 | 4,5:1 |
| `ink-3` sobre superfície rebaixada | 4,69:1 | 4,5:1 |
| `ink-3` sobre tinta de perigo | 4,68:1 | 4,5:1 |
| Rótulo de indicador | 6,40:1 | 4,5:1 |
| Natureza “estimativa” | 6,98:1 | 4,5:1 |
| Token de fonte | 7,27:1 | 4,5:1 |
| Cabeçalho de tabela | 5,63:1 | 4,5:1 |
| Navegação inativa | 6,40:1 | 4,5:1 |
| Navegação ativa | 11,06:1 | 4,5:1 |
| Chip selecionado | 12,18:1 | 4,5:1 |
| Campo de cálculo | 15,72:1 | 4,5:1 |
| Condição de gate | 15,72:1 | 4,5:1 |
| Alerta positivo | 4,95:1 | 4,5:1 |
| Branco sobre marca (chip ativo) | 12,18:1 | 4,5:1 |
| Acento sobre superfície (gráfico) | 4,95:1 | 3:1 |
| Informação sobre superfície | 7,13:1 | 3:1 |
| Aviso sobre superfície | 5,41:1 | 3:1 |
| Perigo sobre superfície | 6,57:1 | 3:1 |
| Borda de controle sobre branco | **3,46:1** | 3:1 |

**Duas correções aplicadas:**

1. **`--ink-3` reprovava.** O token da paleta inicial (`#6E7C85`) media **4,30:1** no branco e **3,77:1** na tinta de perigo — abaixo de 4,5:1. Como é a cor de denominadores, escopos e notas, isso atingia justamente o conteúdo mais crítico do retrofit. Substituído por **`#5F6D76`**, que mede 4,68:1 no pior fundo.
2. **Bordas de controle reprovavam.** `--line-strong` (`#C2CDD3`) media 1,62:1 — adequado a borda decorativa de container, insuficiente para identificar um formulário (WCAG 1.4.11). Criado **`--line-control` (`#7E8C95`)**, com 3,46:1 no branco e 3,04:1 na superfície rebaixada, aplicado a campos, busca e chips.

### 3.3 Offline (OF-01)

Verificado bloqueando **todo host que não fosse o servidor local** e recarregando:

| Verificação | Resultado |
|---|---|
| Painel inicializa | **Sim** |
| 7 áreas navegam | **Sim** |
| Calculadora produz R$ 8.240 | **Sim** |
| Capacidade 22,4 t/mês | **Sim** |
| Gráfico com 17 barras | **Sim** |
| Catálogo com 49 fontes | **Sim** |
| Tabela com 27 atores | **Sim** |
| Busca e filtros | **Sim** |
| Requisições externas tentadas | **0** |

Evidência estática complementar: **zero** elementos `<link href>`, `<script src>`, `<img src>` ou `<iframe src>` apontando para `http(s)`. O favicon é um `data:` URI embutido, o que elimina o 404 que a versão anterior produzia. Nenhuma requisição sai do arquivo.

> **Limitação registrada:** a ferramenta de navegador disponível bloqueia o protocolo `file:`. A navegação real em `file://` **não foi executada**; a equivalência foi demonstrada por (a) ausência total de subrecursos externos, (b) links de arquivos irmãos escritos de forma relativa (`relatorio_mercado_isopor_bahia.md`, `fontes_cadeia_isopor_bahia.xlsx`), (c) zero requisições externas em regime bloqueado e (d) ausência de `fetch`, `XMLHttpRequest` ou módulos ES no código. **Esta é a única verificação do conjunto que não foi feita por navegação real.**

### 3.4 Impressão (OP-04)

| Verificação | Resultado |
|---|---|
| Seções visíveis no modo impressão | **7 de 7** (a versão anterior imprimia 1 de 8) |
| Navegação e filtros ocultos | **Sim** |
| Cabeçalho de impressão com título, recorte e data de corte | **Sim** |
| Tabelas liberadas da rolagem horizontal | **Sim** |
| Contexto de impressão com cenário e premissas ativos | **Sim** (injetado no momento da ação) |

A ação está rotulada **“Imprimir / Salvar em PDF”** e chama `window.print()`. O painel **não promete geração programática de PDF**. PDF de conferência gerado em `_audit/painel-impressao.pdf`.

### 3.5 Movimento reduzido

Nenhuma animação contínua existe no painel. O único movimento é a transição de entrada da seção (fade de 200 ms), suprimida integralmente sob `prefers-reduced-motion: reduce`.

---

## 4. Defeitos encontrados na implementação e corrigidos

Todos descobertos por execução, não por leitura:

| # | Defeito | Gravidade | Correção |
|---|---|---|---|
| 1 | `--header-h` media e era usado no `min-height` do próprio cabeçalho — realimentação que levou o topo a **900 px** | Crítica | Separação em `--topbar-min` (constante), `--nav-top` e `--scroll-offset` (medidos) |
| 2 | Editar premissa → estado `"personalizado"` inexistente em `PRESETS` → `TypeError` e painel quebrado | Crítica | Fallback `PRESETS[State.preset] \|\| PRESETS.base` |
| 3 | Gráfico de aberturas sem elemento `<svg>` — as barras existiam soltas no `div` | Crítica | Involucro `<svg viewBox>` + `role="img"` + `aria-label` |
| 4 | `svgEl` referenciava `fechado` antes da declaração (`const`) | Alta | Cálculo movido para o topo da função |
| 5 | Colunas de grade sem `minmax(0,1fr)` → estouro da página até 1024 px | Alta | `minmax(0,1fr)` em `.cols`, `.calc`, `.flow`, `.chain`, `.polos`, `.kpis` |
| 6 | Barras de sensibilidade ocupavam de 50% a 150% da pista | Alta | Escala de meia-largura (máximo 50% a partir do zero) |
| 7 | `white-space: nowrap` em frase explicativa dentro de `<b>` → 530 px de largura | Alta | Classe `.rrow__why` sem `nowrap` |
| 8 | Painel de fonte renderizado dentro da Cadeia, oculto ao abrir a partir da Visão | Alta | Painel movido para a seção ativa a cada abertura |
| 9 | Anel de foco desenhado em torno da seção inteira | Média | Exclusão para regiões com `tabindex="-1"` |
| 10 | Oito elementos `h1` no documento | Média | Um `h1`; seções seguintes em `h2` |
| 11 | 8 `h1` no total porque o cabeçalho de impressão também era `h1` | Média | Convertido em parágrafo com estilo de título |
| 12 | `aria-current` não aplicado na carga inicial sem hash | Média | `init()` sempre passa por `irPara` |
| 13 | Selo do topo não encolhia em 320 px | Média | `min-width: 0` + quebra; selo ocultado no mobile |
| 14 | `nowrap` nos rótulos de badge causava overflow em 320 px | Média | `white-space: normal` + `overflow-wrap` |
| 15 | Checkbox de créditos com `<span for>` (sem efeito) | Média | Convertido em `<label for>` real |
| 16 | Hiperlink sem deslocamento para a área ativa na barra mobile | Baixa | `scrollIntoView` inline |
| 17 | Topo do mobile ocupava 130 px | Baixa | Selo de corte ocultado em ≤620 px → 87 px |
| 18 | Rótulo "3 registros não possuem URL" incorreto para o registro com link relativo | Baixa | Mensagem distingue “sem endereço” de “link relativo real” |

---

## 5. Limitações e pendências

### 5.1 Verificações não executadas

| Item | Motivo | Impacto |
|---|---|---|
| Navegação real em `file://` | Protocolo bloqueado na ferramenta de navegador | Baixo — evidência estática equivalente na §3.3 |
| Auditoria com leitor de tela real | Não disponível no ambiente | Médio — a conformidade foi verificada por estrutura semântica e rótulos, **não** por audição |
| Impressão em driver de PDF do sistema | `page.pdf()` não reproduz a quebra de página do diálogo do navegador | Baixo — as regras `@media print` foram verificadas via `emulateMedia('print')` |
| Teste em navegadores além do Chromium | Não disponíveis | Médio — não há confirmação em Firefox, Safari ou Edge |
| Avaliação de carga e desempenho sob rede lenta | Fora do escopo do retrofit | Baixo — o arquivo não faz requisições de rede |

**Este documento não declara conformidade completa com a WCAG 2.2 AA.** Declara que os requisitos aplicáveis listados foram verificados por medição ou execução direta, e que os itens da tabela acima não foram verificados.

### 5.2 Pendências de dados (não corrigíveis no painel)

1. **Localização da Proecologic** — relatório cita Ribeirão Pires/SP; planilha e painel anterior citavam Taubaté/SP. Ambas as versões estão registradas na ficha do ator. **Nenhuma foi escolhida.**
2. **Margem bruta de R$ 1,48/kg** — não reproduzível a partir das premissas do próprio painel (com venda R$ 2,10 e compra R$ 0,50 a margem é R$ 1,56/kg de saída). O valor monetário de R$ 2,7–4,0 mi/ano saiu da abertura.
3. **Emissão pós-uso** — planilha registra ponto (3.450 t/ano), relatório registra faixa (2.800–4.100 t/ano). Prevalece a faixa.
4. **Sem geometria verificada** — o diagrama territorial é esquemático, sem distâncias, rotas ou coordenadas.
5. **Nenhuma cotação, contrato ou carta de intenção** foi verificada. O painel não registra evidência de contrato.
6. **Elegibilidade de PROIND, DESENVOLVE e CCRLR** não confirmada juridicamente. Os instrumentos são apresentados como contexto declarado pelas fontes.
7. **Planilha sem fórmulas** — as sete abas foram varridas: **0 fórmulas, 0 nomes definidos, nenhuma aba de calculadora**. O relatório original afirma existir uma; a afirmação foi corrigida no painel e a planilha **não foi alterada**.
8. **Contagem duplicada no CSV da RFB** — ArcelorMittal e Gerdau aparecem duas vezes, em municípios diferentes. A métrica de capital social conta **estabelecimentos**, não empresas, e o top-10 do foco contém quatro registros duplicados. O painel declara isso na matriz de divergências.

### 5.3 Afirmações que o painel não faz

Verificadas por busca textual: o painel **não** afirma que existem ou não existem recicladoras de EPS na Bahia; **não** afirma que o investimento está aprovado; **não** apresenta a razão “66×”; **não** apresenta R$ 2,7–4,0 milhões como receita; **não** usa scores de confiança ou percentuais de progresso; **não** desenha distâncias geográficas; **não** usa fluxos quantitativos em Sankey; **não** exibe checkmarks de gate concluído.

---

## 6. Capturas de tela

| Arquivo | Conteúdo |
|---|---|
| `_audit/final-1440-visao.png` | Visão executiva, 1440 px |
| `_audit/final-1440-mercado.png` | Mercado e evidências, 1440 px |
| `_audit/final-1440-territorio.png` | Território e logística, 1440 px |
| `_audit/final-1440-cadeia.png` | Cadeia e parceiros, 1440 px |
| `_audit/final-1440-viabilidade.png` | Viabilidade, 1440 px |
| `_audit/final-1440-plano.png` | Plano e riscos, 1440 px |
| `_audit/final-1440-fontes.png` | Fontes e método, 1440 px |
| `_audit/final-375-*.png` | Todas as áreas, 375 px |
| `_audit/final-375-nav-sticky.png` | Navegação visível após rolagem no mobile |
| `_audit/base-375-nav-overlap.png` | **Evidência do defeito D-24 na versão anterior** |
| `_audit/base-1440-dados.png` | **Evidência dos percentuais sem denominador na versão anterior** |
| `_audit/painel-impressao.pdf` | Impressão, todas as áreas |

As capturas foram **inspecionadas**, não apenas geradas. As correções de `--ink-3`, bordas de controle, rótulos de sensibilidade, topo do mobile e sobreposição de cabeçalho vieram da leitura dessas imagens.

---

## 7. Conjunto de publicação

O repositório foi preparado para publicação estática no GitHub Pages.

| Item | Decisão | Verificação |
|---|---|---|
| Entrada do site | `index.html` na raiz | O GitHub Pages serve `/` a partir de `index.html` |
| Nome do entregável | `painel_isopor_bahia_retrofit.html` mantido | Exigido pela especificação |
| Duplicação | Os dois arquivos são **byte a byte idênticos** | Mesmo hash SHA-256; `tools/build.py` compara com `filecmp.cmp` e **falha o build** se divergirem |
| `.nojekyll` | Presente | Desliga o processamento Jekyll; os arquivos são servidos verbatim |
| `.gitignore` | Criado com critério: sai do versionamento apenas o que é **regenerável** ou **sensível** | 14 arquivos essenciais conferidos um a um com `git check-ignore` |
| `rfb/cache/` (3,1 MB) | Removido do índice, mantido em disco | Cache Parquet regenerável pela BigQuery; o resultado reproduzível (`rfb_agregados.json`, `rfb_players_ba.csv`) segue versionado |
| Jekyll e os `.md` | Servidos como arquivo bruto | Consistente com a premissa de site sem etapa de build |

**Verificação funcional a partir de `/index.html`** (não apenas do nome do entregável): 1 `h1` · 7 áreas · 27 atores · 49 fontes · 17 barras no gráfico · calculadora em R$ 8.240 · console sem erros. Todos os **links relativos** do painel — relatório, planilha e `rfb/rfb_agregados.json` — resolvem com status 200 a partir da raiz do site.

Nenhum arquivo de pesquisa foi alterado: `git diff HEAD` sobre `painel_isopor_bahia.html`, os três formatos do relatório, a planilha, os scripts de `rfb/` e o JSON agregado retorna **vazio**.

| Dimensão | Resultado |
|---|---|
| Asserções de cálculo (Node) | **147 / 147** |
| Verificações de interface (Chromium) | **todas aprovadas** |
| Combinações largura × área | **63 / 63 sem defeito** |
| Erros de console | **0** |
| Requisitos de conteúdo | **50 / 50 presentes** |
| Contraste | **aprovado após 2 correções** |
| Defeitos encontrados e corrigidos durante a execução | **18** |
| Verificações não executadas | **5**, todas listadas em §5.1 com motivo |

O painel está apto a apoiar a discussão de investimento, **com a ressalva explícita de que a recomendação é condicional**: os três *gates* iniciam no estado “não verificado” e nenhuma evidência de contrato, cotação ou conclusão de gate foi representada.