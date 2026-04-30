// ============================================================
// GAIA — Módulo: Busca por município
// Cruza IBGE Localidades (autoritativo para BR) com Nominatim (OSM)
// para obter coordenadas/bbox e enquadrar o mapa no município pedido.
// ============================================================

import { getJSON } from '../../core/http.js';

const IBGE_API = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/**
 * Busca um município brasileiro e retorna nome canônico + bounding box.
 * @param {string} query  Texto digitado pelo usuário
 * @returns {Promise<null | {name:string, lat:number, lon:number, bbox:number[]|null, ibge:object|null}>}
 */
export async function searchMunicipality(query) {
  const q = (query || '').trim();
  if (q.length < 2) return null;

  // 1) IBGE — confirma que existe município com esse nome no Brasil.
  let ibgeMatches = [];
  try {
    ibgeMatches = await getJSON(`${IBGE_API}?nome=${encodeURIComponent(q)}`, { timeout: 10000 });
  } catch (err) {
    console.warn('IBGE indisponível:', err);
  }

  // Se houver match no IBGE, usa o nome canônico para refinar a query no Nominatim.
  const refined = ibgeMatches.length > 0 ? `${ibgeMatches[0].nome}, ${ibgeMatches[0].microrregiao?.mesorregiao?.UF?.sigla || ''}, Brasil` : `${q}, Brasil`;

  // 2) Nominatim — pega coordenadas e bbox.
  let nominatimRes = [];
  try {
    nominatimRes = await getJSON(
      `${NOMINATIM}?q=${encodeURIComponent(refined)}&format=json&countrycodes=br&limit=1&accept-language=pt-BR`,
      { timeout: 10000, headers: { 'Accept': 'application/json' } }
    );
  } catch (err) {
    console.warn('Nominatim indisponível:', err);
  }

  if (!nominatimRes || nominatimRes.length === 0) return null;
  const r = nominatimRes[0];

  return {
    name: r.display_name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    // Nominatim devolve bbox como [south, north, west, east]
    bbox: r.boundingbox ? r.boundingbox.map(parseFloat) : null,
    ibge: ibgeMatches[0] || null,
  };
}

/**
 * Conecta o input de busca à função acima e enquadra o mapa quando há resultado.
 * @param {HTMLInputElement} input
 * @param {maplibregl.Map} map
 * @param {(msg:string)=>void} toast  função para feedback ao usuário
 */
export function attachSearch(input, map, toast) {
  let busy = false;
  input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (busy) return;
    const q = input.value;
    if (!q.trim()) return;

    busy = true;
    toast('Buscando...');
    try {
      const r = await searchMunicipality(q);
      if (!r) {
        toast('Município não encontrado');
        return;
      }
      if (r.bbox) {
        const [south, north, west, east] = r.bbox;
        map.fitBounds([[west, south], [east, north]], { padding: 60, duration: 1500, maxZoom: 13 });
      } else {
        map.flyTo({ center: [r.lon, r.lat], zoom: 11, duration: 1500 });
      }
      const label = r.ibge ? `${r.ibge.nome} (${r.ibge.microrregiao?.mesorregiao?.UF?.sigla || '?'})` : r.name.split(',')[0];
      toast(`📍 ${label}`);
    } catch (err) {
      console.error(err);
      toast('Erro na busca');
    } finally {
      busy = false;
    }
  });
}
