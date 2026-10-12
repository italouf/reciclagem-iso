# Diagnóstico — Retrofit do Painel de Inteligência de Mercado (EPS/Bahia)

**Data do diagnóstico:** 12/10/2026
**Alvo:** `painel_isopor_bahia.html` (823 linhas, 66.833 bytes, commit `1fee1a7`)
**Método:** leitura integral das 5 fontes + auditoria estática do HTML + renderização real em navegador headless (Chromium/Playwright) em 1440 px e 375 px + execução de cenários de erro sobre a calculadora existente.

> Nenhum arquivo de pesquisa foi alterado. O diagnóstico é de leitura apenas.

---

## 1. Ambiente e limites da auditoria

| Item | Resultado |
|---|---|
| Renderização | Realizada via `http://127.0.0.1:8765` (servidor estático local). O protocolo `file:` está bloqueado na ferramenta de navegador disponível. **Pendência registrada:** a validação em `file://` foi feita por inspeção estática de dependências (zero `<link>`, `<script src>`, `<img src>` ou `@import` externos), não por navegação real. |
| Erros de console | 1: `favicon.ico` 404. Sem erros de JS. |
| Fontes de UI/UX Pro Max | Skill não instalada no ambiente; repositório oficial obtido e `search.py` executado a partir de cópia em diretório temporário. Ver §6 do plano. |

---

## 2. Problemas confirmados por evidência

Formato: **Problema → efeito para o usuário → intervenção → forma de verificar.**
IDs `D-xx` são referenciados em `spec.md` e `validacao.md`.

### 2.1 Hierarquia e leitura executiva

**D-01 — Todos os blocos têm peso visual equivalente.**
Evidência: `_audit/base-1440-dados.png`. Título de seção (`h2`, 16,5 px), corpo (13,5 px), rótulo de card (12,5 px) e nota (12,5 px) formam uma escala quase plana. Cards, tabelas e blocos de breakdown compartilham a mesma borda `#e5e7eb`, o mesmo raio 12 px e o mesmo padding 16–18 px.
→ *Efeito:* o leitor executivo não distingue recomendação, evidência, premissa e detalhe. A "interpretação" e a "ação" — o conteúdo de maior valor do painel — têm o mesmo destaque visual do dado bruto.
→ *Intervenção:* escala tipográfica com degraus reais; separação por **função** (editorial / analítico / tabular / metodológico) e não por componente uniforme; reduzir o número de cards e usar espaço em branco como separador.
→ *Verificar:* screenshot das 7 áreas + revisão de contraste/escala.

**D-02 — Não existe `h1`.**
Evidência: `document.querySelectorAll('h1').length === 0`. O primeiro heading do `main` é um `h2` ("Avançar na Fase 0 agora…").
→ *Efeito:* sem título principal, leitores de tela anunciam a página sem nome; a hierarquia de títulos é inválida (WCAG 1.3.1 / 2.4.6).
→ *Intervenção:* `h1` único com o título do estudo + recorte + data de corte.
→ *Verificar:* `querySelectorAll('h1').length === 1` e ordem de headings sem salto.

**D-03 — Verde institucional aplicado indistintamente a "ação" e a destaque.**
Evidência: `.tile .act { color: var(--green-text) }` e `.ins .act { color: var(--green-text) }`; badge `.b-alta` verde.
→ *Efeito:* o verde sugere aprovação/aprovado. Ações recomendadas e indicadores positivos ficam visualmente indistinguíveis, e um gate **não verificado** pode ser lido como concluído.
→ *Intervenção:* separar o verde institucional (identidade) do verde de resultado; estados neutros "não verificado" com rótulo textual e borda, nunca com checkmark verde.
→ *Verificar:* inspeção de cores por estado + teste de contraste.

**D-04 — Cinco indicadores na abertura competem entre si.**
Evidência: `.g5` com 5 tiles na primeira tela; a paleta de 4 indicadores do briefing exige no máximo 4.
→ *Efeito:* dilui a recomendação.
→ *Intervenção:* 4 indicadores escolhidos por contribuição à decisão; os demais descem para a área correspondente.
→ *Verificar:* contagem de indicadores na abertura.

