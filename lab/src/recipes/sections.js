import * as THREE from 'three';
import {createPerson,createTree,createCar} from '../../assets.js';
import {box,outline} from '../primitives/surfaces.js';
import {buildingMass} from '../primitives/massing.js';
import {plotSurface,footprint} from '../primitives/footprints.js';
import {cutPrism,solidPrism,rectangleProfile,validateCapAnchor} from '../primitives/sections.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
export const FAR_EXAMPLES=[{coverage:.5,floors:2,depth:16},{coverage:.25,floors:4,depth:8},{coverage:.125,floors:8,depth:4}];
export const SECTION_INFO={
 'section-ratio':{heightDimensionsOpposite:true,defaultCamera:'section',allowedCameras:['section','iso'],cutViews:['section','iso'],noShadows:true,caseTitle:'THREE INDEPENDENT STREET SECTIONS · ONE SCALE',description:'Three sections: height 12 metres in every example, facade widths 12, 24 and 36 metres; width/height 1, 2 and 3.',sectionNote:'The section cuts through the middle; the front half is removed. Each comparison has its own local ground datum at 0 m. Rows are separate diagrams, not terrain levels.',explanation:['H = 12 m throughout. Façade-to-façade W = 12 / 24 / 36 m, so W/H = 1 / 2 / 3. All three sections share one metric scale.','Street-space width includes the whole space between façades; these comparisons prescribe no traffic-lane allocation or preferred ratio.'],assumptions:['Nominal building-strip width 3 m follows the original illustration. Longitudinal prism extent 16 m (8 m retained behind the cut), scale-context placement, diagram-row separation and base relief are illustrative. Trees 5 m, people 1.75 m and car body 5 × 1.8 m provide illustrative scale. No metre storey heights or floor counts are inferred.']},
 'equal-density':{quickFact:'512 × 2 = 256 × 4 = 128 × 8 = 1,024 m².',defaultCamera:'iso',allowedCameras:['iso','plan'],noShadows:true,caseTitle:'EQUAL FLOOR AREA · ONE SCALE',description:'Three 32 by 32 metre plots. Coverage 50, 25 and 12.5 percent times 2, 4 and 8 floors each yields 1024 square metres and FAR 1.',explanation:['Every plot: 32 × 32 m = 1,024 m². Footprints: 512 / 256 / 128 m²; 2 / 4 / 8 identical floors give 1,024 m² floor area in each case.','Plans and 3D share metric geometry. Each diagram has its own ground datum. Building heights assume 3 m per floor for illustration; this is not a source specification or a daylight, population or usable-open-space result.'],floorExamples:FAR_EXAMPLES,assumptions:['These are the retained editorial geometry examples. Flat footprint relief is decorative. User requested 3D massing with scale context: assumed floor-to-floor height 3 m, trees 5 m, people 1.75 m and cars 5 × 1.8 m. Actual counted floor areas and land-area denominators must be checked separately.']},
 steps:{retainedGraphicSelector:'figure svg',defaultCamera:'iso',allowedCameras:['iso','plan','section'],cutViews:['section'],caseTitle:'SIX-STEP FLIGHT · ILLUSTRATIVE LANDING',description:'The original six steps, each 0.12 metre rise and 0.42 metre tread, at equal metric scales; source minimum width 1.2 metres.',sectionNote:'The section cuts lengthways through the middle of the stair. Front half removed; the full stair width is 1.2 m. Hatching marks the actual cap.',explanation:['Six identical rises/treads: 0.12 m / 0.42 m. Outdoor relation: 2 × rise + tread = 0.66 m; covered/heated stairs use the separate 0.63 m relation.','The final tread forms part of the complete 1.2 m illustrative landing. A cut fragment shows the following flight; this does not prescribe a landing after six steps. Handrails, guarding, landings and a continuous accessible alternative still need coordination.'],assumptions:['The 1.2 m landing length, cut continuation and 1.75 m person are illustration assumptions; the source resting-landing recommendation remains every 10–15 steps. Ground relief is decorative. The edge cue is a graphic line, not a dimensioned contrast strip or complete stair design.']},
};
// Paired zigzags denote cropped building backs; the street facades stay straight.
export function brokenBuildingProfile(left,right,side){
 if(side==='left')return [[left,0],[right,0],[right,12],[left,12],[left,8],[left-.3,7.65],[left+.3,7.3],[left,6.95],[left,5],[left-.3,4.65],[left+.3,4.3],[left,3.95]];
 return [[left,0],[right,0],[right,3.95],[right+.3,4.3],[right-.3,4.65],[right,5],[right,6.95],[right+.3,7.3],[right-.3,7.65],[right,8],[right,12],[left,12]];
}
export function ratioScene(){
 const group=new THREE.Group(),dimensions=[],labels=[],sections=[],anchors=[];
 for(const [index,width]of [12,24,36].entries()){
  const row=new THREE.Group();row.name='ratio-'+(index+1);row.position.y=(2-index)*18;row.userData={width,height:12,ratio:width/12,localGround:0,displayRow:index};group.add(row);const y=row.position.y;
  for(const [left,right,name]of [[-21,-18,'left'],[-18+width,-15+width,'right']]){
   const solid=cutPrism(row,{profile:brokenBuildingProfile(left,right,name==='left'?'left':'right'),zMin:-8,zMax:8,role:'sectionExterior',capRole:'cutBuilding',name:name+'-cut',hatch:.65,croppedSide:name==='left'?'left':'right'});sections.push(solid);
  }
  cutPrism(row,{profile:rectangleProfile(-21,-.24,-15+width,0),zMin:-8,zMax:8,role:'soil',capRole:'cutSoil',name:'ground-cut',hatch:.45});
  outline(row,[[-21,.015,0],[-15+width,.015,0]],'section-plane-line');
  const tree=createTree(),car=createCar(),person=createPerson({pose:'walking'});tree.position.set(-16,0,-4);car.position.set(-18+width/2,0,-4);person.position.set(-20+width,0,-2);row.add(tree,car,person);
  labels.push({point:[-19.5,y+6,0],text:`W/H = ${index+1}`});anchors.push({solid:sections[index*2],point:[-19.5,y+6,0]});
 }
 group.updateMatrixWorld(true);if(anchors.some(a=>!validateCapAnchor(a.solid,a.point)))throw new Error('Ratio cap anchor outside cut');
 const model={group,dimensions,labels,sections,sectionAnchors:anchors,measurement:{height:12,widths:[12,24,36],ratios:[1,2,3]},comparison:{id:'width-height-sections',bounds:{min:[-24,-2,-9],max:[24,51,1]}},meta:{target:[0,24,0],camera:[.6,.45,2]}};
 model.layout=narrow=>{model.dimensions=[];[12,24,36].forEach((width,index)=>{const y=(2-index)*18,x=narrow?-21:-15+width;
  model.dimensions.push(dim([-18,y,0],[-18+width,y,0],`W = ${width} m`,[0,-1.2,0]),{...dim([x,y,0],[x,y+12,0],narrow?'12 m':'H = 12 m',[narrow?-1.4:1.4,0,0]),dimensionKind:'height',labelOffsetPx:[narrow?-24:34,0]});
 });};model.layout(false);return model;
}
export function equalDensityScene(){
 const group=new THREE.Group(),plots=[],masses=[];let plan=false,narrowLayout=false;const model={group,dimensions:[],labels:[],measurement:{plotArea:1024,floorAreas:[1024,1024,1024]},comparison:{id:'equal-floor-area',bounds:null},meta:{target:[0,8,0],camera:[.65,.8,1.4]}};
 FAR_EXAMPLES.forEach((example,i)=>{const g=new THREE.Group();g.name='far-example-'+i;g.userData={...example,plotArea:1024,footprintArea:32*example.depth,floorArea:32*example.depth*example.floors};group.add(g);plotSurface(g,{width:32,length:32,name:'plot'});const {plate}=footprint(g,{width:32,length:example.depth,z:-16+example.depth/2,name:'footprint',ground:false});masses.push(buildingMass(g,plate,{height:example.floors*3}));const tree=createTree(),car=createCar(),person=createPerson({pose:'walking'});tree.position.set(-10,0,9);car.position.set(5,0,10);person.position.set(0,0,6);g.add(tree,car,person);plots.push(g);});
 model.layout=narrow=>{
  narrowLayout=narrow;model.dimensions=[];model.labels=[];
  plots.forEach((g,i)=>{const x=narrow?0:(i-1)*40,z=narrow&&plan?(i-1)*40:0,y=narrow&&!plan?(2-i)*40:0;g.position.set(x,y,z);model.dimensions.push(dim([x-16,y,z+16],[x+16,y,z+16],'32 m plot',[0,0,2]));model.labels.push({point:[x,y+(plan?.12:FAR_EXAMPLES[i].floors*3),z-16+FAR_EXAMPLES[i].depth/2],text:`${FAR_EXAMPLES[i].coverage*100}% · ${FAR_EXAMPLES[i].floors} floors`});});
  model.comparison.bounds=narrow?(plan?{min:[-19,-.3,-59],max:[19,24,59]}:{min:[-19,-.3,-19],max:[19,87,19]}):{min:[-59,-.3,-19],max:[59,24,19]};group.updateMatrixWorld(true);
 };model.applyView=view=>{plan=view==='plan';masses.forEach(m=>m.visible=!plan);model.layout(narrowLayout);};model.layout(false);return model;
}
export const STEP_PROFILE=(()=>{const points=[[0,0],[0,.12]];for(let i=0;i<6;i++){points.push([(i+1)*.42,(i+1)*.12]);if(i<5)points.push([(i+1)*.42,(i+2)*.12]);}points.push([2.52,0]);return points;})();
export function stepsScene(){
 const group=new THREE.Group(),full=new THREE.Group(),cut=new THREE.Group();group.add(full,cut);
 // The final source tread is part of the landing, not an extra flat before it.
 const flightProfile=[...STEP_PROFILE.slice(0,-2),[2.1,0]];
 const continuationProfile=[[3.3,0],[3.3,.84],[3.72,.84],[3.72,.96],[4.14,.96],[4.14,.8],[4.06,.65],[4.22,.5],[4.06,.35],[4.14,.2],[4.14,0]];
 // A single boundary removes internal side faces and their artificial outlines.
 const joinedProfile=[...flightProfile.slice(0,-1),[3.3,.72],...continuationProfile.slice(1)];
 solidPrism(full,{profile:joinedProfile,zMin:-.6,zMax:.6,name:'full-stair',role:'paving'});
 const section=cutPrism(cut,{profile:joinedProfile,zMin:-.6,zMax:.6,name:'stair-section',role:'paving',capRole:'cutPaving',hatch:.1});
 box(group,6.5,.24,3.4,1.8,-.12,0,'soil','stair-context-base');
 const person=createPerson();person.position.set(-.7,0,1.3);group.add(person);
 const cuttingLine=outline(group,flightProfile.slice(1,-1).map(([x,y])=>[x,y+.003,0]),'section-plane-line');
 const edge=outline(group,[[.42,.242,-.6],[.42,.242,.6]],'contrast-edge-cue');
 const model={group,sections:[section],dimensions:[],labels:[],measurement:{rise:.12,tread:.42,count:6,width:1.2,mainFlightRise:.72,mainFlightRun:2.1,landingRun:1.2},meta:{target:[1.6,.7,0],camera:[1.2,.9,1.8]}};
 model.applyView=view=>{const active=view==='section';full.visible=!active;cut.visible=active;edge.visible=!active;cuttingLine.visible=active||view==='plan';
  const z=active?0:.6;
  model.dimensions=[dim([.84,.24,z],[.84,.36,z],'0.12 m rise',[.4,0,.3]),dim([.84,.36,z],[1.26,.36,z],'0.42 m tread',[0,.25,.3]),dim([2.1,.72,z],[3.3,.72,z],'1.2 m landing',[0,.25,.3])];
  if(!active)model.dimensions.push(dim([2.1,0,-.6],[2.1,0,.6],'≥1.2 m width',[.4,0,0]));
  model.labels=[{point:[.84,.30,z],text:'Riser'},{point:[1.05,.36,z],text:'Tread'},{point:[.42,.24,z],text:'Contrast edge'},{point:[2.7,.72,z],text:'Landing'}];
  if(active&&model.labels.some(l=>!validateCapAnchor(section,l.point)))throw new Error('Step anchor outside cap');
 };group.updateMatrixWorld(true);model.applyView('iso');return model;
}

