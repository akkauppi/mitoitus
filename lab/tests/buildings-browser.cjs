const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){const gl=get.call(this,t,...args);if(gl&&t.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async id=>{await page.waitForFunction(id=>document.querySelector('.scene-viewport')?.dataset.recipe===id,id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=building-blocks&keep=yes#built-form');await ready('building-blocks--v0');
 const facts=await page.locator('#built-form .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),drawings=await page.locator('#built-form figure').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 let states=0;const scales=[];
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const camera of ['plan','iso']){
   let ppm,frame;
   for(const [index,panel,dimension,anchors]of [[0,'building-blocks',26,3],[1,'building-rows',9,3],[2,'building-detached',15,2]]){
    await page.locator('.panel-selector button').nth(index).click();const id=panel+'--v0';await ready(id);await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(id);
    const d=await page.evaluate(async()=>{const v=document.querySelector('.scene-viewport'),s=v.querySelector('svg'),r=s.getBoundingClientRect(),data=JSON.parse(v.dataset.callouts);return{status:s.dataset.calloutStatus,items:data.items.length,issues:(await import('./callouts.js')).validateCallouts(data.items,data),projected:Number(v.dataset.projectedWidth),frame:JSON.parse(v.dataset.comparisonFrame),w:r.width,h:r.height,texts:[...s.querySelectorAll('text')].map(n=>{const b=n.getBoundingClientRect();return{dimension:n.classList.contains('dim-label'),text:n.textContent,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};})};});
    assert.equal(d.status,'ok',`${width}/${id}/${camera}`);assert.equal(d.items,anchors,`${width}/${id}/${camera} complete labels`);assert.deepEqual(d.issues,[]);
    for(const t of d.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=d.w+1&&t.y+t.h<=d.h+1,'clipped '+t.text);
    for(let i=0;i<d.texts.length;i++)for(let j=0;j<i;j++){const a=d.texts[i],b=d.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${id}/${camera} overlap ${a.text}/${b.text}`);}
    assert.equal(d.texts.filter(t=>t.dimension).length,4,'all measured dimensions retained');
    const scale=d.projected/dimension;if(ppm!==undefined){assert.ok(Math.abs(scale-ppm)<1e-7,'common pixels per metre');assert.deepEqual(d.frame,frame);}else{ppm=scale;frame=d.frame;}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('.scene-toolbar [data-camera]:visible').count(),2);assert.equal(new URL(page.url()).searchParams.get('keep'),'yes');states++;
    if([390,1440].includes(width)&&camera==='plan')await page.screenshot({path:path.join(out,`buildings-${panel}-${width}.png`),fullPage:true});
   }
   scales.push({viewport:width,camera,pixelsPerMetre:ppm});
  }
 }
 // Preserve an adjusted camera and zoom across building panels, not just presets.
 await page.locator('.scene-viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');await ready('building-detached--v0');
 const position=await page.locator('.scene-viewport').getAttribute('data-camera-position'),frame=await page.locator('.scene-viewport').getAttribute('data-comparison-frame');
 await page.locator('.panel-selector button').first().click();await ready('building-blocks--v0');assert.equal(await page.locator('.scene-viewport').getAttribute('data-camera-position'),position);assert.equal(await page.locator('.scene-viewport').getAttribute('data-comparison-frame'),frame);
 await page.click('.scene-toolbar [data-reset]');assert.equal(new URL(page.url()).searchParams.get('camera'),'plan');await page.reload();await ready('building-blocks--v0');
 assert.deepEqual(await page.locator('#built-form .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),facts);assert.deepEqual(await page.locator('#built-form figure').evaluateAll(ns=>ns.map(n=>n.innerHTML)),drawings);
 assert.equal(await page.evaluate(()=>window.__gl.size),1);assert.equal(await page.locator('canvas').count(),1);
 await page.click('#back-to-sheet');assert.equal(await page.locator('#built-form figure:visible').count(),3);
 const overview=await page.locator('#built-form svg [data-geometry]').evaluateAll(ns=>ns.map(n=>n.dataset.scale));assert.ok(overview.every(s=>s==='6'),'all retained overview drawings share source scale');
 await page.setViewportSize({width:1440,height:1100});
 const overviewScales=await page.locator('#built-form figure svg').evaluateAll(ns=>ns.map(s=>{const m=s.getScreenCTM();return Math.hypot(m.a,m.b)*6;}));assert.ok(overviewScales.every(scale=>Math.abs(scale-overviewScales[0])<.001),'overview pixels/metre agree within subpixel layout rounding');
 await page.screenshot({path:path.join(out,'buildings-overview-1440.png'),fullPage:true});
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t.startsWith('webgl')?null:get.call(this,t,...args);};});await fallback.goto(base+'?mode=focus&panel=building-detached#built-form');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);assert.ok((await fallback.locator('.focused-panel .details').textContent()).includes('one storey'));await fallback.close();
 await page.goto('file:///home/antti/mitoitus-diorama/lab/book/index.html?mode=focus&panel=building-rows#built-form');assert.equal(await page.locator('.focused-panel figure:visible').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);fs.writeFileSync(path.join(out,'buildings-t09-results.json'),JSON.stringify({states,scales,checks:['all five typologies','common plan/iso scale','complete callouts and dimensions','no text overlap or clipping','canonical details/drawings','adjusted camera continuity','reset and reload','one context','native overview common scale','WebGL/file fallback']},null,2));console.log(`PASS: ${states} building states, shared metric framing, all forms/annotations, preserved content and fallback.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
