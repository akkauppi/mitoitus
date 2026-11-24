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
