const assert=require('node:assert/strict'),path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(gl&&type.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async id=>{await page.waitForFunction(id=>document.querySelector('.scene-viewport')?.dataset.recipe===id,id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=walking-connections&keep=yes#connections');
 assert.equal(await page.locator('canvas').count(),0,'native network never creates a WebGL host');
 const facts=await page.locator('#connections .details').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 let states=0;
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const [index,panel,detail,cameras]of [[0,'crossing-refuge',null,['plan','iso']],[2,'clear-route-continuity','pinch',['plan','iso']],[2,'clear-route-continuity','height',['front','iso']]]){
   await page.locator('.panel-selector button').nth(index).click();
   if(detail)await page.locator(`[data-panel-id="${panel}"] [data-connection-choice="${detail}"]`).click();
   const id=panel+'--v0'+(detail==='height'?'-height':'');await ready(id);
   for(const camera of cameras){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(id);
    const d=await page.evaluate(async()=>{const v=document.querySelector('.scene-viewport'),s=v.querySelector('svg'),r=s.getBoundingClientRect(),data=JSON.parse(v.dataset.callouts);return{status:s.dataset.calloutStatus,items:data.items.length,issues:(await import('./callouts.js')).validateCallouts(data.items,data),w:r.width,h:r.height,texts:[...s.querySelectorAll('text')].map(n=>{const b=n.getBoundingClientRect();return{text:n.textContent,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};})};});
    assert.equal(d.status,'ok',`${width}/${id}/${camera}`);assert.equal(d.items,index===0?4:2,`${width}/${id}/${camera} anchor count`);assert.deepEqual(d.issues,[]);
    for(const t of d.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=d.w+1&&t.y+t.h<=d.h+1,'clipped '+t.text);
    for(let i=0;i<d.texts.length;i++)for(let j=0;j<i;j++){const a=d.texts[i],b=d.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${id}/${camera} overlap ${a.text}/${b.text}`);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);states++;
    if([390,1440].includes(width)&&camera===cameras[0])await page.screenshot({path:path.join(out,`connections-${panel}-${detail||'base'}-${width}.png`),fullPage:true});
   }
   await page.click('.scene-toolbar [data-reset]');assert.equal(new URL(page.url()).searchParams.get('camera'),cameras[0]);
  }
  await page.locator('.panel-selector button').nth(1).click();
  const network=page.locator('[data-panel-id="walking-connections"]');
  const geometry=await network.locator('svg').innerHTML();
  for(const emphasis of ['route','direct']){
   await network.locator(`[data-connection-choice="${emphasis}"]`).click();
   const lengths=await network.locator('svg').evaluate(s=>({route:s.querySelector('[data-geometry="walking-route-example"]').getTotalLength(),direct:s.querySelector('.datum').getTotalLength(),scale:s.querySelector('[data-geometry="walking-route-example"]').dataset.scale}));
   assert.deepEqual(lengths,{route:500,direct:300,scale:'1'});assert.ok(await network.locator('svg').evaluate(s=>{const m=s.getScreenCTM();return Math.abs(Math.hypot(m.a,m.b)-Math.hypot(m.c,m.d))<1e-7;}),'equal metric plan axes');assert.equal(await network.locator('svg').innerHTML(),geometry,'emphasis preserves all geometry and labels');assert.equal(await page.locator('.scene-host:visible').count(),0);assert.equal(await network.getAttribute('data-emphasis'),emphasis);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);states++;
  }
  if([390,1440].includes(width))await page.screenshot({path:path.join(out,`connections-network-${width}.png`),fullPage:true});
 }
 assert.equal(await page.evaluate(()=>window.__gl.size),1);assert.deepEqual(await page.locator('#connections .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),facts);
 await page.reload();assert.equal(await page.locator('.connection-network').getAttribute('data-emphasis'),'direct');
 await page.locator('.panel-selector button').nth(2).click();await ready('clear-route-continuity--v0-height');assert.equal(await page.locator('body').getAttribute('data-figure'),'clear-route-continuity--v0','detail selection does not invent a source variant');
 await page.locator('[data-connection-choice="pinch"]').click();await ready('clear-route-continuity--v0');await page.goBack();await ready('clear-route-continuity--v0-height');
 assert.equal(await page.locator('.brand small').textContent(),'Rules of thumb. Fingers crossed. · v2026-11-12');assert.ok((await page.title()).includes('Antti’s Dubious Little Planning Rulebook'));
 assert.equal(new URL(page.url()).searchParams.get('keep'),'yes');
 const evidence=await browser.newPage();await evidence.goto(base+'evidence.html');assert.equal(await evidence.title(),'Antti’s Dubious Little Planning Rulebook — evidence');await evidence.close();
 await page.click('#back-to-sheet');assert.equal(await page.locator('#connections figure:visible').count(),3);
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t.startsWith('webgl')?null:get.call(this,t,...args);};});await fallback.goto(base+'?mode=focus&panel=clear-route-continuity&detail=height#connections');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);await fallback.close();
 await page.goto('file:///home/antti/mitoitus-diorama/lab/book/index.html?mode=focus&panel=walking-connections#connections');await page.locator('[data-connection-choice="direct"]').click();assert.equal(await page.locator('.connection-network').getAttribute('data-emphasis'),'direct');assert.equal(await page.locator('.connection-network figure:visible').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(`PASS: ${states} connection states, native metric network, detail/history/figure identity, context reuse, title/version and fallbacks.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
