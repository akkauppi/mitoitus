/* Category selection must describe the same scene on screen, paper and fallback.
 * SOURCE_OVERRIDE=0 checks the built artifact; default checks revised shell sources
 * without rebuilding a candidate owned by another worker. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base=process.env.BOOK_URL||'http://127.0.0.1:8765/lab/book/';
const sourceOverride=process.env.SOURCE_OVERRIDE!=='0';
const cases=[
 {panel:'parking-layout',sheet:'parking',choice:1,initial:0,label:'Bay 12.5 m²',defaultLabel:'Reference car'},
 {panel:'ground',sheet:'green-blue',choice:3,initial:-1,label:'Ground cover',defaultLabel:'Tree strip'},
 {panel:'rain-gardens',sheet:'stormwater-options',choice:1,initial:0,label:'Along-route flow',defaultLabel:'Planted filter'},
 {panel:'ponds',sheet:'stormwater-options',choice:1,initial:0,label:'Permanent water',defaultLabel:'Temporary storage'},
 {panel:'source-control',sheet:'stormwater-options',choice:1,initial:0,label:'Aggregate voids',defaultLabel:'Substrate'},
];
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),errors=[];
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  if(sourceOverride)for(const file of ['book-3d.js','posters.js'])await context.route(`**/runtime/${file}*`,route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.resolve(__dirname,'../src',file),'utf8')}));
  const page=await context.newPage();
  const ready=async panel=>{await page.waitForFunction(id=>{const v=document.querySelector('.scene-viewport');return v?.dataset.recipe===id+'--v0'&&v.dataset.sceneReady==='true';},panel);await settle(page);};
  const staticChoice=(page,panel)=>page.locator(`[data-poster-set="${panel}--v0"] [data-poster-choice]`);
  const assertChoice=async(item,value,label)=>{
   await settle(page);
   assert.equal(await staticChoice(page,item.panel).inputValue(),String(value),item.panel+' static choice');
   assert.equal(await page.locator(`[data-poster-set="${item.panel}--v0"] .poster-option:not([hidden])`).getAttribute('data-poster-option'),String(value));
   assert.equal(await page.locator('.scene-category select').inputValue(),String(value),item.panel+' live choice');
   const labels=await page.locator('.scene-viewport').evaluate(v=>JSON.parse(v.dataset.callouts).items.map(item=>item.text));
   assert.ok(labels.includes(label),`${item.panel}: geometry labels ${labels.join(', ')} omit ${label}`);
  };
  for(const item of cases){
   const key='poster-'+item.panel+'--v0';
   await page.goto(base+`?mode=overview#${item.sheet}`);await page.waitForSelector('body[data-book-ready]');
   await staticChoice(page,item.panel).selectOption(String(item.choice));
   assert.equal(await staticChoice(page,item.panel).inputValue(),String(item.choice));
   assert.equal(new URL(page.url()).searchParams.get(key),String(item.choice));
   await page.locator(`[data-panel-id="${item.panel}"] .explore`).click();await ready(item.panel);
   await assertChoice(item,item.choice,item.label);
   await page.locator('.scene-category select').selectOption(String(item.initial));await assertChoice(item,item.initial,item.defaultLabel);
   assert.equal(new URL(page.url()).searchParams.get(key),String(item.initial));
   await page.locator('.scene-category select').selectOption(String(item.choice));await assertChoice(item,item.choice,item.label);
   await page.click('#back-to-sheet');await settle(page);
   assert.equal(await staticChoice(page,item.panel).inputValue(),String(item.choice));
   await page.locator(`[data-panel-id="${item.panel}"] .explore`).click();await ready(item.panel);await assertChoice(item,item.choice,item.label);
   await page.emulateMedia({media:'print'});await settle(page);
   assert.equal(await page.locator(`[data-poster-set="${item.panel}--v0"] .poster-option[data-poster-option="${item.choice}"] .modern-poster:visible`).count(),1,item.panel+' alternate print poster');
   await page.emulateMedia({media:'screen'});
   await page.locator('[data-reset]').click();await ready(item.panel);await assertChoice(item,item.initial,item.defaultLabel);
   assert.equal(new URL(page.url()).searchParams.get(key),String(item.initial));
   await page.emulateMedia({media:'print'});await settle(page);
   assert.equal(await page.locator(`[data-poster-set="${item.panel}--v0"] .poster-option:not([hidden]) .modern-poster:visible`).count(),1,item.panel+' selected print poster');
   await page.emulateMedia({media:'screen'});
   await page.evaluate(({key,choice})=>{const url=new URL(location.href);url.searchParams.set(key,choice);history.pushState(null,'',url);dispatchEvent(new PopStateEvent('popstate'));},{key,choice:String(item.choice)});await ready(item.panel);await assertChoice(item,item.choice,item.label);
   await page.goBack();await ready(item.panel);await assertChoice(item,item.initial,item.defaultLabel);
   await page.goForward();await ready(item.panel);await assertChoice(item,item.choice,item.label);
   await page.reload();await ready(item.panel);await assertChoice(item,item.choice,item.label);
  }
  // The retired parking-area URL selects the retained area-accounting category.
  await page.goto(base+'?mode=focus&panel=parking-area#parking');await ready('parking-layout');await assertChoice(cases[0],1,cases[0].label);
  assert.equal(new URL(page.url()).searchParams.get('poster-parking-layout--v0'),'1');
  // A missing/invalid history parameter restores the actual authored default.
  await page.evaluate(()=>{const url=new URL(location.href);url.searchParams.delete('poster-parking-layout--v0');history.pushState(null,'',url);dispatchEvent(new PopStateEvent('popstate'));});await ready('parking-layout');await assertChoice(cases[0],0,cases[0].defaultLabel);
  await page.evaluate(()=>{const url=new URL(location.href);url.searchParams.set('poster-parking-layout--v0','99');history.pushState(null,'',url);dispatchEvent(new PopStateEvent('popstate'));});await ready('parking-layout');await assertChoice(cases[0],0,cases[0].defaultLabel);
  // The category controls continue working when WebGL is absent.
  const fallback=await context.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args);};});
  await fallback.goto(base+'?mode=focus&panel=parking-layout&poster-parking-layout--v0=1#parking');await fallback.waitForSelector('.scene-status:not([hidden])');
  assert.equal(await staticChoice(fallback,'parking-layout').inputValue(),'1');
  await staticChoice(fallback,'parking-layout').selectOption('0');
  assert.equal(await fallback.locator('[data-poster-set="parking-layout--v0"] .poster-option:not([hidden])').getAttribute('data-poster-option'),'0');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${cases.length} category panels keep Overview, Focus, Reset, URL history/reload, print and WebGL fallback in sync; legacy area alias retained. Source overrides: ${sourceOverride}.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
