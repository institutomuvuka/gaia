// ============================================================
// GAIA — Módulo: Terras Indígenas
// Mesma interface dos outros módulos de camada:
//   register(map), show(map), hide(map), onClick(map, cb), meta
// ============================================================

import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';

const LAYER = LAYERS['indigenous-lands'];
const SOURCE_ID = 'src-indigenous-lands';
const FILL_LAYER_ID = 'lyr-indigenous-lands-fill';
const LINE_LAYER_ID = 'lyr-indigenous-lands-line';

// Dataset oficial: 655 terras indígenas do GeoServer da FUNAI, geometrias simplificadas a ~500m.
const DATA_URL = new URL('../../data/indigenous-lands.geojson', import.meta.url).href;

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
        'fill-color': LAYER.color,
        // Diferencia o fill por estágio: regularizada mais opaca, em estudo mais translúcida.
        'fill-opacity': [
          'match',
          ['get', 'phase'],
          'Regularizada', 0.32,
          'Homologada', 0.28,
          'Declarada', 0.22,
          'Delimitada', 0.18,
          'Encaminhada RI', 0.14,
          'Em Estudo', 0.10,
          0.20,
        ],
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
        'line-color': LAYER.color,
        'line-width': 1.2,
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
