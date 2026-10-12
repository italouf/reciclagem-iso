#!/usr/bin/env python3
"""Extração RFB (CNPJ) via Base dos Dados/BigQuery — cadeia de EPS/reciclagem na BA.

Sigue o skill base-dos-dados-bigquery (arquivado):
- tabelas 3 partes basedosdados.<ds>.<tabela>
- MAX(data) para partição (pruning ~0 bytes)
- dry-run com abort se > LIMITE_GB
- empresas SEMPRE com filtro de partição no join
- saidas: CSV de players + JSON de agregados (sem e-mails/telefones — LGPD)
"""
import os, sys, json, datetime, time

SA = "/root/hermes-docs/entrada/ParaConverter/fundingprojectnei-b659ad56be2c.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = SA

from google.cloud import bigquery

PROJ = "fundingprojectnei"
LIMITE_GB = 20.0
OUT = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(OUT, "extracao.log")
CACHE = os.path.join(OUT, "cache")
os.makedirs(CACHE, exist_ok=True)

client = bigquery.Client(project=PROJ)

def log(msg):
    line = f"[{datetime.datetime.now():%H:%M:%S}] {msg}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def run(sql, params=None, name="q", max_gb=LIMITE_GB):
    """Dry-run -> log custo -> aborta se > limite -> executa -> DF."""
    cfg = bigquery.QueryJobConfig(query_parameters=params or [])
    dry = client.query(sql, job_config=bigquery.QueryJobConfig(
        query_parameters=params or [], dry_run=True, use_query_cache=False))
    gb = (dry.total_bytes_processed or 0) / 1e9
    log(f"[dry-run {name}] {gb:.3f} GB")
    if gb > max_gb:
        log(f"ABORT {name}: {gb:.3f} GB > limite {max_gb} GB")
        sys.exit(2)
    t0 = time.time()
    df = client.query(sql, job_config=cfg).to_dataframe()
    log(f"[exec {name}] {len(df)} linhas em {time.time()-t0:.1f}s ({gb:.3f} GB)")
    return df

# ---------- 1. partição mais recente ----------
part = run("SELECT MAX(data) AS p FROM `basedosdados.br_me_cnpj.estabelecimentos`",
           name="particao").iloc[0]["p"]
if isinstance(part, str):
    part = part[:10]
log(f"partição: {part}")
P = bigquery.ScalarQueryParameter("p", "DATE", part)

# ---------- 2. candidatos no diretório CNAE (tabela minúscula, ~grátis) ----------
cnaes = run("""
    SELECT subclasse, descricao_subclasse, divisao, descricao_divisao
    FROM `basedosdados.br_bd_diretorios_brasil.cnae_2`
    WHERE divisao IN ('22','38','46','32','33')
""", name="dir_cnae")
import re
def hit(txt):
    t = txt.lower()
    return any(k in t for k in [
        "plástit", "plástic", "resídu", "sucata", "reciclag", "recuperação",
        "coleta de res", "isopor", "poliestireno", "embalagem"])

cnaes["hit"] = cnaes["descricao_subclasse"].map(hit)
cand = cnaes[cnaes["hit"]][["subclasse", "descricao_subclasse", "divisao"]]
codes = sorted(cand["subclasse"].unique().tolist())
log(f"CNAEs candidatos: {len(codes)}")
cand.to_csv(os.path.join(OUT, "cnaes_candidatos.csv"), index=False)

