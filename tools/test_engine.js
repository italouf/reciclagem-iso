/* Harness de testes do motor de calculo.
   Executa com:  node tools/test_engine.js
   Cobre CL-01, CL-02, CL-03 e OP-01 de docs/retrofit/plano.md. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ctx = vm.createContext({ module: { exports: {} }, console: console });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/data.js'), 'utf8'), ctx, { filename: 'data.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/engine.js'), 'utf8'), ctx, { filename: 'engine.js' });
const { Calc, CAMPOS_CALC, LIMITES_CALC } = ctx.module.exports;
const PRESETS = vm.runInContext('PRESETS', ctx);

let pass = 0, fail = 0;
const failures = [];

function ok(nome, cond, detalhe) {
  if (cond) { pass++; }
  else { fail++; failures.push(nome + (detalhe ? '  -> ' + detalhe : '')); }
}
function near(a, b, tol) { return Math.abs(a - b) <= (tol === undefined ? 0.005 : tol); }
function chk(nome, got, exp, tol) {
  ok(nome, near(got, exp, tol), 'obtido ' + got + ', esperado ' + exp);
}
const REF = { volume: '20', perda: '8', compra: '0.50', venda: '2.10', capex: '275000',
  fixo: '180000' === '' ? '' : '18000', frete: '120', creditoValor: '60',
  elegivelTon: '0', comprovadoTon: '20', kgHora: '20', horas: '160', qtd: '7', utilizacao: '100' };
const P = (o) => Object.assign({}, REF, o);

/* ============================ CL-01 regressao ============================ */
console.log('\n== CL-01 · casos de referencia ==');
let r = Calc.calcular(P({ elegivelTon: '20' }), { creditoAtivo: true });
ok('CL-01 · simulacao valida', r.valido, JSON.stringify(r.campos));
chk('CL-01 · massa de saida (kg)', r.resultado.massaSaidaKg, 18400);
chk('CL-01 · receita material', r.resultado.receitaMaterial, 38640);
chk('CL-01 · receita creditos', r.resultado.receitaCreditos, 1200);
chk('CL-01 · receita total', r.resultado.receitaTotal, 39840);
chk('CL-01 · custo compra', r.resultado.custoCompra, 10000);
chk('CL-01 · custo logistica', r.resultado.custoLogistica, 2400);
chk('CL-01 · custo total', r.resultado.custoTotal, 30400);
chk('CL-01 · resultado mensal', r.resultado.resultadoMensal, 9440);
chk('CL-01 · margem sobre receita', r.resultado.margemSobreReceita * 100, 23.69, 0.005);
chk('CL-01 · payback (meses)', r.resultado.paybackMeses, 29.13, 0.005);

r = Calc.calcular(P(), { creditoAtivo: false });
ok('CL-01b · sem creditos: valida', r.valido);
chk('CL-01b · receita total sem creditos', r.resultado.receitaTotal, 38640);
chk('CL-01b · resultado sem creditos', r.resultado.resultadoMensal, 8240);
chk('CL-01b · payback sem creditos (meses)', r.resultado.paybackMeses, 33.37, 0.005);
chk('CL-01b · credito desativado zera receita de credito', r.resultado.receitaCreditos, 0);
ok('CL-01b · motivo de payback e null (resultado>0 e capex>0)', r.resultado.paybackMotivo === null);

r = Calc.calcular(P({ volume: '1', comprovadoTon: '1' }), { creditoAtivo: false });
ok('CL-01c · volume de 1 t/mês é válido', r.valido, JSON.stringify(r.campos));
chk('CL-01c · conversao t->kg', r.resultado.massaEntradaKg, 1000);
chk('CL-01c · saida com 8% de perda', r.resultado.massaSaidaKg, 920);

/* regra cruzada so se aplica com creditos ativos */
r = Calc.calcular(P({ volume: '1' }), { creditoAtivo: true });
ok('CL-02i3 · comprovado 20 t > entrada 1 t -> invalido', r.valido === false, JSON.stringify(r.campos.comprovadoTon));
ok('CL-02i3 · erro em comprovadoTon', r.campos.comprovadoTon.estado === 'erro', r.campos.comprovadoTon.msg);

/* ============================ OP-01 capacidade ========================== */
console.log('\n== OP-01 · capacidade ==');
r = Calc.calcular(P({ qtd: '1' }), { creditoAtivo: false });
chk('OP-01a · 20 kg/h x 160 h x 1 un = 3,20 t', r.capacidade.capacidadeMensalTon, 3.2);
ok('OP-01a · 20 t excede 3,2 t -> incompativel', r.capacidade.compativel === false);
ok('OP-01a · excesso calculado', near(r.capacidade.excesso, 16.8), 'excesso ' + r.capacidade.excesso);

