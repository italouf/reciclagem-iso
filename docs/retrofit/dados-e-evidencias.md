# Dados e Evidências — Contratos, Reconciliação e Matriz de Divergências

**Data:** 12/10/2026
**Finalidade:** servir de fonte-verdade para `painel_isopor_bahia_retrofit.html`. Toda alteração de valor neste documento deve refletir uma fonte citada.

---

## 1. Precedência de fontes aplicada

Conforme o briefing §2, nenhum arquivo é superior em todos os assuntos. Precedência adotada:

| Assunto | Fonte autoritativa | Regra |
|---|---|---|
| Contexto, metodologia, redações analíticas | `relatorio_mercado_isopor_bahia.md` | Preferido |
| Valores tabulados, premissas, cadastros de atores e fontes | `fontes_cadeia_isopor_bahia.xlsx` | Preferido |
| Comportamento e fórmulas implementadas | `painel_isopor_bahia.html` | Preferido **apenas** para aritmética já verificada |
| Números de mercado substantivos | `rfb/rfb_agregados.json`, `rfb/rfb_players_ba.csv` | Preferido sobre qualquer resumo — é o dado bruto reproduzível |
| Afirmações de terceiros | fonte citada `[S-nn]` | Conforme disponibilidade |

`.docx` e `.pdf` não foram usados como fonte de valores: são versões documentais do `.md`. Divergência pontual entre `.md` e `.pdf` deve ser resolvida no `.md`.

---

## 2. Matriz de reconciliação (EV-02)

**Legenda:** ✅ convergente · ⚠️ divergente (decisão registrada) · ⛔ não demonstrável (removido do destaque)

### 2.1 Indicadores cadastrais — universos diferentes

| ID | Grandeza | Valor | Universo / unidade de contagem | Fonte | Status |
|---|---|---:|---|---|---|
| K-01 | Estabelecimentos ativos no escopo amplo, BA | **16.204** | 19 subclasses CNAE, principal **ou** secundária, situação ATIVA, partição 11/01/2026 | `rfb_agregados.json → ba.ativos_por_cnae_principal_ou_secundaria` | ✅ |
| K-02 | Núcleo, BA | **3.754** | CNAE **principal** no escopo | `ba.ativos_cnae_principal_no_escopo` | ✅ |
| K-03 | Participação da BA (planilha/painel) | **5,85%** | `16.204 ÷ 276.898` | XLSX `RFB_Cadeia!C7` | ⚠️ ver D-07 |
| K-04 | Contagem de BA no ranking nacional | **15.781** | recorte `nacional` do JSON | `nacional.BA` | ⚠️ ver D-07 |
| K-05 | Participação implícita de K-04 | **5,70%** | `15.781 ÷ 276.898` | derivado | ⚠️ ver D-07 |
| K-06 | Total nacional | **276.898** | soma das 27 UFs do JSON | `nacional_total_ativos` | ✅ |
| K-07 | Recuperadores de plásticos ativos, BA | **335** | CNAE 38.32-7 principal | `achados.recuperadores_plasticos_ativos_BA` | ✅ |
| K-08 | Recuperadores de plásticos, Feira | **34** | CNAE 38.32-7 | `achados.recuperadores_plasticos_Feira` | ✅ |
| K-09 | Recuperadores de plásticos, foco de 7 municípios | **140** | CSV, CNAE 3832700 principal | `rfb_players_ba.csv` | ✅ (novo rótulo obrigatório) |
| K-10 | Núcleo, Feira de Santana | **324** | CNAE principal | `validacoes.feira_nucleo` | ✅ |
| K-11 | Ativos no escopo amplo, Feira | **980** | principal ou secundária | `por_municipio_foco` | ✅ |
| K-12 | Aberturas na cadeia, BA | **450 (2010) → 1.666 (2025)** | `ativa` por ano de início | `aberturas_ba_por_ano` | ✅ (+270%) |
| K-13 | Aberturas 2026 | **43** | parcial, até 11/01/2026 | `aberturas_ba_por_ano["2026"]` | ⚠️ nota citava barra inexistente |
| K-14 | Taxa histórica de baixa | **26,4%** | baixadas ÷ escopo | `achados.taxa_baixa_historica` | ✅ |
| K-15 | Porte BA (ME / EPP / demais) | **12.538 / 2.036 / 1.630** | escopo amplo, soma 16.204 | `ba.por_porte` | ✅ |
| K-16 | Capital social do foco | **R$ 72,53 bi** | soma `capital_social` do CSV | `ba.capital_social_foco_R` | ⛔ HTML dizia R$ 43,9 bi |
| K-17 | Concentração top-10 do foco | **79,8%** | 10 maiores ÷ total | recálculo do CSV | ⛔ HTML dizia 76,6% |
| K-18 | Estabelecimentos do foco desde 2019 | **2.377 / 4.222 (56,3%)** | `data_inicio_atividade ≥ 2019` | recálculo do CSV | ✅ |
| K-19 | Players do mapeamento manual confirmados | **5 / 5** | verificação cruzada | `validacoes.taxa_cobertura_mapeamento_manual` | ✅ |

