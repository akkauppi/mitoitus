import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe} from '../src/registry.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<2e-6,`${a} != ${b}`);
const bounds=o=>new THREE.Box3().setFromObject(o,true);
function dispose(m){const g=new Set(),a=new Set();m.group.traverse(o=>{if(o.geometry)g.add(o.geometry);if(o.material)a.add(o.material);});g.forEach(o=>o.dispose());a.forEach(o=>o.dispose());}
test('corridor reservations retain independent 8/6m cases and equal illustrative length',()=>{
 const m=createRecipe('tram-corridor--v0');for(const [name,width]of [['espoo-reservation',8],['helsinki-reservation',6]]){const b=bounds(m.group.getObjectByName(name));near(b.max.x-b.min.x,width);near(b.max.z-b.min.z,1.5);}
 assert.equal(m.recipe.defaultCamera,'plan');assert.ok(m.recipe.retainedTextSelector);assert.equal(m.group.children.filter(o=>o.userData.asset==='tram').length,0);dispose(m);
});
test('compact width model has solid 3.5/5.5/3.5 bands without a compressed tram',()=>{
 const m=createRecipe('tram-width--v0'),base=bounds(m.group.getObjectByName('base')),l=bounds(m.group.getObjectByName('left-platform')),r=bounds(m.group.getObjectByName('right-platform')),track=bounds(m.group.getObjectByName('track-zone'));
 near(l.max.x-l.min.x,3.5);near(track.max.x-track.min.x,5.5);near(r.max.x-r.min.x,3.5);near(l.max.x,track.min.x);near(track.max.x,r.min.x);near(r.max.x-l.min.x,12.5);
 for(const b of [l,r]){near(b.min.y,base.max.y);near(b.max.y,.3);near(b.max.z-b.min.z,5);}
 const bench=bounds(m.group.children.find(o=>o.userData.asset==='bench'));assert.ok(bench.min.x-r.min.x>=1.8);
 assert.equal(m.group.children.filter(o=>o.userData.asset==='tram').length,0);dispose(m);
});
test('full stop preserves service length, ramps, bodies and separate city examples',()=>{
 const m=createRecipe('tram-length--v0');
 for(const side of ['left','right']){
  const platform=bounds(m.group.getObjectByName(side+'-platform')),a=m.group.getObjectByName(side+'-approach'),d=m.group.getObjectByName(side+'-departure'),ab=bounds(a),db=bounds(d);
  near(platform.max.z-platform.min.z,45);near(ab.max.z-ab.min.z,6);near(db.max.z-db.min.z,6);near(ab.max.z,platform.min.z);near(db.min.z,platform.max.z);near(db.max.z-ab.min.z,57);
  near(a.userData.profile.rise/a.userData.profile.run,.05);near(d.userData.profile.rise,.3);
 }
 for(const name of ['first-tram','second-tram']){const b=bounds(m.group.getObjectByName(name));near(b.max.z-b.min.z,34);near(b.max.x-b.min.x,2.4);near(b.min.y,0);}
 for(const [name,length]of [['city-single',30],['city-pair',61]]){const b=bounds(m.group.getObjectByName(name));near(b.max.z-b.min.z,length);}
 assert.equal(m.labels.length,4);assert.ok(m.recipe.assumptions.join().includes('0.27'));dispose(m);
});
