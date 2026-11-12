import * as THREE from 'three';
import {box,surfaceStrip,flatArrow,outline} from '../primitives/surfaces.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
export const CONNECTION_INFO={
 'crossing-refuge':{defaultCamera:'plan',allowedCameras:['iso','plan'],caseTitle:'CROSSING REFUGE · PLAN EXAMPLE',description:'Two 3 metre lanes plus a 2.5 metre refuge: 8.5 metres along the crossing.',explanation:['Refuge depth is along the crossing. White stripes follow the road; stripe/gap 0.5 m. Opening width 4 m and island length 8 m are example values.','The refuge adds to both traffic lanes. Keep the crossing opening clear; tactile details, sightlines, drainage and onward footways need coordination.'],assumptions:['Original opening/length example retained, including its offset along the island. Ground relief, 0.06 m island relief and short onward footway fragments are illustrations, not kerb or junction specifications.']},
 'clear-route-continuity':{defaultCamera:'iso',allowedCameras:['iso','plan','front'],caseTitle:'ONE CONTINUOUS CLEAR CORRIDOR',description:'A continuous 1.5 metre clear pedestrian corridor with 2.2 metre overhead clearance and a separate 3 metre under-building recommendation.',explanation:['Keep width and height clear together, along the whole route. The blue ribbon shows ≥1.5 m clear width; the widened passing place shows ≥1.8 m.','Ordinary pedestrian clear height: ≥2.2 m. Under a building or building part: ≥3 m recommended. These remain distinct contexts. Furniture sits outside the clear ribbon.'],assumptions:['Assistant illustration draft. Route segment 6 m, pavement width 2.5 m, passing-place length 1.2 m, furniture, suspended overhead fragments and ground relief are assumed. Their layout illustrates the retained source dimensions, not a complete compliant design.']},
};
export function connectionScene(panel){
 const group=new THREE.Group(),dimensions=[],labels=[];let measurement,target=[0,.5,0],camera=[1.3,1.15,1.6];
 if(panel==='crossing-refuge'){
  box(group,11.3,.24,8,0,-.18,0,'soil','crossing-base');
  for(const [side,x]of [['left',-2.75],['right',2.75]]){
   surfaceStrip(group,{width:3,length:8,x,role:'road',name:side+'-lane'});
   for(let i=0;i<3;i++)box(group,.5,.004,4,(side==='left'?-4.25:1.25)+.25+i,.002,2/3,'white',`${side}-stripe-${i}`);
   flatArrow(group,{x,z:-2.8,rotation:side==='left'?0:Math.PI,length:1,width:.35,name:side+'-traffic'});
  }
  surfaceStrip(group,{width:2.5,length:4,z:2/3,role:'paving',name:'refuge-opening'});
  box(group,2.5,.12,8/3,0,0,-8/3,'grass','north-island');box(group,2.5,.12,4/3,0,0,10/3,'grass','south-island');
  for(const x of [-4.95,4.95])surfaceStrip(group,{width:1.4,length:4,x,z:2/3,role:'paving',name:'onward-footway'});
  flatArrow(group,{x:0,z:1.2,rotation:Math.PI/2,length:10.8,width:.25,name:'walking-direction',role:'metal'});
  dimensions.push(dim([-1.25,0,-4],[1.25,0,-4],'≥2.5 m',[0,0,-.7]),dim([-4.25,0,4],[4.25,0,4],'8.5 m total',[0,0,1]),dim([-4.25,0,-4],[-1.25,0,-4],'3 m lane',[0,0,-.7]),dim([1.25,0,-4],[4.25,0,-4],'3 m lane',[0,0,-.7]));
  labels.push({point:[0,0,0],text:'Refuge'},{point:[4.95,0,1.5],text:'Walking route'},{point:[-2.75,0,3.4],text:'Lane'},{point:[1.5,.004,1.5],text:'Zebra marking'});
  measurement={lanes:3,refuge:2.5,total:8.5,opening:4,islandLength:8,stripe:.5,gap:.5};
 }else if(panel==='clear-route-continuity'){
  box(group,6,.24,2.5,0,-.18,0,'soil','path-base');surfaceStrip(group,{width:6,length:2.5,name:'pavement'});
  box(group,6,.006,1.5,0,.003,0,'clearance','continuous-clear-ribbon');
  box(group,1.2,.008,1.8,-2,.004,0,'clearance','passing-place');
  box(group,.8,.7,.42,-.8,.35,-1.04,'furniture','furniture-outside');
  // Overhead fragments are held clear of the same route, not a separate elevation.
  box(group,.3,.12,1.5,-.3,2.26,0,'metal','ordinary-overhead');
  box(group,1,.16,2.5,1.7,3.08,0,'paving','building-overhead');
  for(const x of [-3,.6,2.8])outline(group,[[x,0,-.75],[x,2.2,-.75],[x,2.2,.75],[x,0,.75]],'clear-envelope');
  dimensions.push(dim([-3,0,-.75],[-3,0,.75],'≥1.5 m clear',[-.6,0,0]),dim([-2,0,-.9],[-2,0,.9],'≥1.8 m passing',[0,0,0]),dim([-.3,0,.75],[-.3,2.2,.75],'≥2.2 m clear',[.7,0,0]),dim([1.7,0,1.25],[1.7,3,1.25],'≥3 m recommended',[.8,0,0]));
  labels.push({point:[-1.2,.008,.4],text:'Clear corridor'},{point:[-.8,.7,-1.04],text:'Furniture outside'},{point:[-.3,2.2,0],text:'Overhead clearance'},{point:[1.7,3,0],text:'Under building'});
  measurement={clearWidth:1.5,passingWidth:1.8,routeHeight:2.2,buildingHeight:3,length:6,pavementWidth:2.5};target=[0,1.3,0];camera=[-2.6,1.6,1.1];
 }else throw new Error('Unknown connection scene');
 group.updateMatrixWorld(true);return {group,dimensions,labels,measurement,meta:{target,camera}};
}
