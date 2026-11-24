import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {fixtures} from './fixtures.mjs';
import {comparisonGroups,syntheticPackage,validatePackage} from './exchange.mjs';

const read = path => JSON.parse(readFileSync(path,'utf8'));
export const dictionary = read(new URL('../data/morphology/measurements.json',import.meta.url));
const schema = read(new URL('../data/morphology/exchange.schema.json',import.meta.url));
const schemaCheck = new Ajv2020({allErrors:true}).compile(schema);
const claims = new Set(read(new URL('../../evidence.json',import.meta.url)).claims.map(claim=>claim.id));

export const check = record => validatePackage(record,dictionary,schemaCheck,claims);
export function buildFixtures() {
  return Object.entries(fixtures).map(([id,fixture])=>{
    const model = fixture.make(fixture.parameters);
    return {id,model,parameters:fixture.parameters,
      exchange:check(syntheticPackage(id,fixture.label,model,dictionary,fixture.parameters))};
  });
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  if (process.argv[2]==='--fixtures') {
    process.stdout.write(JSON.stringify(buildFixtures()));
  } else if (['--import','--compare'].includes(process.argv[2]) && process.argv.length>3) {
    const imported = process.argv.slice(3).map(path=>check(read(path)));
    const ids = imported.map(record=>record.dataset.id+'@'+record.dataset.edition+'/'+record.studyArea.id);
    if (new Set(ids).size!==ids.length) throw new Error('Duplicate package dataset edition and study area');
    process.stdout.write(JSON.stringify(process.argv[2]==='--compare'?comparisonGroups(imported):imported,null,2)+'\n');
  } else {
    throw new Error('Usage: node lab/morphology/import.mjs --fixtures | --import <package.json> | --compare <package.json> [...]');
  }
}
