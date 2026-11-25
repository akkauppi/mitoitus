// Residential capacity exercise. Inputs use modelled full floor plates.
import {equalDensityCases,equalDensityPlotSide,equalDensityStoreyHeight,floorFormulas,landRatio} from '../src/metrics.js';
import {building,measurements,polygon,polygonArea,rectangle} from './geometry.mjs';

export const CAPACITY_REVISION = 'residential-block-capacity/r1';
export const MODELLED_PLATES = 'modelled-full-floor-plates';
export const MODELLED_RESIDENTIAL = 'modelled-residential-full-floor-plates';

export const referenceCapacityInputs = Object.freeze({
  siteWidth:equalDensityPlotSide, siteDepth:equalDensityPlotSide,
  targetFloorArea:equalDensityCases[0].floorArea,
  targetFloorAreaBasis:MODELLED_PLATES,
  storeys:Object.freeze(equalDensityCases.map(item=>item.floors)),
  storeyHeight:equalDensityStoreyHeight,
  residentialShare:.75,
  occupancy:Object.freeze({areaPerResident:40,basis:MODELLED_RESIDENTIAL}),
});

const capacityFormulas = () => ({
  studyArea:{expression:'A_site = area(study boundary)',dependsOn:['siteWidth','siteDepth']},
  requiredFootprint:{expression:'A_required = A_target / N',dependsOn:['targetFloorArea','storeys']},
  slabDepth:{expression:'D_slab = A_required / W_site',dependsOn:['requiredFootprint','siteWidth']},
  height:{expression:'H = N × H_storey',dependsOn:['storeys','storeyHeight']},
  footprintArea:{expression:'A_footprint = area(slab polygon)',dependsOn:['siteWidth','slabDepth']},
  floorArea:{expression:floorFormulas['floor-area'],dependsOn:['footprintArea','storeys']},
  coverage:{expression:floorFormulas['building-coverage'],dependsOn:['footprintArea','studyArea']},
  far:{expression:floorFormulas['floor-area-ratio'],dependsOn:['floorArea','studyArea']},
  unbuiltGround:{expression:'A_unbuilt = A_site − A_footprint',dependsOn:['studyArea','footprintArea']},
  residentialFloorArea:{expression:'A_res = A_floor × residential share',dependsOn:['floorArea','residentialShare']},
  nonResidentialShare:{expression:'Other share = 1 − residential share',dependsOn:['residentialShare']},
  nonResidentialFloorArea:{expression:'A_other = A_floor − A_res',dependsOn:['floorArea','residentialFloorArea']},
  populationEstimate:{expression:'P_est = A_res / modelled m² per resident',dependsOn:['residentialFloorArea','occupancy']},
});

function inputNumber(value, title, positive=false) {
  if (value == null) return null;
  if (!Number.isFinite(value) || value<0 || (positive && value===0))
    throw new RangeError(title+' must be a finite '+(positive?'positive':'nonnegative')+' number');
  return value;
}

