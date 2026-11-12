import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';
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
  near(body.max.x-body.min.x,length);near(body.max.z-body.min.z,width);near(body.max.y,height);near(body.min.y,0);assert.ok(body.min.z>bounds(band).max.z);
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