---

### 2.2 Integridade numérica e de evidência

**D-05 — "Capital social do foco: R$ 43,9 bi" e "top-10 = 76,6%" divergem da fonte.**
Evidência: `rfb/rfb_agregados.json → ba.capital_social_foco_R = 72.529.939.055,82` (R$ 72,53 bi). Recálculo sobre `rfb/rfb_players_ba.csv` (4.222 linhas) → **top-10 = 79,8%**. O top-10 real inclui ArcelorMittal (×2), Gerdau (×2), Ball, Top Service, BTG Pactual Commodity Trading, Novelis, Veolia e P&G.
→ *Efeito:* o painel atribui a empresas que não estão na base e subestima a concentração. Além disso, o CSV revela **CNPJs duplicados** (ArcelorMittal e Gerdau aparecem duas vezes, em municípios diferentes): o "foco" conta *estabelecimentos*, não empresas, e o capital social é inflado por duplicação de matriz/filial.
→ *Intervenção:* usar R$ 72,53 bi e 79,8%; expor que 4 dos 10 maiores vêm de dois CNPJs duplicados; marcar capital social como "não é faturamento" (limite já declarado na pesquisa, mas não aplicado a este número).
→ *Verificar:* recálculo independente do CSV (reproduzido em `validacao.md`).

**D-06 — Participações calculadas sobre subconjuntos, apresentadas como se fossemuniversais.**
Evidência: `breakdown()` (`painel_isopor_bahia.html:644-655`) calcula `pct = 100*v/total` onde `total` é a **soma das linhas exibidas**.
Consequências visíveis em `_audit/base-1440-dados.png`:
- "Ranking nacional" → SP 52,7%, BA 7,6% — denominator = soma das 10 UFs exibidas (207.994). Lido como "SP tem 52,7% do Brasil".
- "Municípios-alvo" → Salvador 49,0%, Feira 23,2% — denominator = soma dos 7 municípios do foco (4.222). Título diz "Municípios-alvo", sugerindo proporção estadual.
→ *Efeito:* contradição **na mesma tela**: o tile afirma "5,85% do Brasil" e o ranking afirma "7,6%".
→ *Intervenção:* todo percentual passa a exibir o denominador por extenso; ranking de UF passa a usar o total nacional (276.898) ou a ser rotulado explicitamente como "share entre as 10 UFs exibidas".
→ *Verificar:* teste de consistência de denominadores + conferência contra `rfb_agregados.json`.

**D-07 — Ranking de UF usa uma contagem de BA diferente da contagem de BA dos demais blocos.**
Evidência: `uf: [...,["BA",15781],...]` vs. `ativos_por_cnae_principal_ou_secundaria: 16204`. `rfb_agregados.json` confirma ambos: `nacional.BA = 15781` e `ba.ativos_… = 16204`.
Consequência: `15781 / 276898 = 5,70%`, mas a planilha e o painel publicam **5,85%** — que é `16204 / 276898`. O número 5,85% está associado a um numerador diferente do exibido no ranking.
→ *Efeito:* o mesmo indicador aparece com dois valores e duas bases de comparação sem explicação.
→ *Intervenção:* apresentar as três grandezas separadamente e nomeadas (estabelecimentos-BA, CNPJ-BA no recorte nacional, total nacional), sem derivar participação nacional de bases mistas.
→ *Verificar:* matriz de reconciliação.

