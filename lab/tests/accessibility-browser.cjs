const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
const allowed={turning:['plan','iso'],ramps:['front','iso','plan'],arrival:['plan','iso']};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(gl&&type.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async panel=>{await page.waitForFunction(panel=>document.querySelector('.scene-viewport')?.dataset.recipe===panel+'--v0',panel);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=turning&keep=yes#accessible');await ready('turning');
 const circleLabels=await page.locator('#accessible .panel').first().locator('figure svg text').allTextContents();assert.ok(circleLabels.includes('Clear space · manual'));assert.ok(circleLabels.includes('Clear space · powered'));assert.ok(!circleLabels.includes('Wheelchair'));
 const details=await page.locator('#accessible .details').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 let states=0;
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const [index,panel]of ['turning','ramps','arrival'].entries()){
   await page.locator('.panel-selector button').nth(index).click();await ready(panel);
   assert.equal(await page.locator('.scene-toolbar [data-camera]:visible').count(),allowed[panel].length);
   for(const camera of allowed[panel]){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(panel);
    const data=await page.evaluate(async()=>{
     const v=document.querySelector('.scene-viewport'),svg=v.querySelector('svg'),d=JSON.parse(v.dataset.callouts),rect=svg.getBoundingClientRect();
     const length=e=>{const a=JSON.parse(e.dataset.a),b=JSON.parse(e.dataset.b);return Math.hypot(b.x-a.x,b.y-a.y);};
     return{status:svg.dataset.calloutStatus,items:d.items.length,issues:(await import('./callouts.js')).validateCallouts(d.items,d),dimensions:[...svg.querySelectorAll('g.dimension-measure')].map(length),texts:[...svg.querySelectorAll('text')].map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent,x:r.x-rect.x,y:r.y-rect.y,w:r.width,h:r.height};}),w:rect.width,h:rect.height};
    });
    assert.equal(data.status,'ok');assert.equal(data.items,panel==='turning'?3:2,`all ${panel} callouts`);assert.deepEqual(data.issues,[]);
    for(const t of data.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=data.w+1&&t.y+t.h<=data.h+1,'text clipping '+t.text);
    for(let i=0;i<data.texts.length;i++)for(let j=0;j<i;j++){const a=data.texts[i],b=data.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${panel}/${camera} overlap ${a.text}/${b.text}`);}
    if(panel==='turning')assert.ok(Math.abs(data.dimensions[1]/data.dimensions[0]-2.5/1.5)<1e-7,'circle diameters at common scale');
    if(panel==='ramps'&&camera==='front')assert.ok(Math.abs(data.dimensions[2]/data.dimensions[0]-.3/6)<1e-6,'rise/run uses equal vertical/horizontal scale');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);states++;
   }
   await page.locator('.scene-toolbar [data-reset]').click();await ready(panel);
   assert.equal(new URL(page.url()).searchParams.get('camera'),allowed[panel][0]);
   if([390,1440].includes(width))await page.screenshot({path:path.join(out,`access-${panel}-${width}.png`),fullPage:true});
  }
 }
 assert.equal(await page.evaluate(()=>window.__gl.size),1);assert.equal(await page.locator('canvas').count(),1);
 assert.deepEqual(await page.locator('#accessible .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),details);
 await page.reload();await ready('arrival');assert.equal(await page.getAttribute('body','data-camera'),'plan');
 await page.click('#sources-toggle');assert.ok((await page.locator('.scene-provenance').textContent()).includes('depth 1.5 m'));
 await page.click('#sources-toggle');assert.equal(await page.locator('.scene-provenance:visible').count(),0);
 // Invalid Front/Section cannot advertise a false section or flatten a clear disk.
 await page.goto(base+'?mode=focus&panel=turning&camera=section#accessible');await ready('turning');assert.equal(new URL(page.url()).searchParams.get('camera'),'plan');
 await page.click('#back-to-sheet');assert.equal(await page.locator('#accessible figure:visible').count(),3);
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
 await fallback.goto(base+'?mode=focus&panel=ramps#accessible');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);await fallback.close();
 const file=await browser.newPage();await file.goto('file://'+path.resolve(__dirname,'../book/index.html')+'?mode=focus&panel=arrival#accessible');await file.waitForSelector('body[data-book-ready]');assert.equal(await file.locator('.focused-panel figure:visible').count(),1);await file.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 fs.writeFileSync(path.join(out,'accessibility-t05-results.json'),JSON.stringify({states,widths:[320,390,768,1024,1440],contexts:1,commonCircleScale:'passed',equalRampAxes:'passed',facts:'unchanged',fallbacks:'passed',errors,external},null,2));
 console.log(`PASS: ${states} accessibility camera states; common-scale circles; honest ramp slope; callouts; canonical facts; reset/state; single context and fallbacks.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
