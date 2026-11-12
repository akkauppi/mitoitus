'use strict';
const $=id=>document.getElementById(id);
const sheets=[...document.querySelectorAll('.sheet')];
const titles=['Built form & scale.','Walk & cycle.','Accessible movement.','Transit & access.','Green & blue.','Fit the street.'];
const intros=['From a building footprint to a shared street.','Continuous routes. Room to move and stay.','Turn, pass, approach and join in.','Movement corridors and the space around them.','Make room above and below the surface.','Bring separate spatial needs into one proposal.'];
let page=0,sources=false,viewOverride=new URLSearchParams(location.search).get('view');
const number=(n,d=2)=>n.toLocaleString('en-GB',{maximumFractionDigits:d});
function valid(id){const el=$(id);const n=el.valueAsNumber;return el.value!==''&&el.checkValidity()&&Number.isFinite(n)?n:null;}
function showPage(){
 const candidate=sheets.findIndex(s=>s.id===location.hash.slice(1));page=candidate<0?0:candidate;
 sheets.forEach((s,i)=>{s.hidden=i!==page});
 document.querySelectorAll('.tabs a').forEach((a,i)=>{if(i===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 $('page-title').textContent=titles[page];$('page-intro').textContent=intros[page];
 const count=`${String(page+1).padStart(2,'0')} / ${String(sheets.length).padStart(2,'0')}`;
 $('page-count').textContent=count;$('wall-page').textContent=count;
 document.title=`${titles[page].replace(/\.$/,'')} — Mitoitus`;
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
}
function setView(value){viewOverride=value;const url=new URL(location.href);url.searchParams.set('view',value);history.replaceState(null,'',url);fit();}
function toggleSources(){sources=!sources;document.body.classList.toggle('sources-on',sources);document.querySelector('.source-banner').hidden=!sources;for(const id of ['sources-toggle','wall-sources'])$(id).setAttribute('aria-pressed',String(sources));}
async function full(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('status').textContent='Fullscreen is unavailable here. Use the browser fullscreen command.';}}
function calc(){
 const footprint=valid('footprint'),floors=valid('floors'),land=valid('land');
 if(footprint===null||floors===null||land===null){$('far-result').textContent='—';$('far-detail').textContent='Enter valid values; land area must be greater than zero.';}
 else{$('far-result').textContent=(footprint*floors/land).toFixed(2);$('far-detail').textContent=`${number(footprint*floors)} m² floor area / ${number(land)} m² land`;}
 const real=valid('real-length'),scale=valid('model-scale');
 if(real===null||scale===null){$('scale-result').textContent='—';$('scale-unit').textContent='—';}
 else{$('scale-result').innerHTML=`${number(real*1000/scale,3)} <small>mm</small>`;$('scale-unit').textContent=`${number(1000/scale,3)} mm`;}
 updateBudget();
}
const budgetTypes=[['walk','Footway','WALK','#ffdf3a'],['cycle','Cycle lane','CYCLE','#8cc5f3'],['green','Planting','GREEN','#b8d5a0'],['vehicle','Vehicle lane','VEHICLE','#f7a099'],['tram','Tram corridor','TRAM','#b6a6dd'],['other','Other / buffers','OTHER','#bdbbb3']];
function getBudget(){
 const available=valid('available');const rows=budgetTypes.map(([id,name,layer,color])=>({name,layer,color,width:valid('b-'+id),count:valid('n-'+id)}));
 if(available===null||rows.some(r=>r.width===null||r.count===null))return null;
 return{available,rows};
}
function updateBudget(){
 const b=getBudget();const bar=$('budget-bar');bar.replaceChildren();
 if(!b){$('budget-result').textContent='Check inputs';$('budget-detail').textContent='Use non-negative widths and whole-number counts.';$('download-budget').disabled=true;return;}
 $('download-budget').disabled=false;
 const used=b.rows.reduce((sum,r)=>sum+r.width*r.count,0),left=b.available-used,max=Math.max(used,b.available);
 $('budget-result').textContent=left<-.000001?`${number(-left)} m over`:`${number(Math.max(0,left))} m left`;
 $('budget-result').classList.toggle('over-budget',left<-.000001);
 $('budget-detail').textContent=`${number(used)} m allocated / ${number(b.available)} m available`;
 for(const r of b.rows){if(r.width*r.count>0){const s=document.createElement('span');s.style.width=`${r.width*r.count/max*100}%`;s.style.background=r.color;bar.append(s);}}
 if(left>0){const s=document.createElement('span');s.style.width=`${left/max*100}%`;s.style.background='repeating-linear-gradient(135deg,#eee,#eee 5px,#d3d2ca 5px,#d3d2ca 6px)';bar.append(s);}
}
function resetBudget(){for(const input of document.querySelectorAll('.budget-panel input'))input.value=input.defaultValue;updateBudget();}
function unit(){return document.querySelector('input[name="cad-unit"]:checked').value;}
function updateDownloads(){const u=unit();document.querySelectorAll('[data-cad]').forEach(a=>a.href=`downloads/${a.dataset.cad}-${u}.dxf`);document.querySelectorAll('[data-svg]').forEach(a=>a.href=`downloads/${a.dataset.svg}-${u}.svg`);$('cad-bundle').href=`downloads/mitoitus-cad-${u}.zip`;}
function openCAD(){updateDownloads();$('cad-dialog').showModal();}
function downloadBudget(){
 const b=getBudget();if(!b){$('status').textContent='Correct the width-budget inputs before exporting.';return;}
 const blob=new Blob([MitoitusCAD.dxf('budget',unit(),b)],{type:'application/dxf'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=`mitoitus-width-budget-${unit()}.dxf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('sources-toggle').onclick=toggleSources;$('wall-sources').onclick=toggleSources;
$('view-toggle').onclick=()=>setView(document.body.classList.contains('wall')?'desktop':'wall');$('wall-exit').onclick=()=>setView('desktop');
$('fullscreen').onclick=full;$('wall-fullscreen').onclick=full;$('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);
$('reset-budget').onclick=resetBudget;$('export-budget').onclick=openCAD;$('download-budget').onclick=downloadBudget;
for(const button of document.querySelectorAll('.open-cad'))button.onclick=openCAD;
$('close-cad').onclick=()=>$('cad-dialog').close();
$('cad-dialog').addEventListener('click',e=>{if(e.target===$('cad-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
for(const input of document.querySelectorAll('input[type="number"]'))input.addEventListener('input',calc);
for(const input of document.querySelectorAll('[name="cad-unit"]'))input.addEventListener('change',updateDownloads);
addEventListener('resize',fit);addEventListener('hashchange',showPage);
addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select')||$('cad-dialog').open)return;
 if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();move(1);}
 if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();move(-1);}
 if(e.key.toLowerCase()==='f'){e.preventDefault();full();}
 if(e.key.toLowerCase()==='s')toggleSources();
 if(e.key.toLowerCase()==='h')document.querySelector('.wall-controls').classList.toggle('controls-visible');
 if(/^[1-6]$/.test(e.key))location.hash=sheets[Number(e.key)-1].id;
});
calc();showPage();
