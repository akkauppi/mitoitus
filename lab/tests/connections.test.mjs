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
test('pinch geometry retains a real 1.4m clear gap beside assumed intrusion',()=>{
 const m=createRecipe('clear-route-continuity--v0'),p=bounds(m.group.getObjectByName('pavement')),o=bounds(m.group.getObjectByName('obstacle'));
 near(p.max.x-p.min.x,12);near(p.max.z-p.min.z,2.5);near(o.max.x-o.min.x,1.4);near(o.max.z-o.min.z,1.1);near(o.min.z,p.min.z);near(p.max.z-o.max.z,1.4);
 const clear=m.dimensions.find(d=>d.label==='1.4 m clear');near(new THREE.Vector3(...clear.a).distanceTo(new THREE.Vector3(...clear.b)),1.4);assert.equal(m.group.children.filter(o=>o.userData.asset).length,0);dispose(m);
});
test('height elevations preserve distinct 2.2/3m contexts with scale people outside openings',()=>{
 const m=createRecipe('clear-route-continuity--v0-height');
 for(const [name,height]of [['route',2.2],['building',3]]){const canopy=bounds(m.group.getObjectByName(name+'-canopy')),floor=bounds(m.group.getObjectByName(name+'-floor'));near(canopy.min.y-floor.max.y,height);near(canopy.max.x-canopy.min.x,3);}
 const people=m.group.children.filter(o=>o.userData.asset==='person');assert.equal(people.length,2);
 for(const person of people){const b=bounds(person);near(b.max.y-b.min.y,1.75);near(b.min.y,0);assert.ok(b.max.x<-4||b.min.x>4,'people beside the measured openings');}
 assert.equal(m.recipe.defaultCamera,'front');assert.ok(m.recipe.explanation.join().includes('recommended'));assert.ok(!m.recipe.allowedCameras.includes('section'));dispose(m);
});
test('connection geometry and anchors are finite and reject invented source variants',()=>{
 for(const id of ['crossing-refuge--v1','crossing-refuge--v0-height','clear-route-continuity--v1'])assert.throws(()=>recipeInfo(id));
 for(const id of ['crossing-refuge--v0','clear-route-continuity--v0','clear-route-continuity--v0-height']){const m=createRecipe(id);m.group.traverse(o=>{if(o.geometry)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});for(const d of m.dimensions)assert.ok([...d.a,...d.b,...d.offset].every(Number.isFinite));dispose(m);}
});