r = Calc.calcular(P({ kgHora: '18', qtd: '1', horas: '160' }), { creditoAtivo: false });
chk('OP-01a · 18 kg/h x 160 h = 2,88 t', r.capacidade.capacidadeMensalTon, 2.88);
r = Calc.calcular(P({ kgHora: '22', qtd: '1', horas: '160' }), { creditoAtivo: false });
chk('OP-01a · 22 kg/h x 160 h = 3,52 t', r.capacidade.capacidadeMensalTon, 3.52);
r = Calc.calcular(P({ kgHora: '20', qtd: '7', horas: '160' }), { creditoAtivo: false });
chk('OP-01b · 7 equipamentos = 22,40 t', r.capacidade.capacidadeMensalTon, 22.4);
ok('OP-01b · 20 t cabe em 7 equipamentos', r.capacidade.compativel === true);
r = Calc.calcular(P({ qtd: '6' }), { creditoAtivo: false });
chk('OP-01b · 6 equipamentos = 19,20 t', r.capacidade.capacidadeMensalTon, 19.2);
ok('OP-01b · 20 t excede 19,2 t -> sinaliza', r.capacidade.compativel === false);
chk('OP-01b · equipamentos necessarios', r.capacidade.equipamentosNecessarios, 7);

/* ============================= CL-02 invalidos =========================== */
console.log('\n== CL-02 · entradas invalidas nao produzem resultado ==');
const invalidos = [
  ['CL-02a · volume vazio', { volume: '' }, 'volume'],
  ['CL-02a2 · volume espaco', { volume: '   ' }, 'volume'],
  ['CL-02b · volume zero', { volume: '0' }, 'volume'],
  ['CL-02c · volume negativo', { volume: '-5' }, 'volume'],
  ['CL-02d · perda 150', { perda: '150' }, 'perda'],
  ['CL-02e · perda -5', { perda: '-5' }, 'perda'],
  ['CL-02f · texto nao numerico', { volume: 'abc' }, 'volume'],
  ['CL-02f2 · virgula decimal', { venda: '2,10' }, 'venda'],
  ['CL-02f3 · Infinity', { volume: 'Infinity' }, 'volume'],
  ['CL-02f4 · NaN literal', { volume: 'NaN' }, 'volume'],
  ['CL-02j · valor absurdo', { capex: '1e12' }, 'capex'],
  ['CL-02k · utilizacao 0', { utilizacao: '0' }, 'utilizacao'],
  ['CL-02l · utilizacao 150', { utilizacao: '150' }, 'utilizacao'],
  ['CL-02m · qtd zero', { qtd: '0' }, 'qtd'],
  ['CL-02n · horas zero', { horas: '0' }, 'horas'],
  ['CL-02o · capex negativo', { capex: '-1' }, 'capex'],
  ['CL-02p · preco negativo', { compra: '-1' }, 'compra']
];
invalidos.forEach(function (t) {
  const res = Calc.calcular(P(t[1]), { creditoAtivo: false });
  ok(t[0] + ' -> resultado suprimido', res.valido === false && res.resultado === null);
  ok(t[0] + ' -> campo bloqueado ' + t[2], res.campos[t[2]].estado !== 'ok', JSON.stringify(res.campos[t[2]]));
  ok(t[0] + ' -> mensagem presente', !!res.campos[t[2]].msg, res.campos[t[2]].msg);
});

/* campo vazio tem estado proprio, distinto de erro */
[['CL-02a · volume vazio', { volume: '' }], ['CL-02a2 · volume espaco', { volume: '   ' }],
 ['CL-02q · perda vazia', { perda: '' }], ['CL-02q2 · capex vazio', { capex: '' }]]
  .forEach(function (t) {
    const res = Calc.calcular(P(t[1]), { creditoAtivo: false });
    const k = Object.keys(t[1])[0];
    ok(t[0] + ' -> estado "vazio"', res.campos[k].estado === 'vazio', JSON.stringify(res.campos[k]));
    ok(t[0] + ' -> sem resultado', res.resultado === null);
    ok(t[0] + ' -> orientacao ao usuario', !!res.campos[k].msg, res.campos[k].msg);
  });

