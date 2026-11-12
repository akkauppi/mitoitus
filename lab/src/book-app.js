/* T02 progressive shell. Classic script keeps direct-file use working.
 * Baseline app.js continues to own source/CAD/variant behavior. */
(() => {
  'use strict';
  const all = selector => [...document.querySelectorAll(selector)];
  const panels = all('.panel');
  const records = panels.map(panel => ({
    panel,
    id: panel.querySelector('.proof').getAttribute('href').split('#')[1],
    sheet: panel.closest('.sheet'),
    title: panel.querySelector('h2').textContent,
    count: panel.querySelectorAll('.drawing svg').length,
  }));
  const byId = new Map(records.map(record => [record.id, record]));
  const header = document.createElement('div');
  header.className = 'book-heading';
  header.innerHTML = '<div><button id="back-to-sheet" hidden>← Back to sheet</button><h1 id="book-title"></h1><span id="book-count"></span></div><div class="book-modes"><button id="book-previous" aria-label="Previous sheet">←</button><button id="book-next" aria-label="Next sheet">→</button><button id="book-overview" aria-pressed="true">Overview</button><button id="book-focus" aria-pressed="false">Focus</button></div>';
  document.querySelector('main').prepend(header);
  const panelNav = document.createElement('nav');
  panelNav.className = 'panel-selector';
  panelNav.setAttribute('aria-label', 'Panels in this sheet');
  header.after(panelNav);
  const tools = document.querySelector('.tools');
  const downloads = document.createElement('details');
  downloads.className = 'book-menu';
  downloads.innerHTML = '<summary>Downloads</summary><div><button class="book-cad">CAD reference files</button><a href="downloads/rulebook-offline.zip" download>Offline sheets + CAD ↓</a><a href="evidence.html">Evidence index ↗</a></div>';
  tools.append(downloads);
  downloads.querySelector('button').onclick = () => { downloads.open = false; openCAD(); };
  const view = document.createElement('details');
  view.className = 'book-menu';
  view.innerHTML = '<summary>View</summary><div><button id="book-view">3-screen view</button><button id="book-fullscreen">Fullscreen</button><label hidden>Drawing style<select id="book-style"><option value="paper">Paper model</option><option value="ink">Contour drawing</option><option value="soft">Pastel relief</option></select></label></div>';
  tools.append(view);
  const print = document.createElement('button');
  print.textContent = 'Print'; print.onclick = () => window.print(); tools.append(print);
  $('book-fullscreen').onclick = full;
  $('book-view').onclick = () => { setView(document.body.classList.contains('wall') ? 'desktop' : 'wall'); view.open = false; render(); };
  let origin = null;
  let current = null;
  const aliases = { 'transit-access': 'tram', 'fit-street': 'section-details', 'section-scale': 'section-details' };

  function resolve() {
    const url = new URL(location.href), q = url.searchParams;
    const wanted = aliases[url.hash.slice(1)] || url.hash.slice(1);
    const sheet = sheets.find(s => s.id === wanted) || sheets[0];
    const record = byId.get(q.get('panel'));
    const active = record?.sheet === sheet ? record : records.find(r => r.sheet === sheet);
    const group = active.panel.querySelector('[data-variant-group]');
    const selected = group ? group.querySelector('select').selectedIndex : 0;
    // A legacy variant is authoritative; T02 has only its corresponding whole figure.
    const figure = `${active.id}--v${selected}`;
    const camera = ['iso', 'plan', 'front', 'section'].includes(q.get('camera')) ? q.get('camera') : 'plan';
    const style = ['paper', 'ink', 'soft'].includes(q.get('style')) ? q.get('style') : 'paper';
    return { sheet, active, figure, camera, style, mode: q.get('mode') === 'focus' ? 'focus' : 'overview' };
  }
  function navigate(changes, method = 'pushState') {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(changes)) {
      if (key === 'hash') url.hash = value;
      else if (value === null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    history[method](null, '', url);
    layoutRestorers.forEach(restore => restore());
    showPage();
    render();
  }
  function enter(record) {
    origin = { id: record.id, y: scrollY };
    navigate({ mode: 'focus', panel: record.id, figure: null });
    record.panel.querySelector('.drawing').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function leave() {
    const destination = origin || { id: current.active.id, y: 0 };
    navigate({ mode: 'overview' });
    requestAnimationFrame(() => {
      byId.get(destination.id)?.panel.querySelector('.explore')?.focus({ preventScroll: true });
      window.scrollTo(0, destination.y);
    });
  }
  for (const record of records) {
    record.panel.dataset.panelId = record.id;
    const drawing = record.panel.querySelector('.drawing');
    drawing.tabIndex = 0;
    drawing.setAttribute('role', 'group');
    drawing.setAttribute('aria-label', `${record.title}: static illustration`);
    const button = document.createElement('button');
    button.className = 'explore'; button.textContent = 'Explore →';
    button.setAttribute('aria-label', `Explore ${record.title}`);
    button.onclick = () => enter(record);
    drawing.after(button);
  }
  function render() {
    current = resolve();
    const { sheet, active, mode, camera, style, figure } = current;
    const focused = mode === 'focus';
    document.body.dataset.mode = mode;
    document.body.dataset.camera = camera;
    document.body.dataset.style = style;
    document.body.dataset.figure = figure;
    // Normalize supplied invalid state while retaining unrelated parameters and legacy links.
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ panel: active.id, figure, camera, style, mode })) {
      if (url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    history.replaceState(history.state, '', url);
    for (const record of records) {
      record.panel.hidden = focused && record.sheet === sheet && record !== active;
      record.panel.classList.toggle('focused-panel', focused && record === active);
    }
    $('book-title').textContent = sheet.getAttribute('aria-label');
    $('book-count').textContent = `${String(sheets.indexOf(sheet) + 1).padStart(2, '0')} / 11`;
    $('back-to-sheet').hidden = !focused;
    $('book-overview').setAttribute('aria-pressed', String(!focused));
    $('book-focus').setAttribute('aria-pressed', String(focused));
    $('book-style').value = style;
    $('book-view').textContent = document.body.classList.contains('wall') ? 'Desktop view' : '3-screen view';
    $('book-previous').disabled = sheets.indexOf(sheet) === 0;
    $('book-next').disabled = sheets.indexOf(sheet) === sheets.length - 1;
    panelNav.hidden = !focused;
    panelNav.replaceChildren(...records.filter(r => r.sheet === sheet).map(record => {
      const button = document.createElement('button'); button.textContent = record.title;
      button.setAttribute('aria-pressed', String(record === active));
      button.onclick = () => navigate({ panel: record.id, figure: null });
      return button;
    }));
    document.body.dataset.bookReady = 'true';
  }
  $('back-to-sheet').onclick = leave;
  $('book-overview').onclick = leave;
  $('book-focus').onclick = () => enter(current.active);
  $('book-previous').onclick = () => move(-1);
  $('book-next').onclick = () => move(1);
  $('book-style').onchange = event => navigate({ style: event.target.value }, 'replaceState');
  addEventListener('hashchange', render);
  addEventListener('popstate', () => { render(); if (current.mode === 'overview' && origin) requestAnimationFrame(() => { byId.get(origin.id)?.panel.querySelector('.explore')?.focus({preventScroll:true}); window.scrollTo(0, origin.y); }); });
  addEventListener('change', event => { if (event.target.closest('[data-variant-group]')) render(); });
  addEventListener('click', event => { if (event.target.closest('[data-variant-step]')) render(); });
  addEventListener('keydown', event => {
    if ($('cad-dialog').open) return;
    if (event.key === 'Escape') {
      for (const menu of [downloads, view]) if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); return; }
      if (current.mode === 'focus') { event.preventDefault(); leave(); }
    }
    if (event.target.closest('.book-menu')) { event.stopImmediatePropagation(); return; }
    if (event.target.closest('.drawing') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','-','='].includes(event.key)) {
      // T03 will attach camera handling here; prevent the sheet handler meanwhile.
      event.stopImmediatePropagation();
    }
  }, true);
  render();
})();
