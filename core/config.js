// ============================================================
// GAIA — Config central
// Toda decisão de fonte de dados, URL ou cor de camada vive aqui.
// Editar este arquivo é a forma normal de adicionar uma nova camada.
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
    id: 'conservation-units',
    label: 'Unidades de Conservação',
    icon: '🌳',
    description: '2.741 UCs ativas (federais, estaduais e municipais) do CNUC 2024.02.',
    source: {
      origin: 'CNUC / MMA',
      url: 'https://dados.mma.gov.br/dataset/unidadesdeconservacao',
      reference: 'CNUC 2024.02',
      lastFetched: '2026-04-30',
      ingestionStatus: 'official',
    },
    sensitivity: 'public',
    color: '#2F9362',
    visibleByDefault: true,
    module: '../layers/conservation-units.js',
  },
  'indigenous-lands': {
    id: 'indigenous-lands',
    label: 'Terras Indígenas',
    icon: '🪶',
    description: '655 TIs em diferentes estágios de regularização (FUNAI / GeoServer oficial).',
    source: {
      origin: 'FUNAI',
      url: 'https://geoserver.funai.gov.br/',
      reference: 'tis_poligonais — atualizado em 2023-09-05',
      lastFetched: '2026-04-30',
      ingestionStatus: 'official',
    },
    sensitivity: 'public',
    color: '#C68B47',
    visibleByDefault: false,
    module: '../layers/indigenous-lands.js',
  },
  'quilombola-territories': {
    id: 'quilombola-territories',
    label: 'Territórios Quilombolas',
    icon: '✊🏿',
    description: '94 territórios do Semi-Árido (INSA/INCRA). Cobertura nacional pendente — INCRA Sigef atrás de login.',
    source: {
      origin: 'INSA / INCRA',
      url: 'https://www.gov.br/insa/pt-br/centrais-de-conteudo/mapas',
      reference: 'Quilombos-SAB-INCRA — 2020-02-07',
      lastFetched: '2026-04-30',
      ingestionStatus: 'partial',
    },
    sensitivity: 'public',
    color: '#8B5A2B',
    visibleByDefault: false,
    module: '../layers/quilombolas.js',
  },
  'nascentes': {
    id: 'nascentes',
    label: 'Nascentes',
    icon: '💧',
    description: 'Nascentes de rios e riachos. Dado sensível: ver Política de Dados Sensíveis.',
    source: { origin: 'ANA + dados primários colaborativos', url: 'https://www.ana.gov.br/', ingestionStatus: 'pending' },
    sensitivity: 'aggregated',
    color: '#2F8FBE',
    visibleByDefault: false,
    module: null,
  },
  'threatened-species': {
    id: 'threatened-species',
    label: 'Espécies Ameaçadas',
    icon: '🦋',
    description: '25 espécies-bandeira. 15 com polígono oficial IUCN, 10 com concave hull GBIF.',
    source: {
      origin: 'IUCN Spatial Data + Red List API v4 + GBIF',
      url: 'https://www.iucnredlist.org/',
      reference: '15/25 polígonos oficiais IUCN.',
      lastFetched: '2026-04-30',
      ingestionStatus: 'official',
    },
    sensitivity: 'aggregated',
    color: '#D97706',
    visibleByDefault: false,
    module: '../layers/threatened-species.js',
  },
  'mapbiomas-cover': {
    id: 'mapbiomas-cover',
    label: 'Cobertura e uso da terra',
    icon: '🌎',
    description: 'Coleção mais recente do MapBiomas (Brasil).',
    source: { origin: 'MapBiomas', url: 'https://mapbiomas.org/', ingestionStatus: 'pending' },
    sensitivity: 'public',
    color: '#8FB339',
    visibleByDefault: false,
    module: null,
  },
});

export const SENSITIVITY = Object.freeze({
  public: {
    label: 'Público',
    description: 'Geometria precisa, atributos integrais. Disponível a qualquer pessoa.',
    color: 'var(--gaia-tier-public)',
  },
  aggregated: {
    label: 'Agregado',
    description: 'Geometria agregada a célula de 1 km (H3). Atributos sem identificação de custodiante.',
    color: 'var(--gaia-tier-aggregated)',
  },
  restricted: {
    label: 'Restrito',
    description: 'Acesso somente a custodiantes verificados e a parceiros formais.',
    color: 'var(--gaia-tier-restricted)',
  },
});

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { id: 'osm-raster', type: 'raster', source: 'osm-raster', paint: { 'raster-opacity': 0.9 } },
  ],
};

export const MAP = Object.freeze({
  initialCenter: [-50.0, -15.0],
  initialZoom: 4,
  minZoom: 3,
  maxZoom: 18,
  baseStyle: OSM_RASTER_STYLE,
});
