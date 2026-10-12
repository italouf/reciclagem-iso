# Plano de Implementação — Ciclos 1 a 5

**Método:** SDD (Specification-Driven Development) + Loop Engineering.
**Protocolo de cada ciclo:** Especificar → Implementar → Testar → Renderizar → Inspecionar → Corrigir → Verificar novamente.

**Regra de anti-loop (§14):** após duas tentativas sem progresso sobre a mesma falha, reavaliar a causa ou simplificar. Nenhum ciclo de restilização sem diagnóstico prévio.

---

## Visão dos ciclos

| Ciclo | Foco | Requisitos | Depende de |
|---|---|---|---|
| **1** | Base, tokens, navegação, visão executiva | DS-01, EX-01…04, NV-01…02, AC-02, AC-03, EV-01, EV-03, RS-01, OF-01, OF-02 | — |
| **2** | Mercado, território, cadeia | EV-02…04, OP-03, AC-04, RS-03 | 1 |
| **3** | Viabilidade | CL-01…03, OP-01, OP-02, ST-01 | 1, 2 |
| **4** | Plano, riscos, fontes, impressão | OP-04, ST-02, ST-03, AC-05, AC-06, RS-02, RS-04 | 1, 2, 3 |
| **5** | Revisão integrada e regressão | Todos | 1–4 |

---

## Ciclo 1 — Base e visão executiva

**Objetivo.** Construir o padrão (tokens, componentes, navegação, rastreabilidade) e entregar a primeira fatia completa: a abertura executiva.

### Implementar
- Tokens de cor, tipografia, espaçamento, raio, borda, sombra, largura, camada, movimento.
- Pilha de layout: cabeçalho · navegação lateral (≥ 1200 px) / barra horizontal (< 1200 px) · conteúdo · rodapé.
- **Offset de sticky medido por JS** + `ResizeObserver` + `scroll-padding-top` → corrige D-24.
- Rotas por `hash` + `pushState` + `popstate`; `aria-current="page"` → corrige D-32.
- Link "pular para o conteúdo"; `h1` único → corrige D-02.
- Componente `src-ref`: todo `[S-nn]` no documento vira link que abre o registro e registra o ponto de retorno → corrige D-36/EV-01.
- Componente `evidence-tag` com os 6 rótulos textuais → corrige D-03/EV-03.
- Abertura: recomendação condicional + 3 fundamentos + 3 condições + **4** indicadores + 3 riscos + próximo passo → corrige D-01, D-04, EX-03.
- Rodapé com links relativos reais e graceful degradation → corrige D-39.

### Verificar
| Teste | Esperado |
|---|---|
| 1440 px, 7 áreas | Capturas de tela |
| 375 px, `scrollY = 900` | Navegação **visível** e utilizável |
| `querySelectorAll('h1').length` | `1` |
| Clicar `[S-07]` na abertura | Abre o registro; voltar retorna ao mesmo ponto |
| `history.back()` após troca de área | Retorna à área anterior |
| Tab por todo o cabeçalho | Foco sempre visível |
| Console | 0 erros |
| `document.querySelectorAll('[src^=http],[href^=http]')` dentro de `<head>`/assets | 0 |

---

## Ciclo 2 — Mercado, evidências, território e cadeia

**Objetivo.** Levar o padrão do ciclo 1 a gráficos, comparações, diagrama territorial e tabela de atores.

