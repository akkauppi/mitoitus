const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || '/home/antti/cityscape-cam/node_modules/playwright');
const inventory = JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/scene-inventory.json')));
const base = process.env.BOOK_URL || 'http://127.0.0.1:8765/lab/book/';
const out = path.join(__dirname,'../review'); fs.mkdirSync(out,{recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:8765/')) external.push(request.url()); });
  const go = async suffix => { await page.goto(base+suffix); await page.waitForSelector('body[data-book-ready="true"]',{state:'attached'}); };
  const settle = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const fits = async label => {
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,label);
  };
  await go('');
  assert.equal(await page.locator('.sheet').count(),11);
  assert.equal(await page.locator('.panel').count(),33);
  assert.equal(await page.locator('.drawing svg').count(),44);
  // The shell adds controls outside canonical details. Preserve the actual DOM text/markup.
  const details = await page.locator('.panel .details').evaluateAll(nodes => Object.fromEntries(nodes.map(n=>[n.closest('.panel').querySelector('.proof').getAttribute('href'),n.closest('.panel').querySelector('.retained-reference')?.innerHTML||n.innerHTML])));
  const baseline = await browser.newPage(); await baseline.goto('http://127.0.0.1:8765/');
  assert.deepEqual(details,await baseline.locator('.panel .details').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.closest('.panel').querySelector('.proof').getAttribute('href'),n.closest('.panel').querySelector('.retained-reference')?.innerHTML||n.innerHTML]))));
  await baseline.close();
  let states = 0;
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:1000});
    for (const sheet of inventory.sheets) {
      await go(`?keep=sentinel#${sheet.id}`);
      await fits(`${width}/${sheet.id}/overview`);
      assert.equal(await page.locator('.sheet:not([hidden]) .panel:visible').count(),3);
      assert.equal(await page.locator('.tabs [aria-current="page"]').getAttribute('href'),'#'+sheet.id);
      const tab = await page.locator('.tabs [aria-current="page"]').boundingBox();
      assert.ok(tab.x>=0 && tab.x+tab.width<=width+1,`active sheet tab revealed ${width}/${sheet.id}: ${JSON.stringify(tab)}`);
      await page.locator('.sheet:not([hidden]) .explore').first().click();
      await fits(`${width}/${sheet.id}/focus`);
      assert.equal(await page.locator('.sheet:not([hidden]) .panel:visible').count(),1);
      assert.equal(await page.locator('.focused-panel .details').count(),1);
      assert.ok(new URL(page.url()).searchParams.get('keep')==='sentinel');
      await page.click('#back-to-sheet'); await settle();
      assert.equal(await page.locator('.explore:focus').count(),1);
      states+=2;
    }
    await go('?mode=focus&panel=trees#green-blue');
    await page.screenshot({path:path.join(out,`shell-focus-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  for (const sheet of inventory.sheets) for (const panel of sheet.panels) {
    await go(`?mode=focus&panel=${panel.id}&keep=yes#${sheet.id}`);
    assert.equal(await page.locator('.focused-panel').getAttribute('data-panel-id'),panel.id);
    await fits(`panel/${panel.id}`);
  }
  for (const [group,count,sheet,panel] of [['walking',4,'walk-cycle','walking'],['cycling',5,'walk-cycle','cycling'],['car-layout',3,'turning-vehicles','car-turn'],['bus-layout',3,'turning-vehicles','bus-turn']]) {
    for (let i=0;i<count;i++) {
      await go(`?mode=focus&panel=${panel}&layout-${group}=${i}&keep=yes#${sheet}`);
      assert.equal(await page.locator(`[data-variant-group="${group}"] select`).inputValue(),String(i));
      assert.equal(await page.locator(`[data-variant-group="${group}"] [data-variant]:not([hidden])`).getAttribute('data-variant'),String(i));
      await page.reload(); await page.waitForSelector('body[data-book-ready]');
      assert.equal(await page.locator(`[data-variant-group="${group}"] select`).inputValue(),String(i));
    }
  }
  await go('?mode=focus&panel=walking&figure=wrong&camera=bad&style=bad&keep=yes#walk-cycle');
  assert.equal(await page.getAttribute('body','data-camera'),'iso');
  assert.equal(new URL(page.url()).searchParams.get('figure'),'walking--v0');
  await page.selectOption('#walking-select','2');
  assert.equal(new URL(page.url()).searchParams.get('figure'),'walking--v2');
  await page.locator('.focused-panel .drawing').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(new URL(page.url()).hash,'#walk-cycle');
  await page.keyboard.press('Escape'); await settle();
  assert.equal(await page.locator('.explore:focus').count(),1);
  await page.locator('#book-title').click(); await page.keyboard.press('ArrowRight');
  await page.waitForURL('**#accessible');
  for (const [alias,target] of [['transit-access','tram'],['fit-street','section-details'],['section-scale','section-details']]) {
    await go('#'+alias); assert.equal(await page.locator('.sheet:not([hidden])').getAttribute('id'),target);
  }
  await go('?mode=focus&panel=trees&figure=trees--v0&camera=front&style=ink&layout-walking=3&keep=yes#green-blue');
  assert.equal(await page.getAttribute('body','data-style'),'ink');
  await page.click('#sources-toggle'); assert.ok(await page.locator('body').evaluate(b=>b.classList.contains('sources-on')));
  await page.reload(); await page.waitForSelector('body[data-book-ready]');
  assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('sources-on')),false);
  await page.click('#back-to-sheet'); await page.goBack(); await settle();
  assert.equal(await page.getAttribute('body','data-mode'),'focus');
  await page.goForward(); await settle(); assert.equal(await page.getAttribute('body','data-mode'),'overview');
  await page.locator('.tools .open-cad').click(); await page.check('input[value="mm"]');
  assert.equal(await page.locator('[data-cad="tram"]').getAttribute('href'),'downloads/tram-mm.dxf');
  await page.click('#close-cad');
  await page.locator('.book-menu summary').filter({hasText:'Downloads'}).click();
  assert.equal(await page.locator('.book-menu a[download]').getAttribute('href'),'downloads/rulebook-offline.zip');
  await page.keyboard.press('Escape');
  await go('?mode=focus&panel=trees&view=wall#green-blue'); assert.ok(await page.locator('body').evaluate(b=>b.classList.contains('wall')));
  await page.click('#wall-exit'); assert.equal(new URL(page.url()).searchParams.get('view'),'desktop');
  await page.setViewportSize({width:390,height:800});
  await go('#walk-cycle');
  const launch = page.locator('[data-panel-id="cycling"] .explore');
  await launch.scrollIntoViewIfNeeded();
  const savedScroll = await page.evaluate(()=>scrollY);
  await launch.click(); await page.click('#back-to-sheet'); await settle();
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-savedScroll)<3,'overview scroll restored');
  assert.equal(await page.locator('[data-panel-id="cycling"] .explore:focus').count(),1);
  // No-JS and file:// both retain the complete reference, with no WebGL dependency.
  const nojs = await browser.newPage({javaScriptEnabled:false}); await nojs.goto(base);
  assert.equal(await nojs.locator('.panel:visible').count(),33); await nojs.close();
  const file = await browser.newPage(); const fileErrors=[];file.on('pageerror',e=>fileErrors.push(e.message));
  await file.goto('file://'+path.resolve(__dirname,'../book/index.html')+'?mode=focus&panel=walking&layout-walking=1#walk-cycle');
  await file.waitForSelector('body[data-book-ready]');assert.equal(await file.locator('#walking-select').inputValue(),'1');
  await file.click('#back-to-sheet');assert.equal(await file.getAttribute('body','data-mode'),'overview');
  assert.deepEqual(fileErrors,[]);await file.close();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  fs.writeFileSync(path.join(out,'shell-results.json'),JSON.stringify({responsiveStates:states,focusedPanels:33,variants:15,widths:[320,390,768,1024,1440],errors,external,fileFallback:'passed',noJS:'33 panels visible'},null,2));
  console.log(`PASS: ${states} responsive states; 33 focused panels; 15 variants; content parity; URL/history/keyboard/CAD; no-JS and file fallback.`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