# ---------- 3. estabelecimentos BA (escopo da cadeia) ----------
IN_P = bigquery.ArrayQueryParameter("codes", "STRING", codes)
SQL_EST = """
WITH est AS (
  SELECT cnpj_basico, cnpj, nome_fantasia, situacao_cadastral,
         data_inicio_atividade, cnae_fiscal_principal, cnae_fiscal_secundaria,
         sigla_uf, id_municipio
  FROM `basedosdados.br_me_cnpj.estabelecimentos`
  WHERE data = @p AND sigla_uf = 'BA'
    AND (cnae_fiscal_principal IN UNNEST(@codes)
         OR REGEXP_CONTAINS(cnae_fiscal_secundaria, @re))
)
SELECT * FROM est
"""
re_pat = "(" + "|".join(codes) + ")"
SQL_PARAMS_3 = [P, IN_P, bigquery.ScalarQueryParameter("re", "STRING", re_pat)]
est_ba = run(SQL_EST, params=SQL_PARAMS_3, name="est_ba")
est_ba.to_parquet(os.path.join(CACHE, "est_ba.parquet"), index=False)

# ---------- 4. join empresas (mesma partição) para razão social / capital ----------
SQL_EMP = """
WITH est AS (
  SELECT DISTINCT cnpj_basico
  FROM `basedosdados.br_me_cnpj.estabelecimentos`
  WHERE data = @p AND sigla_uf = 'BA'
    AND (cnae_fiscal_principal IN UNNEST(@codes)
         OR REGEXP_CONTAINS(cnae_fiscal_secundaria, @re))
)
SELECT em.cnpj_basico, em.razao_social, em.capital_social, em.porte, em.natureza_juridica
FROM `basedosdados.br_me_cnpj.empresas` em
JOIN est ON est.cnpj_basico = em.cnpj_basico
WHERE em.data = @p
"""
emp = run(SQL_EMP, params=[P, IN_P, bigquery.ScalarQueryParameter("re", "STRING", re_pat)],
          name="empresas")
emp.to_parquet(os.path.join(CACHE, "empresas.parquet"), index=False)

# ---------- 5. escopo nacional (mesmos CNAEs) por UF ----------
SQL_NAC = """
SELECT sigla_uf, COUNT(DISTINCT cnpj_basico) AS n
FROM `basedosdados.br_me_cnpj.estabelecimentos`
WHERE data = @p AND CAST(situacao_cadastral AS STRING) = '2'
  AND (cnae_fiscal_principal IN UNNEST(@codes)
       OR REGEXP_CONTAINS(cnae_fiscal_secundaria, @re))
GROUP BY sigla_uf ORDER BY n DESC
"""
nac = run(SQL_NAC, params=[P, IN_P, bigquery.ScalarQueryParameter("re", "STRING", re_pat)],
          name="nacional")

# ---------- 6. estabelecimentos BA com escopo amplo p/ aberturas (todas situações) ----------
SQL_ABERT = """
SELECT EXTRACT(YEAR FROM data_inicio_atividade) AS ano,
       CAST(situacao_cadastral AS STRING) AS sit,
       COUNT(DISTINCT cnpj_basico) AS n
FROM `basedosdados.br_me_cnpj.estabelecimentos`
WHERE data = @p AND sigla_uf = 'BA'
  AND (cnae_fiscal_principal IN UNNEST(@codes)
       OR REGEXP_CONTAINS(cnae_fiscal_secundaria, @re))
  AND data_inicio_atividade >= '2010-01-01'
GROUP BY 1, 2 ORDER BY 1
"""
abert = run(SQL_ABERT, params=[P, IN_P, bigquery.ScalarQueryParameter("re", "STRING", re_pat)],
            name="aberturas")

# ---------- 7. agregados ----------
import pandas as pd
SIT = {"1": "NULA", "2": "ATIVA", "3": "SUSPENSA", "4": "INAPTA", "8": "BAIXADA"}
est_ba["sit"] = est_ba["situacao_cadastral"].astype(str).map(SIT).fillna("OUTRA")
ativos = est_ba[est_ba["sit"] == "ATIVA"].copy()
ativos["municipio"] = ativos["id_municipio"].astype(str)
emp_ix = emp.drop_duplicates("cnpj_basico").set_index("cnpj_basico")
ativos = ativos.join(emp_ix, on="cnpj_basico", how="left")
PORT = {"1": "ME", "3": "EPP", "5": "DEMAIS"}
ativos["porte_txt"] = ativos["porte"].astype(str).map(PORT)

