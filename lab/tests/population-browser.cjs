const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || '/home/antti/cityscape-cam/node_modules/playwright');
const base = process.env.POPULATION_BASE_URL || 'http://127.0.0.1:8765/lab/book/';
const output = process.env.POPULATION_REVIEW_DIR || '/tmp/mitoitus-population-release';
const data = JSON.parse(fs.readFileSync('lab/data/release-data.json', 'utf8'));
fs.mkdirSync(output, {recursive: true});

(async () => {
  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  let states = 0;
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 1000});
    for (const panel of ['density', 'green-hierarchy', 'services']) {
      await page.goto(base + `?mode=focus&panel=${panel}&camera=iso&keep=yes#land-population`);
      await page.waitForSelector('body[data-book-ready]');
      const active = page.locator('.focused-panel');
      assert.equal(await page.locator('canvas').count(), 0);
      assert.equal(await page.locator('.scene-host:visible').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('body').getAttribute('data-camera'), 'plan');
      assert.equal(await active.locator('[data-legacy-visual]').count(), 0);
      assert.equal(new URL(page.url()).searchParams.get('keep'), 'yes');
      if (panel === 'green-hierarchy') {
        assert.equal(await active.locator('.drawing svg').count(), 1);
        assert.equal(await active.locator('.distance-leader').count(), 0);
        assert.equal(await active.locator('[data-distance-tag]').count(), 3);
        assert.equal(await active.locator('[data-distance-key]').count(), 3);
        const ratios = await active.locator('[data-distance-metres]').evaluateAll(nodes =>
          nodes.map(node => node.getBoundingClientRect().width / Number(node.dataset.distanceMetres)));
        assert.ok(ratios.every(value => Math.abs(value - ratios[0]) < 1e-6));
        assert.equal(await active.locator('.specs>div').count(), 8);
        const texts = await active.locator('.drawing svg').evaluate(node => {
          const outer = node.getBoundingClientRect();
          return [...node.querySelectorAll('text')].map(text => {
            const box = text.getBoundingClientRect();
            return {text: text.textContent, x: box.x - outer.x, y: box.y - outer.y,
              w: box.width, h: box.height, width: outer.width, height: outer.height};
          });
        });
        for (const text of texts) assert.ok(text.x >= -1 && text.y >= -1 &&
          text.x + text.w <= text.width + 1 && text.y + text.h <= text.height + 1,
          `${width}/${panel}: clipped ${text.text}`);
        for (let i = 0; i < texts.length; i++) for (let j = 0; j < i; j++) {
          const a = texts[i], b = texts[j];
          assert.ok(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y),
            `${width}/${panel}: overlapping ${a.text}/${b.text}`);
        }
      } else {
        assert.equal(await active.locator('.drawing,svg').count(), 0);
        assert.equal(await active.locator('table').count(), panel === 'density' ? 2 : 3);
        const overflow = await active.locator('table').evaluateAll(nodes => nodes.filter(node => {
          const table = node.getBoundingClientRect(), panel = node.closest('article').getBoundingClientRect();
          return table.left < panel.left || table.right > panel.right || node.scrollWidth > node.clientWidth + 1;
        }).length);
        assert.equal(overflow, 0, `${width}/${panel}: table overflow`);
      }
      if (panel === 'density') {
        assert.deepEqual(await active.locator('.resident-density-table tbody td').allTextContents(), ['~30', '~50', '~75', '~100']);
        assert.equal(await active.locator('.density-table tbody tr').count(), 4);
      }
      if (panel === 'services') {
        assert.equal(await active.locator('[data-service-row]').count(), 12);
        for (const row of data.serviceRows) {
          const rendered = active.locator(`[data-service-row="${row.id}"]`);
          assert.equal(await rendered.getAttribute('data-source-id'), row.source);
          for (const text of [row.label, row.value, row.basis, row.context])
            assert.ok((await rendered.innerText()).includes(text), `${width}: ${row.id} missing ${text}`);
        }
        const visible = await active.innerText();
        assert.ok(!visible.includes('2,000 additional residents'));
        assert.ok(!visible.includes('20,000 residents'));
        assert.ok(visible.includes('Huoneistoala here excludes kitchens and technical rooms'));
      }
      if ([390, 1440].includes(width)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({path: path.join(output, `${panel}-${width}.png`), fullPage: true});
      }
      states++;
    }
  }
  await page.click('#sources-toggle');
  assert.equal(await page.locator('.focused-panel .service-provenance:visible').count(), 1);
  const sourceText = await page.locator('.focused-panel .service-provenance').innerText();
  for (const term of ['2,000 additional residents', '20,000 residents', 'nearby schools already full'])
    assert.ok(sourceText.includes(term), term);
  await page.reload();
  assert.equal(await page.locator('body.sources-on').count(), 0);
  for (const panel of ['density', 'services']) {
    await page.goto(base + '?mode=overview#land-population');
    await page.waitForSelector('body[data-book-ready]');
    await page.locator(`[data-panel-id="${panel}"] .explore`).click();
    assert.equal(await page.locator('.focused-panel h2').evaluate(node => node === document.activeElement), true);
    await page.click('#back-to-sheet');
    assert.equal(await page.locator('#land-population .panel:visible').count(), 3);
  }
  await page.goto(base + 'evidence.html#services-release');
  assert.equal(await page.locator('#services-release').count(), 1);
  for (const row of data.serviceRows) assert.equal(await page.locator(`#services-release #${row.id}`).count(), 1);
  assert.equal(await page.locator('#services-release a[href="data/release-data.json"]').count(), 1);
  const served = await (await page.request.get(base + 'data/release-data.json')).json();
  assert.deepEqual(served, data);
  const nojs = await browser.newPage({javaScriptEnabled: false});
  await nojs.goto(base + '#land-population');
  assert.equal(await nojs.locator('.resident-density-table tbody tr').count(), 4);
  assert.equal(await nojs.locator('[data-service-row]').count(), 12);
  assert.equal(await nojs.locator('.distance-circles').count(), 1);
  await nojs.close();
  await page.goto('file://' + path.resolve('lab/book/index.html') + '?mode=focus&panel=services#land-population');
  await page.waitForSelector('body[data-book-ready]');
  assert.equal(await page.locator('.focused-panel [data-service-row]').count(), 12);
  assert.deepEqual(errors, []);
  assert.ok(!requests.some(url => url.includes('/vendor/') || url.includes('book-3d.js')), 'no unnecessary 3D imports');
  const origin = new URL(base).origin;
  assert.ok(!requests.some(url => /^https?:/.test(url) && !url.startsWith(origin + '/')), 'no remote runtime requests');
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({states, checks: [
    '12 sourced service rows and precise denominators', 'density and original FAR tables',
    'data-only density/services', 'numbered green distances at one scale',
    'responsive tables and labels', 'historical cases under Sources',
    'supplemental evidence and public JSON', 'Explore focus and navigation',
    'direct-file and no-JS fallback', 'no WebGL or remote imports'
  ]}, null, 2));
  console.log(`PASS: ${states} population/service viewport states; content, sources, focus and fallbacks.`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
