// ============================================================
// GAIA — Módulo: Unidades de Conservação
// Cada camada é um módulo isolado com a mesma interface:
//   register(map): adiciona a camada ao mapa
//   show(map):     torna visível
//   hide(map):     oculta
//   onClick(map, callback): handler de clique em feature
// ============================================================

import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';

const LAYER = LAYERS['conservation-units'];
const SOURCE_ID = 'src-conservation-units';
const FILL_LAYER_ID = 'lyr-conservation-units-fill';
const LINE_LAYER_ID = 'lyr-conservation-units-line';

// Resolvido relativo ao próprio módulo JS — funciona em qualquer subpath de deploy.
const DATA_URL = new URL('../../data/conservation-units-sample.geojson', import.meta.url).href;

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
        'fill-opacity': 0.25,
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
        'line-width': 1.5,
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
  map.on('mouseleave', FILL_LAYER_ID, () => { map.getCanvas().styl