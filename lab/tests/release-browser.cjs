/* Whole-book release acceptance against the actual generated artifact. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const base=process.env.BOOK_URL||'http://127.0.0.1:8765/lab/book/';
const output=path.resolve(__dirname,'../review/release');fs.mkdirSync(output,{recursive:true});
const file=path.resolve(__dirname,'../book/index.html');
const dataOnly=new Set(['density','services','green-hierarchy','parking-norms']);
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));

(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],external=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(new URL(base).origin+'/'))external.push(r.url());});
 page.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()]);});
 await page.addInitScript(()=>{window.__gl=new Set();const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){const v=get.call(this,t,...args);if(v&&t.startsWith('webgl'))window.__gl.add(this);return v;};});
 await page.goto(base);await page.waitForSelector('body[data-book-ready]');
 const sheets=await page.locator('.sheet').evaluateAll(nodes=>nodes.map(n=>({id:n.id,panels:[...n.querySelectorAll('.panel')].map(p=>p.dataset.panelId)})));
 assert.equal(sheets.length,11);assert.equal(sheets.flatMap(s=>s.panels).length,30);
 assert.equal(await page.locator('[data-panel-id="walking-connections"],[data-panel-id="stormwater"],[data-legacy-visual]').count(),0);
 assert.equal(await page.locator('[data-panel-id="clear-route-continuity"] h2').textContent(),'Walking path clearances');
 assert.equal(await page.locator('[data-panel-id="services"] .drawing').count(),0);
 const navigate=async(sheet,panel=null,extra={})=>{
   await page.evaluate(({sheet,panel,extra})=>{const u=new URL(location.href);u.hash=sheet;u.search='';u.searchParams.set('mode',panel?'focus':'overview');u.searchParams.set('view','desktop');if(panel)u.searchParams.set('panel',panel);for(const[k,v]of Object.entries(extra))u.searchParams.set(k,v);history.pushState(null,'',u);dispatchEvent(new PopStateEvent('popstate'));},{sheet,panel,extra});
   if(panel&&!dataOnly.has(panel)&&extra.view!=='wall')await page.waitForFunction(id=>document.querySelector('.scene-viewport')?.dataset.recipe===id+'--v0'&&document.querySelector('.scene-viewport')?.dataset.sceneReady==='true',panel);
   await settle(page);
 };
 const fits=async label=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,label+' horizontal overflow');
 let overviewStates=0,focusStates=0;
 for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:1100});
   for(const sheet of sheets){
     await navigate(sheet.id);await fits(`${width}/${sheet.id}/overview`);overviewStates++;
     assert.equal(await page.locator('.sheet:not([hidden]) .panel:visible').count(),sheet.panels.length);
     await page.locator('.sheet:not([hidden]) .modern-poster:visible').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode().catch(()=>{}))));
     const bad=await page.locator('.sheet:not([hidden]) .modern-poster:visible').evaluateAll(nodes=>nodes.filter(n=>!n.complete||!n.naturalWidth).map(n=>n.src));
     assert.deepEqual(bad,[],`${width}/${sheet.id} missing poster`);
     if(width===1440)await page.screenshot({path:path.join(output,`${sheet.id}-overview.png`),fullPage:true});
     for(const panel of sheet.panels){
       await navigate(sheet.id,panel);await fits(`${width}/${panel}/focus`);focusStates++;
       assert.equal(await page.locator('.focused-panel:visible').count(),1);
       if(!dataOnly.has(panel)){
         const audit=await page.evaluate(async()=>{
           const v=document.querySelector('.scene-viewport'),svg=v.querySelector('svg'),r=svg.getBoundingClientRect(),c=JSON.parse(v.dataset.callouts);
           const issues=(await import('./callouts.js')).validateCallouts(c.items,c);
           const text=[...svg.querySelectorAll('text')].map(n=>{const b=n.getBoundingClientRect();return{value:n.textContent,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};});
           return{status:svg.dataset.calloutStatus,issues,text,w:r.width,h:r.height,anchors:c.items.length};
         });
         assert.equal(audit.status,'ok',`${width}/${panel} callouts`);assert.deepEqual(audit.issues,[]);
         for(const t of audit.text)assert.ok(t.x>=-1&&t.y>=-1&&t.x+t.w<=audit.w+1&&t.y+t.h<=audit.h+1,`${width}/${panel} clipped ${t.value}`);
         for(let i=0;i<audit.text.length;i++)for(let j=0;j<i;j++){const a=audit.text[i],b=audit.text[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${width}/${panel} text overlap ${a.value}/${b.value}`);}
       }
       if(width===1440||width===390)await page.screenshot({path:path.join(output,`${panel}-focus-${width}.png`),fullPage:true});
     }
   }
 }
 assert.equal(await page.evaluate(()=>window.__gl.size),1,'one shared WebGL context across all sheets');
 const corners=await page.locator('button,summary,select,.panel,.scene-host').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).borderTopLeftRadius!=='0px').map(n=>n.className));assert.deepEqual(corners,[]);
 await page.setViewportSize({width:1440,height:1100});
 // Keyboard, history, source reset, old links, data-only Focus and CAD remain functional.
 await navigate('green-blue','trees');await page.locator('.scene-viewport').focus();const camera=await page.locator('.scene-viewport').getAttribute('data-camera-position');
 await page.keyboard.press('ArrowRight');await settle(page);assert.notEqual(await page.locator('.scene-viewport').getAttribute('data-camera-position'),camera);
 await page.keyboard.press('Home');await settle(page);await page.keyboard.press('Escape');await settle(page);assert.equal(await page.getAttribute('body','data-mode'),'overview');
 await page.locator('[data-panel-id="trees"] .explore').click();await settle(page);await page.click('#back-to-sheet');await page.goBack();await settle(page);assert.equal(await page.getAttribute('body','data-mode'),'focus');await page.goForward();await settle(page);
 await page.click('#sources-toggle');await page.reload();await page.waitForSelector('body[data-book-ready]');assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('sources-on')),false);
 for(const [old,target,sheet]of [['parking-area','parking-layout','parking'],['walking-connections','clear-route-continuity','connections'],['stormwater','ground','green-blue']]){await page.goto(base+`?mode=focus&panel=${old}#${sheet}`);await page.waitForSelector('body[data-book-ready]');assert.equal(await page.locator('.focused-panel').getAttribute('data-panel-id'),target);}
 await page.locator('.tools .open-cad').click();await page.check('input[value="ft"]');assert.equal(await page.locator('[data-cad="tram"]').getAttribute('href'),'downloads/tram-ft.dxf');await page.click('#close-cad');
 // No WebGL and file:// keep current diagrams, variants and selectable static categories.
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t.startsWith('webgl')?null:get.call(this,t,...args);};});
 await fallback.goto(base+'?mode=focus&panel=trees#green-blue');await fallback.waitForSelector('.scene-status:not([hidden])');assert.ok(await fallback.locator('.focused-panel .modern-poster:visible').count());await fallback.close();
 const offline=await browser.newPage();const offlineErrors=[];offline.on('pageerror',e=>offlineErrors.push(e.message));
 await offline.goto('file://'+file+'?mode=focus&panel=walking&layout-walking=2#walk-cycle');await offline.waitForSelector('body[data-book-ready]');assert.equal(await offline.locator('#walking-select').inputValue(),'2');assert.equal(await offline.locator('.focused-panel [data-variant]:not([hidden]) .modern-poster:visible').count(),1);
 await offline.goto('file://'+file+'?mode=focus&panel=parking-layout#parking');await offline.waitForSelector('body[data-book-ready]');await offline.locator('.focused-panel [data-poster-choice]').selectOption('1');assert.equal(await offline.locator('.focused-panel .poster-option:not([hidden])').getAttribute('data-poster-option'),'1');assert.deepEqual(offlineErrors,[]);await offline.close();
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base);assert.equal(await nojs.locator('.panel:visible').count(),30);assert.equal(await nojs.locator('canvas').count(),0);await nojs.close();
 // Fixed wall cards cannot straddle the 1600/3200 screen seams.
 await page.setViewportSize({width:4800,height:1000});
 for(const sheet of sheets){await navigate(sheet.id,null,{view:'wall'});const boxes=await page.locator('.sheet:not([hidden]) .panel').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,overflow:n.scrollHeight>n.clientHeight+2};}));for(const b of boxes){assert.equal(b.w,1600);assert.equal(b.h,1000);assert.ok([0,1600,3200].includes(b.x));assert.equal(b.overflow,false,`${sheet.id} wall content overflow`);}await page.screenshot({path:path.join(output,`${sheet.id}-wall.png`)});}
 // Print from Focus/desktop and Focus/wall, with Sources both off and on.
 const pdfs=[];
 for(const view of ['desktop','wall'])for(const sources of [false,true]){
   await page.setViewportSize({width:view==='wall'?4800:1440,height:1100});await navigate('green-blue','trees',{view});
   if(sources!==await page.locator('body').evaluate(n=>n.classList.contains('sources-on')))await page.click(view==='wall'?'#wall-sources':'#sources-toggle');
   await page.emulateMedia({media:'print'});await settle(page);await page.locator('img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode().catch(()=>{}))));
   const overflow=await page.locator('.panel').evaluateAll(ns=>ns.filter(n=>n.scrollHeight>n.clientHeight+3).map(n=>({id:n.dataset.panelId,client:n.clientHeight,scroll:n.scrollHeight})));assert.deepEqual(overflow,[],`${view}/${sources} print content overflow`);
   const target=path.join(output,`rulebook-${view}-${sources?'sources':'plain'}.pdf`);await page.pdf({path:target,preferCSSPageSize:true,printBackground:true});
   const info=execFileSync('pdfinfo',[target],{encoding:'utf8'});assert.match(info,/Pages:\s+11\b/);assert.match(info,/Page size:.*\(A3\)/);pdfs.push(path.basename(target));await page.emulateMedia({media:'screen'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failures,[]);
 const report={overviewStates,focusStates,widths:[320,390,768,1024,1440],panels:30,sheets:11,wall:'11 seam-safe spreads',pdfs,offline:'current poster / category / variant checks pass',noWebGL:'current posters',noJS:'30 panels visible',errors,external,failures};fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS '+JSON.stringify(report));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
