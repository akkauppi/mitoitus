/* Real CDP touch events; 200% reflow equivalent, not physical browser zoom. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || '/home/antti/cityscape-cam/node_modules/playwright');
const base = process.env.BOOK_URL || 'http://127.0.0.1:8765/lab/book/';
const output = path.resolve(__dirname, '../review/release');
fs.mkdirSync(output, {recursive: true});
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const sceneReady = page => page.waitForFunction(() => document.querySelector('.scene-viewport')?.dataset.sceneReady === 'true');
const sceneState = page => page.locator('.scene-viewport').evaluate(node => ({
  position: JSON.parse(node.dataset.cameraPosition), frame: JSON.parse(node.dataset.comparisonFrame), scroll: scrollY,
}));
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));

(async () => {
  const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const mobile = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  const page = await mobile.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '?mode=focus&panel=trees&camera=iso#green-blue');
  await sceneReady(page);
  assert.ok(await page.evaluate(() => navigator.maxTouchPoints > 0));
  const cdp = await mobile.newCDPSession(page);
  async function centreCanvas() {
    await page.locator('.scene-viewport canvas').evaluate(node => node.scrollIntoView({block: 'center'}));
    await settle(page);
    const box = await page.locator('.scene-viewport canvas').boundingBox();
    return {x: box.x + box.width / 2, y: box.y + box.height / 2};
  }
  async function gesture(points, movement) {
    const point = (start, index, fraction) => ({id: index + 1, radiusX: 3, radiusY: 3, force: 1,
      x: start.x + movement[index].x * fraction, y: start.y + movement[index].y * fraction});
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: points.map((p, i) => point(p, i, 0))});
    for (let step = 1; step <= 12; step++) {
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: points.map((p, i) => point(p, i, step / 12))});
      await page.waitForTimeout(24);
    }
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await page.waitForTimeout(250);
    await settle(page);
  }
  let centre = await centreCanvas(), before = await sceneState(page);
  await gesture([{x: centre.x, y: centre.y + 70}], [{x: 0, y: -180}]);
  const single = await sceneState(page);
  assert.ok(single.scroll - before.scroll > 60, 'one finger must scroll the page through the canvas');
  assert.ok(distance(single.position, before.position) < 1e-6, 'one finger must not orbit the camera');
  assert.ok(Math.abs(single.frame[4] - before.frame[4]) < 1e-6, 'one finger must not zoom the model');
  const singleDelta = single.scroll - before.scroll;
  centre = await centreCanvas(); before = await sceneState(page);
  await gesture([{x: centre.x - 40, y: centre.y}, {x: centre.x + 40, y: centre.y}], [{x: -25, y: 0}, {x: 25, y: 0}]);
  const pinch = await sceneState(page);
  assert.ok(pinch.frame[4] > before.frame[4] + .1, 'two-finger spread must zoom the model');
  assert.ok(Math.abs(pinch.scroll - before.scroll) < 3, 'two-finger spread must not scroll the page');
  assert.equal(await page.evaluate(() => visualViewport.scale), 1, 'gesture zoom belongs to model, not viewport');
  const pinchZoom = [before.frame[4], pinch.frame[4]];
  centre = await centreCanvas(); before = await sceneState(page);
  await gesture([{x: centre.x - 40, y: centre.y}, {x: centre.x + 40, y: centre.y}], [{x: 45, y: 0}, {x: 45, y: 0}]);
  const orbit = await sceneState(page);
  assert.ok(distance(orbit.position, before.position) > 1, 'two-finger horizontal drag must orbit the model');
  assert.ok(Math.abs(orbit.scroll - before.scroll) < 3, 'two-finger horizontal drag must not scroll the page');
  await page.screenshot({path: path.join(output, 'touch-emulation.png'), fullPage: true});
  await mobile.close();

  // A 1440 × 1100 physical display at 200% has a 720 × 550 CSS layout viewport.
  // DPR 2 supplies the corresponding raster density. This is reflow equivalence,
  // not a claim to have changed the browser's own zoom menu or used real hardware.
  const reflow = await browser.newContext({viewport: {width: 720, height: 550}, deviceScaleFactor: 2});
  const review = await reflow.newPage();
  review.on('pageerror', error => errors.push(error.message));
  await review.goto(base); await review.waitForSelector('body[data-book-ready]');
  assert.deepEqual(await review.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]), [720, 550, 2]);
  const sheets = await review.locator('.sheet').evaluateAll(nodes => nodes.map(node => node.id));
  const checked = [];
  for (const sheet of sheets) {
    await review.goto(base + '?mode=overview#' + sheet);
    await review.waitForSelector('body[data-book-ready]'); await settle(review);
    assert.equal(await review.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, sheet + ' reflow overflow');
    checked.push(sheet + '/overview');
  }
  for (const [sheet, panel] of [['land-population', 'services'], ['land-population', 'density'], ['green-blue', 'trees'], ['section-details', 'steps']]) {
    await review.goto(base + `?mode=focus&panel=${panel}#${sheet}`);
    await review.waitForSelector('body[data-book-ready]');
    if (['trees', 'steps'].includes(panel)) await sceneReady(review);
    await settle(review);
    assert.equal(await review.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, panel + ' reflow overflow');
    const outside = await review.locator('.focused-panel table,.focused-panel .scene-host').evaluateAll(nodes => nodes.filter(node => {
      const rect = node.getBoundingClientRect(); return rect.left < 0 || rect.right > innerWidth;
    }).length);
    assert.equal(outside, 0, panel + ' content must stay within reflow viewport');
    if (panel === 'services') assert.equal(await review.locator('.focused-panel [data-service-row]').count(), 12);
    await review.screenshot({path: path.join(output, `reflow-equivalent-200-${panel}.png`), fullPage: true});
    checked.push(panel + '/focus');
  }
  assert.deepEqual(errors, []);
  const manifest = path.resolve(__dirname, '../book/parity.json');
  const report = {
    browser: browser.version(), candidateManifestSha256: crypto.createHash('sha256').update(fs.readFileSync(manifest)).digest('hex'),
    touch: {method: 'Chromium mobile hasTouch emulation with CDP Input.dispatchTouchEvent', oneFingerPageScrollPx: singleDelta,
      oneFingerCameraUnchanged: true, twoFingerZoom: pinchZoom, twoFingerOrbit: true, modelZoomNotViewportZoom: true},
    reflow: {description: '200% reflow equivalent for a 1440 × 1100 physical display', cssViewport: [720, 550], deviceScaleFactor: 2, states: checked},
    limitations: ['Hardware touch not tested', 'Browser zoom-menu behavior not tested; reflow equivalent only'], errors,
  };
  fs.writeFileSync(path.join(output, 'interaction-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('PASS ' + JSON.stringify(report));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
