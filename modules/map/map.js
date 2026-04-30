// ============================================================
// GAIA — Módulo principal do mapa
// Inicializa MapLibre, registra camadas declaradas em /core/config.js,
// monta sidebar dinâmica e painel de detalhes ao clicar em feature.
// ============================================================

import { APP, LAYERS, MAP, SENSITIVITY } from '../../core/config.js';
import { t } from '../../core/i18n.js';
import { attachSearch } from '../ui/search.js';

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

const IUCN_LABELS = {
  EX: ['Extinta', '#000000'],
  EW: ['Extinta na Natureza', '#542344'],
  CR: ['Criticamente em Perigo', '#D81E05'],
  EN: ['Em Perigo', '#FC7F3F'],
  VU: ['Vulnerável', '#F9E814'],
  NT: ['Quase Ameaçada', '#CCE226'],
  LC: ['Pouco Preocupante', '#60C659'],
  DD: ['Dados Insuficientes', '#D1D1C6'],
  NE: ['Não Avaliada', '#A6A6A6'],
};
function renderIucn(cat) {
  const [label, color] = IUCN_LABELS[cat] || [cat || 'Não classificada', '#A6A6A6'];
  return `<span style="display:inline-flex;align-items:center;gap:6px;font-weight:600;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>${cat} — ${label}</span>`;
}

const TREND_LABELS = {
  Decreasing: ['↓ Diminuindo', '#D81E05'],
  Stable: ['→ Estável', '#FC7F3F'],
  Increasing: ['↑ Aumentando', '#60C659'],
  Unknown: ['? Desconhecida', '#A6A6A6'],
};
function renderTrend(t) {
  const [label, color] = TREND_LABELS[t] || [t, '#A6A6A6'];
  return `<span style="color:${color};font-weight:600;">${label}</span>`;
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

  const p = feature.properties;
  const rows = [];
  if (p.scientificName) rows.push(['Nome científico', `<em>${p.scientificName}</em>`]);
  if (p.iucnCategory) rows.push(['Categoria IUCN', renderIucn(p.iucnCategory)]);
  if (p.iucnYear) rows.push(['Avaliação IUCN', `${p.iucnYear}${p.iucnCriteria ? ' · critério ' + p.iucnCriteria : ''}`]);
  if (p.iucnPopulationTrend) rows.push(['Tendência populacional', renderTrend(p.iucnPopulationTrend)]);
  if (p.category) rows.push(['Categoria', p.category]);
  if (p.group) rows.push(['Grupo', p.group]);
  if (p.habitat) rows.push(['Habitat', p.habitat]);
  if (p.sphere) rows.push(['Esfera', p.sphere]);
  if (p.manager) rows.push(['Gestor', p.manager]);
  if (p.biome) rows.push(['Bioma', p.biome]);
  if (p.uf) rows.push(['UF', p.uf]);
  if (p.areaHa) rows.push(['Área', `${Number(p.areaHa).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha`]);
  if (p.decreeYear) rows.push(['Criada em', p.decreeYear]);
  if (p.peoples) rows.push(['Povos', p.peoples]);
  if (p.phase) rows.push(['Estágio', p.phase]);
  if (p.occurrences) rows.push(['Ocorrências GBIF', p.occurrences]);
  if (p.iucnThreats) {
    let threats = p.iucnThreats;
    if (typeof threats === 'string') { try { threats = JSON.parse(threats); } catch (_) { threats = [threats]; } }
    if (threats && threats.length) {
      rows.push(['Principais ameaças', `<ul style="margin:0;padding-left:18px;">${threats.slice(0,4).map(t => `<li>${t}</li>`).join('')}</ul>`]);
    }
  }
  rows.push([t('map.feature.sensitivity'), renderTier(feature.sensitivity)]);
  if (p.iucnUrl) {
    rows.push(['Avaliação oficial', `<a href="${p.iucnUrl}" target="_blank" rel="noopener">IUCN Red List ↗</a>`]);
  }
  if (p.sourceUrl) {
    rows.push([t('map.feature.source'), `<a href="${p.sourceUrl}" target="_blank" rel="noopener">Fonte ↗</a>`]);
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
  