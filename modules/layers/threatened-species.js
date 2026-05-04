import { LAYERS } from '../../core/config.js';
import { getJSON } from '../../core/http.js';
const LAYER=LAYERS['threatened-species'];
const SOURCE_ID='src-threatened-species';
const FILL_LAYER_ID='lyr-threatened-species-fill';
const HALO_LAYER_ID='lyr-threatened-species-halo';
const LINE_LAYER_ID='lyr-threatened-species-line';
const DATA_URL=new URL('../../data/threatened-species.geojson',import.meta.url).href;
const IUCN_COLORS={EX:'#000000',EW:'#542344',CR:'#B71C1C',EN:'#E65100',VU:'#F9A825',NT:'#9E9D24',LC:'#388E3C',DD:'#9E9E9E',NE:'#757575'};
let cachedData=null;
async function loadData(){if(cachedData)return cachedData;cachedData=await getJSON(DATA_URL);return cachedData;}
export async function register(map){
  const data=await loadData();
  if(!map.getSource(SOURCE_ID))map.addSource(SOURCE_ID,{type:'geojson',data});
  const visibility=LAYER.visibleByDefault?'visible':'none';
  const colorExpr=['match',['get','iucnCategory'],'EX',IUCN_COLORS.EX,'EW',IUCN_COLORS.EW,'CR',IUCN_COLORS.CR,'EN',IUCN_COLORS.EN,'VU',IUCN_COLORS.VU,'NT',IUCN_COLORS.NT,'LC',IUCN_COLORS.LC,'DD',IUCN_COLORS.DD,IUCN_COLORS.NE];
  if(!map.getLayer(FILL_LAYER_ID))map.addLayer({id:FILL_LAYER_ID,type:'fill',source:SOURCE_ID,paint:{'fill-color':colorExpr,'fill-opacity':0.22},layout:{visibility}});
  if(!map.getLayer(HALO_LAYER_ID))map.addLayer({id:HALO_LAYER_ID,type:'line',source:SOURCE_ID,paint:{'line-color':'#FFFFFF','line-width':3.5,'line-opacity':0.65},layout:{visibility}});
  if(!map.getLayer(LINE_LAYER_ID))map.addLayer({id:LINE_LAYER_ID,type:'line',source:SOURCE_ID,paint:{'line-color':colorExpr,'line-width':1.8,'line-opacity':0.95},layout:{visibility}});
}
export function show(map){[FILL_LAYER_ID,HALO_LAYER_ID,LINE_LAYER_ID].forEach(id=>{if(map.getLayer(id))map.setLayoutProperty(id,'visibility','visible');});}
export function hide(map){[FILL_LAYER_ID,HALO_LAYER_ID,LINE_LAYER_ID].forEach(id=>{if(map.getLayer(id))map.setLayoutProperty(id,'visibility','none');});}
export function onClick(map,callback){
  map.on('click',FILL_LAYER_ID,(e)=>{if(!e.features||!e.features.length)return;callback({layerId:LAYER.id,label:LAYER.label,icon:LAYER.icon,sensitivity:LAYER.sensitivity,properties:e.features[0].properties,lngLat:e.lngLat});});
  map.on('mouseenter',FILL_LAYER_ID,()=>{map.getCanvas().style.cursor='pointer';});
  map.on('mouseleave',FILL_LAYER_ID,()=>{map.getCanvas().style.cursor='';});
}
export const meta=LAYER;
