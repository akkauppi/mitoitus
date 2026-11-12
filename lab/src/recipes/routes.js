import * as THREE from 'three';
import {createPerson,createCyclist,createBicycle,createWheelchairUser} from '../../assets.js';
import {box,surfaceStrip,tileRow} from '../primitives/surfaces.js';

// Total footway width and unobstructed clear widths are different quantities.
// Values/context remain the existing Espoo 2010 and SuRaKu 2008 source cases.
export const WALKING_CASES=Object.freeze([
 {width:2.5,measure:'total-footway',label:'Total footway',caseTitle:'ESPOO 2010 · TOTAL FOOTWAY WIDTH',description:'Basic footway: 2.5 m total path width.'},
 {width:1.5,measure:'clear-passage',label:'Clear passage',caseTitle:'SuRaKu 2008 · UNOBSTRUCTED PASSAGE',description:'Clear passage: at least 1.5 m unobstructed width.'},
 {width:1.8,measure:'wheelchair-passing',label:'Passing width',caseTitle:'SuRaKu 2008 · WHEELCHAIR PASSING',description:'Wheelchair passing: at least 1.8 m clear width.'},
 {width:2.3,measure:'maintenance',label:'Maintenance',caseTitle:'SuRaKu 2008 · MAINTENANCE CLEAR WIDTH',description:'Machine maintenance: at least 2.3 m clear width.'},
]);
export const WALKING_WIDTHS=WALKING_CASES.map(option=>option.width);
export function routeCaseInfo(panel,index){
 if(panel!=='walking')return {};
 const option=WALKING_CASES[index];if(!option)throw new RangeError('Unknown walking variant');
 return {caseTitle:option.caseTitle,description:option.description,measurementType:option.measure};
}
export const CYCLING_WIDTHS=[1.75,2.5,3.5,3,4];
// Union of all nine route examples, their actors and dimension offsets. This is
// a framing envelope, not a clearance volume or another adopted dimension.
export const ROUTE_FRAME={min:[-2,-.30,-3],max:[2,1.85,3.9]};
export const ROUTE_ASSUMPTIONS=['Longitudinal extent 6 m and decorative ground thickness are illustration assumptions. People 1.75 m, riders 1.65 m with 0.60 m bars. Manual chair/user dimensions .72 × 1.20 m and 1.35 m seated height are illustration assumptions. Actor placement does not verify capacity or clearance.'];
function place(group,object,x,z,rotation=0){object.position.set(x,0,z);object.rotation.y=rotation;group.add(object);}
function arrow(group,x,z,reverse=false){
 // Direction mark is flat and does not enlarge the measured strip.
 const shape=new THREE.Shape();shape.moveTo(-.12,-.25);shape.lineTo(.12,-.25);shape.lineTo(.12,.05);shape.lineTo(.28,.05);shape.lineTo(0,.38);shape.lineTo(-.28,.05);shape.lineTo(-.12,.05);shape.closePath();
 const mark=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial());mark.userData.role='white';mark.rotation.x=-Math.PI/2;mark.rotation.z=reverse?0:Math.PI;mark.position.set(x,.006,z);group.add(mark);
}
export function routeScene(panel,index) {
 const walking=panel==='walking',values=walking?WALKING_WIDTHS:CYCLING_WIDTHS,width=values[index];
 if(width===undefined)throw new RangeError('Unknown route variant');
 const group=new THREE.Group();group.name=panel;
 box(group,width,.24,6,0,-.18,0,'soil','route-base');
 surfaceStrip(group,{width,length:6,role:walking?'paving':'cycle',name:'measured-route'});
 if(walking){
  const fractions=width>=1.8?[-.24,.24]:[0];fractions.forEach((f,i)=>place(group,(index===0||index===2)&&i===0?createWheelchairUser():createPerson({pose:i?'walking':'standing'}),f*width,i?1.2:-.7));
 }else{
  const positions=index===0?[.5]:index<3?[.25,.75]:index===4?[.64,.85]:[.65];
  positions.forEach((f,i)=>{const x=(f-.5)*width;place(group,createCyclist(),x,i?.8:-.7,i?Math.PI:0);arrow(group,x,i?-1.8:1.8,Boolean(i));});
  if(index>=3){for(const f of index===4?[.14,.33]:[.2])place(group,createPerson({pose:'walking'}),(f-.5)*width,.8);}
 }
 const dimensions=[{a:[-width/2,0,3],b:[width/2,0,3],offset:[0,0,.8],label:`${width} m`}];
 const labels=[{point:[0,0,2.2],text:walking?WALKING_CASES[index].label:'Cycle facility'}];
 if(!walking&&index===0){
  // 0.75 m user envelope is distinct from the 1.75 m facility.
  const points=[[-.375,.01,-1.8],[-.375,1.65,-1.8],[.375,1.65,-1.8],[.375,.01,-1.8]];
  const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({dashSize:.10,gapSize:.07,color:'#758777'}));
  line.computeLineDistances();line.userData.envelope=true;group.add(line);
  dimensions.push({a:[-.375,1.65,-1.8],b:[.375,1.65,-1.8],offset:[0,.18,0],label:'0.75 m'});
  labels.push({point:[.375,1.5,-1.8],text:'User envelope'});
 }
 group.updateMatrixWorld(true);
 return {group,dimensions,labels,meta:{target:[0,.7,0],camera:[1.3,1.15,1.6]},comparison:{id:'route-widths',bounds:ROUTE_FRAME},measurement:{width,length:6,...(walking?{type:WALKING_CASES[index].measure}:{})}};
}
export function cycleParkingScene(){
 const group=new THREE.Group();
 box(group,3,.24,4,0,-.18,0,'soil','parking-base');
 surfaceStrip(group,{width:3,length:2,z:1,role:'paving',name:'handling-space'});
 for(const {x,z} of tileRow(group,{count:5,tileWidth:.6,length:2,z:-1,name:'cycle-envelope'}))place(group,createBicycle(),x,z);
 const dimensions=[{a:[-1.5,0,-2],b:[-.9,0,-2],offset:[0,0,-.6],label:'0.6 m'},
 {a:[1.5,0,-2],b:[1.5,0,2],offset:[.6,0,0],label:'4 m'},
 {a:[-1.5,0,2],b:[1.5,0,2],offset:[0,0,.6],label:'3 m'}];
 const labels=[{point:[-1.2,0,-1.9],text:'Cycle envelope'},{point:[0,0,1],text:'Handling space'}];
 group.updateMatrixWorld(true);
 return {group,dimensions,labels,meta:{target:[0,.5,0],camera:[1.3,1.15,1.6]},measurement:{cycles:5,rowArea:6,handlingArea:6,totalArea:12,areaPerCycle:2.4}};
}
