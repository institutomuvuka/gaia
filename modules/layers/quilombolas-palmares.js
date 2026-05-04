// ============================================================
// GAIA — Quilombolas Palmares (pins certificados sem polígono)
// 769 comunidades certificadas pela Fundação Cultural Palmares
// que NÃO constam na base de polígonos do INCRA Sigef.
// Renderizado como pins (Point) para diferenciar visualmente
// dos polígonos titulados; clique abre painel com dados de
// certificação Palmares + processo INCRA pendente.
// ============================================================
import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';

const LAYER = LAYERS['quilombolas-palmares-pins'];
const SOURCE_ID = 'src-quilombolas-palmares';
const PIN_LAYER_ID = 'lyr-quilombolas-palmares-pin';
const HALO_LAYER_ID = 'lyr-quilombolas-palmares-halo';
const DATA_URL = new URL('../../data/quilombolas-palmares-pins.geojson', import.meta.url).href;

let cachedData = null;
async function loadData() {
  if (cachedData) return cachedData;
  cachedData = await getJSON(DATA_URL);
  return cachedData;
}

export async function register(map) {
  const data = await loadData();
  if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, { type: 'geojson', data });
  const visibility = LAYER.visibleByDefault ? 'visible' : 'none';

  // Halo branco — destaca o pin sobre qualquer basemap (osm ou satélite)
  if (!map.getLayer(HALO_LAYER_ID)) map.addLayer({
    id: HALO_LAYER_ID, type: 'circle', source: SOURCE_ID,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4.5, 8, 6, 12, 8],
      'circle-color': '#FFFFFF',
      'circle-opacity': 0.9,
      'circle-stroke-width': 0,
    },
    layout: { visibility },
  });

  // Pin amarelo-âmbar com contorno marrom = "polígono pendente"
  // Cor distinta do marrom sólido do INCRA pra deixar claro o status
  if (!map.getLayer(PIN_LAYER_ID)) map.addLayer({
    id: PIN_LAYER_ID, type: 'circle', source: SOURCE_ID,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3, 8, 4.5, 12, 6.5],
      'circle-color': '#D9A441',
      'circle-stroke-color': '#3A2410',
      'circle-stroke-width': 1.2,
      'circle-opacity': 0.95,
    },
    layout: { visibility },
  });
}

export function show(map) {
  [HALO_LAYER_ID, PIN_LAYER_ID].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
  });
}
export function hide(map) {
  [HALO_LAYER_ID, PIN_LAYER_ID].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
  });
}

export function onClick(map, callback) {
  map.on('click', PIN_LAYER_ID, (e) => {
    if (!e.features || !e.features.length) return;
    callback({
      layerId: LAYER.id,
      label: LAYER.label,
      icon: LAYER.icon,
      sensitivity: LAYER.sensitivity,
      properties: e.features[0].properties,
      lngLat: e.lngLat,
    });
  });
  map.on('mouseenter', PIN_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', PIN_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });
}

export const meta = LAYER;
