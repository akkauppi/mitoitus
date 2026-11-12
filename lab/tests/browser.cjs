// Run against the local preview; this never opens the live site.
const assert=require('node:assert/strict');
const {mkdirSync,writeFileSync,readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=resolve(__dirname,'../review');mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1050}}), errors=[], external=[],states=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('blob:'))external.push(r.url());});
 await page.goto('http://127.0.0.1:8765/lab/');await page.waitForSelector('body[data-ready="true"]');
 const settled=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 for(const size of [{width:1440,height:1050},{width:390,height:844},{width:320,height:740}]){
  await page.setViewportSize(size);
  for(const scene of ['street','tram','roots'])for(const style of ['paper','ink','soft'])for(const view of ['iso','plan','section']){
   await page.click(`[data-scene="${scene}"]`);await page.click(`[data-style="${style}"]`);await page.click(`[data-view="${view}"]`);await settled();
   const state=await page.evaluate(()=>{
    const r=document.querySelector('#overlay').getBoundingClientRect();const labels=[...document.querySelectorAll('#overlay text')].map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};});
    return {callouts:JSON.parse(document.querySelector('#viewport').dataset.callouts||'null'),calloutStatus:document.querySelector('#overlay').dataset.calloutStatus,overflow:document.documentElement.scrollWidth>innerWidth,labels,width:r.width,height:r.height,calls:Number(document.body.dataset.drawCalls),fallback:!document.querySelector('#fallback').hidden};
   });
   assert.equal(state.overflow,false,`${size.width} ${scene} overflow`);assert.equal(state.fallback,false);assert.ok(state.calls>0);assert.equal(state.calloutStatus,'ok',`${size.width}/${scene}/${style}/${view}: callouts unavailable`);
   const issues=await page.evaluate(async data=>(await import('./callouts.js')).validateCallouts(data.items,data),state.callouts);assert.deepEqual(issues,[]);
   for(let i=0;i<state.labels.length;i++)for(let j=0;j<i;j++){const a=state.labels[i],b=state.labels[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${size.width}/${scene}/${view}: text overlap ${a.text}/${b.text}`);}
   for(const l of state.labels)assert.ok(l.x>=-1&&l.y>=-1&&l.x+l.w<=state.width+1&&l.y+l.h<=state.height+1,`Clipped ${scene}/${style}/${view} ${l.text}`);
   states.push({viewport:size.width,scene,style,view,drawCalls:state.calls,labels:state.labels.length,callouts:state.callouts.items.length});
   if(view==='iso'&&(size.width===1440||(size.width===390&&style==='paper')))await page.screenshot({path:`${output}/${scene}-${style}-${size.width}.png`,fullPage:true});
  }
 }
 // Orbit and zoom also recalculate routes, including anchors sharing projected heights.
 for(const scene of ['street','tram','roots']){await page.click(`[data-scene="${scene}"]`);await page.click('[data-view="iso"]');await page.locator('#viewport').focus();for(let i=0;i<16;i++){await page.keyboard.press('ArrowRight');await settled();const state=await page.evaluate(async()=>{const data=JSON.parse(document.querySelector('#viewport').dataset.callouts);return{status:document.querySelector('#overlay').dataset.calloutStatus,issues:(await import('./callouts.js')).validateCallouts(data.items,data)};});assert.equal(state.status,'ok',`orbit ${scene}/${i}`);assert.deepEqual(state.issues,[]);}}
 await page.setViewportSize({width:320,height:740});await settled();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.click('[data-view="iso"]');await page.click('[data-style="ink"]');await page.click('[data-scene="street"]');await settled();
 await page.locator('#viewport').focus();for(let i=0;i<15;i++){await page.keyboard.press('+');await settled();assert.equal(await page.locator('#overlay').getAttribute('data-callout-status'),'ok','zoom callouts');}await page.keyboard.press('Home');await settled();
 await page.uncheck('#dimensions');await settled();assert.equal(await page.locator('.dim-label').count(),0);await page.check('#dimensions');await settled();assert.equal(await page.locator('.dim-label').count(),4);
 await page.uncheck('#labels');await settled();assert.equal(await page.locator('.scene-label').count(),0);await page.check('#labels');
 await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');await page.keyboard.press('Home');await settled();
 const download=page.waitForEvent('download');await page.click('#export');const file=await download;await file.saveAs(`${output}/street-ink.svg`);
 const xml=readFileSync(`${output}/street-ink.svg`,'utf8');assert.ok(xml.includes('<path'));assert.ok(xml.includes('2.5 m'));assert.ok(!xml.includes('<image'));
 const svgError=await page.evaluate(xml=>new DOMParser().parseFromString(xml,'image/svg+xml').querySelector('parsererror')?.textContent,xml);assert.equal(svgError,undefined);
 await page.reload();await page.waitForSelector('body[data-ready="true"]');assert.equal(await page.locator('[data-style="ink"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-scene="street"]').getAttribute('aria-pressed'),'true');
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return original.call(this,type,...args);};});await fallback.goto('http://127.0.0.1:8765/lab/');await fallback.waitForSelector('#fallback:not([hidden])');assert.equal(await fallback.locator('#measurements dd').count(),4);await fallback.click('[data-scene="tram"]');assert.ok((await fallback.locator('#measurements').textContent()).includes('45 m'));
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 writeFileSync(`${output}/browser-results.json`,JSON.stringify({date:'2026-11-12',browser:await browser.version(),states,errors,external,svg:'valid XML; paths and labels; no raster images',fallback:'verified',limits:'Headless Chromium/software WebGL; no physical-device touch or GPU performance assessment'},null,2));
 console.log(`PASS: ${states.length} scene/style/view/viewport states; 320px overflow; toggles; keyboard; bookmark; vector export; no-WebGL fallback; zero runtime external requests.`);await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