### 2.2 Reconciliação aritmética obrigatória

```
A. Decomposição setorial → ESCOPO AMPLIO
   12.354 + 1.129 + 961 + 781 + 576 + 335 + 68 = 16.204  ✓ (= K-01)
   → a decomposição NÃO reconcilia com o núcleo (3.754). Exibir as duas bases.

B. Ranking de UF
   denominator incorreto usado na versão atual = 207.994 (soma das 10 UFs exibidas)
   denominator correto (nacional)              = 276.898
   → todo percentual de UF passa a citar o denominador.

C. Município
   soma dos 7 municípios do foco = 4.222 = número de linhas do CSV ✓
   → "72,2% em Salvador + Feira" é share do FOCO, não do estado.
   Salvador 2.068 + Feira 980 = 3.048 ÷ 4.222 = 72,2%

D. Participação nacional da BA
   16.204 ÷ 276.898 = 5,85%  (num establishments)
   15.781 ÷ 276.898 = 5,70%  (num outro recorte)
   → as duas não se combinam. Nenhuma é "a" participação da Bahia.
```

### 2.3 Série histórica de aberturas (2010–2026)

Fonte: `rfb_agregados.json → aberturas_ba_por_ano[*].ativa`. É a **única** base que deve alimentar o gráfico. Não inventar interpolações.

| Ano | 2010 | 2011 | 2012 | 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026\* |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Aberturas | 450 | 484 | 441 | 561 | 452 | 485 | 536 | 665 | 670 | 790 | 931 | 1.330 | 1.183 | 1.248 | 1.349 | 1.666 | 43 |

\* **2026 parcial** — apenas até a partição de 11/01/2026. Deve ser exibido com padrão visual distinto e rótulo explícito, nunca comparado a anos fechados.

### 2.4 Mercado — cenários de EPS na Bahia

| Cenário | Consumo (t/ano) | Emissão pós-uso (t/ano) | Reciclado a 34,5% (t/ano) | Oferta não atendida (t/ano) |
|---|---|---|---|---|
| Conservador (fatia pelo PIB ~3,5%) | 3.500 – 4.200 | 1.400 – 2.100 | 480 – 720 | 700 – 1.400 |
| **Base (fatia populacional ~6,9%)** | **6.900 – 8.300** | **2.800 – 4.100** | **960 – 1.400** | **1.800 – 2.700** |
| Otimista (expansão NE) | até 9.000 | até 4.500 | até 1.550 | até 2.950 |

⚠️ **Faixa, não ponto.** A planilha `Premissas` registra pontos (3.500 / 7.600 / 9.000 e 1.400 / 3.450 / 4.500). A faixa do relatório é a informação mais honesta e prevalece na apresentação; o ponto da planilha fica identificado como **valor representativo** quando um valor único for necessário, sempre rotulado.

⚠️ **Natureza**: `estimativa própria` por extrapolação. Não há estudo público dimensionando EPS exclusivamente para a Bahia. Todas as linhas carregam `evidenceType: "estimativa"`.

### 2.5 Demanda industrial — o ponto que mais exige disciplina

