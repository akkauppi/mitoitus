import {measurements, polygonArea} from './geometry.mjs';

export function syntheticPackage(id, label, model, dictionary, parameters) {
  const result = measurements(model);
  const observations = [];
  function add(measurement, subject, value, basis, geometry, guidanceReferences) {
    const definition = dictionary.measurements[measurement];
    const method = measurement==='floor-area' ? 'identical-footprint-times-storeys' : Object.keys(definition.methods)[0];
    observations.push({id:subject+'.'+measurement,measurement,method,methodVersion:definition.methods[method].version,
      subject,value,unit:definition.unit,status:'synthetic',basis:basis??definition.basis,
      ...(geometry ? {representativePlanarGeometry:geometry} : {}),
      ...(guidanceReferences ? {guidanceReferences} : {})});
  }
  for (const [measurement,value] of Object.entries(result.study)) {
    const basis = measurement==='floor-area' ? 'Repeated identical full footprint on each modelled storey'
      : measurement==='floor-area-ratio' ? 'Repeated-footprint modelled floor area / synthetic block boundary' : null;
    add(measurement,'study',value,basis,measurement==='courtyard-area' ? model.court.geometry : null,
        measurement==='floor-area-ratio'?['equal-density']:undefined);
  }
  if (model.court) {
    add('courtyard-width','court-north-south',model.court.length,'Selected north–south courtyard transect',null);
  }
  for (const item of result.buildings) {
    const geometry = model.buildings.find(building=>building.id===item.id).geometry;
    add('footprint-area',item.id,item.footprintArea,null,geometry);
    add('building-height',item.id,item.height,'Model datum to flat massing top',null);
    if (item.orientation!==undefined) {
      add('building-orientation',item.id,item.orientation,'Axial bearing relative to positive local north',null);
      add('building-length',item.id,item.length,'Footprint span parallel to the named axis',null);
      add('building-depth',item.id,item.depth,'Footprint span perpendicular to the named axis',null);
    }
  }
  return {
    schemaVersion:'0.1.0',dictionaryVersion:dictionary.version,kind:'synthetic',
    studyArea:{id,label,boundaryBasis:'Exact fixture study boundary',crs:{
      kind:'local',id:'dubious-synthetic-cartesian/1',axes:['east','north'],units:'m',verticalDatum:'synthetic base = 0 m'},
      planarGeometry:model.boundary},
    dataset:{id:'dubious-synthetic-morphology',title:'Dubious synthetic morphology fixtures',edition:'1.0.0',
      attribution:'Dubious morphology laboratory',rightsStatus:'unresolved'},
    provenance:{producer:'Dubious',software:'Dubious morphology geometry 1.0.0',
      process:'Analytical local geometry; parameters '+JSON.stringify(parameters),
      limitations:'Constructed geometry. Source-area rules and empirical uncertainty are outside the fixture.'},
    observations,
  };
}

export function validatePackage(record, dictionary, compileSchema, allowedClaims) {
  if (!compileSchema(record)) throw new Error(JSON.stringify(compileSchema.errors));
  const {studyArea,kind} = record;
  if (kind==='empirical' && studyArea.crs.kind!=='projected') throw new Error('Empirical packages require a projected measurement CRS');
  if (studyArea.crs.kind==='projected' && !/^EPSG:[1-9]\d*$/.test(studyArea.crs.id))
    throw new Error('Use an EPSG identifier for the projected measurement CRS');
  if (studyArea.crs.id==='EPSG:4326' || studyArea.crs.id==='EPSG:4258')
    throw new Error('The measurement CRS must use projected metres');
  if (studyArea.geojson && kind==='synthetic') throw new Error('Synthetic fixtures do not have geographic coordinates');
  const requireGeometry = (geometry, geographic=false) => {
    for (const ring of geometry.coordinates) {
      const start = ring[0], end = ring.at(-1);
      if (start[0]!==end[0] || start[1]!==end[1]) throw new Error('Polygon ring is not closed');
      for (const [x,y] of ring) {
        if (!Number.isFinite(x)||!Number.isFinite(y)) throw new Error('Non-finite coordinate');
        if (geographic && (Math.abs(x)>180||Math.abs(y)>90)) throw new Error('GeoJSON longitude/latitude out of bounds');
      }
    }
    if (!(polygonArea(geometry.coordinates)>0)) throw new Error('Polygon must have positive exterior-minus-hole area');
  };
  if (studyArea.planarGeometry) requireGeometry(studyArea.planarGeometry);
  if (studyArea.geojson) requireGeometry(studyArea.geojson,true);
  const seen = new Set();
  for (const row of record.observations) {
    if (seen.has(row.id)) throw new Error('Duplicate observation ID: '+row.id);
    seen.add(row.id);
    const definition = Object.hasOwn(dictionary.measurements,row.measurement) && dictionary.measurements[row.measurement];
    const method = definition && Object.hasOwn(definition.methods,row.method) && definition.methods[row.method];
    if (!method || method.version!==row.methodVersion || row.unit!==definition.unit)
      throw new Error('Unrecognized measurement, method, version or unit: '+row.id);
    if ((row.status==='synthetic') !== (kind==='synthetic')) throw new Error('Status contradicts package kind: '+row.id);
    if (row.method==='identical-footprint-times-storeys' && !['synthetic','estimated','inferred'].includes(row.status))
      throw new Error('Repeated floor plates require a modelled status');
    const cap = ['building-coverage','spatial-enclosure','canopy-coverage'].includes(row.measurement);
    function checkValue(value) {
      if (!Number.isFinite(value)||value<0|| (cap&&value>1)|| (row.unit==='deg'&&value>=180))
        throw new Error('Observation outside permitted range: '+row.id);
    }
    checkValue(row.value);
    if (row.distribution) {
      const {min,max,mean} = row.distribution;
      [min,max,mean].forEach(checkValue);
      if (!(min<=mean&&mean<=max) || (row.distribution.sampleSize===1 && min!==max))
        throw new Error('Invalid distribution: '+row.id);
    }
    if (row.representativePlanarGeometry) requireGeometry(row.representativePlanarGeometry);
    if (row.representativeGeojson) {
      if (kind==='synthetic') throw new Error('Synthetic observations do not have geographic coordinates');
      requireGeometry(row.representativeGeojson,true);
    }
    for (const id of row.guidanceReferences??[]) {
      if (!allowedClaims.has(id)) throw new Error('Unknown guidance claim: '+id);
    }
  }
  return record;
}

export function comparisonGroups(packages) {
  const groups = new Map();
  for (const record of packages) {
    for (const row of record.observations) {
      const dimensions = {
        kind:record.kind, status:row.status, measurement:row.measurement, method:row.method,
        methodVersion:row.methodVersion, unit:row.unit, basis:row.basis,
        scope:row.subject==='study'?'study':'feature',
        ...(row.subject==='study'?{boundaryBasis:record.studyArea.boundaryBasis}:{}),
        ...(row.measurement==='building-orientation'?{northReference:record.studyArea.crs.id}:{}),
      };
      const key = JSON.stringify(dimensions);
      if (!groups.has(key)) groups.set(key,{...dimensions,records:[]});
      groups.get(key).records.push({dataset:record.dataset.id,edition:record.dataset.edition,
        area:record.studyArea.id,subject:row.subject,observation:row.id,value:row.value,
        ...(row.distribution?{distribution:row.distribution}:{})});
    }
  }
  return [...groups.values()];
}
