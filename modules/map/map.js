import { APP, LAYERS, MAP, SENSITIVITY, BASEMAPS } from '../../core/config.js';
import { t } from '../../core/i18n.js';
import { attachSearch } from '../ui/search.js';

const layerModules = new Map();
const layerData = new Map();
const layerMode = new Map();
const layerExpanded = new Set();
const hookedLayers = new Set();  // tracks which layer ids have onClick handler attached
let mapInstance = null;
let currentBasemap = MAP.defaultBasemap;
let globalPinMode = false;  // toggle global

async function loadLayerModule(def) {
  if (!def.module) return null;
  if (layerModules.has(def.id)) return layerModules.get(def.id);
  try { const mod = await import(def.module); layerModules.set(def.id, mod); return mod; }
  catch (err) { console.error(`Falha ao carregar ${def.id}:`, err); return null; }
}

function renderTier(tier) {
  const meta = SENSITIVITY[tier] || SENSITIVITY.public;
  return `<span class="gaia-tier gaia-tier--${tier}"><span class="gaia-tier__dot"></span>${meta.label}</span>`;
}

const IUCN_LABELS = { EX: ['Extinta','#000'], EW: ['Extinta na Natureza','#542344'],
  CR: ['Criticamente em Perigo','#B71C1C'], EN: ['Em Perigo','#E65100'],
  VU: ['Vulnerável','#F9A825'], NT: ['Quase Ameaçada','#9E9D24'],
  LC: ['Pouco Preocupante','#388E3C'], DD: ['Dados Insuficientes','#9E9E9E'], NE: ['Não Avaliada','#757575'] };
function renderIucn(cat) {
  const [label, color] = IUCN_LABELS[cat] || [cat || 'NA','#757575'];
  return `<span style="display:inline-flex;align-items:center;gap:6px;font-weight:600;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>${cat} — ${label}</span>`;
}
const TREND_LABELS = { Decreasing: ['↓ Diminuindo','#B71C1C'], Stable: ['→ Estável','#E65100'],
  Increasing: ['↑ Aumentando','#388E3C'], Unknown: ['? Desconhecida','#9E9E9E'] };
function renderTrend(tr) { const [label, color] = TREND_LABELS[tr] || [tr,'#9E9E9E'];
  return `<span style="color:${color};font-weight:600;">${label}</span>`; }

