import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRecipe} from '../src/registry.js';
import {examples} from '../morphology/knowledge-examples.mjs';
import {depthAtEasting, measurements} from '../morphology/geometry.mjs';
import {fixtures} from '../morphology/fixtures.mjs';
import {buildFixtures, check} from '../morphology/import.mjs';

const results = examples();

test('equal-FAR scene preserves the analytical floor areas, coverage and physical footprints',()=>{
  const model = createRecipe('equal-density--v0');
  const cases = results['equal-far'].cases;
  assert.deepEqual(model.measurement.cases,cases);
  assert.deepEqual(cases.map(c=>[c.footprintArea,c.floors,c.coverage,c.floorArea,c.far]),[
    [512,2,.5,1024,1],[256,4,.25,1024,1],[128,8,.125,1024,1],
  ]);
  for (const [i,plot] of model.group.children.entries()) {
    const footprint = plot.getObjectByName('footprint');
    footprint.geometry.computeBoundingBox();
    const {min,max} = footprint.geometry.boundingBox;
    const projected = (max.x-min.x)*(max.z-min.z);
    assert.equal(projected,cases[i].footprintArea);
  }
});

test('nested plot, block and district denominators reuse the same floor area',()=>{
  assert.deepEqual(results['nested-denominators'].cases.map(c=>[c.scope,c.landArea,c.floorArea,c.far]),[
    ['plot',1024,1024,1],['block',4096,1024,.25],['district',16384,1024,.0625],
  ]);
});

test('a selected wing depth and the full envelope have compatible units and distinct bases',()=>{
  const [l,irregular] = results['depth-methods'].cases;
  const model = fixtures[l.fixture].make(fixtures[l.fixture].parameters);
  assert.equal(measurements(model).buildings[0].depth,l.envelopeDepth);
  assert.deepEqual([l.easting,l.envelopeDepth,l.transectDepth],[20,16,6]);
  assert.equal(irregular.envelopeDepth,14);
  assert.ok(Math.abs(irregular.transectDepth-118/9)<1e-12);
  const [ring] = model.buildings[0].geometry.coordinates;
  assert.throws(()=>depthAtEasting(ring,13),/vertex/);
  assert.throws(()=>depthAtEasting(ring,1),/contiguous/);
});

test('the exchange rejects a measured label for repeated-footprint floor area',()=>{
  // Transport-only mutation of a synthetic fixture. This stays outside publication.
  const sample = structuredClone(buildFixtures()[0].exchange);
  sample.kind = 'empirical';
  sample.studyArea.crs.kind = 'projected';
  sample.studyArea.crs.id = 'EPSG:3067';
  for (const observation of sample.observations) observation.status='estimated';
  assert.doesNotThrow(()=>check(sample));
  sample.observations.find(observation=>observation.measurement==='floor-area').status='measured';
  assert.throws(()=>check(sample),/modelled status/);
});
