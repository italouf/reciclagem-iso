#!/usr/bin/env python3
"""Pós-processamento: join municipal + agregados corrigidos (lê cache das queries)."""
import os, json, datetime
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/root/hermes-docs/entrada/ParaConverter/fundingprojectnei-b659ad56be2c.json"
import pandas as pd
from google.cloud import bigquery

OUT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(OUT, "cache")
client = bigquery.Client(project="fundingprojectnei")

est = pd.read_parquet(os.path.join(CACHE, "est_ba.parquet"))
emp = pd.read_parquet(os.path.join(CACHE, "empresas.parquet"))
cand = pd.read_csv(os.path.join(OUT, "cnaes_candidatos.csv"), dtype={"subclasse": str})
cod2desc = dict(zip(cand["subclasse"], cand["descricao_subclasse"]))
codes = sorted(cand["subclasse"].unique())

# diretório municipal BA
mun = client.query("""
  SELECT id_municipio, nome, nome_regiao_metropolitana, nome_regiao_imediata
  FROM `basedosdados.br_bd_diretorios_brasil.municipio` WHERE sigla_uf='BA'
""").to_dataframe()
mun["id_municipio"] = mun["id_municipio"].astype(str)
mmap = dict(zip(mun["id_municipio"], mun["nome"]))

# série de aberturas corrigida (re-agrega)
ab = client.query("""
SELECT EXTRACT(YEAR FROM data_inicio_atividade) AS ano,
       CAST(situacao_cadastral AS STRING) AS sit,
       COUNT(DISTINCT cnpj_basico) AS n
FROM `basedosdados.br_me_cnpj.estabelecimentos`
WHERE data = @p AND sigla_uf = 'BA'
  AND (cnae_fiscal_principal IN UNNEST(@codes)
       OR REGEXP_CONTAINS(cnae_fiscal_secundaria, @re))
  AND data_inicio_atividade >= '2010-01-01'
GROUP BY 1, 2 ORDER BY 1
""", job_config=bigquery.QueryJobConfig(query_parameters=[
    bigquery.ScalarQueryParameter("p", "DATE", "2026-01-11"),
    bigquery.ArrayQueryParameter("codes", "STRING", codes),
    bigquery.ScalarQueryParameter("re", "STRING", "(" + "|".join(codes) + ")"),
])).to_dataframe()
piv = ab.pivot_table(index="ano", columns="sit", values="n", aggfunc="sum").fillna(0).astype(int)
aberturas = {str(int(ano)): {"ativa": int(row.get("2", 0)), "baixada": int(row.get("8", 0)),
                             "outras": int(row.get("3", 0) + row.get("4", 0) + row.get("1", 0))}
             for ano, row in piv.iterrows() if ano >= 2010}

# classificação: principal x secundária
SIT = {"1": "NULA", "2": "ATIVA", "3": "SUSPENSA", "4": "INAPTA", "8": "BAIXADA"}
est["sit"] = est["situacao_cadastral"].astype(str).map(SIT).fillna("OUTRA")
ativos = est[est["sit"] == "ATIVA"].copy()
ativos["id_municipio"] = ativos["id_municipio"].astype(str)
ativos["municipio"] = ativos["id_municipio"].map(mmap).fillna("(desconhecido)")
ativos["principal_no_escopo"] = ativos["cnae_fiscal_principal"].isin(codes)

emp_ix = emp.drop_duplicates("cnpj_basico").set_index("cnpj_basico")
ativos = ativos.join(emp_ix, on="cnpj_basico", how="left")
PORT = {"1": "ME", "3": "EPP", "5": "DEMAIS"}
ativos["porte_txt"] = ativos["porte"].astype(str).map(PORT).fillna("NÃO INFORMADO")
ativos["descricao"] = ativos["cnae_fiscal_principal"].map(cod2desc)

def setor(cod, desc):
    cod = str(cod); d = (str(desc) if pd.notna(desc) else "").lower()
    if cod.startswith("3811"): return "Coleta de resíduos"
    if cod.startswith("3832"): return "Recuperação de plásticos"
    if cod.startswith("38"): return "Recuperação/tratamento (outros)"
    if cod.startswith("4687"): return "Comércio de sucata"
    if cod.startswith("22"): return "Produção de plásticos/EPS"
    if cod.startswith("3314"): return "Reparo de maq. plásticos"
    return "Outro CNAE (entrou por secundária)"
ativos["setor"] = [setor(c, d) for c, d in zip(ativos["cnae_fiscal_principal"], ativos["descricao"])]

FOCO = ["Feira de Santana", "Salvador", "Simões Filho", "Itatim",
        "Santo Antônio de Jesus", "Vitória da Conquista", "Conceição do Jacuípe"]

