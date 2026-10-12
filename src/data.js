/* =============================================================================
   CAMADA DE DADOS — painel_isopor_bahia_retrofit
   Somente dados e contratos. Nenhum acesso ao DOM, nenhuma formatação pt-BR
   (a formatacao acontece exclusivamente na camada de apresentacao).
   Fonte: docs/retrofit/dados-e-evidencias.md
   ========================================================================== */

const PAINEL = {
  titulo: 'Mercado de reciclagem de EPS na Bahia',
  subtitulo: 'Inteligência de mercado com foco em Feira de Santana',
  corte: 'outubro de 2026',
  particaoRfb: '11/01/2026',
  sinapi: 'ago/2026'
};

/* ---------------------------------------------------------------------------
   1. SERIES E COMPARACOES CADASTRAIS
   Fonte primaria: rfb/rfb_agregados.json e rfb/rfb_players_ba.csv
   ------------------------------------------------------------------------ */

/* aberturas_ba_por_ano[*].ativa — serie oficial. 2026 e parcial. */
const ABERTURAS = [
  { ano: 2010, v: 450 }, { ano: 2011, v: 484 }, { ano: 2012, v: 441 },
  { ano: 2013, v: 561 }, { ano: 2014, v: 452 }, { ano: 2015, v: 485 },
  { ano: 2016, v: 536 }, { ano: 2017, v: 665 }, { ano: 2018, v: 670 },
  { ano: 2019, v: 790 }, { ano: 2020, v: 931 }, { ano: 2021, v: 1330 },
  { ano: 2022, v: 1183 }, { ano: 2023, v: 1248 }, { ano: 2024, v: 1349 },
  { ano: 2025, v: 1666 },
  { ano: 2026, v: 43, parcial: true }
];

const TOTAL_NACIONAL = 276898;      // nacional_total_ativos
const UF_NACIONAL = [               // rfb_agregados.json -> nacional
  ['SP', 68047], ['MG', 26557], ['PR', 19057], ['RJ', 18029], ['RS', 17241],
  ['BA', 15781], ['SC', 13478], ['GO', 10667], ['CE', 10606], ['PA', 8531],
  ['MA', 7683], ['AM', 6964], ['PE', 7840], ['PI', 4812], ['RN', 4886],
  ['PB', 3793], ['MT', 6499], ['MS', 3992], ['DF', 2984], ['RO', 2445],
  ['TO', 2475], ['AL', 2893], ['SE', 1759], ['ES', 6714], ['AP', 903],
  ['AC', 870], ['RR', 1147], ['EX', 245]
];

/* Decomposicao setorial — reconcilia com o ESCOPO AMPLIO (16.204), nao com o nucleo. */
const SETORES_BA = [
  { nome: 'Outro CNAE (entrou por secundária)', v: 12354, nota: 'estabelecimento tem CNAE principal fora do escopo' },
  { nome: 'Coleta de resíduos', v: 1129 },
  { nome: 'Recuperação / tratamento (outros)', v: 961 },
  { nome: 'Produção de plásticos / EPS', v: 781 },
  { nome: 'Comércio de sucata', v: 576 },
  { nome: 'Recuperação de plásticos', v: 335, nota: 'CNAE 38.32-7' },
  { nome: 'Reparo de máquinas de plásticos', v: 68 }
];
const SETORES_SOMA = SETORES_BA.reduce((s, r) => s + r.v, 0); // 16.204

/* Foco operacional = 7 municipios. Denominador explicito, sempre. */
const FOCO = ['Feira de Santana', 'Salvador', 'Simões Filho', 'Vitória da Conquista',
  'Santo Antônio de Jesus', 'Conceição do Jacuípe', 'Itatim'];

const MUNICIPIOS_FOCO = [
  { nome: 'Salvador', escopo: 2068, nucleo: 719, recPlasticos: 64 },
  { nome: 'Feira de Santana', escopo: 980, nucleo: 324, recPlasticos: 34 },
  { nome: 'Vitória da Conquista', escopo: 527, nucleo: 205, recPlasticos: 22 },
  { nome: 'Simões Filho', escopo: 377, nucleo: 137, recPlasticos: 17 },
  { nome: 'Santo Antônio de Jesus', escopo: 132, nucleo: 41, recPlasticos: 1 },
  { nome: 'Conceição do Jacuípe', escopo: 121, nucleo: 40, recPlasticos: 2 },
  { nome: 'Itatim', escopo: 17, nucleo: 9, recPlasticos: 0 }
];
const FOCO_SOMA_ESCOPO = MUNICIPIOS_FOCO.reduce((s, m) => s + m.escopo, 0);   // 4.222
const FOCO_SOMA_REC = MUNICIPIOS_FOCO.reduce((s, m) => s + m.recPlasticos, 0); // 140

const PORTE_BA = [
  { nome: 'ME', v: 12538 }, { nome: 'EPP', v: 2036 }, { nome: 'Demais portes', v: 1630 }
];

/* Recalculado de rfb/rfb_players_ba.csv (4.222 linhas). Ver validacao.md. */
const FOCO_CAPITAL_SOCIAL = 72529939055.82;   // R$ 72,53 bi
const FOCO_TOP10_PCT = 79.8;
const FOCO_DESDE_2019 = 2377;
const FOCO_TOTAL_ESTAB = 4222;

/* ---------------------------------------------------------------------------
   2. CENARIOS DE MERCADO (EPS na Bahia) — faixas, nunca pontos isolados
   Divergencia registrada: XLSX Premissas usa pontos; prevalece a faixa.
   ------------------------------------------------------------------------ */
const CENARIOS = {
  cons: {
    id: 'cons', nome: 'Conservador',
    hipotese: 'Fatia da Bahia pela participação no PIB nacional (~3,5%)',
    consumo: [3500, 4200], emissao: [1400, 2100], reciclado: [480, 720], naoAtendida: [700, 1400]
  },
  base: {
    id: 'base', nome: 'Base',
    hipotese: 'Fatia da Bahia pela participação populacional (~6,9%)',
    consumo: [6900, 8300], emissao: [2800, 4100], reciclado: [960, 1400], naoAtendida: [1800, 2700]
  },
  otim: {
    id: 'otim', nome: 'Otimista',
    hipotese: 'Expansão de construção e embalagens no Nordeste',
    consumo: [9000, 9000], emissao: [4500, 4500], reciclado: [1550, 1550], naoAtendida: [2950, 2950]
  }
};

