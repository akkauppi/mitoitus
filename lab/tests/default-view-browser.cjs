/* Acceptance for live Focus + 3D defaults against the generated book. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base=process.env.BOOK_URL||'http://127.0.0.1:8765/lab/book/';
const output=path.resolve(__dirname,'../review/default-view');fs.mkdirSync(output,{recursive:true});
const native=new Set(['density','services','green-hierarchy','parking-norms']);
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),errors=[],external=[],missing=[];
  context.on('page',page=>{
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(new URL(base).origin+'/'))external.push(request.url());});
   page.on('response',response=>{if(response.status()>=400)missing.push([response.status(),response.url()]);});
  });
  await context.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const value=get.call(this,type,...args);if(value&&type.startsWith('webgl'))window.__gl.add(this);return value;};});
  const page=await context.newPage();
  const ready=async(page,panel,variant=0)=>{
   await page.waitForSelector('body[data-book-ready]',{state:'attached'});
   if(!native.has(panel))await page.waitForFunction(id=>{const viewport=document.querySelector('.scene-viewport');return viewport?.dataset.recipe===id&&viewport.dataset.sceneReady==='true';},`${panel}--v${variant}`);
   await settle(page);
  };
  const view=async(page,panel,camera='iso',variant=0)=>{
   await ready(page,panel,variant);
   assert.equal(await page.getAttribute('body','data-mode'),'focus');
   assert.equal(await page.locator('.focused-panel:visible').getAttribute('data-panel-id'),panel);
   assert.equal(await page.getAttribute('body','data-camera'),camera);
   if(!native.has(panel))assert.equal(await page.locator(`.scene-toolbar [data-camera="${camera}"]`).getAttribute('aria-pressed'),'true');
  };
  const navigate=async(panel,sheet,params={})=>{
   await page.evaluate(({panel,sheet,params})=>{const url=new URL(location.href);url.search='';url.hash=sheet;if(panel)url.searchParams.set('panel',panel);for(const [key,value]of Object.entries(params))url.searchParams.set(key,value);history.pushState(null,'',url);dispatchEvent(new PopStateEvent('popstate'));},{panel,sheet,params});
   await ready(page,panel);
  };
  await page.goto(base);await view(page,'building-blocks');
  assert.equal(await page.locator('body').evaluate(node=>node.classList.contains('sources-on')),false);
  const panels=await page.locator('.panel').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.panelId,sheet:node.closest('.sheet').id})));
  const live=panels.filter(panel=>!native.has(panel.id));assert.equal(panels.length,30);assert.equal(live.length,26);
  let defaults=0,nativeStates=0;
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:1050});
   for(const panel of live){
    await navigate(panel.id,panel.sheet);await view(page,panel.id);
    const audit=await page.evaluate(async()=>{
     const viewport=document.querySelector('.scene-viewport'),svg=viewport.querySelector('svg'),rect=svg.getBoundingClientRect(),callouts=JSON.parse(viewport.dataset.callouts);
     return{status:svg.dataset.calloutStatus,issues:(await import('./callouts.js')).validateCallouts(callouts.items,callouts),overflow:document.documentElement.scrollWidth>innerWidth,width:rect.width,height:rect.height,texts:[...svg.querySelectorAll('text')].map(node=>{const box=node.getBoundingClientRect();return{text:node.textContent,x:box.x-rect.x,y:box.y-rect.y,width:box.width,height:box.height};})};
    });
    assert.equal(audit.status,'ok',`${width}/${panel.id} annotation routing`);assert.deepEqual(audit.issues,[]);assert.equal(audit.overflow,false);
    for(const text of audit.texts)assert.ok(text.x>=-1&&text.y>=-1&&text.x+text.width<=audit.width+1&&text.y+text.height<=audit.height+1,`${width}/${panel.id} clipped ${text.text}`);
    for(let i=0;i<audit.texts.length;i++)for(let j=0;j<i;j++){const a=audit.texts[i],b=audit.texts[j];assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),`${width}/${panel.id} text overlap ${a.text} / ${b.text}`);}
    if(width===390&&['car-turn','ramps'].includes(panel.id)||width===1440&&panel.id==='ponds')await page.screenshot({path:path.join(output,`${panel.id}-${width}.png`),fullPage:true});
    defaults++;
   }
   for(const panel of panels.filter(panel=>native.has(panel.id))){
    await navigate(panel.id,panel.sheet);await view(page,panel.id,'plan');
    assert.equal(await page.locator('.scene-host:visible').count(),0);assert.equal(await page.locator('.focused-panel .details:visible').count(),1);nativeStates++;
   }
  }
  assert.equal(await page.evaluate(()=>window.__gl.size),1,'one shared context across default scenes');

  // Explicit alternative cameras survive reload; Reset/Home use the live 3D default.
  for(const [panel,sheet,camera]of [['car-turn','turning-vehicles','plan'],['ramps','accessible','front'],['ponds','stormwater-options','section']]){
   await page.goto(base+`?panel=${panel}&camera=${camera}&keep=yes#${sheet}`);await view(page,panel,camera);
   await page.reload();await view(page,panel,camera);
   if(panel==='ponds')await page.locator('.scene-category select').selectOption('1');
   await page.locator('.scene-viewport').focus();await page.keyboard.press('ArrowRight');await settle(page);
   await page.keyboard.press('Home');await view(page,panel);
   assert.equal(new URL(page.url()).searchParams.get('camera'),'iso');assert.equal(new URL(page.url()).searchParams.get('keep'),'yes');
   if(panel==='ponds'){
    assert.equal(await page.locator('.scene-category select').inputValue(),'1','Home retains the selected category');
    assert.equal(await page.locator('[data-poster-set="ponds--v0"] [data-poster-choice]').inputValue(),'1');
   }
   await page.locator(`.scene-toolbar [data-camera="${camera}"]`).click();await view(page,panel,camera);
   await page.locator(`.scene-toolbar [data-camera="${camera}"]`).focus();await page.keyboard.press('Home');await view(page,panel,camera);
   await page.locator('[data-reset]').click();await view(page,panel);
   if(panel==='ponds')assert.equal(await page.locator('.scene-category select').inputValue(),'0','Reset restores the authored category');
  }
  await page.goto(base+'?mode=overview&panel=car-turn&camera=plan#turning-vehicles');await page.waitForSelector('body[data-book-ready]',{state:'attached'});await settle(page);
  assert.equal(await page.getAttribute('body','data-mode'),'overview');assert.equal(await page.getAttribute('body','data-camera'),'plan');
  assert.equal(await page.locator('.sheet:not([hidden]) .panel:visible').count(),3);assert.equal(await page.locator('.scene-host:visible').count(),0);
  await page.goto(base+'?panel=ramps&camera=invalid#accessible');await view(page,'ramps');assert.equal(new URL(page.url()).searchParams.get('camera'),'iso');
  await page.goto(base+'?layout-car-layout=2#turning-vehicles');await view(page,'car-turn','iso',2);assert.equal(await page.locator('#car-layout-select').inputValue(),'2');
  await page.goto(base+'?panel=parking-area#parking');await view(page,'parking-layout');assert.equal(await page.locator('.scene-category select').inputValue(),'1');

  // Ordinary navigation keeps implicit Focus, and explicit Overview is retained.
  await page.goto(base);await view(page,'building-blocks');
  await page.locator('.tabs a[href="#walk-cycle"]').click();await view(page,'walking');
  await page.locator('.panel-selector button').nth(1).click();await view(page,'cycling');
  await page.locator('.tabs a[href="#accessible"]').click();await view(page,'turning');
  await page.goBack();await view(page,'cycling');await page.goForward();await view(page,'turning');
  await page.click('#back-to-sheet');await settle(page);assert.equal(await page.getAttribute('body','data-mode'),'overview');
  await page.locator('.tabs a[href="#tram"]').click();await settle(page);assert.equal(await page.getAttribute('body','data-mode'),'overview');
  await page.locator('[data-panel-id="tram-width"] .explore').click();await view(page,'tram-width');
  await page.goBack();await settle(page);assert.equal(await page.getAttribute('body','data-mode'),'overview');await page.goForward();await view(page,'tram-width');
  const tab=await context.newPage();await tab.goto(base+'#tram');await view(tab,'tram-corridor');await tab.close();

  // Wall and print retain complete static spreads. Direct-file/no-WebGL remain usable.
  const wall=await context.newPage();await wall.setViewportSize({width:4800,height:1000});
  await wall.goto(base+'?view=wall#built-form');await wall.waitForSelector('body[data-book-ready]',{state:'attached'});
  assert.equal(await wall.getAttribute('body','data-mode'),'overview');assert.equal(await wall.locator('.sheet:not([hidden]) .panel:visible').count(),3);assert.equal(await wall.locator('canvas').count(),0);await wall.close();
  await page.emulateMedia({media:'print'});await settle(page);
  assert.equal(await page.locator('.sheet:visible').count(),11);assert.equal(await page.locator('.panel:visible').count(),30);assert.equal(await page.locator('.scene-host:visible').count(),0);await page.emulateMedia({media:'screen'});
  const file=await context.newPage();await file.goto(pathToFileURL(path.resolve(__dirname,'../book/index.html')).href);await file.waitForSelector('body[data-book-ready]',{state:'attached'});
  assert.equal(await file.locator('canvas').count(),0);assert.ok(await file.locator('.modern-poster:visible').count());await file.close();
  const fallback=await context.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
  await fallback.goto(base);await fallback.waitForSelector('.scene-status:not([hidden])');assert.equal(await fallback.getAttribute('body','data-mode'),'focus');assert.equal(await fallback.locator('.focused-panel .modern-poster:visible').count(),1);await fallback.close();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(missing,[]);
  const report={defaultLiveStates:defaults,nativeFocusStates:nativeStates,widths:[390,1440],explicitCameras:['plan','front','section'],reset:'3D and default category',home:'3D retaining category',overview:'explicit mode retained',navigation:'bare URL, new tab, sheet/panel navigation and Back/Forward',fallbacks:['wall Overview','all print spreads','file static posters','no-WebGL static poster'],screenshots:['car-turn-390.png','ramps-390.png','ponds-1440.png'],errors,external,missing};
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
