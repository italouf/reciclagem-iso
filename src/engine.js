/* =============================================================================
   MOTOR DE CALCULO — funcoes puras, sem DOM.
   Mesma implementacao serve o painel, os testes numericos e a impressao.
   Contrato: docs/retrofit/dados-e-evidencias.md secao 5.
   ========================================================================== */

const Calc = (function () {
  'use strict';

  /* ---- estados de campo -------------------------------------------------- */
  const VAZIO = 'vazio';
  const ERRO = 'erro';
  const OK = 'ok';

  /* ---- leitura de campo -------------------------------------------------- */
  /**
   * Converte texto do usuario em numero, distinguindo vazio de invalido.
   * Regra critica: campo vazio NAO vira zero.
   */
  function lerCampo(texto, campo) {
    if (texto === null || texto === undefined) return { estado: VAZIO, valor: null };
    const bruto = String(texto).trim();
    if (bruto === '') return { estado: VAZIO, valor: null };

    // aceita apenas notacao decimal com ponto; virgula e rejeitada com mensagem
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(bruto)) {
      return { estado: ERRO, valor: null, msg: 'Informe apenas números. Use ponto como separador decimal.' };
    }
    const n = Number(bruto);
    if (!Number.isFinite(n)) {
      return { estado: ERRO, valor: null, msg: 'Valor não é um número finito.' };
    }
    if (n > LIMITES_CALC) {
      return { estado: ERRO, valor: null, msg: 'Valor acima do limite aceito (' + fmtInt(LIMITES_CALC) + '). Revise a premissa.' };
    }
    if (n < campo.min) {
      return {
        estado: ERRO, valor: null,
        msg: campo.min > 0 && campo.min <= 1 && campo.min === campo.max
          ? 'Valor deve ser maior que zero.'
          : 'Valor mínimo é ' + fmtNum(campo.min) + '.'
      };
    }
    if (n > campo.max) {
      return { estado: ERRO, valor: null, msg: 'Valor máximo é ' + fmtNum(campo.max) + '.' };
    }
    return { estado: OK, valor: n };
  }

  /* ---- formatacao (isolada aqui para que o motor nao dependa da UI) ------ */
  function fmtNum(n, dec) {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    const d = dec === undefined ? (Math.abs(n) < 10 ? 2 : 0) : dec;
    return n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtInt(n) { return fmtNum(n, 0); }
  function fmtBRL(n) {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }
  function fmtBRL2(n) {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPct(n, dec) {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    return fmtNum(n, dec === undefined ? 2 : dec) + '%';
  }

  /* ---- regra de dominio: formatar mensagem padrao por chave -------------- */
  function msgDominio(key, v) {
    switch (key) {
      case 'volume': return 'Informe um volume maior que zero.';
      case 'perda': return 'A perda deve estar entre 0% e 100%.';
      case 'utilizacao': return 'A utilização deve estar entre 1% e 100%.';
      case 'qtd': return 'Informe ao menos 1 equipamento.';
      case 'horas': return 'Informe entre 1 e 744 horas por mês.';
      case 'capex': return 'O CAPEX não pode ser negativo.';
      case 'comprovadoTon': return 'A massa comprovada não pode ser negativa.';
      default: return 'Valor fora do intervalo aceitável.';
    }
  }

  /* ---- calculo principal ------------------------------------------------- */
  /**
   * @param {Object} brutos  mapa key -> texto digitado pelo usuario
   * @param {Object} metas   mapa key -> {creditoAtivo:boolean}
   * @returns {Object} { valido, campos, resultado, capacidade }
   */
  function calcular(brutos, metas) {
    metas = metas || {};
    const campos = {};
    let todosOk = true;

    CAMPOS_CALC.forEach(function (campo) {
      const r = lerCampo(brutos[campo.key], campo);
      if (r.estado !== OK) {
        campos[campo.key] = { estado: r.estado, valor: null, msg: r.msg || msgDominio(campo.key) };
        todosOk = false;
      } else {
        campos[campo.key] = { estado: OK, valor: r.valor, msg: '' };
      }
    });

    // Regras cruzadas de massa. Aplicam-se somente quando os creditos estao
    // ativos: sem creditos, "massa comprovada" nao participa de nenhum calculo.
    const creditoAtivo = !!metas.creditoAtivo;
    if (todosOk && creditoAtivo) {
      const el = campos.elegivelTon.valor, co = campos.comprovadoTon.valor, vol = campos.volume.valor;
      if (el > co + 1e-9) {
        campos.elegivelTon = {
          estado: ERRO, valor: null,
          msg: 'A massa elegível (' + fmtNum(el, 1) + ' t/mês) não pode exceder a massa comprovada (' + fmtNum(co, 1) + ' t/mês).'
        };
        todosOk = false;
      }
      if (co > vol + 1e-9) {
        campos.comprovadoTon = {
          estado: ERRO, valor: null,
          msg: 'A massa comprovada (' + fmtNum(co, 1) + ' t/mês) não pode exceder o volume de entrada (' + fmtNum(vol, 1) + ' t/mês).'
        };
        todosOk = false;
      }
    }

    if (!todosOk) {
      return { valido: false, campos: campos, resultado: null, capacidade: null, creditoAtivo: creditoAtivo };
    }

    const v = {};
    CAMPOS_CALC.forEach(function (c) { v[c.key] = campos[c.key].valor; });

    /* --- modelo economico --- */
    const massaEntradaKg = v.volume * 1000;
    const perda = v.perda / 100;
    const massaSaidaKg = massaEntradaKg * (1 - perda);
    const receitaMaterial = massaSaidaKg * v.venda;
    const custoCompra = massaEntradaKg * v.compra;
    const custoLogistica = v.volume * v.frete;
    const custoTotal = custoCompra + custoLogistica + v.fixo;
    const receitaCreditos = creditoAtivo ? v.elegivelTon * v.creditoValor : 0;
    const receitaTotal = receitaMaterial + receitaCreditos;
    const resultadoMensal = receitaTotal - custoTotal;

    const margemSobreReceita = receitaTotal > 0 ? (resultadoMensal / receitaTotal) : null;

    let paybackMeses = null;
    let paybackMotivo = null;
    if (resultadoMensal <= 0) {
      paybackMotivo = 'O modelo não se paga com as premissas atuais: o resultado mensal é negativo ou nulo.';
    } else if (v.capex <= 0) {
      paybackMotivo = 'CAPEX não informado — payback não aplicável.';
    } else {
      paybackMeses = v.capex / resultadoMensal;
    }

    /* --- capacidade --- */
    const capacidadeMensalTon = (v.kgHora * v.horas * v.qtd * (v.utilizacao / 100)) / 1000;
    const capacidadeOk = v.volume <= capacidadeMensalTon + 1e-9;
    const equipamentosNecessarios = v.kgHora > 0
      ? Math.ceil((v.volume * 1000) / (v.kgHora * v.horas * (v.utilizacao / 100)))
      : null;

    /* --- comparacao com e sem creditos --- */
    const resultadoSemCreditos = receitaMaterial - custoTotal;

    return {
      valido: true,
      campos: campos,
      creditoAtivo: creditoAtivo,
      resultado: {
        massaEntradaTon: v.volume,
        massaEntradaKg: massaEntradaKg,
        massaSaidaKg: massaSaidaKg,
        perdaPct: v.perda,
        receitaMaterial: receitaMaterial,
        receitaCreditos: receitaCreditos,
        receitaTotal: receitaTotal,
        custoCompra: custoCompra,
        custoLogistica: custoLogistica,
        custoFixo: v.fixo,
        custoTotal: custoTotal,
        resultadoMensal: resultadoMensal,
        margemSobreReceita: margemSobreReceita,
        capex: v.capex,
        paybackMeses: paybackMeses,
        paybackMotivo: paybackMotivo,
        resultadoSemCreditos: resultadoSemCreditos,
        deltaCreditos: resultadoMensal - resultadoSemCreditos
      },
      capacidade: {
        capacidadeMensalTon: capacidadeMensalTon,
        compativel: capacidadeOk,
        kgHora: v.kgHora, horas: v.horas, qtd: v.qtd, utilizacao: v.utilizacao,
        equipamentosNecessarios: equipamentosNecessarios,
        excesso: v.volume - capacidadeMensalTon
      }
    };
  }

  /* ---- serie de sensibilidade: resultado por volume ---------------------- */
  function serieVolume(base, volumes) {
    const out = [];
    volumes.forEach(function (vol) {
      const r = calcular(
        Object.assign({}, base, { volume: vol }),
        { creditoAtivo: false }
      );
      out.push({
        v: vol,
        resultado: r.valido ? r.resultado.resultadoMensal : null,
        semCreditos: r.valido ? r.resultado.resultadoSemCreditos : null,
        viavel: r.valido
      });
    });
    return out;
  }

  /* ---- serie de sensibilidade: resultado por preco de venda -------------- */
  function seriePreco(base, precos) {
    const out = [];
    precos.forEach(function (p) {
      const r = calcular(Object.assign({}, base, { venda: p }), { creditoAtivo: false });
      out.push({ p: p, resultado: r.valido ? r.resultado.resultadoMensal : null });
    });
    return out;
  }

  /* ---- volume de equilibrio (onde resultado = 0) ------------------------- */
  /**
   * resultado(v) = coef * v - custoFixo, em que
   *   coef = 1000*(1-perda)*venda - 1000*compra - frete      [R$ por tonelada]
   *
   * So existe volume de equilibrio quando coef > 0 (margem de contribuicao
   * positiva). Com coef <= 0 o resultado e negativo para qualquer volume:
   * aumentar a operacao so amplia o prejuizo.
   */
  function volumeEquilibrio(base) {
    const perda = Number(base.perda) / 100;
    const venda = Number(base.venda), compra = Number(base.compra);
    const frete = Number(base.frete), fixo = Number(base.fixo);
    if (![perda, venda, compra, frete, fixo].every(Number.isFinite)) return null;
    const coef = 1000 * (1 - perda) * venda - 1000 * compra - frete;
    if (coef <= 0 || fixo <= 0) return null;
    return fixo / coef;
  }

  return {
    calcular: calcular,
    serieVolume: serieVolume,
    seriePreco: seriePreco,
    volumeEquilibrio: volumeEquilibrio,
    lerCampo: lerCampo,
    ESTADOS: { VAZIO: VAZIO, ERRO: ERRO, OK: OK },
    fmt: { num: fmtNum, int: fmtInt, brl: fmtBRL, brl2: fmtBRL2, pct: fmtPct }
  };
})();

/* Exporta para o harness de testes em Node. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Calc: Calc, CAMPOS_CALC: CAMPOS_CALC, LIMITES_CALC: LIMITES_CALC };
}