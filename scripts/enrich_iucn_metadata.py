#!/usr/bin/env python3
"""
GAIA — Enriquece data/threatened-species.geojson com metadata oficial
da IUCN Red List API v4 (api.iucnredlist.org/api/v4).

A API v4 NÃO entrega range polygons (esses requerem o pedido separado
de Spatial Data Download em iucnredlist.org/resources/spatial-data-download).
Esta etapa adiciona às features existentes a categoria oficial mais
recente, ano da avaliação, citação, tendência populacional, ameaças
e ações de conservação.

Uso:
  IUCN_TOKEN=seu-token python3 scripts/enrich_iucn_metadata.py
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

GEOJSON = os.path.join(os.path.dirname(__file__), "..", "data",
                       "threatened-species.geojson")
TOKEN = os.environ.get("IUCN_TOKEN", "")
BASE = "https://api.iucnredlist.org/api/v4"


def get(path):
    if not TOKEN:
        raise RuntimeError("Set IUCN_TOKEN env variable.")
    req = urllib.request.Request(
        BASE + path,
        headers={"Authorization": f"Bearer {TOKEN}",
                 "User-Agent": "GAIA-Muvuka/0.1"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def fetch_metadata(scientific_name):
    parts = scientific_name.split()
    if len(parts) < 2:
        return None
    genus, species = parts[0], parts[1]
    try:
        t = get(f"/taxa/scientific_name?genus_name={urllib.parse.quote(genus)}"
                f"&species_name={urllib.parse.quote(species)}")
    except Exception:
        return None

    sis_id = t.get("taxon", {}).get("sis_id")
    if not sis_id:
        return None
    latest_id = year = None
    for a in t.get("assessments", []):
        if a.get("latest"):
            latest_id = a.get("assessment_id")
            year = a.get("year_published")
            break
    if not latest_id:
        return None

    try:
        a = get(f"/assessment/{latest_id}")
    except Exception:
        return None

    cat = a.get("red_list_category", {})
    threats = [thr.get("description", {}).get("en")
               for thr in (a.get("threats") or [])
               if thr.get("description", {}).get("en")]
    actions = [act.get("description", {}).get("en")
               for act in (a.get("conservation_actions") or [])
               if act.get("description", {}).get("en")]
    habitats = [h.get("description", {}).get("en")
                for h in (a.get("habitats") or [])
                if h.get("description", {}).get("en")]
    locations = [loc.get("description", {}).get("en")
                 for loc in (a.get("locations") or [])
                 if loc.get("description", {}).get("en")]

    return {
        "iucnSisId": sis_id,
        "iucnAssessmentId": latest_id,
        "iucnCategoryOfficial": cat.get("code"),
        "iucnCategoryLabel": cat.get("description", {}).get("en"),
        "iucnYear": year,
        "iucnCriteria": a.get("criteria"),
        "iucnPopulationTrend": (a.get("population_trend", {}) or {})
                                .get("description", {}).get("en"),
        "iucnCitation": a.get("citation"),
        "iucnUrl": a.get("url"),
        "iucnThreats": threats[:5],
        "iucnActions": actions[:5],
        "iucnHabitats": habitats[:5],
        "iucnLocations": locations[:30],
    }


def main():
    with open(GEOJSON, encoding="utf-8") as f:
        data = json.load(f)

    sci_to_idx = {f["properties"]["scientificName"]: i
                  for i, f in enumerate(data["features"])}
    print(f"Enriching {len(sci_to_idx)} species via IUCN v4...")

    results = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(fetch_metadata, sci): sci for sci in sci_to_idx}
        for fut in as_completed(futs):
            sci = futs[fut]
            try:
                meta = fut.result()
            except Exception as e:
                print(f"  FAIL {sci}: {e}"); continue
            if not meta:
                print(f"  no data {sci}"); continue
            results[sci] = meta
            print(f"  ok   {sci:32s} {meta['iucnCategoryOfficial']} "
                  f"({meta['iucnYear']}) trend={meta['iucnPopulationTrend']}")

    for sci, meta in results.items():
        idx = sci_to_idx[sci]
        props = data["features"][idx]["properties"]
        props.update(meta)
        if meta.get("iucnCategoryOfficial"):
            props["iucnCategory"] = meta["iucnCategoryOfficial"]

    md = data.setdefault("metadata", {})
    md["enrichedWith"] = "IUCN Red List API v4"
    md["enrichedAt"] = "2026-04-30"

    with open(GEOJSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\nSaved {GEOJSON} ({os.path.getsize(GEOJSON)/1024:.1f} KB)")


if __name__ == "__main__":
    sys.exit(main())
