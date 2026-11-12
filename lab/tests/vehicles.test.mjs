import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';
import {createCar} from '../assets.js';
const bounds=o=>new THREE.Box3().setFromObject(o,true),near=(a,b)=>assert.ok(Math.abs(a-b)<3e-6,`${a} != ${b}`);
function checkBand(mesh,inner,outer){
 const p=mesh.geometry.attributes.position;let min=Infinity,max=0;
 for(let i=0;i<p.count;i++){const radius=Math.hypot(p.getX(i),p.getY(i));min=Math.min(min,radius);max=Math.max(max,radius);assert.ok(Math.min(Math.abs(radius-inner),Math.abs(radius-outer))<3e-6,'arc vertices follow reference circles');assert.ok(p.getX(i)>=-1e-6&&p.getY(i)>=-1e-6,'quarter annulus only');}
 near(min,inner);near(max,outer);
}
const dispose=m=>m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
test('car and bus preserve exact radius references and detached metric bodies',()=>{
 for(const [panel,inner,outer,length,width,height]of [['car-turn',3,6.5,5,1.8,1.5],['bus-turn',8.1,15.2,15,2.6,3.2]]){
  const m=createRecipe(panel+'--v0'),band=m.group.getObjectByName('radius-band'),body=bounds(m.group.getObjectByName('reference-body'));
  assert.deepEqual(band.userData.radii,{inner,outer});checkBand(band,inner,outer);
  for(const d of m.dimensions.slice(0,2))near(new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b)),d===m.dimensions[0]?inner:outer);
  near(body.max.x-body.min.x,width);near(body.max.z-body.min.z,length);near(body.max.y,height);near(body.min.y,0);assert.ok(body.min.z>bounds(band).max.z);
  assert.equal(m.recipe.defaultCamera,'plan');assert.ok(m.recipe.explanation.join().includes('not a simulated'));dispose(m);
 }
});
test('all four lane cases share one comparison envelope with correct widths and vehicles',()=>{
 let reference;
 for(const [panel,laneWidth,length,width]of [['car-turn',3,5,1.8],['bus-turn',3.25,15,2.6]])for(const index of [1,2]){
  const m=createRecipe(`${panel}--v${index}`),b=bounds(m.group.getObjectByName('carriageway')),vehicles=m.group.children.filter(o=>['car','bus'].includes(o.userData.asset));
  near(b.max.x-b.min.x,index*laneWidth);near(b.max.z-b.min.z,18);assert.equal(vehicles.length,index);
  for(const vehicle of vehicles){const v=bounds(vehicle);near(v.max.z-v.min.z,length);near(v.max.x-v.min.x,width);assert.ok(v.min.x>=b.min.x&&v.max.x<=b.max.x);near(v.min.y,0);}
  if(reference)assert.deepEqual(m.comparison,reference);else reference=m.comparison;
  assert.deepEqual(m.meta.target,[0,.5,0]);dispose(m);
 }
});
test('rescue retains paired radii, minimum setup and dashed target at one scale',()=>{
 const m=createRecipe('rescue--v0');
 assert.deepEqual(m.group.getObjectByName('engine-band').userData.radii,{inner:5,outer:10.5});assert.deepEqual(m.group.getObjectByName('aerial-band').userData.radii,{inner:5.5,outer:12.5});
 checkBand(m.group.getObjectByName('engine-band'),5,10.5);checkBand(m.group.getObjectByName('aerial-band'),5.5,12.5);
 const b=bounds(m.group.getObjectByName('setup')),t=bounds(m.group.getObjectByName('setup-target'));near(b.max.x-b.min.x,6);near(b.max.z-b.min.z,13);near(t.max.x-t.min.x,8);near(t.max.z-t.min.z,13);assert.equal(m.labels.length,4);
 for(const term of ['3.5 m','4.2 m','0.4 m','1 m boom'])assert.ok(m.recipe.explanation.join().includes(term));dispose(m);
});
test('vehicle recipes reject unsupported alternatives and contain finite geometry',()=>{
 for(const id of ['car-turn--v3','bus-turn--v3','rescue--v1'])assert.throws(()=>recipeInfo(id));
 for(const panel of ['car-turn','bus-turn','rescue']){const m=createRecipe(panel+'--v0');m.group.traverse(o=>{if(o.geometry)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});dispose(m);}
});
test('bus glazing replaces the body band instead of overlapping its visible faces',()=>{
 const m=createRecipe('bus-turn--v1'),bus=m.group.children.find(o=>o.userData.asset==='bus');
 const lower=bounds(bus.getObjectByName('bus-lower-shell')),glass=bounds(bus.getObjectByName('bus-glazing-band')),roof=bounds(bus.getObjectByName('bus-roof'));
 near(lower.max.y,glass.min.y);near(glass.max.y,roof.min.y);
 assert.ok(glass.max.x-lower.max.x>.009);assert.ok(glass.max.x-roof.max.x>.009);
 const pillars=[];bus.traverse(o=>{if(o.name==='bus-window-pillar')pillars.push(o);});assert.equal(pillars.length,18);
 for(const pillar of pillars){const b=bounds(pillar);assert.ok(b.max.x>glass.max.x+.009||b.min.x<glass.min.x-.009,'pillar front separated from glazing');}
 dispose(m);
});

