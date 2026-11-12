import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';
import {STYLES} from '../styles.js';
import {FOOTPRINT_RELIEF} from '../src/primitives/footprints.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<3e-6,`${a} != ${b}`),bounds=o=>new THREE.Box3().setFromObject(o,true);
const dispose=m=>m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
function rectangle(object,width,length,area){const b=bounds(object);near(b.max.x-b.min.x,width);near(b.max.z-b.min.z,length);near((b.max.x-b.min.x)*(b.max.z-b.min.z),area);return b;}
test('two 26x11m modules retain 52m slab length and a separate 20x20m point block',()=>{
 const m=createRecipe('building-blocks--v0'),first=rectangle(m.group.getObjectByName('slab-module-0'),26,11,286),second=rectangle(m.group.getObjectByName('slab-module-1'),26,11,286),point=rectangle(m.group.getObjectByName('point-block'),20,20,400);
 near(first.max.x,second.min.x);near(second.max.x-first.min.x,52);near(point.min.z-first.max.z,112/6);assert.equal(m.labels.length,3);dispose(m);
});
test('small-block and row modules preserve counts, areas, joints and garden alignment',()=>{
 const m=createRecipe('building-rows--v0');let smallFirst,smallLast,rowFirst,rowLast;
 for(let i=0;i<4;i++){
  const s=rectangle(m.group.getObjectByName('small-module-'+i),9,9,81),r=rectangle(m.group.getObjectByName('row-dwelling-'+i),6,9.5,57),g=rectangle(m.group.getObjectByName('row-garden-'+i),6,10,60);
  near(r.min.x,g.min.x);near(r.max.x,g.max.x);near(r.max.z,g.min.z);
  if(i){near(s.min.x,smallLast.max.x);near(r.min.x,rowLast.max.x);}else{smallFirst=s;rowFirst=r;}
  smallLast=s;rowLast=r;
 }
 near(smallLast.max.x-smallFirst.min.x,36);near(rowLast.max.x-rowFirst.min.x,24);assert.equal(m.labels.length,3);dispose(m);
});
test('detached footprint preserves 150/750m² arithmetic and original placement inside the plot',()=>{
 const m=createRecipe('building-detached--v0'),house=rectangle(m.group.getObjectByName('detached-house'),15,10,150),plot=rectangle(m.group.getObjectByName('detached-plot'),25,30,750);
 near(house.min.x-plot.min.x,35/6);near(house.min.z-plot.min.z,70/6);assert.ok(house.max.x<plot.max.x&&house.max.z<plot.max.z);assert.equal(m.group.getObjectByName('detached-house-base'),undefined);assert.equal(m.labels.length,2);dispose(m);
});
test('every footprint is a decorative plaque with ground contact inside one comparison envelope',()=>{
 let comparison;
 for(const panel of ['building-blocks','building-rows','building-detached']){
  const m=createRecipe(panel+'--v0');if(comparison)assert.deepEqual(m.comparison,comparison);else comparison=m.comparison;
  assert.deepEqual(m.meta.target,[0,0,0]);assert.equal(m.recipe.defaultCamera,'plan');assert.deepEqual(m.recipe.allowedCameras,['plan','iso']);
  let plaques=0;
  m.group.traverse(o=>{
   if(o.isMesh)for(const style of Object.values(STYLES))assert.ok(style.colours[o.userData.role],'registered palette role');
   if(o.geometry)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
   if(o.userData.decorativeRelief){const b=bounds(o),base=m.group.getObjectByName(o.name+'-base')||m.group.getObjectByName('detached-plot');near(bounds(base).max.y,b.min.y);near(b.min.y,0);near(b.max.y,FOOTPRINT_RELIEF);near(o.userData.footprintArea,(b.max.x-b.min.x)*(b.max.z-b.min.z));plaques++;}
  });assert.equal(plaques,panel==='building-blocks'?3:panel==='building-rows'?8:1);
  for(const d of m.dimensions){const length=new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b));near(length,Number.parseFloat(d.label));for(const p of [d.a,d.b]){const offset=p.map((v,i)=>v+d.offset[i]);for(let i=0;i<3;i++)assert.ok(offset[i]>=m.comparison.bounds.min[i]&&offset[i]<=m.comparison.bounds.max[i]);}}
  const b=bounds(m.group);for(const axis of ['x','y','z']){const i=['x','y','z'].indexOf(axis);assert.ok(b.min[axis]>=m.comparison.bounds.min[i]-1e-6&&b.max[axis]<=m.comparison.bounds.max[i]+1e-6);}
  assert.ok(m.recipe.assumptions.join().includes('building height'));dispose(m);
 }
 for(const id of ['building-blocks--v1','building-rows--v1','building-detached--v1'])assert.throws(()=>recipeInfo(id));
});
