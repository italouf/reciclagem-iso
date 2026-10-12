# Especificação — Painel de Inteligência de Mercado (EPS/Bahia) · Retrofit

**Versão:** 1.0 · **Data:** 12/10/2026
**Entregável:** `painel_isopor_bahia_retrofit.html` (autossuficiente, `file://`, offline)
**Documentos relacionados:** `diagnostico.md` (achados `D-xx`), `dados-e-evidencias.md` (contratos e matriz), `plano.md` (ciclos), `validacao.md` (evidência)

---

## 1. Público, objetivo e tarefas

### 1.1 Público primário

**Comitê de investimento** que precisa, em uma sessão de leitura de 5–8 minutos, decidir **se libera ou não libera capital agora** e **o que precisa ser verdadeiro antes de liberar**.

### 1.2 Objetivo do painel

Permitir que o leitor responda, **na primeira tela**, a seis perguntas:

1. Qual oportunidade está sendo investigada?
2. Qual decisão a pesquisa recomenda neste momento?
3. Quais evidências sustentam essa recomendação?
4. Quais premissas ainda precisam ser confirmadas?
5. Quais condições antecedem a liberação do investimento?
6. Onde aprofundar mercado, parceiros, operação e viabilidade?

O painel **não** recomenda aprovar o investimento. Recomenda **validar antes de decidir** — que é o que a pesquisa sustenta.

### 1.3 Tarefas do usuário

| # | Tarefa | Área | Evidência de sucesso |
|---|---|---|---|
| U-1 | Ler a recomendação e seus condicionantes | Visão executiva | Entende que a decisão é condicional em ≤ 60 s |
| U-2 | Verificar de onde vem um número | Todas | Clica em `[S-nn]`, lê o registro, volta ao ponto de leitura |
| U-3 | Julgar a robustez de um indicador | Mercado | Distingue publicado / cadastral / estimativa / premissa |
| U-4 | Conferir se a comparação é legítima | Mercado / Território | Encontra escopo e denominador de cada percentual |
| U-5 | Avaliar a condition de liberação | Plano e riscos | Lê os 3 gates com prazo e consequência |
| U-6 | Testar a economics sob premissas próprias | Viabilidade | Altera premissas, vê erro vs. resultado, não obtém número inválido |
| U-7 | Verificar se a operação é fisicamente possível | Viabilidade | Vê a verificação de capacidade e o aviso de insuficiência |
| U-8 | Localizar um parceiro potencial | Cadeia | Filtra e busca, abre o detalhe com limitação e próxima validação |
| U-9 | Conferir a procedência de tudo | Fontes | Busca por ID, título ou tipo; abre a URL |
| U-10 | Levar a discussão para fora da tela | Todos | Imprime com todas as áreas, premissas, unidades e fontes |

---

## 2. Arquitetura de informação

Sete áreas, na ordem de decisão. Cada uma responde a uma pergunta e tem link direto.

| # | ID | Área | Pergunta | Conteúdo |
|---|---|---|---|---|
| 1 | `visao` | Visão executiva | Qual decisão avaliar agora? | Recomendação, 3 fundamentos, 3 condições, 4 indicadores, 3 riscos, próximo passo |
| 2 | `mercado` | Mercado e evidências | Qual a dimensão e a robustez? | Cenários, escopo cadastral, recuperadores, série de aberturas, ranking, limites |
| 3 | `territorio` | Território e logística | Por que Feira e quais conexões? | Diagrama territorial esquemático, polos, densificação |
| 4 | `cadeia` | Cadeia e parceiros | Com quem estruturar? | Diagrama de etapas + tabela filtrável de 27 atores |
| 5 | `viabilidade` | Viabilidade | Em quais condições se sustenta? | Premissas, resultados, capacidade, sensibilidade, itens não modelados |
| 6 | `plano` | Plano e riscos | Como validar e avançar? | Fases, gates, riscos, contexto regulatório, história setorial |
| 7 | `fontes` | Fontes e método | De onde vem cada afirmação? | 49 referências, busca, filtros, método, divergências |

