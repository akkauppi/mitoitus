import * as THREE from 'three';
import {box} from './surfaces.js';
import {createTree,createCar,createPerson} from '../../assets.js';
import {plotSurface} from './footprints.js';

/** Illustrative height and facade rhythm above the original metric footprint. */
export function buildingMass(group,plate,{height,core=null}){
 const width=plate.geometry.parameters.width,length=plate.geometry.parameters.depth,x=plate.position.x,z=plate.position.z,bottom=.12;
 const mass=new THREE.Group();mass.name=plate.name+'-massing';mass.userData={schematicHeight:height,footprint:plate.name};group.add(mass);
 const fill=(a,b,c,d,role=plate.userData.role,name='body')=>{
  if(b-a<1e-6||d-c<1e-6)return;box(mass,b-a,height-bottom,d-c,x+(a+b)/2,(height+bottom)/2,z+(c+d)/2,role,name);
 };
 if(core){
  const a=core.x-core.width/2,b=core.x+core.width/2,c=core.z-core.length/2,d=core.z+core.length/2;
  // Partition the opaque body around the highlighted room: no overlapping roof faces.
  fill(-width/2,a,-length/2,length/2);fill(b,width/2,-length/2,length/2);fill(a,b,-length/2,c);fill(a,b,d,length/2);
  const room=box(mass,core.width,height-bottom+.04,core.length,x+core.x,(height+bottom+.04)/2,z+core.z,'circulation','stair-room');room.userData.schematic=true;
  for(let i=1;i<7;i++)box(mass,core.width*.65,.012,.055,x+core.x,height+.05,z+c+(d-c)*i/7,'white','stair-symbol');
  mass.userData.core={...core,top:height+.056};
 }else fill(-width/2,width/2,-length/2,length/2);
 // Simple facade glazing, physically separated from the wall to avoid Z fighting.
 const windowMaterial=()=>new THREE.MeshLambertMaterial();
 const rows=Math.max(1,Math.round(height/3));
 for(const side of [-1,1])for(let row=0;row<rows;row++){
  const y=(row+.5)*height/rows;
  for(let u=-width/2+1.5;u<width/2-.6;u+=3){
   if(core&&Math.abs(side*length/2-core.z)<=core.length/2+.01&&Math.abs(u-core.x)<core.width/2+.7)continue;
   const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.25),windowMaterial());pane.userData.role='glass';pane.userData.facade=true;pane.position.set(x+u,y,z+side*(length/2+.025));if(side<0)pane.rotation.y=Math.PI;mass.add(pane);
  }
  for(let u=-length/2+1.5;u<length/2-.6;u+=3){
   const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.25),windowMaterial());pane.userData.role='glass';pane.userData.facade=true;pane.position.set(x+side*(width/2+.025),y,z+u);pane.rotation.y=side*Math.PI/2;mass.add(pane);
  }
 }
 return mass;
}

export function externalStair(group,{x,z,height=3}){
 plotSurface(group,{width:6.8,length:1.8,x:x+.7,z,name:'external-stair-pad'}).userData.role='paving';
 const stairs=new THREE.Group();stairs.name='external-stair';stairs.userData={schematic:true,serves:'paired small-block modules'};group.add(stairs);
 const run=4.8,count=16;
 for(let i=0;i<count;i++){const h=height*(i+1)/count;box(stairs,run/count,.09,1.4,x-run/2+(i+.5)*run/count,h-.045,z,'circulation','external-tread');}
 box(stairs,1.4,.14,1.4,x+run/2+.7,height-.07,z,'circulation','external-landing');
 for(const side of [-1,1]){
  const a=new THREE.Vector3(x-run/2+.08,.16,z+side*.56),b=new THREE.Vector3(x+run/2-.08,height-.12,z+side*.56),direction=b.clone().sub(a);
  const beam=box(stairs,.08,.12,direction.length(),0,0,0,'metal','stair-stringer');beam.position.copy(a.clone().add(b).multiplyScalar(.5));beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction.normalize());
  box(stairs,.22,.12,.22,x-run/2+.08,.06,z+side*.56,'metal','stair-foot');
  for(const end of [-1,1])box(stairs,.08,height-.14,.08,x+run/2+.7+end*.55,(height-.14)/2,z+side*.55,'metal','landing-post');
 }
 const railPoints=[[x+run/2,height+1.05,z+.7],[x+run/2+1.4,height+1.05,z+.7],[x+run/2+1.4,height+1.05,z-.7]];
 const landingRail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(railPoints.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial());landingRail.userData.envelope=true;stairs.add(landingRail);
 for(const [px,pz]of [[x+run/2,z+.7],[x+run/2+1.4,z+.7],[x+run/2+1.4,z-.7]])box(stairs,.05,1.05,.05,px,height+.525,pz,'metal','landing-guard-post');
 for(const side of [-1,1]){
  const points=[new THREE.Vector3(x-run/2,height/count+1.05,z+side*.7),new THREE.Vector3(x+run/2,height+1.05,z+side*.7)];
  const rail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial());rail.userData.envelope=true;stairs.add(rail);
 }
 return stairs;
}