export function residentialCapacity(config) {
  const inputs = {
    siteWidth:inputNumber(config.siteWidth,'Site width',true),
    siteDepth:inputNumber(config.siteDepth,'Site depth',true),
    targetFloorArea:inputNumber(config.targetFloorArea,'Target floor area',true),
    targetFloorAreaBasis:config.targetFloorAreaBasis??null,
    storeys:config.storeys==null ? null : [...config.storeys],
    storeyHeight:inputNumber(config.storeyHeight,'Storey height',true),
    residentialShare:inputNumber(config.residentialShare,'Residential share'),
    occupancy:config.occupancy==null ? null : {
      areaPerResident:inputNumber(config.occupancy.areaPerResident,'Modelled area per resident',true),
      basis:config.occupancy.basis??null,
    },
  };
  if (inputs.storeys!==null && (!inputs.storeys.length || new Set(inputs.storeys).size!==inputs.storeys.length ||
      inputs.storeys.some(n=>!Number.isSafeInteger(n)||n<1)))
    throw new RangeError('Storey alternatives must be distinct positive integers');
  if (inputs.residentialShare>1) throw new RangeError('Residential share must be between zero and one');

  const boundary = inputs.siteWidth!==null && inputs.siteDepth!==null
    ? polygon(rectangle(0,0,inputs.siteWidth,inputs.siteDepth)) : null;
  const studyArea = boundary ? polygonArea(boundary.coordinates) : null;
  if (boundary && (!Number.isFinite(studyArea) || studyArea<=0)) throw new RangeError('Invalid study area');
  const correctTargetBasis = inputs.targetFloorAreaBasis===MODELLED_PLATES;
  const correctOccupancyBasis = inputs.occupancy?.basis===MODELLED_RESIDENTIAL;
  const nonResidentialShare = inputs.residentialShare===null ? null : 1-inputs.residentialShare;
  const alternatives = (inputs.storeys??[]).map(storeys=>{
    const requiredFootprint = correctTargetBasis && inputs.targetFloorArea!==null ? inputs.targetFloorArea/storeys : null;
    if (inputs.targetFloorArea!==null && inputs.targetFloorAreaBasis===null)
      return {storeys,status:'missing-target-basis',requiredFootprint,model:null,results:null};
    if (inputs.targetFloorArea!==null && !correctTargetBasis)
      return {storeys,status:'incompatible-target-basis',requiredFootprint,model:null,results:null};
    if (requiredFootprint===null || studyArea===null)
      return {storeys,status:'missing-geometry-input',requiredFootprint,model:null,results:null};
    if (requiredFootprint>studyArea)
      return {storeys,status:'exceeds-site-area',requiredFootprint,model:null,results:null};

    const slabDepth = Math.min(requiredFootprint/inputs.siteWidth, inputs.siteDepth);
    if (slabDepth===0) throw new RangeError('Slab depth too small to represent');
    const height = inputs.storeyHeight===null ? null : storeys*inputs.storeyHeight;
    if (height!==null && !Number.isFinite(height)) throw new RangeError('Invalid model height');
    const model = {boundary,buildings:[building('slab',[rectangle(0,0,inputs.siteWidth,slabDepth)],height,storeys)]};
    const plan = measurements(model).study;
    const floorArea = plan['floor-area'];
    if (!Number.isFinite(floorArea) || floorArea<=0) throw new RangeError('Invalid model floor area');
    const residentialFloorArea = inputs.residentialShare===null ? null : floorArea*inputs.residentialShare;
    const nonResidentialFloorArea = residentialFloorArea===null ? null : floorArea-residentialFloorArea;
    const populationStatus = residentialFloorArea===null ? 'missing-residential-share'
      : inputs.occupancy?.areaPerResident==null || inputs.occupancy.basis===null ? 'missing-occupancy'
      : !correctOccupancyBasis ? 'incompatible-occupancy-basis' : 'estimated';
    const populationEstimate = populationStatus==='estimated'
      ? landRatio(residentialFloorArea,inputs.occupancy.areaPerResident) : null;
    if (populationEstimate!==null && !Number.isFinite(populationEstimate)) throw new RangeError('Invalid population estimate');
    return {storeys,status:'within-site-area',requiredFootprint,model,populationStatus,results:{
      slabDepth,height,footprintArea:plan['footprint-area'],floorArea,coverage:plan['building-coverage'],
      far:plan['floor-area-ratio'],unbuiltGround:studyArea-plan['footprint-area'],
      residentialFloorArea,nonResidentialFloorArea,populationEstimate,
    }};
  });
  return {
    id:'residential-block-capacity',revision:1,status:'synthetic',inputs,boundary,studyArea,alternatives,
    formulas:capacityFormulas(),nonResidentialShare,
    comparisonStatus:inputs.storeys===null?'missing-storey-options':'evaluated',
    units:{
      siteWidth:'m',siteDepth:'m',targetFloorArea:'m2',storeys:'count',storeyHeight:'m',residentialShare:'1',nonResidentialShare:'1',
      'occupancy.areaPerResident':'m2/person',studyArea:'m2',requiredFootprint:'m2',slabDepth:'m',height:'m',
      footprintArea:'m2',floorArea:'m2',coverage:'1',far:'1',unbuiltGround:'m2',residentialFloorArea:'m2',
      nonResidentialFloorArea:'m2',populationEstimate:'person',
    },
    resultTypes:{
      studyArea:'geometry',slabDepth:'geometry',height:'modelled_geometry',footprintArea:'geometry',
      floorArea:'modelled_geometry',coverage:'geometry',far:'modelled_geometry',unbuiltGround:'geometry',
      residentialFloorArea:'scenario_allocation',nonResidentialFloorArea:'scenario_allocation',populationEstimate:'estimate',
    },
    measurementIds:['study-area','footprint-area','floor-area','building-coverage','floor-area-ratio'],
    assertionRevisionIds:['tkk-floor-area-ratio-definition/r1','far-coverage-storeys-identity/r1',
      'far-same-ratio-different-form/r1','far-massing-model-storey-height/r1'],
    assumptions:[
      'A rectangular study boundary uses local Cartesian metres. A single slab spans the site width from its southern edge.',
      'Storeys repeat the full footprint. Floor area is the modelled sum of those plates.',
      'Residential share partitions that same area basis. Occupancy must use modelled residential plate area per resident.',
      'Target area, use shares and occupancy are design inputs. The reference occupancy is an illustrative assumption.',
    ],
    limitations:[
      'Modelled plate area has no statutory kerrosala or observed floor area classification.',
      'Unbuilt ground excludes the footprint only. Its accessibility, use, vegetation and permeability remain unknown.',
      'Area fit checks the slab within the rectangle. Setbacks, access, daylight, circulation and architectural suitability need separate evaluation.',
      'Population is an estimate from the assumed area per resident. It does not calculate occupied dwellings or childcare demand.',
    ],
  };
}
