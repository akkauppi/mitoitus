const assert=require('node:assert/strict'),path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(gl&&type.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async id=>{await page.waitForFunction(id=>document.querySelector('.scene-viewport')?.dataset.recipe===id,id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=walking-connections&keep=yes#connections');
 assert.equal(await page.locator('canvas').count(),0,'static teaching diagram needs no WebGL');let states=0;
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const [index,panel,cameras]of [[0,'crossing-refuge',['plan','iso']],[2,'clear-route-continuity',['iso','plan','front']]]){
   await page.locator('.panel-selector button').nth(index).click();const id=panel+'--v0';await ready(id);
   assert.equal(await page.locator('.connection-controls:visible').count(),0);
   for(const camera of cameras){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(id);
    const d=await page.evaluate(async()=>{const v=document.querySelector('.scene-viewport'),s=v.querySelector('svg'),r=s.getBoundingClientRect(),data=JSON.parse(v.dataset.callouts);return{status:s.dataset.calloutStatus,items:data.items.length,issues:(await import('./callouts.js')).validateCallouts(data.items,data),w:r.width,h:r.height,texts:[...s.querySelectorAll('text')].map(n=>{const b=n.getBoundingClientRect();return{text:n.textContent,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};})};});
    assert.equal(d.status,'ok',`${width}/${id}/${camera}`);assert.equal(d.items,4,`${width}/${id}/${camera} anchors`);assert.deepEqual(d.issues,[]);
    for(const t of d.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=d.w+1&&t.y+t.h<=d.h+1,'clipped '+t.text);
    for(let i=0;i<d.texts.length;i++)for(let j=0;j<i;j++){const a=d.texts[i],b=d.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${id}/${camera} overlap ${a.text}/${b.text}`);}
    if(index===2)for(const term of camera==='plan'?['≥1.5 m clear','≥1.8 m passing']:camera==='front'?['≥2.2 m clear','≥3 m recommended']:['≥1.5 m clear','≥1.8 m passing','≥2.2 m clear','≥3 m recommended'])assert.ok(d.texts.some(t=>t.text===term),'unified annotation '+term);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);states++;
    if([390,1440].includes(width)&&camera===cameras[0])await page.screenshot({path:path.join(out,`connections-${panel}-unified-${width}.png`),fullPage:true});
   }
   await page.click('.scene-toolbar [data-reset]');assert.equal(new URL(page.url()).searchParams.get('camera'),cameras[0]);
  }
  await page.locator('.panel-selector button').nth(1).click();const network=page.locator('[data-panel-id="walking-connections"]');
  assert.equal(await network.locator('button').count(),1,'only Explore remains; no diagram interaction');assert.equal(await page.locator('.scene-host:visible').count(),0);assert.equal(await network.locator('svg[data-network="continuity"]').count(),1);
  for(const term of ['Access gate','Crossing','Actual entrance','One unavailable link'])assert.ok((await network.locator('.details').textContent()).includes(term));
  assert.equal(await network.locator('.connection-history').isVisible(),false);assert.ok((await network.locator('.retained-reference').textContent()).includes('500 m'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);states++;
  if([390,1440].includes(width))await page.screenshot({path:path.join(out,`connections-network-redesign-${width}.png`),fullPage:true});
 }
 assert.equal(await page.evaluate(()=>window.__gl.size),1);await page.locator('.panel-selector button').nth(2).click();await ready('clear-route-continuity--v0');await page.reload();await ready('clear-route-continuity--v0');
 assert.ok(!(await page.locator('.scene-case').textContent()).includes('PINCH'));assert.equal(await page.locator('.brand small').textContent(),'Rules of thumb. Fingers crossed. · v2026-11-12');assert.equal(new URL(page.url()).searchParams.get('keep'),'yes');
 await page.click('#back-to-sheet');assert.equal(await page.locator('#connections figure:visible').count(),3);assert.ok(!(await page.locator('#connections .panel').nth(2).locator('figure').textContent()).includes('1.4'));
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t.startsWith('webgl')?null:get.call(this,t,...args);};});await fallback.goto(base+'?mode=focus&panel=clear-route-continuity&detail=height#connections');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);assert.ok((await fallback.locator('.focused-panel figure').textContent()).includes('≥1.5 m clear width'));await fallback.close();
 await page.goto('file:///home/antti/mitoitus-diorama/lab/book/index.html?mode=focus&panel=walking-connections#connections');assert.equal(await page.locator('.connection-network svg[data-network="continuity"]').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(`PASS: ${states} connection states; static weakest-link teaching; one unified clear corridor; labels, context reuse and fallbacks.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