| ID | Afirmação | Valor | O que **é** | O que **não** é** |
|---|---|---|---|---|
| D-01 | Demanda de recicláveis em Feira e região | **332 t/mês** | Plásticos recicláveis, ~20 tipos, 10 de 30 indústrias acompanhadas pelo Sebrae, ago/2026 [S-07] | Demanda de EPS |
| D-02 | Demanda potencial anual | **3.984 t/ano** | `332 × 12` — multiplicação linear, não medida | Fluxo anual efetivamente contratado |
| D-03 | Parcela de PS/EPS | **~400–510 t/ano** | Extrapolação: 3.984 × 12,8% (participação de PS/EPS no processamento nacional [S-06]) | Medida de demanda de EPS na Bahia |
| D-04 |oferta local de recicláveis, Feira | **60 t** em 2025 | **Todos os materiais** somados, cooperativas do município, 1º ano da Sesp [S-08] | Volume de EPS |
| D-05 | Artemares | **> 60 t/mês** | Plástico, papel e metal somados; >100 recicladores [S-31] | Volume de EPS |
| D-06 | CCRBA (Salvador) | **~210 t/mês** | 6 organizações, todos os materiais [S-09b] | Volume de EPS |

⛔ **A razão "~66×" (3.984 ÷ 60) foi removida do destaque executivo.** Material, geografia, população e base de medição não coincidem, e D-05/D-06 mostram que a oferta real é maior que 60 t. A comparação original fica registrada aqui como **referência histórica da pesquisa**, não como achado.

### 2.6 Atores — identificadores estáveis e aliases legados

Cada entidade é **um** registro. Os identificadores legados por arquivo de origem são preservados em `aliases`.

| ID interno | Nome institucional | Papel | Município | Prontidão¹ | Aliases legados |
|---|---|---|---|---|---|
| A-01 | Knauf Isopor® | Produtora de EPS + PEV de coleta | Simões Filho/BA | Alta (feedstock) | `P1`, `P21`, `F1`, HTML "Knauf Isopor®" |
| A-02 | Isoplast | Produtora de EPS (líder N/NE); usa bloco T1R reciclado | Filial Simões Filho/BA · matriz Maracanaú/CE | Alta (cliente) | `P2`, `C3`, `F1` |
| A-03 | Isobras — ISOBRAR Indústria e Comércio de Embalagens | Embalagens descartáveis | Itatim/BA | Média-alta | `P3`, `P22`, `F1`, HTML "ISOBRar" |
| A-04 | Isobahia — ABS Poliestireno | Placas e blocos de EPS | Santo Antônio de Jesus/BA | Média | `P4`, `P23`, `F1` |
| A-05 | Iso Conquista | Indústria e comércio de EPS | Vitória da Conquista/BA | Média | `P5`, `F1` |
| A-06 | Termotécnica | Maior transformadora de EPS da AL; líder em reciclagem | Petrolina/PE (mais próxima) · matriz Joinville/SC | Alta (cliente de feedstock) | `P6`, `C1` |
| A-07 | Proecologic (Grupo Santa Luzia) | Maior recicladora dedicada de EPS/XPS | ⚠️ divergente (ver abaixo) | Alta (cliente) | `P7`, `C1`, HTML "Taubaté/SP" |
| A-08 | Realce Indústria | Transformadora, 80–90% reciclado | Conceição do Jacuípe/BA | Alta | `P8`, `C5`, `P16` (parcial) |
| A-09 | Redesol | Cooperativa de recicláveis | Feira — Gabriela | Alta | `P9`, `F2` |
| A-10 | Ginga Recicla | Cooperativa de recicláveis | Feira — Irmã Dulce | Alta | `P10`, `F2` |
| A-11 | Artemares | Associação regional de catadores | Feira — Tomba | Alta | `P11`, `F2` |
| A-12 | Coobafs | Cooperativa (ex-catadores do lixão) | Feira — Caseb | Alta | `P12`, `F2` |
| A-13 | CANORE e COOPERBRAVA + demais 16 da LIMPURB | Cooperativas de Salvador | Salvador/BA | Alta | `P13`, `F3` |
| A-14 | CATA BAHIA / CCRBA | Federação e central de cooperativas | Salvador/BA | Média | `P14` |
| A-15 | Sebrae Pró-Catadores | Estruturador oferta × demanda | Feira/BA | Parceiro institucional | `P15` |
| A-16 | Newmaq / Atlas / Eletrodomésticos Pinheiro | Indústria de eletrodomésticos (geram EPS) | Feira — Humildes/CIS | Média-alta | `P17`, `F5` |
| A-17 | Grupo MK (Mondial/AIWA) | Eletroportáteis | Conceição do Jacuípe/BA · Cruz das Almas | Média | `P18`, `F5` |
| A-18 | Sesp-Feira (Divisão de Coleta Seletiva) | Gestão pública de coleta | Feira/BA | Média | `P20`, `F9` |
| A-19 | LWART Soluções Ambientais S.A. | Operadora de resíduos | Feira/BA | Média-alta | `P24`, `F10` |
| A-20 | Sustentare Saneamento S/A | Coleta de resíduos | Feira/BA | Média-alta | `P25`, `F10` |
| A-21 | Qualix Serviços Ambientais S.A. | Coleta de resíduos | Feira/BA | Média-alta | `P26`, `F10` |
| A-22 | 3R Novo Mundo Rec. Materiais Plásticos | Recuperadora de plásticos (ME) | Feira/BA | Média | `P27` |
| A-23 | Varejo e atacarejo (Assaí, Atacadão, Magazine Luiza, Casas Bahia, Havan) | Geradores de embalagem | Feira/BA e região | Média | `F4` |
| A-24 | Pesca e alimentos (Mercado do Peixe, frigoríficos, SIF) | Geradores de caixas térmicas | Salvador/BA e Feira/BA | Média | `F6` |
| A-25 | Saúde e fármaco | Geradores de caixas térmicas | BA | Média | `F7` |
| A-26 | Construção civil (canteiros) | Refugo de corte | BA | Média | `F8` |
| A-27 | E-commerce e logística (CDs, transportadoras) | Proteção de encomendas | BA | Média | `F11` |