**Consolidações em relação à versão anterior** (a cobertura informacional é preservada):

| Origem | Destino | Justificativa |
|---|---|---|
| Decisão | `visao` + `plano` | Gates são pré-requisito de decisão, não resumo |
| Dados & Insights | `mercado` | — |
| Bahia & Feira | `mercado` (cenários) + `territorio` (Feira) | A área anterior misturava mercado e lugar |
| Roadmap | `plano` (história setorial, secundária) | — |
| Cadeia | `cadeia` | — |
| Vantagens × Riscos | `visao` (3 riscos que quebram a tese) + `plano` (lista completa, 11 trade-offs + SWOT) | O comitê precisa dos 3 primeiros na abertura; o analista precisa dos 11 |
| Viabilidade | `viabilidade` | — |
| Fontes | `fontes` | — |

---

## 3. Design system

### 3.1 Direção validada

Gerada com o script real da **UI UX Pro Max** v2.x, executado a partir do repositório oficial, com os dials prescritos: `--density 6 --motion 2 --variance 4`. Persistida em `design-system/reciclagem-eps-bahia/MASTER.md` (o script recusou sobrescrever; o conteúdo foi lido antes de qualquer regeneração).

### 3.2 O que foi adotado e por quê

| Resultado da skill | Decisão | Justificativa |
|---|---|---|
| **Style: Data-Dense Dashboard** | ✅ Adotado | É literalmente o caso de uso declarado: *"Business intelligence dashboards, financial analytics, enterprise reporting, operational dashboards, data warehousing"*. Risco de acessibilidade `low`, com requisitos que coincidem com o briefing §12. |
| **Checklist pré-entrega** | ✅ Adotado integralmente | Exige responsividade em 375/768/1024/1440 — idêntico ao briefing §12. Exige contraste 4.5:1, foco visível, `prefers-reduced-motion`, sem emoji como ícone. |
| **Anti-pattern "No filtering"** | ✅ Adotado | Confirma os filtros de ator como obrigatórios. |
| **UX: chips precisam de `aria-pressed`** | ✅ Adotado | Guideline "Compact Control Semantics", severidade **Crítica**. Corrige D-34. |
| **UX: `scroll-padding-top` para sticky UI** | ✅ Adotado | Guideline "Focus Not Obscured (Minimum)", severidade **Alta**. Prescreve exatamente o conserto de D-24. |
| **UX: nenhum elemento clicável apenas no hover** | ✅ Adotado | Guideline severidade Crítica. Base do conserto de D-26. |
| **Color strategy: "Corporate, high integrity, conservative accents"** | ✅ Adotado como princípio | Confirma a abordagem sóbria pedida em §7. |
| **Densidade 6 / Motion 2 / Variance 4** | ✅ Adotado | Prescritos. Movimento 2 é coerente com a proibição de animação contínua. |

### 3.3 O que foi recusado, e por quê

| Resultado da skill | Decisão | Justificativa |
|---|---|---|
| **Paleta `#1E40AF` + `#D97706`** | ❌ Substituída | O briefing §7 define a paleta como token obrigatório. Instrução do usuário prevalece sobre sugestão da skill. Além disso, o briefing proíbe explicitamente que o verde institucional sinalize aprovação. |
| **Tipografia Fira Code / Fira Sans via Google Fonts** | ❌ Substituída | Fira Sans não está disponível localmente e a importação é CDN — violaria OF-01 (§13). O *mood* ("technical, precise") foi mantido com uma pilha de sistema e figuras tabulares. |
| **Pattern "Enterprise Gateway"** | ❌ Rejeitado | É um padrão de *landing page* de marketing: hero com vídeo, mega menu, carrossel de logos, CTA "Contact Sales / Login". Não corresponde a um painel analítico interno e contradiz §7 (sem ilustrações genéricas, sem logos não verificados, sem gradientes). |
| **GSAP ScrollReveal + ScrollTrigger** | ❌ Rejeitado | Dependência pesada para tarefas simples (§13); `ScrollTrigger` esconde conteúdo below-the-fold por padrão; o próprio README da skill desaconselha sem fallback. |
| **"Data loading spinners"** | ❌ Rejeitado | §7 proíbe elementos que "aparentem atualização em tempo real". Os dados são de corte estático. |
| **"Chart zoom on click"** | ❌ Rejeitado | Não acrescenta valor de decisão em séries de 17 pontos e introduz estado interativo sem necessidade. |

