/** Source-only typography review: does not rebuild or edit the candidate. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),output=path.join(root,'lab/review/dimension-type');
const before=process.argv.includes('--before'),phase=before?'before':'after';
const samples=[['building-rows--v0',320,420],['tram-width--v0',320,420],['building-rows--v0',900,560]];
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:800},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  if(before)for(const file of ['lab/src/annotations.js','lab/src/book.css','lab/scripts/poster-host.html']){
   const body=execFileSync('git',['show',`${process.env.BASELINE_REF||'HEAD'}:${file}`],{cwd:root,encoding:'utf8'});
   await page.route(`**/${file}`,route=>route.fulfill({body,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html'}));
  }
  await page.goto('http://127.0.0.1:8765/lab/scripts/poster-host.html');await page.waitForFunction(()=>window.posterReady);
  const measurements=[];let states=0;
  async function inspect(){return page.evaluate(()=>{
   const v=document.querySelector('#poster-viewport'),svg=v.querySelector('svg');
   const texts=[...svg.querySelectorAll('text')].map(n=>{const b=n.getBBox(),s=getComputedStyle(n);return{text:n.textContent,x:b.x,y:b.y,w:b.width,h:b.height,dimension:n.classList.contains('dim-label'),font:parseFloat(s.fontSize),weight:s.fontWeight,stroke:s.stroke};});
   const lines=[...svg.querySelectorAll('.dimension-measure')].map(n=>({a:JSON.parse(n.dataset.a),b:JSON.parse(n.dataset.b)}));
   return {width:v.clientWidth,height:v.clientHeight,texts,lines,status:svg.dataset.calloutStatus,patches:svg.querySelectorAll('rect.label-bg').length};
  });}
  for(const [id,width,height]of samples){
   await page.evaluate(args=>window.posterRender(args),{id,width,height,category:null});
   await page.evaluate(()=>window.posterOverlay());
   measurements.push({id,...await inspect()});
   await page.locator('#poster-viewport').screenshot({path:path.join(output,`${phase}-${id}-${width}.png`)});
  }
  if(!before){
   const cases=['building-blocks--v0','building-rows--v0','building-detached--v0','walking--v0','cycling--v4','turning--v0','ramps--v0','tram-width--v0','tram-length--v0','car-turn--v0','rescue--v0','trees--v0','ground--v0','section-ratio--v0','steps--v0','crossing-refuge--v0','clear-route-continuity--v0','parking-layout--v0'];
   for(const width of [260,320,390,650,900,1200])for(const id of cases){
    const info=await page.evaluate(id=>window.posterInfo(id),id);
    for(const camera of info.allowedCameras){
     await page.evaluate(args=>window.posterRender(args),{id,width,height:width<650?420:560,category:info.categoryOptions?(info.categoryDefault??-1):null,camera});
     await page.evaluate(()=>window.posterOverlay());
     const data=await inspect(),dimensions=data.texts.filter(t=>t.dimension);
     assert.equal(data.status,'ok',`${id}/${width}/${camera}: complete callouts`);
     assert.equal(dimensions.length,data.lines.length,`${id}/${width}/${camera}: every projected dimension labelled`);
     assert.equal(data.patches,0);
     for(const text of dimensions){
      assert.equal(text.weight,'500');assert.equal(text.stroke,'none');
      if(width===320)assert.ok(text.font>=6&&text.font<=7,`320px dimension size ${text.font}`);
      if(width===900)assert.ok(text.font>=10&&text.font<=11,`900px dimension size ${text.font}`);
      assert.ok(text.font<=11&&text.font>=5.5);
     }
     for(const text of data.texts)assert.ok(text.x>=-.5&&text.y>=-.5&&text.x+text.w<=width+.5&&text.y+text.h<=data.height+.5,`${id}/${width}/${camera}: clipped ${text.text}`);
     for(let i=0;i<data.texts.length;i++)for(let j=0;j<i;j++){const a=data.texts[i],b=data.texts[j];assert.ok(!(a.x<b.x+b.w-.3&&a.x+a.w>b.x+.3&&a.y<b.y+b.h-.3&&a.y+a.h>b.y+.3),`${id}/${width}/${camera}: overlapping ${a.text}/${b.text}`);}
     states++;
    }
   }
   const baseline=path.join(output,'before.json');
   if(fs.existsSync(baseline)){
    const original=JSON.parse(fs.readFileSync(baseline));
    for(let i=0;i<measurements.length;i++){
     assert.deepEqual(measurements[i].lines,original.measurements[i].lines,'typography does not move measured endpoints');
     assert.deepEqual(measurements[i].texts.filter(t=>!t.dimension),original.measurements[i].texts.filter(t=>!t.dimension),'named callouts unchanged');
    }
   }
   console.log(`PASS: ${states} responsive dimension states, complete labels, no collisions${fs.existsSync(baseline)?' and unchanged metric endpoints/callouts':''}.`);
  }
  // Compare the published composition without modifying the shared candidate.
  if(!before){
   await page.route('**/lab/book/runtime/book.css*',route=>route.fulfill({path:path.join(root,'lab/src/book.css'),contentType:'text/css'}));
   await page.route('**/lab/book/posters/*.svg*',route=>route.fulfill({path:path.join(root,'lab/posters',path.basename(new URL(route.request().url()).pathname)),contentType:'image/svg+xml'}));
  }
  await page.setViewportSize({width:1440,height:1100});await page.goto('http://127.0.0.1:8765/lab/book/?mode=overview#built-form');
  await page.locator('img.modern-poster').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  await page.screenshot({path:path.join(output,`${phase}-overview.png`),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,`${phase}.json`),JSON.stringify({states,measurements},null,2)+'\n');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
