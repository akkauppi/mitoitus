import {limits,defaultParameters,perimeterBlock,formulas} from './geometry.mjs';
import {syntheticPackage} from './exchange.mjs';
import {planMarkup,elevationMarkup,summaryMarkup} from './render.mjs';
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
form.querySelector('#save-example').addEventListener('click',()=>{
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}));
  link.href = url;
  link.download = 'dubious-synthetic-block.json';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
draw();
form.hidden = false;