¹ **"Prontidão" é uma classificação da pesquisa.** Não significa contrato assinado, disponibilidade confirmada, intenção de compra nem compromisso de fornecedor. Deve constar do detalhe de cada ator.

⚠️ **A-07 Proecologic — divergência de localização não resolvida.** Relatório §4.3: "fábrica em Ribeirão Pires/SP". XLSX `Players_Roadmap!P7`: "Taubaté/SP". HTML: "Taubaté/SP". **Decisão**: exibir "São Paulo (localidade em divergência entre as fontes)" com a nota de divergência e ambas as versões. Não escolher silenciosamente.

### 2.7 Portfólio de fontes e novos registros

Nenhum registro novo foi criado com URL. Adicionados apenas **metadados** derivados dos arquivos existentes.

| ID | Registro | Observação |
|---|---|---|
| S-35 | RUNI SK120 | URL do HTML (`https://www.compactor-runi.com/`) **não consta** da planilha nem do relatório. Mantida como URL declarada; marcada como "URL declarada no painel, não verificada nesta revisão". |
| S-41 | ABRAFRIGO | HTML usa `https://www.abrafrigo.com.br/`; XLSX e relatório usam o PDF específico. Adotado o PDF do XLSX (mais preciso). |
| S-36b | Faixas de preço de EPS | Sem URL em nenhuma fonte; classe "Mercado (baixa confiança)". Exibir como **material não disponibilizado**, com o texto descritivo preservado. |
| S-43 | Scripts de extração | Localização: `rfb/` desta pasta. Link relativo real, com graceful degradation. |

---

## 3. Contratos de dados

### 3.1 Indicador quantitativo

```ts
type EvidenceType =
  | 'publicado'      // dado publicado por terceiro ou órgão
  | 'cadastral'      // contagem oficial (RFB)
  | 'declaracao'     // declaração empresarial ou setorial
  | 'estimativa'     // estimativa da pesquisa, com hipótese explícita
  | 'premissa'       // premissa de simulação, editável
  | 'pendente';      // informação pendente de validação

interface Indicador {
  id: string;
  label: string;              // nome preciso
  value?: number;
  valueMin?: number;          // para faixas — jamais um valor único sem marcação
  valueMax?: number;
  display: string;            // texto formatado pt-BR, com unidade embutida
  unit: string;
  geography: string;
  populationScope: string;    // denominador, por extenso
  referencePeriod: string;
  evidenceType: EvidenceType;
  sourceIds: string[];
  methodNote?: string;
  limitations?: string[];
  implication?: string;       // para a decisão
}
```

