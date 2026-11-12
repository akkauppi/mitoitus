const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){const gl=get.call(this,t,...args);if(gl&&t.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async id=>{await page.waitForFunction(id=>document.querySelector('.scene-viewport')?.dataset.recipe===id,id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=section-ratio&keep=yes#section-details');await ready('section-ratio--v0');
 const facts=await page.locator('#section-details .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),figures=await page.locator('#section-details figure').evaluateAll(ns=>ns.map(n=>n.innerHTML));let states=0;const ratios=[];
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const [index,panel,cameras,anchors]of [[0,'section-ratio',['section','iso'],3],[1,'equal-density',['iso','plan'],3],[2,'steps',['iso','plan','section'],4]]){
   await page.locator('.panel-selector button').nth(index).click();await ready(panel+'--v0');
   for(const camera of cameras){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(panel+'--v0');
    const d=await page.evaluate(async()=>{const v=document.querySelector('.scene-viewport'),s=v.querySelector('svg'),r=s.getBoundingClientRect(),data=JSON.parse(v.dataset.callouts),{validateCallouts,segmentsIntersect}=await import('./callouts.js');const dimensions=[...s.querySelectorAll('g.dimension-measure')].map(n=>({a:JSON.parse(n.dataset.a),b:JSON.parse(n.dataset.b)}));
     const heights=dimensions.filter((_,i)=>i%2===1),crosses=heights.some(h=>data.items.some(item=>item.points.slice(1).some((p,i)=>segmentsIntersect(h.a,h.b,item.points[i],p))));
     return{status:s.dataset.calloutStatus,items:data.items.length,issues:validateCallouts(data.items,data),dimensions:dimensions.map(d=>Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y)),crosses,sections:JSON.parse(v.dataset.section),w:r.width,h:r.height,texts:[...s.querySelectorAll('text')].map(n=>{const b=n.getBoundingClientRect();return{text:n.textContent,dimension:n.classList.contains('dim-label'),x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};})};});
    assert.equal(d.status,'ok',`${width}/${panel}/${camera}`);assert.equal(d.items,anchors,`${width}/${panel}/${camera} complete anchors`);assert.deepEqual(d.issues,[]);assert.ok(d.texts.every(t=>t.text!=='A'),'no distracting A markers');
    for(const t of d.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=d.w+1&&t.y+t.h<=d.h+1,'clipped '+t.text);
    for(let i=0;i<d.texts.length;i++)for(let j=0;j<i;j++){const a=d.texts[i],b=d.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${panel}/${camera} overlap ${a.text}/${b.text}`);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(new URL(page.url()).searchParams.get('keep'),'yes');
    if(panel==='section-ratio'){
     assert.equal(d.sections.length,6);assert.equal(d.dimensions.length,6);assert.equal(d.texts.filter(t=>t.text==='H = 12 m'||t.text==='12 m').length,3);assert.equal(d.crosses,false,'height dimensions avoid all label leaders');
     const w=d.dimensions.filter((_,i)=>i%2===0),h=d.dimensions.filter((_,i)=>i%2===1);assert.ok(Math.abs(w[1]/w[0]-2)<1e-7&&Math.abs(w[2]/w[0]-3)<1e-7);if(camera==='section')for(let i=0;i<3;i++)assert.ok(Math.abs(h[i]/w[0]-1)<1e-7,'equal metric axes for H and W');ratios.push({width,camera,widthPixels:w,heightPixels:h});
    }else if(panel==='equal-density'){
     assert.equal(d.sections.length,0);assert.equal(d.dimensions.length,3);assert.ok(d.dimensions.every(v=>Math.abs(v-d.dimensions[0])<1e-7),'same metric plot scale');
     const floors=await page.locator('.floor-stack').evaluateAll(ns=>ns.map(n=>n.querySelectorAll('i').length));assert.deepEqual(floors,[2,4,8]);assert.ok((await page.locator('.floor-schematic').textContent()).includes('no vertical metre scale'));
     await page.locator('.scene-viewport').focus();const position=await page.locator('.scene-viewport').getAttribute('data-camera-position');await page.keyboard.press('ArrowRight');await ready(panel+'--v0');assert.equal(new URL(page.url()).hash,'#section-details');assert.notEqual(await page.locator('.scene-viewport').getAttribute('data-camera-position'),position,'3D illustration supports keyboard orbit');
    }else{
     assert.ok(d.texts.some(t=>t.text==='1.2 m landing'));assert.equal(await page.locator('.retained-profile').count(),1);
     if(camera==='section'){assert.equal(d.sections.length,1);assert.ok(Math.abs(d.dimensions[0]/d.dimensions[1]-.12/.42)<1e-7,'rise/tread use equal metric axes');}else assert.equal(d.sections.length,0);
    }
    states++;if([390,1440].includes(width)&&camera===cameras[0])await page.screenshot({path:path.join(out,`sections-t10-${panel}-${width}.png`),fullPage:true});
   }
   await page.click('.scene-toolbar [data-reset]');assert.equal(new URL(page.url()).searchParams.get('camera'),cameras[0]);
  }
 }
 assert.deepEqual(await page.locator('#section-details .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),facts);assert.deepEqual(await page.locator('#section-details figure').evaluateAll(ns=>ns.map(n=>n.innerHTML)),figures);
 await page.goto(base+'?mode=focus&panel=trees&camera=section&keep=yes#green-blue');await ready('trees--v0');assert.equal(JSON.parse(await page.locator('.scene-viewport').getAttribute('data-section')).length,1);assert.ok((await page.locator('.scene-companion').textContent()).includes('25 m³'));assert.equal(await page.locator('.scene-viewport .dim-label').count(),2);await page.reload();await ready('trees--v0');assert.equal(await page.locator('body').getAttribute('data-camera'),'section');
 await page.click('.scene-toolbar [data-camera="front"]');await ready('trees--v0');assert.equal(JSON.parse(await page.locator('.scene-viewport').getAttribute('data-section')).length,0,'Front restores uncut geometry');await page.click('.scene-toolbar [data-camera="section"]');await ready('trees--v0');await page.screenshot({path:path.join(out,'sections-t10-trees-section.png'),fullPage:true});
 // The context instrumentation resets after navigation; each document still owns one canvas/context.
 assert.equal(await page.evaluate(()=>window.__gl.size),1);assert.equal(await page.locator('canvas').count(),1);await page.click('#back-to-sheet');assert.equal(await page.locator('#green-blue figure:visible').count(),3);
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t.startsWith('webgl')?null:get.call(this,t,...args);};});await fallback.goto(base+'?mode=focus&panel=steps&camera=section#section-details');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);await fallback.close();
 await page.goto('file:///home/antti/mitoitus-diorama/lab/book/index.html?mode=focus&panel=equal-density#section-details');assert.equal(await page.locator('.focused-panel figure:visible').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);fs.writeFileSync(path.join(out,'sections-t10-results.json'),JSON.stringify({states,ratios,checks:['six height/width dimensions','no height/leader crossings','cut geometry metadata','equal metric axes','equal plot scale','separate unscaled floor counts','fixed plan keyboard','landing context','preserved canonical source','Section vs Front','no-WebGL/file fallback']},null,2));console.log(`PASS: ${states} analytical panel states; sections, scale ratios, floor areas, landing, annotations, state and fallback.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