def setor(cod, desc):
    cod = str(cod)
    d = (str(desc) if desc is not None else "").lower()
    if cod.startswith("3811") or "coleta de res" in d: return "Coleta"
    if cod.startswith("38") and ("recuperação" in d or "resídu" in d or "sucata" in d): return "Recuperação/Beneficiamento"
    if cod.startswith("46") and ("sucata" in d or "resídu" in d): return "Comércio de sucata"
    if cod.startswith("22"): return "Produção de plásticos/EPS"
    return "Outro"

cod2desc = dict(zip(cand["subclasse"], cand["descricao_subclasse"]))
ativos["descricao"] = ativos["cnae_fiscal_principal"].map(cod2desc)
ativos["setor"] = [setor(c, d) for c, d in zip(ativos["cnae_fiscal_principal"], ativos["descricao"])]

mun_map = {
    "2910800": "Feira de Santana", "2927408": "Salvador", "2928100": "Simões Filho",
    "2916107": "Itatim", "2928400": "Santo Antônio de Jesus",
    "2928509": "Vitória da Conquista", "2908508": "Conceição do Jacuípe",
}
ativos["municipio_nome"] = ativos["municipio"].map(mun_map).fillna("(outros BA)")

# players com nome/social
players = ativos[ativos["municipio"].isin(mun_map)][
    ["cnpj", "cnpj_basico", "nome_fantasia", "razao_social", "municipio_nome",
     "cnae_fiscal_principal", "descricao", "setor", "data_inicio_atividade",
     "capital_social", "porte_txt", "situacao_cadastral"]
].sort_values(["municipio_nome", "setor", "razao_social"])
players.to_csv(os.path.join(OUT, "rfb_players_ba.csv"), index=False)

agreg = {
    "particao": str(part),
    "extraido_em": datetime.datetime.now().isoformat(timespec="seconds"),
    "cnaes_candidatos_total": len(codes),
    "ba": {
        "ativos_total_escopo": int(len(ativos)),
        "por_setor": ativos["setor"].value_counts().to_dict(),
        "por_municipio_foco": ativos[ativos["municipio"].isin(mun_map)]["municipio_nome"].value_counts().to_dict(),
        "por_porte": ativos["porte_txt"].fillna("NÃO INFORMADO").value_counts().to_dict(),
        "capital_social_total_foco": float(ativos[ativos["municipio"].isin(mun_map)]["capital_social"].fillna(0).sum()),
        "ativos_situacao": est_ba["sit"].value_counts().to_dict(),
    },
    "nacional": {r.sigla_uf: int(r.n) for r in nac.itertuples()},
    "aberturas_ba": {str(int(r.ano)): {"ativa": int(r.n) if r.sit == "2" else 0,
                                        "baixada": int(r.n) if r.sit == "8" else 0}
                     for r in abert.itertuples() if r.ano == r.ano},
}
total_nac = sum(agreg["nacional"].values())
agreg["ba"]["participacao_nacional_pct"] = round(100 * agreg["ba"]["ativos_total_escopo"] / total_nac, 2) if total_nac else None
agreg["nacional_total"] = total_nac

with open(os.path.join(OUT, "rfb_agregados.json"), "w", encoding="utf-8") as f:
    json.dump(agreg, f, ensure_ascii=False, indent=2)

log("RESUMO: " + json.dumps({
    "ativos_BA": agreg["ba"]["ativos_total_escopo"],
    "por_setor": agreg["ba"]["por_setor"],
    "foco_mun": agreg["ba"]["por_municipio_foco"],
    "participacao_BA_%": agreg["ba"]["participacao_nacional_pct"],
    "players_mapeados": len(players),
}, ensure_ascii=False))
log("OK — saidas em " + OUT)