**D-08 — Decomposição setorial reconcilia com o escopo amplo, não com o núcleo.**
Evidência: `12354 + 1129 + 961 + 781 + 576 + 335 + 68 = 16.204` (escopo amplo). O **núcleo** declarado é 3.754.
→ *Efeito:* o rótulo "Ativos por setor na BA (escopo amplo: 16.204)" está correto, mas o painel não explicita que as fatias setoriais (coleta, recuperação, sucata) são CNAE **principal** e, portanto, somam apenas parte do escopo amplo — o que faz o leitor somar "Coleta 1.129 + Recuperação 961 + …" contra o núcleo e não fechar.
→ *Intervenção:* expor o cruzamento duplo (escopo amplo × núcleo × CNAE principal) e a reconciliação aritmética explícita.
→ *Verificar:* soma das linhas = 16.204 e nota de reconciliação presente.

**D-09 — "Nenhuma recicladora de EPS no estado" é afirmação absoluta não sustentada.**
Evidência: HTML linhas 143 (relatório), 210, 248, 447. A base cadastral não nomeia material — CNAE 38.32-7 é "recuperação de materiais plásticos" e não isola EPS; a base cobre apenas o formal e uma partição trimestral (11/01/2026).
→ *Efeito:* um investidor pode tratar a ausência como fato verificado. A pesquisa já declara o limite; o painel o omite no ponto de maior impacto.
→ *Intervenção:* formulação "Não foram identificados operadores especializados em EPS no levantamento realizado (CNAE não isola o material; base formal; partição 11/01/2026)", com a limitação visível no mesmo bloco.
→ *Verificar:* busca por "nenhuma recicladora"/"zero players" sem contexto de limitação.

**D-10 — Demanda de plásticos gerais apresentada junto de uma tese de EPS.**
Evidência: os **332 t/mês** são "plásticos recicláveis, ~20 tipos de material" [S-07]. A participação de PS/EPS é um passo adicional de extrapolação (12,8% do processamento nacional [S-06] → "~400–510 t/ano"), declarado como "estimativa própria".
→ *Efeito:* o indicador mais destacado da abertura aparenta medir demanda de EPS.
→ *Intervenção:* sempre exibir "plásticos recicláveis (não só EPS)" + a derivação de PS/EPS separada, marcada como extrapolação com hipótese explícita.
→ *Verificar:* cada ocorrência de 332 t/mês exibe o material e a fonte.

**D-11 — Razão de "~66×" não é demonstrável.**
Evidência: 3.984 t/ano (demanda de plásticos de ~20 tipos, 10 de 30 indústrias, extrapolation `×12`) ÷ 60 t/ano (todos os materiais, todos os cooperativos, Feira, 2025). A pesquisa também registra Artemares >60 t/mês (todos os materiais) e CCRBA ~210 t/mês.
→ *Efeito:* a razão é aritmeticamente correta e **materialmente enganosa** —Diferentes materiais, populações, geographies e bases de medição. Ocupa o parágrafo de abertura da versão atual.
→ *Intervenção:* apresentar os indicadores **separadamente**, cada um com escopo, e substituir a razão por uma comparação de escopos explicitamente não equivalentes. Preservar a comparação original na documentação da revisão.
→ *Verificar:* a razão "66" não aparece como destaque executivo; a comparação original consta em `dados-e-evidencias.md`.

**D-12 — "R$ 2,7–4,0 mi/ano" tem significado econômico ambíguo e margem não reproduzível.**
Evidência: o tile declara "oferta não atendida × margem bruta de R$ 1,48/kg". Reprodução: 1.800 t × 1,48 = R$ 2,66 mi e 2.700 t × 1,48 = R$ 4,00 mi — bate com a faixa. Mas **R$ 1,48/kg não é reproduzível** a partir das premissas do próprio painel: com venda 2,10 e compra 0,50, a margem por kg de saída é 1,56 e por kg de entrada 1,43.
→ *Efeito:* um número monetário que não é receita projetada, nem faturamento capturável, nem TAM em receita, aparece como o segundo indicador da abertura.
→ *Intervenção:* manter o valor apenas como **faixa de valor anual do material não reciclado × margem unitária assumida**, com a premissa de R$ 1,48/kg explicitada como premissa não reconciliada, e removê-lo da abertura.
→ *Verificar:* rótulo contém "não é receita projetada"; a premissa consta como pendência aberta.