/* ---------------------------------------------------------------------------
   3. COMPARACAO DE ESCOPOS — substitui a razao "66x"
   Materiais, geografias e bases diferentes: nao sao uma razao legitima.
   ------------------------------------------------------------------------ */
const ESCOPOS_COMPARAVEIS = [
  { id: 'dem', rotulo: 'Demanda industrial declarada', v: 332, unidade: 't/mês',
    escopo: '10 de 30 indústrias acompanhadas pelo Sebrae, Feira e região',
    material: 'Plásticos recicláveis · ~20 tipos', fonte: ['S-07'], natureza: 'publicado' },
  { id: 'dem-anual', rotulo: 'Demanda potencial anualizada', v: 3984, unidade: 't/ano',
    escopo: '332 t/mês × 12 — multiplicação linear, não é fluxo medido',
    material: 'Plásticos recicláveis · ~20 tipos', fonte: ['S-07'], natureza: 'publicado' },
  { id: 'coops', rotulo: 'Reciclado pelas cooperativas de Feira', v: 60, unidade: 't/ano',
    escopo: 'Ano de 2025, 1º ano da Divisão de Coleta Seletiva (Sesp)',
    material: 'Todos os materiais somados', fonte: ['S-08'], natureza: 'publicado' },
  { id: 'artemares', rotulo: 'Artemares (Feira)', v: 60, unidade: 't/mês',
    escopo: 'Estabelecimento único, >100 recicladores',
    material: 'Plástico, papel e metal somados', fonte: ['S-31'], natureza: 'publicado' },
  { id: 'ccrba', rotulo: 'CCRBA (Salvador)', v: 210, unidade: 't/mês',
    escopo: '6 organizações comercializam',
    material: 'Todos os materiais somados', fonte: ['S-09b'], natureza: 'publicado' }
];

/* ---------------------------------------------------------------------------
   4. ATORES — 27 registros, IDs internos estaveis, aliases legados preservados
   Prontidao = classificacao da PESQUISA. Nao e contrato, disponibilidade,
   intencao de compra nem compromisso de fornecedor.
   ------------------------------------------------------------------------ */
