import {readFileSync} from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const [schemaPath] = process.argv.slice(2);
const schema = JSON.parse(readFileSync(schemaPath,'utf8'));
const value = JSON.parse(readFileSync(0,'utf8'));
const validate = new Ajv2020({allErrors:true,strict:true,strictRequired:false}).compile(schema);
if (!validate(value)) {
  console.error(JSON.stringify(validate.errors));
  process.exitCode = 1;
}