**D-13 — Prazos de gate divergem do título executivo.**
Evidência: o `h2` diz "3 gates em 90 dias"; a tabela lista G3 (Incentivos) com **120 dias** (linha 220).
→ *Efeito:* o leitor retém "90 dias" e não vê que a validação de incentivos é mais longa.
→ *Intervenção:* "Validações comerciais em 90 dias (G1, G2); validação de incentivos em até 120 dias (G3)", mantendo os prazos originais.
→ *Verificar:* título e tabela coerentes; prazos originais preservados.

**D-14 — Referência a "aba Calculadora" da planilha.**
Evidência: `relatorio_mercado_isopor_bahia.md:370` afirma que os valores "podem ser recalculados no painel … e na aba 'Calculadora' da planilha". Inspeção do XLSX: abas presentes são `Fontes, RFB_Cadeia, Players_Roadmap, Fornecedores, Clientes, Premissas, Decisao` — **não existe aba Calculadora**; e a varredura de todas as células retornou **0 fórmulas** e **0 nomes definidos**.
→ *Efeito:* promessa de funcionalidade inexistente. O HTML atual não repete o erro (diz apenas "aba Premissas"), mas a pendência precisa estar visível no painel.
→ *Intervenção:* nota explícita de que a planilha é cadastro de valores e **não** contém fórmulas; toda a simulação roda no painel. Não alterar o XLSX.
→ *Verificar:* varredura de fórmulas = 0 registrada; nota presente.

**D-15 — Divergências de atores.**
Evidência:
- **Proecologic**: relatório §4.3 "fábrica em Ribeirão Pires/SP"; XLSX `Players_Roadmap!P7` "Taubaté/SP"; HTML linha 384 "Taubaté/SP".
- **Isobras**: capital social/cnpj listed; razão social "ISOBRar" (HTML) vs "ISOBRAR" (XLSX) — grafia divergente para a mesma empresa.
- **Duplicidade estrutural**: P1 "Knauf Isopor®" e P21 "Knauf Isopor (CNPJ confirmado RFB)" são o mesmo ator; P3 "Isobras" e P22 "ISOBRAR" idem; P4 "Isobahia" e P23 "ABS Poliestireno" idem; P8 "Realce" e P16 "Realce/indústrias do Sebrae" se sobrepõem; P14 "CATA BAHIA / CCRBA" mistura federação e central.
→ *Efeito:* contagem de atores inflationada; a mesma empresa aparece como dois parceiros.
→ *Intervenção:* identificadores internos estáveis, um registro por entidade, com `aliases` preservando os identificadores legados por arquivo de origem.
→ *Verificar:* IDs únicos; aliases de S-01/S-20/S-42 presentes.

---

### 2.3 Calculadora — falhas funcionais confirmadas por execução

Todos os casos abaixo foram executados no navegador contra a implementação atual (`painel_isopor_bahia.html:707-756`).

**D-16 — Campo vazio vira zero silenciosamente.**
Evidência: `volume = ''` → resultado "Resultado mensal **−R$ 18.000**, Margem 0,0%, Payback: não recupera". Um campo em branco produz um resultado apparently legítimo.
→ *Intervention:* campo vazio = estado inválido explícito, valor digitado preservado, sem resultado.
→ *Verificar:* caso `CL-02/vazio`.

**D-17 — Volume negativo produz receita negativa "plausível".**
Evidência: `volume = -5` → "Receita com material densificado **−R$ 9.660**", "Resultado mensal −R$ 24.860".
→ *Efeito:* número sem sentido econômico apresentado em formato normal.
→ *Intervenção:* validação de domínio (volume > 0).
→ *Verificar:* caso `CL-02/negativo`.

**D-18 — Perda > 100% produz resultado positivo e inflado. (Falha mais grave.)**
Evidência: `perda = 150` → "Receita com material densificado −R$ 21.000", "Resultado mensal **+R$ 50.200**". Uma entrada impossível gera o melhor resultado da simulação.
→ *Efeito:* um erro de digitação inverte o veredito de viabilidade.
→ *Intervenção:* perda limitada a 0–100%, erro adjacente ao campo, resultado suprimido.
→ *Verificar:* caso `CL-02/perda`.

