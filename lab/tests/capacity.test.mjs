import assert from 'node:assert/strict';
import {test} from 'node:test';
import {equalDensityCases} from '../src/metrics.js';
import {MODELLED_PLATES,MODELLED_RESIDENTIAL,referenceCapacityInputs,residentialCapacity} from '../morphology/capacity.mjs';

const run = changed => residentialCapacity({...referenceCapacityInputs,...changed});

test('alternatives reproduce equal FAR and make allocation and occupancy explicit',()=>{
  const result = run({});
  assert.equal(result.studyArea,1024);
  assert.equal(result.inputs.targetFloorAreaBasis,MODELLED_PLATES);
  assert.equal(result.inputs.occupancy.basis,MODELLED_RESIDENTIAL);
  assert.equal(result.nonResidentialShare,.25);
  assert.deepEqual(result.alternatives.map((item,i)=>{
    assert.equal(item.results.footprintArea,equalDensityCases[i].footprintArea);
    const ring = item.model.buildings[0].geometry.coordinates[0];
    const [east,north] = ring[2];
    assert.equal(east*north,item.results.footprintArea);
    assert.equal(item.model.buildings[0].height,item.storeys*3);
    const r = item.results;
    return [item.storeys,r.footprintArea,r.coverage,r.floorArea,r.far,r.unbuiltGround,
      r.residentialFloorArea,r.nonResidentialFloorArea,r.populationEstimate];
  }),[
    [2,512,.5,1024,1,512,768,256,19.2],
    [4,256,.25,1024,1,768,768,256,19.2],
    [8,128,.125,1024,1,896,768,256,19.2],
  ]);
});

test('site-area failure preserves required area and suppresses geometry and results',()=>{
  const result = run({targetFloorArea:2304});
  const [low,mid,high] = result.alternatives;
  assert.deepEqual(low,{storeys:2,status:'exceeds-site-area',requiredFootprint:1152,model:null,results:null});
  assert.equal(mid.results.footprintArea,576);
  assert.equal(high.results.far,2.25);
  assert.equal(run({targetFloorArea:2048}).alternatives[0].results.unbuiltGround,0);
});

test('missing target, site, shares, storeys, height and occupancy remain unknown',()=>{
  const target = run({targetFloorArea:null});
  assert.equal(target.inputs.targetFloorArea,null);
  assert.equal(target.alternatives[0].results,null);
  assert.equal(target.alternatives[0].requiredFootprint,null);
  assert.equal(run({siteDepth:null}).studyArea,null);
  assert.equal(run({storeys:null}).comparisonStatus,'missing-storey-options');
  assert.deepEqual(run({storeys:null}).alternatives,[]);
  assert.equal(run({storeyHeight:null}).alternatives[0].results.height,null);
  const share = run({residentialShare:null});
  assert.equal(share.alternatives[0].populationStatus,'missing-residential-share');
  assert.equal(share.alternatives[0].results.nonResidentialFloorArea,null);
  for (const occupancy of [null,{basis:MODELLED_RESIDENTIAL}]) {
    const unknown = run({occupancy});
    assert.equal(unknown.alternatives[0].populationStatus,'missing-occupancy');
    assert.equal(unknown.alternatives[0].results.populationEstimate,null);
    assert.equal(unknown.alternatives[0].results.floorArea,1024);
  }
  assert.equal(run({residentialShare:0}).alternatives[0].results.populationEstimate,0);
  assert.equal(run({residentialShare:0,occupancy:null}).alternatives[0].results.populationEstimate,null);
});

test('incompatible area bases remain distinct from missing inputs',()=>{
  const wrongTarget = run({targetFloorAreaBasis:'statutory-kerrosala'});
  assert.equal(wrongTarget.alternatives[0].status,'incompatible-target-basis');
  assert.equal(wrongTarget.alternatives[0].model,null);
  assert.equal(run({targetFloorAreaBasis:null}).alternatives[0].status,'missing-target-basis');
  const wrongOccupancy = run({occupancy:{basis:'net-dwelling-area',areaPerResident:40}});
  assert.equal(wrongOccupancy.alternatives[0].populationStatus,'incompatible-occupancy-basis');
  assert.equal(wrongOccupancy.alternatives[0].results.populationEstimate,null);
  assert.equal(wrongOccupancy.alternatives[0].results.residentialFloorArea,768);
});

test('a different rectangular site and storey count reproduce the computed geometry',()=>{
  const result = run({siteWidth:30,siteDepth:20,targetFloorArea:900,storeys:[3],residentialShare:.8,
    occupancy:{basis:MODELLED_RESIDENTIAL,areaPerResident:24}});
  const [{results}] = result.alternatives;
  assert.equal(result.studyArea,600);
  assert.equal(results.slabDepth,10);
  assert.equal(results.footprintArea,300);
  assert.equal(results.far,1.5);
  assert.equal(results.populationEstimate,30);
  assert.throws(()=>run({storeys:[2,2]}),/distinct positive integers/);
  assert.throws(()=>run({occupancy:{basis:MODELLED_RESIDENTIAL,areaPerResident:0}}),/finite positive/);
});

test('editing a returned configuration cannot change future reference calculations',()=>{
  const expected = run({});
  const edited = run({});
  edited.inputs.occupancy.areaPerResident = 1;
  edited.formulas.populationEstimate.dependsOn.pop();
  edited.alternatives[0].model.buildings[0].storeys = 10;
  assert.deepEqual(run({}),expected);
});
