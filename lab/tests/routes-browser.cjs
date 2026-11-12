const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__contexts=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const result=get.call(this,type,...args);if(result&&type.startsWith('webgl'))window.__contexts.add(this);return result;};});
 const ready=async id=>{await page.waitForFunction(id=>{const v=document.querySelector('.scene-viewport');return v?.dataset.recipe===id&&v.dataset.sceneReady==='true';},id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 const routeCheck=async()=>{
  const r=await page.evaluate(async()=>{const v=document.querySelector('.scene-viewport'),svg=v.querySelector('svg'),data=JSON.parse(v.dataset.callouts);const rect=svg.getBoundingClientRect();return{recipe:v.dataset.recipe,status:svg.dataset.calloutStatus,expected:Number(v.dataset.visibleAnchors),actual:data.items.length,issues:(await import('./callouts.js')).validateCallouts(data.items,data),geometry:Number(v.dataset.geometryCount),width:Number(v.dataset.projectedWidth),frame:JSON.parse(v.dataset.comparisonFrame),texts:[...svg.querySelectorAll('text')].map(e=>{const b=e.getBoundingClientRect();return{text:e.textContent,x:b.x-rect.x,y:b.y-rect.y,w:b.width,h:b.height};}),w:rect.width,h:rect.height};});
  assert.equal(r.status,'ok');assert.equal(r.actual,r.expected);assert.equal(r.actual,r.recipe==='cycling--v0'||r.recipe==='bike-parking--v0'?2:1,'all declared anchors visible in preset views');assert.deepEqual(r.issues,[]);
  for(const t of r.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=r.w+1&&t.y+t.h<=r.h+1,'unclipped text '+t.text);
  for(let i=0;i<r.texts.length;i++)for(let j=0;j<i;j++){const a=r.texts[i],b=r.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`text collision ${a.text}/${b.text}`);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);return r;
 };
 await page.goto(base+'?mode=focus&panel=walking&keep=sentinel#walk-cycle');await ready('walking--v0');
 const facts=await page.locator('.sheet#walk-cycle .details').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 let states=0;const ratios=[],geometryCounts={};
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const camera of ['iso','plan','front']){
   await page.locator('.panel-selector button').nth(0).click();await ready('walking--v'+await page.locator('#walking-select').inputValue());
   await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();
   let reference=null;
   for(const [panel,values]of [['walking',[2.5,1.5,1.8,2.3]],['cycling',[1.75,2.5,3.5,3,4]]]){
    await page.locator('.panel-selector button').nth(panel==='walking'?0:1).click();
    for(const [index,value]of values.entries()){
     await page.selectOption(`#${panel}-select`,String(index));await ready(`${panel}--v${index}`);const r=await routeCheck();
     const sourceCase=await page.locator(`[data-panel-id="${panel}"] [data-variant="${index}"] svg .sub`).textContent();
     assert.equal(await page.locator('.scene-case').textContent(),sourceCase);
     const recipe=`${panel}--v${index}`;
     if(geometryCounts[recipe]!==undefined)assert.equal(r.geometry,geometryCounts[recipe],'stable GPU geometry count');
     else geometryCounts[recipe]=r.geometry;
     const ppm=r.width/value;if(reference){assert.ok(Math.abs(reference.ppm-ppm)<1e-7,`scale changed ${width}/${camera}/${panel}/${index}`);assert.deepEqual(r.frame,reference.frame);}else reference={ppm,frame:r.frame};
     assert.equal(new URL(page.url()).searchParams.get('layout-'+panel),index?String(index):null);
     assert.equal(new URL(page.url()).searchParams.get('keep'),'sentinel');states++;
    }
   }
   ratios.push({viewport:width,camera,pixelsPerMetre:reference.ppm});
  }
  await page.locator('.panel-selector button').nth(2).click();await ready('bike-parking--v0');
  for(const camera of ['iso','plan','front']){await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready('bike-parking--v0');await routeCheck();states++;}
  await page.locator('.scene-toolbar [data-camera="iso"]').click();await ready('bike-parking--v0');
  if([390,1440].includes(width))await page.screenshot({path:path.join(out,`routes-parking-${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1100});
 await page.locator('.panel-selector button').nth(1).click();await page.selectOption('#cycling-select','1');await ready('cycling--v1');
 await page.locator('.scene-toolbar [data-camera="iso"]').click();await ready('cycling--v1');
 await page.screenshot({path:path.join(out,'routes-cycling-1440.png'),fullPage:true});
 // Variant changes retain a user-adjusted orientation and zoom, not only presets.
 await page.locator('.scene-viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');await ready('cycling--v1');
 const adjusted=await page.locator('.scene-viewport').getAttribute('data-comparison-frame');
 const position=await page.locator('.scene-viewport').getAttribute('data-camera-position');
 await page.selectOption('#cycling-select','4');await ready('cycling--v4');
 assert.equal(await page.locator('.scene-viewport').getAttribute('data-comparison-frame'),adjusted);
 assert.equal(await page.locator('.scene-viewport').getAttribute('data-camera-position'),position);
 assert.equal(await page.evaluate(()=>window.__contexts.size),1,'one context across the complete route matrix');
 await page.reload();await ready('cycling--v4');assert.equal(await page.locator('#cycling-select').inputValue(),'4');
 assert.deepEqual(await page.locator('.sheet#walk-cycle .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),facts);
 assert.equal(await page.evaluate(()=>window.__contexts.size),1);assert.equal(await page.locator('canvas').count(),1);
 // One context is retained when the host moves to the earlier soil recipe too.
 await page.locator('.tabs a[href="#green-blue"]').click();await page.locator('.panel-selector button').first().click();await ready('trees--v0');
 assert.equal(await page.evaluate(()=>window.__contexts.size),1);
 const file=await browser.newPage();await file.goto('file://'+path.resolve(__dirname,'../book/index.html')+'?mode=focus&panel=cycling&layout-cycling=2#walk-cycle');await file.waitForSelector('body[data-book-ready]');
 assert.equal(await file.locator('#cycling-select').inputValue(),'2');assert.equal(await file.locator('.focused-panel figure:visible').count(),1);await file.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 fs.writeFileSync(path.join(out,'routes-t04-results.json'),JSON.stringify({states,ratios,geometryCounts,contexts:1,userCameraPreserved:true,canonicalFacts:'unchanged',fileFallback:'passed',errors,external},null,2));
 console.log(`PASS: ${states} route/parking camera states; projected ratios and identical frames across all nine choices; user camera preserved; single context; facts/URL/file fallback.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
