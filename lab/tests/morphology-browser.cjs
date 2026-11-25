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

async function readDownload(page,button) {
  const promise = page.waitForEvent('download');
  await page.getByRole('button',{name:button,exact:true}).click();
  return JSON.parse(readFileSync(await (await promise).path(),'utf8'));
}

async function checkCapacityExchange(page) {
  const worksheet = page.locator('#capacity');
  const statuses = worksheet.locator('#capacity-import-status');
  const fileInput = worksheet.getByLabel('Load capacity JSON');
  const drawing = worksheet.locator('#capacity-drawing');
  const shape = drawing.locator('path.building');
  const height = drawing.locator('rect.building');
  const cell = (key,storeys) => worksheet.locator(`[data-capacity-value="${key}"][data-storeys="${storeys}"]`);
  const selected = worksheet.getByLabel('Draw alternative');
  const inputsJSON = worksheet.getByLabel('Configuration JSON');

  async function importFile(text) {
    await fileInput.setInputFiles({name:'capacity.json',mimeType:'application/json',buffer:Buffer.from(text)});
    await page.waitForFunction(()=>document.querySelector('#capacity input[type=file]').value==='');
  }

  for (const [label,value] of [
    ['Site width (m)','40'],['Site depth (m)','30'],['Target modelled floor area (m²)','2400'],
    ['Storey counts','4, 6, 8'],['Modelled storey height (m)','3'],
    ['Residential share (%)','80'],['Modelled residential m² per resident','40'],
  ]) await worksheet.getByLabel(label,{exact:true}).fill(value);
  await selected.selectOption('6');
  const exported = await readDownload(page,'Download capacity JSON');
  assert.match(exported.edition,/^2026-/);
  assert.equal(exported.selectedStoreys,6);
  assert.equal(exported.configuration.studyArea,1200);
  for (const [storeys,footprint,coverage] of [[4,'600','50%'],[6,'400','33.3333%'],[8,'300','25%']]) {
    assert.equal(await cell('footprintArea',storeys).textContent(),footprint);
    assert.equal(await cell('far',storeys).textContent(),'2');
    assert.equal(await cell('coverage',storeys).textContent(),coverage);
    assert.equal(await cell('populationEstimate',storeys).textContent(),'≈48');
  }
  const originalPlan = await shape.getAttribute('d');
  assert.equal(await height.getAttribute('height'),'18');

  const edited = JSON.parse(JSON.stringify(exported));
  edited.configuration.inputs.occupancy.areaPerResident = 32;
  await importFile(JSON.stringify(edited));
  assert.match(await statuses.textContent(),/Saved results differed/);
  assert.equal(await cell('populationEstimate',6).textContent(),'≈60');
  assert.equal(await shape.getAttribute('d'),originalPlan);
  assert.equal(await height.getAttribute('height'),'18');
  const updated = await readDownload(page,'Download capacity JSON');
  assert.deepEqual(updated.configuration.alternatives.map(item=>item.model),
    exported.configuration.alternatives.map(item=>item.model));
  await importFile(JSON.stringify(updated));
  assert.equal(await statuses.textContent(),'Configuration loaded.');

  await worksheet.getByText('Copy or paste inputs',{exact:true}).click();
  await worksheet.getByRole('button',{name:'Show input JSON'}).click();
  const compact = JSON.parse(await inputsJSON.inputValue());
  assert.deepEqual(compact.configuration,{inputs:updated.configuration.inputs});
  compact.configuration.inputs.siteWidth = 48;
  compact.configuration.inputs.storeyHeight = 3.5;
  await inputsJSON.fill(JSON.stringify(compact));
  await worksheet.getByRole('button',{name:'Load pasted JSON'}).click();
  assert.equal(await statuses.textContent(),'Configuration loaded.');
  assert.notEqual(await shape.getAttribute('d'),originalPlan);
  assert.equal(await height.getAttribute('height'),'21');
  assert.equal(await cell('far',6).textContent(),'1.6667');
  assert.equal(await cell('populationEstimate',6).textContent(),'≈60');

  const currentPlan = await shape.getAttribute('d');
  edited.configuration.inputs.occupancy.basis = 'net-dwelling-area';
  for (const [text,message] of [
    ['{',/Invalid JSON/],
    [JSON.stringify(edited),/modelled-residential-full-floor-plates occupancy basis/],
    [JSON.stringify({...compact,schemaVersion:'2.0.0'}),/Unsupported capacity format/],
  ]) {
    await importFile(text);
    assert.match(await statuses.textContent(),message);
    assert.equal(await shape.getAttribute('d'),currentPlan);
    assert.equal(await worksheet.getByLabel('Site width (m)').inputValue(),'48');
  }

  compact.configuration.inputs.siteWidth = 10;
  await importFile(JSON.stringify(compact));
  assert.equal(await cell('status',6).textContent(),'Exceeds site area');
  assert.equal(await cell('requiredFootprint',6).textContent(),'400');
  assert.equal(await shape.count(),0);
  await selected.selectOption('8');
  assert.equal(await cell('status',8).textContent(),'Fits by area');
  assert.equal(await shape.count(),1);

  const unknown = {...compact,selectedStoreys:null,configuration:{inputs:{siteWidth:null,storeys:null,occupancy:null}}};
  await importFile(JSON.stringify(unknown));
  assert.equal(await worksheet.getByLabel('Site depth (m)').inputValue(),'');
  assert.equal(await worksheet.getByLabel('Storey counts').inputValue(),'');
  assert.equal(await worksheet.getByLabel('Modelled residential m² per resident').inputValue(),'');
  assert.equal(await shape.count(),0);
  const incomplete = await readDownload(page,'Download capacity JSON');
  assert.deepEqual(Object.values(incomplete.configuration.inputs),Array(8).fill(null));
  assert.equal(incomplete.selectedStoreys,null);
}