const ATORES = [
  { id: 'A-01', nome: 'Knauf Isopar®', razao: 'Knauf Isopor', papel: 'fornecedor', papelTxt: 'Produtora de EPS + PEV de coleta',
    municipio: 'Simões Filho/BA', regiao: 'RM de Salvador', material: 'Refugo de corte e moldagem (limpo)',
    prontidao: 'Alta', natureza: 'declaracao', fontes: ['S-01', 'S-42'],
    limitacao: 'Escala e logística de coleta não divulgadas.',
    proxima: 'Mapear volume de refugo por mês e condição de retirada.',
    aliases: ['P1', 'P21', 'F1'] },

  { id: 'A-02', nome: 'Isoplast', razao: 'Isoplast', papel: 'fornecedor+cliente', papelTxt: 'Produtora de EPS (líder N/NE); usa bloco T1R reciclado',
    municipio: 'Filial Simões Filho/BA · matriz Maracanaú/CE', regiao: 'RM de Salvador', material: 'EPS; compra bloco com reciclado',
    prontidao: 'Alta', natureza: 'declaracao', fontes: ['S-23'],
    limitacao: 'Capacidade de compra de bloco reciclado não divulgada.',
    proxima: 'Consultar especificação de bloco T1R e volume anual.',
    aliases: ['P2', 'C3', 'F1'] },

  { id: 'A-03', nome: 'Isobras', razao: 'ISOBRAR Indústria e Comércio de Embalagens', papel: 'fornecedor', papelTxt: 'Embalagens descartáveis (PET/EPS/XPS)',
    municipio: 'Itatim/BA', regiao: 'Agreste', material: 'Refugo de produção de embalagens',
    prontidao: 'Média-alta', natureza: 'declaracao', fontes: ['S-20', 'S-42'],
    limitacao: 'Expansão anunciada de PET; proporção de EPS não informada.',
    proxima: 'Separar a fração de EPS no resíduo e quantificar.',
    aliases: ['P3', 'P22', 'F1'] },

  { id: 'A-04', nome: 'Isobahia', razao: 'ABS Poliestireno', papel: 'fornecedor', papelTxt: 'Placas e blocos de EPS para construção',
    municipio: 'Santo Antônio de Jesus/BA', regiao: 'Sul da Bahia', material: 'Refugo de corte de placas e blocos',
    prontidao: 'Média', natureza: 'declaracao', fontes: ['S-21', 'S-42'],
    limitacao: 'Volumes não divulgados.',
    proxima: 'Levantar a tonagem mensal de refugo por canteiro.',
    aliases: ['P4', 'P23', 'F1'] },

  { id: 'A-05', nome: 'Iso Conquista', razao: 'Iso Conquista Indústria e Comércio de Produtos de EPS', papel: 'fornecedor', papelTxt: 'Indústria e comércio de EPS',
    municipio: 'Vitória da Conquista/BA', regiao: 'Sudoeste', material: 'Refugo de fabricação',
    prontidao: 'Média', natureza: 'cadastral', fontes: ['S-22'],
    limitacao: 'CNAE de recuperação de materiais; escala não divulgada.',
    proxima: 'Verificar situação ativa e volume de refugo.',
    aliases: ['P5', 'F1'] },

  { id: 'A-06', nome: 'Termotécnica', razao: 'Termotécnica', papel: 'cliente', papelTxt: 'Maior transformadora de EPS da América Latina; líder em reciclagem (Repor)',
    municipio: 'Petrolina/PE (unidade mais próxima) · matriz Joinville/SC', regiao: 'Fora da BA',
    material: 'Compra EPS densificado para PS circular', prontidao: 'Alta', natureza: 'declaracao', fontes: ['S-04', 'S-05'],
    limitacao: '65% de market share declarado pela empresa; não auditado.',
    proxima: 'Negociar receptive de feedstock densificado e preço por tonelada.',
    aliases: ['P6', 'C1'] },

  { id: 'A-07', nome: 'Proecologic (Grupo Santa Luzia)', razao: 'Proecologic', papel: 'cliente', papelTxt: 'Maior recicladora dedicada de EPS/XPS',
    municipio: 'São Paulo — localidade em divergência entre as fontes', regiao: 'Fora da BA',
    material: 'Compra EPS e XPS pós-consumo', prontidao: 'Alta', natureza: 'declaracao', fontes: ['S-15'],
    limitacao: 'Localização divergente: relatório cita Ribeirão Pires/SP; planilha e painel citavam Taubaté/SP. Processa 600–700 t/mês (declarado).',
    proxima: 'Confirmar unidade receptive, especificação e preço.',
    aliases: ['P7', 'C1'] },

  { id: 'A-08', nome: 'Realce Indústria', razao: 'Realce', papel: 'cliente', papelTxt: 'Transformadora com 80–90% de reciclado no produto',
    municipio: 'Conceição do Jacuípe/BA', regiao: 'Região de Feira', material: 'Compra plásticos reciclados, incluindo PS conforme qualidade',
    prontidao: 'Alta', natureza: 'declaracao', fontes: ['S-24'],
    limitacao: 'Atua sobretudo em PE/PP/PVC; não é especializada em EPS. 300 t recicladas em 2025 (declarado).',
    proxima: 'Avaliar a aceitação de PS/EPS e a especificação por cor.',
    aliases: ['P8', 'C5', 'P16'] },

  { id: 'A-09', nome: 'Redesol', razao: 'Redesol', papel: 'fornecedor', papelTxt: 'Cooperativa de recicláveis, bairro Gabriela',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Isopor pós-consumo de coleta seletiva',
    prontidao: 'Alta', natureza: 'publicado', fontes: ['S-08'],
    limitacao: 'O volume desta cooperativa não é informado; os 60 t do município somam todas as cooperativas.',
    proxima: 'Acordar volume mínimo e preço por quilo.',
    aliases: ['P9', 'F2'] },

  { id: 'A-10', nome: 'Ginga Recicla', razao: 'Ginga Recicla', papel: 'fornecedor', papelTxt: 'Cooperativa de recicláveis, bairro Irmã Dulce',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Isopor pós-consumo',
    prontidao: 'Alta', natureza: 'publicado', fontes: ['S-08'],
    limitacao: 'Volume individual não divulgado.',
    proxima: 'Acordar volume mínimo e preço por quilo.',
    aliases: ['P10', 'F2'] },

  { id: 'A-11', nome: 'Artemares', razao: 'Artemares', papel: 'fornecedor', papelTxt: 'Associação regional de catadores',
    municipio: 'Feira de Santana/BA (Tomba)', regiao: 'Feira', material: 'Recicláveis diversos, >60 t/mês somados',
    prontidao: 'Alta', natureza: 'publicado', fontes: ['S-31', 'S-08'],
    limitacao: 'Volume é de plástico, papel e metal somados; a fração de EPS não é conhecida.',
    proxima: 'Isolar a fração de EPS no fluxo e acordar entrega.',
    aliases: ['P11', 'F2'] },

  { id: 'A-12', nome: 'Coobafs', razao: 'Coobafs', papel: 'fornecedor', papelTxt: 'Cooperativa de ex-catadores do antigo lixão',
    municipio: 'Feira de Santana/BA (Caseb)', regiao: 'Feira', material: 'Fração seletiva',
    prontidao: 'Alta', natureza: 'publicado', fontes: ['S-08', 'S-31'],
    limitacao: 'Galpão novo financiado por Funcep/CAR; escala ainda em construção.',
    proxima: 'Avaliar capacidade de segregação por material.',
    aliases: ['P12', 'F2'] },

  { id: 'A-13', nome: 'Cooperativas da LIMPURB (Salvador)', razao: '16 organizações cadastradas', papel: 'fornecedor', papelTxt: 'Cooperativas de coleta; CANORE e COOPERBRAVA aceitam isopor',
    municipio: 'Salvador/BA', regiao: 'RM de Salvador', material: 'Isopor de PEVs e coleta solidária',
    prontidao: 'Alta', natureza: 'publicado', fontes: ['S-09'],
    limitacao: 'Relação nominal completa consta apenas no PDF da LIMPURB; volume por cooperativa não apurado.',
    proxima: 'Levantar por organização o volume de isopor já separado.',
    aliases: ['P13', 'F3'] },

  { id: 'A-14', nome: 'CATA BAHIA / CCRBA', razao: 'Federação e central de cooperativas', papel: 'fornecedor', papelTxt: 'Articulação estadual de cooperativas',
    municipio: 'Salvador/BA', regiao: 'RM de Salvador', material: 'Recicláveis diversos',
    prontidao: 'Média', natureza: 'academico', fontes: ['S-09b'],
    limitacao: 'Registro agrupa federação e central; ~210 t/mês somadas de 6 organizações, todos os materiais.',
    proxima: 'Desagregar por organização e por material.',
    aliases: ['P14'] },

  { id: 'A-15', nome: 'Sebrae Pró-Catadores', razao: 'Sebrae Bahia', papel: 'institucional', papelTxt: 'Estruturador da relação oferta × demanda',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Não se aplica',
    prontidao: 'Parceiro institucional', natureza: 'publicado', fontes: ['S-07'],
    limitacao: 'Levantamento cobre 10 de 30 indústrias acompanhadas; extrapolação linear de 12 meses.',
    proxima: 'Acessar a lista completa das 30 indústrias e do extrato por material.',
    aliases: ['P15'] },

  { id: 'A-16', nome: 'Newmaq / Atlas / Eletrodomésticos Pinheiro', razao: 'Indústrias de eletrodomésticos', papel: 'fornecedor+cliente', papelTxt: 'Geram EPS como embalagem de produto',
    municipio: 'Feira de Santana/BA (Humildes / CIS-Tomba)', regiao: 'Feira', material: 'Embalagem de linha branca',
    prontidao: 'Média-alta', natureza: 'cadastral', fontes: ['S-34'],
    limitacao: 'Volumes de embalagem por planta não apurados.',
    proxima: 'Quantificar caixas por linha e cadence de coleta.',
    aliases: ['P17', 'F5'] },

  { id: 'A-17', nome: 'Grupo MK (Mondial / AIWA)', razao: 'Grupo MK', papel: 'fornecedor+cliente', papelTxt: 'Eletroportáteis; demanda potencial de conteúdo reciclado',
    municipio: 'Conceição do Jacuípe/BA · nova planta em Cruz das Almas', regiao: 'Região de Feira', material: 'Embalagem de produto',
    prontidao: 'Média', natureza: 'jornalistica', fontes: ['S-24b'],
    limitacao: 'Investimento anunciado; metas de conteúdo reciclado não publicadas.',
    proxima: 'Consultar metas ESG e plano de destinação de embalagens.',
    aliases: ['P18', 'F5'] },

  { id: 'A-18', nome: 'Sesp-Feira (Divisão de Coleta Seletiva)', razao: 'Secretaria Especial de Serviços Públicos', papel: 'institucional', papelTxt: 'Gestão municipal de coleta seletiva',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Fração seletiva',
    prontidao: 'Média', natureza: 'publicado', fontes: ['S-08'],
    limitacao: 'Divisão criada em 2025; meta de ecopontos para 2026 sem volume publicado.',
    proxima: 'Consultar plano de ecopontos e contratos de destinação.',
    aliases: ['P20', 'F9'] },

  { id: 'A-19', nome: 'LWART Soluções Ambientais S.A.', razao: 'LWART Soluções Ambientais S.A.', papel: 'fornecedor', papelTxt: 'Operadora formal de resíduos',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Fluxos contratados de coleta e tratamento',
    prontidao: 'Média-alta', natureza: 'cadastral', fontes: ['S-42'],
    limitacao: 'Capital social R$ 287,9 mi não é faturamento nem demonstra operação de EPS.',
    proxima: 'Verificar contratos de coleta vigentes e cobertura em Feira.',
    aliases: ['P24', 'F10'] },

  { id: 'A-20', nome: 'Sustentare Saneamento S/A', razao: 'Sustentare Saneamento S/A', papel: 'fornecedor', papelTxt: 'Coleta de resíduos',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Fluxos contratados de coleta',
    prontidao: 'Média-alta', natureza: 'cadastral', fontes: ['S-42'],
    limitacao: 'Capital social R$ 173,7 mi; escopo de coleta não apurado.',
    proxima: 'Consultar o escopo de coleta e a destinação atual.',
    aliases: ['P25', 'F10'] },

  { id: 'A-21', nome: 'Qualix Serviços Ambientais S.A.', razao: 'Qualix Serviços Ambientais S.A.', papel: 'fornecedor', papelTxt: 'Coleta de resíduos',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Fluxos contratados de coleta',
    prontidao: 'Média-alta', natureza: 'cadastral', fontes: ['S-42'],
    limitacao: 'Capital social R$ 115,5 mi; escopo não apurado.',
    proxima: 'Consultar o escopo de coleta e a destinação atual.',
    aliases: ['P26', 'F10'] },

  { id: 'A-22', nome: '3R Novo Mundo Rec. Materiais Plásticos', razao: '3R Novo Mundo Recuperação de Materiais Plásticos', papel: 'fornecedor', papelTxt: 'Recuperadora de plásticos (ME)',
    municipio: 'Feira de Santana/BA', regiao: 'Feira', material: 'Recicláveis plásticos',
    prontidao: 'Média', natureza: 'cadastral', fontes: ['S-42'],
    limitacao: 'CNAE 38.32-7 não isola EPS; porte ME.',
    proxima: 'Verificar se processa EPS e qual fração.',
    aliases: ['P27'] },

  { id: 'A-23', nome: 'Varejo e atacarejo regional', razao: 'Assaí, Atacadão, Magazine Luiza, Casas Bahia, Havan e redes regionais', papel: 'fornecedor', papelTxt: 'Embalagens de linha branca e proteção',
    municipio: 'Feira de Santana/BA e região', regiao: 'Feira', material: 'Embalagem de produto',
    prontidao: 'Média', natureza: 'publicado', fontes: ['S-35b', 'S-10'],
    limitacao: 'Logística reversa é obrigação legal das redes grandes, mas o volume de EPS não é apurado.',
    proxima: 'Mapear o contrato de destinação e a obrigação de relatório no SINIR.',
    aliases: ['F4'] },

  { id: 'A-24', nome: 'Pesca e alimentos', razao: 'Mercado do Peixe e Feira de São Joaquim; frigoríficos e abatedouros', papel: 'fornecedor', papelTxt: 'Caixas térmicas pós-consumo',
    municipio: 'Salvador/BA e Feira de Santana/BA', regiao: 'RM de Salvador / Feira', material: 'Caixas térmicas de EPS',
    prontidao: 'Média', natureza: 'publicado', fontes: ['S-37', 'S-41'],
    limitacao: 'Volume grande, mas com contaminação orgânica; exige triagem e higienização.',
    proxima: 'Quantificar caixas por dia e condição de retorno.',
    aliases: ['F6'] },

  { id: 'A-25', nome: 'Saúde e fármaco', razao: 'Hospitais, laboratórios e distribuidoras de medicamentos', papel: 'fornecedor', papelTxt: 'Caixas térmicas de EPS',
    municipio: 'Bahia', regiao: 'Estado', material: 'Caixas térmicas de transporte',
    prontidao: 'Média', natureza: 'publicado', fontes: ['S-10'],
    limitacao: 'Embalagens farmacêuticas entram na logística reversa, mas a separação na origem não é garantida.',
    proxima: 'Avaliar o protocolo de devolução com hospitais e laboratórios.',
    aliases: ['F7'] },

  { id: 'A-26', nome: 'Construção civil', razao: 'Canteiros de obras', papel: 'fornecedor', papelTxt: 'Refugo de corte de lajotas e blocos',
    municipio: 'Feira, Salvador e interior', regiao: 'Estado', material: 'Refugo de EPS de construção',
    prontidao: 'Média', natureza: 'estimativa', fontes: ['S-25b'],
    limitacao: 'Muito disperso; depende de educação ambiental e de logística própria.',
    proxima: 'Identificar os 5 canteiros com maior geração.',
    aliases: ['F8'] },

  { id: 'A-27', nome: 'E-commerce e logística', razao: 'Centros de distribuição e transportadoras', papel: 'fornecedor', papelTxt: 'Proteção de encomendas',
    municipio: 'Bahia', regiao: 'Estado', material: 'EPS de proteção',
    prontidao: 'Média', natureza: 'pendente', fontes: [],
    limitacao: 'Sem mapeamento nominal na pesquisa. Categoria listada sem fonte.',
    proxima: 'Mapear CDs com maior consumo de EPS de proteção.',
    aliases: ['F11'] }
];

