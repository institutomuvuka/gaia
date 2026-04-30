#!/usr/bin/env python3
# ============================================================
# GAIA — Pipeline de ingestão das Unidades de Conservação (CNUC)
# Baixa o shapefile oficial do MMA, simplifica e converte para GeoJSON.
# Reproduzível: rode quando o MMA publicar nova versão do CNUC.
#
# Uso:
#   pip install geopandas
#   python3 scripts/ingest_cnuc.py
# ============================================================

import json
import os
import sys
import urllib.request
import zipfile
import tempfile

import geopandas as gpd
from shapely.geometry import mapping

URL = "https://dados.mma.gov.br/dataset/44b6dc8a-dc82-4a84-8d95-1b0da7c85dac/resource/9ec98f66-44ad-4397-8583-a1d9cc3a9835/download/shp_cnuc_2024_02.zip"
SIMPLIFY_TOLERANCE_DEG = 0.005  # ~500 m
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "conservation-units.geojson")


def fix_encoding(s):
    """O DBF declara UTF-8 mas alguns campos vêm em CP1252. Corrige duplo encoding."""
    if not isinstance(s, str):
        return s
    try:
        return s.encode("latin1").decode("utf-8")
    except Exception:
        return s


def biome_of(row):
    biome_cols = {
        "amazonia": "Amazônia", "caatinga": "Caatinga", "cerrado": "Cerrado",
        "matlantica": "Mata Atlântica", "pampa": "Pampa", "pantanal": "Pantanal",
        "marinho": "Marinho",
    }
    out = []
    for col, label in biome_cols.items():
        v = row.get(col)
        if v not in (None, "", "None"):
            out.append(label)
    return ", ".join(out) if out else "Não classificado"


def main():
    with tempfile.TemporaryDirectory() as tmp:
        zip_path = os.path.join(tmp, "cnuc.zip")
        print(f"Baixando {URL}...")
        urllib.request.urlretrieve(URL, zip_path)

        print("Extraindo shapefile...")
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(tmp)

        shp = os.path.join(tmp, "cnuc_2024_02.shp")
        print(f"Lendo {shp}...")
        gdf = gpd.read_file(shp, encoding="ISO-8859-1")

        for col in ["nome_uc", "grupo", "categoria", "org_gestor",
                    "municipio", "esfera", "uf", "NomeAbrev"]:
            if col in gdf.columns:
                gdf[col] = gdf[col].apply(fix_encoding)

        gdf = gdf[gdf["situacao"] == "Ativo"].copy()
        print(f"{len(gdf)} UCs ativas. Simplificando geometria...")
        gdf["geometry"] = gdf["geometry"].simplify(
            SIMPLIFY_TOLERANCE_DEG, preserve_topology=True
        )
        gdf["bioma"] = gdf.apply(biome_of, axis=1)

        features = []
        for _, r in gdf.iterrows():
            if r.geometry is None or r.geometry.is_empty:
                continue
            props = {
                "id": str(r.get("cd_cnuc") or r.get("uc_id") or ""),
                "name": r.get("nome_uc"),
                "shortName": r.get("NomeAbrev") or r.get("nome_uc"),
                "category": r.get("categoria"),
                "group": r.get("grupo"),
                "sphere": r.get("esfera"),
                "manager": r.get("org_gestor"),
                "biome": r.get("bioma"),
                "uf": r.get("uf"),
                "areaHa": float(r.get("area_ha"))
                          if r.get("area_ha") not in (None, "") else None,
                "tier": "public",
                "sourceUrl": "https://dados.mma.gov.br/dataset/unidadesdeconservacao",
            }
            features.append({
                "type": "Feature",
                "properties": {k: v for k, v in props.items() if v is not None},
                "geometry": mapping(r.geometry),
            })

        out = {
            "type": "FeatureCollection",
            "name": "cnuc-2024-02",
            "metadata": {
                "title": "Unidades de Conservação do Brasil — CNUC 2024.02",
                "source_official": "https://dados.mma.gov.br/dataset/unidadesdeconservacao",
                "license": "Dados públicos — MMA / CNUC",
                "reference_date": "2024-02",
                "simplification": f"Douglas-Peucker tolerance {SIMPLIFY_TOLERANCE_DEG}°",
                "crs": "EPSG:4674 (SIRGAS 2000)",
                "ingestionStatus": "official",
                "totalFeatures": len(features),
            },
            "features": features,
        }

        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"Salvo em {OUT} — {len(features)} features, "
              f"{os.path.getsize(OUT) / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    sys.exit(main())