### Implementar
- Série de aberturas 2010–2026 com **2026 marcado como parcial** → corrige D-37. Eixo X com anos inequívocos → corrige D-38.
- Barras horizontais com **denominador explícito** em cada cabeçalho → corrige D-06.
- Ranking de UF com base nacional (276.898) **e** share entre as UFs exibidas, rotulados separadamente → corrige D-07.
- Bloco de reconciliação (escopo amplo × núcleo × CNAE principal × base nacional) → corrige D-08.
- Demand block: 332 t/mês rotulado "plásticos recicláveis, não só EPS" + derivação de PS/EPS separada como extrapolação → corrige D-10.
- Comparação de **escopos** (332 t/mês · 3.984 t/ano · 60 t/ano · >60 t/mês · ~210 t/mês), **sem** a razão de 66× → corrige D-11.
- **Diagrama territorial esquemático** com rótulo explícito de esquematicidade; sem distâncias ou rotas → H-04.
- Densificação: visualização de volume × massa, marcada como referência ilustrativa da pesquisa [S-15].
- Tabela de 27 atores com busca + 4 filtros (`papel`, `município/região`, `categoria`, `prontidão`), chips com `aria-pressed` → corrige D-34.
- Detalhe de ator com.limitação e próxima validação comercial → EX-02.
- Rótulos com reflow, sem truncamento → corrige D-30.

### Verificar
| Teste | Esperado |
|---|---|
| 7 áreas × 4 larguras | Capturas |
| Busca "Artemares" | 1 resultado |
| Filtro prontidão "Alta" | Contagem correta |
| `aria-pressed` nos chips | Reflete o estado |
| Gráfico acessível por Tab | Cada barra focável com valor anunciado |
| Tabela alternativa do gráfico | Presente e equivalente |
| `scrollWidth ≤ clientWidth` | Em 320/375/768/1024/1440 |
| `"66×"` ausente do destaque executivo | Confirmado por busca textual |

---

## Ciclo 3 — Viabilidade

**Objetivo.** Extrair o cálculo da interface, corrigir as 7 falhas de validação e adicionar capacidade e créditos opcional.

### Implementar
- `calcular(premissas)` como **função pura**, sem DOM → requisito §10.
- Validação por campo com três estados: `ok` · `vazio` · `erro`. Campo vazio **não** vira zero → corrige D-16.
- Domínios: volume > 0; perda 0–100; utilização 0–100; CAPEX ≥ 0; massa elegível ≤ massa comprovada ≤ entrada → corrige D-17, D-18, D-19, D-20.
- Erro exibido **adjacente ao campo**, com `aria-describedby`; valor digitado preservado; resultado suprimido quando inválido.
- `margem` só com receita > 0; `payback` só com resultado > 0 **e** CAPEX > 0, com dois estados explicados → CL-03.
- Créditos **desligados por padrão**, com massa elegível explícita → corrige D-21.
- Verificação de capacidade com a fórmula e aviso quando o volume excede → corrige D-22/OP-01. Resultado econômico e compatibilidade operacional em blocos separados → OP-02.
- Sensibilidade: barras com **eixo em zero real**, negativos à esquerda, rótulo fora da barra quando não couber → corrige D-28, D-29. Comparação com/sem créditos, sensibilidade a preço de venda, volume de equilíbrio.
- "Personalizado" ao editar um preset; reset restaura.
- Declaração do que o modelo **não** inclui.

### Verificar — testes numéricos
| ID | Caso | Esperado |
|---|---|---|
| CL-01a | Referência com créditos | 18.400 kg · R$ 38.640 · R$ 1.200 · R$ 39.840 · R$ 30.400 · **R$ 9.440** · **23,69%** · **29,13 meses** |
| CL-01b | Referência sem créditos | R$ 38.640 · **R$ 8.240** · **33,37 meses** |
| CL-01c | Conversão de unidades | `t × 1000 = kg` |
| CL-02a | volume vazio | Erro; **sem resultado** |
| CL-02b | volume = 0 | Erro |
| CL-02c | volume negativo | Erro; sem resultado |
| CL-02d | perda = 150 | Erro; sem resultado |
| CL-02e | perda = -5 | Erro |
| CL-02f | NaN / Infinity / `1e309` | Erro |
| CL-02g | CAPEX = 0 | Payback com estado explicado |
| CL-02h | venda = 0 | Margem com estado explicado |
| CL-02i | massa elegível > comprovada | Erro no campo |
| CL-02j | valor muito grande | Limite com aviso |
| CL-03 | receita = 0 | `margem = null` |
| OP-01a | 20 t/mês, 1 equipamento 20 kg/h, 160 h, 100% | Capacidade **3,20 t/mês**; aviso visível |
| OP-01b | 20 t/mês, 7 equipamentos | Capacidade **22,4 t/mês**; sem aviso |

