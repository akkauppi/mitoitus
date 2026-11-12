const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',out=path.join(__dirname,'../review');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(gl&&type.startsWith('webgl'))window.__gl.add(this);return gl;};});
 const ready=async id=>{await page.waitForFunction(id=>document.querySelector('.scene-viewport')?.dataset.recipe===id,id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 await page.goto(base+'?mode=focus&panel=car-turn&keep=yes#turning-vehicles');await ready('car-turn--v0');
 const facts=await page.locator('#turning-vehicles .details').evaluateAll(ns=>ns.map(n=>n.innerHTML));
 let states=0;
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1100});
  for(const camera of ['plan','iso']){
   let ppm=null,frame=null;
   for(const [p,panel]of ['car-turn','bus-turn','rescue'].entries()){
    await page.locator('.panel-selector button').nth(p).click();
    for(let index=0;index<(panel==='rescue'?1:3);index++){
     if(panel!=='rescue')await page.selectOption(`#${panel==='car-turn'?'car':'bus'}-layout-select`,String(index));
     const id=`${panel}--v${index}`;await ready(id);await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(id);
     const d=await page.evaluate(async()=>{
      const v=document.querySelector('.scene-viewport'),s=v.querySelector('svg'),rect=s.getBoundingClientRect(),data=JSON.parse(v.dataset.callouts);
      return{status:s.dataset.calloutStatus,items:data.items.length,issues:(await import('./callouts.js')).validateCallouts(data.items,data),width:Number(v.dataset.projectedWidth),frame:JSON.parse(v.dataset.comparisonFrame),w:rect.width,h:rect.height,texts:[...s.querySelectorAll('text')].map(n=>{const b=n.getBoundingClientRect();return{text:n.textContent,x:b.x-rect.x,y:b.y-rect.y,w:b.width,h:b.height};})};
     });
     assert.equal(d.status,'ok',`${width}/${id}/${camera}`);assert.equal(d.items,panel==='rescue'?4:index?1:2,`${width}/${id}/${camera} anchors`);assert.deepEqual(d.issues,[]);
     for(const t of d.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=d.w+1&&t.y+t.h<=d.h+1,'clipped '+t.text);
     for(let i=0;i<d.texts.length;i++)for(let j=0;j<i;j++){const a=d.texts[i],b=d.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${id}/${camera} overlap ${a.text}/${b.text}`);}
     if(index){const value=index*(panel==='car-turn'?3:3.25),scale=d.width/value;if(ppm!==null){assert.ok(Math.abs(ppm-scale)<1e-7,'common lane scale');assert.deepEqual(d.frame,frame);}else{ppm=scale;frame=d.frame;}}
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
     if(panel==='car-turn')await page.getByText('No long-term private car parking.',{exact:false}).last().waitFor({state:'visible'});
     if(panel!=='rescue')assert.equal(new URL(page.url()).searchParams.get(`layout-${panel==='car-turn'?'car':'bus'}-layout`),index?String(index):null);
     assert.equal(new URL(page.url()).searchParams.get('keep'),'yes');states++;
     if([390,1440].includes(width)&&camera==='plan')await page.screenshot({path:path.join(out,`vehicles-${panel}-${index}-${width}.png`),fullPage:true});
    }
   }
  }
 }
 assert.equal(await page.evaluate(()=>window.__gl.size),1);assert.equal(await page.locator('canvas').count(),1);
 assert.deepEqual(await page.locator('#turning-vehicles .details').evaluateAll(ns=>ns.map(n=>n.innerHTML)),facts);
 await page.reload();await ready('rescue--v0');await page.click('[data-reset]');assert.equal(new URL(page.url()).searchParams.get('camera'),'plan');
 await page.click('#back-to-sheet');assert.equal(await page.locator('#turning-vehicles figure:visible').count(),3);
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
 await fallback.goto(base+'?mode=focus&panel=bus-turn&layout-bus-layout=2#turning-vehicles');await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.locator('.focused-panel figure:visible').count(),1);assert.equal(await fallback.locator('#bus-layout-select').inputValue(),'2');
 await fallback.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(`PASS: ${states} vehicle camera/variant states; metric comparisons, complete callouts, preserved facts and URLs, one context and fallback.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