**Regra de formatação**: valores permanecem `number` na camada de dados; `pt-BR` só na apresentação. Faixas nunca são colapsadas em ponto sem marcação explícita de "valor representativo".

### 3.2 Natureza da evidência (renderização obrigatória)

| evidenceType | Rótulo visível | Cor | Ícone textual |
|---|---|---|---|
| `publicado` | Dado publicado | `information` | — |
| `cadastral` | Dado cadastral oficial | `information` | — |
| `declaracao` | Declaração empresarial/setorial | `warning` | — |
| `estimativa` | Estimativa da pesquisa | `warning` | ⚠ |
| `premissa` | Premissa editável | `accent` | — |
| `pendente` | Pendente de validação | `danger` | ○ |

A natureza **nunca** é comunicada apenas por cor — sempre por rótulo textual.

### 3.3 Others

```ts
interface Cenario      { id; nome; hipotese; consumo{min,max}; emissao{min,max}; reciclado{min,max}; naoAtendida{min,max}; }
interface Ator         { id; nome; razaoSocial?; papel; municipio; regiao; material; prontidao; evidenceType; sourceIds; limitacao; proximaValidacao; aliases[]; }
interface Fonte        { id; titulo; tipo; data; urls: string[]; suporta: string; naoDisponivel?: boolean; }
interface Gate         { id; condicao; evidenciaNecessaria; prazoDias; escopoPrazo; consequencia; statusInicial: 'nao-verificado'; }
interface Risco        { id; titulo; evidencia; mitigacao; severidade; sourceIds; }
interface Fase        { id; ordem; objetivo; prazo; capex; entregaveis[]; criterioAvanco; dependencias[]; }
interface SerieAbertura{ ano: number; valor: number; parcial?: boolean; }
```

`urls` é **sempre uma lista** — nunca string separada por `|` (D-31).

---

## 4. Gates — com a divergência de prazo explicitada

| Gate | Condição mensurável | Evidência necessária | Prazo | Se falhar |
|---|---|---|---|---|
| **G1 · Feedstock** | ≥ 10 t/mês de EPS contratados com F1–F3 | Contratos assinados + medição de 90 dias | **90 dias** | Não abrir hub; renegociar ou encerrar a Fase 0 |
| **G2 · Preço** | Preço do bloco densificado firme ≥ R$ 1,90/kg com ao menos um comprador (Termotécnica ou Proecologic) | Cotação formal / contrato | **90 dias** | Reduzir CAPEX ou trocar a rota de produto |
| **G3 · Incentivos** | Entidade gestora de CCRLR mapeada + elegibilidade PROIND confirmada | Protocolo junto à entidade; consulta de enquadramento | **120 dias** | Reprecificar o projeto sem os incentivos |

**Redação da divergência:** o cabeçalho anuncia "3 gates em 90 dias", herdado da versão anterior. **Decisão adotada:** alterar a redação para **"validações comerciais em 90 dias; validação de incentivos em até 120 dias"**. Os prazos originais de cada gate são preservados — a diferença é explicitada, não apagada.

**Estado inicial de todos os gates: `não verificado`.** Sem checkmarks, sem barras de progresso, sem percentual de avanço. Um checklist editável, se incluído, é rotulado como **acompanhamento local do usuário** e não persiste entre sessões por padrão.

---

## 5. Contrato do modelo econômico

### 5.1 Fórmulas (implementação obrigatória, UI-independente)

```
massaEntradaKg     = volumeEntradaTon × 1000
massaSaidaKg       = massaEntradaKg × (1 − perda)
massaElegivelTon   = massaElegivelInformada            // ≤ massaComprovadaTon, ≤ volumeEntradaTon

receitaMaterial    = massaSaidaKg × precoVendaKg
custoCompra        = massaEntradaKg × precoCompraKg
custoLogistica     = volumeEntradaTon × custoLogisticaTon
custoTotal         = custoCompra + custoLogistica + custoFixo
receitaCreditos    = creditoAtivo ? massaElegivelTon × creditoPorTon : 0
receitaTotal       = receitaMaterial + receitaCreditos
resultadoMensal    = receitaTotal − custoTotal
margemSobreReceita = receitaTotal > 0 ? resultadoMensal ÷ receitaTotal : null
paybackMeses       = resultadoMensal > 0 && capex > 0 ? capex ÷ resultadoMensal : null

capacidadeMensalTon = capacidadeKgHora × horasOperacaoMes × qtdEquipamentos
                       × (fatorUtilizacao ÷ 100) ÷ 1000
```

