// Exercise the changed recipe sources with the current candidate shell, without
// rebuilding another worker's candidate. Only the assigned recipe/asset module responses differ.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base='http://127.0.0.1:8765/lab/book/',root=path.resolve(__dirname,'..'),out=path.join(root,'review');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage(),errors=[],loads=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/lab/book/assets.js*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'assets.js'),'utf8')}));
 for(const name of ['vehicles','routes'])await page.route(`**/runtime/recipes/${name}.js*`,route=>{loads.push(name);return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,`src/recipes/${name}.js`),'utf8')});});
 const ready=async id=>{await page.waitForFunction(id=>{const v=document.querySelector('.scene-viewport');return v?.dataset.recipe===id&&v.dataset.sceneReady==='true';},id);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
 const check=async(expected)=>{
  const d=await page.evaluate(async()=>{const v=document.querySelector('.scene-viewport'),svg=v.querySelector('svg'),r=svg.getBoundingClientRect(),data=JSON.parse(v.dataset.callouts);return{status:svg.dataset.calloutStatus,issues:(await import('./callouts.js')).validateCallouts(data.items,data),count:data.items.length,texts:[...svg.querySelectorAll('text')].map(t=>{const b=t.getBoundingClientRect();return{text:t.textContent,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};}),w:r.width,h:r.height,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.equal(d.status,'ok');assert.equal(d.count,expected);assert.deepEqual(d.issues,[]);assert.equal(d.overflow,false);
  for(const t of d.texts)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=d.w+1&&t.y+t.h<=d.h+1,'clipped '+t.text);
  for(let i=0;i<d.texts.length;i++)for(let j=0;j<i;j++){const a=d.texts[i],b=d.texts[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'overlap '+a.text+'/'+b.text);}
  return d;
 };
 let states=0;
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1050});
  for(const panel of ['car-turn','bus-turn']){
   await page.goto(base+`?mode=focus&panel=${panel}&camera=plan#turning-vehicles`);await ready(panel+'--v0');
   for(const camera of ['plan','iso']){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(panel+'--v0');const d=await check(2);
    assert.ok(d.texts.some(t=>t.text===(panel==='car-turn'?'5 m body':'15 m body')));if(panel==='bus-turn')assert.ok(d.texts.some(t=>t.text==='2.6 m body'));
    await page.screenshot({path:path.join(out,`release-${panel}-${camera}-${width}.png`),fullPage:true});states++;
   }
  }
  await page.goto(base+'?mode=focus&panel=walking#walk-cycle');await ready('walking--v0');
  for(const [index,label]of ['Total footway','Clear passage','Passing width','Maintenance'].entries()){
   await page.selectOption('#walking-select',String(index));await ready(`walking--v${index}`);
   for(const camera of ['iso','front']){
    await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await ready(`walking--v${index}`);const d=await check(1);assert.ok(d.texts.some(t=>t.text===label));states++;
   }
   if(index<2)await page.screenshot({path:path.join(out,`release-walking-${index}-${width}.png`),fullPage:true});
  }
 }
 assert.ok(loads.includes('vehicles')&&loads.includes('routes'));assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'vehicles-routes-release-results.json'),JSON.stringify({states,errors,sourceModuleOverrides:['vehicles.js','routes.js','assets.js'],scope:'Current candidate shell with revised source recipes; no candidate rebuild or deployment',date:'2026-11-13'},null,2));
 console.log(`PASS: ${states} source-recipe camera/viewport states; complete uncrossed callouts, uncut text and walking measurement labels.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
