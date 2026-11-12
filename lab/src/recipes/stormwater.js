import * as THREE from 'three';
import {createShrub} from '../../assets.js';
import {outline} from '../primitives/surfaces.js';
import {rectangleProfile,validateCapAnchor} from '../primitives/sections.js';
import {conceptualCut,processArrow} from '../primitives/conceptual.js';
export const STORMWATER_INFO={
 'rain-gardens':{categoryOptions:['Rain garden','Swale'],categoryPrompt:'System',categoryDefault:0,defaultCamera:'iso',description:'Rain garden filters runoff through planted medium, with infiltration where suitable and drainage or overflow. A swale conveys runoff and provides temporary storage.'},
 ponds:{categoryOptions:['Dry basin','Wet pond / wetland'],categoryPrompt:'Water regime',categoryDefault:0,defaultCamera:'section',quickFact:'Dashed line: normal water level.',metricGraphicSelector:'[data-geometry="bank-slope"]',metricGraphicViewBox:'25 375 380 80',metricGraphicCaption:'Bank slope · 1:4 = 25%; 1:5 = 20%',description:'Dry detention drains between events. A wet pond has permanent water below normal level, with storm storage above. Bank slope is shown separately in a metric triangle.'},
 'source-control':{categoryOptions:['Green roof','Permeable paving'],categoryPrompt:'System',categoryDefault:0,defaultCamera:'iso',description:'A vegetated roof retains water and supports evapotranspiration and roof drainage. Permeable paving admits water into aggregate voids, with subsoil and drainage checked separately.'},
};
const assumptions=['Conceptual cutaways use diagram coordinates, not metre construction dimensions. Profiles, layer proportions, process arrow positions and vegetation arrangements are assistant illustration choices. No layer depths, capacities, tank sizes, rates or wet loads are derived from this geometry. Dashed infiltration is conditional on soil and groundwater; arrow lengths do not indicate rates. The separate source slope triangle alone is metric.'];
export function stormwaterInfo(panel){if(!STORMWATER_INFO[panel])throw new Error('Unknown conceptual system');return{...STORMWATER_INFO[panel],kind:'conceptual-3d',allowedCameras:['iso','section'],cutViews:['iso','section'],noShadows:true,assumptions};}
function vegetation(group,positions){for(const [x,y,z]of positions){const shrub=createShrub();shrub.position.set(x,y,z);shrub.userData.conceptual=true;group.add(shrub);}}
function cut(group,profile,role,capRole,name){return conceptualCut(group,{profile,role,capRole,name});}
function arrow(group,name,from,to,conditional=false){return processArrow(group,{name,from,to,conditional});}
function rainGarden(){
 const group=new THREE.Group(),sections=[];
 sections.push(cut(group,[[-4,-1.3],[4,-1.3],[4,.8],[2.8,.8],[1.8,0],[1.8,-.8],[-1.8,-.8],[-1.8,0],[-2.8,.8],[-4,.8]],'soil','cutSoil','ground'));
 const filter=cut(group,rectangleProfile(-1.8,-.8,1.8,0),'filter','filter','filter');sections.push(filter);
 sections.push(cut(group,[[-1.8,0],[1.8,0],[2.4,.48],[-2.4,.48]],'water','cutWater','temporary-water'));
 vegetation(group,[[-3.1,.8,-1.3],[3.1,.8,-1.3],[-1.1,0,-1.2],[.5,0,-1.3]]);
 arrow(group,'inflow',[-4.8,1,.04],[-2.8,1,.04]);arrow(group,'infiltration',[0,-.82,.04],[0,-1.9,.04],true);arrow(group,'drain', [1.5,-.65,.04],[4.8,-.65,.04]);
 return{group,sections,labels:[{point:[-3.7,1,.04],text:'Inflow'},{point:[0,-.4,0],text:'Planted filter'},{point:[0,-1.6,.04],text:'Infiltration?'},{point:[4.1,-.65,.04],text:'Drain / overflow'}],capAnchors:[{solid:filter,point:[0,-.4,0]}]};
}
function swale(){
 const group=new THREE.Group(),sections=[];
 sections.push(cut(group,[[-4,-1.1],[4,-1.1],[4,.8],[2.8,.8],[1.5,0],[-1.5,0],[-2.8,.8],[-4,.8]],'soil','cutSoil','ground'));
 const water=cut(group,[[-1.5,0],[1.5,0],[2.1,.37],[-2.1,.37]],'water','cutWater','temporary-water');sections.push(water);
 vegetation(group,[[-3.1,.8,-.8],[3.1,.8,-1.6]]);
 arrow(group,'inflow',[-4.8,1,.04],[-2.8,1,.04]);arrow(group,'conveyance',[0,.5,-2.2],[0,.5,.35]);arrow(group,'overflow',[2.9,.8,.04],[4.8,.8,.04]);
 return{group,sections,labels:[{point:[-3.7,1,.04],text:'Inflow'},{point:[0,.5,.2],text:'Along-route flow'},{point:[0,.2,0],text:'Temporary storage'},{point:[4.1,.8,.04],text:'Overflow'}],capAnchors:[{solid:water,point:[0,.2,0]}]};
}
function basin(wet){
 const group=new THREE.Group(),sections=[];
 sections.push(cut(group,[[-4.5,-1.2],[4.5,-1.2],[4.5,1.2],[3.6,1.2],[1.8,-.6],[-1.8,-.6],[-3.6,1.2],[-4.5,1.2]],'soil','cutSoil','ground'));
 const lower=[[-1.8,-.6],[1.8,-.6],[2.4,0],[-2.4,0]],upper=[[-2.4,0],[2.4,0],[3.1,.7],[-3.1,.7]];
 let permanent=null;if(wet){permanent=cut(group,lower,'permanentWater','permanentWater','permanent-water');sections.push(permanent);}
 const storage=cut(group,wet?upper:[[-1.8,-.6],[1.8,-.6],[3.1,.7],[-3.1,.7]],'water','cutWater','storm-storage');sections.push(storage);
 const normal=wet?0:-.6;outline(group,[[-(wet?2.4:1.8),normal,.03],[wet?2.4:1.8,normal,.03]],'normal-level').userData.normalLevel=true;
 vegetation(group,[[-3.9,1.2,-1.1],[3.9,1.2,-1.5]]);
 arrow(group,'inlet',[-5.1,1.4,-1.6],[-3.6,1.4,-1.6]);arrow(group,'controlled-outlet',[1.8,normal+.08,.04],[5,normal+.08,.04]);arrow(group,'overflow',[3.7,1.1,.04],[5.1,1.1,.04]);
 const labels=[{point:[0,.4,0],text:wet?'Storm storage':'Temporary storage'},...(wet?[{point:[0,-.3,0],text:'Permanent water'}]:[]),{point:[4.4,normal+.08,.04],text:'Controlled outlet'},{point:[4.4,1.1,.04],text:'Overflow'}];
 return{group,sections,labels,capAnchors:[{solid:storage,point:[0,.4,0]},...(wet?[{solid:permanent,point:[0,-.3,0]}]:[])]};
}
function roof(){
 const group=new THREE.Group(),sections=[];
 sections.push(cut(group,rectangleProfile(-4,-1.1,4,-.65),'buildingAlt','buildingAlt','roof-deck'));
 const substrate=cut(group,rectangleProfile(-4,-.65,4,0),'soil','cutSoil','substrate');sections.push(substrate);
 vegetation(group,[[-3,0,-1.3],[-1,0,-1.3],[1,0,-1.3],[3,0,-1.3]]);
 arrow(group,'rainfall',[0,1.9,-1],[0,.65,-1]);arrow(group,'evapotranspiration',[-2,.65,.04],[-2,1.9,.04]);arrow(group,'roof-drainage',[3.4,-.6,.04],[5,-.6,.04]);
 return{group,sections,labels:[{point:[-1,.3,-1.3],text:'Vegetation'},{point:[0,-.3,0],text:'Substrate'},{point:[-2,1.5,.04],text:'Evapotranspiration'},{point:[4.4,-.6,.04],text:'Roof drainage'}],capAnchors:[{solid:substrate,point:[0,-.3,0]}]};
}
function paving(){
 const group=new THREE.Group(),sections=[];
 const subsoil=cut(group,rectangleProfile(-4,-1.4,4,-.85),'soil','cutSoil','subsoil');sections.push(subsoil);
 const aggregate=cut(group,rectangleProfile(-4,-.85,4,-.15),'subsoil','cutPaving','aggregate');sections.push(aggregate);
 for(let i=0;i<8;i++)sections.push(cut(group,rectangleProfile(-4+i,-.15,-3.1+i,.12),'paving','cutPaving','paver-'+i));
 // Isolated blue pores identify void storage; the aggregate block itself is not water.
 for(const x of [-3,-2,-1,0,1,2,3])for(const y of [-.36,-.65]){const pore=new THREE.Mesh(new THREE.CircleGeometry(.10,8),new THREE.MeshLambertMaterial());pore.userData.role='cutWater';pore.userData.voidSymbol=true;pore.position.set(x,y,.003);group.add(pore);}
 arrow(group,'percolation',[-.05,1.1,.04],[-.05,-.6,.04]);arrow(group,'drainage',[3.1,-.65,.04],[5,-.65,.04]);
 return{group,sections,labels:[{point:[1.3,.1,0],text:'Permeable surface'},{point:[0,-.45,0],text:'Aggregate voids'},{point:[-2,-1.1,0],text:'Subsoil'},{point:[4.4,-.65,.04],text:'Drainage'}],capAnchors:[{solid:aggregate,point:[0,-.45,0]},{solid:subsoil,point:[-2,-1.1,0]}]};
}
export function conceptualStormwaterScene(panel){
 const factories=panel==='rain-gardens'?[rainGarden,swale]:panel==='ponds'?[()=>basin(false),()=>basin(true)]:panel==='source-control'?[roof,paving]:null;if(!factories)throw new Error('Unknown conceptual system');
 const group=new THREE.Group(),models=factories.map(f=>f());models.forEach(m=>group.add(m.group));
 const model={group,dimensions:[],labels:[],sections:[],coordinateUnits:'diagram',meta:{target:[0,0,0],camera:[.6,.7,1.8]},comparison:{id:'conceptual-'+panel,bounds:{min:[-5.3,-2,-2.5],max:[5.3,2.1,.5]}}};
 model.setCategory=value=>{if(!Number.isInteger(value)||value<0||value>1)throw new RangeError('Unknown conceptual option');models.forEach((m,i)=>m.group.visible=i===value);const m=models[value];model.labels=m.labels;model.sections=m.sections;model.capAnchors=m.capAnchors;model.category=value;group.updateMatrixWorld(true);for(const a of m.capAnchors)if(!validateCapAnchor(a.solid,a.point))throw new Error('Conceptual cap anchor outside face');};
 model.setCategory(0);return model;
}
