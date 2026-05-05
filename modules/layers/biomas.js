// ============================================================
// GAIA — Biomas brasileiros (IBGE 1:250.000)
// 6 biomas continentais como camada de contexto.
// Renderizado em fill com cor por bioma + opacidade baixa
// pra não competir visualmente com TIs/UCs/Quilombolas.
// ============================================================
import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';

const LAYER = LAYERS['biomas'];
const SOURCE_ID = 'src-biomas';
const FILL_LAYER_ID = 'lyr-biomas-fill';
const LINE_LAYER_ID = 'lyr-biomas-line';
const LABEL_LAYER_ID = 'lyr-biomas-label';
const DATA_URL = new URL('../../data/biomas.geojson', import.meta.url).href;

// Paleta oficial-ish (alinhada com IBGE/MapBiomas)
const COLOR_BY_BIOMA = {
  'Amazônia':       '#1F6B3F',  // verde floresta densa
  'Cerrado':        '#C8993B',  // ocre savana
  'Mata Atlântica': '#3A8C5A',  // verde médio
  'Caatinga':       '#A65A2C',  // marrom árido
  'Pantanal':       '#3FA0B8',  // azul-verde alagado
  'Pampa':          '#7CA858',  // verde claro pradaria
};

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

  // Expressão de cor por bioma
  const fillColorExpr = ['match', ['get', 'name'],
    'Amazônia', COLOR_BY_BIOMA['Amazônia'],
    'Cerrado', COLOR_BY_BIOMA['Cerrado'],
    'Mata Atlântica', COLOR_BY_BIOMA['Mata Atlântica'],
    'Caatinga', COLOR_BY_BIOMA['Caatinga'],
    'Pantanal', COLOR_BY_BIOMA['Pantanal'],
    'Pampa', COLOR_BY_BIOMA['Pampa'],
    '#999999',
  ];

  // Encontra a primeira camada de dados existente pra inserir o bioma ABAIXO
  // (assim TIs/UCs/Quilombolas ficam por cima do contexto bioma)
  const layers = map.getStyle().layers || [];
  const firstDataLayer = layers.find(l => l.id.startsWith('lyr-') && !l.id.startsWith('lyr-biomas'));
  const beforeId = firstDataLayer ? firstDataLayer.id : undefined;

  if (!map.getLayer(FILL_LAYER_ID)) map.addLayer({
    id: FILL_LAYER_ID, type: 'fill', source: SOURCE_ID,
    paint: { 'fill-color': fillColorExpr, 'fill-opacity': 0.18 },
    layout: { visibility },
  }, beforeId);

  if (!map.getLayer(LINE_LAYER_ID)) map.addLayer({
    id: LINE_LAYER_ID, type: 'line', source: SOURCE_ID,
    paint: { 'line-color': fillColorExpr, 'line-width': 1.2, 'line-opacity': 0.65 },
    layout: { visibility },
  }, beforeId);
}

export function show(map) {
  [FILL_LAYER_ID, LINE_LAYER_ID].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
  });
}
export function hide(map) {
  [FILL_LAYER_ID, LINE_LAYER_ID].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
  });
}

export function onClick(map, callback) {
  map.on('click', FILL_LAYER_ID, (e) => {
    if (!e.features || !e.features.length) return;
    callback({
      layerId: LAYER.id, label: LAYER.label, icon: LAYER.icon,
      sensitivity: LAYER.sensitivity,
      properties: e.features[0].properties, lngLat: e.lngLat,
    });
  });
  // Não muda cursor — bioma é contexto, não chamariz
}

export const meta = LAYER;
export const palette = COLOR_BY_BIOMA;