// ============== BASEMAP TOGGLE ==============
async function setBasemap(map, basemapId) {
  if (currentBasemap === basemapId) return;
  const bm = BASEMAPS[basemapId];
  if (!bm) return;
  currentBasemap = basemapId;

  // Em vez de setStyle (que limpa data layers), trocamos só o source/layer do basemap
  // Remove TODOS os layers/sources que começam com 'osm' ou 'sat' (basemaps anteriores)
  const style = map.getStyle();
  ['osm-raster','osm','sat'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  // Adiciona o novo basemap source + layer
  const newStyle = bm.style;
  Object.entries(newStyle.sources || {}).forEach(([id, src]) => {
    if (!map.getSource(id)) map.addSource(id, src);
  });
  // beforeId = primeiro data layer pra basemap ficar no fundo
  let firstDataLayer = null;
  for (const lid of map.getStyle().layers.map(l => l.id)) {
    if (lid.startsWith('lyr-')) { firstDataLayer = lid; break; }
  }
  (newStyle.layers || []).forEach(l => {
    if (!map.getLayer(l.id)) map.addLayer(l, firstDataLayer || undefined);
  });

  document.querySelectorAll('.gaia-basemap-btn').forEach(b => {
    b.classList.toggle('is-active', b.dataset.basemap === basemapId);
  });
}

function renderBasemapToggle(map) {
  const root = document.getElementById('basemap-toggle');
  if (!root) return;
  root.innerHTML = Object.values(BASEMAPS).map(b => `
    <button class="gaia-basemap-btn ${b.id === currentBasemap ? 'is-active' : ''}" data-basemap="${b.id}" type="button" title="${b.label}">
      <span aria-hidden="true">${b.icon}</span> ${b.label}
    </button>`).join('');
  root.querySelectorAll('.gaia-basemap-btn').forEach(btn => {
    btn.addEventListener('click', () => setBasemap(map, btn.dataset.basemap));
  });
}

// ============== PIN TOGGLE GLOBAL ==============
function renderPinToggle(map) {
  const root = document.getElementById('pin-toggle');
  if (!root) return;
  root.innerHTML = `
    <button class="gaia-pin-toggle ${globalPinMode ? 'is-active' : ''}" id="pin-toggle-btn" type="button" title="${globalPinMode ? 'Voltar para polígonos' : 'Ver como pins'}">
      <span aria-hidden="true">${globalPinMode ? '▦' : '📍'}</span>
      <span>${globalPinMode ? 'Polígonos' : 'Pins'}</span>
    </button>`;
  document.getElementById('pin-toggle-btn').addEventListener('click', async () => {
    globalPinMode = !globalPinMode;
    const newMode = globalPinMode ? 'pins' : 'polygons';
    for (const layerId of Object.keys(LAYERS)) {
      if (LAYERS[layerId].module) await setLayerMode(map, layerId, newMode, false);
    }
    renderPinToggle(map);
    renderSidebar();
  });
}

// ============== SIDEBAR (mais compacto) ==============
function renderSidebar() {
  const list = document.getElementById('layer-list');
  list.innerHTML = '';
  Object.values(LAYERS).forEach((layer) => {
    const isAvailable = !!layer.module;
    const expanded = layerExpanded.has(layer.id);
    const mode = layerMode.get(layer.id) || (globalPinMode ? 'pins' : 'polygons');
    const count = layer.count || 0;

    const li = document.createElement('li');
    li.className = `gaia-layer-group ${isAvailable ? '' : 'gaia-layer-group--disabled'}`;
    li.innerHTML = `
      <div class="gaia-layer-group__head">
        <input type="checkbox" class="gaia-layer-group__check" id="toggle-${layer.id}"
          ${layer.visibleByDefault ? 'checked' : ''} ${isAvailable ? '' : 'disabled'}
          aria-label="Alternar camada ${layer.label}" />
        <span class="gaia-layer-group__icon" aria-hidden="true">${layer.icon}</span>
        <div class="gaia-layer-group__meta">
          <label for="toggle-${layer.id}" class="gaia-layer-group__title">${layer.label}</label>
          <div class="gaia-layer-group__sub">${layer.source.origin}${count ? ` · ${count.toLocaleString('pt-BR')}` : ''}</div>
        </div>
        ${isAvailable ? `
        <button class="gaia-layer-group__expand ${expanded ? 'is-open' : ''}" data-id="${layer.id}" aria-label="Expandir lista" type="button">›</button>
        ` : '<span class="gaia-layer-group__pending">Em breve</span>'}
      </div>
      ${isAvailable && expanded ? `
      <div class="gaia-layer-group__body">
        <div class="gaia-layer-group__featurelist" id="features-${layer.id}">
          <input type="search" class="gaia-feature-search" placeholder="Buscar em ${layer.label}..." data-id="${layer.id}" />
          <ul class="gaia-feature-quicklist" id="quicklist-${layer.id}"></ul>
        </div>
        <div class="gaia-tier-mini">${renderTier(layer.sensitivity)}</div>
      </div>
      ` : ''}`;
    list.appendChild(li);

    if (isAvailable) {
      li.querySelector('.gaia-layer-group__check').addEventListener('change', (e) => onToggleLayer(layer.id, e.target.checked));
      const expandBtn = li.querySelector('.gaia-layer-group__expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          if (layerExpanded.has(layer.id)) layerExpanded.delete(layer.id);
          else layerExpanded.add(layer.id);
          renderSidebar();
          if (layerExpanded.has(layer.id)) populateFeatureList(layer.id);
        });
      }
      if (expanded) {
        const search = li.querySelector('.gaia-feature-search');
        if (search) search.addEventListener('input', (e) => filterFeatureList(layer.id, e.target.value));
        populateFeatureList(layer.id);
      }
    }
  });
}

async function populateFeatureList(layerId) {
  const layer = LAYERS[layerId];
  const ul = document.getElementById(`quicklist-${layerId}`);
  if (!ul) return;
  let data = layerData.get(layerId);
  if (!data) {
    const mod = await loadLayerModule(layer);
    if (!mod) return;
    try { data = mapInstance.getSource(`src-${layerId}`)?._data; } catch(e){}
    if (!data) return;
    layerData.set(layerId, data);
  }
  const features = (data.features || []).slice(0, 200);
  ul.innerHTML = features.map((f, i) => {
    const name = f.properties[layer.nameField] || f.properties.scientificName || f.properties.id || `Feature ${i}`;
    return `<li><button class="gaia-feature-item" data-idx="${i}" type="button">${name}</button></li>`;
  }).join('');
  ul.querySelectorAll('.gaia-feature-item').forEach(b => {
    b.addEventListener('click', () => flyToFeature(features[parseInt(b.dataset.idx)], layer));
  });
}