/** Original metric assets on separate contextual pads, outside building footprints. */
export function scaleContext(group,{trees=[],cars=[],people=[],onPlot=false}){
 for(const [kind,positions]of [['tree',trees],['car',cars],['person',people]])for(const [x,z,rotation=0]of positions){
  if(!onPlot){
   if(kind==='tree')plotSurface(group,{width:3.5,length:3.5,x,z,name:'tree-context'});
   else {const w=kind==='car'?(rotation?6:3):1.2,d=kind==='car'?(rotation?3:6):1.2;plotSurface(group,{width:w,length:d,x,z,name:kind+'-context'}).userData.role='paving';}
  }
  const actor=kind==='tree'?createTree():kind==='car'?createCar():createPerson({pose:'walking'});actor.position.set(x,0,z);actor.rotation.y=rotation;group.add(actor);
 }
}


/** User-requested luhtitalo gallery; all dimensions and guard details are illustrative. */
export function entranceGallery(group,{x=-8,wallZ=-15,width=36,depth=1.6,level=3,stairs=[-17,1]}){
 const gallery=new THREE.Group();gallery.name='entrance-gallery';gallery.userData={schematic:true,level,depth};group.add(gallery);
 plotSurface(group,{width,length:depth,x,z:wallZ+depth/2,name:'gallery-ground'}).userData.role='paving';
 box(gallery,width,.16,depth,x,level-.08,wallZ+depth/2,'paving','gallery-deck');
 const front=wallZ+depth,gaps=stairs.map(s=>[s+2.4,s+3.8]);
 let cursor=x-width/2;
 for(const [a,b]of [...gaps,[x+width/2,x+width/2]]){
  for(const y of [level+.5,level+1.05])if(a>cursor)box(gallery,a-cursor,.05,.05,(a+cursor)/2,y,front,'metal','gallery-rail');
  cursor=b;
 }
 for(let p=x-width/2;p<=x+width/2+.01;p+=3)if(!gaps.some(([a,b])=>p>a&&p<b))box(gallery,.06,1.05,.06,p,level+.525,front,'metal','gallery-post');
 for(const p of gaps.flat())box(gallery,.06,1.05,.06,p,level+.525,front,'metal','gallery-post');
 for(const p of [x-width/2,x-width/4,x,x+width/4,x+width/2])box(gallery,.12,level-.16,.12,p,(level-.16)/2,front-.06,'metal','gallery-support');
 // Covered access gallery: canopy and landing wings meet edge-to-edge.
 const canopyBottom=5.55;
 box(gallery,width+.5,.15,depth+.5,x,canopyBottom+.075,wallZ+(depth+.3)/2-.1,'roof','gallery-canopy');
 const canopyFront=wallZ+depth+.3;
 for(const [a,b]of gaps)box(gallery,b-a+.3,.15,1.25,(a+b)/2,canopyBottom+.075,canopyFront+.625,'roof','landing-canopy');
 for(const p of [x-width/2,x-width/4,x,x+width/4,x+width/2])box(gallery,.1,canopyBottom-level,.1,p,(canopyBottom+level)/2,front-.06,'metal','canopy-post');
 for(const plate of group.children.filter(o=>o.name.startsWith('small-module-')&&o.userData.decorativeRelief)){
  const mass=group.getObjectByName(plate.name+'-massing');
  for(const pane of [...mass.children])if(pane.userData.facade&&Math.abs(pane.position.x-plate.position.x)<.75&&pane.position.z>plate.position.z){mass.remove(pane);pane.geometry.dispose();pane.material.dispose();}
  for(const base of [0,level]){
   const door=new THREE.Mesh(new THREE.PlaneGeometry(.95,2.1),new THREE.MeshLambertMaterial());door.userData.role='glass';door.userData.entrance=true;door.position.set(plate.position.x,base+1.05,wallZ+.04);door.name=base?'gallery-door':'ground-door';gallery.add(door);
  }
 }
 return gallery;
}

/** A low gable with eave overhang, separate from the sourced wall footprint. */
export function gabledRoof(group,plate,{eaveHeight=3.2,rise=1.6,overhang=.45}={}){
 const width=plate.geometry.parameters.width,depth=plate.geometry.parameters.depth,x=plate.position.x,z=plate.position.z;
 const roof=new THREE.Group();roof.name='detached-eaved-roof';roof.userData={schematic:true,eaveHeight,rise,overhang};group.add(roof);
 function prism(points,span,role,name){
  const shape=new THREE.Shape();points.forEach(([u,v],i)=>i?shape.lineTo(u,v):shape.moveTo(u,v));shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:span,bevelEnabled:false});geometry.rotateY(-Math.PI/2);geometry.translate(span/2,0,0);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial());mesh.position.set(x,0,z);mesh.userData.role=role;mesh.name=name;
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial());edge.userData.edge=true;mesh.add(edge);roof.add(mesh);return mesh;
 }
 prism([[-depth/2,eaveHeight],[0,eaveHeight+rise],[depth/2,eaveHeight]],width,'building','gable-fill');
 const half=depth/2+overhang,low=eaveHeight-rise*overhang/(depth/2);
 prism([[-half,low],[0,eaveHeight+rise],[half,low],[half,low+.13],[0,eaveHeight+rise+.13],[-half,low+.13]],width+2*overhang,'roof','eaved-roof-cover');
 return roof;
}
