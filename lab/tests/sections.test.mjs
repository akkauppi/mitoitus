import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {cutPrism,rectangleProfile,validateCapAnchor,profileArea} from '../src/primitives/sections.js';
import {createRecipe,ROOT_RECIPE,recipeInfo} from '../src/registry.js';
import {STEP_PROFILE,FAR_EXAMPLES} from '../src/recipes/sections.js';
import {STYLES} from '../styles.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<5e-6,`${a} != ${b}`),bounds=o=>new THREE.Box3().setFromObject(o,true);
const dispose=m=>m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
function capArea(cap){const p=cap.geometry.attributes.position;let area=0;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);area+=b.sub(a).cross(c.sub(a)).length()/2;}return area;}
function meshVolume(mesh){const p=mesh.geometry.attributes.position;let volume=0;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);volume+=a.dot(b.cross(c))/6;}return volume;}
test('analytical prism removes either half and closes the actual cut plane without duplicate body faces',()=>{
 for(const keep of ['negative','positive']){
  const group=new THREE.Group(),solid=cutPrism(group,{profile:rectangleProfile(-2,-1,2,1),zMin:-3,zMax:3,keep});
  const cap=solid.getObjectByName('cap'),body=solid.getObjectByName('body'),p=cap.geometry.attributes.position,n=cap.geometry.attributes.normal;
  near(capArea(cap),8);near(Math.abs(meshVolume(body)+meshVolume(cap)),24);for(let i=0;i<p.count;i++){near(p.getZ(i),0);near(n.getZ(i),keep==='negative'?1:-1);}
  const b=bounds(body);near(b.min.z,keep==='negative'?-3:0);near(b.max.z,keep==='negative'?0:3);
  const vertices=body.geometry.attributes.position;for(let i=0;i<vertices.count;i+=3)assert.ok([0,1,2].some(j=>Math.abs(vertices.getZ(i+j))>1e-7),'cap is separated from body');
  near(solid.userData.section.original.volume,48);near(solid.userData.section.retained.volume,24);assert.equal(solid.userData.section.plane.coordinateSpace,'local');dispose({group});
 }
 const group=new THREE.Group();for(const cutZ of [-3,3,Infinity])assert.throws(()=>cutPrism(group,{profile:rectangleProfile(0,0,1,1),zMin:-3,zMax:3,cutZ}));
});
test('cap anchor validation handles boundaries, concavity and parent transforms',()=>{
 const group=new THREE.Group(),solid=cutPrism(group,{profile:STEP_PROFILE,zMin:-.6,zMax:.6});
 near(capArea(solid.getObjectByName('cap')),profileArea(STEP_PROFILE));assert.ok(validateCapAnchor(solid,[.84,.3,0]));assert.ok(validateCapAnchor(solid,[.42,.24,0]));assert.ok(!validateCapAnchor(solid,[.1,.6,0]));assert.ok(!validateCapAnchor(solid,[.84,.3,.01]));
 group.position.set(4,6,8);group.rotation.y=Math.PI/2;group.updateMatrixWorld(true);const world=solid.localToWorld(new THREE.Vector3(.84,.3,0));assert.ok(validateCapAnchor(solid,world.toArray()));dispose({group});
});
test('tree Section removes real soil geometry while preserving full 25m³ provenance and context',()=>{
 const m=createRecipe('trees--v0');m.applyView('section');const soil=m.sections[0];near(soil.userData.section.original.volume,25);near(soil.userData.section.retained.volume,12.5);near(ROOT_RECIPE.measurements.soilVolume,25);
 const b=bounds(soil.getObjectByName('body'));near(b.min.z,-2.5);near(b.max.z,0);near(capArea(soil.getObjectByName('cap')),5);assert.ok(validateCapAnchor(soil,m.labels[0].point));assert.equal(m.labels[0].text,'25 m³ whole block');assert.equal(m.dimensions.length,2);
 const actors=[];m.group.traverseVisible(o=>{if(o.userData.asset)actors.push(o.userData.asset);});assert.ok(actors.includes('tree')&&actors.includes('person'));
 m.applyView('front');const soils=[];m.group.traverseVisible(o=>{if(o.isMesh&&o.userData.role==='soil')soils.push(o);});assert.equal(soils.length,1);near(bounds(soils[0]).max.z,2.5);assert.equal(m.dimensions.length,3);dispose(m);
});
test('all three ratio cuts keep 12m height, exact facade widths and a shared local ground datum',()=>{
 const m=createRecipe('section-ratio--v0');assert.equal(m.recipe.defaultCamera,'section');assert.deepEqual(m.measurement.ratios,[1,2,3]);
 for(let i=0;i<3;i++){
  const row=m.group.children[i],left=row.getObjectByName('left-cut'),right=row.getObjectByName('right-cut'),l=bounds(left.getObjectByName('cap')),r=bounds(right.getObjectByName('cap'));
  near(l.max.y-l.min.y,12);near(r.max.y-r.min.y,12);near(r.min.x-l.max.x,[12,24,36][i]);near(l.min.y-row.position.y,0);near(r.min.y-row.position.y,0);near(l.min.z,0);near(r.min.z,0);near(capArea(left.getObjectByName('cap')),36);
  assert.ok(validateCapAnchor(left,m.sectionAnchors[i].point));const d=m.dimensions.filter(d=>d.label.startsWith('W ='))[i];near(new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b)),[12,24,36][i]);
 }
 assert.equal(m.sections.length,6);dispose(m);
});
test('equal-floor-area geometry retains every denominator, coverage and 1024m² total in both layouts',()=>{
 const m=createRecipe('equal-density--v0');assert.equal(m.recipe.fixedPlan,true);assert.deepEqual(m.recipe.allowedCameras,['plan']);
 for(const narrow of [false,true]){m.layout(narrow);for(let i=0;i<3;i++){
  const example=m.group.children[i],p=bounds(example.getObjectByName('plot')),f=bounds(example.getObjectByName('footprint')),data=FAR_EXAMPLES[i];
  near(p.max.x-p.min.x,32);near(p.max.z-p.min.z,32);near((p.max.x-p.min.x)*(p.max.z-p.min.z),1024);near(f.max.x-f.min.x,32);near(f.max.z-f.min.z,data.depth);near(f.min.z,p.min.z);
  near(32*data.depth/1024,data.coverage);near(32*data.depth*data.floors,1024);near(f.max.y,.12);assert.deepEqual(m.labels[i].point,[example.position.x,.12,example.position.z-16+data.depth/2]);
 }}dispose(m);
});
test('main stair flight keeps six equal rises/treads beside separate illustrative context',()=>{
 const m=createRecipe('steps--v0'),rises=[],treads=[];
 for(let i=1;i<STEP_PROFILE.length;i++){const a=STEP_PROFILE[i-1],b=STEP_PROFILE[i];if(b[1]>a[1]+1e-7&&Math.abs(b[0]-a[0])<1e-7)rises.push(b[1]-a[1]);if(b[0]>a[0]+1e-7&&Math.abs(b[1]-a[1])<1e-7)treads.push(b[0]-a[0]);}
 assert.equal(rises.length,6);assert.equal(treads.length,6);rises.forEach(r=>near(r,.12));treads.forEach(t=>near(t,.42));near(2*.12+.42,.66);
 const full=bounds(m.group.getObjectByName('full-stair'));near(full.max.x,2.52);near(full.max.y,.72);near(full.max.z-full.min.z,1.2);
 m.applyView('section');const cut=m.sections[0];near(bounds(cut.getObjectByName('body')).max.z,0);near(capArea(cut.getObjectByName('cap')),.42*.12*21);for(const l of m.labels)assert.ok(validateCapAnchor(l.text==='Landing'?m.sections[1]:cut,l.point));assert.equal(m.dimensions.length,3);
 const person=m.group.children.find(o=>o.userData.asset==='person'),b=bounds(person);near(b.min.y,0);near(b.max.y,1.75);assert.ok(b.max.x<0);dispose(m);
});
test('section models have finite geometry, registered roles and valid recipe identities',()=>{
 for(const id of ['section-ratio--v1','equal-density--v1','steps--v1'])assert.throws(()=>recipeInfo(id));
 for(const id of ['section-ratio--v0','equal-density--v0','steps--v0','trees--v0']){const m=createRecipe(id);m.group.traverse(o=>{if(o.geometry)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));if(o.isMesh)for(const style of Object.values(STYLES))assert.ok(style.colours[o.userData.role]);});dispose(m);}
});
test('street sections retain depth and scale context, with cropped backs and heights opposite the label side',()=>{
 const m=createRecipe('section-ratio--v0');
 for(const row of m.group.children){
  const assets=row.children.filter(o=>o.userData.asset);assert.deepEqual(assets.map(o=>o.userData.asset).sort(),['car','person','tree']);
  for(const actor of assets){const b=bounds(actor);near(b.min.y,row.position.y);assert.ok(b.max.z<0&&b.min.z>=-8,'context behind cut');if(actor.userData.asset==='person')near(b.max.y-b.min.y,1.75);if(actor.userData.asset==='tree')near(b.max.y-b.min.y,5);}
  const left=row.getObjectByName('left-cut'),right=row.getObjectByName('right-cut');near(left.userData.section.retained.zMax-left.userData.section.retained.zMin,8);assert.ok(left.userData.section.profile.length>4&&right.userData.section.profile.length>4,'zigzag back edges');
 }
 for(const narrow of [false,true]){m.layout(narrow);const heights=m.dimensions.filter(d=>d.dimensionKind==='height');assert.equal(heights.length,3);for(const d of heights){near(new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b)),12);assert.ok(narrow?d.offset[0]<0:d.offset[0]>0);assert.ok(narrow?d.labelOffsetPx[0]<0:d.labelOffsetPx[0]>0);}}
 dispose(m);
});
test('illustrative step landing and cut continuation connect without altering the original six-step kernel',()=>{
 const m=createRecipe('steps--v0'),original=bounds(m.group.getObjectByName('full-stair')),landing=m.group.getObjectByName('illustrative-landing'),next=m.group.getObjectByName('next-flight-cut'),l=bounds(landing),n=bounds(next);
 assert.ok(landing.userData.contextExtension&&next.userData.contextExtension);near(l.min.x,original.max.x);near(l.max.x-l.min.x,1.2);near(l.max.y,original.max.y);near(n.min.x,l.max.x);assert.ok(n.max.x>4.56,'broken cut continuation end');
 assert.equal(m.measurement.count,6);near(m.measurement.mainFlightRun,2.52);assert.ok(m.recipe.explanation.join().includes('does not prescribe'));m.applyView('section');assert.ok(validateCapAnchor(m.sections[1],m.labels.find(l=>l.text==='Landing').point));assert.equal(m.labels.length,4);dispose(m);
});

test('cropped outer ends use the cut material while exterior faces remain separately closed',()=>{
 for(const side of ['left','right']){const group=new THREE.Group(),solid=cutPrism(group,{profile:rectangleProfile(-2,0,2,12),zMin:-8,zMax:8,role:'sectionExterior',capRole:'cutBuilding',croppedSide:side});
 const body=solid.getObjectByName('body'),cap=solid.getObjectByName('cap'),end=solid.getObjectByName('cropped-end');assert.equal(body.userData.role,'sectionExterior');assert.equal(cap.userData.role,'cutBuilding');assert.equal(end.userData.role,'cutBuilding');assert.ok(end.userData.croppedCut);near(Math.abs(meshVolume(body)+meshVolume(cap)+meshVolume(end)),384);near(capArea(end),96);dispose({group});}
 assert.throws(()=>cutPrism(new THREE.Group(),{profile:rectangleProfile(0,0,1,1),zMin:-1,zMax:1,croppedSide:'bad'}));
});