**D-19 — CAPEX zero produz "Payback 0,0 anos".**
Evidência: `capex = 0` → "Payback do CAPEX **0,0 anos**".
→ *Intervenção:* estado explicado ("sem CAPEX informativo — payback não aplicável").
→ *Verificar:* caso `CL-02/capex`.

**D-20 — Receita zero produz margem sem significado.**
Evidência: `venda = 0` → "Margem sobre receita **−2433,3%**".
→ *Intervenção:* margem calculada apenas com receita > 0; caso contrário, estado explicado.
→ *Verificar:* caso `CL-02/receita-zero`.

**D-21 — Créditos calculados sobre o volume bruto de entrada.**
Evidência: `receitaCred = vol * ccrlr` (linha 721) usa os 20 t inteiros, sem qualquer massa elegível declarada.
→ *Efeito:* toda a matéria recebida é tratada como monetizável por CCRLR.
→ *Intervenção:* massa elegível explícita, ≤ massa comprovada, desligada por padrão; resultado sem créditos como referência inicial.
→ *Verificar:* casos `CL-01`.

**D-22 — Nenhuma verificação de capacidade.**
Evidência: a calculadora inicia em **20 t/mês**; a pesquisa cita equipamentos de **18–22 kg/h** [S-35][S-36]. A 160 h/mês isso equivale a 2,88–3,52 t/mês por equipamento.
→ *Efeito:* a simulação padrão representa ~6–7× a capacidade de um equipamento de referência, apresentada sem ressalva.
→ *Intervenção:* fórmula `capacidadeMensalTon = kg/h × horas × qtd × utilização ÷ 1000`, aviso explícito quando o volume desejado exceder a capacidade, e separação entre "resultado econômico do volume desejado" e "compatibilidade operacional".
→ *Verificar:* caso `OP-01`.

**D-23 — Números de referência conferem (baseline de regressão).**
Evidência: com 20 t, 8%, R$ 0,50, R$ 2,10, R$ 275.000, R$ 18.000, R$ 120/t, R$ 60/t: saída 18.400 kg; receita material R$ 38.640; créditos R$ 1.200; receita R$ 39.840; custo R$ 30.400; resultado R$ 9.440; margem 23,7%; payback 2,4 anos. Sem créditos: R$ 38.640 / R$ 8.240 / 2,8 anos.
→ *Conclusão:* a aritmética-base está correta e serve de contrato de regressão.
→ *Verificar:* `CL-01` com 8 casas.

---

### 2.4 Interações, responsividade e acessibilidade

**D-24 — Navegação desaparece ao rolar no mobile.**
Evidência (medida, 375 px): `.topbar` tem **139,5 px** de altura após o wrap; `nav.tabs` tem `position:sticky; top:52px`. Com `scrollY = 900`, `nav.getBoundingClientRect().top = 52` enquanto `topbar.bottom = 139,5`. Screenshot `_audit/base-375-nav-overlap.png`: a barra de navegação **não está visível**.
→ *Efeito:* em celular o usuário perde a navegação ao rolar e não há como voltar a outra área. Corresponde ao anti-padrão "sticky header cobre o foco" (WCAG 2.2, Focus Not Obscured).
→ *Intervenção:* (a) navegação lateral no desktop; (b) no mobile, barra compactawhose offset é medido por JS real, nunca constante; (c) `scroll-padding-top` coerente.
→ *Verificar:* `RS-01` + `NV-01`.

**D-25 — Handlers dependem de `e.target` sendo o próprio botão.**
Evidência: `if(e.target.tagName!=='BUTTON') return;` em `nav`, `cenario` e `chips-f`.
→ *Efeito:* ao inserir um ícone, `<span>` ou badge dentro do botão, o clique passa a ser ignorado silenciosamente.
→ *Intervenção:* `event.currentTarget` / `closest('button')`.
→ *Verificar:* teste com elemento filho clicável.

