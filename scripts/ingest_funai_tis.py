#!/usr/bin/env python3
# ============================================================
# GAIA — Pipeline de ingestão das Terras Indígenas (FUNAI)
# Baixa via WFS do GeoServer oficial da FUNAI, simplifica e converte para GeoJSON.
#
# Uso:
#   pip install geopandas
#   python3 scripts/ingest_funai_tis.py
# ============================================================

import json
import os
import sys
import tempfile
import urllib.request
import zipfile

import geopandas as gpd
from shapely.geometry import mapping

WFS_URL = (
    "https://geoserver.funai.gov.br/geoserver/Funai/ows"
    "?service=WFS&version=2.0.0&request=GetFeature"
    "&typeName=Funai:tis_poligonais&outputFormat=SHAPE-ZIP"
)
SIMPLIFY_TOLERANCE_DEG = 0.005  # ~500 m
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "indigenous-lands.geojson")


def fix_encoding(s):
    if not isinstance(s, str):
        return s
    try:
        return s.encode("latin1").decode("utf-8")
    except Exception:
        return s


def main():
    with tempfile.TemporaryDirectory() as tmp:
        zip_path = os.path.join(tmp, "tis.zip")
        print(f"Baixando WFS oficial da FUNAI ({WFS_URL[:60]}...)")
        urllib.request.urlretrieve(WFS_URL, zip_path)

        with zipfile.ZipFile(zip_path) as z:
            z.extractall(tmp)
        shp = os.path.join(tmp, "tis_poligonais.shp")
        print(f"Lendo {shp}...")
        gdf = gpd.read_file(shp, encoding="ISO-8859-1")

        for col in ["terrai_nom", "etnia_nome", "municipio_",
                    "fase_ti", "modalidade"]:
            if col in gdf.columns:
                gdf[col] = gdf[col].apply(fix_encoding)

        print(f"{len(gdf)} TIs. Simplificando geometria...")
        gdf["geometry"] = gdf["geometry"].simplify(
            SIMPLIFY_TOLERANCE_DEG, preserve_topology=True
        )

        features = []
        for _, r in gdf.iterrows():
            if r.geometry is None or r.geometry.is_empty:
                continue
            props = {
                "id": str(r["terrai_cod"]),
                "name": r["terrai_nom"],
                "peoples": r["etnia_nome"],
                "phase": r["fase_ti"],
                "modality": r["modalidade"],
                "uf": r["uf_sigla"],
                "municipality": r["municipio_"],
                "areaHa": float(r["superficie"])
                          if r["superficie"] not in (None, "") else None,
                "tier": "public",
                "sourceUrl": "https://www.gov.br/funai/pt-br/atuacao/terras-indigenas/geoprocessamento-e-mapas",
            }
            features.append({
                "type": "Feature",
                "properties": {k: v for k, v in props.items() if v is not None},
                "geometry": mapping(r.geometry),
            })

        out = {
            "type": "FeatureCollection",
            "name": "tis-funai",
            "metadata": {
                "title": "Terras Indígenas — FUNAI (polígonos)",
                "source_official": "https://geoserver.funai.gov.br/",
                "license": "Dados públicos — FUNAI",
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
