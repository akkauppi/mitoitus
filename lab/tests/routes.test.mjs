import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCyclist} from '../assets.js';
import {createRecipe} from '../src/registry.js';
import {WALKING_WIDTHS,CYCLING_WIDTHS,ROUTE_FRAME} from '../src/recipes/routes.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<2e-6,`${a} != ${b}`);
function dispose(model){const geometry=new Set(),material=new Set();model.group.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)material.add(o.material);});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());}
test('rider has a natural seated pose inside the existing illustration envelope',()=>{
 const group=createCyclist();group.updateMatrixWorld(true);
 const b=new THREE.Box3().setFromObject(group,true),s=b.getSize(new THREE.Vector3());
 close(s.x,.6);close(s.y,1.65);close(s.z,2);close(b.min.y,0);
 close(new THREE.Box3().setFromObject(group.getObjectByName('rider-head'),true).getSize(new THREE.Vector3()).y,.23);
 assert.ok(group.getObjectByName('rider-torso'));
 dispose({group});
});
for(const [panel,widths]of [['walking',WALKING_WIDTHS],['cycling',CYCLING_WIDTHS]]){
 for(const [index,width]of widths.entries())test(`${panel} variant ${index} keeps source width and fits common comparison frame`,()=>{
  const model=createRecipe(`${panel}--v${index}`),surface=model.group.getObjectByName('measured-route');
  const b=new THREE.Box3().setFromObject(surface),s=b.getSize(new THREE.Vector3());
  close(s.x,width);close(s.z,6);close(b.max.y,0);
  close(new THREE.Vector3(...model.dimensions[0].a).distanceTo(new THREE.Vector3(...model.dimensions[0].b)),width);
  assert.equal(model.dimensions[0].label,`${width} m`);
  const riders=model.group.children.filter(o=>o.userData.asset==='cyclist');
  if(panel==='cycling')assert.equal(riders.length,index===0||index===3?1:2);
  if(panel==='cycling'&&index<3){close(riders[0].rotation.y,0);if(riders.length>1)close(riders[1].rotation.y,Math.PI);}
  assert.equal(model.comparison.id,'route-widths');assert.deepEqual(model.comparison.bounds,ROUTE_FRAME);
  const actual=new THREE.Box3().setFromObject(model.group);
  for(let axis=0;axis<3;axis++){assert.ok(actual.min.getComponent(axis)>=ROUTE_FRAME.min[axis]-2e-6);assert.ok(actual.max.getComponent(axis)<=ROUTE_FRAME.max[axis]+2e-6);}
  for(const d of model.dimensions)for(const p of [d.a,d.b]){const point=new THREE.Vector3(...p).add(new THREE.Vector3(...d.offset));for(let axis=0;axis<3;axis++)assert.ok(point.getComponent(axis)<=ROUTE_FRAME.max[axis]&&point.getComponent(axis)>=ROUTE_FRAME.min[axis]);}
  dispose(model);
 });
}
test('cycle parking measures actual five envelope tiles and handling area',()=>{
 const model=createRecipe('bike-parking--v0');let rowArea=0;
 for(let i=0;i<5;i++){const tile=model.group.getObjectByName(`cycle-envelope-${i}`),s=new THREE.Box3().setFromObject(tile).getSize(new THREE.Vector3());close(s.x,.6);close(s.z,2);rowArea+=s.x*s.z;}
 const handling=new THREE.Box3().setFromObject(model.group.getObjectByName('handling-space')).getSize(new THREE.Vector3());
 close(rowArea,6);close(handling.x*handling.z,6);close((rowArea+handling.x*handling.z)/5,2.4);
 assert.equal(model.group.children.filter(o=>o.userData.asset==='bicycle').length,5);dispose(model);
});
test('unknown route alternatives fail explicitly',()=>{assert.throws(()=>createRecipe('walking--v4'));assert.throws(()=>createRecipe('cycling--v5'));});
