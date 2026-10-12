/* =============================================================================
   APLICACAO — estado, renderizacao, eventos.
   Separacao: dados (data.js) · calculo (engine.js) · apresentacao (este arquivo).
   Nenhuma formula de negocio e definida aqui.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const F = Calc.fmt;

  /* ------------------------------ utilitarios ----------------------------- */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c, a), ms); }; }
  function faixa(min, max, dec) {
    const d = dec === undefined ? 0 : dec;
    if (min === max) return F.num(min, d);
    return F.num(min, d) + ' a ' + F.num(max, d);
  }

  const NATUREZA = {
    publicado:   { rotulo: 'Dado publicado',               cls: 'ev--publicado',   mark: '' },
    cadastral:   { rotulo: 'Dado cadastral oficial',       cls: 'ev--cadastral',   mark: '' },
    declaracao:  { rotulo: 'Declaração empresarial/setorial', cls: 'ev--declaracao', mark: '' },
    estimativa:  { rotulo: 'Estimativa da pesquisa',       cls: 'ev--estimativa',  mark: '⚠' },
    premissa:    { rotulo: 'Premissa editável',            cls: 'ev--premissa',    mark: '' },
    pendente:    { rotulo: 'Pendente de validação',        cls: 'ev--pendente',    mark: '○' },
    academico:   { rotulo: 'Fonte acadêmica',              cls: 'ev--academico',   mark: '' },
    journalistica:{ rotulo: 'Fonte jornalística',          cls: 'ev--jornalistica',mark: '' }
  };
  function evTag(natureza) {
    const n = NATUREZA[natureza] || NATUREZA.pendente;
    return '<span class="ev ' + n.cls + '" data-mark="' + esc(n.mark) + '">' + esc(n.rotulo) + '</span>';
  }
  function badgeClass(pront) {
    if (/Alta/i.test(pront) && !/Média/i.test(pront)) return 'badge--alta';
    if (/Baixa/i.test(pront)) return 'badge--baixa';
    return 'badge--media';
  }
  function srcRefs(ids) {
    if (!ids || !ids.length) return '<span class="u-micro">sem fonte</span>';
    return '<span class="srclist">' + ids.map(id =>
      '<button type="button" class="src" data-src="' + esc(id) + '">' + esc(id) + '</button>').join('') + '</span>';
  }

  /* --------------------------------- estado -------------------------------- */
  const STORE_KEY = 'eps-bahia-retrofit-v1';
  const State = {
    area: AREAS[0].id,
    cenario: 'base',
    preset: 'base',
    calc: {},
    creditoAtivo: false,
    filtros: { papel: 'todos', regiao: 'todos', prontidao: 'todos', busca: '' },
    fontes: { tipo: 'todos', busca: '' },
    retorno: null
  };
  let storageOk = true;
  function salvar() {
    if (!storageOk) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        cenario: State.cenario, preset: State.preset, calc: State.calc,
        creditoAtivo: State.creditoAtivo, filtros: State.filtros, fontes: State.fontes
      }));
    } catch (e) { storageOk = false; avisarStorage(); }
  }
  function carregar() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.cenario) State.cenario = d.cenario;
      if (d.preset) State.preset = d.preset;
      if (d.calc) State.calc = d.calc;
      if (typeof d.creditoAtivo === 'boolean') State.creditoAtivo = d.creditoAtivo;
      if (d.filtros) Object.assign(State.filtros, d.filtros);
      if (d.fontes) Object.assign(State.fontes, d.fontes);
    } catch (e) { storageOk = false; }
  }
  function avisarStorage() {
    const n = $('#foot-storage');
    if (n) n.innerHTML = '<strong>Armazenamento local indisponível.</strong> As preferências desta sessão não serão lembradas ao recarregar a página. Todo o painel continua funcionando.';
  }

  /* ------------------------------- navegacao ------------------------------ */
  function renderNav() {
    $('#nav-list').innerHTML = AREAS.map(a =>
      '<li><a class="nav__link" href="#area-' + a.id + '" data-area="' + a.id + '">' +
      esc(a.nome) + '<small>' + esc(a.curto) + '</small></a></li>').join('');
  }
  function irPara(id, opcoes) {
    const alvo = $('#area-' + id);
    if (!alvo) return;
    State.area = id;
    $$('.section').forEach(s => s.classList.toggle('is-active', s.id === 'area-' + id));
    $$('.nav__link').forEach(n => {
      if (n.dataset.area === id) {
        n.setAttribute('aria-current', 'page');
        /* Em barra horizontal (mobile) a area ativa pode ficar fora da vista:
           traz para o centro para que o usuario veja onde esta. */
        if (n.scrollIntoView) n.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
      } else n.removeAttribute('aria-current');
    });
    if (!(opcoes && opcoes.semHash)) {
      if (location.hash !== '#area-' + id) {
        history.pushState({ area: id, fonte: null }, '', '#area-' + id);
      }
    }
    window.scrollTo(0, 0);
    if (!(opcoes && opcoes.semFoco)) alvo.focus({ preventScroll: true });
    salvar();
  }
  function areaDoHash() {
    const m = /^#area-([a-z]+)$/.exec(location.hash || '');
    return m ? m[1] : null;
  }

  /* ------------------ offset real do cabecalho (corrige D-24) -------------
     Mede a altura real do cabecalho e do navegador para que a navegacao
     sticky nunca fique escondida atras deles, em qualquer largura.
     As variaveis medidas (--nav-top, --scroll-offset) NAO sao usadas para
     dimensionar o proprio cabecalho: isso realimentaria a medicao. */
  function medirHeader() {
    const tb = $('.topbar'), nv = $('.nav');
    if (!tb || !nv) return;
    const h1 = tb.offsetHeight;
    /* Em >=1200px a navegacao vira barra lateral e nao ocupa altura acima do
       conteudo; o offset de rolagem e entao apenas a altura do cabecalho.
       Abaixo disso a barra de areas e horizontal e precisa entrar no offset. */
    const lateral = window.matchMedia('(min-width: 1200px)').matches;
    const offset = lateral ? h1 : h1 + nv.offsetHeight;
    const raiz = document.documentElement.style;
    if (raiz.getPropertyValue('--nav-top') !== h1 + 'px') raiz.setProperty('--nav-top', h1 + 'px');
    if (raiz.getPropertyValue('--scroll-offset') !== offset + 'px') raiz.setProperty('--scroll-offset', offset + 'px');
  }

  /* --------------------- painel de fonte (EV-01 / retorno) ---------------- */
  /* O painel e movido para dentro da secao ativa a cada abertura. Sem isso,
     um token de fonte clicado na Visao executiva abriria o registro dentro
     de uma secao que esta oculta. */
  function abrirFonte(id, origemEl) {
    const f = FONTES.find(x => x.id === id);
    if (!f) { toast('Fonte ' + id + ' não encontrada no catálogo.'); return; }
    State.retorno = origemEl || null;
    const urls = f.urls.length
      ? f.urls.map(u => '<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' +
          esc(u.length > 64 ? u.slice(0, 60) + '…' : u) + '</a></li>').join('')
      : (f.local ? '<li class="u-meta">' + esc(f.local) + '</li>' : '');
    const acesso = f.urls.length
      ? '<a href="' + esc(f.urls[0]) + '" target="_blank" rel="noopener noreferrer">Abrir fonte</a>'
      : (f.localLink
          ? '<a href="' + esc(f.localLink) + '">Abrir material anexado</a>'
          : '<span class="u-micro">Material não disponibilizado nesta revisão</span>');
    const painel = $('#fonte-painel');
    painel.innerHTML =
      '<div class="divergence" style="border-color:var(--accent);margin-top:var(--s5)">' +
        '<p class="divergence__t" style="color:var(--accent-ink);font-size:var(--fs-h4)">Fonte ' + esc(f.id) + ' — ' + esc(f.titulo) + '</p>' +
        '<p class="u-meta u-mt2"><strong>Tipo:</strong> ' + esc(f.tipo) + ' &nbsp;·&nbsp; <strong>Data:</strong> ' + esc(f.data) + '</p>' +
        '<p class="u-meta"><strong>O que sustenta:</strong> ' + esc(f.suporta) + '</p>' +
        (f.urls.length > 1 ? '<p class="u-micro u-mt2">Esta referência possui mais de um endereço:</p>' : '') +
        (urls ? '<ul class="u-meta">' + urls + '</ul>' : '') +
        '<p class="u-mt3">' + acesso + ' &nbsp; <button type="button" class="chip" id="fechar-fonte">Voltar ao ponto de leitura</button></p>' +
      '</div>';
    const secao = $('.section.is-active');
    (secao || $('.main')).appendChild(painel);
    painel.hidden = false;
    const btn = $('#fechar-fonte');
    btn.addEventListener('click', voltarDaFonte);
    const link = painel.querySelector('a[target="_blank"]');
    if (link) link.addEventListener('click', function () { history.pushState({ area: State.area, fonte: f.id }, '', location.href); });
    painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function voltarDaFonte() {
    const painel = $('#fonte-painel');
    painel.hidden = true; painel.innerHTML = '';
    if (State.retorno && document.contains(State.retorno)) State.retorno.focus({ preventScroll: false });
    else $('#area-' + State.area).focus({ preventScroll: true });
  }

  /* ============================ AREA 1 · VISÃO ============================= */
  const FUNDAMENTOS = [
    { t: 'A demanda passou a ser regulada', d: 'O Decreto 12.688/2025 tornou obrigatória a logística reversa de embalagens plásticas, com metas de recuperação de 32% em 2026 subindo a 50% em 2040 e de conteúdo reciclado de 22% a 40%. A partir de 2026 as grandes empresas precisam comprovar destinação. <span class="src" data-src="S-10">S-10</span>', natureza: 'publicado' },
    { t: 'A oferta regional já está organizada', d: 'Quatro cooperativas operam em Feira de Santana e há 16 cadastradas pela LIMPURB em Salvador, duas das quais já recebem isopor. O Sebrae articulou oito cooperativas baianas à indústria. <span class="src" data-src="S-08">S-08</span> <span class="src" data-src="S-09">S-09</span> <span class="src" data-src="S-07">S-07</span>', natureza: 'publicado' },
    { t: 'Não foi identificado operador de EPS', d: 'O levantamento não encontrou recicladora especializada em EPS na Bahia. As fábricas de EPS do estado produzem; a reciclagem é atendida por operadores em outros estados. <span class="src" data-src="S-04">S-04</span> <span class="src" data-src="S-15">S-15</span>', natureza: 'estimativa' }
  ];

  const KPIS_VISAO = [
    { label: 'Demanda industrial declarada de recicláveis em Feira e região', value: '332', unit: 't/mês',
      scope: '10 de 30 indústrias acompanhadas pelo Sebrae · cerca de 20 tipos de material · agosto de 2026',
      natureza: 'publicado', fontes: ['S-07'],
      implic: 'É o número mais citado e o mais frequentemente mal lido: mede plásticos recicláveis em geral, <strong>não EPS</strong>. Serve para dimensionar a conversa comercial, não para prometer volume de EPS.', lead: false },
    { label: 'Emissão pós-uso de EPS estimada na Bahia', value: '2.800 a 4.100', unit: 't/ano',
      scope: 'Cenário base · extrapolação por participação populacional (~6,9%) · produção nacional de 100 a 119,6 mil t/ano',
      natureza: 'estimativa', fontes: ['S-02', 'S-03', 'S-30'],
      implic: '<strong>É uma faixa, não um ponto.</strong> Não existe estudo público dimensionando EPS exclusivamente para a Bahia. Nunca use este valor como meta contratual sem validação setorial.', lead: true },
    { label: 'Recicladores de plásticos ativos no estado', value: '335', unit: 'estabelecimentos',
      scope: 'CNAE 38.32-7 · situação ativa · partição de 11/01/2026 · 34 deles em Feira de Santana',
      natureza: 'cadastral', fontes: ['S-42'],
      implic: 'Concorrência potencial em feedstock. O código <strong>não isola EPS</strong>: parte desses operadores pode já lidar com o material.', lead: false },
    { label: 'CAPEX estimado do hub de coleta e densificação', value: '150 a 400', unit: 'mil R$',
      scope: 'Estimativa própria para compactador, balança, prensa, galpão e frota leve · Fase 1 do roteiro',
      natureza: 'estimativa', fontes: [],
      implic: 'O valor só deve entrar em decisão depois dos gates de feedstock e de preço. A simulação permite testar a economia <strong>antes</strong> de investir.', lead: false }
  ];

  function renderVisao() {
    $('#fundamentos').innerHTML = FUNDAMENTOS.map(f =>
      '<div class="kpi" style="gap:var(--s2)">' +
        '<span class="kpi__label" style="color:var(--brand);font-size:var(--fs-h4)">' + esc(f.t) + '</span>' +
        '<p class="u-meta">' + f.d + '</p>' + evTag(f.natureza) + '</div>').join('');

    $('#kpis-visao').innerHTML = KPIS_VISAO.map(k =>
      '<div class="kpi' + (k.lead ? ' kpi--lead' : '') + '">' +
        '<span class="kpi__value">' + esc(k.value) + '<span class="kpi__unit">' + esc(k.unit) + '</span></span>' +
        '<span class="kpi__label">' + esc(k.label) + '</span>' +
        '<span class="kpi__rule"></span>' +
        evTag(k.natureza) +
        '<span class="kpi__scope"><strong>Escopo:</strong> ' + esc(k.scope) + '</span>' +
        '<span class="kpi__implic">' + k.implic + '</span>' +
        '<span class="kpi__scope">Fonte: ' + srcRefs(k.fontes) + '</span>' +
      '</div>').join('');

    $('#gates-visao').innerHTML = GATES.map(g => cardGate(g, false)).join('');
    $('#riscos-visao').innerHTML = RISCOS_QUEBRAM_TESE.map(r =>
      '<div class="gate gate--comercial">' +
        '<span class="gate__id" style="color:var(--ink)">' + esc(r.titulo) + '</span>' +
        '<p class="gate__c u-meta"><strong>Evidência:</strong> ' + esc(r.evidencia) + '</p>' +
        '<p class="gate__c u-meta"><strong>Mitigação prevista na pesquisa:</strong> ' + esc(r.mitigacao) + '</p>' +
        '<span class="kpi__scope">Fonte: ' + srcRefs(r.fontes) + '</span>' +
      '</div>').join('');

    const txt = 'Os prazos originais não foram alterados. O cabeçalho da versão anterior dizia “três gates em 90 dias”, mas o gate de incentivos já constava com 120 dias. A leitura correta é: <strong>validações comerciais em 90 dias</strong> (G1 e G2) e <strong>validação de incentivos em até 120 dias</strong> (G3).';
    $('#nota-prazos').innerHTML = '<strong>Sobre os prazos.</strong> ' + txt;
    $('#nota-prazos2').innerHTML = '<strong>Sobre os prazos.</strong> ' + txt;
  }

  function cardGate(g, comCheck) {
    return '<div class="gate gate--' + g.escopoPrazo + '">' +
      '<div class="gate__h"><span class="gate__id">' + esc(g.id) + ' · ' + esc(g.titulo) + '</span>' +
        '<span class="gate__st">não verificado</span></div>' +
      '<p class="gate__c"><strong>Condição:</strong> ' + esc(g.condicao) + '</p>' +
      '<dl><dt>Evidência</dt><dd>' + esc(g.evidencia) + '</dd>' +
        '<dt>Prazo</dt><dd>' + g.prazoDias + ' dias</dd>' +
        '<dt>Se falhar</dt><dd>' + esc(g.consequencia) + '</dd>' +
        '<dt>Fonte</dt><dd>' + srcRefs(g.fontes) + '</dd></dl>' +
      (comCheck ? '<div class="check"><input type="checkbox" data-gate="' + g.id + '" id="ck-' + g.id + '"><span for="ck-' + g.id + '">Marcar como verificado neste acompanhamento local</span></div>' : '') +
    '</div>';
  }

  /* ============================ AREA 2 · MERCADO ============================ */
  const KPIS_CAD = [
    { label: 'Estabelecimentos ativos no escopo amplo, Bahia', value: F.num(16204), unit: 'estabelecimentos',
      scope: '19 subclasses CNAE, principal <strong>ou</strong> secundária, situação ativa, partição 11/01/2026', natureza: 'cadastral', fontes: ['S-42'] },
    { label: 'Núcleo comparável entre estados', value: F.num(3754), unit: 'estabelecimentos',
      scope: 'CNAE <strong>principal</strong> dentro do escopo. É esta a base indicada para comparação regional', natureza: 'cadastral', fontes: ['S-42'] },
    { label: 'Recuperadores de plásticos ativos na Bahia', value: '335', unit: 'estabelecimentos',
      scope: 'CNAE 38.32-7 · <strong>34</strong> em Feira de Santana · <strong>140</strong> nos sete municípios do foco', natureza: 'cadastral', fontes: ['S-42'] },
    { label: 'Aberturas na cadeia baiana em 2025', value: F.num(1666), unit: 'novos CNPJs',
      scope: 'CNAE no escopo, por ano de início de atividade · eram ' + F.num(450) + ' em 2010', natureza: 'cadastral', fontes: ['S-42'] }
  ];

  const DIVERGENCIAS = [
    { a: 'Capital social do foco (sete municípios)', painel: 'R$ 72,53 bilhões', orig: 'O painel anterior exibia <strong>R$ 43,9 bilhões</strong>, sem lastro nos dados brutos', dec: 'Adotado o valor somado de <code>capital_social</code> em <code>rfb_players_ba.csv</code>, idêntico ao campo <code>ba.capital_social_foco_R</code> do JSON agregado.' },
    { a: 'Concentração do capital no foco', painel: '79,8% nos dez maiores', orig: 'O painel anterior exibia <strong>76,6%</strong>', dec: 'Recalculado sobre o CSV. Os dez maiores incluem <strong>quatro registros duplicados</strong>: ArcelorMittal e Gerdau aparecem duas vezes, em municípios diferentes — a métrica conta <em>estabelecimentos</em>, não empresas.' },
    { a: 'Participação da Bahia no total nacional', painel: 'Apresentada sem percentual único', orig: 'A planilha e o painel anterior declaravam <strong>5,85%</strong>, que corresponde a <code>16.204 ÷ 276.898</code>, mas o ranking exibia <code>15.781</code>', dec: 'Não há uma participação única defensável: <code>16.204 ÷ 276.898 = 5,70%</code> no recorte do ranking e <code>16.204 ÷ 276.898 = 5,85%</code> no escopo amplo. As duas bases medem coisas diferentes e não se combinam.' },
    { a: 'Percentuais de ranking e de município', painel: 'Denominador escrito em cada painel', orig: 'O painel anterior calculava o percentual sobre a soma das linhas exibidas e o apresentava como se fosse nacional ou estadual', dec: 'Todo percentual passou a exibir o denominador por extenso. O ranking de UF usa o total nacional de <code>276.898</code>; os municípios usam a soma dos sete municípios do foco.' },
    { a: 'Localização da Proecologic', painel: '“São Paulo — localidade em divergência entre as fontes”', orig: 'Relatório: <strong>Ribeirão Pires/SP</strong>. Planilha e painel anterior: <strong>Taubaté/SP</strong>', dec: 'Não resolvido. Ambas as versões estão registradas na ficha do ator. Nenhuma foi escolhida silenciosamente.' },
    { a: 'Emissão pós-uso na Bahia', painel: 'Faixa de <strong>2.800 a 4.100 t/ano</strong> (cenário base)', orig: 'A planilha registra <strong>3.450 t/ano</strong> como ponto único', dec: 'Prevalece a faixa do relatório, por ser a informação mais honesta. O ponto da planilha aparece identificado como valor representativo apenas quando um número único é indispensável.' },
    { a: 'Margem bruta de R$ 1,48/kg', painel: 'Removida do destaque', orig: 'Usada no painel anterior para multiplicar a oferta não atendida e gerar a faixa de R$ 2,7 a 4,0 milhões por ano', dec: 'Não é reproduzível a partir das premissas do próprio painel (com venda R$ 2,10 e compra R$ 0,50, a margem é R$ 1,56 por kg de saída). O valor monetário saiu da abertura por não ser receita projetada, faturamento capturável nem mercado endereçável em receita.' },
    { a: 'Contagem da razão “~66×”', painel: 'Removida do destaque', orig: 'Demanda potencial anual de Feira dividida pelos 60 t/ano de reciclados pelas cooperativas do município', dec: 'A aritmética é correta e a comparação não é homogênea: material, geografia, população e base de medição diferentes. Os indicadores passaram a ser apresentados separadamente, com escopo.' },
    { a: 'Contagem de fornecedores', painel: 'Um registro por entidade, com apelidos legados', orig: 'A planilha lista 28 linhas de <code>Players_Roadmap</code> com duplicidade: “Knauf Isopar®” e “Knauf Isopor (CNPJ confirmado)”, “Isobras” e “ISOBRAR”, “Isobahia” e “ABS Poliestireno”', dec: 'Identificadores internos estáveis de <code>A-01</code> a <code>A-27</code>, cada um com a lista de apelidos legados por arquivo de origem.' },
    { a: 'Aba “Calculadora” da planilha', painel: 'Corrigido no painel', orig: 'O relatório afirma que os valores podem ser recalculados na “aba Calculadora” da planilha', dec: 'A planilha tem sete abas e <strong>nenhuma delas possui fórmulas</strong> (verificado em todas as células). Não existe aba de calculadora. A referência não foi reproduzida e a planilha não foi alterada.' }
  ];

  function renderMercado() {
    /* chips de cenario */
    $('#chips-cenario').innerHTML = Object.keys(CENARIOS).map(k =>
      '<button type="button" class="chip" data-cen="' + k + '" aria-pressed="' + (k === State.cenario) + '">' +
      esc(CENARIOS[k].nome) + '</button>').join('');

    /* KPIs cadastrais */
    $('#kpis-cadastral').innerHTML = KPIS_CAD.map(k =>
      '<div class="kpi">' +
        '<span class="kpi__value">' + esc(k.value) + '<span class="kpi__unit">' + esc(k.unit) + '</span></span>' +
        '<span class="kpi__label">' + esc(k.label) + '</span>' +
        '<span class="kpi__rule"></span>' + evTag(k.natureza) +
        '<span class="kpi__scope"><strong>Escopo:</strong> ' + k.scope + '</span>' +
        '<span class="kpi__scope">Fonte: ' + srcRefs(k.fontes) + '</span>' +
      '</div>').join('');

    /* escopos comparaveis */
    $('#escopos').innerHTML = ESCOPOS_COMPARAVEIS.map(s =>
      '<div class="scopecard">' +
        '<span class="scopecard__v">' + F.num(s.v) + ' <small style="font-size:.6em;font-weight:600;color:var(--ink-3)">' + esc(s.unidade) + '</small></span>' +
        '<span class="scopecard__l">' + esc(s.rotulo) + '</span>' +
        evTag(s.natureza) +
        '<dl><dt>Material</dt><dd>' + esc(s.material) + '</dd>' +
        '<dt>Escopo</dt><dd>' + esc(s.escopo) + '</dd>' +
        '<dt>Fonte</dt><dd>' + srcRefs(s.fonte) + '</dd></dl>' +
      '</div>').join('');

    /* nota de reconciliacao */
    $('#nota-reconciliacao').innerHTML =
      '<strong>Denominadores e bases de comparação.</strong> ' +
      'A decomposição por setor soma <strong>' + F.num(SETORES_SOMA) + '</strong>, que é o <strong>escopo amplo</strong> — não o núcleo (' + F.num(3754) + '). ' +
      'As fatias setoriais correspondem a CNAE principal e, por isso, não cobrem os ' + F.num(12354) + ' estabelecimentos que entram por CNAE secundária. ' +
      'O ranking de UF usa o total nacional de <strong>' + F.num(TOTAL_NACIONAL) + '</strong>. ' +
      'Os percentuais de município usam a soma dos <strong>sete municípios do foco</strong> (' + F.num(FOCO_SOMA_ESCOPO) + '), não o estado. ' +
      'A contagem de BA no ranking nacional (' + F.num(15781) + ') <strong>não é a mesma</strong> do escopo amplo baiano (' + F.num(16204) + '): são recortes diferentes da mesma base. ' +
      'Fonte: <span class="src" data-src="S-42">S-42</span>';

    renderCenarios();
    renderFigAberturas();
    renderHbars('#fig-setores', SETORES_BA.map(s => ({ nome: s.nome, v: s.v, nota: s.nota })),
      'Ativos por setor na Bahia', 'Escopo amplo: CNAE principal <strong>ou</strong> secundária. Total do denominador: <strong>' + F.num(SETORES_SOMA) + '</strong> estabelecimentos.', { max: SETORES_BA[0].v });
    renderHbars('#fig-porte', PORTE_BA.map(s => ({ nome: s.nome, v: s.v })),
      'Estabelecimentos por porte', 'Escopo amplo da Bahia. Total do denominador: <strong>' + F.num(16204) + '</strong> estabelecimentos.', { max: PORTE_BA[0].v });
    renderHbars('#fig-municipios', MUNICIPIOS_FOCO.map(m => ({ nome: m.nome, v: m.escopo, nota: 'núcleo ' + F.num(m.nucleo) + ' · ' + m.recPlasticos + ' recuperadores' })),
      'Sete municípios do foco operacional', 'Denominador: a soma dos <strong>sete municípios listados</strong> (' + F.num(FOCO_SOMA_ESCOPO) + '). <strong>Não é a participação estadual</strong>.', { max: MUNICIPIOS_FOCO[0].escopo });
    renderUf();
  }

  function renderCenarios() {
    const c = CENARIOS[State.cenario];
    const linhas = [
      { nome: 'Consumo de EPS na Bahia', r: c.consumo, nota: 'Hipótese: ' + c.hipotese },
      { nome: 'Emissão pós-uso plausível', r: c.emissao, nota: '35% a 50% do consumo; exclui o que já retorna ao fabricante' },
      { nome: 'Reciclado no patamar nacional', r: c.reciclado, nota: 'Aplicando o índice nacional de 34,5%' },
      { nome: 'Oferta não atendida', r: c.naoAtendida, nota: 'Estimativa de material que não é efetivamente reciclado' }
    ];
    const max = Math.max.apply(null, linhas.map(l => Math.max(l.r[0], l.r[1])));
    $('#fig-cenarios').innerHTML =
      '<h3 class="figure__t">Como os cenários variam</h3>' +
      '<p class="figure__q">Cada barra representa uma <strong>faixa</strong>, não um ponto. A faixa mais estreita indica o cenário otimista, em que os limites superior e inferior coincidem por hipótese.</p>' +
      '<div style="margin:var(--s3) 0 var(--s2)">' + evTag('estimativa') +
        '<strong class="u-meta" style="margin-left:8px">Cenário ativo: ' + esc(c.nome) + ' — ' + esc(c.hipotese) + '</strong></div>' +
      '<div class="hbars">' + linhas.map(l => {
        const wMax = l.r[1] / max * 100, wMin = l.r[0] / max * 100;
        return '<div class="hbar" style="grid-template-columns:minmax(8rem,30%) 1fr auto">' +
          '<span class="hbar__name">' + esc(l.nome) + '</span>' +
          '<span class="hbar__track"><i style="position:absolute;left:' + wMin.toFixed(2) + '%;width:' + Math.max(0.6, wMax - wMin).toFixed(2) + '%;top:0;bottom:0;background:var(--accent);border-radius:2px;display:block"></i></span>' +
          '<span class="hbar__val">' + faixa(l.r[0], l.r[1]) + '<small>t/ano</small></span></div>';
      }).join('') + '</div>' +
      '<p class="figure__read"><b>Como ler:</b> a barra começa no limite inferior e termina no superior da faixa. No cenário ' +
        esc(c.nome) + ', a emissão pós-uso estimada é de <b>' + faixa(c.emissao[0], c.emissao[1]) + ' t/ano</b>, ' +
        'dos quais cerca de <b>' + faixa(c.reciclado[0], c.reciclado[1]) + ' t/ano</b> são reciclados no patamar nacional de 34,5%. ' +
        'Isso é <strong>extrapolação</strong>, não medição: não existe estudo público dimensionando EPS exclusivamente para a Bahia.</p>' +
      '<details class="valtable"><summary>Ver valores em tabela</summary>' +
        '<div class="tablewrap"><table><caption>Cenários de mercado, em toneladas por ano</caption><thead><tr><th scope="col">Grandeza</th><th scope="col">Conservador</th><th scope="col">Base</th><th scope="col">Otimista</th></tr></thead><tbody>' +
        '<tr><th scope="row">Consumo de EPS</th><td class="num">' + faixa(CENARIOS.cons.consumo[0], CENARIOS.cons.consumo[1]) + '</td><td class="num">' + faixa(CENARIOS.base.consumo[0], CENARIOS.base.consumo[1]) + '</td><td class="num">' + faixa(CENARIOS.otim.consumo[0], CENARIOS.otim.consumo[1]) + '</td></tr>' +
        '<tr><th scope="row">Emissão pós-uso</th><td class="num">' + faixa(CENARIOS.cons.emissao[0], CENARIOS.cons.emissao[1]) + '</td><td class="num">' + faixa(CENARIOS.base.emissao[0], CENARIOS.base.emissao[1]) + '</td><td class="num">' + faixa(CENARIOS.otim.emissao[0], CENARIOS.otim.emissao[1]) + '</td></tr>' +
        '<tr><th scope="row">Reciclado a 34,5%</th><td class="num">' + faixa(CENARIOS.cons.reciclado[0], CENARIOS.cons.reciclado[1]) + '</td><td class="num">' + faixa(CENARIOS.base.reciclado[0], CENARIOS.base.reciclado[1]) + '</td><td class="num">' + faixa(CENARIOS.otim.reciclado[0], CENARIOS.otim.reciclado[1]) + '</td></tr>' +
        '<tr><th scope="row">Oferta não atendida</th><td class="num">' + faixa(CENARIOS.cons.naoAtendida[0], CENARIOS.cons.naoAtendida[1]) + '</td><td class="num">' + faixa(CENARIOS.base.naoAtendida[0], CENARIOS.base.naoAtendida[1]) + '</td><td class="num">' + faixa(CENARIOS.otim.naoAtendida[0], CENARIOS.otim.naoAtendida[1]) + '</td></tr>' +
        '</tbody></table></div></details>' +
      '<p class="figure__legend"><span><i class="figure__swatch" style="background:var(--accent)"></i> faixa estimada</span>' +
      '<span><i class="figure__swatch" style="background:var(--warn)"></i> extrapolação da pesquisa, não medição</span></p>';
  }

  function renderFigAberturas() {
    const dados = ABERTURAS;
    const fechados = dados.filter(d => !d.parcial);
    const primeiro = fechados[0], ultimo = fechados[fechados.length - 1];
    const parcial = dados[dados.length - 1];
    const varPct = ((ultimo.v / primeiro.v) - 1) * 100;
    const W = 760, H = 250, padL = 48, padR = 14, padT = 14, padB = 42;
    const max = 1800;
    const bw = (W - padL - padR) / dados.length;
    const y = v => padT + (H - padT - padB) * (1 - v / max);
    let svg = '';
    for (let g = 0; g <= 4; g++) {
      const v = max * g / 4, yy = y(v);
      svg += '<line x1="' + padL + '" y1="' + yy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + yy.toFixed(1) + '" stroke="#DCE3E7"/>' +
             '<text x="' + (padL - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#52616B" font-variant-numeric="tabular-nums">' + F.num(v, 0) + '</text>';
    }
    dados.forEach((d, i) => {
      const x = padL + i * bw + bw * 0.16, w = bw * 0.68, yy = y(d.v);
      const cor = d.parcial ? '#9A5B13' : '#087F68';
      const rot = String(d.ano);
      svg += '<g class="barhit" tabindex="0" role="img" aria-label="' + esc(rot + ': ' + F.num(d.v) + ' aberturas' + (d.parcial ? ', ano parcial, apenas até 11 de janeiro de 2026' : '')) + '" data-x="' + (x + w / 2).toFixed(1) + '" data-y="' + yy.toFixed(1) + '" data-txt="' + esc(rot + ' — ' + F.num(d.v) + ' aberturas' + (d.parcial ? ' (parcial)' : '')) + '">' +
        '<rect x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (H - padB - yy).toFixed(1) + '" rx="2" fill="' + cor + '"/>' +
        '<title>' + esc(rot + ': ' + F.num(d.v) + ' aberturas' + (d.parcial ? ' (ano parcial)' : '')) + '</title></g>';
      if (i % 2 === 0) svg += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - padB + 16) + '" text-anchor="middle" font-size="11" fill="#52616B" font-variant-numeric="tabular-nums">' + rot + '</text>';
    });
    svg += '<line x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '" stroke="#C2CDD3"/>';
    const svgEl = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" ' +
      'aria-label="Gráfico de barras: aberturas anuais de empresas da cadeia de plásticos e reciclagem na Bahia, de ' +
      F.num(primeiro.v) + ' em ' + primeiro.ano + ' para ' + F.num(ultimo.v) + ' em ' + ultimo.ano + '">'
      + svg + '</svg>';

    $('#fig-aberturas').innerHTML =
      '<h3 class="figure__t">Como as aberturas evoluíram</h3>' +
      '<p class="figure__q">Novos CNPJs com CNAE no escopo, por ano de início de atividade, situação ativa.</p>' +
      '<div class="figure" style="position:relative;border:0;padding:0"><div class="tooltip" id="tt-abert"></div>' + svgEl + '</div>' +
      '<p class="figure__legend"><span><i class="figure__swatch" style="background:#087F68"></i> ano fechado</span>' +
      '<span><i class="figure__swatch" style="background:#9A5B13"></i> ano parcial, até 11/01/2026</span></p>' +
      '<p class="figure__read"><b>Leitura:</b> as aberturas passaram de <b>' + F.num(primeiro.v) + '</b> em ' + primeiro.ano +
      ' para <b>' + F.num(ultimo.v) + '</b> em ' + ultimo.ano + ', alta de <b>' + F.num(varPct, 0) + '%</b> em quinze anos. ' +
      'O ano de <b>' + parcial.ano + '</b> está em <b>' + F.num(parcial.v) + '</b> e <strong>não é comparável</strong> aos anos fechados: a partição da base é de 11 de janeiro de 2026, ou seja, o ano tem menos de um mês de registro. ' +
      'Fonte: <span class="src" data-src="S-42">S-42</span></p>' +
      '<details class="valtable"><summary>Ver valores em tabela</summary>' +
        '<div class="tablewrap"><table><caption>Aberturas anuais na cadeia, Bahia</caption><thead><tr><th scope="col">Ano</th><th scope="col" class="num">Aberturas</th><th scope="col">Observação</th></tr></thead><tbody>' +
        dados.map(d => '<tr><th scope="row">' + d.ano + '</th><td class="num">' + F.num(d.v) + '</td><td>' + (d.parcial ? 'Parcial — até 11/01/2026' : 'Ano fechado') + '</td></tr>').join('') +
        '</tbody></table></div></details>';
    ligarTooltip('#fig-aberturas');
  }

  function renderUf() {
    const todos = UF_NACIONAL.slice().sort((a, b) => b[1] - a[1]);
    const max = todos[0][1];
    const shareNacional = v => (v / TOTAL_NACIONAL * 100);
    const somaExibidas = todos.reduce((s, u) => s + u[1], 0);
    $('#fig-uf').innerHTML =
      '<h3 class="figure__t">Como os estados se comparam</h3>' +
      '<p class="figure__q">Posição da Bahia entre as 27 unidades da federação no recorte nacional da mesma base.</p>' +
      '<p class="denominador"><strong>Denominador:</strong> total nacional de <strong>' + F.num(TOTAL_NACIONAL) + '</strong> estabelecimentos. ' +
      'A barra representa a participação de cada estado <strong>no total nacional</strong>, e não a participação entre os estados exibidos.</p>' +
      '<div class="hbars">' + todos.map((u, i) =>
        '<div class="hbar">' +
          '<span class="hbar__name"><strong>' + esc(u[0]) + '</strong>' + (u[0] === 'BA' ? ' <span class="badge badge--alta">este estado</span>' : '') + (i === 5 ? ' <span class="u-micro">6ª posição</span>' : '') + '</span>' +
          '<span class="hbar__track"><i style="position:absolute;left:0;top:0;bottom:0;width:' + (u[1] / max * 100).toFixed(2) + '%;background:' + (u[0] === 'BA' ? '#123C35' : '#087F68') + ';border-radius:2px;display:block"></i></span>' +
          '<span class="hbar__val">' + F.num(u[1]) + '<small>' + F.num(shareNacional(u[1]), 2) + '% do Brasil</small></span>' +
        '</div>').join('') + '</div>' +
      '<p class="figure__read"><b>Leitura:</b> a Bahia aparece em <b>6ª posição</b> entre as 27 unidades neste recorte, com <b>' + F.num(15781) + '</b> estabelecimentos, o equivalente a <b>' + F.num(shareNacional(15781), 2) + '%</b> do total nacional. ' +
      '<strong>Atenção:</strong> este é o recorte <code>nacional</code> da base e <strong>não coincide</strong> com o escopo amplo baiano de <b>' + F.num(16204) + '</b> apresentado nos indicadores cadastrais — são recortes diferentes da mesma base, e não devem ser combinados. ' +
      'As 27 unidades somam ' + F.num(somaExibidas) + ', enquanto o total nacional declarado é ' + F.num(TOTAL_NACIONAL) + '. Fonte: <span class="src" data-src="S-42">S-42</span></p>' +
      '<details class="valtable"><summary>Ver valores em tabela</summary>' +
        '<div class="tablewrap"><table><caption>Estabelecimentos por unidade da federação</caption><thead><tr><th scope="col">UF</th><th scope="col" class="num">Estabelecimentos</th><th scope="col" class="num">% do Brasil</th></tr></thead><tbody>' +
        todos.map(u => '<tr' + (u[0] === 'BA' ? ' style="background:var(--tint-brand);font-weight:650"' : '') + '><th scope="row">' + esc(u[0]) + '</th><td class="num">' + F.num(u[1]) + '</td><td class="num">' + F.num(shareNacional(u[1]), 2) + '</td></tr>').join('') +
        '</tbody></table></div></details>';
  }

  /* -------------------- barras horizontais com denominador ---------------- */
  function renderHbars(seletor, linhas, titulo, denomTexto, opts) {
    opts = opts || {};
    const max = opts.max || Math.max.apply(null, linhas.map(l => l.v));
    const total = linhas.reduce((s, l) => s + l.v, 0);
    $(seletor).innerHTML =
      '<h3 class="figure__t">' + esc(titulo) + '</h3>' +
      '<p class="denominador">' + denomTexto + '</p>' +
      '<div class="hbars">' + linhas.map(l => {
        const share = total ? l.v / total * 100 : 0;
        return '<div class="hbar">' +
          '<span class="hbar__name">' + esc(l.nome) + (l.nota ? '<br><small class="u-micro">' + esc(l.nota) + '</small>' : '') + '</span>' +
          '<span class="hbar__track"><i style="position:absolute;left:0;top:0;bottom:0;width:' + (l.v / max * 100).toFixed(2) + '%;background:var(--accent);border-radius:2px;display:block"></i></span>' +
          '<span class="hbar__val">' + F.num(l.v) + '<small>' + F.num(share, 1) + '% do conjunto</small></span>' +
        '</div>';
      }).join('') + '</div>' +
      '<details class="valtable"><summary>Ver valores em tabela</summary>' +
        '<div class="tablewrap"><table><caption>' + esc(titulo) + '</caption><thead><tr><th scope="col">Categoria</th><th scope="col" class="num">Valor</th><th scope="col" class="num">% do conjunto</th></tr></thead><tbody>' +
        linhas.map(l => '<tr><th scope="row">' + esc(l.nome) + '</th><td class="num">' + F.num(l.v) + '</td><td class="num">' + F.num(l.v / total * 100, 1) + '</td></tr>').join('') +
        '<tr><th scope="row">Total</th><td class="num"><strong>' + F.num(total) + '</strong></td><td class="num">100,0</td></tr>' +
        '</tbody></table></div></details>';
  }

  function ligarTooltip(seletor) {
    const alvo = $(seletor);
    const tt = $('.tooltip', alvo);
    if (!tt) return;
    function mostrar(x, y, txt) {
      tt.textContent = txt; tt.style.left = x + 'px'; tt.style.top = y + 'px'; tt.classList.add('is-on');
    }
    function esconder() { tt.classList.remove('is-on'); }
    alvo.addEventListener('pointerover', e => {
      const g = e.target.closest('.barhit'); if (!g) return; mostrar(g.dataset.x, g.dataset.y, g.dataset.txt);
    });
    alvo.addEventListener('pointerout', e => { if (e.target.closest('.barhit')) esconder(); });
    alvo.addEventListener('focusin', e => {
      const g = e.target.closest('.barhit'); if (!g) return; mostrar(g.dataset.x, g.dataset.y, g.dataset.txt);
    });
    alvo.addEventListener('focusout', esconder);
    $$('.barhit', alvo).forEach(g => g.addEventListener('blur', esconder));
  }

  /* ========================= AREA 3 · TERRITÓRIO =========================== */
  function renderTerritorio() {
    const d = DENSIFICACAO;
    const maxCarga = d.caminhao.densificado;
    $('#fig-densificacao').innerHTML =
      '<h3 class="figure__t">Volume transportado contra massa transportada</h3>' +
      '<p class="figure__q">Um caminhão de ' + esc(d.caminhao.volume) + ' leva entre ' + F.num(d.caminhao.soltoMin) + ' e ' + F.num(d.caminhao.soltoMax) +
        ' kg de EPS solto. O mesmo volume de material já processado corresponde a cerca de ' + F.num(d.caminhao.densificado) + ' kg.</p>' +
      '<div style="display:flex;flex-direction:column;gap:10px;margin:var(--s3) 0">' +
        '<div><div style="display:flex;justify-content:space-between;font-size:var(--fs-meta);margin-bottom:3px"><span>EPS solto</span><span class="u-num">' + F.num(d.caminhao.soltoMin) + ' a ' + F.num(d.caminhao.soltoMax) + ' kg</span></div>' +
          '<div style="height:22px;background:var(--surface-sunken);border-radius:3px;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:' + (d.caminhao.soltoMax / maxCarga * 100).toFixed(2) + '%;background:var(--ink-3);border-radius:3px;display:block"></i></div></div>' +
        '<div><div style="display:flex;justify-content:space-between;font-size:var(--fs-meta);margin-bottom:3px"><span>Material densificado</span><span class="u-num">' + F.num(d.caminhao.densificado) + ' kg</span></div>' +
          '<div style="height:22px;background:var(--surface-sunken);border-radius:3px;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:100%;background:var(--accent);border-radius:3px;display:block"></i></div></div>' +
      '</div>' +
      '<p class="figure__read"><b>Leitura:</b> o mesmo espaço transporta <strong>entre 15 e 60 vezes mais massa</strong> depois de densificado. ' +
      'É essa razão que torna a densificação na origem condição de viabilidade e não apenas melhoria logística. Fonte: <span class="src" data-src="S-15">S-15</span></p>';

    $('#polos').innerHTML = POLOS.map(p => {
      const centro = /centro da operação/.test(p.nome);
      const fora = /Fora da Bahia/.test(p.nome);
      return '<div class="polo' + (centro ? ' polo--centro' : '') + (fora ? ' polo--fora' : '') + '">' +
        '<h3 class="polo__t">' + esc(p.nome) + '</h3>' +
        p.itens.map(i => '<div class="polo__i">' + esc(i.t) +
          (i.ator ? ' <button type="button" class="src" data-ator="' + i.ator + '">ver ficha</button>' : '') + '</div>').join('') +
      '</div>';
    }).join('');
  }

  /* ========================== AREA 4 · CADEIA ============================= */
  const FLUXO = [
    { n: 'Etapa 1', t: 'Origem do EPS', d: 'Refugo pós-industrial das fábricas de EPS da Bahia e material pós-consumo de cooperativas, varejo, pesca e saúde.', actors: ['A-01', 'A-02', 'A-03', 'A-04', 'A-05'] },
    { n: 'Etapa 2', t: 'Coleta e triagem', d: 'Separação por fração na origem. Sem triagem, material contaminado não é regranulável.', actors: ['A-09', 'A-10', 'A-11', 'A-12', 'A-13'] },
    { n: 'Etapa 3 · o investimento', t: 'Densificação', d: 'Compactação na origem. É esta etapa que a Fase 1 propõe. Referência de equipamento: 18 a 22 kg/h.', actors: [] },
    { n: 'Etapa 4', t: 'Compradores e aplicações', d: 'Destinadores de feedstock, fábricas que usam conteúdo reciclado, construção civil e compra de certificados.', actors: ['A-06', 'A-07', 'A-08'] }
  ];

  function renderCadeia() {
    $('#cadeia-fluxo').innerHTML = FLUXO.map((f, i) =>
      '<div class="chain__col' + (i === 2 ? ' chain__col--op' : '') + '">' +
        '<div class="chain__h">' + esc(f.n) + '</div>' +
        '<div class="chain__b">' +
          '<div class="chain__i"><b>' + esc(f.t) + '</b><span>' + esc(f.d) + '</span></div>' +
          (f.actors.length ? f.actors.map(a => {
            const at = ATORES.find(x => x.id === a);
            return at ? '<div class="chain__i">' + esc(at.nome) + ' <button type="button" class="src" data-ator="' + a + '">' + esc(a) + '</button></div>' : '';
          }).join('') : '') +
        '</div>' +
      '</div>').join('');

    /* filtros */
    const papeis = ['todos', 'fornecedor', 'fornecedor+cliente', 'cliente', 'institucional'];
    const regioes = ['todos'].concat(Array.from(new Set(ATORES.map(a => a.regiao))).sort());
    const pront = ['todos', 'Alta', 'Média-alta', 'Média', 'Parceiro institucional'];
    $('#f-papel').innerHTML = papeis.map(p =>
      '<button type="button" class="chip" data-f="papel" data-v="' + esc(p) + '" aria-pressed="' + (State.filtros.papel === p) + '">' +
      esc(p === 'todos' ? 'Todos' : p === 'fornecedor+cliente' ? 'Fornecedor e cliente' : p.charAt(0).toUpperCase() + p.slice(1)) + '</button>').join('');
    $('#f-regiao').innerHTML = regioes.map(r =>
      '<button type="button" class="chip" data-f="regiao" data-v="' + esc(r) + '" aria-pressed="' + (State.filtros.regiao === r) + '">' +
      esc(r === 'todos' ? 'Todos' : r) + '</button>').join('');
    $('#f-pront').innerHTML = pront.map(p =>
      '<button type="button" class="chip" data-f="prontidao" data-v="' + esc(p) + '" aria-pressed="' + (State.filtros.prontidao === p) + '">' +
      esc(p === 'todos' ? 'Todas' : p) + '</button>').join('');
    renderAtores();
  }

  function atoresFiltrados() {
    const q = State.filtros.busca.trim().toLowerCase();
    return ATORES.filter(a => {
      if (State.filtros.papel !== 'todos' && a.papel !== State.filtros.papel) return false;
      if (State.filtros.regiao !== 'todos' && a.regiao !== State.filtros.regiao) return false;
      if (State.filtros.prontidao !== 'todos' && a.prontidao !== State.filtros.prontidao) return false;
      if (q) {
        const alvo = (a.nome + ' ' + (a.razao || '') + ' ' + a.papelTxt + ' ' + a.municipio + ' ' + a.material).toLowerCase();
        if (alvo.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function renderAtores() {
    const lista = atoresFiltrados();
    const tb = $('#tab-actors tbody');
    if (!lista.length) {
      tb.innerHTML = '<tr><td colspan="7"><div class="empty"><b>Nenhum ator encontrado</b>Ajuste a busca ou os filtros. O painel contém ' + ATORES.length + ' atores mapeados pela pesquisa.</div></td></tr>';
    } else {
      tb.innerHTML = lista.map(a =>
        '<tr tabindex="0" role="button" data-ator="' + a.id + '" aria-label="Ver ficha de ' + esc(a.nome) + '">' +
          '<td class="id">' + esc(a.id) + '</td>' +
          '<td><strong>' + esc(a.nome) + '</strong>' + (a.razao && a.razao !== a.nome ? '<br><small class="u-micro">' + esc(a.razao) + '</small>' : '') + '</td>' +
          '<td>' + esc(a.papelTxt) + '</td>' +
          '<td>' + esc(a.municipio) + '</td>' +
          '<td>' + esc(a.material) + '</td>' +
          '<td><span class="badge ' + badgeClass(a.prontidao) + '">' + esc(a.prontidao) + '</span></td>' +
          '<td>' + evTag(a.natureza) + ' ' + srcRefs(a.fontes) + '</td>' +
        '</tr>').join('');
    }
    const res = $('#resumo-actors');
    res.textContent = 'Exibindo ' + lista.length + ' de ' + ATORES.length + ' atores mapeados pela pesquisa.';
  }
  function fichaAtor(id) {
    const a = ATORES.find(x => x.id === id);
    if (!a) return;
    const div = $('#detalhe-ator');
    div.innerHTML =
      '<div class="divergence" style="border-color:var(--accent);margin-top:var(--s5)">' +
        '<p class="divergence__t" style="color:var(--accent-ink);font-size:var(--fs-h4)">' + esc(a.id) + ' · ' + esc(a.nome) + '</p>' +
        (a.razao && a.razao !== a.nome ? '<p class="u-meta"><strong>Razão social:</strong> ' + esc(a.razao) + '</p>' : '') +
        '<dl style="display:grid;grid-template-columns:auto 1fr;gap:4px var(--s4);font-size:var(--fs-meta);margin:var(--s3) 0">' +
          '<dt style="font-weight:650;color:var(--ink-3)">Papel</dt><dd style="margin:0">' + esc(a.papelTxt) + '</dd>' +
          '<dt style="font-weight:650;color:var(--ink-3)">Localização</dt><dd style="margin:0">' + esc(a.municipio) + '</dd>' +
          '<dt style="font-weight:650;color:var(--ink-3)">Material</dt><dd style="margin:0">' + esc(a.material) + '</dd>' +
          '<dt style="font-weight:650;color:var(--ink-3)">Prontidão</dt><dd style="margin:0"><span class="badge ' + badgeClass(a.prontidao) + '">' + esc(a.prontidao) + '</span></dd>' +
          '<dt style="font-weight:650;color:var(--ink-3)">Evidência</dt><dd style="margin:0">' + evTag(a.natureza) + ' ' + srcRefs(a.fontes) + '</dd>' +
        '</dl>' +
        '<p class="u-meta"><strong>Limitação:</strong> ' + esc(a.limitacao) + '</p>' +
        '<p class="u-meta u-mt2"><strong>Próxima validação comercial sugerida:</strong> ' + esc(a.proxima) + '</p>' +
        '<p class="u-micro u-mt2">Apelidos nas fontes originais: ' + esc(a.aliases.join(', ')) + '</p>' +
        '<p class="u-mt3"><button type="button" class="chip" id="fechar-ator">Fechar ficha</button></p>' +
      '</div>';
    const b = $('#fechar-ator');
    if (b) b.addEventListener('click', function () {
      div.innerHTML = ''; div.dataset.fonteAtual = '';
      const linha = $('#tab-actors tbody tr[data-ator="' + a.id + '"]');
      if (linha) linha.focus(); else $('#area-cadeia').focus({ preventScroll: true });
    });
    div.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ======================== AREA 5 · VIABILIDADE =========================== */
  function valoresAtuais() {
    /* "personalizado" nao e uma entrada de PRESETS: e o estado em que o
       usuario edita uma premissa. Nesses casos os valores vem de State.calc;
       o preset mais proximo serve apenas como piso para campos ainda vazios. */
    const preset = PRESETS[State.preset] || PRESETS.base;
    const v = {};
    CAMPOS_CALC.forEach(c => {
      const guardado = State.calc[c.key];
      v[c.key] = guardado === undefined || guardado === null
        ? String(preset.valores[c.key])
        : String(guardado);
    });
    return v;
  }
  function renderCampos() {
    ['operacional', 'economico', 'capacidade', 'credito'].forEach(grupo => {
      const host = $('#g-' + grupo);
      if (!host) return;
      const campos = CAMPOS_CALC.filter(c => c.grupo === grupo);
      host.innerHTML = campos.map(c => {
        const v = valoresAtuais()[c.key];
        return '<div class="calcrow">' +
          '<div class="calcrow__l"><label for="i-' + c.key + '">' + esc(c.rotulo) + '</label>' +
            '<span class="calcrow__u">' + esc(c.unidade) + '</span></div>' +
          '<input type="text" inputmode="decimal" id="i-' + c.key + '" data-k="' + c.key + '" value="' + esc(v) + '" ' +
            'aria-describedby="h-' + c.key + ' e-' + c.key + '" autocomplete="off" spellcheck="false">' +
          '<div class="calcrow__h" id="h-' + c.key + '">' + esc(c.ajuda) + '</div>' +
          '<div class="calcrow__e" id="e-' + c.key + '" role="alert" hidden></div>' +
        '</div>';
      }).join('');
    });
    const ck = $('#chk-credito');
    if (ck) ck.checked = State.creditoAtivo;
  }
  function aplicarPreset(id) {
    if (!PRESETS[id]) return;
    State.preset = id;
    State.calc = {};
    const v = PRESETS[id].valores;
    State.creditoAtivo = !!v.creditoAtivo;
    renderCampos();
    $$('#chips-preset .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === id)));
    $('#preset-origem').innerHTML = '<strong>' + esc(PRESETS[id].nome) + '</strong> — ' + esc(PRESETS[id].origem);
    recalcular(); salvar();
  }
  function renderPresets() {
    $('#chips-preset').innerHTML = Object.keys(PRESETS).map(k =>
      '<button type="button" class="chip" data-preset="' + k + '" aria-pressed="' + (k === State.preset) + '">' +
      esc(PRESETS[k].nome.split(' — ')[0]) + '</button>').join('') +
      '<button type="button" class="chip" data-preset="personalizado" aria-pressed="false">Personalizado</button>';
    $('#preset-origem').innerHTML = '<strong>' + esc((PRESETS[State.preset] || PRESETS.base).nome) + '</strong> — ' + esc((PRESETS[State.preset] || PRESETS.base).origem);
  }

  let ultimoCalculo = null;
  function recalcular() {
    const v = valoresAtuais();
    const r = Calc.calcular(v, { creditoAtivo: State.creditoAtivo });
    ultimoCalculo = r;

    /* campos */
    CAMPOS_CALC.forEach(c => {
      const inp = $('#i-' + c.key), err = $('#e-' + c.key);
      if (!inp || !err) return;
      const st = r.campos[c.key];
      if (st.estado === 'ok') {
        inp.setAttribute('aria-invalid', 'false');
        inp.removeAttribute('aria-describedby-state');
        err.hidden = true; err.textContent = '';
      } else {
        inp.setAttribute('aria-invalid', 'true');
        err.hidden = false;
        err.textContent = st.msg || 'Valor inválido.';
      }
    });

    const presetAtivo = State.preset;
    if (!r.valido) { $('#resultados').innerHTML = resultadoInvalido(); }
    else { $('#resultados').innerHTML = resultadoHtml(r); }
    $$('#chips-preset .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === presetAtivo)));

    renderCapacidade(r);
    renderWaterfall(r);
    renderSensVolume(v);
    renderSensPreco(v);
    renderCenariosCalc();
    $('#nao-modelados').innerHTML = ITENS_NAO_MODELADOS.map(t => '<li>' + esc(t) + '</li>').join('');
  }

  function resultadoInvalido() {
    const invalidos = CAMPOS_CALC.filter(c => ultimoCalculo.campos[c.key].estado !== 'ok');
    return '<div class="results__h"><b>Resultado não calculado</b><span>Corrija os campos indicados para obter um resultado</span></div>' +
      '<div style="padding:var(--s4)"><div class="alert alert--danger"><div><b>Premissa inválida.</b> ' +
      'Nenhum resultado é exibido enquanto houver valor fora do domínio aceitável — inclusive para evitar que um valor impossível produza um número apparently correto.' +
      '<ul style="margin:var(--s2) 0 0 1.1em">' + invalidos.map(c =>
        '<li>' + esc(c.rotulo) + ': ' + esc(ultimoCalculo.campos[c.key].msg) + '</li>').join('') + '</ul></div></div></div>';
  }

  function resultadoHtml(r) {
    const R = r.resultado, C = r.capacidade;
    const neg = v => v < 0 ? 'rrow--neg' : '';
    let linhas = '';
    linhas += '<div class="rrow"><span>Massa de entrada</span><b>' + F.num(R.massaEntradaTon, 2) + ' t/mês (' + F.num(R.massaEntradaKg) + ' kg)</b></div>';
    linhas += '<div class="rrow"><span>Massa de saída, líquida de ' + F.num(R.perdaPct, 0) + '% de perda</span><b>' + F.num(R.massaSaidaKg) + ' kg</b></div>';
    linhas += '<div class="rrow ' + neg(-R.receitaMaterial) + '"><span>Receita com material densificado</span><b>' + F.brl(R.receitaMaterial) + '</b></div>';
    if (r.creditoAtivo) {
      linhas += '<div class="rrow"><span>Receita hipotética com créditos</span><b>' + F.brl(R.receitaCreditos) + '</b></div>';
    } else {
      linhas += '<div class="rrow"><span>Receita com créditos</span><b style="color:var(--ink-3)">hipótese desligada</b></div>';
    }
    linhas += '<div class="rrow ' + neg(R.custoTotal) + '"><span>(−) Compra do EPS solto</span><b>−' + F.brl(R.custoCompra) + '</b></div>';
    linhas += '<div class="rrow ' + neg(R.custoLogistica) + '"><span>(−) Logística</span><b>−' + F.brl(R.custoLogistica) + '</b></div>';
    linhas += '<div class="rrow ' + neg(R.custoFixo) + '"><span>(−) Custo fixo</span><b>−' + F.brl(R.custoFixo) + '</b></div>';
    linhas += '<div class="rrow"><span>Receita total</span><b>' + F.brl(R.receitaTotal) + '</b></div>';
    linhas += '<div class="rrow rrow--key' + (R.resultadoMensal < 0 ? ' is-neg' : '') + '"><span>Resultado mensal estimado</span><b>' + F.brl(R.resultadoMensal) + '</b></div>';
    linhas += '<div class="rrow"><span>Margem sobre receita</span><b>' +
      (R.margemSobreReceita === null ? '<span class="rrow__why">receita total zero — margem não definida</span>' : F.pct(R.margemSobreReceita * 100)) + '</b></div>';
    linhas += '<div class="rrow"><span>Payback simples do CAPEX</span><b>' +
      (R.paybackMeses === null ? '<span class="rrow__why">não aplicável</span>'
        : F.num(R.paybackMeses, 1) + ' meses <small style="color:var(--ink-3);font-weight:400">(' + F.num(R.paybackMeses / 12, 1) + ' anos)</small>') + '</b></div>';
    if (R.paybackMeses === null) {
      linhas += '<div class="rrow"><span>Motivo</span><b class="rrow__why">' + esc(R.paybackMotivo) + '</b></div>';
    }
    if (r.creditoAtivo) {
      linhas += '<div class="rrow"><span>Resultado sem a hipótese de créditos</span><b>' + F.brl(R.resultadoSemCreditos) + '</b></div>';
      linhas += '<div class="rrow"><span>Diferença atribuída aos créditos</span><b>' + F.brl(R.deltaCreditos) + '</b></div>';
    }

    return '<div class="results__h"><b>Resultado do modelo</b><span>Resultado operacional estimado de um modelo simplificado — não é lucro líquido, fluxo de caixa completo nem EBITDA auditado</span></div>' +
      linhas +
      '<div style="padding:var(--s3) var(--s4);font-size:var(--fs-micro);color:var(--ink-2)">' +
        (r.creditoAtivo
          ? 'A hipótese de créditos está <strong>ligada</strong> e adiciona ' + F.brl(R.receitaCreditos) + '/mês sobre ' +
            F.num(ultimoCalculo.campos.elegivelTon.valor, 1) + ' t/mês de massa elegível. Tratá-la como receita garantida seria incorreto: depende de comprovação perante entidade gestora homologada.' +
            (R.receitaCreditos === 0
              ? ' <strong>Nenhuma receita de crédito está sendo computada</strong> porque a massa elegível informada é zero. Informe a massa elegível para estimar esse efeito.'
              : '')
          : 'A hipótese de créditos está <strong>desligada</strong>. O resultado acima <strong>não inclui</strong> nenhuma receita de certificados de reciclagem.') +
      '</div>';
  }

  function renderCapacidade(r) {
    const host = $('#capacidade-aviso');
    if (!r.valido) { host.innerHTML = ''; return; }
    const C = r.capacidade;
    if (C.compativel) {
      host.innerHTML = '<div class="alert alert--ok"><div><b>Capacidade compatível.</b> O volume desejado de ' + F.num(r.resultado.massaEntradaTon, 2) +
        ' t/mês cabe na capacidade informada de ' + F.num(C.capacidadeMensalTon, 2) + ' t/mês. ' +
        'Conferindo: ' + F.num(C.qtd) + ' equipamento(s) × ' + F.num(C.kgHora) + ' kg/h × ' + F.num(C.horas) + ' h/mês × ' + F.num(C.utilizacao, 0) + '% de utilização.</div></div>';
    } else {
      host.innerHTML = '<div class="alert alert--danger"><div><b>Capacidade insuficiente.</b> O volume desejado de ' + F.num(r.resultado.massaEntradaTon, 2) +
        ' t/mês <strong>excede</strong> a capacidade informada de ' + F.num(C.capacidadeMensalTon, 2) + ' t/mês em ' + F.num(C.excesso, 2) + ' t/mês. ' +
        'Para processar o volume desejado seriam necessários cerca de <strong>' + C.equipamentosNecessarios + ' equipamentos</strong> nas condições informadas (' + F.num(C.qtd) + ' informados). ' +
        '<strong>O resultado econômico acima é calculado para o volume desejado e não foi ajustado.</strong> Nenhum volume, custo ou CAPEX foi alterado para tornar a simulação coerente.</div></div>' +
        '<div class="alert alert--info u-mt3"><div><b>Referência de equipamento.</b> As fichas técnicas citadas pela pesquisa indicam <strong>18 a 22 kg/h</strong>. ' +
        'Nessas condições, um único equipamento em um turno de 160 h/mês produz de <strong>2,88 a 3,52 t/mês</strong>. ' +
        'Um padrão de 20 t/mês equivale a cerca de <strong>6 a 7 equipamentos</strong> nessas condições. ' +
        'Fontes: <span class="src" data-src="S-35">S-35</span> <span class="src" data-src="S-36">S-36</span></div></div>';
    }
  }

  function renderWaterfall(r) {
    const host = $('#fig-waterfall');
    if (!r.valido) { host.innerHTML = ''; return; }
    const R = r.resultado;
    const itens = [
      { t: 'Receita material', v: R.receitaMaterial, c: 'var(--accent)' },
      { t: 'Créditos', v: r.creditoAtivo ? R.receitaCreditos : 0, c: '#0E7C6B' },
      { t: 'Compra', v: -R.custoCompra, c: 'var(--danger)' },
      { t: 'Logística', v: -R.custoLogistica, c: '#C4473C' },
      { t: 'Custo fixo', v: -R.custoFixo, c: '#9A5B13' },
      { t: 'Resultado', v: R.resultadoMensal, c: R.resultadoMensal >= 0 ? 'var(--brand)' : 'var(--danger-ink)' }
    ];
    const maxAbs = Math.max.apply(null, itens.map(i => Math.abs(i.v)));
    host.innerHTML =
      '<h3 class="figure__t">Como receitas e custos formam o resultado</h3>' +
      '<p class="figure__q">Composição do resultado mensal estimado, em R$. Barras proporcionais ao maior valor absoluto da série.</p>' +
      '<div class="waterfall">' + itens.map(i =>
        '<div class="wf"><span class="wf__t">' + esc(i.t) + '</span>' +
          '<span class="wf__b"><i style="left:0;width:' + (Math.abs(i.v) / maxAbs * 100).toFixed(1) + '%;background:' + i.c + '"></i></span>' +
          '<span class="wf__v">' + (i.v < 0 ? '−' : '') + F.brl(Math.abs(i.v)).replace('R$ ', 'R$ ') + '</span></div>').join('') +
      '</div>' +
      '<p class="figure__read"><b>Leitura:</b> a receita de material é de <b>' + F.brl(R.receitaMaterial) + '</b> contra custo total de <b>' + F.brl(R.custoTotal) + '</b>. ' +
      (r.creditoAtivo ? 'A hipótese de créditos acrescenta <b>' + F.brl(R.receitaCreditos) + '</b>. ' : 'Nenhuma receita de créditos está incluída. ') +
      'O custo fixo mensal de <b>' + F.brl(R.custoFixo) + '</b> representa <b>' + F.num(R.custoTotal ? R.custoFixo / R.custoTotal * 100 : 0, 1) + '%</b> do custo total.</p>' +
      '<details class="valtable"><summary>Ver valores em tabela</summary><div class="tablewrap"><table><caption>Composição do resultado mensal</caption><thead><tr><th scope="col">Item</th><th scope="col" class="num">Valor</th></tr></thead><tbody>' +
      itens.map(i => '<tr><th scope="row">' + esc(i.t) + '</th><td class="num">' + F.brl(i.v) + '</td></tr>').join('') +
      '</tbody></table></div></details>';
  }

  function graficoSens(seletor, serie, rotuloX, formatador, titulo, pergunta, leitura) {
    const host = $(seletor);
    if (!host) return;
    if (!serie.length || serie.every(s => s.resultado === null)) {
      host.innerHTML = '<h3 class="figure__t">' + esc(titulo) + '</h3><div class="empty">Corrija as premissas para exibir esta visualização.</div>';
      return;
    }
    const vals = serie.map(s => s.resultado);
    /* Escala de meia-largura: o zero fica no centro da pista, entao cada
       barra ocupa no maximo 50% do total (da linha do zero ate a borda).
       Usar 100% aqui faria a barra maxima ir de 50% a 150% e estourar. */
    const maxAbs = Math.max.apply(Math.max, vals.map(Math.abs).concat([0])) || 1;
    host.innerHTML =
      '<h3 class="figure__t">' + esc(titulo) + '</h3>' +
      '<p class="figure__q">' + esc(pergunta) + '</p>' +
      '<div class="hbars" style="gap:2px">' + serie.map(s => {
        const pos = s.resultado >= 0;
        const larg = Math.abs(s.resultado) / maxAbs * 50;
        return '<div class="hbar" style="grid-template-columns:minmax(5.5rem,26%) 1fr auto;padding:5px 0">' +
          '<span class="hbar__name"><strong class="u-num">' + esc(rotuloX(s)) + '</strong></span>' +
          '<span class="hbar__track" style="height:20px">' +
            '<i style="position:absolute;top:0;bottom:0;left:' + (pos ? '50%' : (50 - larg) + '%') + ';width:' + Math.max(larg, 0.4).toFixed(2) + '%;background:' + (pos ? 'var(--accent)' : 'var(--danger)') + ';border-radius:2px;display:block"></i>' +
            '<i style="position:absolute;top:-2px;bottom:-2px;left:calc(50% - 0.5px);width:1px;background:var(--line-strong);display:block"></i>' +
          '</span>' +
          '<span class="hbar__val" style="min-width:6.5rem">' + (pos ? '' : '−') + F.brl(Math.abs(s.resultado)) + '</span>' +
        '</div>';
      }).join('') + '</div>' +
      '<p class="figure__legend"><span><i class="figure__swatch" style="background:var(--accent)"></i> resultado positivo</span>' +
      '<span><i class="figure__swatch" style="background:var(--danger)"></i> resultado negativo</span>' +
      '<span><i class="figure__swatch" style="background:var(--line-strong)"></i> linha do zero</span></p>' +
      '<p class="figure__read">' + leitura(serie) + '</p>' +
      '<details class="valtable"><summary>Ver valores em tabela</summary><div class="tablewrap"><table><caption>' + esc(titulo) + '</caption><thead><tr><th scope="col">' + esc(rotuloX({ v: 'x', p: 'x', resultado: 0 }).replace(/^.*$/, 'Valor da premissa')) + '</th><th scope="col" class="num">Resultado mensal</th></tr></thead><tbody>' +
      serie.map(s => '<tr><th scope="row">' + esc(rotuloX(s)) + '</th><td class="num">' + (s.resultado < 0 ? '−' : '') + F.brl(Math.abs(s.resultado)) + '</td></tr>').join('') +
      '</tbody></table></div></details>';
  }

  function renderSensVolume(base) {
    const vols = [5, 10, 15, 20, 30, 40];
    const serie = Calc.serieVolume(base, vols);
    const ve = Calc.volumeEquilibrio(base);
    graficoSens('#fig-sens-volume', serie, s => F.num(s.v, 0) + ' t/mês',
      null, 'Em qual volume o resultado se torna positivo',
      'Resultado mensal estimado em função do volume de entrada, com as demais premissas mantidas. Créditos desligados.',
      serie => {
        const eq = ve !== null ? 'O modelo cruza zero em <b>' + F.num(ve, 2) + ' t/mês</b>.' : 'Com as premissas atuais, o modelo <b>não tem volume de equilíbrio positivo</b>: a margem de contribuição por tonelada é negativa, de modo que aumentar o volume amplia o prejuízo.';
        return '<b>Leitura:</b> o resultado é negativo até ' +
          (serie.find(s => s.resultado >= 0) ? '<b>' + F.num(serie.find(s => s.resultado >= 0).v, 0) + ' t/mês</b>' : 'o fim da faixa testada') +
          '. ' + eq;
      });
  }
  function renderSensPreco(base) {
    const precos = [1.5, 1.8, 2.1, 2.4, 2.8];
    const serie = Calc.seriePreco(base, precos);
    graficoSens('#fig-sens-preco', serie, s => 'R$ ' + F.num(s.p, 2).replace(',00', '') + '/kg',
      null, 'Sensibilidade ao preço de venda',
      'Resultado mensal estimado em função do preço de venda do material densificado, com as demais premissas mantidas.',
      serie => '<b>Leitura:</b> o resultado varia de <b>' + F.brl(serie[0].resultado) + '</b> a <b>' + F.brl(serie[serie.length - 1].resultado) +
        '</b> na faixa de preço testada. ' + (serie[0].resultado < 0
          ? 'Mesmo no ponto mais alto da faixa de <strong>estimativa da pesquisa</strong> (R$ 2,80/kg), o modelo ' + (serie[serie.length - 1].resultado < 0 ? '<b>permanece negativo</b>' : 'se torna positivo, mas com margem estreita') + '.'
          : 'Em toda a faixa testada o resultado é positivo.'));
  }

  function renderCenariosCalc() {
    const tb = $('#tab-cenarios-calc tbody');
    const linhas = Object.keys(PRESETS).map(k => {
      const v = PRESETS[k].valores;
      const r = Calc.calcular(v, { creditoAtivo: false });
      if (!r.valido) return null;
      return { k: k, nome: PRESETS[k].nome.split(' — ')[0], v: v, r: r };
    }).filter(Boolean);
    if (!linhas.length) { tb.innerHTML = '<tr><td colspan="8"><div class="empty">Sem cenários válidos.</div></td></tr>'; return; }
    tb.innerHTML = linhas.map(l =>
      '<tr' + (l.k === State.preset ? ' style="background:var(--tint-brand)"' : '') + '>' +
        '<th scope="row"><strong>' + esc(l.nome) + '</strong>' + (l.k === State.preset ? ' <span class="badge badge--alta">ativo</span>' : '') + '</th>' +
        '<td class="num">' + F.num(l.v.volume, 0) + ' t/mês</td>' +
        '<td class="num">R$ ' + F.num(l.v.compra, 2) + '/kg</td>' +
        '<td class="num">R$ ' + F.num(l.v.venda, 2) + '/kg</td>' +
        '<td class="num"><strong>' + F.brl(l.r.resultado.resultadoMensal) + '</strong></td>' +
        '<td class="num">' + (l.r.resultado.margemSobreReceita === null ? '—' : F.pct(l.r.resultado.margemSobreReceita * 100)) + '</td>' +
        '<td class="num">' + (l.r.resultado.paybackMeses === null ? 'não se paga' : F.num(l.r.resultado.paybackMeses, 0) + ' meses') + '</td>' +
        '<td>' + F.num(l.r.capacidade.capacidadeMensalTon, 1) + ' t/mês para ' + F.num(l.v.qtd) + ' equip. ' +
          (l.r.capacidade.compativel ? '<span class="badge badge--alta">compatível</span>' : '<span class="badge badge--baixa">insuficiente</span>') + '</td>' +
      '</tr>').join('');
  }

  /* ========================== AREA 6 · PLANO ============================== */
  function renderPlano() {
    $('#gates-plano').innerHTML = GATES.map(g => cardGate(g, true)).join('');
    $('#fases').innerHTML = FASES.map(f =>
      '<div class="panel"><div style="display:flex;gap:var(--s3);align-items:baseline;flex-wrap:wrap;margin-bottom:var(--s2)">' +
        '<span class="badge badge--neutro">Fase ' + f.ordem + '</span>' +
        '<h3 class="blk" style="margin:0;font-size:var(--fs-h4)">' + esc(f.nome) + '</h3></div>' +
        '<p class="u-meta"><strong>Prazo:</strong> ' + esc(f.prazo) + ' &nbsp;·&nbsp; <strong>Investimento estimado:</strong> ' + esc(f.capex) + '</p>' +
        '<p class="u-meta u-mt2">' + esc(f.objetivo) + '</p>' +
        '<h4 class="blk">Entregáveis</h4><ul class="u-meta">' + f.entregaveis.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>' +
        '<h4 class="blk">Critério de avanço</h4><p class="u-meta">' + esc(f.criterio) + '</p>' +
        '<h4 class="blk">Dependências</h4><ul class="u-meta">' + f.dependencias.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>').join('');

    $('#checklist').innerHTML = GATES.map(g =>
      '<label class="check" for="ck-' + g.id + '"><input type="checkbox" id="ck-' + g.id + '" data-gate="' + g.id + '">' +
      '<span><strong>' + esc(g.id) + ' · ' + esc(g.titulo) + '</strong> — ' + esc(g.condicao) +
      ' <em class="u-micro">(' + g.prazoDias + ' dias)</em></span></label>').join('');

    $('#tab-tradeoffs tbody').innerHTML = TRADE_OFFS.map(t =>
      '<tr><td class="u-num">' + esc(t.id) + '</td>' +
      '<td><strong>' + esc(t.titulo) + '</strong><br><span class="u-meta">' + esc(t.desc) + '</span></td>' +
      '<td>' + esc(t.mitigacao) + '</td><td>' + srcRefs(t.fontes) + '</td></tr>').join('');

    $('#tab-regulatorio tbody').innerHTML = REGULATORIO.map(r =>
      '<tr><td><strong>' + esc(r.nome) + '</strong></td><td>' + esc(r.conteudo) + '</td>' +
      '<td>' + esc(r.efeito) + '</td><td>' + srcRefs(r.fontes) + '</td></tr>').join('');

    $('#tab-incentivos tbody').innerHTML = INCENTIVOS.map(i =>
      '<tr><td><strong>' + esc(i.nome) + '</strong></td><td>' + esc(i.oQue) + '</td>' +
      '<td>' + esc(i.condicao) + '</td><td>' + esc(i.janela) + '</td><td>' + srcRefs(i.fontes) + '</td></tr>').join('');

    $('#timeline').innerHTML = TIMELINE.map(t =>
      '<div style="border-left:2px solid var(--accent);padding:0 0 var(--s4) var(--s4);position:relative;margin-left:4px">' +
      '<span style="position:absolute;left:-5px;top:4px;width:8px;height:8px;border-radius:50%;background:var(--surface);border:2px solid var(--accent)"></span>' +
      '<strong style="font-size:var(--fs-meta);color:var(--brand)">' + esc(t.ano) + '</strong>' +
      '<p class="u-meta" style="margin-top:2px">' + esc(t.texto) + ' ' + srcRefs(t.fontes) + '</p></div>').join('');

    $('#tab-divergencias tbody').innerHTML = DIVERGENCIAS.map(d =>
      '<tr><td><strong>' + esc(d.a) + '</strong></td><td>' + d.painel + '</td><td>' + d.orig + '</td><td>' + d.dec + '</td></tr>').join('');
  }

  /* ========================== AREA 7 · FONTES ============================= */
  /* Acesso a fonte. Registros sem URL nunca recebem link ficticio:
     - ha URL  -> um link por endereco, separados quando sao varios
     - ha material local verificavel -> link relativo real
     - nao ha  -> "material nao disponibilizado", sem link */
  function acessoFonte(f) {
    if (f.urls.length) {
      return f.urls.map(u => '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' +
        esc(u.length > 46 ? u.slice(0, 44) + '…' : u) + '</a>').join('<br>');
    }
    const rel = f.localLink || (/^[\w.\-/ ]+\/[\w.\-]+$/.test(f.local || '') ? (f.local || '').trim() : null);
    if (rel) {
      return '<a href="' + esc(rel) + '">' + esc(rel) + '</a><br>' +
        '<span class="u-micro">Sem endereço na internet nesta revisão</span>';
    }
    return '<span class="u-micro">Material não disponibilizado' +
      (f.local ? ' — ' + esc(f.local) : '') + '</span>';
  }

  function renderFontes() {
    const tipos = ['todos'].concat(Array.from(new Set(FONTES.map(f => f.tipo))).sort());
    $('#f-tipo').innerHTML = tipos.map(t =>
      '<button type="button" class="chip" data-ftipo="' + esc(t) + '" aria-pressed="' + (State.fontes.tipo === t) + '">' + esc(t) + '</button>').join('');
    filtrarFontes();
  }
  function filtrarFontes() {
    const q = State.fontes.busca.trim().toLowerCase();
    const lista = FONTES.filter(f => {
      if (State.fontes.tipo !== 'todos' && f.tipo !== State.fontes.tipo) return false;
      if (q && (f.id + ' ' + f.titulo + ' ' + f.tipo + ' ' + f.suporta).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    const tb = $('#tab-fontes tbody');
    if (!lista.length) {
      tb.innerHTML = '<tr><td colspan="6"><div class="empty"><b>Nenhuma fonte encontrada</b>Ajuste a busca ou o filtro de tipo.</div></td></tr>';
    } else {
      tb.innerHTML = lista.map(f =>
        '<tr id="fonte-' + esc(f.id.toLowerCase().replace(/\W/g, '-')) + '">' +
          '<th scope="row" class="u-num">' + esc(f.id) + '</th>' +
          '<td>' + esc(f.titulo) + '</td>' +
          '<td><span class="badge badge--neutro">' + esc(f.tipo) + '</span></td>' +
          '<td>' + esc(f.data) + '</td>' +
          '<td>' + esc(f.suporta) + '</td>' +
          '<td>' + acessoFonte(f) + '</td>' +
        '</tr>').join('');
    }
    const semUrl = FONTES.filter(f => !f.urls.length).length;
    const comLinkLocal = FONTES.filter(f => !f.urls.length && f.localLink).length;
    $('#resumo-fontes').textContent = 'Exibindo ' + lista.length + ' de ' + FONTES.length + ' referências. ' +
      (semUrl - comLinkLocal) + ' registro(s) não possuem endereço e aparecem como material não disponibilizado; ' +
      comLinkLocal + (comLinkLocal === 1 ? ' aponta para material desta pasta' : ' apontam para material desta pasta') + ', com link relativo real.';
  }

  function renderLinksIrmaos() {
    const arqs = [
      { f: 'relatorio_mercado_isopor_bahia.md', d: 'Relatório completo em texto, com metodologia e referências' },
      { f: 'relatorio_mercado_isopor_bahia.docx', d: 'Mesma versão em formato editável' },
      { f: 'relatorio_mercado_isopor_bahia.pdf', d: 'Mesma versão em formato de apresentação' },
      { f: 'fontes_cadeia_isopor_bahia.xlsx', d: 'Planilha de fontes, premissas, atores e cadastros' }
    ];
    $('#links-irmaos').innerHTML = arqs.map(a =>
      '<li><a href="' + esc(a.f) + '">' + esc(a.f) + '</a> — ' + esc(a.d) + '</li>').join('');
  }

  /* ------------------------------- toast ---------------------------------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    t.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--brand);color:#fff;padding:10px 18px;border-radius:7px;font-size:.875rem;z-index:80;box-shadow:var(--shadow-2);max-width:90vw';
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 4200);
  }

  /* ============================== eventos ================================= */
  function ligarEventos() {
    /* navegacao por link e por hash */
    $('#nav-list').addEventListener('click', e => {
      const link = e.target.closest('.nav__link'); if (!link) return;
      e.preventDefault(); irPara(link.dataset.area);
    });
    window.addEventListener('popstate', () => {
      const a = areaDoHash(); if (a) irPara(a, { semHash: true });
    });

    /* referencia de fonte em qualquer lugar do documento */
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-src]');
      if (b) { e.preventDefault(); abrirFonte(b.dataset.src, b); return; }
      const a = e.target.closest('[data-ator]');
      if (a && !a.closest('#detalhe-ator')) { e.preventDefault(); fichaAtor(a.dataset.ator); }
    });

    /* cenario de mercado */
    $('#chips-cenario').addEventListener('click', e => {
      const b = e.target.closest('[data-cen]'); if (!b) return;
      State.cenario = b.dataset.cen;
      $$('#chips-cenario .chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.cen === State.cenario)));
      renderCenarios(); salvar();
      toast('Cenário de mercado alterado para "' + CENARIOS[State.cenario].nome + '". As premissas da calculadora não foram alteradas.');
    });

    /* filtros de atores */
    document.addEventListener('click', e => {
      const b = e.target.closest('#f-papel .chip, #f-regiao .chip, #f-pront .chip');
      if (!b) return;
      State.filtros[b.dataset.f] = b.dataset.v;
      $$('#' + b.parentElement.id + ' .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderAtores(); salvar();
    });
    $('#busca-atores').addEventListener('input', debounce(function (e) {
      State.filtros.busca = e.target.value; renderAtores(); salvar();
    }, 160));

    /* tabela de atores: abrir ficha por clique ou teclado */
    $('#tab-actors tbody').addEventListener('click', e => {
      const tr = e.target.closest('tr[data-ator]'); if (tr) fichaAtor(tr.dataset.ator);
    });
    $('#tab-actors tbody').addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tr = e.target.closest('tr[data-ator]'); if (!tr) return;
      e.preventDefault(); fichaAtor(tr.dataset.ator);
    });

    /* presets */
    $('#chips-preset').addEventListener('click', e => {
      const b = e.target.closest('[data-preset]'); if (!b) return;
      if (b.dataset.preset === 'personalizado') return;
      aplicarPreset(b.dataset.preset);
    });

    /* campos da calculadora */
    document.addEventListener('input', e => {
      const inp = e.target.closest('.calcrow input[data-k]'); if (!inp) return;
      State.calc[inp.dataset.k] = inp.value;
      if (State.preset !== 'personalizado') {
        State.preset = 'personalizado';
        $$('#chips-preset .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === 'personalizado')));
        $('#preset-origem').innerHTML = '<strong>Personalizado</strong> — as premissas foram alteradas manualmente e não correspondem a nenhum conjunto da pesquisa. <button type="button" class="chip" id="voltar-preset" style="margin-left:8px">Restaurar conjunto base</button>';
        const vp = $('#voltar-preset');
        if (vp) vp.addEventListener('click', function () { aplicarPreset('base'); });
      }
      recalcular(); salvar();
    });
    $('#chk-credito').addEventListener('change', e => {
      State.creditoAtivo = e.target.checked; recalcular(); salvar();
    });

    /* checklist local: nao persiste */
    document.addEventListener('change', e => {
      const c = e.target.closest('input[data-gate]'); if (!c) return;
      const outro = $('#gates-plano input[data-gate="' + c.dataset.gate + '"]');
      if (outro) outro.checked = c.checked;
      toast('Anotação local registrada. Este acompanhamento não é salvo ao recarregar a página e não reflete o estado do negócio.');
    });

    /* fontes */
    $('#busca-fontes').addEventListener('input', debounce(function (e) {
      State.fontes.busca = e.target.value; filtrarFontes(); salvar();
    }, 160));
    $('#f-tipo').addEventListener('click', e => {
      const b = e.target.closest('[data-ftipo]'); if (!b) return;
      State.fontes.tipo = b.dataset.ftipo;
      $$('#f-tipo .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      filtrarFontes(); salvar();
    });

    /* imprimir */
    $('#btn-imprimir').addEventListener('click', function () {
      $('#print-contexto').textContent =
        'Cenário de mercado ativo: ' + CENARIOS[State.cenario].nome + ' · conjunto de premissas: ' +
        (State.preset === 'personalizado' ? 'Personalizado' : PRESETS[State.preset].nome) +
        ' · créditos de reciclagem: ' + (State.creditoAtivo ? 'hipótese ligada' : 'desligados') + '.';
      window.print();
    });

    /* layout responsivo: observa apenas o cabecalho e o navegador, nunca o
       corpo inteiro, para nao realimentar a propria medicao */
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(medirHeader);
      ro.observe($('.topbar')); ro.observe($('.nav'));
    }
    window.addEventListener('resize', debounce(medirHeader, 80));
    window.addEventListener('beforeprint', function () {
      $$('.tip').forEach(t => t.classList.remove('is-on'));
    });
  }

  /* =============================== inicializacao =========================== */
  function init() {
    carregar();
    renderNav();
    renderVisao();
    renderMercado();
    renderTerritorio();
    renderCadeia();
    renderPresets();
    renderCampos();
    renderPlano();
    renderFontes();
    renderLinksIrmaos();
    recalcular();
    ligarEventos();
    medirHeader();
    if (!storageOk) avisarStorage();

    /* Sempre passa por irPara, mesmo sem hash: e irPara que marca a area
       ativa com aria-current e da o foco ao titulo. */
    const a = areaDoHash();
    if (a && AREAS.some(x => x.id === a)) State.area = a;
    irPara(State.area, { semHash: true, semFoco: false });
    /* Estabelece o endereco canonico sem criar uma entrada extra no historico */
    history.replaceState({ area: State.area, fonte: null }, '', '#area-' + State.area);

    window.__painel = { State: State, Calc: Calc, recalcular: recalcular, irPara: irPara, ultimoCalculo: function () { return ultimoCalculo; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();