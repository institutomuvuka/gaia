import { APP, LAYERS, MAP, SENSITIVITY, BASEMAPS } from '../../core/config.js';
import { t } from '../../core/i18n.js';
import { attachSearch } from '../ui/search.js';

const layerModules = new Map();
const layerData = new Map();        // layerId → loaded GeoJSON
const layerMode = new Map();        // layerId → 'polygons' | 'pins'
const layerExpanded = new Set();    // expanded sidebar groups
let mapInstance = null;
let currentBasemap = MAP.defaultBasemap;

async function loadLayerModule(def) {
  if (!def.module) return null;
  if (layerModules.has(def.id)) return layerModules.get(def.id);
  try {
    const mod = await import(def.module);
    layerModules.set(def.id, mod);
    return mod;
  } catch (err) { console.error(`Falha ao carregar ${def.id}:`, err); return null; }
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
function setBasemap(map, basemapId) {
  if (currentBasemap === basemapId) return;
  currentBasemap = basemapId;
  const bm = BASEMAPS[basemapId];
  if (!bm) return;
  // Salva todas as data layers antes de trocar style (style change limpa tudo)
  const layers = Object.values(LAYERS);
  const visibilities = {};
  layers.forEach(l => {
    if (l.module && map.getLayer(`lyr-${l.id}-fill`)) {
      visibilities[l.id] = map.getLayoutProperty(`lyr-${l.id}-fill`,'visibility');
    }
  });
  map.setStyle(bm.style);
  map.once('style.load', async () => {
    for (const l of layers) {
      if (!l.module) continue;
      const mod = await loadLayerModule(l);
      if (!mod) continue;
      try { await mod.register(map); if (mod.onClick) mod.onClick(map, showFeaturePanel); } catch(e){}
      // restore visibility
      if (visibilities[l.id] === 'visible') mod.show(map);
    }
  });
  // Update active
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

// ============== SIDEBAR — sidebar tipo My Maps ==============
function renderSidebar(map, onToggle, onModeChange, onFeatureClick) {
  const list = document.getElementById('layer-list');
  list.innerHTML = '';
  Object.values(LAYERS).forEach((layer) => {
    const isAvailable = !!layer.module;
    const expanded = layerExpanded.has(layer.id);
    const mode = layerMode.get(layer.id) || 'polygons';
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
        <div class="gaia-layer-group__modes" role="radiogroup" aria-label="Modo de visualização">
          <button class="gaia-mode-btn ${mode === 'polygons' ? 'is-active' : ''}" data-id="${layer.id}" data-mode="polygons" type="button">▦ Polígonos</button>
          <button class="gaia-mode-btn ${mode === 'pins' ? 'is-active' : ''}" data-id="${layer.id}" data-mode="pins" type="button">📍 Pins</button>
        </div>
        <div class="gaia-layer-group__featurelist" id="features-${layer.id}">
          <input type="search" class="gaia-feature-search" placeholder="Buscar em ${layer.label}..." data-id="${layer.id}" />
          <ul class="gaia-feature-quicklist" id="quicklist-${layer.id}"></ul>
        </div>
        <div class="gaia-tier-mini">${renderTier(layer.sensitivity)}</div>
      </div>
      ` : ''}`;
    list.appendChild(li);

    if (isAvailable) {
      li.querySelector('.gaia-layer-group__check').addEventListener('change', (e) => onToggle(layer.id, e.target.checked));
      const expandBtn = li.querySelector('.gaia-layer-group__expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          if (layerExpanded.has(layer.id)) layerExpanded.delete(layer.id);
          else layerExpanded.add(layer.id);
          renderSidebar(map, onToggle, onModeChange, onFeatureClick);
          // Auto-load feature list if expanded
          if (layerExpanded.has(layer.id)) populateFeatureList(layer.id);
        });
      }
      if (expanded) {
        li.querySelectorAll('.gaia-mode-btn').forEach(b => b.addEventListener('click', () => onModeChange(layer.id, b.dataset.mode)));
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
    // grab from MapLibre source
    try { data = mapInstance.getSource(`src-${layerId}`)?._data; } catch(e){}
    if (!data) return;
    layerData.set(layerId, data);
  }
  const features = (data.features || []).slice(0, 200); // top 200 most visible
  ul.innerHTML = features.map((f, i) => {
    const name = f.properties[layer.nameField] || f.properties.scientificName || f.properties.id || `Feature ${i}`;
    return `<li><button class="gaia-feature-item" data-layer="${layerId}" data-idx="${i}" type="button">${name}</button></li>`;
  }).join('');
  ul.querySelectorAll('.gaia-feature-item').forEach(b => {
    b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.idx);
      const feature = features[idx];
      flyToFeature(feature, layer);
    });
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
    return `<li><button class="gaia-feature-item" data-name="${(name+'').replace(/"/g,'&quot;')}" type="button">${name}</button></li>`;
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
  // Open feature panel
  showFeaturePanel({ layerId: layer.id, label: layer.label, icon: layer.icon, sensitivity: layer.sensitivity, properties: feature.properties, lngLat: { lng: (bbox[0]+bbox[2])/2, lat: (bbox[1]+bbox[3])/2 } });
}

function computeBbox(geom) {
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  function process(coords) {
    if (typeof coords[0] === 'number') {
      const [x,y] = coords;
      if (x<minX)minX=x; if (y<minY)minY=y; if (x>maxX)maxX=x; if (y>maxY)maxY=y;
    } else coords.forEach(process);
  }
  process(geom.coordinates);
  if (!isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

function geomCentroid(geom) {
  // Approx centroid: average of bbox corners
  const b = computeBbox(geom);
  if (!b) return null;
  return [(b[0]+b[2])/2, (b[1]+b[3])/2];
}

// ============== PIN MODE ==============
async function buildPinSource(layerId) {
  const layer = LAYERS[layerId];
  const mod = await loadLayerModule(layer);
  if (!mod) return null;
  let data = mapInstance.getSource(`src-${layerId}`)?._data;
  if (!data) return null;
  const fc = { type: 'FeatureCollection', features: data.features.map(f => {
    const c = geomCentroid(f.geometry);
    if (!c) return null;
    return { type: 'Feature', properties: f.properties, geometry: { type: 'Point', coordinates: c } };
  }).filter(Boolean) };
  return fc;
}

async function setLayerMode(map, layerId, mode) {
  layerMode.set(layerId, mode);
  const layer = LAYERS[layerId];
  const fillId = `lyr-${layerId}-fill`;
  const lineId = `lyr-${layerId}-line`;
  const haloId = `lyr-${layerId}-halo`;
  const pinSrc = `src-${layerId}-pins`;
  const pinId  = `lyr-${layerId}-pins`;

  const showPolys = (mode === 'polygons');
  [fillId, lineId, haloId].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', showPolys ? 'visible' : 'none');
  });

  if (mode === 'pins') {
    if (!map.getSource(pinSrc)) {
      const data = await buildPinSource(layerId);
      if (data) map.addSource(pinSrc, { type: 'geojson', data });
    }
    if (!map.getLayer(pinId)) {
      map.addLayer({ id: pinId, type: 'circle', source: pinSrc,
        paint: { 'circle-radius': 6, 'circle-color': layer.color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2, 'circle-opacity': 0.9 } });
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
  // Re-render sidebar to reflect active mode pill
  renderSidebar(map, _onToggle, _onModeChange, _onFeatureClick);
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

let _onToggle, _onModeChange, _onFeatureClick;

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
      try { await mod.register(map); if (mod.onClick) mod.onClick(map, showFeaturePanel); } catch (err) { console.error(err); }
    }
    map.flyTo({ center: [-52.0, -14.0], zoom: 4, duration: 1200 });
    renderBasemapToggle(map);
    toast('Camadas carregadas · clique em qualquer polígono');
  });

  _onToggle = async (layerId, isOn) => {
    const mod = layerModules.get(layerId);
    if (!mod) return;
    if (isOn) mod.show(map); else mod.hide(map);
    // Pin layer follows
    const pinId = `lyr-${layerId}-pins`;
    if (map.getLayer(pinId) && layerMode.get(layerId) === 'pins') {
      map.setLayoutProperty(pinId, 'visibility', isOn ? 'visible' : 'none');
    }
  };
  _onModeChange = (layerId, mode) => setLayerMode(map, layerId, mode);
  _onFeatureClick = (layerId, feature) => flyToFeature(feature, LAYERS[layerId]);

  renderSidebar(map, _onToggle, _onModeChange, _onFeatureClick);
  document.getElementById('feature-panel-close').addEventListener('click', closeFeaturePanel);
  attachSearch(document.getElementById('search-input'), map, toast);
}
document.addEventListener('DOMContentLoaded', bootstrap);
