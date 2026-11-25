import {limits,defaultParameters,perimeterBlock,formulas} from './geometry.mjs';
import {syntheticPackage} from './exchange.mjs';
import {planMarkup,elevationMarkup,summaryMarkup,capacityDrawing,capacitySummary,capacityTable} from './render.mjs';
import {MODELLED_PLATES,MODELLED_RESIDENTIAL,referenceCapacityInputs} from './capacity.mjs';
import {calculateCapacityConfiguration,capacityConfiguration,loadCapacityConfiguration} from './capacity-configuration.mjs';
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
const capacitySave = document.querySelector('#capacity-save');
const showInputJSON = document.querySelector('#capacity-show-inputs');
const pasteJSON = capacityInput('paste-json');
const fileInput = capacityInput('configuration-file');
const selector = capacityInput('draw-storeys');
const calculationStatus = document.querySelector('#capacity-status');
const importStatus = document.querySelector('#capacity-import-status');
const edition = capacityForm.dataset.edition;
let baseInputs = referenceCapacityInputs;
const editedFields = new Set();
let capacityRecord;

function readNumber(input) {
  if (input.validity.badInput) throw new RangeError('Enter a number or leave the field blank.');
  return input.value==='' ? null : input.valueAsNumber;
}

function readStoreys(input) {
  if (!input.value.trim()) return null;
  const counts = input.value.split(',').map(part=>part.trim());
  if (!counts.every(count=>/^\d+$/.test(count))) throw new RangeError('Enter storey counts separated by commas.');
  return counts.map(Number);
}

const editors = {
  siteWidth:readNumber,siteDepth:readNumber,targetFloorArea:readNumber,storeyHeight:readNumber,storeys:readStoreys,
  residentialShare:input=>{
    const percent = readNumber(input);
    return percent===null ? null : percent/100;
  },
  occupancy:input=>({areaPerResident:readNumber(input),basis:MODELLED_RESIDENTIAL}),
};

function selectedStoreys() {
  return Number(selector.value)||null;
}

function showCapacityRecord(record, storeys) {
  const selected = record.alternatives.find(item=>item.storeys===storeys);
  const counts = record.inputs.storeys?.join(',')??'';
  if (selector.dataset.counts!==counts) {
    selector.replaceChildren(new Option('Choose alternative',''),...record.alternatives.map(item=>
      new Option(item.storeys+' storeys',item.storeys)));
    selector.dataset.counts = counts;
  }
  selector.value = selected?.storeys??'';
  selector.disabled = !record.alternatives.length;
  calculationStatus.textContent = ({
    'missing-geometry-input':'Enter both site dimensions and a target floor area to draw the alternatives.',
    'exceeds-site-area':'The selected slab exceeds the study area.',
  })[selected?.status]??(selected?.populationStatus?.startsWith('missing')?'Population estimate needs an occupancy assumption and residential share.':'');
  document.querySelector('#capacity-drawing').innerHTML = capacityDrawing(record,selected?.storeys??null);
  document.querySelector('#capacity-summary').textContent = capacitySummary(record);
  document.querySelector('#capacity-comparison').innerHTML = capacityTable(record);
  capacityRecord = record;
  capacitySave.disabled = showInputJSON.disabled = false;
}

function drawCapacity(event) {
  if (event) {
    const name = event.target.name;
    if (Object.hasOwn(editors,name)) editedFields.add(name);
    else if (name!=='draw-storeys') return;
  }
  try {
    const inputs = {...baseInputs};
    for (const name of editedFields) inputs[name] = editors[name](capacityInput(name));
    if (editedFields.has('targetFloorArea')) inputs.targetFloorAreaBasis = MODELLED_PLATES;
    showCapacityRecord(calculateCapacityConfiguration(inputs),selectedStoreys());
  } catch (error) {
    capacityRecord = null;
    calculationStatus.textContent = error.message;
    document.querySelector('#capacity-summary').textContent = '';
    document.querySelector('#capacity-drawing').replaceChildren();
    document.querySelector('#capacity-comparison').replaceChildren();
    capacitySave.disabled = showInputJSON.disabled = true;
  }
}

function applyCapacityJSON(text) {
  try {
    const {record,selectedStoreys,stale} = loadCapacityConfiguration(text);
    baseInputs = record.inputs;
    editedFields.clear();
    const displayed = {...baseInputs,storeys:baseInputs.storeys?.join(', '),
      residentialShare:baseInputs.residentialShare===null ? null : baseInputs.residentialShare*100,
      occupancy:baseInputs.occupancy?.areaPerResident};
    for (const name of Object.keys(editors)) capacityInput(name).value = displayed[name]??'';
    showCapacityRecord(record,selectedStoreys);
    importStatus.textContent = stale ? 'Loaded inputs. Saved results differed and were recalculated.' : 'Configuration loaded.';
  } catch (error) {
    importStatus.textContent = error.message;
  }
}

capacityForm.addEventListener('input',drawCapacity);
capacityForm.addEventListener('submit',event=>event.preventDefault());
capacitySave.addEventListener('click',()=>{
  if (capacityRecord) downloadJSON(capacityConfiguration(capacityRecord,selectedStoreys(),edition),'dubious-residential-block-capacity.json');
});
fileInput.addEventListener('change',async()=>{
  const [file] = fileInput.files;
  if (!file) return;
  try {
    const text = await file.text();
    if (fileInput.files[0]===file) applyCapacityJSON(text);
  } catch {
    if (fileInput.files[0]===file) importStatus.textContent = 'Could not read the configuration file.';
  } finally {
    if (fileInput.files[0]===file) fileInput.value = '';
  }
});
document.querySelector('#capacity-paste').addEventListener('click',()=>{
  fileInput.value = '';
  applyCapacityJSON(pasteJSON.value);
});
showInputJSON.addEventListener('click',()=>{
  if (!capacityRecord) return;
  pasteJSON.value = JSON.stringify(capacityConfiguration(capacityRecord,selectedStoreys(),edition,true),null,2);
  pasteJSON.select();
});
drawCapacity();
capacityForm.hidden = false;