/* ---------------------------------------------------------------------------
   5. GATES — divergencia de prazo explicada, nao apagada
   ------------------------------------------------------------------------ */
const GATES = [
  { id: 'G1', titulo: 'Feedstock', escopoPrazo: 'comercial',
    condicao: '≥ 10 t/mês de EPS contratados com fornecedores de pós-industrial (F1) e cooperativas (F2/F3)',
    evidencia: 'Contratos assinados + medição de 90 dias de volume real',
    prazoDias: 90,
    consequencia: 'Não abrir o hub; renegociar condições ou encerrar a Fase 0',
    fontes: ['S-07', 'S-08'] },
  { id: 'G2', titulo: 'Preço', escopoPrazo: 'comercial',
    condicao: 'Preço do bloco densificado firme ≥ R$ 1,90/kg com ao menos um comprador',
    evidencia: 'Cotação formal ou contrato com Termotécnica ou Proecologic',
    prazoDias: 90,
    consequencia: 'Reduzir o CAPEX ou trocar a rota de produto',
    fontes: ['S-04', 'S-15', 'S-16'] },
  { id: 'G3', titulo: 'Incentivos', escopoPrazo: 'incentivos',
    condicao: 'Entidade gestora de créditos de reciclagem mapeada e elegibilidade PROIND confirmada',
    evidencia: 'Protocolo junto à entidade gestora + consulta de enquadramento',
    prazoDias: 120,
    consequencia: 'Reprecificar o projeto sem os incentivos',
    fontes: ['S-13', 'S-14', 'S-25'] }
];