export function rootSectionModel(model){
 const full=model.group,context=new THREE.Group(),cut=new THREE.Group(),group=new THREE.Group();full.name='whole-soil';cut.name='cut-soil-view';context.name='uncut-context';
 // Keep the original footway, tree, person and bench as uncut context.
 for(const child of [...full.children].slice(3))context.add(child);group.add(full,cut,context);
 const soil=cutPrism(cut,{profile:rectangleProfile(-2.5,-1,2.5,0),zMin:-2.5,zMax:2.5,role:'soil',capRole:'cutSoil',name:'soil-section',hatch:.25});
 cutPrism(cut,{profile:rectangleProfile(-2.5,-1.28,2.5,-1),zMin:-2.5,zMax:2.5,role:'subsoil',capRole:'cutSoil',name:'base-section',hatch:.25});
 cutPrism(cut,{profile:rectangleProfile(-2.5,0,2.5,.06),zMin:-2.5,zMax:2.5,role:'grass',capRole:'grass',name:'surface-section',hatch:0});
 const cuttingLine=outline(context,[[-2.5,.07,0],[2.5,.07,0]],'section-plane-line');
 const originalDimensions=model.dimensions,originalLabels=model.labels;model.group=group;model.sections=[soil];
 model.applyView=view=>{const active=view==='section';full.visible=!active;cut.visible=active;cuttingLine.visible=active||view==='plan';
  model.dimensions=active?[dim([-2.5,0,0],[2.5,0,0],'5 m',[0,0,1]),dim([2.5,0,0],[2.5,-1,0],'1 m',[1,0,0])]:originalDimensions;
  model.labels=active?[{point:[0,-.5,0],text:'25 m³ whole block'},originalLabels[1]]:originalLabels;
  if(active&&!validateCapAnchor(soil,model.labels[0].point))throw new Error('Soil anchor outside section');
 };group.updateMatrixWorld(true);model.applyView('iso');return model;
}
