import {buildingMass,externalStair,scaleContext,entranceGallery,gabledRoof} from '../primitives/massing.js';
import * as THREE from 'three';
import {footprint,footprintRow,plotSurface,FOOTPRINT_RELIEF} from '../primitives/footprints.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
// Union of all three drawings and their dimensions. Fixed across every building panel.
export const BUILDING_FRAME={min:[-29,-.3,-28],max:[29,19.5,29]};
const assumptions=['Building massing, facade rhythms, stair-room sizes, external stair geometry, trees and context placement are assistant illustration assumptions. Schematic heights: slab 12 m, point block 18 m, small block 6 m, row house 6 m, detached eaves 3.2 m with 1.6 m roof rise and 0.45 m overhang. Entrance gallery depth 1.6 m and level 3 m; gallery canopy underside 5.55 m; stair and guard details are illustrative. TKK supplies footprint dimensions and schematic stair positions, not these heights or core sizes. Trees 5 m, people 1.75 m; car body 5 × 1.8 m. Context pads do not establish parking, access or setback requirements.'];
export const BUILDING_INFO={
 'building-blocks':{defaultCamera:'iso',allowedCameras:['iso','plan'],caseTitle:'ILLUSTRATIVE MASSING · TKK FOOTPRINTS',description:'Two 26 by 11 metre slab modules and a 20 by 20 metre square point-block footprint at one scale.',explanation:['Drawn slab: 2 × 26 m modules, 11 m deep (52 m overall). Drawn point block: 20 × 20 m. Source ranges and upper limits remain in the table.','Building heights and facade details are schematic. Teal highlights stair rooms, following the TKK diagram’s locations; room dimensions are illustrative.'],assumptions},
 'building-rows':{defaultCamera:'iso',allowedCameras:['iso','plan'],caseTitle:'ILLUSTRATIVE LUHTITALO · ROW HOUSES',description:'Four 9 by 9 metre small-block modules; four 6 by 9.5 metre row dwellings, each with a 6 by 10 metre garden.',explanation:['Drawn: four 9 × 9 m small-block modules (36 m overall); four 6 × 9.5 m row dwellings (24 m overall), each with a 6 × 10 m garden.','The small-block example is shown as a luhtitalo: external stairs connect to a covered upper entrance gallery and doors. Body depth is 9 m; gallery, stair and massing dimensions are illustrative.'],assumptions},
 'building-detached':{defaultCamera:'iso',allowedCameras:['iso','plan'],caseTitle:'FOOTPRINT AND EXAMPLE PLOT · TKK 2007',description:'A 15 by 10 metre house footprint within an illustrative 25 by 30 metre plot: 150 and 750 square metres.',explanation:['Drawn house footprint: 15 × 10 m = 150 m². Example plot: 25 × 30 m = 750 m². The source plot range is approximately 500–1,000 m².','House position follows the original example. The one-storey house has an illustrative low gabled roof with eaves. The dimensioned 15 × 10 m wall footprint is unchanged; roof and eave dimensions are assumed. Plot arrangement is not setback guidance.'],assumptions},
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
  dimensions.push(dim([10,y,-24],[10,y,-15],'9 m body depth',[1.5,0,0]));
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
 const heightFor=name=>name.startsWith('slab')?12:name==='point-block'?18:name.startsWith('small')?6:name.startsWith('row-')?6:3.2;
 const plates=group.children.filter(o=>o.userData.decorativeRelief);
 for(const plate of plates){
  const name=plate.name,height=heightFor(name);
  const core=name.startsWith('slab')?{x:0,z:3.5,width:4,length:4}:name==='point-block'?{x:0,z:-6,width:4,length:8}:null;
  buildingMass(group,plate,{height,core});
 }
 for(const label of labels){
  const plate=plates.find(p=>Math.abs(p.position.x-label.point[0])<.01&&Math.abs(p.position.z-label.point[2])<.01);
  if(plate)label.point[1]=heightFor(plate.name);
 }
 if(panel==='building-blocks'){
  labels.push({point:[-13,12.04,-15],text:'Stair room'});
  scaleContext(group,{trees:[[-22,-7.5],[21,-7],[0,22],[8,9.5]],cars:[[10,-7,Math.PI/2],[4,16]],people:[[-12,-9.5],[-10,-9.5],[-3.5,14]]});
 }else if(panel==='building-rows'){
  externalStair(group,{x:-17,z:-12.7});externalStair(group,{x:1,z:-12.7});entranceGallery(group,{});
  labels.push({point:[-12,3,-14.2],text:'Entrance gallery'});
  scaleContext(group,{trees:[[-23,21],[-17,21],[-11,21],[-5,21]],people:[[-16,16.5],[-9,16.5]],onPlot:true});
  scaleContext(group,{trees:[[16,-12],[12,21]],cars:[[6,10],[14,-19.5]],people:[[12,-15]]});
 }else{
  gabledRoof(group,group.getObjectByName('detached-house'));labels.find(l=>l.text==='House footprint').point[1]=4.93;
  scaleContext(group,{trees:[[9,-10],[-9,11]],cars:[[9.5,11,Math.PI/2]],people:[[1.5,8],[3,8.5]],onPlot:true});
 }
 group.updateMatrixWorld(true);return {group,dimensions,labels,measurement,comparison:{id:'building-footprints',bounds:BUILDING_FRAME},meta:{target:[0,0,0],camera:[1.3,.95,1.6]}};
}