/* ---------------------------------------------------------------------------
   6. FASES
   ------------------------------------------------------------------------ */
const FASES = [
  { ordem: 0, nome: 'Pré-viabilidade', prazo: '0–3 meses', capex: 'Baixo (esforço comercial)',
    objetivo: 'Contratar fornecimento e compra antes de gastar com ativo fixo',
    entregaveis: ['Contratos de fornecimento (fábricas e cooperativas)', 'Contratos de compra (destinadores de feedstock)', 'Medição de volume real por 90 dias', 'Mapeamento da entidade gestora de créditos'],
    criterio: 'Gates G1 e G2 atendidos em 90 dias; G3 em até 120 dias',
    dependencias: ['Acesso às fábricas da RM de Salvador', 'Articulação com cooperativas de Feira e Salvador'] },

  { ordem: 1, nome: 'Hub de coleta + densificação', prazo: '3–9 meses', capex: 'R$ 150 mil – 400 mil',
    objetivo: 'Capturar a arbitragem de volume: comprar solto, vender massa densificada',
    entregaveis: ['Galpão em Feira de Santana', 'Densificador e balança', 'Primeira venda para destinador de feedstock', 'Adesão à entidade gestora de créditos'],
    criterio: 'Estabilidade de ≥ 15 t/mês e margem bruta > 25%',
    dependencias: ['G1 e G2 aprovados', 'Dimensionamento de capacidade confirmado'] },

  { ordem: 2, nome: 'Beneficiamento', prazo: '9–24 meses', capex: 'R$ 300 mil – 1 mi',
    objetivo: 'Subir a escada de valor: bloco T1R, pérolas para concreto leve, perfis',
    entregaveis: ['Linha de corte e perfil', 'Habilitação PROIND (CNAE 22)', 'Carteira de clientes regionais de construção'],
    criterio: 'Contratos com 2 ou mais clientes regionais recorrentes',
    dependencias: ['Fase 1 estável', 'Âncora de preço SINAPI-BA vigente'] },

  { ordem: 3, nome: 'Regranulação de PS', prazo: '24–48 meses', capex: 'R$ 1,5 mi – 3 mi',
    objetivo: 'Atender a demanda por conteúdo reciclado das metas do Decreto 12.688',
    entregaveis: ['Linha de moagem e extrusão', 'Certificação de conteúdo reciclado', 'Contratos de pellet de PS reciclado'],
    criterio: 'Feedstock garantido ≥ 50 t/mês estáveis e limpos',
    dependencias: ['Fase 2 consolidada', 'Escala de feedstock comprovada'] }
];

/* ---------------------------------------------------------------------------
   7. RISCOS E TRADE-OFFS
   ------------------------------------------------------------------------ */
