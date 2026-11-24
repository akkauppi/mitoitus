import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fixtures} from '../morphology/fixtures.mjs';
import {buildFixtures,check,dictionary} from '../morphology/import.mjs';
import {comparisonGroups} from '../morphology/exchange.mjs';
import {measurements,perimeterBlock,defaultParameters,polygonArea,rectangle} from '../morphology/geometry.mjs';

const built = buildFixtures();
for (const [id,fixture] of Object.entries(fixtures)) {
  test(id+' preserves independently expected geometry and all exchange observations',()=>{
    const result = measurements(fixture.make(fixture.parameters));
    assert.deepEqual(result.study,fixture.expected);
    const record = built.find(item=>item.id===id).exchange;
    assert.deepEqual(Object.fromEntries(record.observations.filter(row=>row.subject==='study')
      .map(row=>[row.measurement,row.value])),fixture.expected);
    assert.ok(record.observations.every(row=>row.status==='synthetic'));
  });
}

test('declared axes, asymmetrical heights, and fixed-angle street results',()=>{
  const detached = built.find(item=>item.id==='detached-building').exchange.observations;
  assert.equal(detached.find(row=>row.measurement==='building-depth').value,10);
  assert.equal(detached.find(row=>row.measurement==='building-length').value,15);
  assert.equal(detached.find(row=>row.measurement==='building-orientation').value,90);
  const street = built.find(item=>item.id==='asymmetric-street').exchange.observations;
  assert.deepEqual(street.filter(row=>row.measurement==='building-height').map(row=>row.value),[12,18]);
  assert.equal(street.find(row=>row.measurement==='height-to-width-ratio').value,.75);
  assert.equal(built.find(item=>item.id==='point-buildings').exchange.observations
    .some(row=>row.measurement==='building-orientation'),false);
});

test('parameter sweeps use the unchanged plan at every height and valid courtyard extents',()=>{
  for (const open of [false,true]) {
    for (const depth of [4,8,12]) {
      for (const width of [32,40,56]) {
        for (const length of [28,32,48]) {
          const parameters = {...defaultParameters,depth,width,length};
          const model = perimeterBlock(parameters,open);
          const measured = measurements(model).study;
          const expectedArea = open ? width*depth+2*(length-depth)*depth : width*length-(width-2*depth)*(length-2*depth);
          assert.equal(measured['footprint-area'],expectedArea);
          assert.equal(measured['floor-area-ratio'],expectedArea*4/(width*length));
          assert.equal(measured['courtyard-area'],(width-2*depth)*(length-2*depth));
          assert.deepEqual(measurements(perimeterBlock({...parameters,height:24},open)).study,measured);
        }
      }
    }
  }
  assert.throws(()=>perimeterBlock({...defaultParameters,depth:20}),RangeError);
});

test('polygon area supports holes and metric coordinates with nonzero origins',()=>{
  assert.equal(polygonArea([rectangle(25000000,6670000,40,32),rectangle(25000008,6670008,24,16)]),896);
});

test('exchange rejects schema, coordinate, method, provenance and distribution mismatches',()=>{
  const original = built[0].exchange;
  const invalid = [
    [r=>r.schemaVersion='2.0.0',/schemaVersion/],
    [r=>r.observations[0].unit='m',/version or unit/],
    [r=>r.observations[0].methodVersion='999',/version or unit/],
    [r=>r.observations[0].status='measured',/Status contradicts/],
    [r=>r.observations[0].guidanceReferences=['nonexistent'],/Unknown guidance/],
    [r=>r.observations.push(r.observations[0]),/Duplicate observation/],
    [r=>r.observations[0].distribution={sampleSize:2,min:5,max:10,mean:20},/Invalid distribution/],
    [r=>r.studyArea.planarGeometry.coordinates[0].pop(),/not closed/],
    [r=>r.dataset.rightsStatus='licence-declared',/licence/],
    [r=>{r.studyArea.crs={...r.studyArea.crs,kind:'projected',id:'EPSG:4326'};},/projected metres/],
    [r=>r.studyArea.geojson=r.studyArea.planarGeometry,/do not have geographic/],
    [r=>r.observations.find(row=>row.measurement==='building-coverage').value=1.1,/permitted range/],
  ];
  for (const [mutate,expected] of invalid) {
    const revised = structuredClone(original);
    mutate(revised);
    assert.throws(()=>check(revised),expected);
  }
  assert.equal(Object.keys(dictionary.measurements).length,15);
});

test('comparison keeps statuses, declared bases and different measurements separate',()=>{
  const groups = comparisonGroups(built.map(fixture=>fixture.exchange));
  const coverage = groups.find(group=>group.measurement==='building-coverage');
  assert.equal(coverage.records.length,8);
  assert.equal(coverage.kind,'synthetic');
  assert.equal(coverage.status,'synthetic');
  const court = groups.filter(group=>group.measurement==='courtyard-width');
  assert.equal(court.length,2);
  assert.notEqual(court[0].basis,court[1].basis);
});
