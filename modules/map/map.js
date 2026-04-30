// ============================================================
// GAIA — Módulo principal do mapa
// Inicializa MapLibre, registra camadas declaradas em /core/config.js,
// monta sidebar dinâmica e painel de detalhes ao clicar em feature.
// ============================================================

import { APP, LAYERS, MAP, SENSITIVITY } from '../../core/config.js';
import { t } from '../../core/i18n.js';

const layerModules = new Map(); // layerId -> module exports
let activeMap = null;

/**
 * Carrega dinamicamente o módulo JS de uma camada.
 * Cada camada vive em /modules/layers/<id>.js e exporta a mesma interface.
 */
async function loadLayerModule(layerDef) {
  if (!layerDef.module) return null;
  if (layerModules.has(layerDef.id)) return layerModules.get(layerDef.id);
  try {
    const mod = await import(layerDef.module);
    layerModules.set(layerDef.id, mod);
    return mod;
  } catch (err) {
    console.error(`Falha ao carregar módulo ${layerDef.id}:`, err);
    return null;
  }
}

function renderTier(tier) {
  const meta = SENSITIVITY[tier] || SENSITIVITY.public;
  return `<span class="gaia-tier gaia-tier--${tier}"><span class="gaia-tier__dot"></span>${meta.label}</span>`;
}

function renderSidebar(onToggle) {
  const list = document.getElementById('layer-list');
  list.innerHTML = '';

  Object.values(LAYERS).forEach((layer) => {
    const isAvailable = !!layer.module;
    const li = document.createElement('li');
    li.className = `gaia-layer-item ${isAvailable ? '' : 'gaia-layer-item--disabled'}`;
    li.innerHTML = `
      <input
        type="checkbox"
        class="gaia-layer-item__check"
        id="toggle-${layer.id}"
        ${layer.visibleByDefault ? 'checked' : ''}
        ${isAvailable ? '' : 'disabled'}
        aria-label="Alternar camada ${layer.label}"
      />
      <span class="gaia-layer-item__icon" aria-hidden="true">${layer.icon}</span>
      <div class="gaia-layer-item__body">
        <label for="toggle-${layer.id}" class="gaia-layer-item__label">${layer.label}</label>
        <div class="gaia-layer-item__source">${layer.source.origin}</div>
        ${renderTier(layer.sensitivity)}
        ${isAvailable ? '' : '<span class="gaia-layer-item__pending">Em breve</span>'}
      </div>
    `;
    list.appendChild(li);

    if (isAvailable) {
      const checkbox = li.querySelector('input');
      checkbox.addEventListener('change', () => onToggle(layer.id, checkbox.checked));
    }
  });
}

function showFeaturePanel(feature) {
  const panel = document.getElementById('feature-panel');
  const titleEl = document.getElementById('feature-panel-title');
  const nameEl = document.getElementById('feature-panel-name');
  const body = document.getElementById('feature-panel-body');

  titleEl.innerHTML = `<span aria-hidden="true">${feature.icon}</span> ${feature.label}`;
  nameEl.textContent = feature.properties.name || feature.properties.id || 'Sem nome';

  const rows = [];
  if (feature.properties.category) rows.push(['Categoria', feature.properties.category]);
  if (feature.properties.manager) rows.push(['Gestor', feature.properties.manager]);
  if (feature.properties.biome) rows.push(['Bioma', feature.properties.biome]);
  if (feature.properties.uf) rows.push(['UF', feature.properties.uf]);
  if (feature.properties.areaHa) rows.push(['Área', `${feature.properties.areaHa.toLocaleString('pt-BR')} ha`]);
  if (feature.properties.decreeYear) rows.push(['Criada em', feature.properties.decreeYear]);
  rows.push([t('map.feature.sensitivity'), renderTier(feature.sensitivity)]);
  if (feature.properties.sourceUrl) {
    rows.push([t('map.feature.source'), `<a href="${feature.properties.sourceUrl}" target="_blank" rel="noopener">Fonte oficial ↗</a>`]);
  }

  body.innerHTML = rows
    .map(([k, v]) => `<dl class="gaia-feature-panel__row"><dt>${k}</dt><dd>${v}</dd></dl>`)
    .join('');

  panel.classList.add('is-open');
}

function closeFeaturePanel() {
  document.getElementById('feature-panel').classList.remove('is-open');
}

function toast(message, ms = 3000) {
  const existing = document.querySelector('.gaia-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'gaia-toast';
  el.textContent = message;
  document.querySelector('.gaia-map-canvas').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

async function bootstrap() {
  document.getElementById('app-name').textContent = APP.name;
  document.getElementById('app-tagline').textContent = APP.tagline;

  const map = new maplibregl.Map({
    container: 'map',
    style: MAP.baseStyle,
    center: MAP.initialCenter,
    zoom: MAP.initialZoom,
    minZoom: MAP.minZoom,
    maxZoom: MAP.maxZoom,
  });
  activeMap = map;

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

  map.on('load', async () => {
    // Registra todas as camadas declaradas que tenham módulo implementado.
    for (const layer of Object.values(LAYERS)) {
      if (!layer.module) continue;
      const mod = await loadLayerModule(layer);
      if (!mod) {
        toast(`${t('error.loadLayer')} (${layer.label})`);
        continue;
      }
      try {
        await mod.register(map);
        if (mod.onClick) mod.onClick(map, showFeaturePanel);
      } catch (err) {
        console.error(`Erro ao registrar ${layer.id}:`, err);
        toast(`${t('error.loadLayer')} (${layer.label})`);
      }
    }

    // Centraliza no estado da Bahia para visualizar a amostra inicial.
    map.flyTo({ center: [-39.5, -14.5], zoom: 7, duration: 1500 });

    toast('Camada carregada: Unidades de Conservação (amostra)');
  });

  // Monta a sidebar e conecta toggles.
  renderSidebar(async (layerId, isOn) => {
    const mod = layerModules.get(layerId);
    if (!mod) return;
    if (isOn) mod.show(map); else mod.hide(map);
  });

  document.getElementById('feature-panel-close').addEventListener('click', closeFeaturePanel);

  // Busca por município (placeholder — implementaremos geocoding na S6).
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      toast('Busca por município chegará na Semana 6 (sprint S6).');
    }
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