---

## Ciclo 4 — Plano, riscos, fontes e impressão

**Objetivo.** Fechar o percuso de decisão e as garantias técnicas.

### Implementar
- Fases 0–3 com objetivo, prazo, CAPEX, entregáveis, critério de avanço e dependências.
- Gates com estado inicial `não verificado` — sem checkmark, sem barra, sem percentual → EX-04.
- Checklist de acompanhamento rotulado como **local do usuário**, sem persistência por padrão.
- 11 trade-offs + SWOT como conteúdo secundário de `plano`.
- Contexto regulatório (Decreto 12.688, 11.413, PNRS, PROIND, DESENVOLVE, BNDES, Finor, FNMA).
- Catálogo de fontes: busca por ID/título/tipo, filtros por tipo, URL separada quando múltipla, "material não disponibilizado" quando ausente → corrige D-31.
- Aba "Método e divergências": matriz de reconciliação e ressalvas metodológicas → EV-02.
- `@media print` expondo todas as seções, com premissas ativas, unidades, data de corte e lista de fontes → OP-04/PR-01. Botão rotulado "Imprimir / Salvar em PDF (Ctrl+P)".
- `localStorage` em `try/catch` com nota de degradação → ST-03.
- Link para arquivos irmãos com graceful degradation.

### Verificar
| Teste | Esperado |
|---|---|
| Preview de impressão | 7 áreas, gráficos legíveis, premissas, data de corte, fontes |
| Fonte S-42 | 2 links separados, ambos válidos |
| Fonte S-36b | "material não disponibilizado", sem link fictício |
| `localStorage` bloqueado | Painel funcional + nota |
| Checklist | Não persiste entre recargas |
| `prefers-reduced-motion` | Nenhuma animação |

---

## Ciclo 5 — Revisão integrada

**Objetivo.** Avaliar o painel completo por cinco perspectivas e corrigir o que for observado.

### Perspectivas
1. **Executivo** — a decisão e suas condições são compreensíveis em uma tela?
2. **Analista** — escopo, unidade, período e denominador são auditáveis?
3. **Parceiro operacional** — a_prontidão está qualificada? As limitações são visíveis?
4. **Usuário mobile** — a navegação sobrevive ao scroll? As tabelas são usáveis?
5. **Usuário de teclado** — tudo operável? O foco nunca some?
6. **Mantenedor** — os dados estão separados do cálculo, do estado e da renderização?

### Regressão
- Reexecutar **todos** os casos de `CL-01`, `CL-02`, `OP-01`, `NV-01`, `EV-01`, `ST-01`.
- Verificar que nenhuma seção reintroduziu um padrão removido (ex.: `.on` sem `aria-pressed`).
- Conferir que todo `number` em `dados-e-evidencias.md` aparece no painel com a mesma unidade e o mesmo escopo.
- Reexecutar as 4 larguras nas 7 áreas.

### Pendências a registrar (não a corrigir no código)
1. Localização da Proecologic (Ribeirão Pires vs. Taubaté) — divergência entre fontes.
2. `R$ 1,48/kg` não reproduzível a partir das premissas do painel.
3. Faixa da planilha vs. faixa do relatório para emissão pós-uso.
4. Ausência de geometria/coordenações verificadas → diagrama apenas esquemático.
5. Nenhuma cotação, contrato ou carta de intenção verificada.
6. Elegibilidade PROIND/CCRLR **não** confirmada juridicamente.
7. Planilha sem fórmulas e sem aba Calculadora (não será alterada).