### 5.2 Estados sem resultado numérico

`paybackMeses === null` distingue dois motivos, ambos explicados ao usuário:
- resultado ≤ 0 → "o modelo não se paga com as premissas atuais"
- `capex === 0` → "CAPEX não informado — payback não aplicável"

`margemSobreReceita === null` → "receita total zero — margem não definida".

### 5.3 Casos de referência (CL-01) — contrato de regressão

**Convenção original** (a ser preservada para comparabilidade com a versão anterior):

| Premissa | Valor |
|---|---:|
| Volume de entrada | 20 t/mês |
| Perda | 8% |
| Compra | R$ 0,50/kg |
| Venda | R$ 2,10/kg |
| CAPEX | R$ 275.000 |
| Custo fixo | R$ 18.000/mês |
| Logística | R$ 120/t |
| Crédito | R$ 60/t |
| Massa usada para crédito (convenção original) | 20 t/mês |

**Com créditos:** saída 18.400 kg · receita material R$ 38.640 · créditos R$ 1.200 · receita R$ 39.840 · custo R$ 30.400 · resultado **R$ 9.440** · margem **23,69%** · payback **29,13 meses**.
**Sem créditos:** receita R$ 38.640 · resultado **R$ 8.240** · payback **33,37 meses**.

Esses casos verificam aritmética, conversão de unidades e formatação. **Não comprovam a viabilidade do empreendimento.**

### 5.4 Capacidade (OP-01) — aritmética de conferência

Equipamentos de referência: **18–22 kg/h** [S-35][S-36].

```
18 kg/h × 160 h × 1 un. × 1,00 ÷ 1000 = 2,88 t/mês
22 kg/h × 160 h × 1 un. × 1,00 ÷ 1000 = 3,52 t/mês
```

Logo, o padrão de **20 t/mês** equivale a aproximadamente **6 a 7 equipamentos** de referência operando em 1 turno de 160 h/mês sem indisponibilidade. O painel **não** deve apresentar 20 t/mês como tecnicamente dimensionado por essa referência. A verificação é apresentada como premissa explícita, com o número de equipamentos necessário calculado.

### 5.5 Itens não modelados (obrigatório exibir)

Impostos (ICMS/IPI/PIS/COFISS/ISS), financiamento e custo do capital, capital de giro, depreciação, manutenção, energia, mão de obra detalhada, seguros, aluguel, descartes e resíduos de processo, variação de preço, custo de triagem por fração, logística de retorno vazio, certificações, licenças ambientais e custo de conformidade. **O resultado é resultado operacional estimado de um modelo simplificado** — não lucro líquido, não fluxo de caixa, não EBITDA auditado.

---

## 6. Permissões e afirmações vedadas

O painel **não** pode afirmar, em nenhuma área:

1. Que existem ou não existem recicladoras de EPS na Bahia (apenas o que o levantamento encontrou ou deixou de encontrar, com cobertura e data).
2. Que um investimento está aprovado, recommended como aprovado, ou que o negócio "se paga".
3. Que há demanda de EPS comprovada na Bahia a partir dos 332 t/mês.
4. Que existe contrato, carta de intenção, acuerdo ou disponibilidade confirmada com qualquer ator.
5. Percentual de confiança, score de oportunidade ou progresso sem fonte.
6. Distância, rota ou posição geográfica com aparência de precisão sem base verificada.
7. Fluxo quantitativo entre atores em Sankey (não há dados de fluxo).

## 7. Fontes — inventário

49 registros, replicados de `fontes_cadeia_isopor_bahia.xlsx` (aba `Fontes`), com a coluna "o que sustenta" preservada e URLs separadas quando múltiplas. Nenhum registro foi removido; nenhum foi inventado.

- **Com URL:** 47
- **Sem URL (marcados "material não disponibilizado"):** S-36b, S-43
- **URL declarada mas não verificável nesta revisão:** S-35
- **Com múltiplas URLs (separadas no retrofit):** S-18 (2 URLs), S-34 (2 URLs), S-42 (2 URLs)