**D-26 — Tooltip depende exclusivamente de `mousemove`.**
Evidência: `svgEl.addEventListener('mousemove', …)` (linha 631). Não há `focus`, `touch` nem equivalente de teclado.
→ *Intervenção:* a11y: cada valor do gráfico acessível por teclado e toque, com tabela alternativa obrigatória.
→ *Verificar:* `AC-01`.

**D-27 — Gráfico sem alternativa textual de dados.**
Evidência: `role="img"` com `aria-label` descrevendo a tendência, mas 16 valores inacessíveis.
→ *Intervenção:* `<details>`/tabela equivalente sempre disponível.

**D-28 — Rótulos de barras ilegíveis quando a barra é pequena.**
Evidência: `_audit/base-375-nav-overlap.png`, linhas de sensibilidade: o texto branco `R$ -11.140/mês` ultrapassa a barra colorida (60 px) e é pintado sobre o trilho cinza claro. Legível apenas como "R$ -8...".
→ *Efeito:* valores ilegíveis exatamente nas linhas mais críticas (negativos e próximos do equilíbrio).
→ *Intervenção:* rótulo fora da barra quando a barra não comporta o texto; área de rótulo com contraste garantido.

**D-29 — Negativos desenhados como barras positivas.**
Evidência: `var col = r.m>=0 ? verde : vermelho` com `width = |m|/max` ancorado à esquerda — a geometria é idêntica; só a cor distingue.
→ *Intervenção:* eixo em zero real, barras à direita/esquerda do zero, valor sempre visível e prefixado.

**D-30 — Rótulos truncados por CSS.**
Evidência: `.bd .row .nm { text-overflow:ellipsis; white-space:nowrap }`. "Outro CNAE (entrou por secundária)" e "Santo Antônio de Jesus" cortam em larguras menores.
→ *Intervenção:* reflow em vez de truncamento; se inevitável, caminho acessível ao valor completo.

**D-31 — Fonte com duas URLs gera `href` inválido.**
Evidência: `S-42` → `href="https://basedosdados.org.br | https://dadosabertos.rfb.gov.br/CNPJ/"` (medido). O clique navega para uma URL inválida.
→ *Intervenção:* uma linha por URL, com rótulo; registros sem URL → "material não disponibilizado".

**D-32 — Nenhum endereço compartilhável.**
Evidência: `location.hash === ''` após navegação; sem `pushState`, sem link profundo, sem `aria-current`.
→ *Efeito:* sem "voltar" do navegador entre áreas; impossível citar uma área específica; o botão "voltar" do mobile fecha a página.
→ *Intervenção:* `history.pushState` + `hashchange` + link por área + `aria-current="page"`.

**D-33 — Sem estilos de impressão.**
Evidência: `printStyles = 0` (regras `@media print` na folha existente). Apenas a aba ativa (`section.active`) é impressa; as outras sete são `display:none`.
→ *Efeito:* "Imprimir" perde 7 de 8 áreas, os gráficos e as fontes.
→ *Intervenção:* `@media print` que expõe todas as seções, inclui premissas/cenário/unidades/data de corte e uma lista de fontes.

**D-34 — Filtros sem estado programático.**
Evidência: chips com `.on` puramente visual, sem `aria-pressed`.
→ *Intervenção:* `<button aria-pressed>`.

**D-35 — Alvos de toque pequenos.**
Evidência: `.chips button { padding:5px 13px; font-size:12.5px }` ≈ 28 px de altura — abaixo dos ~44 px desejados.

---

### 2.5 Cobertura de conteúdo

**D-36 — Oito áreas, sem rastreabilidade direta.**
Evidência: `[S-nn]` aparece como **texto puro** em todo o painel (nenhum link); apenas a tabela de fontes tem links. 49 registros, 47 links.
→ *Efeito:* não é possível ir da afirmação até a fonte e voltar — `EV-01` não atendido.
→ *Intervenção:* token `[S-07]` clicável em toda a ocorrência, abrindo o registro correspondente e preservando o ponto de retorno.