# players (foco) — sem e-mail/telefone (LGPD)
players = ativos[ativos["municipio"].isin(FOCO)][
    ["cnpj", "cnpj_basico", "nome_fantasia", "razao_social", "municipio",
     "cnae_fiscal_principal", "descricao", "setor", "principal_no_escopo",
     "data_inicio_atividade", "capital_social", "porte_txt"]
].sort_values(["municipio", "setor", "razao_social"])
players.to_csv(os.path.join(OUT, "rfb_players_ba.csv"), index=False)

nac = client.query("""
SELECT sigla_uf, COUNT(DISTINCT cnpj_basico) AS n
FROM `basedosdados.br_me_cnpj.estabelecimentos`
WHERE data = @p AND CAST(situacao_cadastral AS STRING) = '2'
  AND (cnae_fiscal_principal IN UNNEST(@codes)
       OR REGEXP_CONTAINS(cnae_fiscal_secundaria, @re))
GROUP BY 1""", job_config=bigquery.QueryJobConfig(query_parameters=[
    bigquery.ScalarQueryParameter("p", "DATE", "2026-01-11"),
    bigquery.ArrayQueryParameter("codes", "STRING", codes),
    bigquery.ScalarQueryParameter("re", "STRING", "(" + "|".join(codes) + ")"),
])).to_dataframe()
nacional = {r.sigla_uf: int(r.n) for r in nac.itertuples()}
total_nac = sum(nacional.values())

top_mun = ativos["municipio"].value_counts()
setores = ativos["setor"].value_counts()
escopo_foco = ativos[ativos["municipio"].isin(FOCO)]

# núcleo estrito (CNAE principal no escopo) — indicador-chave
nucleo = ativos[ativos["principal_no_escopo"]]
nucleo_foco = nucleo[nucleo["municipio"].isin(FOCO)]

agreg = {
    "fonte": "Base dos Dados / br_me_cnpj (Receita Federal) via BigQuery",
    "particao_dados": "2026-01-11",
    "extraido_em": datetime.datetime.now().isoformat(timespec="seconds"),
    "cnaes_no_escopo": len(codes),
    "escopo_cnaes": [{"codigo": c, "descricao": cod2desc.get(c, "")} for c in codes],
    "ba": {
        "ativos_por_cnae_principal_ou_secundaria": int(len(ativos)),
        "ativos_cnae_principal_no_escopo": int(len(nucleo)),
        "por_setor": {k: int(v) for k, v in setores.items()},
        "por_municipio_top10": {k: int(v) for k, v in top_mun.head(10).items()},
        "por_municipio_foco": {m: int(top_mun.get(m, 0)) for m in FOCO},
        "nucleo_foco_por_municipio": {m: int(len(nucleo_foco[nucleo_foco["municipio"] == m])) for m in FOCO},
        "por_porte": ativos["porte_txt"].value_counts().to_dict(),
        "capital_social_foco_R": float(escopo_foco["capital_social"].fillna(0).sum()),
        "situacao_cadastral": est["sit"].value_counts().to_dict(),
    },
    "nacional": nacional,
    "nacional_total_ativos": int(total_nac),
    "participacao_ba_pct": round(100 * len(ativos) / total_nac, 2) if total_nac else None,
    "aberturas_ba_por_ano": aberturas,
}

# validações
feira_nucleo = int(len(nucleo_foco[nucleo_foco["municipio"] == "Feira de Santana"]))
rec_ba = int(setores.get("Recuperação de plásticos", 0))
agreg["validacoes"] = {
    "players_conhecidos_encontrados": [
        n for n in ["KNAUF", "ISOPLAST", "ISOBRAS", "ISO CONQUISTA", "ISOBAHIA"]
        if players["razao_social"].fillna("").str.upper().str.contains(n).any()
    ],
    "recuperadores_plasticos_BA_ativos": rec_ba,
    "feira_nucleo": feira_nucleo,
    "nota_cobertura": ("Escopo = 19 subclasses CNAE de plásticos, resíduos e sucata; "
                       "estabelecimentos com CNAE secundário também entram, por isso "
                       "ativos_total > núcleo. Dados: partição 11/01/2026 da RFB.")
}

with open(os.path.join(OUT, "rfb_agregados.json"), "w", encoding="utf-8") as f:
    json.dump(agreg, f, ensure_ascii=False, indent=2)

print(json.dumps({k: agreg[k] for k in ["participacao_ba_pct", "nacional_total_ativos"]}, ensure_ascii=False))
print("BA núcleo:", agreg["ba"]["ativos_cnae_principal_no_escopo"], "| total escopo:", agreg["ba"]["ativos_por_cnae_principal_ou_secundaria"])
print("setores:", json.dumps(agreg["ba"]["por_setor"], ensure_ascii=False))
print("foco:", json.dumps(agreg["ba"]["por_municipio_foco"], ensure_ascii=False))
print("validações:", json.dumps(agreg["validacoes"], ensure_ascii=False))
print("aberturas:", json.dumps({k: v for k, v in aberturas.items() if v["ativa"] > 0}, ensure_ascii=False))