(async()=>{
  execFileSync('python3',['-m','zipfile','-e',archive,directory]);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({javaScriptEnabled:false});
    const noScript = await context.newPage();
    await noScript.goto(base);
    await noScript.getByRole('link',{name:'Open data / AI agents'}).click();
    const formatHref = await noScript.getByRole('link',{name:'Capacity configuration format'}).getAttribute('href');
    const formatResponse = await noScript.request.get(new URL(formatHref,noScript.url()).href);
    assert.equal(formatResponse.status(),200);
    assert.match(await formatResponse.text(),/"referenceRevision": "residential-block-capacity\/r1"/);
    const exportPath = await noScript.getByRole('link',{name:'Synthetic geometry, formulas and results JSON'}).getAttribute('href');
    const fixtureResponse = await noScript.request.get(new URL(exportPath,noScript.url()).href);
    assert.match(fixtureResponse.headers()['content-type'],/application\/json/);
    const data = await fixtureResponse.json();
    assert.equal(data.fixtures.length,8);
    await noScript.getByRole('link',{name:'Residential block capacity exercise'}).click();
    assert.equal(new URL(noScript.url()).hash,'#capacity');
    assert.equal(await noScript.locator('#capacity-drawing path.building').count(),1);
    assert.ok(await noScript.locator('#capacity-parameters').isHidden());
    for (const [storeys,area] of [[2,'512'],[4,'256'],[8,'128']]) {
      assert.equal(await noScript.locator(`[data-capacity-value="footprintArea"][data-storeys="${storeys}"]`).textContent(),area);
      assert.equal(await noScript.locator(`[data-capacity-value="floorArea"][data-storeys="${storeys}"]`).textContent(),'1,024');
    }
    await noScript.getByText('Sources and assumptions',{exact:true}).click();
    assert.ok(await noScript.getByRole('link',{name:'far-coverage-storeys-identity/r1'}).isVisible());
    assert.equal(await noScript.locator('[data-value="footprint-area"]').textContent(),'896 m²');
    assert.equal(await noScript.locator('#observe details').count(),8);
    await noScript.getByText('Asymmetric street section',{exact:true}).click();
    assert.ok(await noScript.getByText('0.75',{exact:true}).isVisible());
    await context.close();

    const page = await browser.newPage({acceptDownloads:true,viewport:{width:320,height:900}});
    const errors = [];
    const network = [];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if (/^https?:/.test(request.url())) network.push(request.url());});
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
      const record = await readDownload(page,'Download configuration JSON');
      assert.equal(record.form,'open');
      assert.equal(record.parameters.depth,10);
      assert.equal(record.exchange.kind,'synthetic');
      assert.equal(record.exchange.observations.find(row=>row.id==='study.footprint-area').value,840);
      await page.getByRole('button',{name:'Reset'}).click();
      assert.equal(await footprint.textContent(),'896 m²');

      const drawing = page.locator('#capacity-drawing');
      const shape = drawing.locator('path.building');
      const drawnAlternative = page.getByLabel('Draw alternative');
      const target = page.getByLabel('Target modelled floor area');
      const occupancy = page.getByLabel('Modelled residential m² per resident');
      const cell = (key,storeys) => page.locator(`[data-capacity-value="${key}"][data-storeys="${storeys}"]`);
      const fourStoreyPlan = await shape.getAttribute('d');
      await drawnAlternative.selectOption('2');
      assert.notEqual(await shape.getAttribute('d'),fourStoreyPlan);
      assert.equal(await drawing.locator('path.floor').count(),1);
      await occupancy.fill('');
      assert.equal(await cell('populationEstimate',2).textContent(),'—');
      const incomplete = await readDownload(page,'Download capacity JSON');
      assert.equal(incomplete.referenceRevision,'residential-block-capacity/r1');
      assert.equal(incomplete.selectedStoreys,2);
      assert.equal(incomplete.configuration.inputs.occupancy.areaPerResident,null);
      assert.equal(incomplete.configuration.alternatives[0].populationStatus,'missing-occupancy');
      assert.equal(incomplete.configuration.alternatives[0].results.populationEstimate,null);
      assert.equal(incomplete.configuration.revision,undefined);
      await target.fill('2304');
      assert.equal(await cell('status',2).textContent(),'Exceeds site area');
      assert.equal(await cell('requiredFootprint',2).textContent(),'1,152');
      assert.equal(await shape.count(),0);
      await drawnAlternative.selectOption('4');
      assert.equal(await shape.count(),1);
      assert.equal(await cell('far',4).textContent(),'2.25');
      await page.getByLabel('Residential share (%)').fill('50');
      await occupancy.fill('32');
      assert.equal(await cell('populationEstimate',4).textContent(),'≈36');
      assert.ok(await page.locator('#capacity-comparison').evaluate(region=>region.scrollWidth<=region.clientWidth));
      const custom = await readDownload(page,'Download capacity JSON');
      assert.equal(custom.selectedStoreys,4);
      assert.equal(custom.configuration.status,'synthetic');
      assert.equal(custom.configuration.alternatives[1].results.footprintArea,576);
      assert.equal(custom.configuration.alternatives[1].results.residentialFloorArea,1152);
      assert.equal(custom.configuration.alternatives[1].results.populationEstimate,36);
      assert.ok(custom.configuration.assertionRevisionIds.includes('far-coverage-storeys-identity/r1'));
      await occupancy.fill('0');
      assert.ok(await page.getByRole('button',{name:'Download capacity JSON'}).isDisabled());
      const requestsBeforeExchange = network.length;
      await checkCapacityExchange(page);
      assert.equal(network.length,requestsBeforeExchange);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: static defaults and catalogue discovery; capacity file and paste round trips, stale results, errors, unknowns, area fit, and 320px layout over HTTP and extracted file://.');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;})
  .finally(()=>rmSync(directory,{recursive:true,force:true}));
