import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {capacityConfiguration,loadCapacityConfiguration} from '../morphology/capacity-configuration.mjs';

const guide = readFileSync(new URL('../docs/CAPACITY-CONFIGURATIONS.md',import.meta.url),'utf8');
const example = JSON.parse(guide.match(/```json\n([\s\S]+?)\n```/)[1]);
const read = value => loadCapacityConfiguration(JSON.stringify(value));

test('the documented input-only example produces the exact study area, FAR and footprints',()=>{
  const {record,selectedStoreys,stale} = read(example);
  assert.equal(selectedStoreys,6);
  assert.equal(stale,false);
  assert.equal(record.studyArea,1200);
  const results = record.alternatives.map(item=>item.results);
  assert.deepEqual(results.map(row=>row.far),[2,2,2]);
  assert.deepEqual(results.map(row=>row.footprintArea),[600,400,300]);
  assert.deepEqual(results.map(row=>row.coverage),[.5,1/3,.25]);
  assert.deepEqual(results.map(row=>row.populationEstimate),[48,48,48]);
});

test('current and older downloads round trip, including optional result data',()=>{
  const {record,selectedStoreys} = read(example);
  const full = capacityConfiguration(record,selectedStoreys,'2026-11-25.5');
  assert.equal(full.edition,'2026-11-25.5');
  assert.equal(full.configuration.revision,undefined);
  for (const payload of [full,{...full,edition:undefined},capacityConfiguration(record,selectedStoreys,'2026-11-25.5',true)]) {
    assert.deepEqual(read(payload),{record,selectedStoreys,stale:false});
  }
  const reordered = structuredClone(full);
  const saved = reordered.configuration.alternatives[0].results;
  reordered.configuration.alternatives[0].results = Object.fromEntries(Object.entries(saved).reverse());
  assert.equal(read(reordered).stale,false);
});

test('edited inputs invalidate supplied results, while occupancy leaves all geometry intact',()=>{
  const {record,selectedStoreys} = read(example);
  const full = capacityConfiguration(record,selectedStoreys,'2026-11-25.5');
  const modified = structuredClone(full);
  modified.configuration.inputs.occupancy.areaPerResident = 32;
  modified.configuration.alternatives[0].model.buildings[0].height = 900;
  const updated = read(modified);
  assert.equal(updated.stale,true);
  assert.deepEqual(updated.record.alternatives.map(item=>item.model),record.alternatives.map(item=>item.model));
  assert.deepEqual(updated.record.alternatives.map(item=>item.results.populationEstimate),[60,60,60]);

  modified.configuration.inputs.siteWidth = 10;
  const exceeded = read(modified).record;
  assert.equal(exceeded.studyArea,300);
  assert.deepEqual(exceeded.alternatives.map(item=>item.status),['exceeds-site-area','exceeds-site-area','within-site-area']);
  assert.deepEqual(exceeded.alternatives.map(item=>item.requiredFootprint),[600,400,300]);
});

test('missing inputs and selection stay null through an exchange',()=>{
  const sparse = {...example,selectedStoreys:undefined,configuration:{inputs:{siteWidth:null,occupancy:null}}};
  const {record,selectedStoreys} = read(sparse);
  assert.deepEqual(Object.values(record.inputs),Array(8).fill(null));
  assert.equal(record.studyArea,null);
  assert.equal(selectedStoreys,null);
  assert.deepEqual(read(capacityConfiguration(record,selectedStoreys,'2026-11-25.5')),{record,selectedStoreys,stale:false});
});

test('malformed inputs and incompatible metadata produce specific errors',()=>{
  assert.throws(()=>loadCapacityConfiguration('{'),/Invalid JSON/);
  assert.throws(()=>read(null),/must be a JSON object/);
  for (const [edit, message] of [
    [file=>{file.schemaVersion='2.0.0';},/Unsupported capacity format/],
    [file=>{file.referenceRevision='residential-block-capacity/r2';},/Use referenceRevision/],
    [file=>{file.configuration.inputs=null;},/configuration.inputs must be a JSON object/],
    [file=>{file.configuration.inputs.siteWidth=-1;},/Site width must be a finite positive number/],
    [file=>{file.configuration.inputs.storeys=[2,4,6,8];},/one to three storey counts/],
    [file=>{file.configuration.inputs.storeys=[1,1000];},/storey counts from 1 to 100/],
    [file=>{file.configuration.inputs.storeys=[6,6];},/distinct positive integers/],
    [file=>{file.configuration.inputs.targetFloorAreaBasis='statutory-kerrosala';},/modelled-full-floor-plates/],
    [file=>{file.configuration.inputs.occupancy.basis='net-dwelling-area';},/modelled-residential-full-floor-plates/],
    [file=>{delete file.configuration.inputs.occupancy.basis;},/modelled-residential-full-floor-plates/],
    [file=>{file.configuration.units={siteWidth:'ft'};},/Use m for siteWidth/],
    [file=>{file.selectedStoreys=2;},/Selected storeys must match/],
  ]) {
    const changed = structuredClone(example);
    edit(changed);
    assert.throws(()=>read(changed),message);
  }
});
