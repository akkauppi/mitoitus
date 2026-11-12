const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
const order=['built-form','land-population','walk-cycle','accessible','connections','tram','turning-vehicles','parking','section-details','green-blue','stormwater-options'];
(async()=>{const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/lab/book/?keep=order#built-form');
 assert.deepEqual(await page.locator('.sheet').evaluateAll(ns=>ns.map(n=>n.id)),order);
 assert.deepEqual(await page.locator('.tabs a').evaluateAll(ns=>ns.map(n=>n.hash.slice(1))),order);
 for(let i=0;i<order.length;i++){
  await page.locator(`.tabs a[href="#${order[i]}"]`).click();await page.waitForFunction(id=>document.querySelector('.sheet:not([hidden])')?.id===id,order[i]);
  assert.equal((await page.locator('#book-count').textContent()).trim(),`${String(i+1).padStart(2,'0')} / 11`);
  assert.equal(await page.locator('.tabs [aria-current="page"]').getAttribute('href'),'#'+order[i]);
  for(const text of await page.locator(`#${order[i]} .panel-top>span`).allTextContents())assert.ok(text.startsWith(String(i+1).padStart(2,'0')+' /'));
  if(i<order.length-1){await page.click('#book-next');await page.waitForFunction(id=>location.hash==='#'+id,order[i+1]);}
 }
 await page.keyboard.press('5');await page.waitForFunction(()=>location.hash==='#connections');
 await page.click('#book-previous');await page.waitForFunction(()=>location.hash==='#accessible');await page.goBack();await page.waitForFunction(()=>document.querySelector('.sheet:not([hidden])')?.id==='connections');
 for(const [alias,id]of [['transit-access','tram'],['fit-street','section-details'],['section-scale','section-details']]){await page.goto('http://127.0.0.1:8765/lab/book/?keep=order#'+alias);assert.equal(await page.locator('.sheet:not([hidden])').getAttribute('id'),id);}
 await page.goto('file:///home/antti/mitoitus-diorama/lab/book/index.html#connections');assert.deepEqual(await page.locator('.sheet').evaluateAll(ns=>ns.map(n=>n.id)),order);assert.equal(await page.locator('#book-count').textContent(),'05 / 11');assert.equal(await page.locator('#connections figure:visible').count(),3);
 const staticPage=await browser.newPage({javaScriptEnabled:false});await staticPage.goto('http://127.0.0.1:8765/lab/book/');assert.deepEqual(await staticPage.locator('.sheet').evaluateAll(ns=>ns.map(n=>n.id)),order);assert.deepEqual(await staticPage.locator('.tabs a').evaluateAll(ns=>ns.map(n=>n.hash.slice(1))),order);await staticPage.close();
 assert.deepEqual(errors,[]);console.log('PASS: approved 11-spread DOM/tab order, numbering, navigation, keyboard, history, aliases and direct-file fallback.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
