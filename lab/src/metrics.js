// Horizontal plan areas in square metres. Each function preserves the caller's area basis.
export const floorArea = (footprint, storeys) => footprint*storeys;
export const landRatio = (area, denominator) => area/denominator;

export const floorFormulas = Object.freeze({
  'building-coverage':'C = A_footprint union / A_study',
  'floor-area':'A_floor = Σ (A_footprint × storeys)',
  'floor-area-ratio':'FAR = A_floor / A_study',
  'equal-floor-plates':'FAR = building coverage × storeys',
});

export const equalDensityPlotSide = 32;
export const equalDensityStoreyHeight = 3;
export const equalDensityCases = [16,8,4].map((depth,index)=>{
  const floors = 2**(index+1);
  const plotArea = equalDensityPlotSide**2;
  const footprintArea = equalDensityPlotSide*depth;
  const modelledFloorArea = floorArea(footprintArea,floors);
  return {depth,floors,plotArea,footprintArea,floorArea:modelledFloorArea,
    coverage:landRatio(footprintArea,plotArea),far:landRatio(modelledFloorArea,plotArea)};
});
