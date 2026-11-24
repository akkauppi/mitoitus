import {pathToFileURL} from 'node:url';
import {equalDensityCases, equalDensityPlotSide, equalDensityStoreyHeight, floorFormulas, landRatio} from '../src/metrics.js';
import {axisMeasurements, depthAtEasting, polygonArea, rectangle} from './geometry.mjs';
import {fixtures} from './fixtures.mjs';

export function examples() {
  const floorArea = equalDensityCases[0].floorArea;
  const boundaryCases = [['plot',equalDensityPlotSide],['block',64],['district',128]].map(([scope,side])=>{
    const ring = rectangle(0,0,side,side);
    const landArea = polygonArea([ring]);
    return {scope,boundary:{type:'Polygon',coordinates:[ring]},landArea,floorArea,far:landRatio(floorArea,landArea)};
  });
  const depthCases = [['l-shaped-building',20],['irregular-footprint',12]].map(([id,easting])=>{
    const fixture = fixtures[id];
    const footprint = fixture.make(fixture.parameters).buildings[0].geometry;
    const [ring] = footprint.coordinates;
    return {fixture:id, label:fixture.label, unit:'m',axis:[1,0],easting,
      envelopeDepth:axisMeasurements(ring,[1,0]).depth, transectDepth:depthAtEasting(ring,easting)};
  });
  return {
    'equal-far':{status:'synthetic',measurementIds:['building-coverage','floor-area','floor-area-ratio'],
      referencePanel:'equal-density',formula:floorFormulas['equal-floor-plates'],plotSide:equalDensityPlotSide,
      storeyHeight:equalDensityStoreyHeight,
      units:{plotSide:'m',storeyHeight:'m',depth:'m',floors:'count',plotArea:'m2',footprintArea:'m2',floorArea:'m2',coverage:'1',far:'1'},
      cases:equalDensityCases},
    'nested-denominators':{status:'synthetic',measurementIds:['study-area','floor-area-ratio'],
      formula:floorFormulas['floor-area-ratio'],floorAreaBasis:'Identical full modelled floor plates in one building',
      boundaryBasis:'Nested synthetic squares include the same building and no additional floor area',
      units:{boundary:'m',landArea:'m2',floorArea:'m2',far:'1'},cases:boundaryCases},
    'depth-methods':{status:'synthetic',measurementIds:['building-depth'],
      methods:{
        envelopeDepth:{method:'short-side-of-named-axis-envelope',basis:'Full north–south span at the declared east–west building axis'},
        transectDepth:{basis:'Single contiguous façade-to-façade intersection at the stated easting'},
      },cases:depthCases},
  };
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)
  process.stdout.write(JSON.stringify(examples()));