### 3.4 Tokens

Paleta inicial do briefing §7, com contraste medido e variantes derivadas:

```css
--bg:#F5F7F8;  --surface:#FFFFFF;  --surface-sunken:#EDF1F3;  --surface-raised:#FFFFFF;
--ink:#17252B;  --ink-2:#52616B;    --ink-3:#6E7C85;
--brand:#123C35; --accent:#087F68;   --accent-hover:#066A57;
--info:#245C85;  --warn:#9A5B13;     --danger:#B42318;
--line:#DCE3E7;  --line-strong:#C2CDD3;
```

Regras adicionais:

- O verde `--accent` **só** é usado para ação do usuário e resultado positivo **calculado**. Nunca para estado "não verificado".
- Estados de evidência usam `--info`, `--warn`, `--danger` **sempre com rótulo textual** (§2.3 de `dados-e-evidencias.md`).
- Sem gradientes como identidade, sem glassmorphism, sem sombra além de `--shadow-1`.

### 3.5 Tipografia

- Pilha: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — **sem dependência de rede**.
- Corpo **16 px** base (§7).
- Escala: `h1 30/34 · h2 22/28 · h3 17/24 · h4 15/20 · body 16/26 · meta 13/20 · micro 12/18`.
- `font-variant-numeric: tabular-nums` em toda figura numérica.
- `max-width: 68ch` em parágrafos.
- Números grandes: `clamp(1.75rem, 1.2rem + 2vw, 2.5rem)`.

### 3.6 Padrões de componente

`section-header`, `kpi`, `kpi--primary`, `evidence-tag`, `src-ref`, `gate`, `risk`, `assumption`, `result`, `figure`, `data-table`, `empty-state`, `error`, `detail-panel`, `chip`, `note`, `divergence`, `actor-row`.

**Todos** consumem tokens. Nenhum estilo solto.

---

## 4. Contratos de dados

Ver §3 de `dados-e-evidencias.md`. Regras não negociáveis:

1. `number` na camada de dados; `pt-BR` só na apresentação.
2. Faixa (`valueMin`/`valueMax`) **nunca** colapsada em ponto sem marcar "valor representativo".
3. Todo indicador quantitativo tem `unit`, `geography`, `populationScope`, `referencePeriod`, `evidenceType`, `sourceIds`.
4. Todo percentual exibido declara o denominador por extenso no próprio rótulo.
5. `urls` é lista; registro sem URL renderiza "material não disponibilizado" sem link.
6. A camada de dados não importa nada do DOM; a de renderização não altera dados.

---

## 5. Estado e navegação

### 5.1 Estado

```ts
interface State {
  area: AreaId;                  // sincronizado com a URL
  cenarioMercado: 'cons'|'base'|'otim';   // NÃO altera a calculadora
  calc: Record<AssumptionKey, string>;    // texto bruto, preservado
  calcPreset: string | 'personalizado';
  creditosAtivos: boolean;
  filtros: { papel, municipio, categoria, prontidao, busca };
  fonteAberta: string | null;
  checklist: Record<GateId, boolean>;     // local, não persistido
}
```

**Regra de separação:** o seletor de **cenário de mercado** controla apenas as estimativas de `mercado`. Os **controles da calculadora** são independentes. A interface declara isso textualmente nos dois lugares — não se pode acreditar que um seletor global altera tudo (briefing §9).

### 5.2 Navegação

