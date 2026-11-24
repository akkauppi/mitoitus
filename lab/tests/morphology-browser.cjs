const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {mkdtempSync,readFileSync,rmSync} = require('node:fs');
const {tmpdir} = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE||'/home/antti/cityscape-cam/node_modules/playwright');

const base = process.env.BOOK_URL||'http://127.0.0.1:8767/';
const archive = path.resolve(__dirname,'../.build/release/downloads/rulebook-offline.zip');
const directory = mkdtempSync(path.join(tmpdir(),'dubious-morphology-'));

(async()=>{
  execFileSync('python3',['-m','zipfile','-e',archive,directory]);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({javaScriptEnabled:false});
    const noScript = await context.newPage();
    await noScript.goto(base);
    await noScript.getByRole('link',{name:'Open data / AI agents'}).click();
    const exportPath = await noScript.getByRole('link',{name:'Synthetic geometry, formulas and results JSON'}).getAttribute('href');
    const fixtureResponse = await noScript.request.get(new URL(exportPath,noScript.url()).href);
    assert.match(fixtureResponse.headers()['content-type'],/application\/json/);
    const data = await fixtureResponse.json();
    assert.equal(data.fixtures.length,8);
    await noScript.getByRole('link',{name:'Morphology laboratory',exact:true}).click();
    assert.equal(await noScript.locator('[data-value="footprint-area"]').textContent(),'896 m²');
    assert.equal(await noScript.locator('details').count(),8);
    await noScript.getByText('Asymmetric street section',{exact:true}).click();
    assert.ok(await noScript.getByText('0.75',{exact:true}).isVisible());
    await context.close();

    const page = await browser.newPage({acceptDownloads:true,viewport:{width:320,height:900}});
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    for (const url of [new URL('morphology/index.html',base).href,
        pathToFileURL(path.join(directory,'morphology/index.html')).href]) {
      await page.goto(url);
      await page.locator('#depth').waitFor();
      const footprint = page.locator('[data-value="footprint-area"]');
      const area = page.locator('[data-value="floor-area"]');
      const before = await page.locator('#plan path.building').getAttribute('d');
      assert.equal(await footprint.textContent(),'896 m²');
      await page.locator('#depth').fill('10');
      assert.notEqual(await page.locator('#plan path.building').getAttribute('d'),before);
      assert.equal(await footprint.textContent(),'1,040 m²');
      assert.equal(await area.textContent(),'4,160 m²');
      await page.getByLabel('Block type').selectOption('open');
      assert.equal(await page.locator('[data-value="spatial-enclosure"]').textContent(),'68.75%');
      const promise = page.waitForEvent('download');
      await page.getByRole('button',{name:'Download configuration JSON'}).click();
      const download = await promise;
      const record = JSON.parse(readFileSync(await download.path(),'utf8'));
      assert.equal(record.form,'open');
      assert.equal(record.parameters.depth,10);
      assert.equal(record.exchange.kind,'synthetic');
      assert.equal(record.exchange.observations.find(row=>row.id==='study.footprint-area').value,840);
      await page.getByRole('button',{name:'Reset'}).click();
      assert.equal(await footprint.textContent(),'896 m²');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: homepage-only discovery and eight static fixtures with JS disabled; interactive plan, ratios, download, reset and 320px layout over HTTP and extracted file://.');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;})
  .finally(()=>rmSync(directory,{recursive:true,force:true}));
