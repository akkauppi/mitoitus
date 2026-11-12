import * as THREE from 'three';
import {footprint,footprintRow,plotSurface,FOOTPRINT_RELIEF} from '../primitives/footprints.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
// Union of all three drawings and their dimensions. Fixed across every building panel.
export const BUILDING_FRAME={min:[-29,-.3,-28],max:[29,.5,29]};
const assumptions=['Footprint plaques rise 0.12 m for drawing relief only; base thickness 0.24 m is decorative. Neither encodes storeys, building height, roofs, access or setback requirements. Forms are independent reference drawings, not a site layout.'];
export const BUILDING_INFO={
 'building-blocks':{defaultCamera:'plan',allowedCameras:['plan','iso'],caseTitle:'FOOTPRINTS · TKK 2007 · ONE METRIC SCALE',description:'Two 26 by 11 metre slab modules and a 20 by 20 metre square point-block footprint at one scale.',explanation:['Drawn slab: 2 × 26 m modules, 11 m deep (52 m overall). Drawn point block: 20 × 20 m. Source ranges and upper limits remain in the table.','The shallow plaques show footprints; relief is decorative. These are separate typology examples.'],assumptions},
 'building-rows':{defaultCamera:'plan',allowedCameras:['plan','iso'],caseTitle:'REPEATING FOOTPRINTS AND GARDENS · TKK 2007',description:'Four 9 by 9 metre small-block modules; four 6 by 9.5 metre row dwellings, each with a 6 by 10 metre garden.',explanation:['Drawn: four 9 × 9 m small-block modules (36 m overall); four 6 × 9.5 m row dwellings (24 m overall), each with a 6 × 10 m garden.','Module joints are visible. Source ranges remain ranges in the table; the plaques show chosen representatives at the same scale as the other building panels.'],assumptions},
 'building-detached':{defaultCamera:'plan',allowedCameras:['plan','iso'],caseTitle:'FOOTPRINT AND EXAMPLE PLOT · TKK 2007',description:'A 15 by 10 metre house footprint within an illustrative 25 by 30 metre plot: 150 and 750 square metres.',explanation:['Drawn house footprint: 15 × 10 m = 150 m². Example plot: 25 × 30 m = 750 m². The source plot range is approximately 500–1,000 m².','House position follows the original example. Plot shape, placement and relief are illustrative; source “one storey” wording is retained without assigning a metre height.'],assumptions},
};
export function buildingScene(panel){
 const group=new THREE.Group(),dimensions=[],labels=[];const y=FOOTPRINT_RELIEF;
 let measurement;
 if(panel==='building-blocks'){
  footprintRow(group,{count:2,width:26,length:11,z:-18.5,name:'slab-module',alternating:true});
  // Original vertical separation: 112 drawing pixels / 6 pixels per metre.
  footprint(group,{width:20,length:20,x:-16,z:47/3,name:'point-block'});
  dimensions.push(dim([-26,y,-24],[0,y,-24],'26 m drawn',[0,0,-1.4]),dim([26,y,-24],[26,y,-13],'11 m drawn',[1.4,0,0]),dim([-26,y,-13],[26,y,-13],'52 m · 2 modules',[0,0,1.5]),dim([-26,y,77/3],[-6,y,77/3],'20 m drawn',[0,0,1.4]));
  labels.push({point:[-13,y,-18.5],text:'Slab module'},{point:[13,y,-18.5],text:'Repeated module'},{point:[-16,y,47/3],text:'Point block'});
  measurement={width:26,moduleLength:26,moduleDepth:11,slabLength:52,slabArea:572,pointArea:400};
 }else if(panel==='building-rows'){
  footprintRow(group,{count:4,width:9,length:9,x:-8,z:-19.5,name:'small-module',alternating:true});
  footprintRow(group,{count:4,width:6,length:9.5,x:-14,z:109/12,name:'row-dwelling'});
  for(let i=0;i<4;i++)plotSurface(group,{width:6,length:10,x:-23+i*6,z:113/6,name:`row-garden-${i}`});
  dimensions.push(dim([-26,y,-24],[-17,y,-24],'9 m drawn',[0,0,-1.4]),dim([-26,y,13/3],[-20,y,13/3],'6 m drawn',[0,0,-1.5]),dim([-2,y,13/3],[-2,y,83/6],'9.5 m drawn',[1.5,0,0]),dim([-2,0,83/6],[-2,0,143/6],'10 m garden',[1.5,0,0]));
  labels.push({point:[-21.5,y,-19.5],text:'Small-block module'},{point:[-23,y,109/12],text:'Row dwelling'},{point:[-23,0,113/6],text:'Garden'});
  measurement={width:9,smallBlockLength:36,smallModuleArea:81,rowLength:24,dwellingArea:57,gardenArea:60};
 }else if(panel==='building-detached'){
  plotSurface(group,{width:25,length:30,name:'detached-plot'});
  // Preserve the original 35/6 m left and 70/6 m top offsets inside the plot.
  footprint(group,{width:15,length:10,x:5/6,z:5/3,name:'detached-house',ground:false});
  dimensions.push(dim([-20/3,y,-10/3],[25/3,y,-10/3],'15 m drawn',[0,0,-1.5]),dim([25/3,y,-10/3],[25/3,y,20/3],'10 m drawn',[1.5,0,0]),dim([-12.5,0,15],[12.5,0,15],'25 m plot',[0,0,1.5]),dim([-12.5,0,-15],[-12.5,0,15],'30 m plot',[-1.5,0,0]));
  labels.push({point:[5/6,y,5/3],text:'House footprint'},{point:[-9,0,-10],text:'Example plot'});
  measurement={width:15,footprintArea:150,plotArea:750,plotWidth:25,plotLength:30};
 }else throw new Error('Unknown building panel');
 group.updateMatrixWorld(true);return {group,dimensions,labels,measurement,comparison:{id:'building-footprints',bounds:BUILDING_FRAME},meta:{target:[0,0,0],camera:[1.3,.95,1.6]}};
}
