const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));let states=0;
 for(const style of ['paper','ink','soft']){
  await page.goto(`http://127.0.0.1:8765/lab/book/?mode=focus&panel=bus-turn&layout-bus-layout=1&camera=iso&style=${style}#turning-vehicles`);
  await page.waitForSelector('.scene-viewport[data-recipe="bus-turn--v1"]');
  await page.locator('.scene-viewport').focus();
  for(let angle=0;angle<6;angle++){
   for(let step=0;step<4;step++)await page.keyboard.press('ArrowRight');
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   assert.equal(await page.locator('.scene-status:visible').count(),0);assert.equal(await page.locator('.scene-viewport').getAttribute('data-scene-ready'),'true');states++;
   if(angle===2||angle===5)await page.screenshot({path:path.join(__dirname,`../review/bus-${style}-orbit-${angle}.png`),fullPage:true});
  }
 }
 await page.setViewportSize({width:390,height:1100});await page.goto('http://127.0.0.1:8765/lab/book/?mode=focus&panel=bus-turn&layout-bus-layout=1&camera=iso#turning-vehicles');await page.waitForSelector('.scene-viewport[data-recipe="bus-turn--v1"]');await page.screenshot({path:path.join(__dirname,'../review/bus-refined-phone.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);console.log(`PASS: ${states} bus orbit/style states and phone render. Flicker protection is checked structurally in vehicles.test.mjs; these captures support visual review.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
