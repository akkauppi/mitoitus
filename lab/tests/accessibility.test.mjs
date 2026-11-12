import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRecipe} from '../src/registry.js';
import {STYLES} from '../styles.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<2e-6,`${a} != ${b}`);
const bounds=o=>new THREE.Box3().setFromObject(o,true);
function dispose(model){const g=new Set(),m=new Set();model.group.traverse(o=>{if(o.geometry)g.add(o.geometry);if(o.material)m.add(o.material);});g.forEach(o=>o.dispose());m.forEach(o=>o.dispose());}
test('clear circles are 1.5/2.5 m diameters and contain no furniture or device',()=>{
 const model=createRecipe('turning--v0');
 for(const [name,diameter]of [['wheelchair',1.5],['powered-chair',2.5]]){
  const disk=model.group.getObjectByName(name),size=bounds(disk).getSize(new THREE.Vector3());
  close(size.x,diameter);close(size.z,diameter);close(disk.userData.clearRadius,diameter/2);
 }
 assert.equal(model.recipe.defaultCamera,'plan');assert.deepEqual(model.recipe.allowedCameras,['iso','plan']);
 assert.equal(model.group.children.filter(o=>o.userData.asset).length,0);
 assert.equal(model.dimensions.length,2);dispose(model);
});
test('ramp profile is a solid 6 m run / 0.30 m rise with contiguous 2 m landing',()=>{
 const model=createRecipe('ramps--v0'),ramp=model.group.getObjectByName('ramp'),landing=model.group.getObjectByName('landing');
 const r=bounds(ramp),l=bounds(landing),s=r.getSize(new THREE.Vector3());
 close(s.x,6);close(s.z,1.2);close(r.max.y,.3);close(r.min.y,-.18);
 close(r.max.x,l.min.x);close(r.max.y,l.max.y);close(r.min.y,l.min.y);close(l.max.x-l.min.x,2);
 const p=ramp.userData.profile;close(p.rise/p.run,.05);
 const vertices=ramp.geometry.attributes.position;
 for(let i=0;i<vertices.count;i++){
  const x=vertices.getX(i),y=vertices.getY(i);assert.ok(Math.abs(y-p.base)<2e-6||Math.abs(y-(x-p.startX)*p.rise/p.run)<2e-6,'vertices use exact slope or base');
 }
 const person=model.group.children.find(o=>o.userData.asset==='person');close(bounds(person).min.y,.3);
 close(bounds(person).max.y-bounds(person).min.y,1.75);
 assert.equal(model.recipe.defaultCamera,'front');assert.ok(!model.recipe.allowedCameras.includes('section'));dispose(model);
});
test('arrival keeps bay/bench clear rectangles separate and bench outside clear space',()=>{
 const model=createRecipe('arrival--v0'),bay=model.group.getObjectByName('courtyard-bay'),space=model.group.getObjectByName('bench-end-space');
 const b=bounds(bay),c=bounds(space),s=c.getSize(new THREE.Vector3());close(b.max.x-b.min.x,3.6);close(b.max.z-b.min.z,5);close(s.x,.9);close(s.z,1.5);
 assert.ok(b.max.x<c.min.x,'independent vignettes have separate ground tiles');
 const bench=model.group.children.find(o=>o.userData.asset==='bench'),seat=bounds(bench);
 assert.ok(seat.max.z<=c.min.z+2e-6,'bench does not occupy measured clear space');
 assert.equal(model.group.children.filter(o=>['person','car'].includes(o.userData.asset)).length,0);
 assert.ok(model.recipe.assumptions.join().includes('depth 1.5 m'));
 dispose(model);
});
for(const id of ['turning','ramps','arrival'])test(`${id} has finite geometry, preserved measurement anchors and shared palette roles`,()=>{
 const model=createRecipe(id+'--v0');
 model.group.traverse(o=>{
  if(o.geometry){const p=o.geometry.attributes.position;for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]));}
  if(o.isMesh)for(const style of Object.values(STYLES))assert.ok(style.colours[o.userData.role]);
 });
 for(const d of model.dimensions)assert.ok(new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b))>0);
 for(const l of model.labels)assert.equal(l.point.length,3);
 dispose(model);
});
