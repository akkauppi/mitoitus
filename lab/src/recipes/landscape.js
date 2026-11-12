import * as THREE from 'three';
import {createTree,createShrub,createPerson} from '../../assets.js';
import {box,surfaceStrip,flatArrow} from '../primitives/surfaces.js';
import {cutPrism,solidPrism,rectangleProfile,validateCapAnchor} from '../primitives/sections.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
export const PLANTING_CASES=[{name:'Tree strip',width:3},{name:'Main street',width:3.5},{name:'Low shrubs',width:2.5},{name:'Ground cover',width:2}];
export const LANDSCAPE_INFO={
 ground:{categoryOptions:PLANTING_CASES.map(c=>c.name),defaultCamera:'iso',allowedCameras:['iso','plan'],noShadows:true,caseTitle:'FOUR MINIMUM WIDTHS · ONE SCALE',description:'Planting strips at one scale: tree strip at least 3 metres; main street tree strip 3.5; low shrubs 2.5; lawn or ground cover 2 metres.',explanation:['Tree strip ≥3.0 m; main street ≥3.5 m; low shrubs ≥2.5 m; lawn / ground cover ≥2.0 m. All four share one scale. The 6 m lengths and separate diagram rows are illustrative, not terrain levels; width does not establish root volume.','Coordinate mature crowns, visibility and wires above ground; roots, drainage and utilities below ground; snow storage, salt and access in winter.'],assumptions:['Tree height 5 m / crown 3 m, shrub height 0.6 m / crown 0.9 m, person 1.75 m and low ground-cover relief are illustration assumptions, not species or clearance specifications. Decorative 0.24 m bases are not specified soil depths or storage volumes.']},
 stormwater:{quickFact:'6 × 5 × 0.20 m = 6 m³.',defaultCamera:'iso',allowedCameras:['iso','plan','section'],cutViews:['section','iso'],noShadows:true,caseTitle:'6 m³ · IDEALISED RECTANGULAR STORAGE',description:'Six by five metre water prism, 0.20 metre effective depth: 30 square metres times 0.20 metres equals 6 cubic metres. No vertical exaggeration.',sectionNote:'The front half is removed in 3D and Section. Whole example: 6 × 5 × 0.20 m = 6 m³; the visible half is 3 m³, not a smaller required storage volume. All axes use equal metre scale.',retainedGraphicSelector:'figure svg',retainedGraphicCaption:'Source plan and depth profile · equal metric axes',explanation:['600 m² impermeable catchment × the example provision of 1 m³ / 100 m² = 6 m³. At the assumed 0.20 m effective depth this requires 30 m²: the illustrated 6 × 5 m rectangle.','Inlet and controlled overflow are schematic symbols, not hydraulic designs. The rectangle excludes side slopes, freeboard and maintenance space. Check soil, groundwater, design rainfall and the applicable zoning provision; the Espoo example is not the rule for this site.'],assumptions:['The rectangular footprint and effective depth are the retained idealised example, not a basin construction section. Arrow positions and shapes, the 1.75 m scale person and the decorative support base are illustration assumptions. Only the water prism is counted as storage. No flow rate, outlet level or pipe size is specified.']},
};
export function plantingScene(){
 const group=new THREE.Group(),rows=[];let plan=false,narrow=false,category=-1;
 PLANTING_CASES.forEach((item,i)=>{const row=new THREE.Group();row.name='planting-'+i;row.userData={width:item.width,length:6,localGround:0};group.add(row);
  box(row,item.width,.24,6,0,-.18,0,'soil','decorative-base').userData.decorative=true;
  surfaceStrip(row,{width:item.width,length:6,role:'grass',name:'strip'});
  if(i<2)row.add(createTree());
  else if(i===2)for(const z of [-1.8,0,1.8]){const shrub=createShrub();shrub.position.z=z;row.add(shrub);}
  else for(const x of [-.5,.5])for(const z of [-2,-1,0,1,2])box(row,.45,.025,.5,x,.0125,z,'foliage','ground-cover').userData.decorative=true;
  rows.push(row);
 });
 const model={group,dimensions:[],labels:[],measurement:{widths:PLANTING_CASES.map(c=>c.width),length:6},meta:{target:[0,2,0],camera:[.5,.8,1.6]},comparison:{id:'planting-widths',bounds:null}};
 model.layout=isNarrow=>{narrow=isNarrow;model.dimensions=[];model.labels=[];
  rows.forEach((row,i)=>{const x=narrow?0:i*6,y=narrow&&!plan?(3-i)*11:0,z=narrow&&plan?i*9:0;row.position.set(x,y,z);const item=PLANTING_CASES[i];row.visible=category===-1||category===i;if(!row.visible)return;
   model.dimensions.push(dim([x-item.width/2,y,z+3],[x+item.width/2,y,z+3],`≥${item.width.toFixed(1)} m`,[0,0,1]));model.labels.push({point:[x+item.width/2,y-.025,z+1.5],text:item.name});
  });
  model.comparison.bounds=narrow?(plan?{min:[-2.2,-.4,-3.5],max:[2.2,5.2,31.5]}:{min:[-2.2,-.4,-3.5],max:[2.2,38.2,4.5]}):{min:[-2.2,-.4,-3.5],max:[20.2,5.2,4.5]};group.updateMatrixWorld(true);
 };model.setCategory=value=>{if(!Number.isInteger(value)||value< -1||value>3)throw new RangeError('Unknown planting category');category=value;model.layout(narrow);};model.applyView=view=>{plan=view==='plan';model.layout(narrow);};model.layout(false);return model;
}
export function storageScene(){
 const group=new THREE.Group(),full=new THREE.Group(),cut=new THREE.Group();group.add(full,cut);
 const profile=rectangleProfile(-3,-.2,3,0);
 solidPrism(full,{profile,zMin:-2.5,zMax:2.5,role:'water',name:'whole-water'});
 const water=cutPrism(cut,{profile,zMin:-2.5,zMax:2.5,role:'water',capRole:'cutWater',name:'water-section',hatch:.16});
 box(full,6,.24,5,0,-.32,0,'subsoil','decorative-support').userData.decorative=true;
 cutPrism(cut,{profile:rectangleProfile(-3,-.44,3,-.2),zMin:-2.5,zMax:2.5,role:'subsoil',capRole:'cutSoil',name:'support-section',hatch:.3}).userData.decorative=true;
 const symbols=new THREE.Group();group.add(symbols);
 flatArrow(symbols,{x:-3.7,z:-1.5,rotation:Math.PI/2,length:1,width:.35,name:'inlet',role:'water'});
 flatArrow(symbols,{x:3.7,z:-1.5,rotation:Math.PI/2,length:1,width:.35,name:'overflow',role:'metal'});
 const person=createPerson();person.position.set(-4.7,0,-1);symbols.add(person);
 const model={group,dimensions:[],labels:[],sections:[water],measurement:{width:6,length:5,depth:.2,area:30,volume:6,catchment:600,provision:1/100},meta:{target:[0,0,0],camera:[.8,.7,1.7]}};
 model.applyView=view=>{const section=view!=='plan',side=view==='section';full.visible=!section;cut.visible=section;symbols.visible=!side;
  const z=section?0:2.5;
  model.dimensions=[dim([-3,0,z],[3,0,z],'6 m',[0,0,side?0:1.6])];
  if(side)model.dimensions[0].offset=[0,.45,0];
  if(!side)model.dimensions.push(dim([3,0,-2.5],[3,0,section?0:2.5],section?'2.5 m shown':'5 m',[.65,0,0]));
  if(section)model.dimensions.push(dim([-3,-.2,0],[-3,0,0],'0.20 m',[-.7,0,.1]));
  model.labels=side?[{point:[0,-.1,0],text:'6 m³ whole prism'}]:[{point:[0,section?-.1:0,section?0:0.8],text:'6 m³ whole prism'},{point:[-3.7,.01,-1.5],text:'Inlet'},{point:[3.7,.01,-1.5],text:'Controlled overflow'}];
  group.updateMatrixWorld(true);if(section&&!validateCapAnchor(water,model.labels[0].point))throw new Error('Storage cap anchor outside water');
 };model.applyView('iso');return model;
}
