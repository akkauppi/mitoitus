import * as THREE from 'three';
import {createPerson} from '../../assets.js';
import {box,surfaceStrip,flatArrow,outline} from '../primitives/surfaces.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
export const CONNECTION_INFO={
 'crossing-refuge':{defaultCamera:'plan',allowedCameras:['iso','plan'],caseTitle:'CROSSING REFUGE · PLAN EXAMPLE',description:'Two 3 metre lanes plus a 2.5 metre refuge: 8.5 metres along the crossing.',explanation:['Refuge depth is along the crossing. White stripes follow the road; stripe/gap 0.5 m. Opening width 4 m and island length 8 m are example values.','The refuge adds to both traffic lanes. Keep the crossing opening clear; tactile details, sightlines, drainage and onward footways need coordination.'],assumptions:['Original opening/length example retained, including its offset along the island. Ground relief, 0.06 m island relief and short onward footway fragments are illustrations, not kerb or junction specifications.']},
 'clear-route-continuity':{defaultCamera:'plan',allowedCameras:['iso','plan'],caseTitle:'PINCH POINT · PLAN EXAMPLE',description:'2.5 metre pavement minus assumed 1.1 metre intrusion leaves 1.4 metres clear.',explanation:['2.5 − 1.1 = 1.4 m < 1.5 m. Nominal pavement width is not clear passage.','Measure the narrowest usable space, including furniture, door swings, branches, signs and seasonal snow. Outdoor pedestrian values are distinct from cycling, tram and vehicle envelopes.'],assumptions:['Path length 12 m, obstacle length 1.4 m and encroachment 1.1 m are existing illustration assumptions. Obstacle height 0.8 m and base relief are illustrative.']},
 'clear-route-continuity-height':{defaultCamera:'front',allowedCameras:['iso','front'],caseTitle:'CLEAR HEIGHT · PAIRED ELEVATIONS',description:'Pedestrian route clear height at least 2.2 metres; under building or building part at least 3 metres recommended. One metric scale.',explanation:['Route: ≥2.2 m clear height. Under building / building part: ≥3 m recommended. These are distinct contexts, not interchangeable limits.','Both elevations share one scale; people are 1.75 m, placed beside the measured openings. This is an elevation, not a cut section.'],assumptions:['Height-envelope horizontal width 3 m is the existing illustration assumption. Canopy thickness 0.16 m, slab depth 1.5 m and ground relief are illustrative; no structural or construction detail is prescribed.']},
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
  box(group,12,.24,2.5,0,-.18,0,'soil','path-base');surfaceStrip(group,{width:12,length:2.5,name:'pavement'});
  box(group,1.4,.8,1.1,-7/15,.4,-.7,'vehicle','obstacle');
  outline(group,[[-7/6,.008,-.15],[7/30,.008,-.15],[7/30,.008,1.25],[-7/6,.008,1.25],[-7/6,.008,-.15]],'clear-passage');
  dimensions.push(dim([6,0,-1.25],[6,0,1.25],'2.5 m total',[.7,0,0]),dim([7/30,0,-.15],[7/30,0,1.25],'1.4 m clear',[1,0,0]),dim([-7/15,.8,-1.25],[-7/15,.8,-.15],'1.1 m intrusion',[0,.2,0]));
  labels.push({point:[-7/15,.8,-.7],text:'Obstacle'},{point:[-.4,0,.55],text:'Clear passage'});
  measurement={width:2.5,intrusion:1.1,clear:1.4,length:12,obstacleLength:1.4};
 }else if(panel==='clear-route-continuity-height'){
  for(const [x,height,name]of [[-2.5,2.2,'route'],[2.5,3,'building']]){
   box(group,4.4,.24,1.5,x+(x<0?-.4:.4),-.18,0,'soil',name+'-base');
   surfaceStrip(group,{width:3,length:1.5,x,name:name+'-floor'});
   box(group,3,.16,1.5,x,height+.08,0,'paving',name+'-canopy');
   outline(group,[[x-1.5,0,.75],[x-1.5,height,.75],[x+1.5,height,.75],[x+1.5,0,.75]],name+'-envelope');
   const person=createPerson();person.position.set(x<0?-4.6:4.6,0,0);group.add(person);
   dimensions.push(dim([x+1.5,0,.75],[x+1.5,height,.75],name==='route'?'≥2.2 m':'≥3 m recommended',[.3,0,0]));
   labels.push({point:[x,height,.75],text:name==='route'?'Route clearance':'Under building'});
  }
  measurement={routeHeight:2.2,buildingHeight:3,width:3};target=[0,1.5,0];
 }else throw new Error('Unknown connection scene');
 group.updateMatrixWorld(true);return {group,dimensions,labels,measurement,meta:{target,camera}};
}
