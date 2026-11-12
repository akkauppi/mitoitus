import * as THREE from 'three';
import {createBench,createPerson} from '../../assets.js';
import {box,surfaceStrip} from '../primitives/surfaces.js';
import {clearDisk,rampPrism} from '../primitives/accessibility.js';
const dimension=(a,b,label,offset)=>({a,b,label,offset});
export const ACCESSIBILITY_INFO={
 turning:{defaultCamera:'plan',allowedCameras:['iso','plan'],description:'Clear turning circles with diameters 1.5 and 2.5 metres, at the same scale.',assumptions:['Neutral tiles and their thickness are display assumptions. Circles represent clear space, not device silhouettes or swept paths.']},
 ramps:{defaultCamera:'front',allowedCameras:['iso','plan','front'],description:'A ramp rises 0.30 metres over 6 metres horizontal run, at 5 percent, followed by a 2 metre landing.',assumptions:['The example uses the existing recommended 1.2 m width. Solid base thickness and the 1.75 m scale person are illustration assumptions. Equal vertical/horizontal scales; this 5% example does not assert the separate greater-than-5% landing rule.']},
 arrival:{defaultCamera:'plan',allowedCameras:['iso','plan'],description:'Separate courtyard bay 3.6 by 5 metres and bench-end clear space 0.9 metres wide, with an illustrative 1.5 metre depth.',assumptions:['Bench-end depth 1.5 m, decorative tiles and bench dimensions are illustration assumptions. The two vignettes are independent; no transfer/lift clearance is validated.']},
};
function tile(group,{width,length,x=0,z=0,name}){
 box(group,width,.24,length,x,-.18,z,'soil',`${name}-base`);
 return surfaceStrip(group,{width,length,x,z,role:'paving',name});
}
export function accessibilityScene(panel){
 if(!ACCESSIBILITY_INFO[panel])throw new Error('Unknown accessibility panel');
 const group=new THREE.Group(),dimensions=[],labels=[];
 let target=[0,.3,0],measurement={};
 if(panel==='turning'){
  for(const [name,x,radius]of [['wheelchair',-1.75,.75],['powered-chair',1.25,1.25]]){
   tile(group,{width:2*radius+.4,length:2*radius+.4,x,name:`${name}-tile`});
   clearDisk(group,{radius,x,name});
   dimensions.push(dimension([x-radius,.006,0],[x+radius,.006,0],`Ø${2*radius} m`,[0,0,radius+.5]));
   labels.push({point:[x,.006,0],text:name==='wheelchair'?'Wheelchair':'Powered chair'});
  }
  measurement={diameters:[1.5,2.5],radii:[.75,1.25]};
 }else if(panel==='ramps'){
  rampPrism(group,{run:6,rise:.3,width:1.2,startX:-4});
  box(group,2,.48,1.2,3,.06,0,'paving','landing');
  const person=createPerson();person.position.set(3,.3,0);group.add(person);
  dimensions.push(dimension([-4,0,.6],[2,0,.6],'6 m run',[0,-.4,0]),dimension([2,0,.6],[4,0,.6],'2 m landing',[0,-.4,0]),dimension([2,0,.6],[2,.3,.6],'0.30 m rise',[2.8,0,0]));
  labels.push({point:[-1,.15,.3],text:'Ramp · 5%'},{point:[3,.3,.3],text:'Landing'});
  target=[0,.65,0];measurement={run:6,rise:.3,gradient:.05,landing:2,width:1.2};
 }else{
  tile(group,{width:3.6,length:5,x:-2.8,name:'courtyard-bay'}).userData.role='clearance';
  tile(group,{width:2.3,length:4.8,x:2.4,z:-.55,name:'bench-tile'});
  const bench=createBench();bench.position.set(2.4,0,-1.3);group.add(bench);
  box(group,.9,.004,1.5,2.4,.002,.35,'clearance','bench-end-space');
  dimensions.push(dimension([-4.6,0,2.5],[-1,0,2.5],'≥3.6 m',[0,0,.55]),dimension([-4.6,0,-2.5],[-4.6,0,2.5],'≥5 m',[-.55,0,0]),dimension([1.95,.004,1.1],[2.85,.004,1.1],'≥0.9 m',[0,0,.55]),dimension([2.85,.004,-.4],[2.85,.004,1.1],'1.5 m example',[.6,0,0]));
  labels.push({point:[-2.8,0,0],text:'Courtyard bay'},{point:[2.4,.004,.35],text:'Bench-end space'});
  target=[-.5,.3,0];measurement={bayWidth:3.6,bayLength:5,benchWidth:.9,benchDepth:1.5};
 }
 group.updateMatrixWorld(true);
 return {group,dimensions,labels,measurement,meta:{target,camera:[1.3,1.15,1.6]}};
}
