// ============================================================
// GAIA — i18n minimalista
// Strings centralizadas para evitar hardcode no HTML/JS.
// Default pt-BR; en-US a ser adicionado em fase posterior.
// ============================================================

const dictionary = {
  'pt-BR': {
    'app.cta.openMap': 'Abrir o mapa',
    'app.cta.contribute': 'Como contribuir',
    'app.cta.about': 'Sobre o GAIA',
    'map.layers': 'Camadas',
    'map.search.placeholder': 'Buscar município...',
    'map.feature.source': 'Fonte',
    'map.feature.sensitivity': 'Sensibilidade',
    'map.feature.area': 'Área',
    'tier.public': 'Público',
    'tier.aggregated': 'Agregado',
    'tier.restricted': 'Restrito',
    'error.loadLayer': 'Não foi possível carregar a camada.',
  },
};

let currentLocale = 'pt-BR';

export function setLocale(locale) {
  if (dictionary[locale]) currentLocale = locale;
}

export function t(key, fallback) {
  return dictionary[currentLocale]?.[key] ?? fallback ?? key;
}
