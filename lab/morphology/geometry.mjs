// Plan coordinates are Cartesian metres, with +y up on the north-up drawing.
export const rectangle = (x, y, width, depth) => [[x,y],[x+width,y],[x+width,y+depth],[x,y+depth],[x,y]];

export function ringArea(ring) {
  const [originX,originY] = ring[0];
  return Math.abs(ring.slice(1).reduce((sum,[x,y],i) => {
    const [previousX,previousY] = ring[i];
    return sum+(previousX-originX)*(y-originY)-(x-originX)*(previousY-originY);
  },0))/2;
}

export function polygonArea(rings) {
  return ringArea(rings[0])-rings.slice(1).reduce((sum,ring) => sum+ringArea(ring),0);
}

export const floorArea = (footprint, storeys) => footprint*storeys;
export const landRatio = (area, studyArea) => area/studyArea;

export const formulas = {
  'footprint-area':'A = area(exterior) − Σ area(holes)',
  'building-coverage':'C = A_footprint union / A_study',
  'floor-area':'A_floor = Σ (A_footprint × storeys)',
  'floor-area-ratio':'FAR = A_floor / A_study',
  'courtyard-area':'A_court = area(explicit courtyard polygon)',
  'courtyard-width':'W_court = length(selected east–west transect)',
  'spatial-enclosure':'E = length(walled court edges) / perimeter(court)',
  'height-to-width-ratio':'H/W = (H_left + H_right) / (2 × W)',
};

export const polygon = (...coordinates) => ({type:'Polygon',coordinates});
export const defaultParameters = {width:40, length:32, depth:8, height:12, storeys:4};
export const limits = {width:[32,56], length:[28,48], depth:[4,12], height:[6,24], storeys:[1,8]};

export function building(id, rings, height, storeys) {
  return {id,geometry:polygon(...rings),height,storeys};
}

export function perimeterBlock(parameters, open=false) {
  const {width,length,depth,height,storeys} = parameters;
  for (const [key,[min,max]] of Object.entries(limits)) {
    if (!Number.isInteger(parameters[key]) || parameters[key]<min || parameters[key]>max)
      throw new RangeError(key+' outside the integer parameter range');
  }
  const courtWidth = width-2*depth, courtLength = length-2*depth;
  const court = rectangle(depth,depth,courtWidth,courtLength);
  const footprint = open
    ? [rectangle(0,0,width,depth),rectangle(0,depth,depth,length-depth),rectangle(width-depth,depth,depth,length-depth)]
    : [rectangle(0,0,width,length),court];
  const buildings = open
    ? footprint.map((ring,index) => building('wing-'+(index+1),[ring],height,storeys))
    : [building('perimeter',footprint,height,storeys)];
  const boundary = polygon(rectangle(0,0,width,length));
  return {boundary,buildings,court:{geometry:polygon(court), width:courtWidth, length:courtLength,
    walledSides:open ? ['south','east','west'] : ['south','north','east','west']}};
}

export function measurements(model) {
  const studyArea = polygonArea(model.boundary.coordinates);
  // Synthetic fixtures keep building interiors disjoint and wholly within the study area.
  const sites = model.buildings.map(item => ({
    id:item.id, footprintArea:polygonArea(item.geometry.coordinates), height:item.height, storeys:item.storeys,
    ...(item.axis ? axisMeasurements(item.geometry.coordinates[0],item.axis) : {}),
  }));
  const footprintArea = sites.reduce((sum,item) => sum+item.footprintArea,0);
  const modelledFloorArea = sites.reduce((sum,item) => sum+floorArea(item.footprintArea,item.storeys),0);
  const result = {
    'study-area':studyArea, 'footprint-area':footprintArea,
    'building-coverage':landRatio(footprintArea,studyArea),
    'floor-area':modelledFloorArea, 'floor-area-ratio':landRatio(modelledFloorArea,studyArea),
  };
  if (model.court) {
    const {geometry,width,length,walledSides} = model.court;
    result['courtyard-area'] = polygonArea(geometry.coordinates);
    result['courtyard-width'] = width;
    result['spatial-enclosure'] = walledSides.reduce(
      (sum,side) => sum+(['north','south'].includes(side)?width:length),0)/(2*(width+length));
  }
  if (model.canopy) {
    const canopyArea = model.canopy.reduce((sum,geometry)=>sum+polygonArea(geometry.coordinates),0);
    result['canopy-coverage'] = landRatio(canopyArea,studyArea);
  }
  if (model.street) {
    const [left,right] = model.street.transect;
    const width = Math.hypot(right[0]-left[0],right[1]-left[1]);
    const facing = model.street.buildings.map(id=>sites.find(site=>site.id===id).height);
    result['street-space-width'] = width;
    result['height-to-width-ratio'] = (facing[0]+facing[1])/(2*width);
  }
  return {study:result,buildings:sites};
}

function axisMeasurements(ring,axis) {
  const [dx,dy] = axis;
  const length = Math.hypot(dx,dy);
  const span = (x,y) => {
    const distances = ring.map(([a,b])=>(a*x+b*y)/length);
    return Math.max(...distances)-Math.min(...distances);
  };
  const bearing = ((Math.atan2(dx,dy)*180/Math.PI)%180+180)%180;
  return {length:span(dx,dy),depth:span(-dy,dx),orientation:bearing};
}