const RISCOS_QUEBRAM_TESE = [
  { titulo: 'Termotécnica é ao mesmo tempo o maior comprador potencial e um concorrente',
    evidencia: '65% de market share declarado; 51 milhões de kg reciclados em programa próprio',
    mitigacao: 'Posicionar como fornecedor de feedstock, não como concorrente de transformação na 1ª onda',
    fontes: ['S-04', 'S-15'] },
  { titulo: 'Não existe índice de preço de recicláveis para a Bahia',
    evidencia: 'O IPR do CEMPRE cobre apenas MG, PR e RS',
    mitigacao: 'Contrato indexado por percentual sobre o PS virgem, não por preço absoluto; gate G2',
    fontes: ['S-19', 'S-16'] },
  { titulo: 'Contaminação do pós-consumo e atrito setorial',
    evidencia: 'Caixas de pescado exigem higienização; 26,4% do escopo histórico da RFB foi baixado',
    mitigacao: 'Iniciar com refugo pós-industrial e fazer due diligence cadastral dos parceiros',
    fontes: ['S-15', 'S-42'] }
];

const TRADE_OFFS = [
  { id: 'T1', titulo: 'Logística do volume', desc: 'O EPS solto é 98% ar; sem densificação na origem o frete consome a margem', mitigacao: 'Densificar no galpão de coleta desde a primeira fase', fontes: ['S-15'] },
  { id: 'T2', titulo: 'Concorrência com o virgem', desc: 'O preço do PS virgem acompanha o petróleo', mitigacao: 'Contratos com percentual de desconto sobre o virgem, não preço absoluto', fontes: ['S-16'] },
  { id: 'T3', titulo: 'Concentração de mercado', desc: 'Termotécnica detém cerca de 65% do mercado de EPS', mitigacao: 'Operar como fornecedor de feedstock, não como concorrente', fontes: ['S-04'] },
  { id: 'T4', titulo: 'Contaminação do pós-consumo', desc: 'Caixas térmicas de pescado e alimento exigem higienização', mitigacao: 'Começar com pós-industrial; contrato de higienização', fontes: ['S-15'] },
  { id: 'T5', titulo: 'Qualidade contra preço', desc: 'Reciclado varia de R$ 2,20/kg a R$ 11–12/kg conforme categoria', mitigacao: 'Separar por cor e pureza; vender ao topo da escada', fontes: ['S-16', 'S-17'] },
  { id: 'T6', titulo: 'Ausência de índice regional', desc: 'O IPR do CEMPRE não cobre a Bahia', mitigacao: 'Contratos indexados próprios; SINAPI-BA como âncora', fontes: ['S-18', 'S-19'] },
  { id: 'T7', titulo: 'Dependência de política pública', desc: 'A coleta seletiva de Feira tem um ano de operação', mitigacao: 'Diversificar origens: indústria, varejo e cooperativas', fontes: ['S-08'] },
  { id: 'T8', titulo: 'Maquinário importado', desc: 'Densificadores são majoritariamente importados', mitigacao: 'Planejar câmbio e prazo; capturar incentivo de ativo fixo', fontes: ['S-25'] },
  { id: 'T9', titulo: 'Exigências sanitárias', desc: 'Reciclado com destino a contato alimentar exige conformidade sanitária', mitigacao: 'Restringir o escopo inicial a aplicações técnicas e construção', fontes: ['S-10'] },
  { id: 'T10', titulo: 'Disciplina de separação na origem', desc: 'A operação presupõe separação consistente e educação ambiental', mitigacao: 'Programa de educação ambiental; precedente Isopor Amigo elevou a qualidade de PEV de 23% para 98%', fontes: ['S-06b'] },
  { id: 'T11', titulo: 'Atrito setorial', desc: '26,4% do escopo histórico da RFB já foi baixado', mitigacao: 'Due diligence cadastral antes de assinar', fontes: ['S-42'] }
];

const REGULATORIO = [
  { nome: 'Lei 12.305/2010 (PNRS)', conteudo: 'Política Nacional de Resíduos Sólidos; logística reversa como obrigação', efeito: 'Base legal', fontes: ['S-13'] },
  { nome: 'Decreto 11.413/2023', conteudo: 'Certificado de Crédito de Reciclagem, de Estruturação e de Massa Futura', efeito: 'Permite monetizar a reciclagem por tonelada comprovada', fontes: ['S-13', 'S-14'] },
  { nome: 'Decreto 12.688/2025', conteudo: 'Logística reversa obrigatória de embalagens plásticas. Recuperação 32% (2026) a 50% (2040); conteúdo reciclado 22% (2026) a 40% (2040). Grandes empresas desde jan/2026, MEI desde jul/2026; relatórios anuais no SINIR até 30 de julho', efeito: 'Cria demanda obrigatória e crescente por plástico reciclado', fontes: ['S-10', 'S-11', 'S-12'] },
  { nome: 'Plano Nacional de Economia Circular 2025–2034', conteudo: 'Linhas de crédito específicas para reciclagem, com pesos diferenciados para certificados', efeito: 'Diretriz de fomento', fontes: ['S-33'] }
];

const INCENTIVOS = [
  { nome: 'PROIND', oQue: 'Crédito presumido de ICMS de 65% a 80%', condicao: 'CNAE do grupo 22 — produtos de plásticos — elegível; 10% de contribuição ao FUNCEP', janela: 'Fruição até 31/12/2032', fontes: ['S-25'] },
  { nome: 'DESENVOLVE', oQue: 'Diferimento e dilação de até 72 meses do saldo devedor de ICMS', condicao: 'Novos projetos industriais, via Carta Consulta', janela: 'Programa em vigência', fontes: ['S-26'] },
  { nome: 'BNDES — Tudo na Circularidade', oQue: 'Linha de crédito dedicada a reciclagem', condicao: 'Projetos alinhados à PNRS', janela: 'Contínua', fontes: ['S-27'] },
  { nome: 'Finor (BNB)', oQue: 'Fundo de investimento para projetos produtivos do Nordeste', condicao: 'Projetos no Nordeste', janela: 'Contínua', fontes: ['S-28'] },
  { nome: 'CCRLR — Créditos de Reciclagem', oQue: 'Valor por tonelada comprovada de material reciclado', condicao: 'Entidade gestora homologada sob o Decreto 11.413', janela: 'Em vigor', fontes: ['S-13', 'S-14'] },
  { nome: 'FNMA e editais federais', oQue: 'Apoio a projetos de coleta e reciclagem', condicao: 'Conformidade PNRS/SINIR', janela: 'Por edital', fontes: ['S-33b'] }
];