/* regra cruzada de massa elegivel - so se aplica com creditos ativos */
let x = Calc.calcular(P({ elegivelTon: '25', comprovadoTon: '20' }), { creditoAtivo: true });
ok('CL-02i · elegivel > comprovado -> invalido', x.valido === false);
ok('CL-02i · erro em elegivelTon', x.campos.elegivelTon.estado === 'erro', JSON.stringify(x.campos.elegivelTon.msg));
x = Calc.calcular(P({ comprovadoTon: '30', volume: '20' }), { creditoAtivo: true });
ok('CL-02i2 · comprovado > entrada -> invalido', x.valido === false);
ok('CL-02i2 · erro em comprovadoTon', x.campos.comprovadoTon.estado === 'erro', x.campos.comprovadoTon.msg);
x = Calc.calcular(P({ elegivelTon: '25', comprovadoTon: '20' }), { creditoAtivo: false });
ok('CL-02i4 · com creditos desligados a regra cruzada nao se aplica', x.valido === true, JSON.stringify(x.campos.elegivelTon));

/* regressao de D-16: o campo vazio NAO pode virar zero */
x = Calc.calcular(P({ volume: '' }), { creditoAtivo: false });
ok('D-16 · campo vazio nao produz resultado negativo plausivel', x.resultado === null);
ok('D-16 · estado do campo = vazio', x.campos.volume.estado === 'vazio', x.campos.volume.estado);

/* regressao de D-18: perda 150 nao pode gerar resultado positivo */
x = Calc.calcular(P({ perda: '150' }), { creditoAtivo: false });
ok('D-18 · perda 150 nao gera resultado', x.resultado === null);

/* regressao de D-17: volume negativo nao gera receita negativa */
x = Calc.calcular(P({ volume: '-5' }), { creditoAtivo: false });
ok('D-17 · volume negativo nao gera resultado', x.resultado === null);

/* =============================== CL-03 estados =========================== */
console.log('\n== CL-03 · estados sem numero ==');
r = Calc.calcular(P({ venda: '0' }), { creditoAtivo: false });
ok('CL-03 · resultado negativo e valido', r.valido === true);
chk('CL-03 · resultado negativo', r.resultado.resultadoMensal, -30400);
ok('CL-03 · margem e null (receita 0 sem credito)', r.resultado.margemSobreReceita === null);
ok('CL-03 · payback null com motivo', r.resultado.paybackMeses === null && /não se paga/.test(r.resultado.paybackMotivo), r.resultado.paybackMotivo);

r = Calc.calcular(P({ capex: '0' }), { creditoAtivo: false });
ok('CL-02g · capex 0 ainda valido', r.valido === true);
chk('CL-02g · resultado inalterado', r.resultado.resultadoMensal, 8240);
ok('CL-02g · payback null com motivo de CAPEX', r.resultado.paybackMeses === null && /CAPEX não informado/.test(r.resultado.paybackMotivo), r.resultado.paybackMotivo);

r = Calc.calcular(P({ venda: '0', creditoValor: '60', elegivelTon: '10' }), { creditoAtivo: true });
ok('CL-03 · com credito, receita>0 e margem calculada', r.resultado.margemSobreReceita !== null);
chk('CL-03 · receita com credito e 600', r.resultado.receitaTotal, 600);

/* margem negativa e legitima quando receita > 0 */
r = Calc.calcular(P({ venda: '0.30' }), { creditoAtivo: false });
ok('CL-03 · margem negativa com receita > 0', r.resultado.margemSobreReceita < 0, 'margem ' + r.resultado.margemSobreReceita);

/* ============================ serie e equilibrio ========================= */
console.log('\n== serie e equilibrio ==');
/* Serie SEM creditos (padrao do painel). */
const sv = Calc.serieVolume(REF, [5, 10, 15, 20, 30, 40]);
chk('serie sem creditos · 5 t/mês', sv[0].resultado, -11440);
chk('serie sem creditos · 10 t/mês', sv[1].resultado, -4880);
chk('serie sem creditos · 15 t/mês', sv[2].resultado, 1680);
chk('serie sem creditos · 20 t/mês', sv[3].resultado, 8240);
chk('serie sem creditos · 30 t/mês', sv[4].resultado, 21360);
chk('serie sem creditos · 40 t/mês', sv[5].resultado, 34480);
ok('serie · 20 t/mês marca o volume atual', near(sv[3].resultado, 8240));

/* Serie COM creditos na convencao original da pesquisa (20 t elegiveis):
   reproduz os numeros que a versao anterior exibia, para comparabilidade. */
