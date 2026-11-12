/** T15 deterministic default-view posters: WebGL image + vector annotations.
 * Run from repository root with the local server on 127.0.0.1:8765.
 * No service writes, source regeneration, publication or external requests.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'lab/posters');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'lab/docs/scene-inventory.json')));
const titles=JSON.parse(execFileSync('python3',['-c','import json,sys;sys.path.insert(0,sys.argv[1]);from release_editorial import TITLES;print(json.dumps(TITLES))',path.join(root,'lab/scripts')],{encoding:'utf8'}));
const excluded=new Set(['density','green-hierarchy','services','parking-norms','parking-area','walking-connections','stormwater']);
const profiles={compact:{width:320,height:420},wide:{width:900,height:560}};
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function inputs(){
 const files=['lab/assets.js','lab/scenes.js','lab/styles.js','lab/callouts.js','lab/src/book.css','lab/scripts/poster-host.html','lab/scripts/capture-posters.cjs'];
 const visit=dir=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())visit(file);else if(entry.name.endsWith('.js')&&!['book-app.js','book-3d.js','posters.js'].includes(entry.name))files.push(file);}};
 visit('lab/src');return Object.fromEntries([...new Set(files)].sort().map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:800},deviceScaleFactor:2}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
  await page.goto('http://127.0.0.1:8765/lab/scripts/poster-host.html');await page.waitForFunction(()=>window.posterReady);
  const manifest={schemaVersion:1,style:'paper',renderer:'Three.js WebGL + vector SVG annotations',profiles,titles,inputs:inputs(),posters:[],review:{textContainment:true,textOverlap:true,calloutRouting:true,externalRequests:0}};
  for(const sheet of inventory.sheets)for(const panel of sheet.panels){
   if(excluded.has(panel.id))continue;
   for(const drawing of panel.drawings){
    const info=await page.evaluate(id=>window.posterInfo(id),drawing.id);
    const categories=info.categoryOptions?[
     ...((info.categoryDefault??-1)===-1?[{value:-1,label:'All four · same scale'}]:[]),
     ...info.categoryOptions.map((label,value)=>({value,label})),
    ]:[{value:null,label:null}];
    const recipe={id:drawing.id,panelId:panel.id,camera:info.defaultCamera,description:info.description||drawing.accessibleDescription,sourceClaims:info.sourceClaims,categoryDefault:info.categoryDefault??-1,categoryPrompt:info.categoryPrompt||'Compare planting',options:[]};
    for(const category of categories){
     const option={category:category.value,label:category.label,files:{}};
     for(const [profile,size]of Object.entries(profiles)){
      const state=await page.evaluate(args=>window.posterRender(args),{id:drawing.id,category:category.value,...size});
      if(state.callouts!=='ok')throw new Error(`${drawing.id}/${category.value}/${profile}: callouts ${state.callouts}`);
      const overlay=await page.evaluate(()=>window.posterOverlay());
      for(const text of overlay.texts)if(text.x<-.5||text.y<-.5||text.x+text.width>size.width+.5||text.y+text.height>size.height+.5)throw new Error(`Clipped poster text: ${drawing.id}/${profile}: ${text.text}`);
      for(let i=0;i<overlay.texts.length;i++)for(let j=0;j<i;j++){const a=overlay.texts[i],b=overlay.texts[j];if(a.x<b.x+b.width-.3&&a.x+a.width>b.x+.3&&a.y<b.y+b.height-.3&&a.y+a.height>b.y+.3)throw new Error(`Overlapping poster text: ${drawing.id}/${profile}: ${a.text} / ${b.text}`);}
      const png=await page.locator('canvas').screenshot({type:'png',animations:'disabled'});
      const name=`${drawing.id}--${category.value===null?'default':category.value===-1?'all':'c'+category.value}--${profile}.svg`;
      const title=(titles[panel.id]||panel.title)+(category.label?' · '+category.label:'');
      const desc=recipe.description+' Source claims: '+info.sourceClaims.join(', ')+'. '+info.assumptions.join(' ');
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" role="img" aria-labelledby="title desc" data-current-poster="${xml(drawing.id)}"><title id="title">${xml(title)}</title><desc id="desc">${xml(desc)}</desc><image width="${size.width}" height="${size.height}" href="data:image/png;base64,${png.toString('base64')}"/>${overlay.markup}</svg>\n`;
      fs.writeFileSync(path.join(out,name),svg);option.files[profile]={path:'posters/'+name,sha256:hash(svg),width:size.width,height:size.height};
     }
     recipe.options.push(option);
    }
    manifest.posters.push(recipe);console.log(`Captured ${drawing.id}: ${categories.length} option(s) × 2 profiles`);
   }
  }
  if(errors.length||external.length)throw new Error(JSON.stringify({errors,external}));
  if(JSON.stringify(inputs())!==JSON.stringify(manifest.inputs))throw new Error('Source inputs changed during capture; rerun after edits settle');
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`Ready: ${manifest.posters.length} recipes, ${manifest.posters.reduce((n,p)=>n+p.options.length*2,0)} poster SVGs.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
