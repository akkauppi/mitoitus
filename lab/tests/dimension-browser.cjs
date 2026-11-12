const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();
 for(const width of [320,1440])for(const panel of ['ramps','arrival','trees']){
  await page.setViewportSize({width,height:1100});
  await page.goto(`http://127.0.0.1:8765/lab/book/?mode=focus&panel=${panel}#${panel==='trees'?'green-blue':'accessible'}`);
  await page.waitForFunction(panel=>document.querySelector('.scene-viewport')?.dataset.recipe===panel+'--v0',panel);
  const result=await page.evaluate(async()=>{
   const svg=document.querySelector('.scene-viewport svg'),intersects=(await import('./callouts.js')).segmentsIntersect;
   const texts=[...svg.querySelectorAll('text')].map(e=>e.getBBox());let crossed=0;
   for(const line of svg.querySelectorAll('line')){
    const a={x:Number(line.getAttribute('x1')),y:Number(line.getAttribute('y1'))},b={x:Number(line.getAttribute('x2')),y:Number(line.getAttribute('y2'))};
    for(const r of texts){const corners=[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
     if(corners.some((c,i)=>intersects(a,b,c,corners[(i+1)%4])))crossed++;
    }
   }
   return{patches:svg.querySelectorAll('rect.label-bg').length,halos:[...svg.querySelectorAll('.dim-label')].some(e=>getComputedStyle(e).stroke!=='none'),crossed,gaps:[...svg.querySelectorAll('.dimension-measure')].some(e=>e.querySelectorAll('line').length>=2)};
  });
  assert.equal(result.patches,0);assert.equal(result.halos,false);assert.equal(result.crossed,0,`${width}/${panel}: lines avoid text glyphs`);assert.ok(result.gaps);
 }
 console.log('PASS: six dimension views have transparent labels, actual line gaps and no line/text intersections.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
