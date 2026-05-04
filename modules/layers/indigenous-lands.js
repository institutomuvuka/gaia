import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';
const LAYER=LAYERS['indigenous-lands'];
const SOURCE_ID='src-indigenous-lands';
const FILL_LAYER_ID='lyr-indigenous-lands-fill';
const HALO_LAYER_ID='lyr-indigenous-lands-halo';
const LINE_LAYER_ID='lyr-indigenous-lands-line';
const DATA_URL=new URL('../../data/indigenous-lands.geojson',import.meta.url).href;
let cachedData=null;
async function loadData(){if(cachedData)return cachedData;cachedData=await getJSON(DATA_URL);return cachedData;}
export async function register(map){
  const data=await loadData();
  if(!map.getSource(SOURCE_ID))map.addSource(SOURCE_ID,{type:'geojson',data});
  const visibility=LAYER.visibleByDefault?'visible':'none';
  if(!map.getLayer(FILL_LAYER_ID))map.addLayer({id:FILL_LAYER_ID,type:'fill',source:SOURCE_ID,paint:{'fill-color':LAYER.color,'fill-opacity':['match',['get','phase'],'Regularizada',0.40,'Homologada',0.35,'Declarada',0.28,'Delimitada',0.22,'Encaminhada RI',0.18,'Em Estudo',0.14,0.30]},layout:{visibility}});
  if(!map.getLayer(HALO_LAYER_ID))map.addLayer({id:HALO_LAYER_ID,type:'line',source:SOURCE_ID,paint:{'line-color':'#FFFFFF','line-width':4,'line-opacity':0.7},layout:{visibility}});
  if(!map.getLayer(LINE_LAYER_ID))map.addLayer({id:LINE_LAYER_ID,type:'line',source:SOURCE_ID,paint:{'line-color':'#5A3818','line-width':1.8,'line-opacity':0.95},layout:{visibility}});
}
export function show(map){[FILL_LAYER_ID,HALO_LAYER_ID,LINE_LAYER_ID].forEach(id=>{if(map.getLayer(id))map.setLayoutProperty(id,'visibility','visible');});}
export function hide(map){[FILL_LAYER_ID,HALO_LAYER_ID,LINE_LAYER_ID].forEach(id=>{if(map.getLayer(id))map.setLayoutProperty(id,'visibility','none');});}
export function onClick(map,callback){
  map.on('click',FILL_LAYER_ID,(e)=>{if(!e.features||!e.features.length)return;callback({layerId:LAYER.id,label:LAYER.label,icon:LAYER.icon,sensitivity:LAYER.sensitivity,properties:e.features[0].properties,lngLat:e.lngLat});});
  map.on('mouseenter',FILL_LAYER_ID,()=>{map.getCanvas().style.cursor='pointer';});
  map.on('mouseleave',FILL_LAYER_ID,()=>{map.getCanvas().style.cursor='';});
}
export const meta=LAYER;
