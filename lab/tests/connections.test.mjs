import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';
const bounds=o=>new THREE.Box3().setFromObject(o,true),near=(a,b)=>assert.ok(Math.abs(a-b)<3e-6,`${a} != ${b}`);
const dispose=m=>m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
test('refuge keeps both 3m lanes, 2.5m island, 8.5m span and the original offset 4m opening',()=>{
 const m=createRecipe('crossing-refuge--v0'),l=bounds(m.group.getObjectByName('left-lane')),r=bounds(m.group.getObjectByName('right-lane')),opening=bounds(m.group.getObjectByName('refuge-opening')),n=bounds(m.group.getObjectByName('north-island')),s=bounds(m.group.getObjectByName('south-island'));
 near(l.max.x-l.min.x,3);near(r.max.x-r.min.x,3);near(r.max.x-l.min.x,8.5);near(opening.max.x-opening.min.x,2.5);near(opening.max.z-opening.min.z,4);near(opening.min.x,l.max.x);near(opening.max.x,r.min.x);near(n.max.z,opening.min.z);near(opening.max.z,s.min.z);near(s.max.z-n.min.z,8);near(opening.max.y,0);
 for(const side of ['left','right']){const stripes=[0,1,2].map(i=>bounds(m.group.getObjectByName(`${side}-stripe-${i}`)));for(const b of stripes){near(b.max.x-b.min.x,.5);near(b.max.z-b.min.z,4);near(b.min.z,opening.min.z);near(b.max.z,opening.max.z);}for(let i=1;i<3;i++)near(stripes[i].min.x-stripes[i-1].max.x,.5);}
 for(const [name,axis]of [['left-traffic','z'],['right-traffic','z'],['walking-direction','x']]){const b=bounds(m.group.getObjectByName(name));assert.ok(b.max[axis]-b.min[axis]>(axis==='x'?10:.9));}
 assert.equal(m.labels.length,4);dispose(m);
});
test('one corridor keeps width, passing space and both overhead contexts clear',()=>{
 const m=createRecipe('clear-route-continuity--v0'),p=bounds(m.group.getObjectByName('pavement')),r=bounds(m.group.getObjectByName('continuous-clear-ribbon')),passing=bounds(m.group.getObjectByName('passing-place')),furniture=bounds(m.group.getObjectByName('furniture-outside'));
 near(p.max.x-p.min.x,6);near(p.max.z-p.min.z,2.5);near(r.max.z-r.min.z,1.5);near(r.max.x-r.min.x,6);near(passing.max.z-passing.min.z,1.8);assert.ok(furniture.max.z<r.min.z,'furniture remains outside the corridor');
 near(bounds(m.group.getObjectByName('ordinary-overhead')).min.y-p.max.y,2.2);near(bounds(m.group.getObjectByName('building-overhead')).min.y-p.max.y,3);
 assert.equal(m.recipe.defaultCamera,'iso');assert.ok(m.recipe.explanation.join().includes('recommended'));assert.equal(m.group.getObjectByName('obstacle'),undefined);assert.equal(m.labels.length,4);
 for(const d of m.dimensions)assert.ok(!d.label.includes('1.4'));dispose(m);
});
test('connection geometry and anchors are finite and reject invented source variants',()=>{
 for(const id of ['crossing-refuge--v1','crossing-refuge--v0-height','clear-route-continuity--v1'])assert.throws(()=>recipeInfo(id));
 for(const id of ['crossing-refuge--v0','clear-route-continuity--v0','clear-route-continuity--v0-height']){const m=createRecipe(id);m.group.traverse(o=>{if(o.geometry)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});for(const d of m.dimensions)assert.ok([...d.a,...d.b,...d.offset].every(Number.isFinite));dispose(m);}
});
