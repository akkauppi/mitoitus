import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';
import {PLANTING_CASES} from '../src/recipes/landscape.js';
import {createShrub,ASSET_SPECS} from '../assets.js';import {STYLES} from '../styles.js';import {validateCapAnchor} from '../src/primitives/sections.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<2e-6,`${a} != ${b}`),bounds=o=>new THREE.Box3().setFromObject(o,true);
function volume(mesh){const p=mesh.geometry.attributes.position;let v=0;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);v+=a.dot(b.cross(c))/6;}return Math.abs(v);}
const dispose=group=>group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
test('original shrub has declared metre envelope and a ground origin',()=>{const shrub=createShrub(),b=bounds(shrub);near(b.min.y,0);near(b.max.y,ASSET_SPECS.shrub.height);near(b.max.x-b.min.x,.9);near(b.max.z-b.min.z,.9);assert.equal(shrub.userData.asset,'shrub');dispose(shrub);});
test('four planting minimum widths retain common six metre lengths and local ground across both responsive camera layouts',()=>{
 const m=createRecipe('ground--v0');assert.deepEqual(PLANTING_CASES.map(c=>c.width),[3,3.5,2.5,2]);
 for(const camera of ['iso','plan'])for(const narrow of [false,true]){m.applyView(camera);m.layout(narrow);assert.equal(m.dimensions.length,4);assert.equal(m.labels.length,4);for(const [i,row]of m.group.children.entries()){
  const strip=bounds(row.getObjectByName('strip')),base=bounds(row.getObjectByName('decorative-base')),item=PLANTING_CASES[i];near(strip.max.x-strip.min.x,item.width);near(strip.max.z-strip.min.z,6);near(strip.max.y,row.position.y);near(base.max.y,row.position.y-.06);assert.ok(row.getObjectByName('decorative-base').userData.decorative);
  const d=m.dimensions[i];near(new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b)),item.width);assert.equal(d.label,`≥${item.width.toFixed(1)} m`);assert.equal(m.labels[i].text,item.name);
  if(i<2){const tree=row.children.find(o=>o.userData.asset==='tree'),b=bounds(tree);near(b.min.y,row.position.y);near(b.max.y-row.position.y,5);}else if(i===2)assert.equal(row.children.filter(o=>o.userData.asset==='shrub').length,3);
 }}dispose(m.group);
});
test('storage capacity counts only 6×5×0.20 water, with real half-volume cap and full Plan',()=>{
 const m=createRecipe('stormwater--v0');assert.equal(m.measurement.volume,6);near(m.measurement.width*m.measurement.length*m.measurement.depth,6);near(m.measurement.catchment*m.measurement.provision,6);
 for(const view of ['iso','section']){m.applyView(view);const water=m.sections[0],s=water.userData.section;near(s.original.volume,6);near(s.retained.volume,3);near(volume(water.getObjectByName('body'))+volume(water.getObjectByName('cap')),3);near(s.plane.value,0);assert.ok(validateCapAnchor(water,m.labels[0].point));const b=bounds(water.getObjectByName('body'));near(b.max.x-b.min.x,6);near(b.max.y-b.min.y,.2);near(b.max.z-b.min.z,2.5);assert.ok(m.group.getObjectByName('support-section').userData.decorative);assert.ok(!s.profile.some(p=>p[1]<-.2));}
 m.applyView('section');assert.equal(m.labels.length,1);assert.equal(m.dimensions.length,2);assert.ok(m.labels[0].text.includes('whole'));const person=m.group.getObjectByName('person');assert.equal(person.parent.visible,false);
 m.applyView('plan');assert.equal(m.dimensions.length,2);assert.ok(m.dimensions.some(d=>d.label==='5 m'));const b=bounds(m.group.getObjectByName('whole-water'));near(b.max.z-b.min.z,5);near(b.max.y-b.min.y,.2);assert.ok(m.group.getObjectByName('decorative-support').userData.decorative);dispose(m.group);
});
test('landscape uses registered materials and finite original geometry; unsupported variants fail',()=>{
 for(const id of ['ground--v1','stormwater--v1'])assert.throws(()=>recipeInfo(id));
 for(const id of ['ground--v0','stormwater--v0']){const m=createRecipe(id);m.group.traverse(o=>{if(o.geometry)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));if(o.isMesh)for(const s of Object.values(STYLES))assert.ok(s.colours[o.userData.role],o.userData.role);});dispose(m.group);}
});

test('single-strip detail keeps the common frame and exact selected width through camera and resize',()=>{const m=createRecipe('ground--v0');for(const view of ['iso','plan']){m.applyView(view);m.layout(true);const frame=JSON.stringify(m.comparison.bounds);for(let i=0;i<4;i++){m.setCategory(i);assert.equal(m.labels.length,1);assert.equal(m.dimensions.length,1);assert.equal(m.group.children.filter(g=>g.visible).length,1);assert.equal(JSON.stringify(m.comparison.bounds),frame);near(new THREE.Vector3(...m.dimensions[0].a).distanceTo(new THREE.Vector3(...m.dimensions[0].b)),PLANTING_CASES[i].width);}m.setCategory(-1);}assert.throws(()=>m.setCategory(4));dispose(m.group);});
