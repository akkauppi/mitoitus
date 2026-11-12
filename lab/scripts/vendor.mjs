import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root = new URL('../', import.meta.url);
const files = ['build/three.module.js', 'build/three.core.js', 'examples/jsm/controls/OrbitControls.js', 'examples/jsm/renderers/SVGRenderer.js', 'examples/jsm/renderers/Projector.js', 'LICENSE'];
const hashes = {};
for (const file of files) {
  const target = new URL('vendor/'+file, root);
  await mkdir(new URL('.', target), {recursive:true});
  await copyFile(new URL('node_modules/three/'+file,root), target);
  hashes[file] = createHash('sha256').update(await readFile(target)).digest('hex');
}
await writeFile(new URL('vendor/manifest.json',root), JSON.stringify({package:'three',version:'0.187.0',license:'MIT',source:'https://www.npmjs.com/package/three/v/0.187.0',sha256:hashes},null,2)+'\n');
