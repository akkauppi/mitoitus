const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/';
const out=path.join(__dirname,'../review');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{
  window.__glCanvases=new Set();const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){const result=original.call(this,type,...args);if(type.startsWith('webgl')&&result)window.__glCanvases.add(this);return result;};
  window.__observers=new Map();const Original=ResizeObserver;
  window.ResizeObserver=class extends Original{constructor(callback){super(callback);window.__observers.set(this,new Set());}observe(el,...args){window.__observers.get(this).add(el);return super.observe(el,...args);}disconnect(){window.__observers.get(this).clear();return super.disconnect();}};
 });
 const ready=async()=>{await page.waitForSelector('.scene-viewport[data-scene-ready="true"]');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 const checkRoutes=async()=>{
  const result=await page.evaluate(async()=>{
   const viewport=document.querySelector('.scene-viewport'),overlay=viewport.querySelector('svg');
   const data=JSON.parse(viewport.dataset.callouts);
   return {status:overlay.dataset.calloutStatus,items:data.items.length,errors:(await import('./callouts.js')).validateCallouts(data.items,data),texts:[...overlay.querySelectorAll('text')].map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,x:r.x,y:r.y,w:r.width,h:r.height};})};
  });
  assert.equal(result.status,'ok');assert.equal(result.items,2,'both semantic anchors remain visible');assert.deepEqual(result.errors,[]);
  for(let i=0;i<result.texts.length;i++)for(let j=0;j<i;j++){const a=result.texts[i],b=result.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`annotation overlap ${a.text}/${b.text}`);}
 };
 await page.goto(base+'?mode=focus&panel=trees&keep=sentinel#green-blue');await ready();
 const details=await page.locator('[data-panel-id="trees"] .details').innerHTML();
 assert.equal(await page.locator('.scene-toolbar [data-camera="section"]').count(),1);
 const stats=[];
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});
  for(const camera of ['iso','plan','front','section']){
   await page.click(`.scene-toolbar [data-camera="${camera}"]`);await ready();await checkRoutes();
   assert.equal(new URL(page.url()).searchParams.get('camera'),camera);
   assert.equal(new URL(page.url()).searchParams.get('keep'),'sentinel');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   stats.push({width,camera});
  }
  await page.click('.scene-toolbar [data-camera="iso"]');await ready();
  await page.screenshot({path:path.join(out,`viewer-root-${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1100});
 await page.locator('.scene-viewport').focus();const before=await page.locator('.scene-viewport').getAttribute('data-camera-position');
 await page.keyboard.press('ArrowRight');await ready();assert.notEqual(await page.locator('.scene-viewport').getAttribute('data-camera-position'),before);
 assert.equal(new URL(page.url()).hash,'#green-blue');
 await page.keyboard.press('Home');await ready();assert.equal(new URL(page.url()).searchParams.get('camera'),'iso');
 await page.uncheck('[data-dimensions]');await ready();assert.equal(await page.locator('.scene-viewport .dim-label').count(),0);
 await page.check('[data-dimensions]');await ready();assert.equal(await page.locator('.scene-viewport .dim-label').count(),3);
 await page.uncheck('input[data-callouts]');await ready();assert.equal(await page.locator('.scene-viewport [data-callout]').count(),0);
 await page.check('input[data-callouts]');await ready();await checkRoutes();
 for(const style of ['ink','soft','paper']){
  await page.locator('.book-menu summary').filter({hasText:'View'}).click();
  await page.selectOption('#book-style',style);await page.keyboard.press('Escape');await ready();await checkRoutes();
  assert.equal(new URL(page.url()).searchParams.get('style'),style);
 }
 await page.locator('.scene-viewport').focus();
 for(let i=0;i<16;i++){await page.keyboard.press('ArrowRight');await ready();await checkRoutes();}
 await page.keyboard.press('Home');await ready();
 const idle=await page.locator('.scene-viewport').getAttribute('data-render-count');await page.waitForTimeout(120);
 assert.equal(await page.locator('.scene-viewport').getAttribute('data-render-count'),idle,'no perpetual render loop');
 const geometry=Number(await page.locator('.scene-viewport').getAttribute('data-geometry-count'));
 for(let i=0;i<20;i++){
  await page.click('#back-to-sheet');
  assert.equal(await page.locator('[data-panel-id="trees"] .scene-fallback-hidden').count(),0);
  assert.ok(Number(await page.locator('.scene-viewport').getAttribute('data-geometry-count'))<=1,'scene geometry released when suspended');
  await page.locator('[data-panel-id="trees"] .explore').click();await ready();
  assert.ok(Number(await page.locator('.scene-viewport').getAttribute('data-geometry-count'))<=geometry,'fresh whole view stays within warmed geometry count');
  await page.click('.scene-toolbar [data-camera="section"]');await ready();await page.click('.scene-toolbar [data-camera="iso"]');await ready();
  assert.equal(Number(await page.locator('.scene-viewport').getAttribute('data-geometry-count')),geometry,'whole and section resources remain stable after warming both views');
 }
 assert.equal(await page.evaluate(()=>window.__glCanvases.size),1);
 assert.equal(await page.evaluate(()=>[...window.__observers.values()].reduce((n,s)=>n+s.size,0)),1);
 assert.equal(await page.locator('canvas').count(),1);
 // Actual WebGL loss/restoration: reference figure replaces the unavailable canvas.
 await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');window.__lose=gl.getExtension('WEBGL_lose_context');window.__lose.loseContext();});
 await page.waitForSelector('[data-panel-id="trees"] .scene-status:not([hidden])');
 assert.equal(await page.locator('[data-panel-id="trees"] .scene-fallback-hidden').count(),0);
 await page.waitForTimeout(100);await page.evaluate(()=>window.__lose.restoreContext());await ready();
 assert.equal(await page.locator('[data-panel-id="trees"] .scene-fallback-hidden').count(),1);
 assert.equal(await page.locator('[data-panel-id="trees"] .details').innerHTML(),details);
 assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('sources-on')),false);
 await page.click('#sources-toggle');assert.equal(await page.locator('.scene-provenance:visible').count(),1);
 assert.ok((await page.locator('.scene-provenance').textContent()).includes('illustration assumptions'));
 await page.click('#sources-toggle');assert.equal(await page.locator('.scene-provenance:visible').count(),0);
 // Late module loading must not mount a scene after the user leaves the panel.
 const late=await browser.newPage();await late.route('**/runtime/book-3d.js*',async route=>{await new Promise(r=>setTimeout(r,180));await route.continue();});
 await late.goto(base+'?mode=focus&panel=trees#green-blue');await late.click('#back-to-sheet');await late.waitForTimeout(300);
 assert.equal(await late.locator('canvas').count(),0);await late.close();
 // WebGL unavailable: full source figure/facts remain, no blank figure.
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
 await fallback.goto(base+'?mode=focus&panel=trees#green-blue');await fallback.waitForSelector('.scene-status:not([hidden])');
 assert.equal(await fallback.locator('[data-panel-id="trees"] .drawing figure:visible').count(),1);
 assert.equal(await fallback.locator('[data-panel-id="trees"] .details').innerHTML(),details);await fallback.close();
 // Explicit host disposal removes observed targets, controls and pending frames.
 const lifecycle=await browser.newPage();await lifecycle.goto(base+'?mode=overview');
 const disposed=await lifecycle.evaluate(async()=>{
  const {createSceneHost}=await import('./runtime/viewer.js');
  const viewport=document.createElement('div');viewport.style.cssText='width:800px;height:500px';viewport.tabIndex=0;
  const canvas=document.createElement('canvas'),overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');viewport.append(canvas,overlay);document.body.append(viewport);
  const host=createSceneHost({canvas,overlay,viewport});host.show({recipeId:'trees--v0'});
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));host.dispose();
  const before=host.inspect();viewport.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'}));
  await new Promise(r=>requestAnimationFrame(r));return {before,after:host.inspect()};
 });
 assert.equal(disposed.before.disposed,true);assert.equal(disposed.before.active,false);
 assert.equal(disposed.before.recipe,null);assert.equal(disposed.after.renders,disposed.before.renders);await lifecycle.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 fs.writeFileSync(path.join(out,'viewer-t03-results.json'),JSON.stringify({states:stats,suspendResumeCycles:20,contexts:1,activeResizeTargets:1,geometryCount:geometry,orbitChecks:16,styles:3,disposal:'passed',contextLoss:'passed',noWebGL:'passed',staleImport:'passed',idle:'no continuous rendering',errors,external},null,2));
 console.log('PASS: 20 responsive camera states; geometry/callouts; 20 suspend/resume cycles; single context; idle; context loss/restore; no-WebGL and stale-import fallbacks.');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