const TIMELINE = [
  { ano: '1960 / 1998', texto: 'Registro da marca Isopor®, depois adquirida pela Knauf', fontes: ['S-01'] },
  { ano: '1993', texto: 'Isoplast inicia atuação no Norte-Nordeste', fontes: ['S-23'] },
  { ano: '2005', texto: 'Fundação da Proecologic', fontes: ['S-15'] },
  { ano: '2007', texto: 'Termotécnica lança o Programa Reciclar EPS; 51 milhões de kg acumulados', fontes: ['S-04'] },
  { ano: '2010', texto: 'PNRS institui a logística reversa. 450 aberturas na cadeia da Bahia no ano', fontes: ['S-13', 'S-42'] },
  { ano: '2011–2015', texto: 'Isobahia (2011) e Iso Conquista (2015) fundadas na Bahia', fontes: ['S-21', 'S-22'] },
  { ano: '2019–2025', texto: 'Isobras cresce em Itatim e anuncia R$ 70 mi (dez/2025): 550 para 1.050 empregos', fontes: ['S-20'] },
  { ano: '2023', texto: 'Decretos 11.413 (créditos de reciclagem) e 11.414', fontes: ['S-13', 'S-14'] },
  { ano: '2025', texto: 'Decreto 12.688 cria a logística reversa obrigatória. 1.666 aberturas na cadeia baiana', fontes: ['S-10', 'S-42'] },
  { ano: '2026', texto: 'Exigências começam: 32% de recuperação e 22% de conteúdo reciclado. Sebrae conecta cooperativas à indústria em Feira', fontes: ['S-10', 'S-07'] }
];

/* ---------------------------------------------------------------------------
   8. TERRITORIO — diagrama esquematico. Sem geometria verificada.
   ------------------------------------------------------------------------ */
const POLOS = [
  { nome: 'Salvador / RM', itens: [
    { t: 'Knauf Isopor® — fábrica e PEV de coleta', ator: 'A-01' },
    { t: 'Isoplast — filial; usa bloco T1R reciclado', ator: 'A-02' },
    { t: '16 cooperativas da LIMPURB (CANORE e COOPERBRAVA aceitam isopor)', ator: 'A-13' },
    { t: 'Mercado do Peixe e Feira de São Joaquim — gerador de caixas térmicas', ator: 'A-24' } ] },
  { nome: 'Feira de Santana — centro da operação proposta', itens: [
    { t: 'Redesol, Ginga Recicla, Artemares, Coobafs — oferta estruturada', ator: 'A-09' },
    { t: 'Demanda industrial declarada de 332 t/mês (Sebrae)', ator: 'A-15' },
    { t: 'Newmaq, Atlas, Eletrodomésticos Pinheiro — geradores de EPS', ator: 'A-16' },
    { t: 'LWART, Sustentare, Qualix — operadores formais de resíduos', ator: 'A-19' } ] },
  { nome: 'Conceição do Jacuípe — região de Feira', itens: [
    { t: 'Realce Indústria — 300 t recicladas em 2025', ator: 'A-08' },
    { t: 'Grupo MK (Mondial / AIWA) — nova planta anunciada', ator: 'A-17' } ] },
  { nome: 'Agreste e Sul da Bahia', itens: [
    { t: 'Isobras — Itatim (BR-324)', ator: 'A-03' },
    { t: 'Isobahia (ABS Poliestireno) — Santo Antônio de Jesus', ator: 'A-04' } ] },
  { nome: 'Sudoeste da Bahia', itens: [
    { t: 'Iso Conquista — Vitória da Conquista', ator: 'A-05' } ] },
  { nome: 'Fora da Bahia — destinos citados na pesquisa', itens: [
    { t: 'Termotécnica — Petrolina/PE, a unidade mais próxima', ator: 'A-06' },
    { t: 'Proecologic — São Paulo (localidade em divergência entre as fontes)', ator: 'A-07' },
    { t: 'Atravessadores para Espírito Santo e Minas Gerais (prática declarada por cooperativas baianas)', ator: null } ] }
];

const DENSIFICACAO = {
  caminhao: { volume: '70 m³', soltoMin: 100, soltoMax: 400, densificado: 6000, fonte: ['S-15'] },
  observacao: 'Referência ilustrativa da pesquisa setorial. Não é capacidade garantida da operação proposta.',
  equipRef: [{ nome: 'RUNI SK120', kgHora: 18, fonte: 'S-35' }, { nome: 'RecycleTech XT70', kgHora: 22, fonte: 'S-36' }]
};

/* ---------------------------------------------------------------------------
   9. PREMISSAS DA CALCULADORA — presets e valores default
   ------------------------------------------------------------------------ */
const PRESETS = {
  base: {
    nome: 'Base — convenção da pesquisa',
    origem: 'Valores centrais das faixas da pesquisa e do modelo A (hub de coleta + densificação).',
    valores: { volume: 20, perda: 8, compra: 0.50, venda: 2.10, capex: 275000, fixo: 18000, frete: 120,
      creditoValor: 60, creditoAtivo: false, elegivelTon: 0, comprovadoTon: 20,
      kgHora: 20, horas: 160, qtd: 7, utilizacao: 100 }
  },
  conservador: {
    nome: 'Conservador — faixas de preço baixas',
    origem: 'Ponta baixa das faixas: compra R$ 0,30/kg, venda R$ 1,50/kg, CAPEX R$ 150 mil.',
    valores: { volume: 10, perda: 12, compra: 0.30, venda: 1.50, capex: 150000, fixo: 15000, frete: 140,
      creditoValor: 40, creditoAtivo: false, elegivelTon: 0, comprovadoTon: 10,
      kgHora: 20, horas: 160, qtd: 2, utilizacao: 85 }
  },
  otimista: {
    nome: 'Otimista — faixas de preço altas',
    origem: 'Ponta alta das faixas: compra R$ 0,80/kg, venda R$ 2,80/kg, CAPEX R$ 400 mil. Exige escala que ainda não está contratada.',
    valores: { volume: 40, perda: 5, compra: 0.80, venda: 2.80, capex: 400000, fixo: 22000, frete: 100,
      creditoValor: 80, creditoAtivo: false, elegivelTon: 0, comprovadoTon: 40,
      kgHora: 22, horas: 200, qtd: 10, utilizacao: 95 }
  }
};

