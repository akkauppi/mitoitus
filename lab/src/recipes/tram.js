import * as THREE from 'three';
import {createPerson,createBench,createTram,createTramSlice} from '../../assets.js';
import {box,surfaceStrip} from '../primitives/surfaces.js';
import {rampPrism} from '../primitives/accessibility.js';
const dim=(a,b,label,offset)=>({a,b,label,offset});
export const TRAM_INFO={
 'tram-corridor':{explanation:['Two separate reservation cases at the same scale. Tracks and cut tram sections show scale; hatched ends indicate cuts, not vehicle fronts.','Tram body width 2.4 m; inside rail gauge 1.0 m (S35). Neither defines the clearance envelope.'],defaultCamera:'plan',allowedCameras:['iso','plan'],description:'Separate eight metre Espoo reservation and six metre Helsinki draft line-section example at one scale.',assumptions:['Strip length 1.5 m and ground thickness are illustrations. Reservations are distinct source contexts; neither the rails nor a vehicle body defines an ATU clearance envelope.'],retainedTextSelector:'figure svg .sub,figure svg .small-label,figure svg .tiny'},
 'tram-width':{explanation:['Cross-section: 3.5 m platform + 5.5 m track zone + 3.5 m platform = 12.5 m.','Two 2.4 m wide trams are cut to a 5 m scene length; hatched ends are cuts. Inside rail gauge 1.0 m (S35); track centres 3 m are illustrative.'],defaultCamera:'front',allowedCameras:['iso','plan','front'],description:'Two 3.5 metre side platforms and a 5.5 metre track zone total 12.5 metres, before outer routes and buffers.',assumptions:['Longitudinal extent 5 m is illustrative. Platforms use the general-context 0.30 m height above rail datum; Helsinki normally uses 0.27 m. Furniture and person placement do not validate circulation or passenger capacity.']},
 'tram-length':{caseTitle:'LIGHT RAIL AND CITY TRAM · SEPARATE STOP CASES',explanation:['Light rail: 45 m flat passenger platform + 6 m ramp at each end = 57 m illustrated extent. Crossing waiting areas are additional.','City tram: 30 m single-stop and 61 m double-stop service lengths are separate cases, not alternative totals for the light-rail example.','Vehicle reference: each full tram body is 34 × 2.4 m. Vehicle length, flat platform length and ramp-inclusive extent are different measurements.'],defaultCamera:'iso',allowedCameras:['iso','plan'],description:'Light-rail example: 45 metre flat platform, two illustrative six metre access ramps, total 57 metres; two 34 by 2.4 metre tram bodies. Separate 30 and 61 metre city-stop comparisons share the same scale.',assumptions:['Example adjacent-level rise 0.30 m at 5% gives two 6 m ramps. Helsinki normally uses 0.27 m; this is a separate context. Nominal tram body plan is 34 × 2.4 m; the 3.4 m body height/detail and base thickness are illustrations. Additional crossing waiting areas and clearances are excluded. City-stop strips are comparisons, not substituted light-rail layouts.']},
};
// Rail heads have a 1 m clear inside gauge (S35); track centres are illustrative.
function tracks(group,length,z=0){
 for(const x of [-1.5,1.5])for(const side of [-1,1])box(group,.05,.04,length,x+side*.525,-.02,z,'metal','rail');
}
function cutTrams(group,length,z=0){
 for(const x of [-1.5,1.5]){const tram=createTramSlice({length,centerZ:1.6});tram.position.set(x,0,z);group.add(tram);}
}
function base(group,width,length,x=0,z=0,name='base'){
 return box(group,width,.24,length,x,-.18,z,'soil',name);
}
function platform(group,{x,length=45,z=0,name}){
 return box(group,3.5,.36,length,x,.12,z,'paving',name);
}
function accessRamp(group,x,z,reverse,name){
 const piece=new THREE.Group();rampPrism(piece,{run:6,rise:.3,width:3.5,startX:0,base:-.06,name});
 // Primitive rises along X; rotate to rise inward along +/- Z.
 piece.rotation.y=reverse?Math.PI/2:-Math.PI/2;piece.position.set(x,0,z);group.add(piece);return piece;
}
export function tramScene(panel){
 const group=new THREE.Group(),dimensions=[],labels=[];
 let target=[0,.5,0],camera=[1.3,1.15,1.6],measurement={};
 if(panel==='tram-corridor'){
  for(const [width,z,name,label]of [[8,-2,'espoo-reservation','Espoo · 2010'],[6,2,'helsinki-reservation','Helsinki · draft']]){
   base(group,width,1.5,0,z,name+'-base');surfaceStrip(group,{width,length:1.5,z,role:'clearance',name});
   tracks(group,1.5,z);cutTrams(group,1.5,z);
   dimensions.push(dim([-width/2,0,z+.75],[width/2,0,z+.75],`≥${width} m`,[0,0,.45]));
   labels.push({point:[0,0,z],text:label});
  }
  measurement={widths:[8,6],length:1.5};
 }else if(panel==='tram-width'){
  base(group,12.5,5);surfaceStrip(group,{width:5.5,length:5,role:'clearance',name:'track-zone'});
  tracks(group,5);cutTrams(group,5);
  platform(group,{x:-4.5,length:5,name:'left-platform'});platform(group,{x:4.5,length:5,name:'right-platform'});
  const person=createPerson({pose:'waiting'});person.position.set(-4.5,.3,-.8);group.add(person);
  const bench=createBench();bench.position.set(5.4,.3,0);group.add(bench);
  for(const [a,b,label]of [[-6.25,-2.75,'3.5 m'],[-2.75,2.75,'5.5 m'],[2.75,6.25,'3.5 m']])dimensions.push(dim([a,.3,2.5],[b,.3,2.5],label,[0,0,.8]));
  dimensions.push(dim([-6.25,0,2.5],[6.25,0,2.5],'12.5 m total',[0,-.6,1.8]));
  labels.push({point:[-4.5,.3,1.5],text:'Platform'},{point:[0,0,0],text:'Track zone'},{point:[4.5,.3,1.5],text:'Platform'});
  measurement={platformWidth:3.5,trackWidth:5.5,totalWidth:12.5,length:5,height:.3};target=[0,.7,0];
 }else if(panel==='tram-length'){
  base(group,12.5,57,0,0,'stop-base');surfaceStrip(group,{width:5.5,length:57,role:'clearance',name:'track-zone'});
  tracks(group,57);
  for(const [x,side]of [[-4.5,'left'],[4.5,'right']]){
   platform(group,{x,name:side+'-platform'});
   accessRamp(group,x,-28.5,false,side+'-approach');accessRamp(group,x,28.5,true,side+'-departure');
  }
  for(const [x,name]of [[-1.5,'first-tram'],[1.5,'second-tram']]){const tram=createTram();tram.name=name;tram.position.set(x,0,0);group.add(tram);}
  for(const [x,length,name]of [[12,30,'city-single'],[18,61,'city-pair']]){
   base(group,3.5,length,x,0,name+'-base');surfaceStrip(group,{width:3.5,length,x,role:'road',name});
   dimensions.push(dim([x+1.75,0,-length/2],[x+1.75,0,length/2],`${length} m`,[.9,0,0]));
   labels.push({point:[x,0,0],text:length===30?'City · 30 m':'City pair · 61 m'});
  }
  dimensions.unshift(dim([-6.25,.3,-22.5],[-6.25,.3,22.5],'45 m flat',[-1,0,0]),dim([-6.25,0,-28.5],[-6.25,0,28.5],'57 m example',[-3,0,0]));
  dimensions.push(dim([6.25,0,22.5],[6.25,0,28.5],'6 m ramp',[1.2,0,0]),dim([-1.5,3.4,-17],[-1.5,3.4,17],'34 m body',[0,.6,0]));
  labels.unshift({point:[-4.5,.3,0],text:'Flat platform'},{point:[4.5,.15,25.5],text:'Access ramp'});
  measurement={flatLength:45,rampRun:6,rise:.3,gradient:.05,totalLength:57,tramLength:34,tramWidth:2.4,cityLengths:[30,61]};
  target=[6,1,0];camera=[1.6,1.3,.8];
 }else throw new Error('Unknown tram panel');
 group.updateMatrixWorld(true);return{group,dimensions,labels,measurement,meta:{target,camera}};
}
