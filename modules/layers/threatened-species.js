// ============================================================
// GAIA — Módulo: Espécies ameaçadas
// Polígonos de presença derivados de ocorrências GBIF, coloridos
// pela categoria IUCN (CR/EN/VU/NT/LC). Cada feature expõe nome
// popular, nome científico, grupo, habitat declarado e categoria.
// ============================================================

import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';

const LAYER = LAYERS['threatened-species'];
const SOURCE_ID = 'src-threatened-species';
const FILL_LAYER_ID = 'lyr-threatened-species-fill';
const LINE_LAYER_ID = 'lyr-threatened-species-line';

// 25 espécies-bandeira ameaçadas, polígonos derivados de ocorrências GBIF.
const DATA_URL = new URL('../../data/threatened-species.geojson', import.meta.url).href;

// Cores da categoria IUCN — convenção da própria IUCN (Red List).
const IUCN_COLORS = {
  EX: '#000000', // Extinct
  EW: '#542344', // Extinct in the Wild
  CR: '#D81E05', // Critically Endangered
  EN: '#FC7F3F', // Endangered
  VU: '#F9E814', // Vulnerable
  NT: '#CCE226', // Near Threatened
  LC: '#60C659', // Least Concern
  DD: '#D1D1C6', // Data Deficient
  NE: '#A6A6A6', // Not Evaluated
};

let cachedData = null;

async function loadData() {
  if (cachedData) return cachedData;
  cachedData = await getJSON(DATA_URL);
  return cachedData;
}

export async function register(map) {
  const data = await loadData();

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: 'geojson', data });
  }

  if (!map.getLayer(FILL_LAYER_ID)) {
    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': [
          'match',
          ['get', 'iucnCategory'],
          'EX', IUCN_COLORS.EX,
          'EW', IUCN_COLORS.EW,
          'CR', IUCN_COLORS.CR,
          'EN', IUCN_COLORS.EN,
          'VU', IUCN_COLORS.VU,
          'NT', IUCN_COLORS.NT,
          'LC', IUCN_COLORS.LC,
          'DD', IUCN_COLORS.DD,
          IUCN_COLORS.NE,
        ],
        'fill-opacity': 0.18,
      },
      layout: { visibility: LAYER.visibleByDefault ? 'visible' : 'none' },
    });
  }

  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': [
          'match',
          ['get', 'iucnCategory'],
          'CR', IUCN_COLORS.CR,
          'EN', IUCN_COLORS.EN,
          'VU', IUCN_COLORS.VU,
          'NT', IUCN_COLORS.NT,
          'LC', IUCN_COLORS.LC,
          IUCN_COLORS.NE,
        ],
        'line-width': 1.2,
        'line-opacity': 0.8,
      },
      layout: { visibility: LAYER.visibleByDefault ? 'visible' : 'none' },
    });
  }

  return { sourceId: SOURCE_ID, fillId: FILL_LAYER_ID, lineId: LINE_LAYER_ID };
}

export function show(map) {
  if (map.getLayer(FILL_LAYER_ID)) map.setLayoutProperty(FILL_LAYER_ID, 'visibility', 'visible');
  if (map.getLayer(LINE_LAYER_ID)) map.setLayoutProperty(LINE_LAYER_ID, 'visibility', 'visible');
}

export function hide(map) {
  if (map.getLayer(FILL_LAYER_ID)) map.setLayoutProperty(FILL_LAYER_ID, 'visibility', 'none');
  if (map.getLayer(LINE_LAYER_ID)) map.setLayoutProperty(LINE_LAYER_ID, 'visibility', 'none');
}

export function onClick(map, callback) {
  map.on('click', FILL_LAYER_ID, (e) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    callback({
      layerId: LAYER.id,
      label: LAYER.label,
      icon: LAYER.icon,
      sensitivity: LAYER.sensitivity,
      properties: feature.properties,
      lngLat: e.lngLat,
    });
  });

  map.on('mouseenter', FILL_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', FILL_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });
}

export const meta = LAYER;
