import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';import {validateCapAnchor} from '../src/primitives/sections.js';import {STYLES} from '../styles.js';
const dispose=m=>m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
test('all six conceptual options have genuine caps, no metric dimensions or computed capacity',()=>{
 for(const panel of ['rain-gardens','ponds','source-control']){const m=createRecipe(panel+'--v0');assert.equal(m.recipe.kind,'conceptual-3d');assert.deepEqual(m.recipe.allowedCameras,['iso','section']);assert.equal(m.coordinateUnits,'diagram');assert.equal(m.measurement,undefined);
 for(const option of [0,1]){m.setCategory(option);assert.equal(m.group.children.filter(o=>o.visible).length,1);assert.equal(m.dimensions.length,0);assert.ok(m.sections.length>0);assert.ok(m.labels.length>=3&&m.labels.length<=4);assert.ok(m.labels.every(l=>!/[0-9]|\bm³\b|\bmm\b/.test(l.text)));
 for(const solid of m.sections){const s=solid.userData.section;assert.equal(s.kind,'conceptual');assert.equal(s.coordinateUnits,'diagram');assert.equal(s.original,undefined);assert.equal(s.retained,undefined);assert.ok(solid.getObjectByName('cap').geometry.attributes.position.count>0);}
 for(const a of m.capAnchors)assert.ok(validateCapAnchor(a.solid,a.point));
 }assert.throws(()=>m.setCategory(-1));assert.throws(()=>m.setCategory(2));dispose(m);}
 for(const id of ['rain-gardens--v1','ponds--v1','source-control--v1'])assert.throws(()=>recipeInfo(id));
});
test('infiltration is explicitly conditional; a swale conveys along its route',()=>{
 const m=createRecipe('rain-gardens--v0'),infiltration=m.group.getObjectByName('infiltration');assert.equal(infiltration.userData.process.conditional,true);assert.ok(infiltration.children.find(o=>o.isLine).material.isLineDashedMaterial);assert.ok(m.labels.some(l=>l.text==='Infiltration?'));
 m.setCategory(1);assert.ok(m.labels.some(l=>l.text==='Along-route flow'));const p=m.group.getObjectByName('conveyance').userData.process;assert.equal(p.from[0],p.to[0]);assert.ok(p.to[2]>p.from[2]);dispose(m);
});
test('permanent pond water lies below normal level and storm storage lies above it',()=>{
 const m=createRecipe('ponds--v0');assert.equal(m.recipe.defaultCamera,'section');m.setCategory(1);
 const b=o=>new THREE.Box3().setFromObject(o,true),group=m.group.children[1],permanent=b(group.getObjectByName('permanent-water')),live=b(group.getObjectByName('storm-storage'));
 assert.ok(Math.abs(permanent.max.y)<1e-6);assert.ok(Math.abs(live.min.y)<1e-6);assert.ok(permanent.min.y<0&&live.max.y>0);assert.ok(group.getObjectByName('normal-level').userData.normalLevel);assert.ok(m.labels.some(l=>l.text==='Permanent water'));assert.ok(m.labels.some(l=>l.text==='Storm storage'));
 m.setCategory(0);assert.ok(!m.labels.some(l=>l.text==='Permanent water'));assert.ok(m.group.children[0].getObjectByName('normal-level'));dispose(m);
});
test('paving marks pore water separately from the aggregate, preserving qualitative option inputs',()=>{
 const m=createRecipe('source-control--v0');m.setCategory(1);const group=m.group.children[1],pores=[];group.traverse(o=>{if(o.userData.voidSymbol)pores.push(o);});assert.equal(pores.length,14);assert.equal(group.getObjectByName('aggregate').getObjectByName('body').userData.role,'subsoil');assert.ok(pores.every(o=>o.userData.role==='cutWater'));assert.deepEqual(m.labels.map(l=>l.text),['Permeable surface','Aggregate voids','Subsoil','Drainage']);dispose(m);
});
test('conceptual geometry is finite, independently owned and registered in all palettes',()=>{
 for(const panel of ['rain-gardens','ponds','source-control']){const m=createRecipe(panel+'--v0');m.group.traverse(o=>{if(o.geometry)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));if(o.isMesh)for(const style of Object.values(STYLES))assert.ok(style.colours[o.userData.role],o.userData.role);});dispose(m);}
});
