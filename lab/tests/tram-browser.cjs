const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
const allowed={'tram-corridor':['plan','iso'],'tram-width':['front','iso','plan'],'tram-length':['iso','plan']};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(gl&&type.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async panel=>{await page.waitForFunction(panel=>document.querySelector('.scene-viewport')?.dataset.recipe===panel+'--v0',panel);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=tram-corridor&keep=yes#tram');await ready('tram-corridor');
 const details=await page.locator('#tram .details').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 let states=0;
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const [index,panel]of ['tram-corridor','tram-width','tram-length'].entries()){
   await page.locator('.panel-selector button').nth(index).click();await ready(panel);
   assert.equal(await page.locator('.scene-toolbar [data-camera]:visible').count(),allowed[panel].length);
   const explanation=await page.locator('.scene-companion').textContent();
   for(const term of panel==='tram-length'?['45 m','57 m','30 m','61 m','34 × 2.4 m']:['cut','1.0 m'])assert.ok(explanation.includes(term),'visible explanation '+term);
   for(const camera of allowed[panel]){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(panel);
    const data=await page.evaluate(async()=>{
     const v=document.querySelector('.scene-viewport'),svg=v.querySelector('svg'),d=JSON.parse(v.dataset.callouts),rect=svg.getBoundingClientRect();
     const length=e=>{const a=JSON.parse(e.dataset.a),b=JSON.parse(e.dataset.b);return Math.hypot(b.x-a.x,b.y-a.y);};
     return{status:svg.dataset.calloutStatus,items:d.items.length,issues:(await import('./callouts.js')).validateCallouts(d.items,d),dimensions:[...svg.querySelectorAll('g.dimension-measure')].map(length),texts:[...svg.querySelectorAll('text')].map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent,x:r.x-rect.x,y:r.y-rect.y,w:r.width,h:r.height};}),w:rect.width,h:rect.height};
    });
    assert.equal(data.status,'ok');assert.equal(data.items,panel==='tram-length'?4:panel==='tram-width'?3:2,`all ${panel} callouts`);assert.deepEqual(data.issues,[]);
    for(const t of data.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=data.w+1&&t.y+t.h<=data.h+1,'text clipping '+t.text);
    for(let i=0;i<data.texts.length;i++)for(let j=0;j<i;j++){const a=data.texts[i],b=data.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${panel}/${camera} overlap ${a.text}/${b.text}`);}
    if(panel==='tram-corridor')assert.ok(Math.abs(data.dimensions[1]/data.dimensions[0]-6/8)<1e-7,'independent reservations at common scale');
    if(panel==='tram-length'&&camera==='plan')assert.ok(Math.abs(data.dimensions[3]/data.dimensions[2]-61/30)<1e-7,'city-stop lengths at common scale');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);states++;
   }
   await page.locator('.scene-toolbar [data-reset]').click();await ready(panel);
   assert.equal(new URL(page.url()).searchParams.get('camera'),allowed[panel][0]);
   if([390,1440].includes(width))await page.screenshot({path:path.join(out,`tram-${panel}-${width}.png`),fullPage:true});
  }
 }
 assert.equal(await page.evaluate(()=>window.__gl.size),1);assert.equal(await page.locator('canvas').count(),1);
 assert.deepEqual(await page.locator('#tram .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),details);
 await page.reload();await ready('tram-length');
 await page.locator('.panel-selector button').first().click();await ready('tram-corridor');
 const retained=await page.locator('.scene-companion').textContent();for(const value of ['48 m','107 m','190 m','0.65'])assert.ok(retained.includes(value),'retained curve context '+value);
 await page.click('#back-to-sheet');assert.equal(await page.locator('#tram figure:visible').count(),3);
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
 await fallback.goto(base+'?mode=focus&panel=tram-length#tram');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);await fallback.close();
 const file=await browser.newPage();await file.goto('file://'+path.resolve(__dirname,'../book/index.html')+'?mode=focus&panel=tram-length#tram');await file.waitForSelector('body[data-book-ready]');assert.equal(await file.locator('.focused-panel figure:visible').count(),1);await file.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 fs.writeFileSync(path.join(out,'tram-t06-results.json'),JSON.stringify({states,widths:[320,390,768,1024,1440],contexts:1,commonReservationScale:'passed',commonCityLengths:'passed',curveContext:'retained',facts:'unchanged',fallbacks:'passed',errors,external},null,2));
 console.log(`PASS: ${states} tram camera states; common-scale reservations and city lengths; callouts; canonical facts; reset/state; single context and fallbacks.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
