import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRecipe,ROOT_RECIPE} from '../src/registry.js';

test('root recipe measures only the 5 × 5 × 1 m soil block',()=>{
  const model=createRecipe('trees--v0');
  const soils=[];model.group.traverseVisible(o=>{if(o.isMesh&&o.userData.role==='soil')soils.push(o);});
  assert.equal(soils.length,1);
  const b=new THREE.Box3().setFromObject(soils[0]),size=b.getSize(new THREE.Vector3());
  assert.deepEqual(size.toArray(),[5,1,5]);
  assert.equal(size.x*size.y*size.z,ROOT_RECIPE.measurements.soilVolume);
  assert.equal(b.max.y,0);assert.equal(b.min.y,-1);
  assert.deepEqual(ROOT_RECIPE.allowedCameras,['iso','plan','front','section']);
  assert.equal(model.labels.length,2);
  assert.equal(model.dimensions.length,3);
  for(const d of model.dimensions)assert.ok([1,5].includes(new THREE.Vector3(...d.a).distanceTo(new THREE.Vector3(...d.b))));
  const geometries=new Set(),materials=new Set();model.group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});
test('unknown recipes fail explicitly',()=>assert.throws(()=>createRecipe('invented')));
