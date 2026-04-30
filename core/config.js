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
  contactEmail: 'gaia@muvuka.org', // placeholder até definirmos
});

// Cada camada da plataforma é declarada aqui. Os módulos consomem
// este registro e renderizam toggles, legendas e fontes automaticamente.
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
    module: './modules/layers/conservation-units.js',
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
    module: './modules/layers/indigenous-lands.js',
  },
  'quilombola-territories': {
    id: 'quilombola-territories',
    label: 'Territórios Quilombolas',
    icon: '✊🏿',
    description: 'Territórios quilombolas reconhecidos por INCRA, Palmares e CONAC.',
    source: { origin: 'INCRA / Palmares / CONAC', url: 'https://www.gov.br/incra/', ingestionStatus: 'pending' },
    sensitivity: 'public',
    color: '#8B5A2B',
    visibleByDefault: false,
    module: null,
  },
  'nascentes': {
    id: 'nascentes',
    label: 'Nascentes',
    icon: '💧',
    description: 'Nascentes de rios e riachos. Dado sensível: ver Política de Dados Sensíveis.',
    source: { origin: 'ANA + dados primários colaborativos', url: 'https://www.ana.gov.br/', ingestionStatus: 'pending' },
    sensitivity: 'aggregated', // default — vide policies/dados-sensiveis.md
    color: '#2F8FBE',
    visibleByDefault: false,
    module: null,
  },
  'threatened-species': {
    id: 'threatened-species',
    label: 'Espécies Ameaçadas',
    icon: '🦋',
    description: 'Ocorrências de espécies ameaçadas de fauna e flora (IUCN + ICMBio).',
    source: { origin: 'IUCN Red List + ICMBio', url: 'https://www.iucnredlist.org/', ingestionStatus: 'pending' },
    sensitivity: 'aggregated',
    color: '#D97706',
    visibleByDefault: false,
    module: null,
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

// Tier de sensibilidade — referência para política de dados.
// Ver /policies/dados-sensiveis.md para a definição normativa.
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

// Configuração do mapa base.
export const MAP = Object.freeze({
  // Centro inicial — Brasil; o usuário pode ajustar via geolocalização.
  initialCenter: [-50.0, -15.0],
  initialZoom: 4,
  minZoom: 3,
  maxZoom: 18,
  // Estilo de basemap aberto (sem token), do MapLibre demo tiles.
  // Para produção, trocar por tile server próprio (ver docs/ROADMAP.md).
  baseStyle: 'https://demotiles.maplibre.org/style.json',
});
