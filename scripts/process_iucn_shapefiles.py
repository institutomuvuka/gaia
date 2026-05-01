#!/usr/bin/env python3
"""
GAIA — Substitui as geometrias do data/threatened-species.geojson pelos
polígonos oficiais da IUCN Red List Spatial Data.

Espera que os ZIPs originais da IUCN estejam em incoming/. Filtra apenas
as 25 espécies já cadastradas, dissolve subpopulações em uma MultiPolygon
por espécie, simplifica e atualiza o GeoJSON sem perder a metadata
enriquecida pela API v4 (categoria, citação, ameaças, etc).

Os ZIPs vêm em vários grupos taxonômicos. Este script trata mamíferos
(freshwater, terrestrial, marine) e anfíbios. Para grupos adicionais
(répteis-tartarugas, plantas-árvores, peixes), use a mesma estrutura.

Uso:
  pip install geopandas
  # coloque os ZIPs em incoming/
  python3 scripts/process_iucn_shapefiles.py
"""
import json
import os
import sys
import time

import geopandas as gpd
from shapely.geometry import mapping
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEOJSON = os.path.join(ROOT, "data", "threatened-species.geojson")
INCOMING = os.path.join(ROOT, "incoming")

# Mapa: bloco lógico → (zip dentro de incoming/, .shp interno, espécies a procurar)
BLOCKS = [
    ("freshwater_mammals",
     "MAMMALS_FRESHWATER.zip", "MAMMALS_FRESHWATER.shp",
     ["Trichechus inunguis", "Trichechus manatus",
      "Tapirus terrestris", "Pteronura brasiliensis"]),
    ("terrestrial_mammals",
     "MAMMALS_TERRESTRIAL_ONLY.zip", "MAMMALS_TERRESTRIAL_ONLY.shp",
     ["Panthera onca", "Leontopithecus rosalia", "Myrmecophaga tridactyla",
      "Bradypus torquatus", "Brachyteles arachnoides", "Sapajus xanthosternos"]),
    ("amphibians_part2",
     "AMPHIBIANS.zip", "AMPHIBIANS_PART2.shp",
     ["Phyllomedusa bahiana"]),
    # adicionar aqui quando chegar:
    # ("turtles", "REPTILES_TURTLES.zip", "TURTLES.shp",
    #  ["Caretta caretta","Eretmochelys imbricata","Chelonia mydas","Lepidochelys olivacea"]),
    # ("trees", "PLANTS_TREES.zip", "TREES_PART_X.shp",
    #  ["Araucaria angustifolia","Bertholletia excelsa","Paubrasilia echinata",
    #   "Dalbergia nigra","Euterpe edulis"]),
]


def fetch_block(zip_name, shp_inside, species_list):
    where = ("sci_name IN (" + ",".join(f"'{s}'" for s in species_list) +
             ") AND presence = 1 AND origin IN (1, 2)")
    url = f"/vsizip/{INCOMING}/{zip_name}/{shp_inside}"
    if not os.path.exists(os.path.join(INCOMING, zip_name)):
        print(f"  skip ({zip_name} ausente em incoming/)")
        return gpd.GeoDataFrame()
    t0 = time.time()
    print(f"  reading {zip_name}/{shp_inside} ... ", end="", flush=True)
    try:
        g = gpd.read_file(url, where=where,
                          columns=["sci_name", "category", "geometry"])
    except Exception as e:
        print(f"ERR {e}")
        return gpd.GeoDataFrame()
    print(f"{len(g)} rows in {time.time()-t0:.1f}s")
    return g


def basename(sci):
    return " ".join(sci.split()[:2])


def main():
    with open(GEOJSON, encoding="utf-8") as f:
        data = json.load(f)
    by_idx = {basename(ft["properties"]["scientificName"]): i
              for i, ft in enumerate(data["features"])}

    all_polys = {}
    for label, zip_name, shp_inside, species in BLOCKS:
        print(f"\n[{label}]")
        g = fetch_block(zip_name, shp_inside, species)
        if len(g) == 0:
            continue
        for sci, group in g.groupby("sci_name"):
            geom = unary_union(list(group.geometry)).simplify(
                0.005, preserve_topology=True)
            if sci in all_polys:
                continue
            all_polys[sci] = geom
            print(f"    {sci:35s}  {group.iloc[0].category}  "
                  f"{geom.geom_type}  parts={len(group)}")

    updated = []
    for sci, geom in all_polys.items():
        idx = by_idx.get(sci)
        if idx is None:
            print(f"  ! {sci} não está no GeoJSON")
            continue
        data["features"][idx]["geometry"] = mapping(geom)
        props = data["features"][idx]["properties"]
        props["geometrySource"] = "iucn-official"
        props["geometryNote"] = ("Polígono oficial IUCN Red List Spatial Data — "
                                 "presença extant, origem nativa/reintroduzida.")
        updated.append(sci)

    md = data.setdefault("metadata", {})
    md["geometrySource"] = ("mixed: iucn-official onde disponível, "
                            "gbif-concave-hull como fallback")
    md["officialPolygons"] = sorted(set((md.get("officialPolygons") or []) + updated))
    md["officialCount"] = len(md["officialPolygons"])

    with open(GEOJSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n=== {len(updated)} polígonos substituídos por IUCN-oficial nesta rodada ===")
    print(f"Total de polígonos oficiais agora: {md['officialCount']}")
    print(f"Tamanho do GeoJSON: {os.path.getsize(GEOJSON)/1024:.1f} KB")


if __name__ == "__main__":
    sys.exit(main())
