import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';
const LAYER=LAYERS['quilombola-territories'];
const SOURCE_ID='src-quilombolas';
const FILL_LAYER_ID='lyr-quilombolas-fill';
const HALO_LAYER_ID='lyr-quilombolas-halo';
const LINE_LAYER_ID='lyr-quilombolas-line';
const DATA_URL=new URL('../../data/quilombolas.geojson',import.meta.url).href;
let cachedData=null;
async function loadData(){if(cachedData)return cachedData;cachedData=await getJSON(DATA_URL);return cachedData;}
export async function register(map){
  const data=await loadData();
  if(!map.getSource(SOURCE_ID))map.addSource(SOURCE_ID,{type:'geojson',data});
  const visibility=LAYER.visibleByDefault?'visible':'none';
  if(!map.getLayer(FILL_LAYER_ID))map.addLayer({id:FILL_LAYER_ID,type:'fill',source:SOURCE_ID,paint:{'fill-color':LAYER.color,'fill-opacity':0.55},layout:{visibility}});
  if(!map.getLayer(HALO_LAYER_ID))map.addLayer({id:HALO_LAYER_ID,type:'line',source:SOURCE_ID,paint:{'line-color':'#FFFFFF','line-width':4,'line-opacity':0.7},layout:{visibility}});
  if(!map.getLayer(LINE_LAYER_ID))map.addLayer({id:LINE_LAYER_ID,type:'line',source:SOURCE_ID,paint:{'line-color':'#3A2410','line-width':1.8,'line-opacity':0.95},layout:{visibility}});
}
export function show(map){[FILL_LAYER_ID,HALO_LAYER_ID,LINE_LAYER_ID].forEach(id=>{if(map.getLayer(id))map.setLayoutProperty(id,'visibility','visible');});}
export function hide(map){[FILL_LAYER_ID,HALO_LAYER_ID,LINE_LAYER_ID].forEach(id=>{if(map.getLayer(id))map.setLayoutProperty(id,'visibility','none');});}
export function onClick(map,callback){
  map.on('click',FILL_LAYER_ID,(e)=>{if(!e.features||!e.features.length)return;callback({layerId:LAYER.id,label:LAYER.label,icon:LAYER.icon,sensitivity:LAYER.sensitivity,properties:e.features[0].properties,lngLat:e.lngLat});});
  map.on('mouseenter',FILL_LAYER_ID,()=>{map.getCanvas().style.cursor='pointer';});
  map.on('mouseleave',FILL_LAYER_ID,()=>{map.getCanvas().style.cursor='';});
}
export const meta=LAYER;
