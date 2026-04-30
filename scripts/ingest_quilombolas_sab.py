#!/usr/bin/env python3
# ============================================================
# GAIA — Pipeline de ingestão dos territórios quilombolas (parcial)
#
# Fonte: INSA (Instituto Nacional do Semiárido) republica o shapefile
# de quilombos certificados pelo INCRA. Cobertura: Semi-Árido Brasileiro.
#
# Limitação conhecida: a base completa nacional do INCRA (Sigef) está
# atrás de login gov.br e não é diretamente baixável via WFS público.
# Quando isso for resolvido, este script deve ser substituído pela
# ingestão direta do INCRA Sigef.
#
# Uso:
#   pip install geopandas
#   python3 scripts/ingest_quilombolas_sab.py
# ============================================================

import json
import os
import sys
import tempfile
import urllib.request
import zipfile

import geopandas as gpd
from shapely.geometry import mapping

URL = "https://www.gov.br/insa/pt-br/centrais-de-conteudo/mapas/mapas-em-shapefile/quilombos-incra.zip/@@download/file"
SIMPLIFY_TOLERANCE_DEG = 0.002
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "quilombolas.geojson")


def fix_encoding(s):
    if not isinstance(s, str):
        return s
    try:
        return s.encode("latin1").decode("utf-8")
    except Exception:
        return s


def main():
    with tempfile.TemporaryDirectory() as tmp:
        zip_path = os.path.join(tmp, "quilombos.zip")
        print(f"Baixando {URL[:80]}...")
        urllib.request.urlretrieve(URL, zip_path)

        with zipfile.ZipFile(zip_path) as z:
            z.extractall(tmp)

        # Localizar o .shp dentro do zip extraído.
        shp = None
        for root, _, files in os.walk(tmp):
            for f in files:
                if f.endswith(".shp"):
                    shp = os.path.join(root, f)
                    break
        if not shp:
            print("ERRO: shapefile não encontrado no zip", file=sys.stderr)
            sys.exit(1)

        print(f"Lendo {shp}...")
        gdf = gpd.read_file(shp, encoding="ISO-8859-1")

        for col in ["name", "source", "category_n"]:
            if col in gdf.columns:
                gdf[col] = gdf[col].apply(fix_encoding)

        print(f"{len(gdf)} territórios. Simplificando geometria...")
        gdf["geometry"] = gdf["geometry"].simplify(
            SIMPLIFY_TOLERANCE_DEG, preserve_topology=True
        )

        features = []
        for _, r in gdf.iterrows():
            if r.geometry is None or r.geometry.is_empty:
                continue
            props = {
                "id": str(r["id"]),
                "name": r["name"],
                "category": r["category_n"],
                "origin": r["source"],
                "areaHa": float(r["area_ha"])
                          if r["area_ha"] not in (None, "") else None,
                "tier": "public",
                "sourceUrl": "https://www.gov.br/insa/pt-br/centrais-de-conteudo/mapas",
            }
            features.append({
                "type": "Feature",
                "properties": {k: v for k, v in props.items() if v is not None},
                "geometry": mapping(r.geometry),
            })

        out = {
            "type": "FeatureCollection",
            "name": "quilombolas-sab-incra",
            "metadata": {
                "title": "Territórios Quilombolas — Semi-Árido (INSA / INCRA)",
                "source_official": "https://www.gov.br/insa/pt-br/centrais-de-conteudo/mapas",
                "license": "Dados públicos — INCRA via INSA",
                "scope": "PARCIAL — apenas Semi-Árido Brasileiro. Cobertura nacional pendente do INCRA Sigef.",
                "simplification": f"Douglas-Peucker tolerance {SIMPLIFY_TOLERANCE_DEG}°",
                "crs": "EPSG:4326",
                "ingestionStatus": "partial",
                "totalFeatures": len(features),
            },
            "features": features,
        }

        os.makedirs(os.path.dirname(OUT), exist_ok=True)
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"Salvo em {OUT} — {len(features)} features, "
              f"{os.path.getsize(OUT) / 1024:.1f} KB")


if __name__ == "__main__":
    sys.exit(main())