/* Campos com dominio validado. min/max em unidades do campo. */
const CAMPOS_CALC = [
  { key: 'volume', rotulo: 'Volume de entrada', unidade: 't/mês', min: 0.01, max: 100000, passo: '1',
    grupo: 'operacional', ajuda: 'Massa de EPS solto recebida no mês.' },
  { key: 'perda', rotulo: 'Perda e triagem', unidade: '%', min: 0, max: 100, passo: '1',
    grupo: 'operacional', ajuda: 'Percentual da massa de entrada que não vira massa vendável.' },
  { key: 'compra', rotulo: 'Custo de compra do EPS solto', unidade: 'R$/kg de entrada', min: 0, max: 1000, passo: '0.05',
    grupo: 'economico', ajuda: 'Preço pago por quilograma de material recebido.' },
  { key: 'venda', rotulo: 'Preço de venda do material densificado', unidade: 'R$/kg de saída', min: 0, max: 1000, passo: '0.05',
    grupo: 'economico', ajuda: 'Aplicado à massa de saída, já líquida de perda.' },
  { key: 'capex', rotulo: 'CAPEX inicial', unidade: 'R$', min: 0, max: 100000000, passo: '5000',
    grupo: 'economico', ajuda: 'Investimento em densificador, balança, prensa, galpão e frota leve.' },
  { key: 'fixo', rotulo: 'Custo fixo mensal', unidade: 'R$/mês', min: 0, max: 10000000, passo: '1000',
    grupo: 'economico', ajuda: 'Pessoal, energia, aluguel, seguros e demais custos que não variam com o volume.' },
  { key: 'frete', rotulo: 'Logística', unidade: 'R$/t de entrada', min: 0, max: 10000, passo: '10',
    grupo: 'economico', ajuda: 'Custo de transporte e movimentação por tonelada recebida.' },
  { key: 'creditoValor', rotulo: 'Valor do crédito de reciclagem', unidade: 'R$/t elegível', min: 0, max: 10000, passo: '10',
    grupo: 'credito', ajuda: 'Hipótese de valor por tonelada comprovada. Não é receita garantida.' },
  { key: 'elegivelTon', rotulo: 'Massa elegível a crédito', unidade: 't/mês', min: 0, max: 100000, passo: '0.5',
    grupo: 'credito', ajuda: 'Fração da massa comprovada que se qualifica para CCRLR. Não pode exceder a massa comprovada.' },
  { key: 'comprovadoTon', rotulo: 'Massa comprovada', unidade: 't/mês', min: 0, max: 100000, passo: '0.5',
    grupo: 'credito', ajuda: 'Massa efetivamente comprovável perante a entidade gestora.' },
  { key: 'kgHora', rotulo: 'Capacidade do equipamento', unidade: 'kg/h', min: 0, max: 1000, passo: '1',
    grupo: 'capacidade', ajuda: 'Equipamentos de referência publicados indicam 18 a 22 kg/h.' },
  { key: 'horas', rotulo: 'Horas de operação por mês', unidade: 'h/mês', min: 1, max: 744, passo: '8',
    grupo: 'capacidade', ajuda: 'Um turno de 8 h por dia útil equivale a cerca de 160 h/mês.' },
  { key: 'qtd', rotulo: 'Quantidade de equipamentos', unidade: 'unidades', min: 1, max: 100, passo: '1',
    grupo: 'capacidade', ajuda: 'Número de equipamentos operando em paralelo.' },
  { key: 'utilizacao', rotulo: 'Fator de utilização', unidade: '%', min: 1, max: 100, passo: '1',
    grupo: 'capacidade', ajuda: 'Parasas, manutenção e variação de carga.' }
];

const LIMITES_CALC = 1e9;   // acima disso o campo é tratado como irreal

const ITENS_NAO_MODELADOS = [
  'Impostos — ICMS, IPI, PIS, COFINS e ISS',
  'Financiamento e custo do capital',
  'Capital de giro',
  'Depreciação',
  'Manutenção e peças de reposição',
  'Energia detalhada por equipamento',
  'Mão de obra detalhada e encargos',
  'Seguros, aluguel e despesas administrativas',
  'Descarte de rejeitos e resíduos de processo',
  'Variação de preço entre compra e venda',
  'Custo de triagem por fração de material',
  'Logística de retorno vazio',
  'Certificações e licenças ambientais',
  'Custo de conformidade sanitária, quando houver destino a contato alimentar'
];

/* ---------------------------------------------------------------------------
   10. AREAS
   ------------------------------------------------------------------------ */
const AREAS = [
  { id: 'visao', nome: 'Visão executiva', curto: 'Decisão', pergunta: 'Qual decisão avaliar agora?' },
  { id: 'mercado', nome: 'Mercado e evidências', curto: 'Mercado', pergunta: 'Qual a dimensão e a robustez dos dados?' },
  { id: 'territorio', nome: 'Território e logística', curto: 'Território', pergunta: 'Por que Feira e quais conexões importam?' },
  { id: 'cadeia', nome: 'Cadeia e parceiros', curto: 'Cadeia', pergunta: 'Com quem estruturar oferta e venda?' },
  { id: 'viabilidade', nome: 'Viabilidade', curto: 'Viabilidade', pergunta: 'Em quais condições a operação se sustenta?' },
  { id: 'plano', nome: 'Plano e riscos', curto: 'Plano', pergunta: 'Como validar e avançar?' },
  { id: 'fontes', nome: 'Fontes e método', curto: 'Fontes', pergunta: 'De onde vêm as afirmações?' }
];