function filterFeatureList(layerId, query) {
  const layer = LAYERS[layerId];
  const data = layerData.get(layerId);
  if (!data) return;
  const q = query.trim().toLowerCase();
  let filtered = data.features;
  if (q.length >= 1) {
    filtered = filtered.filter(f => {
      const name = (f.properties[layer.nameField] || f.properties.scientificName || '').toLowerCase();
      return name.includes(q);
    });
  }
  filtered = filtered.slice(0, 200);
  const ul = document.getElementById(`quicklist-${layerId}`);
  ul.innerHTML = filtered.map((f, i) => {
    const name = f.properties[layer.nameField] || f.properties.scientificName || `Feature ${i}`;
    return `<li><button class="gaia-feature-item" type="button">${name}</button></li>`;
  }).join('');
  ul.querySelectorAll('.gaia-feature-item').forEach((b, i) => {
    b.addEventListener('click', () => flyToFeature(filtered[i], layer));
  });
}

function flyToFeature(feature, layer) {
  if (!feature || !feature.geometry) return;
  const bbox = computeBbox(feature.geometry);
  if (!bbox) return;
  mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 80, duration: 1500, maxZoom: 12 });
  showFeaturePanel({ layerId: layer.id, label: layer.label, icon: layer.icon, sensitivity: layer.sensitivity, properties: feature.properties, lngLat: { lng: (bbox[0]+bbox[2])/2, lat: (bbox[1]+bbox[3])/2 } });
}

function computeBbox(geom) {
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  function p(c){ if (typeof c[0]==='number'){const[x,y]=c;if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;} else c.forEach(p); }
  p(geom.coordinates);
  if (!isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}
function geomCentroid(geom) { const b = computeBbox(geom); return b ? [(b[0]+b[2])/2, (b[1]+b[3])/2] : null; }

// ============== PIN MODE PER LAYER ==============
async function buildPinSource(layerId) {
  const data = mapInstance.getSource(`src-${layerId}`)?._data;
  if (!data) return null;
  return { type: 'FeatureCollection', features: data.features.map(f => {
    const c = geomCentroid(f.geometry);
    if (!c) return null;
    return { type: 'Feature', properties: f.properties, geometry: { type: 'Point', coordinates: c } };
  }).filter(Boolean) };
}

async function setLayerMode(map, layerId, mode, rerender = true) {
  layerMode.set(layerId, mode);
  const layer = LAYERS[layerId];
  const fillId = `lyr-${layerId}-fill`;
  const lineId = `lyr-${layerId}-line`;
  const haloId = `lyr-${layerId}-halo`;
  const pinSrc = `src-${layerId}-pins`;
  const pinId  = `lyr-${layerId}-pins`;

  // Verifica se camada está ativa via checkbox
  const checkbox = document.getElementById(`toggle-${layerId}`);
  const isOn = checkbox?.checked;

  const showPolys = (mode === 'polygons') && isOn;
  [fillId, lineId, haloId].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showPolys ? 'visible' : 'none');
  });

  if (mode === 'pins' && isOn) {
    if (!map.getSource(pinSrc)) {
      const data = await buildPinSource(layerId);
      if (data) map.addSource(pinSrc, { type: 'geojson', data });
    }
    if (!map.getLayer(pinId)) {
      map.addLayer({ id: pinId, type: 'circle', source: pinSrc,
        paint: { 'circle-radius': 6, 'circle-color': layer.color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2, 'circle-opacity': 0.92 } });
      map.on('click', pinId, (e) => {
        if (!e.features || !e.features.length) return;
        showFeaturePanel({ layerId, label: layer.label, icon: layer.icon, sensitivity: layer.sensitivity, properties: e.features[0].properties, lngLat: e.lngLat });
      });
      map.on('mouseenter', pinId, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', pinId, () => { map.getCanvas().style.cursor = ''; });
    } else {
      map.setLayoutProperty(pinId, 'visibility', 'visible');
    }
  } else if (map.getLayer(pinId)) {
    map.setLayoutProperty(pinId, 'visibility', 'none');
  }
  if (rerender) renderSidebar();
}

function onToggleLayer(layerId, isOn) {
  const mod = layerModules.get(layerId);
  if (!mod) return;
  const mode = globalPinMode ? 'pins' : (layerMode.get(layerId) || 'polygons');
  if (isOn) {
    if (mode === 'polygons') mod.show(mapInstance);
    else setLayerMode(mapInstance, layerId, 'pins', false);
  } else {
    mod.hide(mapInstance);
    const pinId = `lyr-${layerId}-pins`;
    if (mapInstance.getLayer(pinId)) mapInstance.setLayoutProperty(pinId, 'visibility', 'none');
  }
}