- **Semântica: links**, não tabs. `aria-current="page"`.
- Cada área é `<section id="...">` com link âncora e entrada no histórico.
- Desktop ≥ 1200 px: **navegação lateral compacta** (200 px), preservando largura analítica.
- < 1200 px: barra horizontal com `scroll-snap` e indicador de área atual.
- **Offset de sticky calculado por JS real** (ResizeObserver), nunca constante. `scroll-padding-top` espelha esse valor.
- `hashchange` + `popstate` + link por área → voltar/avançar funciona (NV-01).
- Abrir uma fonte preserva `fonteAberta` no histórico → voltar retorna ao ponto de leitura.
- Trocar de área **preserva** premissas, cenário e filtros.
- Foco movido para o `h1`/título da área após navegação programática; movido para o token de retorno ao fechar uma fonte.

### 5.3 Persistência

`localStorage` em `try/catch`. Se indisponível (modo privado, `file://` restrito), o painel funciona integralmente **apenas em memória** e exibe uma nota discreta. Nunca quebra.

---

## 6. Requisitos rastreáveis

### Visão executiva

| ID | Requisito | Evidência de aceite |
|---|---|---|
| EX-01 | A primeira tela apresenta a decisão proposta e suas condições | Screenshot + revisão da hierarquia |
| EX-02 | Cada indicador preserva escopo, unidade, período e natureza da evidência | Conferência contra `dados-e-evidencias.md` |
| EX-03 | A abertura usa no máximo 4 indicadores | Contagem inspecionada |
| EX-04 | As afirmações absolutas trazem cobertura, data e limitação no mesmo bloco | Busca textual por formulações absolutas |

### Evidência

| ID | Requisito | Evidência de aceite |
|---|---|---|
| EV-01 | Cada token `[S-nn]` em qualquer área leva ao registro correspondente e permite retorno | Teste de navegação e retorno |
| EV-02 | Divergências relevantes ficam registradas e representadas corretamente | Matriz de reconciliação |
| EV-03 | A natureza da evidência é textual, nunca só cromática | Inspeção dos 6 tipos |
| EV-04 | Nenhum número sem fonte, unidade e período | Auditoria de todos os `number` |

### Design system

| ID | Requisito | Evidência de aceite |
|---|---|---|
| DS-01 | Componentes compartilham tokens | Inspeção de código e telas |
| DS-02 | Estados de evidência têm rótulo textual | 6/6 renderizados |
| DS-03 | Verde não indica aprovação nem "não verificado" | Inspeção de estados |

### Navegação e estado

| ID | Requisito | Evidência de aceite |
|---|---|---|
| NV-01 | Seções com link direto e histórico funcional | Abrir / voltar / avançar |
| NV-02 | A navegação permanece visível e utilizável ao rolar em todas as larguras | Teste em 375 px com `scrollY > 900` |
| ST-01 | Cenários e premissas editadas mantêm comportamento previsível | Troca, navegação, reset |
| ST-02 | Trocar de área preserva premissas, cenário e filtros | Teste de ida e volta |
| ST-03 | Estado sobrevive a `localStorage` indisponível | Modo privado simulado |

### Cálculo

| ID | Requisito | Evidência de aceite |
|---|---|---|
| CL-01 | Reproduz os casos de referência | Testes numéricos com 8 casas |
| CL-02 | Dados inválidos não produzem resultado plausível | 10 casos de limite e erro |
| CL-03 | Margem só com receita > 0; payback só com resultado > 0 e CAPEX > 0 | Testes dirigidos |
| OP-01 | Capacidade insuficiente é explicitada | Caso de volume acima da capacidade |
| OP-02 | Resultado econômico e compatibilidade operacional são apresentados separadamente | Inspeção visual |

### Operacional

| ID | Requisito | Evidência de aceite |
|---|---|---|
| OP-03 | Filtros e busca de atores funcionam com estado programático | `aria-pressed` verificado |
| OP-04 | Impressão inclui conteúdo, unidades, premissas ativas e fontes | Preview de impressão |

### Acessibilidade

| ID | Requisito | Evidência de aceite |
|---|---|---|
| AC-01 | Funções essenciais operáveis por teclado | Teste manual documentado |
| AC-02 | Um `h1`, hierarquia de títulos sem salto, link "pular para o conteúdo" | Inspeção + `querySelectorAll('h1').length === 1` |
| AC-03 | Foco visível e nunca totalmente encoberto | Teste de sticky + foco |
| AC-04 | Valores de gráfico acessíveis por teclado e toque, com tabela alternativa | Teste |
| AC-05 | `prefers-reduced-motion` respeitado; nenhum movimento contínuo | Inspeção |
| AC-06 | Contraste medido ≥ 4.5:1 em texto e ≥ 3:1 em componentes | Tabela de contraste em `validacao.md` |

