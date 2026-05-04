// ============================================================
// GAIA — Config central
// ============================================================

export const APP = Object.freeze({
  name: 'GAIA',
  longName: 'Geospatial Atlas for Indigenous and Agroecological territories',
  tagline: 'Mapa vivo da conservação e restauração brasileira',
  version: '0.1.0-mvp',
  license: 'AGPL-3.0',
  org: 'Instituto Muvuka',
  contactEmail: 'gaia@muvuka.org',
});

export const LAYERS = Object.freeze({
  'conservation-units': {
    id: 'conservation-units', label: 'Unidades de Conservação', icon: '🌳',
    description: '2.741 UCs ativas (federais, estaduais e municipais) do CNUC 2024.02.',
    source: { origin: 'CNUC / MMA', url: 'https://dados.mma.gov.br/dataset/unidadesdeconservacao',
      reference: 'CNUC 2024.02', lastFetched: '2026-04-30', ingestionStatus: 'official' },
    sensitivity: 'public', color: '#2F9362', visibleByDefault: true,
    module: '../layers/conservation-units.js',
    nameField: 'name', count: 2741,
  },
  'indigenous-lands': {
    id: 'indigenous-lands', label: 'Terras Indígenas', icon: '🪶',
    description: '655 TIs em diferentes estágios de regularização (FUNAI / GeoServer oficial).',
    source: { origin: 'FUNAI', url: 'https://geoserver.funai.gov.br/',
      reference: 'tis_poligonais — 2023-09-05', lastFetched: '2026-04-30', ingestionStatus: 'official' },
    sensitivity: 'public', color: '#C68B47', visibleByDefault: false,
    module: '../layers/indigenous-lands.js',
    nameField: 'name', count: 655,
  },
  'quilombola-territories': {
    id: 'quilombola-territories', label: 'Territórios Quilombolas', icon: '✊🏿',
    description: '94 territórios do Semi-Árido (INSA/INCRA). Cobertura nacional pendente.',
    source: { origin: 'INSA / INCRA', url: 'https://www.gov.br/insa/pt-br/centrais-de-conteudo/mapas',
      reference: 'Quilombos-SAB-INCRA — 2020-02-07', lastFetched: '2026-04-30', ingestionStatus: 'partial' },
    sensitivity: 'public', color: '#8B5A2B', visibleByDefault: false,
    module: '../layers/quilombolas.js',
    nameField: 'name', count: 94,
  },
  'nascentes': {
    id: 'nascentes', label: 'Nascentes', icon: '💧',
    description: 'Nascentes de rios e riachos. Dado sensível.',
    source: { origin: 'ANA + dados primários', url: 'https://www.ana.gov.br/', ingestionStatus: 'pending' },
    sensitivity: 'aggregated', color: '#2F8FBE', visibleByDefault: false, module: null,
  },
  'threatened-species': {
    id: 'threatened-species', label: 'Espécies Ameaçadas', icon: '🦋',
    description: 'Polígonos coloridos pela categoria IUCN (CR/EN/VU/NT/LC).',
    source: { origin: 'IUCN Spatial Data + API v4 + GBIF', url: 'https://www.iucnredlist.org/',
      reference: '15 polígonos oficiais IUCN; demais via concave hull GBIF',
      lastFetched: '2026-04-30', ingestionStatus: 'official' },
    sensitivity: 'aggregated', color: '#D97706', visibleByDefault: false,
    module: '../layers/threatened-species.js',
    nameField: 'name', count: 845,
  },
  'mapbiomas-cover': {
    id: 'mapbiomas-cover', label: 'Cobertura e uso da terra', icon: '🌎',
    description: 'Coleção mais recente do MapBiomas (Brasil).',
    source: { origin: 'MapBiomas', url: 'https://mapbiomas.org/', ingestionStatus: 'pending' },
    sensitivity: 'public', color: '#8FB339', visibleByDefault: false, module: null,
  },
});

export const SENSITIVITY = Object.freeze({
  public: { label: 'Público', description: 'Geometria precisa, atributos integrais.', color: 'var(--gaia-tier-public)' },
  aggregated: { label: 'Agregado', description: 'Geometria agregada a célula de 1 km.', color: 'var(--gaia-tier-aggregated)' },
  restricted: { label: 'Restrito', description: 'Acesso a custodiantes verificados.', color: 'var(--gaia-tier-restricted)' },
});

// ====== BASEMAPS ======
const OSM_STYLE = {
  version: 8,
  sources: { 'osm': { type: 'raster',
    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png','https://b.tile.openstreetmap.org/{z}/{x}/{y}.png','https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256, maxzoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.92 } }],
};
const SATELLITE_STYLE = {
  version: 8,
  sources: { 'sat': { type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256, maxzoom: 19, attribution: 'Esri · World Imagery (Maxar, Earthstar)' } },
  layers: [{ id: 'sat', type: 'raster', source: 'sat' }],
};
const HYBRID_STYLE = {
  version: 8,
  sources: {
    'sat': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Esri · World Imagery' },
    'labels': { type: 'raster', tiles: ['https://stamen-tiles-a.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png','https://stamen-tiles-b.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png','https://stamen-tiles-c.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 18, attribution: '© Stamen Design / OSM' },
  },
  layers: [
    { id: 'sat', type: 'raster', source: 'sat' },
    { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.9 } },
  ],
};

export const BASEMAPS = Object.freeze({
  map:       { id: 'map',       label: 'Mapa',     icon: '🗺️', style: OSM_STYLE },
  satellite: { id: 'satellite', label: 'Satélite', icon: '🛰️', style: SATELLITE_STYLE },
  hybrid:    { id: 'hybrid',    label: 'Híbrido',  icon: '🌐', style: HYBRID_STYLE },
});

export const MAP = Object.freeze({
  initialCenter: [-50.0, -15.0],
  initialZoom: 4,
  minZoom: 3,
  maxZoom: 18,
  baseStyle: OSM_STYLE,
  defaultBasemap: 'map',
});
