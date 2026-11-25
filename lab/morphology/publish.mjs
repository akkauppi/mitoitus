import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {buildFixtures,dictionary} from './import.mjs';
import {formulas} from './geometry.mjs';
import {planMarkup,elevationMarkup,summaryMarkup,format,capacityDrawing,capacitySummary,capacityTable} from './render.mjs';
import {CAPACITY_REVISION,referenceCapacityInputs,residentialCapacity} from './capacity.mjs';

const fixtures = buildFixtures();
const main = fixtures[0];
const capacity = residentialCapacity(referenceCapacityInputs);
const selectedStoreys = capacity.inputs.storeys[1];
const scenarios = {
  'unknown-target':{targetFloorArea:null},
  'unknown-occupancy':{occupancy:null},
  'unknown-share':{residentialShare:null},
  'incompatible-occupancy-basis':{occupancy:{areaPerResident:40,basis:'net-dwelling-area'}},
  'incompatible-target-basis':{targetFloorAreaBasis:'statutory-kerrosala'},
  'exceeds-site-area':{targetFloorArea:2304},
};
capacity.scenarios = Object.fromEntries(Object.entries(scenarios).map(([id,overrides])=>{
  const checked = residentialCapacity({...referenceCapacityInputs,...overrides});
  return [id,{overrides,alternatives:checked.alternatives.map(({model,...alternative})=>alternative)}];
}));
const records = fixtures.map(({id,exchange,model})=>{
  const rows=exchange.observations.map(o=>
    `<tr><th scope="row">${dictionary.measurements[o.measurement].terms.en}</th><td>${o.subject}</td><td>${format(o.value,o.unit)}</td></tr>`).join('');
  return `<details id="${id}"><summary>${exchange.studyArea.label}</summary>
  <div class="grid"><figure>${planMarkup(model)}${model.street?elevationMarkup(model):''}</figure><div><table><thead><tr><th scope="col">Measurement</th><th scope="col">Subject</th><th scope="col">Value</th></tr></thead><tbody>${rows}</tbody></table></div></div></details>`;
}).join('');
const bundle = await build({absWorkingDir:fileURLToPath(new URL('../../',import.meta.url)),entryPoints:['lab/morphology/ui.mjs'],bundle:true,format:'iife',write:false,
  minifyWhitespace:false,legalComments:'none',charset:'utf8'});
process.stdout.write(JSON.stringify({
  fixtures,formulas,records,workedExamples:{[CAPACITY_REVISION]:capacity},capacityView:{
    table:capacityTable(capacity),summary:capacitySummary(capacity),drawing:capacityDrawing(capacity,selectedStoreys),selectedStoreys,
  },
  plan:planMarkup(main.model),elevation:elevationMarkup(main.model),
  summary:summaryMarkup(main.exchange.observations,dictionary),
  script:bundle.outputFiles[0].text,
}));