### Responsividade

| ID | Requisito | Evidência de aceite |
|---|---|---|
| RS-01 | Layout íntegro em 375 / 768 / 1024 / 1440 | Screenshots de todas as áreas |
| RS-02 | Sem overflow horizontal da página; rolagem confinada ao componente | `scrollWidth ≤ clientWidth` |
| RS-03 | Títulos e indicadores sem corte; chips quebram corretamente | Inspeção |
| RS-04 | Integridade em 320 px e com zoom | Inspeção |

### Técnica

| ID | Requisito | Evidência de aceite |
|---|---|---|
| OF-01 | O painel funciona sem rede, em `file://`, sem build | Teste offline + inspeção de subrecursos |
| OF-02 | Zero erros de console | Console limpo |
| QA-01 | A entrega informa o que foi verificado e o que permanece pendente | `validacao.md` |

---

## 7. Restrições técnicas

| Restrição | Decisão |
|---|---|
| Stack | HTML + CSS + JS puro. **Sem** React/Next.js, backend, autenticação ou banco (§13). |
| Build | Nenhum. Artefato único. |
| Dependências | Zero externas. Nenhum `<script src>`, `<link>`, `<img src>` ou `@import` remoto. |
| Dados | Embutidos em `<script type="application/json">`. |
| Gráficos | SVG gerado em JS. Sem biblioteca. |
| Segurança | Nada de `innerHTML` com valor vindo de input do usuário. Todo texto passa por escape helper. |
| Eventos | Delegação com `event.currentTarget` / `closest`. Nunca `e.target.tagName`. |
| Impressão | `@media print` expondo todas as seções; ação rotulada "Imprimir / Salvar em PDF (Ctrl+P)" — **não** promete geração programática de PDF. |
| Estado vazio | Todo componente de lista define estado vazio com texto e ação. |

---

## 8. Hipóteses adotadas

| ID | Hipótese | Base | Risco se errada |
|---|---|---|---|
| H-01 | A base RFB é o dado bruto mais confiável entre os arquivos, por ser reproduzível (`rfb/`) | Briefing §2 | Baixo — scripts presentes |
| H-02 | A faixa do relatório prevalece sobre o ponto da planilha em cenários de mercado | §2 "a planilha para valores tabulados" vs. §"a faixa é mais honesta" | Médio — registrado em `dados-e-evidencias.md` §2.4 |
| H-03 | "Prontidão" é classificação da pesquisa, não estado comercial | Briefing §8.4 | Baixo |
| H-04 | Diagramas territoriais serão ** esquemáticos** (sem geometria verificada) | Briefing §8.3 | Baixo — rotulado como tal |
| H-05 | O mundo não tem geometria/coordenações de atores | Inspeção dos 5 arquivos | Baixo |
| H-06 | Sem KPIs de tempo real — todos os dados são de corte estático | §7 | Baixo |
| H-07 | O commit de referência da aritmática é a convenção original (crédito sobre 20 t) | §10.3 | Baixo — mantido como `CL-01` |

---

## 9. Fora de escopo

Não serão feitos, e a pendência fica **registrada no painel**:

1. **Nova pesquisa de mercado.** Nenhuma cotação, carta de intenção ou volume foi buscado.
2. **Validação jurídica ou tributária.** PROIND, DESENVOLVE e CCRLR são citados como contexto declarado; **nenhum** foi confirmado juridicamente.
3. **Validação de entitlements SPEC.** O botão existe apenas como **hipótese desligada por padrão**.
4. **Fórmulas no XLSX.** A planilha não contém fórmulas e nenhuma será adicionada (briefing §4.9).
5. **Migração de stack.**
6. **Edição dos arquivos de pesquisa originais.**