test('radius-reference noses and direction arrows follow the quarter-turn tangents',()=>{
 for(const [panel,inner,outer,length]of [['car-turn',3,6.5,5],['bus-turn',8.1,15.2,15]]){
  const m=createRecipe(panel+'--v0'),body=m.group.getObjectByName('reference-body'),travel=m.group.getObjectByName('radius-direction');
  const nose=new THREE.Vector3(0,0,1).applyQuaternion(body.quaternion);
  const entryTangent=new THREE.Vector3(0,0,-1),entryRadius=new THREE.Vector3(1,0,0);
  near(nose.dot(entryTangent),1);near(nose.dot(entryRadius),0);
  near(body.position.x,(inner+outer)/2);
  const front=body.localToWorld(new THREE.Vector3(0,0,length/2));
  near(front.z,1);near(front.x,(inner+outer)/2);
  // The vehicle stays detached, with the same metric body and a declared gap.
  near(bounds(body).min.z-bounds(m.group.getObjectByName('radius-band')).max.z,1);
  const angle=travel.userData.pathDirection.angle;
  const tangent=new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle));
  const tip=new THREE.Vector3(0,-1,0).applyQuaternion(travel.quaternion);
  near(tip.dot(tangent),1);near(tip.dot(new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle))),0);
  near(Math.hypot(travel.position.x,travel.position.z),(inner+outer)/2);
  const bodyDimension=m.dimensions.find(d=>d.label===`${length} m body`);
  near(new THREE.Vector3(...bodyDimension.b).sub(new THREE.Vector3(...bodyDimension.a)).length(),length);
  near(bodyDimension.a[0],bodyDimension.b[0]);
  dispose(m);
 }
});

test('car windscreens sit visibly outside their cabin slopes without changing the envelope',()=>{
 const car=createCar();car.updateMatrixWorld(true);
 for(const [name,run,centre]of [
  ['car-front-windscreen',.63,new THREE.Vector3(0,1.16,1.045)],
  ['car-rear-windscreen',-.43,new THREE.Vector3(0,1.16,-1.135)],
 ]){
  const glass=car.getObjectByName(name),normal=new THREE.Vector3(0,Math.abs(run),Math.sign(run)*.68).normalize();
  const positions=glass.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   const point=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(glass.matrixWorld);
   const clearance=point.sub(centre).dot(normal);
   assert.ok(clearance>.0044&&clearance<.0196,`${name}: glass lies outside the shell with a small gap`);
  }
  const ray=new THREE.Raycaster(new THREE.Vector3(0,5,glass.position.z),new THREE.Vector3(0,-1,0));
  const meshes=[];car.traverse(o=>{if(o.isMesh)meshes.push(o);});
  assert.equal(ray.intersectObjects(meshes,false)[0].object,glass,`${name}: visible in the plan view`);
 }
 const size=bounds(car).getSize(new THREE.Vector3());near(size.x,1.8);near(size.y,1.5);near(size.z,5);near(bounds(car).min.y,0);
 dispose({group:car});
});
