import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createRecipe,recipeInfo} from '../src/registry.js';
import {STYLES} from '../styles.js';
import {FOOTPRINT_RELIEF} from '../src/primitives/footprints.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<3e-6,`${a} != ${b}`),bounds=o=>new THREE.Box3().setFromObject(o,true);
const dispose=m=>m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
function rectangle(object,width,length,area){const b=bounds(object);near(b.max.x-b.min.x,width);near(b.max.z-b.min.z,length);near((b.max.x-b.min.x)*(b.max.z-b.min.z),area);return b;}
test('two 26x11m modules retain 52m slab length and a separate 20x20m point block',()=>{
 const m=createRecipe('building-blocks--v0'),first=rectangle(m.group.getObjectByName('slab-module-0'),26,11,286),second=rectangle(m.group.getObjectByName('slab-module-1'),26,11,286),point=rectangle(m.group.getObjectByName('point-block'),20,20,400);
 near(first.max.x,second.min.x);near(second.max.x-first.min.x,52);near(point.min.z-first.max.z,112/6);assert.equal(m.labels.length,4);dispose(m);
});
test('small-block and row modules preserve counts, areas, joints and garden alignment',()=>{
 const m=createRecipe('building-rows--v0');let smallFirst,smallLast,rowFirst,rowLast;
 for(let i=0;i<4;i++){
  const s=rectangle(m.group.getObjectByName('small-module-'+i),9,9,81),r=rectangle(m.group.getObjectByName('row-dwelling-'+i),6,9.5,57),g=rectangle(m.group.getObjectByName('row-garden-'+i),6,10,60);
  near(r.min.x,g.min.x);near(r.max.x,g.max.x);near(r.max.z,g.min.z);
  if(i){near(s.min.x,smallLast.max.x);near(r.min.x,rowLast.max.x);}else{smallFirst=s;rowFirst=r;}
  smallLast=s;rowLast=r;
 }
 near(smallLast.max.x-smallFirst.min.x,36);near(rowLast.max.x-rowFirst.min.x,24);assert.equal(m.labels.length,4);dispose(m);
});
test('detached footprint preserves 150/750m² arithmetic and original placement inside the plot',()=>{
 const m=createRecipe('building-detached--v0'),house=rectangle(m.group.getObjectByName('detached-house'),15,10,150),plot=rectangle(m.group.getObjectByName('detached-plot'),25,30,750);
 near(house.min.x-plot.min.x,35/6);near(house.min.z-plot.min.z,70/6);assert.ok(house.max.x<plot.max.x&&house.max.z<plot.max.z);assert.equal(m.group.getObjectByName('detached-house-base'),undefined);assert.equal(m.labels.length,2);dispose(m);
});
test('every footprint is a decorative plaque with ground contact inside one comparison envelope',()=>{
 let comparison;
 for(const panel of ['building-blocks','building-rows','building-detached']){
  const m=createRecipe(panel+'--v0');if(comparison)assert.deepEqual(m.comparison,comparison);else comparison=m.comparison;
  assert.deepEqual(m.meta.target,[0,0,0]);assert.equal(m.recipe.defaultCamera,'iso');assert.deepEqual(m.recipe.allowedCameras,['iso','plan']);
  let plaques=0;
  m.group.traverse(o=>{
   if(o.isMesh)for(const style of Object.values(STYLES))assert.ok(style.colours[o.userData.role],'registered palette role');
   if(o.geometry)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
   if(o.userData.decorativeRelief){const b=bounds(o),base=m.group.getObjectByName(o.name+'-base')||m.group.getObjectByName('detached-plot');near(bounds(base).max.y,b.min.y);near(b.min.y,0);near(b.max.y,FOOTPRINT_RELIEF);near(o.userData.footprintArea,(b.max.x-b.min.x)*(b.max.z-b.min.z));plaques++;}
  });assert.equal(plaques,panel==='building-blocks'?3:panel==='building-rows'?8:1);
  for(const d of m.dimensions){const length=new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b));near(length,Number.parseFloat(d.label));for(const p of [d.a,d.b]){const offset=p.map((v,i)=>v+d.offset[i]);for(let i=0;i<3;i++)assert.ok(offset[i]>=m.comparison.bounds.min[i]&&offset[i]<=m.comparison.bounds.max[i]);}}
  const b=bounds(m.group);for(const axis of ['x','y','z']){const i=['x','y','z'].indexOf(axis);assert.ok(b.min[axis]>=m.comparison.bounds.min[i]-1e-6&&b.max[axis]<=m.comparison.bounds.max[i]+1e-6);}
  assert.ok(m.recipe.assumptions.join().includes('Schematic heights'));dispose(m);
 }
 for(const id of ['building-blocks--v1','building-rows--v1','building-detached--v1'])assert.throws(()=>recipeInfo(id));
});
test('massing has explicit illustrative heights and source-inspired stair positions without coplanar core/body roofs',()=>{
 for(const panel of ['building-blocks','building-rows','building-detached']){
  const m=createRecipe(panel+'--v0'),masses=m.group.children.filter(o=>o.userData.schematicHeight);
  assert.equal(masses.length,panel==='building-blocks'?3:panel==='building-rows'?8:1);
  for(const mass of masses){
   const plate=m.group.getObjectByName(mass.userData.footprint),p=bounds(plate),parts=mass.children.filter(o=>o.name==='body'||o.name==='stair-room');
   const nominal=new THREE.Box3();for(const part of parts)nominal.union(bounds(part));
   near(nominal.min.x,p.min.x);near(nominal.max.x,p.max.x);near(nominal.min.z,p.min.z);near(nominal.max.z,p.max.z);near(nominal.min.y,.12);
   assert.ok([3.2,6,12,18].includes(mass.userData.schematicHeight));
   for(const part of parts.filter(o=>o.name==='body'))near(bounds(part).max.y,mass.userData.schematicHeight);
   const core=mass.getObjectByName('stair-room');if(core){
    const c=bounds(core);for(const body of parts.filter(o=>o.name==='body')){const b=bounds(body);assert.ok(Math.min(b.max.x,c.max.x)-Math.max(b.min.x,c.min.x)<1e-6||Math.min(b.max.z,c.max.z)-Math.max(b.min.z,c.min.z)<1e-6,'body is partitioned around core');}
    near(panel==='building-blocks'&&plate.name==='point-block'?c.min.z:c.max.z,plate.name==='point-block'?p.min.z:p.max.z);
   }
   for(const pane of mass.children.filter(o=>o.userData.facade)){const pos=pane.position,axis=Math.abs(Math.sin(pane.rotation.y))>.5?'x':'z';near(Math.min(Math.abs(pos[axis]-p.min[axis]),Math.abs(pos[axis]-p.max[axis])),.025);}
  }
  assert.equal(masses.filter(o=>o.getObjectByName('stair-room')).length,panel==='building-blocks'?3:0);
  const stairs=m.group.children.filter(o=>o.name==='external-stair');assert.equal(stairs.length,panel==='building-rows'?2:0);
  for(const stair of stairs){assert.ok(stair.userData.schematic);near(bounds(stair).min.y,0);near(bounds(stair.getObjectByName('external-landing')).max.y,3);}
  dispose(m);
 }
});
test('all building panels include full-scale trees, cars and people outside footprint interiors',()=>{
 for(const panel of ['building-blocks','building-rows','building-detached']){
  const m=createRecipe(panel+'--v0'),actors=m.group.children.filter(o=>o.userData.asset),plates=m.group.children.filter(o=>o.userData.decorativeRelief).map(bounds);
  for(const kind of ['tree','car','person'])assert.ok(actors.some(o=>o.userData.asset===kind));
  for(const actor of actors){const a=bounds(actor);near(a.min.y,0);
   if(actor.userData.asset==='person')near(a.max.y,1.75);
   if(actor.userData.asset==='tree')near(a.max.y,5);
   if(actor.userData.asset==='car'){near(Math.max(a.max.x-a.min.x,a.max.z-a.min.z),5);near(Math.min(a.max.x-a.min.x,a.max.z-a.min.z),1.8);}
   for(const p of plates)assert.ok(Math.min(a.max.x,p.max.x)-Math.max(a.min.x,p.min.x)<=0||Math.min(a.max.z,p.max.z)-Math.max(a.min.z,p.min.z)<=0,'context does not intersect a building footprint');
  }
  dispose(m);
 }
});
test('luhtitalo stairs join the upper gallery, with entrance doors and open guardrail gaps',()=>{
 const m=createRecipe('building-rows--v0'),gallery=m.group.getObjectByName('entrance-gallery'),deck=bounds(gallery.getObjectByName('gallery-deck'));
 near(deck.max.x-deck.min.x,36);near(deck.max.z-deck.min.z,1.6);near(deck.max.y,3);
 const stairs=m.group.children.filter(o=>o.name==='external-stair');assert.equal(stairs.length,2);
 for(const stair of stairs){const landing=bounds(stair.getObjectByName('external-landing'));near(landing.min.z,deck.max.z);near(landing.max.y,deck.max.y);near(landing.max.x-landing.min.x,1.4);
  for(const rail of gallery.children.filter(o=>o.name==='gallery-rail')){const r=bounds(rail);assert.ok(Math.min(r.max.x,landing.max.x)-Math.max(r.min.x,landing.min.x)<1e-6,'guard is open at stair landing');}
 }
 const doors=gallery.children.filter(o=>o.name==='gallery-door');assert.equal(doors.length,4);
 for(const door of doors){const d=bounds(door);near(d.min.y,deck.max.y);assert.ok(d.min.x>=deck.min.x&&d.max.x<=deck.max.x&&d.min.z>deck.min.z&&d.max.z<deck.max.z);}
 const dimension=m.dimensions.find(d=>d.label==='9 m body depth');assert.ok(dimension);near(new THREE.Vector3(...dimension.a).distanceTo(new THREE.Vector3(...dimension.b)),9);dispose(m);
});
test('detached roof has true eave overhang around the unchanged footprint',()=>{
 const m=createRecipe('building-detached--v0'),p=bounds(m.group.getObjectByName('detached-house')),roof=m.group.getObjectByName('detached-eaved-roof'),r=bounds(roof.getObjectByName('eaved-roof-cover'));
 for(const axis of ['x','z']){near(p.min[axis]-r.min[axis],.45);near(r.max[axis]-p.max[axis],.45);}
 near(r.max.y,4.93);assert.ok(roof.userData.schematic);near(roof.userData.eaveHeight,3.2);near(roof.userData.rise,1.6);dispose(m);
});
test('external flights and landings have open undersides and a canopy covers the gallery',()=>{
 const m=createRecipe('building-rows--v0'),gallery=m.group.getObjectByName('entrance-gallery'),deck=bounds(gallery.getObjectByName('gallery-deck')),canopy=bounds(gallery.getObjectByName('gallery-canopy'));
 assert.ok(canopy.min.x<deck.min.x&&canopy.max.x>deck.max.x&&canopy.min.z<deck.min.z&&canopy.max.z>deck.max.z);near(canopy.min.y,5.55);
 for(const stair of m.group.children.filter(o=>o.name==='external-stair')){
  const treads=stair.children.filter(o=>o.name==='external-tread'),landing=stair.getObjectByName('external-landing'),b=bounds(landing);assert.equal(treads.length,16);
  for(const tread of treads)assert.ok(bounds(tread).max.y-bounds(tread).min.y<=.1);
  assert.ok(b.max.y-b.min.y<=.15);assert.equal(stair.children.filter(o=>o.name==='stair-stringer').length,2);
  const underFlight=new THREE.Vector3((treads[7].position.x+treads[8].position.x)/2,.4,landing.position.z),underLanding=new THREE.Vector3(landing.position.x,.4,landing.position.z);
  for(const o of stair.children.filter(o=>o.isMesh)){assert.ok(!bounds(o).containsPoint(underFlight),'air beneath flight');assert.ok(!bounds(o).containsPoint(underLanding),'air beneath landing');}
 }
 for(const wing of gallery.children.filter(o=>o.name==='landing-canopy'))near(bounds(wing).min.z,canopy.max.z);
 for(const door of gallery.children.filter(o=>o.name==='gallery-door'))assert.ok(bounds(door).max.y<canopy.min.y);
 dispose(m);
});
