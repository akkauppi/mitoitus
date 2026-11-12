'use strict';
const $=id=>document.getElementById(id);
const sheets=[...document.querySelectorAll('.sheet')];
const titles=sheets.map(s=>s.getAttribute('aria-label'));
let page=0,sources=false,viewOverride=new URLSearchParams(location.search).get('view');
function revealActiveTab(){
 const nav=document.querySelector('.tabs'),active=nav.querySelector('[aria-current="page"]');
 if(!active||nav.scrollWidth<=nav.clientWidth)return;
 const n=nav.getBoundingClientRect(),a=active.getBoundingClientRect();
 if(a.left<n.left)nav.scrollLeft+=a.left-n.left;
 else if(a.right>n.right)nav.scrollLeft+=a.right-n.right;
}
function showPage(){
 const aliases={'transit-access':'tram','fit-street':'section-details','section-scale':'section-details'};
 const wanted=aliases[location.hash.slice(1)]||location.hash.slice(1);
 const candidate=sheets.findIndex(s=>s.id===wanted);page=candidate<0?0:candidate;
 sheets.forEach((s,i)=>{s.hidden=i!==page});
 document.querySelectorAll('.tabs a').forEach((a,i)=>{if(i===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 $('page-title').textContent=titles[page];
 const count=`${String(page+1).padStart(2,'0')} / ${String(sheets.length).padStart(2,'0')}`;
 $('page-count').textContent=count;$('wall-page').textContent=count;
 document.title=`${titles[page]} — Antti’s Dubious Little Rulebook`;
 $('previous').disabled=page===0;$('next').disabled=page===sheets.length-1;
 $('status').textContent=`Sheet ${page+1} of ${sheets.length}: ${titles[page]}`;
 if(!document.body.classList.contains('wall'))window.scrollTo({top:0,behavior:'instant'});
 fit();
}
function move(delta){const n=Math.max(0,Math.min(sheets.length-1,page+delta));location.hash=sheets[n].id;}
function fit(){
 const wall=viewOverride==='wall'||(viewOverride!=='desktop'&&innerWidth/innerHeight>=3.6);
 document.body.classList.toggle('wall',wall);$('view-toggle').setAttribute('aria-pressed',String(wall));
 $('view-toggle').textContent=wall?'Desktop view':'3-screen view';
 const stage=$('stage');
 if(wall){const scale=Math.min(innerWidth/4800,innerHeight/1000);stage.style.transform=`scale(${scale})`;stage.style.left=`${(innerWidth-4800*scale)/2}px`;stage.style.top=`${(innerHeight-1000*scale)/2}px`;}
 else{stage.style.transform='';stage.style.left='';stage.style.top='';}
 if(!wall)revealActiveTab();
}
function setView(value){viewOverride=value;const url=new URL(location.href);url.searchParams.set('view',value);history.replaceState(null,'',url);fit();}
function toggleSources(){sources=!sources;document.body.classList.toggle('sources-on',sources);document.querySelector('.source-banner').hidden=!sources;for(const id of ['sources-toggle','wall-sources'])$(id).setAttribute('aria-pressed',String(sources));}
async function full(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('status').textContent='Fullscreen is unavailable here. Use the browser fullscreen command.';}}
function unit(){return document.querySelector('input[name="cad-unit"]:checked').value;}
function updateDownloads(){const u=unit();document.querySelectorAll('[data-cad]').forEach(a=>a.href=`downloads/${a.dataset.cad}-${u}.dxf`);document.querySelectorAll('[data-svg]').forEach(a=>a.href=`downloads/${a.dataset.svg}-${u}.svg`);$('cad-bundle').href=`downloads/mitoitus-cad-${u}.zip`;}
function openCAD(){updateDownloads();$('cad-dialog').showModal();}
const layoutRestorers=[];
for(const group of document.querySelectorAll('[data-variant-group]')){
 const select=group.querySelector('select'),drawings=[...group.querySelectorAll('[data-variant]')];
 const previous=group.querySelector('[data-variant-step="-1"]'),next=group.querySelector('[data-variant-step="1"]');
 const parameter='layout-'+group.dataset.variantGroup;
 const printLabel=document.createElement('p');printLabel.className='variant-print-label';group.prepend(printLabel);
 function choose(save=true){
  const i=select.selectedIndex;drawings.forEach((d,n)=>d.hidden=n!==i);
  previous.disabled=i===0;next.disabled=i===drawings.length-1;
  printLabel.textContent=select.selectedOptions[0].textContent;
  $('status').textContent=select.selectedOptions[0].textContent;
  if(save){
   const url=new URL(location.href);
   if(i===0)url.searchParams.delete(parameter);else url.searchParams.set(parameter,String(i));
   history.replaceState(null,'',url);
  }
 }
 function restore(){
  const value=new URLSearchParams(location.search).get(parameter);
  const n=value!==null&&/^\d+$/.test(value)?Number(value):0;
  select.selectedIndex=n>=0&&n<drawings.length?n:0;choose(false);
 }
 layoutRestorers.push(restore);restore();
 select.addEventListener('change',()=>choose());
 for(const button of [previous,next])button.addEventListener('click',()=>{select.selectedIndex+=Number(button.dataset.variantStep);choose()});
}
$('sources-toggle').onclick=toggleSources;$('wall-sources').onclick=toggleSources;
$('view-toggle').onclick=()=>setView(document.body.classList.contains('wall')?'desktop':'wall');$('wall-exit').onclick=()=>setView('desktop');
$('fullscreen').onclick=full;$('wall-fullscreen').onclick=full;$('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);
for(const button of document.querySelectorAll('.open-cad'))button.onclick=openCAD;
$('close-cad').onclick=()=>$('cad-dialog').close();
$('cad-dialog').addEventListener('click',e=>{if(e.target===$('cad-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
for(const input of document.querySelectorAll('[name="cad-unit"]'))input.addEventListener('change',updateDownloads);
addEventListener('resize',fit);addEventListener('hashchange',showPage);
addEventListener('popstate',()=>{viewOverride=new URLSearchParams(location.search).get('view');layoutRestorers.forEach(restore=>restore());showPage()});
addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,textarea,select,.variant-controls,[contenteditable="true"]')||$('cad-dialog').open)return;
 if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();move(1);}
 if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();move(-1);}
 if(e.key.toLowerCase()==='f'){e.preventDefault();full();}
 if(e.key.toLowerCase()==='s')toggleSources();
 if(e.key.toLowerCase()==='h')document.querySelector('.wall-controls').classList.toggle('controls-visible');
 if(/^[0-9]$/.test(e.key)){const i=e.key==='0'?9:Number(e.key)-1;if(sheets[i])location.hash=sheets[i].id;}
});
showPage();