function serieComCreditos(vol) {
  return Calc.calcular(
    P({ volume: String(vol), elegivelTon: String(vol), comprovadoTon: String(vol) }),
    { creditoAtivo: true }
  ).resultado.resultadoMensal;
}
chk('serie com creditos · 5 t/mês (convencao original)', serieComCreditos(5), -11140);
chk('serie com creditos · 10 t/mês (convencao original)', serieComCreditos(10), -4280);
chk('serie com creditos · 15 t/mês (convencao original)', serieComCreditos(15), 2580);
chk('serie com creditos · 20 t/mês (convencao original)', serieComCreditos(20), 9440);
chk('serie com creditos · 30 t/mês (convencao original)', serieComCreditos(30), 23160);
chk('serie com creditos · 40 t/mês (convencao original)', serieComCreditos(40), 36880);

const sp = Calc.seriePreco(REF, [1.5, 2.1, 2.8]);
chk('serie preco · R$ 1,50/kg', sp[0].resultado, 18400 * 1.5 - 30400, 0.001);
chk('serie preco · R$ 2,10/kg', sp[1].resultado, 8240, 0.001);
chk('serie preco · R$ 2,80/kg', sp[2].resultado, 21120, 0.001);

/* volume de equilibrio
   coef = 1000*0,92*2,10 - 1000*0,50 - 120 = 1932 - 620 = 1312 R$/t
   v_eq  = 18.000 / 1312 = 13,72 t/mes
   A pesquisa (secao 10.1) declara "~12-15 t/mês": o modelo reproduz o
   intervalo declarado pela pesquisa. Esta e a validacao cruzada. */
const ve = Calc.volumeEquilibrio(REF);
ok('equilibrio · existe no caso base', ve !== null);
chk('equilibrio · 13,72 t/mês', ve, 13.72, 0.005);
ok('equilibrio · coerente com os ~12-15 t/mês da pesquisa (secao 10.1)',
  ve >= 12 && ve <= 15, 'v_eq ' + ve.toFixed(2));
const chk2 = Calc.calcular(P({ volume: ve.toFixed(4) }), { creditoAtivo: false });
ok('equilibrio · resultado no volume de equilibrio ~ 0', Math.abs(chk2.resultado.resultadoMensal) < 1, 'r ' + chk2.resultado.resultadoMensal);

/* coef <= 0: nao existe volume de equilibrio */
ok('equilibrio · preco abaixo do custo variable nao tem breakpoint',
  Calc.volumeEquilibrio(Object.assign({}, REF, { venda: '0.55' })) === null);

/* ============================== presets ================================ */
console.log('\n== presets ==');
['base', 'conservador', 'otimista'].forEach(function (k) {
  const v = PRESETS[k].valores;
  const res = Calc.calcular(v, { creditoAtivo: v.creditoAtivo });
  ok('preset ' + k + ' e valido', res.valido, JSON.stringify(res.campos));
});
const cb = Calc.calcular(PRESETS.conservador.valores, { creditoAtivo: false });
ok('preset conservador tem resultado negativo', cb.resultado.resultadoMensal < 0, 'r ' + cb.resultado.resultadoMensal);
const co = Calc.calcular(PRESETS.otimista.valores, { creditoAtivo: false });
ok('preset otimista e positivo', co.resultado.resultadoMensal > 0, 'r ' + co.resultado.resultadoMensal);

/* ============================== formatacao ============================= */
console.log('\n== formatacao pt-BR ==');
ok('fmt · 18400 -> "18.400"', Calc.fmt.int(18400) === '18.400', Calc.fmt.int(18400));
ok('fmt · 38640 -> "38.640"', Calc.fmt.int(38640) === '38.640');
ok('fmt · 16204 -> "16.204"', Calc.fmt.int(16204) === '16.204');
ok('fmt · null -> "—"', Calc.fmt.int(null) === '—');
ok('fmt · BRL 9440 contem 9.440', /9\.440/.test(Calc.fmt.brl(9440)), Calc.fmt.brl(9440));
ok('fmt · BRL 9440 sem centavos', Calc.fmt.brl(9440).replace(/ /g, ' ') === 'R$ 9.440', Calc.fmt.brl(9440));
ok('fmt · pct 23.69', Calc.fmt.pct(23.694779) === '23,69%', Calc.fmt.pct(23.694779));

/* ================================ resumo ================================ */
console.log('\n' + '='.repeat(58));
console.log('PASS: ' + pass + '   FAIL: ' + fail);
if (fail) { console.log('\nFALHAS:'); failures.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('Todos os casos de calculo passaram.');