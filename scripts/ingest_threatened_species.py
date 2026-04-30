#!/usr/bin/env python3
"""
GAIA — Ingestão de espécies ameaçadas brasileiras.

Estratégia: GBIF (api.gbif.org) é totalmente aberto e expõe ocorrências
georeferenciadas com a categoria IUCN como atributo. Calculamos um
concave hull dos pontos como aproximação do range de presença no Brasil.

A API IUCN Red List oficial entrega os polígonos de range com mais
precisão, mas exige registro com aprovação manual (~1-2 dias úteis).
Quando o registro for aprovado, este script pode ser substituído pela
ingestão direta dos shapefiles oficiais da IUCN.

Uso:
  pip install shapely
  python3 scripts/ingest_threatened_species.py
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

import shapely
from shapely.geometry import MultiPoint, mapping

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "threatened-species.geojson")
GBIF = "https://api.gbif.org/v1"

# Curadoria de 25 especies-bandeira ameacadas no Brasil.
SPECIES = [
    {"sci": "Panthera onca", "pt": "Onca-pintada", "group": "Mamiferos", "biome": "Amazonia, Cerrado, Pantanal, Mata Atlantica"},
    {"sci": "Leontopithecus rosalia", "pt": "Mico-leao-dourado", "group": "Mamiferos", "biome": "Mata Atlantica"},
    {"sci": "Tapirus terrestris", "pt": "Anta", "group": "Mamiferos", "biome": "Amazonia, Cerrado, Mata Atlantica"},
    {"sci": "Myrmecophaga tridactyla", "pt": "Tamandua-bandeira", "group": "Mamiferos", "biome": "Cerrado, Pantanal, Caatinga"},
    {"sci": "Pteronura brasiliensis", "pt": "Ariranha", "group": "Mamiferos", "biome": "Amazonia, Pantanal"},
    {"sci": "Trichechus inunguis", "pt": "Peixe-boi-da-Amazonia", "group": "Mamiferos", "biome": "Amazonia"},
    {"sci": "Trichechus manatus", "pt": "Peixe-boi-marinho", "group": "Mamiferos", "biome": "Marinho/Costeiro"},
    {"sci": "Bradypus torquatus", "pt": "Preguica-de-coleira", "group": "Mamiferos", "biome": "Mata Atlantica"},
    {"sci": "Brachyteles arachnoides", "pt": "Muriqui-do-sul", "group": "Mamiferos", "biome": "Mata Atlantica"},
    {"sci": "Sapajus xanthosternos", "pt": "Macaco-prego-do-peito-amarelo", "group": "Mamiferos", "biome": "Mata Atlantica"},
    {"sci": "Anodorhynchus hyacinthinus", "pt": "Arara-azul-grande", "group": "Aves", "biome": "Pantanal, Cerrado"},
    {"sci": "Crax blumenbachii", "pt": "Mutum-do-sudeste", "group": "Aves", "biome": "Mata Atlantica"},
    {"sci": "Mergus octosetaceus", "pt": "Pato-mergulhao", "group": "Aves", "biome": "Cerrado, Mata Atlantica"},
    {"sci": "Tinamus solitarius", "pt": "Macuco", "group": "Aves", "biome": "Mata Atlantica"},
    {"sci": "Guaruba guarouba", "pt": "Ararajuba", "group": "Aves", "biome": "Amazonia"},
    {"sci": "Caretta caretta", "pt": "Tartaruga-cabecuda", "group": "Repteis", "biome": "Marinho/Costeiro"},
    {"sci": "Eretmochelys imbricata", "pt": "Tartaruga-de-pente", "group": "Repteis", "biome": "Marinho/Costeiro"},
    {"sci": "Chelonia mydas", "pt": "Tartaruga-verde", "group": "Repteis", "biome": "Marinho/Costeiro"},
    {"sci": "Lepidochelys olivacea", "pt": "Tartaruga-oliva", "group": "Repteis", "biome": "Marinho/Costeiro"},
    {"sci": "Phyllomedusa bahiana", "pt": "Perereca-de-folha-da-bahia", "group": "Anfibios", "biome": "Caatinga, Mata Atlantica"},
    {"sci": "Araucaria angustifolia", "pt": "Araucaria", "group": "Flora", "biome": "Mata Atlantica"},
    {"sci": "Dalbergia nigra", "pt": "Jacaranda-da-bahia", "group": "Flora", "biome": "Mata Atlantica"},
    {"sci": "Paubrasilia echinata", "pt": "Pau-brasil", "group": "Flora", "biome": "Mata Atlantica"},
    {"sci": "Euterpe edulis", "pt": "Jucara", "group": "Flora", "biome": "Mata Atlantica"},
    {"sci": "Bertholletia excelsa", "pt": "Castanheira", "group": "Flora", "biome": "Amazonia"},
]


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "GAIA-Muvuka/0.1"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def get_taxon_key(sci_name):
    try:
        d = fetch_json(f"{GBIF}/species/match?name={urllib.parse.quote(sci_name)}")
        if d.get("matchType") in ("EXACT", "FUZZY"):
            return d.get("usageKey"), d.get("scientificName")
    except Exception:
        pass
    return None, None


def get_occurrences_br(taxon_key, limit=150):
    url = (f"{GBIF}/occurrence/search?taxonKey={taxon_key}&country=BR"
           f"&hasCoordinate=true&hasGeospatialIssue=false&limit={limit}")
    try:
        d = fetch_json(url)
    except Exception:
        return [], set()
    pts = []
    iucn = set()
    for r in d.get("results", []):
        lat, lon = r.get("decimalLatitude"), r.get("decimalLongitude")
        if lat is None or lon is None:
            continue
        if not (-35 <= lat <= 6 and -75 <= lon <= -33):
            continue
        pts.append((lon, lat))
        if r.get("iucnRedListCategory"):
            iucn.add(r["iucnRedListCategory"])
    return pts, iucn


def hull_for(pts):
    if len(pts) < 3:
        return None
    mp = MultiPoint(pts)
    if len(pts) < 5:
        return mp.buffer(0.25)
    try:
        h = shapely.concave_hull(mp, ratio=0.3)
        return h if h and not h.is_empty else mp.convex_hull
    except Exception:
        return mp.convex_hull


def process(spec):
    key, accepted = get_taxon_key(spec["sci"])
    if not key:
        return None
    pts, iucn = get_occurrences_br(key)
    if not pts:
        return None
    geom = hull_for(pts)
    if geom is None or geom.is_empty:
        return None
    geom = geom.simplify(0.05, preserve_topology=True)
    return {"spec": spec, "key": key, "accepted": accepted,
            "pts": pts, "iucn": iucn, "geom": geom}


def main():
    features = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        for fut in as_completed({ex.submit(process, s): s for s in SPECIES}):
            r = fut.result()
            if not r:
                continue
            features.append({
                "type": "Feature",
                "properties": {
                    "id": str(r["key"]),
                    "name": r["spec"]["pt"],
                    "scientificName": r["accepted"] or r["spec"]["sci"],
                    "group": r["spec"]["group"],
                    "habitat": r["spec"]["biome"],
                    "iucnCategory": sorted(r["iucn"])[0] if r["iucn"] else "NE",
                    "occurrences": len(r["pts"]),
                    "tier": "aggregated",
                    "sourceUrl": f"https://www.gbif.org/species/{r['key']}",
                },
                "geometry": mapping(r["geom"]),
            })
    out = {
        "type": "FeatureCollection",
        "name": "threatened-species-br",
        "metadata": {
            "title": "Especies ameacadas brasileiras (GBIF + IUCN category)",
            "method": "Concave hull dos pontos GBIF georeferenciados no bbox do Brasil.",
            "source_official": "https://www.gbif.org/",
            "license": "GBIF: CC-BY (cada provedor mantem sua licenca)",
            "ingestionStatus": "official",
            "scope": "25 especies-bandeira. Expansao completa requer IUCN Red List API (registro).",
            "totalFeatures": len(features),
            "crs": "EPSG:4326",
        },
        "features": features,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"SALVO {OUT} - {len(features)} especies, {os.path.getsize(OUT)/1024:.1f} KB")


if __name__ == "__main__":
    sys.exit(main())
