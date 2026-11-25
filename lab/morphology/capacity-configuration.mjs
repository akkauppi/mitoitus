import {CAPACITY_REVISION,MODELLED_PLATES,MODELLED_RESIDENTIAL,referenceCapacityInputs,residentialCapacity} from './capacity.mjs';

const formatVersion = '1.0.0';
const inputFields = Object.keys(referenceCapacityInputs);
const inputUnits = ['siteWidth','siteDepth','targetFloorArea','storeys','storeyHeight','residentialShare','occupancy.areaPerResident'];
const derivedFields = ['boundary','studyArea','alternatives','nonResidentialShare','comparisonStatus'];

function object(value, label) {
  if (!value || typeof value!=='object' || Array.isArray(value))
    throw new TypeError(label+' must be a JSON object.');
}

export function calculateCapacityConfiguration(inputs) {
  if (inputs.storeys!=null && (!Array.isArray(inputs.storeys) || inputs.storeys.length<1 || inputs.storeys.length>3 ||
      inputs.storeys.some(n=>!Number.isInteger(n) || n<1 || n>100))) {
    throw new RangeError('Enter one to three storey counts from 1 to 100.');
  }
  return residentialCapacity(inputs);
}

export function capacityConfiguration(record, selectedStoreys, edition, inputsOnly=false) {
  const {id,revision,...configuration} = record;
  return {
    schemaVersion:formatVersion,referenceRevision:CAPACITY_REVISION,edition,selectedStoreys,
    configuration:inputsOnly ? {inputs:configuration.inputs} : configuration,
  };
}

function sameJSON(first, second) {
  if (first===second) return true;
  if (!first || !second || typeof first!=='object' || typeof second!=='object' ||
      Array.isArray(first)!==Array.isArray(second)) return false;
  const keys = Object.keys(first);
  return keys.length===Object.keys(second).length &&
    keys.every(key=>Object.hasOwn(second,key) && sameJSON(first[key],second[key]));
}

export function loadCapacityConfiguration(text) {
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    throw new SyntaxError('Invalid JSON. Check the file or pasted text.');
  }
  object(file,'Capacity configuration');
  if (file.schemaVersion!==formatVersion) throw new RangeError('Unsupported capacity format. Use schemaVersion '+formatVersion+'.');
  if (file.referenceRevision!==CAPACITY_REVISION) throw new RangeError('Use referenceRevision '+CAPACITY_REVISION+'.');
  object(file.configuration,'configuration');
  const {inputs,units} = file.configuration;
  object(inputs,'configuration.inputs');
  for (const key of Object.keys(inputs)) {
    if (!inputFields.includes(key)) throw new RangeError('Unknown capacity input: '+key);
  }
  if (inputs.occupancy!=null) {
    object(inputs.occupancy,'occupancy');
    if (Object.keys(inputs.occupancy).some(key=>!['areaPerResident','basis'].includes(key)))
      throw new RangeError('Occupancy supports areaPerResident and basis.');
  }
  if ((inputs.targetFloorArea!=null || inputs.targetFloorAreaBasis!=null) && inputs.targetFloorAreaBasis!==MODELLED_PLATES)
    throw new RangeError('Use the '+MODELLED_PLATES+' target floor-area basis.');
  if ((inputs.occupancy?.areaPerResident!=null || inputs.occupancy?.basis!=null) && inputs.occupancy.basis!==MODELLED_RESIDENTIAL)
    throw new RangeError('Use the '+MODELLED_RESIDENTIAL+' occupancy basis.');
  const record = calculateCapacityConfiguration(inputs);
  if (units!==undefined) {
    object(units,'configuration.units');
    for (const key of inputUnits) {
      if (Object.hasOwn(units,key) && units[key]!==record.units[key])
        throw new RangeError('Use '+record.units[key]+' for '+key+'.');
    }
  }
  const selectedStoreys = file.selectedStoreys??null;
  if (selectedStoreys!==null && !record.alternatives.some(item=>item.storeys===selectedStoreys))
    throw new RangeError('Selected storeys must match an alternative or be null.');
  const stale = derivedFields.some(key=>Object.hasOwn(file.configuration,key) && !sameJSON(file.configuration[key],record[key]));
  return {record,selectedStoreys,stale};
}
