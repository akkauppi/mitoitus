const number = new Intl.NumberFormat('en',{maximumFractionDigits:4});
export function format(value, unit, ratioAsPercent=false) {
  if (ratioAsPercent) return number.format(value*100)+'%';
  return number.format(value)+({'m':' m','m2':' m²','deg':'°'}[unit]??'');
}

const path = rings => rings.map(ring=>'M'+ring.map(([x,y])=>x+','+(-y)).join('L')+'Z').join('');

export function planMarkup(model) {
  const ring = model.boundary.coordinates[0];
  const [xmin,ymin] = [Math.min(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1]))];
  const [xmax,ymax] = [Math.max(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[1]))];
  const court = model.court ? `<path class="court" d="${path(model.court.geometry.coordinates)}"/>` : '';
  const buildings = model.buildings.map(item=>
    `<path class="building" fill-rule="evenodd" d="${path(item.geometry.coordinates)}"/>`).join('');
  const canopy = (model.canopy??[]).map(item=>`<path class="court" d="${path(item.coordinates)}"/>`).join('');
  const transect = model.street ? `<path class="transect" d="M${model.street.transect.map(([x,y])=>x+','+(-y)).join('L')}"/>` : '';
  const range = Math.max(xmax-xmin,ymax-ymin);
  return `<svg role="img" aria-label="Measured plan of the synthetic block" viewBox="${xmin-4} ${-ymax-5} ${xmax-xmin+8} ${ymax-ymin+12}">
  <path class="study" d="${path(model.boundary.coordinates)}"/>${buildings}${court}${canopy}${transect}
  <path class="scale-line" d="M${xmin},${-ymin+3}h5m-5,-0.6v1.2m5,-1.2v1.2"/>
  <text x="${xmin}" y="${-ymin+5.7}" font-size="${range/28}">5 m</text></svg>`;
}

export function elevationMarkup(model) {
  // Orthographic massing elevation of the generated footprint extents.
  const width = model.boundary.coordinates[0][1][0];
  const height = Math.max(...model.buildings.map(building=>building.height));
  const outline = model.buildings.flatMap(item=>{
    const xs=item.geometry.coordinates[0].map(point=>point[0]);
    const left=Math.min(...xs),span=Math.max(...xs)-left;
    const floors = Array.from({length:item.storeys-1},(_,i)=>
      `<path class="floor" d="M${left},${-item.height*(i+1)/item.storeys}h${span}"/>`).join('');
    return [`<rect class="building" x="${left}" y="${-item.height}" width="${span}" height="${item.height}"/>`,floors];
  }).join('');
  return `<svg role="img" aria-label="Synthetic elevation with modelled storeys" viewBox="-4 ${-height-2} ${width+8} ${height+4}">
  <path class="scale-line" d="M0,0h${width}"/>${outline}</svg>`;
}

export function summaryMarkup(observations,dictionary) {
  return observations.filter(item=>['study','court-north-south'].includes(item.subject)).map(({measurement,value,unit,subject})=>{
    const label = measurement==='floor-area' ? 'Modelled floor area'
      : measurement==='floor-area-ratio' ? 'Modelled floor-area ratio' : dictionary.measurements[measurement].terms.en;
    const display = measurement==='courtyard-width' ? (subject==='study'?'Courtyard width (E–W)':'Courtyard depth (N–S)') : label;
    const key = subject==='court-north-south' ? 'courtyard-depth' : measurement;
    return `<dt>${display}</dt><dd data-value="${key}">${format(value,unit,['building-coverage','spatial-enclosure'].includes(measurement))}</dd>`;
  }).join('');
}

const capacityResults = [
  ['slabDepth','Slab depth (m)'], ['height','Modelled height (m)'],
  ['footprintArea','Footprint (m²)'], ['coverage','Coverage'], ['floorArea','Modelled floor area (m²)'],
  ['far','Modelled FAR'], ['unbuiltGround','Unbuilt ground (m²)'], ['residentialFloorArea','Residential (m²)'],
  ['nonResidentialFloorArea','Non-residential (m²)'], ['populationEstimate','Estimated residents'],
];

export function capacityTable(record) {
  const cells = (key, formatter) => record.alternatives.map(item=>
    `<td data-capacity-value="${key}" data-storeys="${item.storeys}">${formatter(item)}</td>`).join('');
  const formatStatus = item => ({
    'within-site-area':'Fits by area', 'exceeds-site-area':'Exceeds site area',
    'missing-target-basis':'Area basis unknown', 'incompatible-target-basis':'Incompatible area basis',
    'missing-geometry-input':'Input unknown',
  })[item.status];
  const rows = capacityResults.map(([key,label])=>`<tr><th scope="row">${label}</th>${cells(key,item=>{
    const value = item.results?.[key];
    if (value==null) return '—';
    return (key==='populationEstimate'?'≈':'')+format(value,'',key==='coverage');
  })}</tr>`).join('');
  const heading = record.alternatives.map(item=>`<th scope="col">${item.storeys} storeys</th>`).join('');
  const invalid = record.alternatives.some(item=>item.status==='exceeds-site-area');
  const required = invalid ? `<tr><th scope="row">Required footprint (m²)</th>${cells('requiredFootprint',item=>
    item.requiredFootprint==null?'—':format(item.requiredFootprint,''))}</tr>` : '';
  return `<table><thead><tr><th scope="col">Quantity</th>${heading}</tr></thead>
  <tbody><tr><th scope="row">Site-area check</th>${cells('status',formatStatus)}</tr>${required}${rows}</tbody></table>`;
}

export function capacitySummary(record) {
  const {inputs,studyArea,nonResidentialShare} = record;
  const site = studyArea===null ? 'Study area unknown' : `${inputs.siteWidth} × ${inputs.siteDepth} m site · ${format(studyArea,'m2')}`;
  const share = inputs.residentialShare===null ? 'Floor-area shares unknown'
    : `${format(inputs.residentialShare,'',true)} residential · ${format(nonResidentialShare,'',true)} non-residential`;
  const occupancy = inputs.occupancy?.areaPerResident==null ? 'Occupancy unknown'
    : `Assumed ${format(inputs.occupancy.areaPerResident,'m2')} of modelled residential area per resident`;
  return `${site}. ${share}. ${occupancy}.`;
}

export function capacityDrawing(record, selectedStoreys) {
  const selected = record.alternatives.find(item=>item.storeys===selectedStoreys);
  if (!selected?.model) return '<p>Plan unavailable for this alternative.</p>';
  const elevation = selected.results.height===null ? '' : elevationMarkup(selected.model);
  return `<figure>${planMarkup(selected.model)}<div class="capacity-elevation">${elevation}</div>
  <figcaption>${selectedStoreys}-storey slab</figcaption></figure>`;
}
