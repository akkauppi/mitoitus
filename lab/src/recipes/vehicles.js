import * as THREE from 'three';
import {createCar,createBus} from '../../assets.js';
import {box,surfaceStrip} from '../primitives/surfaces.js';
export const LANE_FRAME={min:[-4,-.3,-10],max:[4,3.2,11]};
const dimension=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
export function vehicleInfo(panel,index){
 const rescue=panel==='rescue',bus=panel==='bus-turn';
 if(index<0||index>(rescue?0:2))throw new RangeError('Unknown vehicle variant');
 return {defaultCamera:'plan',allowedCameras:['plan','iso'],
 description:rescue?'Rescue radius references and separate set-up footprint.':`${bus?'Bus':'Car'} ${index?'lane comparison':'radius reference and detached body'}.`,
 caseTitle:rescue?'HIKLU 2024 · v1.3 · TURNING AND SET-UP':index?`${index} ${index===1?'LANE':'LANES'} · ESPOO 2010`:'TKK 2007 · RADIUS REFERENCE',
 explanation:rescue?['Engine and aerial turning bands and the separate set-up footprint share one metric scale here. Solid set-up: 13 × 6 m minimum; dashed target: 13 × 8 m.','Clear route: 3.5 m wide, 4.2 m high. Radius bands exclude 0.4 m driving and 1 m boom allowances. Check loads, slopes, reach, trees, wires and snow against the full guide.']:[index?'Carriageway only; kerbs, parking, buffers and other modes are additional.':'Historical geometric radius band; not a simulated vehicle swept path. The detached vehicle body does not validate the band.',bus?'Design bus body: 15 × 2.6 m, mirrors omitted. Stop service lengths 16/32 m are separate; add approach and crossing clearances.':'Car body: 5 × 1.8 m, mirrors omitted. W4 brief: No long-term private car parking.'],
 assumptions:[rescue?'Ground relief is decorative. No rescue vehicle or boom model is inferred.':'Lane segment length 18 m and ground relief are illustrative. Car height 1.5 m and bus height 3.2 m/detail are assistant illustration assumptions, not clearance specifications.']};
}
function band(group,x,z,inner,outer,name){
 const shape=new THREE.Shape();shape.moveTo(inner,0);shape.lineTo(outer,0);shape.absarc(0,0,outer,0,Math.PI/2,false);shape.lineTo(0,inner);shape.absarc(0,0,inner,Math.PI/2,0,true);shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:false,curveSegments:96}),m=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial());m.rotation.x=-Math.PI/2;m.position.set(x,-.06,z);m.userData.role='road';m.userData.radii={inner,outer};m.name=name;
 const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial());edge.userData.edge=true;m.add(edge);group.add(m);return m;
}
function radii(dimensions,x,z,inner,outer){
 dimensions.push(dimension([x,0,z],[x+inner,0,z],`R ${inner} m`,[0,0,.7]),dimension([x,0,z],[x+outer/Math.sqrt(2),0,z-outer/Math.sqrt(2)],`R ${outer} m`));
}
function dashed(group,points,name){
 const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),line=new THREE.Line(g,new THREE.LineDashedMaterial({dashSize:.35,gapSize:.22}));line.computeLineDistances();line.userData.envelope=true;line.name=name;group.add(line);return line;
}
export function vehicleScene(panel,index=0){
 const group=new THREE.Group(),dimensions=[],labels=[];let comparison,measurement={},target=[0,.5,0];
 if(panel==='rescue'){
  for(const [x,inner,outer,name,label]of [[-13,5,10.5,'engine-band','Fire engine'],[2,5.5,12.5,'aerial-band','Aerial appliance']]){band(group,x,0,inner,outer,name);radii(dimensions,x,0,inner,outer);labels.push({point:[x+outer*.65,0,-outer*.55],text:label});}
  surfaceStrip(group,{width:6,length:13,x:0,z:11.5,role:'paving',name:'setup'});box(group,8,.24,13,0,-.18,11.5,'soil','setup-base');
  dashed(group,[[-4,.01,5],[4,.01,5],[4,.01,18],[-4,.01,18],[-4,.01,5]],'setup-target');
  dimensions.push(dimension([-3,0,18],[3,0,18],'≥6 m',[0,0,1]),dimension([4,0,5],[4,0,18],'13 m',[1,0,0]),dimension([-4,0,5],[4,0,5],'8 m target',[0,0,-1]));
  labels.push({point:[0,0,12],text:'Set-up area'},{point:[-4,.01,7],text:'Target width'});measurement={engine:[5,10.5],aerial:[5.5,12.5],setup:[6,13],targetWidth:8};target=[0,0,3];
 }else{
  const bus=panel==='bus-turn',inner=bus?8.1:3,outer=bus?15.2:6.5,width=bus?3.25:3;
  const actor=()=>bus?createBus():createCar();
  if(index===0){
   band(group,0,0,inner,outer,'radius-band');radii(dimensions,0,0,inner,outer);
   const body=actor();body.rotation.y=Math.PI/2;body.position.set(outer/2,0,3);body.name='reference-body';group.add(body);
   dimensions.push(dimension([outer/2-(bus?7.5:2.5),0,4.6],[outer/2+(bus?7.5:2.5),0,4.6],bus?'15 m body':'5 m body',[0,0,.7]));
   if(bus)dimensions.push(dimension([outer/2+7.5,0,1.7],[outer/2+7.5,0,4.3],'2.6 m body',[.8,0,0]));
   labels.push({point:[outer*.65,0,-outer*.55],text:'Radius reference'},{point:[outer/2,bus?3.2:1.5,3],text:bus?'Design bus body':'Car body'});target=[outer/2,0,-outer/3];measurement={inner,outer};
  }else{
   const total=index*width;box(group,total,.24,18,0,-.18,0,'soil','lane-base');surfaceStrip(group,{width:total,length:18,role:'road',name:'carriageway'});
   for(let i=0;i<index;i++){const vehicle=actor();vehicle.position.x=(i-(index-1)/2)*width;vehicle.rotation.y=i?Math.PI:0;group.add(vehicle);}
   if(index===2)dashed(group,[[0,.01,-9],[0,.01,9]],'lane-divider');
   dimensions.push(dimension([-total/2,0,9],[total/2,0,9],`${total} m`,[0,0,1]));labels.push({point:[total/2,0,6],text:'Carriageway'});
   if(bus){const x=-(index-1)*width/2;dimensions.push(dimension([x-1.3,0,-7.5],[x+1.3,0,-7.5],'2.6 m body',[0,0,-.8]));}
   comparison={id:'vehicle-lanes',bounds:LANE_FRAME};measurement={width:total,laneWidth:width,lanes:index,length:18};target=[0,.5,0];
  }
 }
 group.updateMatrixWorld(true);return {group,dimensions,labels,comparison,measurement,meta:{target,camera:[1.3,1.15,1.6]}};
}
