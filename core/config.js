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
    description: '427 territórios oficiais do INCRA Sigef (nacional, 16+ estados).',
    source: { origin: 'INSA / INCRA', url: 'https://www.gov.br/insa/pt-br/centrais-de-conteudo/mapas',
      reference: 'Quilombos-SAB-INCRA — 2020-02-07', lastFetched: '2026-04-30', ingestionStatus: 'partial' },
    sensitivity: 'public', color: '#8B5A2B', visibleByDefault: false,
    module: '../layers/quilombolas.js',
    nameField: 'name', count: 427,
  },
  'quilombolas-palmares-pins': {
    id: 'quilombolas-palmares-pins', label: 'Quilombolas (Palmares — sem polígono)', icon: '📍',
    description: '769 comunidades certificadas pela Fundação Cultural Palmares que ainda não têm polígono no INCRA Sigef. Pin = aguardando titulação ou regularização espacial.',
    source: { origin: 'Fundação Cultural Palmares + INCRA (cross-check)',
      url: 'https://www.gov.br/palmares/pt-br/departamentos/protecao-preservacao-e-articulacao/certificacao-quilombola',
      reference: 'CRQs Palmares × INCRA Sigef — 2026-05', lastFetched: '2026-05-04', ingestionStatus: 'partial' },
    sensitivity: 'public', color: '#D9A441', visibleByDefault: false,
    module: '../layers/quilombolas-palmares.js',
    nameField: 'name', count: 769,
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
  'biomas': {
    id: 'biomas', label: 'Biomas brasileiros', icon: '🌎',
    description: '6 biomas continentais (Amazônia, Cerrado, Mata Atlântica, Caatinga, Pantanal, Pampa) — IBGE 1:250.000 (2019). Camada de contexto, renderizada abaixo das demais.',
    source: { origin: 'IBGE — Biomas (1:250.000)',
      url: 'https://www.ibge.gov.br/geociencias/informacoes-ambientais/vegetacao/15842-biomas.html',
      reference: 'lm_bioma_250 — 2019', lastFetched: '2026-05-05', ingestionStatus: 'official' },
    sensitivity: 'public', color: '#3A8C5A', visibleByDefault: false,
    module: '../layers/biomas.js',
    nameField: 'name', count: 6,
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

export const BASEMAPS = Object.freeze({
  map:       { id: 'map',       label: 'Mapa',     icon: '🗺️', style: OSM_STYLE },
  satellite: { id: 'satellite', label: 'Satélite', icon: '🛰️', style: SATELLITE_STYLE },
});

export const MAP = Object.freeze({
  initialCenter: [-50.0, -15.0],
  initialZoom: 4,
  minZoom: 3,
  maxZoom: 18,
  baseStyle: OSM_STYLE,
  defaultBasemap: 'map',
});
