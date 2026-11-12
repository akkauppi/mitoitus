/* T02 progressive shell. Classic script keeps direct-file use working.
 * Baseline app.js continues to own source/CAD/variant behavior. */
(() => {
  'use strict';
  const all = selector => [...document.querySelectorAll(selector)];
  const tabs=document.querySelector('.tabs');
  const panels = all('.panel');
  const records = panels.map(panel => ({
    panel,
    id: panel.querySelector('.proof').getAttribute('href').split('#')[1],
    sheet: panel.closest('.sheet'),
    title: panel.querySelector('h2').textContent,
    count: panel.querySelectorAll('.drawing svg').length,
  }));
  // User-approved editorial presentation, 2026-11-13. Full original paragraphs
  // remain in Sources; numeric tables and canonical source files are untouched.
  const quickNotes={
    'services':['Small municipalities may need more space per resident.','Nearby schools already full.','Additional central-city unit.'],
    'green-hierarchy':['Residential floor area. Check actual walking routes.'],
    'building-rows':['Dimensions refer to one repeating unit.'],
    'building-detached':[null],
    'walking':['Keep furniture, signs, snow and door swings outside the clear route.'],
    'cycling':['¹ At footway level, with walking separate. Allow movement clearance beyond the 0.75 m user envelope.'],
    'bike-parking':['0.6 × 4 m includes handling. Check cargo cycles separately.'],
    'turning':['Keep furniture and door swings outside the clear circle.'],
    'ramps':['Run = rise ÷ gradient: 0.30 ÷ 0.05 = 6 m, before landings. Add turning space at changes of direction.'],
    'arrival':['² Recommended park-route spacing. Seats: backrests, armrests and a choice of heights.','Allow vehicle transfer/lift space and an accessible connection.'],
    'tram-corridor':['Size from the ATU clearance envelope. Allow for curves, poles, evacuation and crossings.'],
    'tram-width':['Waiting space: 1 m²/person; minimum 0.75 m²/person at peak boarding demand.','Fit shelters, waiting space, access and cycle routes together.'],
    'tram-length':['Platform: 0.30 m; Helsinki normally 0.27 m. Add ramps and crossing waiting space.'],
    'car-turn':['Geometric radius reference.','Check the design vehicle for servicing, deliveries and waste collection.'],
    'bus-turn':['Radius reference; 15 m design bus. Add approach and crossing clearances.'],
    'rescue':['Add 0.4 m driving and 1 m boom allowances. Check loads, slopes, reach, trees, wires and snow.'],
    'trees':['Stone reduces water storage in structural soil.','Coordinate crowns, connected rooting space, groundwater and utilities.'],
    'ground':['Check rooting volume separately.','Keep snow clear of walking, turning and rescue space; route meltwater.'],
    'stormwater':['Check soil, groundwater and design rainfall.'],
    'rain-gardens':['Rain gardens collect, store and filter runoff; infiltration depends on soil and groundwater.','Swales slow and convey runoff. Check dams add storage.','Drainage: underdrain or controlled outlet.','Keep overflow and maintenance access. Check contaminated ground and winter operation.'],
    'ponds':[null,'Wetlands have shallow, planted levels; ponds can retain permanent water.','Count storage above normal water level.','Show inlet, outlet, overflow, safe banks and maintenance access. Include banks and flood extent.'],
    'source-control':['Reduce runoff → slow/filter → store → controlled discharge and overflow.','Plan for clogging and winter maintenance. Count pore space for storage.'],
    'section-ratio':['Measure façade to façade; record both heights if they differ.'],
    'equal-density':['Keep plot, block and district land areas separate.'],
    'steps':['Outdoors: 2r + t = 0.66 m; covered/heated: 0.63 m. Keep risers and treads identical.','Coordinate landings, handrails, guards and an accessible route.'],
    'crossing-refuge':['Add the refuge to both traffic lanes.','Check kerbs, tactile cues, sightlines, drainage and onward footways.'],
    'walking-connections':['Check every link to the entrance.','Check barriers, opening hours, slopes and winter access.',null],
    'clear-route-continuity':['Measure clear width and height along the whole route. Keep furniture, doors, branches, signs and snow outside it.',null],
    'parking-layout':['Allow for door opening, end bays, columns and manoeuvring. ¹ Transfer access is additional.'],
    'parking-area':['Include entrances, row ends, paths, accessible spaces, planting, snow and drainage.','12.5 m² is the bay only. Garages also need ramps, structure and vertical circulation.','Draw the layout and count usable spaces.'],
  };
  for(const record of records){
    const notes=quickNotes[record.id];if(!notes)continue;
    const paragraphs=[...record.panel.querySelectorAll(record.id==='services'?'.service-case > p':'.details > p:not(.source-meta)')];
    paragraphs.forEach((original,index)=>{if(index>=notes.length)return;original.dataset.referenceNote='';const text=notes[index];if(text){const brief=document.createElement('p');brief.className='quick-note';brief.textContent=text;original.after(brief);}});
  }
  function adaptPopulationGraphics(){
    const chart=document.querySelector('.population-tiles');if(!chart)return;
    const narrow=innerWidth<730;chart.setAttribute('viewBox',narrow?'0 0 220 760':'0 0 440 398');
    [...chart.querySelectorAll('[data-density]')].forEach((g,i)=>{if(narrow)g.setAttribute('transform',`translate(${-220*(i%2)} ${(i-Math.floor(i/2))*185})`);else g.removeAttribute('transform');});
  }
  adaptPopulationGraphics();
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
  downloads.innerHTML = '<summary>Downloads</summary><div><button class="book-cad">CAD reference files</button><a href="evidence.html">Evidence index ↗</a></div>';
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
  const viewerModuleURL = new URL('book-3d.js', document.currentScript.src);
  let viewerPromise=null,bookViewer=null,viewerEpoch=0;
  async function syncViewer(state) {
    const epoch=++viewerEpoch;
    const live=state.mode==='focus'&&['rain-gardens','ponds','source-control','ground','stormwater','trees','walking','cycling','bike-parking','turning','ramps','arrival','tram-corridor','tram-width','tram-length','car-turn','bus-turn','rescue','crossing-refuge','clear-route-continuity','building-blocks','building-rows','building-detached','section-ratio','equal-density','steps'].includes(state.active.id)&&!document.body.classList.contains('wall')&&location.protocol!=='file:';
    $('book-style').closest('label').hidden=!live;
    if(!live){bookViewer?.suspend();return;}
    try {
      viewerPromise ||= import(viewerModuleURL.href);
      const module=await viewerPromise;
      if(epoch!==viewerEpoch)return;
      bookViewer ||= module.createBookViewer({drawing:state.active.panel.querySelector('.drawing'),onCameraChange:camera=>{
        const url=new URL(location.href);url.searchParams.set('camera',camera);history.replaceState(history.state,'',url);
        current.camera=camera;document.body.dataset.camera=camera;
        bookViewer.show({drawing:current.active.panel.querySelector('.drawing'),recipeId:current.sceneId,camera,style:current.style});
      }});
      bookViewer.show({drawing:state.active.panel.querySelector('.drawing'),recipeId:state.sceneId,camera:state.camera,style:state.style});
      document.body.dataset.viewerState=JSON.stringify(bookViewer.inspect());
    }catch(error){
      // Failed module loads leave the complete original figure and facts available.
      document.body.dataset.viewerUnavailable='true';
    }
  }
  addEventListener('pagehide',()=>{viewerEpoch++;bookViewer?.dispose();bookViewer=null;});
  addEventListener('pageshow',event=>{if(event.persisted)render();});
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
    const sceneId=figure;
    const allowed = ['density','green-hierarchy','services'].includes(active.id)?['plan']:['rain-gardens','ponds','source-control'].includes(active.id)?['iso','section']:active.id==='ground'?['iso','plan']:active.id==='stormwater'?['iso','plan','section']:active.id==='trees'?['iso','plan','front','section']:active.id==='section-ratio'?['section','iso']:active.id==='equal-density'?['iso','plan']:active.id==='steps'?['iso','plan','section']:['building-blocks','building-rows','building-detached'].includes(active.id)?['plan','iso']:active.id==='clear-route-continuity'?['iso','plan','front']:active.id==='crossing-refuge'?['iso','plan']:active.id==='walking-connections'?['plan']: ['turning','arrival','tram-corridor','tram-length','car-turn','bus-turn','rescue'].includes(active.id)?['iso','plan']:['trees','walking','cycling','bike-parking','ramps','tram-width','tram-length'].includes(active.id)?['iso','plan','front']:['iso','plan','front','section'];
    const defaultCamera=active.id==='ponds'?'section':['rain-gardens','source-control'].includes(active.id)?'iso':active.id==='section-ratio'?'section':['steps','equal-density','ground','stormwater'].includes(active.id)?'iso':['clear-route-continuity','building-blocks','building-rows','building-detached'].includes(active.id)?'iso':['ramps','tram-width'].includes(active.id)?'front':['turning','arrival','tram-corridor'].includes(active.id)?'plan':['trees','walking','cycling','bike-parking','tram-length'].includes(active.id)?'iso':'plan';
    const camera = allowed.includes(q.get('camera')) ? q.get('camera') : defaultCamera;
    const style = ['paper', 'ink', 'soft'].includes(q.get('style')) ? q.get('style') : 'paper';
    return { sheet, active, figure, sceneId, camera, style, mode: q.get('mode') === 'focus' ? 'focus' : 'overview' };
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
    if(record.id==='walking-connections')record.panel.classList.add('connection-network');
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
    document.title=sheet.getAttribute('aria-label')+' — '+document.querySelector('.brand>span').firstChild.textContent;
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
    // Keep a margin so integer scroll rounding cannot clip fractional tab edges.
    const activeTab=tabs.querySelector('[aria-current="page"]');
    if(activeTab&&!document.body.classList.contains('wall')){
      const a=activeTab.getBoundingClientRect(),n=tabs.getBoundingClientRect();
      if(a.left<n.left+8)tabs.scrollLeft-=Math.ceil(n.left+8-a.left);
      else if(a.right>n.right-8)tabs.scrollLeft+=Math.ceil(a.right-n.right+8);
    }
    document.body.dataset.bookReady = 'true';
    syncViewer(current);
  }
  $('back-to-sheet').onclick = leave;
  $('book-overview').onclick = leave;
  $('book-focus').onclick = () => enter(current.active);
  $('book-previous').onclick = () => move(-1);
  $('book-next').onclick = () => move(1);
  $('book-style').onchange = event => navigate({ style: event.target.value }, 'replaceState');
  addEventListener('hashchange', render);
  addEventListener('resize',()=>{adaptPopulationGraphics();syncViewer(current);});
  $('wall-exit').addEventListener('click',render);
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
      if(!event.target.closest('.scene-viewport'))event.stopImmediatePropagation();
    }
  }, true);
  render();
})();