**D-37 — Nota do gráfico cita uma barra que não existe.**
Evidência: a nota diz "2026 parcial (43 aberturas até a partição de 11/01/2026)", mas `DATA.aberturas` termina em 2025.
→ *Intervenção:* incluir 2026 marcado como parcial, ou corrigir a nota.

**D-38 — Rótulos de eixo ambíguos.**
Evidência: eixo X mostra `ano.slice(2)` → "10", "12", … "24".
→ *Intervenção:* anos completos em mobile; anos abreviados apenas com prefixo "20" explícito.

**D-39 — Referência a arquivos irmãos sem link.**
Evidência: rodapé cita `relatorio_mercado_isopor_bahia` e `fontes_cadeia_isopor_bahia.xlsx` como texto.
→ *Intervenção:* links relativos reais, com graceful degradation se o arquivo não estiver ao lado.

---

## 3. Problemas que **não** se confirmaram

Registrados para não gastar ciclos:

| Alegação | Verificação | Resultado |
|---|---|---|
| "0 / 140 recuperadores no foco" seria infundado | `rfb_players_ba.csv`, CNAE 3832700 | **Confirmado e correto**: 140 (Salvador 64, Feira 34, V. da Conquista 22, Simões Filho 17, C. do Jacuípe 2, SAJ 1). Porte: 133 ME / 5 EPP / 2 DEMAIS = **95% ME**. Falta apenas explicitar o denominador "foco = 7 municípios". |
| "2.377 de 4.222 desde 2019" e "56%" | CSV | **Confirmados**: 2.377 / 4.222 = 56,3%. |
| Escala `main` muito estreita | inspeção | 1180 px é adequado ao volume de informação; mantido com largura maior no retrofit. |
| Overflow horizontal da página no mobile | medido | `scrollWidth == clientWidth`. As tabelas rolam dentro de `.tbl-wrap` corretamente. **Manter**. |

---

## 4. Riscos de conteúdo confirmados que **não** são falha do painel

Registrados como pendência de dados, sem correção no painel:

1. `emissao pós-uso`: XLSX `Premissas!C3 = 3450 t/ano` (ponto) vs. relatório "2.800–4.100 t/ano" (faixa). Faixa é a informação mais honesta; será exibida como faixa, com o ponto da planilha identificado.
2. `consumo`: XLSX base 7.600 vs. relatório 6.900–8.300.
3. Proecologic: Ribeirão Pires/SP (relatório) vs. Taubaté/SP (planilha e HTML).
4. "Margem bruta de R$ 1,48/kg" não reproduzível (D-12).
5. Portaria 1.561/2026 e "Finor" aparecem na planilha sem detalhe de URL equivalente no relatório.
6. Não há geometria/coordenações verificadas para mapa → **diagrama territorial esquemático**, conforme briefing §8.3. Nenhuma distância ou rota desenhada.

---

## 5. Resumo de prioridades

| Prioridade | IDs | Motivo |
|---|---|---|
| **P0 — corrigir antes de apresentar** | D-05, D-06, D-07, D-09, D-11, D-12, D-16…D-22 | Integridade numérica e de evidência; erro de cálculo capaz de inverter o veredito |
| **P1 — corrigir no retrofit** | D-01, D-02, D-13, D-15, D-24, D-26, D-28, D-31, D-32, D-33 | Leitura executiva, navegação, rastreabilidade, impressão |
| **P2 — melhorar** | D-03, D-04, D-08, D-25, D-27, D-29, D-30, D-34…D-39 | Robustez, polimento, acessibilidade |
| **Documentar como pendência** | D-14, D-36 (parcial), §4 | Falta de dado, não de código |

**Nenhum dos problemas acima exige nova pesquisa de mercado.** Todos são de representação, cálculo ou interface.