// ============== FEATURE PANEL ==============
function showFeaturePanel(feature) {
  const panel = document.getElementById('feature-panel');
  const titleEl = document.getElementById('feature-panel-title');
  const nameEl = document.getElementById('feature-panel-name');
  const body = document.getElementById('feature-panel-body');
  titleEl.innerHTML = `<span aria-hidden="true">${feature.icon}</span> ${feature.label}`;
  nameEl.textContent = feature.properties.name || feature.properties.scientificName || feature.properties.id || 'Sem nome';

  const p = feature.properties;
  const rows = [];
  if (p.scientificName) rows.push(['Nome científico', `<em style="font-family: var(--gaia-font-serif); font-style: italic;">${p.scientificName}</em>`]);
  if (p.iucnCategory) rows.push(['Categoria IUCN', renderIucn(p.iucnCategory)]);
  if (p.iucnYear) rows.push(['Avaliação IUCN', `${p.iucnYear}${p.iucnCriteria ? ' · ' + p.iucnCriteria : ''}`]);
  if (p.iucnPopulationTrend) rows.push(['Tendência', renderTrend(p.iucnPopulationTrend)]);
  if (p.category) rows.push(['Categoria', p.category]);
  if (p.group) rows.push(['Grupo', p.group]);
  if (p.habitat) rows.push(['Habitat', p.habitat]);
  if (p.sphere) rows.push(['Esfera', p.sphere]);
  if (p.manager) rows.push(['Gestor', p.manager]);
  if (p.biome) rows.push(['Bioma', p.biome]);
  if (p.uf) rows.push(['UF', p.uf]);
  if (p.areaHa) rows.push(['Área', `${Number(p.areaHa).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha`]);
  if (p.peoples) rows.push(['Povos', p.peoples]);
  if (p.phase) rows.push(['Estágio', p.phase]);
  if (p.municipality) rows.push(['Município', p.municipality]);
  if (p.families) rows.push(['Famílias', `${p.families} ${p.families === 1 ? 'família' : 'famílias'}`]);
  if (p.titulationDate) rows.push(['Titulado em', p.titulationDate]);
  if (p.process) rows.push(['Processo', `<code style="font-size: 11px;">${p.process}</code>`]);
  if (p.occurrences) rows.push(['Ocorrências', p.occurrences]);
  if (p.iucnThreats) {
    let threats = p.iucnThreats;
    if (typeof threats === 'string') { try { threats = JSON.parse(threats); } catch (_) { threats = [threats]; } }
    if (threats && threats.length) rows.push(['Ameaças', `<ul style="margin:0;padding-left:18px;text-align:left;">${threats.slice(0,4).map(x => `<li style="margin-bottom:4px;">${x}</li>`).join('')}</ul>`]);
  }
  rows.push(['Sensibilidade', renderTier(feature.sensitivity)]);
  if (p.iucnUrl) rows.push(['IUCN', `<a href="${p.iucnUrl}" target="_blank" rel="noopener" style="font-weight:600;">Avaliação oficial ↗</a>`]);
  if (p.sourceUrl) rows.push(['Fonte', `<a href="${p.sourceUrl}" target="_blank" rel="noopener" style="font-weight:600;">Origem do dado ↗</a>`]);

  body.innerHTML = rows.map(([k, v]) => `<dl class="gaia-feature-panel__row"><dt>${k}</dt><dd>${v}</dd></dl>`).join('');
  panel.classList.add('is-open');
}
function closeFeaturePanel() { document.getElementById('feature-panel').classList.remove('is-open'); }

function toast(message, ms = 3500) {
  const ex = document.querySelector('.gaia-toast'); if (ex) ex.remove();
  const el = document.createElement('div'); el.className = 'gaia-toast'; el.textContent = message;
  document.querySelector('.gaia-map-canvas').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

async function bootstrap() {
  document.getElementById('app-name').textContent = APP.name;
  document.getElementById('app-tagline').textContent = APP.tagline;

  const map = new maplibregl.Map({ container: 'map', style: MAP.baseStyle,
    center: MAP.initialCenter, zoom: MAP.initialZoom, minZoom: MAP.minZoom, maxZoom: MAP.maxZoom });
  mapInstance = map;
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

  map.on('load', async () => {
    for (const layer of Object.values(LAYERS)) {
      if (!layer.module) continue;
      const mod = await loadLayerModule(layer);
      if (!mod) continue;
      try { await mod.register(map); if (mod.onClick) { mod.onClick(map, showFeaturePanel); hookedLayers.add(layer.id); } } catch (err) { console.error(err); }
    }
    map.flyTo({ center: [-52.0, -14.0], zoom: 4, duration: 1200 });
    renderBasemapToggle(map);
    renderPinToggle(map);
    toast('Camadas carregadas · clique em qualquer polígono');
  });

  renderSidebar();
  document.getElementById('feature-panel-close').addEventListener('click', closeFeaturePanel);
  attachSearch(document.getElementById('search-input'), map, toast);
}
document.addEventListener('DOMContentLoaded', bootstrap);
