import {limits,defaultParameters,perimeterBlock,formulas} from './geometry.mjs';
import {syntheticPackage} from './exchange.mjs';
import {planMarkup,elevationMarkup,summaryMarkup,capacityDrawing,capacitySummary,capacityTable} from './render.mjs';
import {CAPACITY_REVISION,referenceCapacityInputs,residentialCapacity} from './capacity.mjs';
import dictionary from '../data/morphology/measurements.json';

const form = document.querySelector('#parameters');
const names = {width:'Block width',length:'Block length',depth:'Building depth',height:'Building height',storeys:'Storeys'};
for (const [key,[min,max]] of Object.entries(limits)) {
  const label = document.createElement('label');
  const unit = key==='storeys' ? '' : ' (m)';
  label.innerHTML = `<span>${names[key]}${unit} <output for="${key}">${defaultParameters[key]}</output></span>
  <input type="range" id="${key}" name="${key}" min="${min}" max="${max}" value="${defaultParameters[key]}">`;
  form.querySelector('#sliders').append(label);
}
let current;
function draw() {
  const parameters = Object.fromEntries(Object.keys(limits).map(key=>[key,form.elements.namedItem(key).valueAsNumber]));
  const open = form.elements.namedItem('form').value==='open';
  const model = perimeterBlock(parameters,open);
  const label = open ? 'Open perimeter block' : 'Closed perimeter block';
  const exchange = syntheticPackage(open?'open-perimeter':'closed-perimeter',label,model,dictionary,parameters);
  for (const [key,value] of Object.entries(parameters)) form.querySelector('output[for="'+key+'"]').value=value;
  document.querySelector('#plan').innerHTML = planMarkup(model);
  document.querySelector('#elevation').innerHTML = elevationMarkup(model);
  document.querySelector('#results').innerHTML = summaryMarkup(exchange.observations,dictionary);
  current = {parameters,form:open?'open':'closed',formulas,model,exchange};
}
form.addEventListener('input',draw);
form.addEventListener('reset',event=>{
  event.preventDefault();
  form.elements.namedItem('form').value = 'closed';
  for (const [key,value] of Object.entries(defaultParameters)) form.elements.namedItem(key).value=value;
  draw();
});
function downloadJSON(record,name) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'}));
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
form.querySelector('#save-example').addEventListener('click',()=>downloadJSON(current,'dubious-synthetic-block.json'));
draw();
form.hidden = false;

const capacityForm = document.querySelector('#capacity-parameters');
const capacityInput = name => capacityForm.elements.namedItem(name);
const capacityNumber = name => capacityInput(name).value==='' ? null : capacityInput(name).valueAsNumber;
const capacitySave = document.querySelector('#capacity-save');
let capacityRecord;

function drawCapacity() {
  const residential = capacityNumber('residential');
  const storeys = Number(capacityInput('draw-storeys').value);
  const status = document.querySelector('#capacity-status');
  try {
    capacityRecord = residentialCapacity({
      ...referenceCapacityInputs,
      targetFloorArea:capacityNumber('target'),
      residentialShare:residential===null ? null : residential/100,
      occupancy:{...referenceCapacityInputs.occupancy,areaPerResident:capacityNumber('occupancy')},
    });
    const selected = capacityRecord.alternatives.find(item=>item.storeys===storeys);
    status.textContent = ({
      'missing-geometry-input':'Enter a target floor area to draw the alternatives.',
      'exceeds-site-area':'The selected slab exceeds the study area.',
    })[selected.status]??(selected.populationStatus?.startsWith('missing')?'Population estimate needs an occupancy assumption and residential share.':'');
    document.querySelector('#capacity-drawing').innerHTML = capacityDrawing(capacityRecord,storeys);
    document.querySelector('#capacity-summary').textContent = capacitySummary(capacityRecord);
    document.querySelector('#capacity-comparison').innerHTML = capacityTable(capacityRecord);
    capacitySave.disabled = false;
  } catch (error) {
    capacityRecord = null;
    status.textContent = error.message;
    document.querySelector('#capacity-summary').textContent = '';
    document.querySelector('#capacity-drawing').replaceChildren();
    document.querySelector('#capacity-comparison').replaceChildren();
    capacitySave.disabled = true;
  }
}

capacityForm.addEventListener('input',drawCapacity);
capacityForm.addEventListener('submit',event=>event.preventDefault());
capacitySave.addEventListener('click',()=>{
  if (!capacityRecord) return;
  const {id,revision,...configuration} = capacityRecord;
  downloadJSON({schemaVersion:'1.0.0',referenceRevision:CAPACITY_REVISION,
    selectedStoreys:Number(capacityInput('draw-storeys').value),configuration},'dubious-residential-block-capacity.json');
});
drawCapacity();
capacityForm.hidden = false;
