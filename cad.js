/* Geometry is stored in metres. Rendering converts once to the chosen CAD units. */
(function(root){
'use strict';
const units={m:{factor:1,insunits:6,label:'metres'},mm:{factor:1000,insunits:4,label:'millimetres'},ft:{factor:1/0.3048,insunits:2,label:'feet'}};
const text=(x,y,value,height=.22)=>({type:'text',x,y,value,height});
const rect=(x,y,w,h,layer='REFERENCE')=>({type:'rect',x,y,w,h,layer});
const circle=(x,y,r,layer='REFERENCE')=>({type:'circle',x,y,r,layer});
const fmt=(n)=>Number(n.toFixed(4)).toString();
function geometry(kind,unit='m',budget){
 const u=units[unit];if(!u)throw new Error('Unknown drawing unit');
 const dim=(m)=>`${fmt(m*u.factor)} ${unit}`;
 let g=[];let title='';let proof='';
 if(kind==='accessible'){
  title='ACCESSIBLE MOVEMENT';proof='turning';
  g=[circle(1.5,1.5,.75),circle(5,1.5,1.25),text(.3,3.3,"Wheelchair"),text(.3,2.95,`Diameter ${dim(1.5)}`),text(3.5,3.3,"Powered wheelchair"),text(3.5,2.95,`Diameter ${dim(2.5)}`),rect(0,-5,1.5,3),rect(3,-5,1.8,3),rect(6,-5,.9,1.5),rect(9,-5,3.6,5),text(0,-5.6,`Clear route ${dim(1.5)}`,.18),text(3,-6,`Passing ${dim(1.8)}`,.18),text(6,-5.6,`Beside bench ${dim(.9)}`,.18),text(9,-6,`Bay ${dim(3.6)} x ${dim(5)}`,.18),text(0,-7,'Route length 3 m and bench-space depth 1.5 m are illustrative, not sourced requirements.',.18),text(0,-7.4,'SuRaKu 2008 cards 1-4. Separate transfer/lift space and approach must be checked.',.18)];
 }else if(kind==='rescue'){
  title='RESCUE REFERENCE GEOMETRY';proof='rescue';
  g=[circle(12,15,5),circle(12,15,10.5),circle(40,15,5.5),circle(40,15,12.5),rect(60,4,6,13),rect(60,4,8,13,'TARGET'),text(2,28,`Fire engine radii ${dim(5)} / ${dim(10.5)}`,.6),text(29,30,`Aerial radii ${dim(5.5)} / ${dim(12.5)}`,.6),text(57,20,`Set-up ${dim(6)} x ${dim(13)}`,.5),text(57,18.5,`Target width ${dim(8)}`,.5),text(0,0,`Route width ${dim(3.5)}; clear height ${dim(4.2)}. HIKLU v1.3 (2024), pp. 7-13.`,.5),text(0,-1.5,'Radius circles only: NOT a vehicle swept-path simulation. No driving allowances are added.',.5),text(0,-3,'Check vehicle model, driving/boom allowances, bearing capacity, gradients, reach and obstacles.',.5)];
 }else if(kind==='street'){
  title='STREET-SPACE WIDTH STRIPS';proof='budget';
  const rows=[['Footway',2.5],['One-way cycle lane',1.75],['Tree strip (not root volume)',3],['Bus-dimensioned local collector lane',3.25],['Light-rail corridor (Espoo 2010)',8]];
  let x=0;for(const [label,w] of rows){g.push(rect(x,0,w,20),text(x,-1,`${label}: ${dim(w)}`,.25));x+=w+5;}
  g.push(text(0,-3,'Separate reference strips, not one prescribed street section. Strip length 20 m is illustrative.',.3),text(0,-4,'Espoo 2010 pp. 16-19. Add stops, kerbs, separation, edges, snow, utilities and other required space.',.3));
 }else if(kind==='budget'){
  if(!budget||!Number.isFinite(budget.available)||budget.available<=0)throw new Error('Enter valid budget values first.');
  title='EDITED WIDTH BUDGET';proof='budget';
  let x=0;for(const row of budget.rows){
   if(!Number.isFinite(row.width)||row.width<0||!Number.isInteger(row.count)||row.count<0)throw new Error('Invalid strip value');
   for(let i=0;i<row.count;i++){if(row.width>0){g.push(rect(x,0,row.width,20,row.layer),text(x,-.7-i*.35,`${row.name} ${i+1}: ${dim(row.width)}`,.22));x+=row.width;}}
  }
  g.push(rect(0,0,budget.available,20,'AVAILABLE'),text(0,22,`Allocated ${dim(x)} / available ${dim(budget.available)}; remainder ${dim(budget.available-x)}`,.4),text(0,-3,'User-edited widths. No design compliance check. Length 20 m is illustrative. Adjacent strips only.',.3));
 }else throw new Error('Unknown template');
 const top=Math.max(...g.map(e=>e.y+(e.h||e.r||0)),0)+3;
 g.push(text(0,top,`${title} - units: ${u.label} (${unit}); geometry 1:1`,kind==='rescue'?.7:.35));
 g.push(text(0,top+1.2,`Evidence: https://akkauppi.github.io/mitoitus/evidence.html#${proof}`,kind==='rescue'?.45:.23));
 g.push(text(0,top+2.1,'Finnish source dimensions; 1 ft = 0.3048 m exactly. Teaching reference, not construction details.',kind==='rescue'?.45:.23));
 return g;
}
function dxf(kind,unit,budget){
 const base=root.CAD_BASES?.[unit];if(!base)throw new Error('CAD export base unavailable');
 const f=units[unit].factor;let handle=0x1000;let out='';
 const pair=(c,v)=>`${c}\n${v}\n`;
 const start=(type,layer,sub)=>pair(0,type)+pair(5,(handle++).toString(16).toUpperCase())+pair(330,base.owner)+pair(100,'AcDbEntity')+pair(8,layer)+pair(100,sub);
 const line=(x1,y1,x2,y2,l)=>start('LINE',l,'AcDbLine')+pair(10,fmt(x1*f))+pair(20,fmt(y1*f))+pair(30,0)+pair(11,fmt(x2*f))+pair(21,fmt(y2*f))+pair(31,0);
 for(const e of geometry(kind,unit,budget)){
  const l=e.layer||'ANNOTATION';
  if(e.type==='rect')out+=line(e.x,e.y,e.x+e.w,e.y,l)+line(e.x+e.w,e.y,e.x+e.w,e.y+e.h,l)+line(e.x+e.w,e.y+e.h,e.x,e.y+e.h,l)+line(e.x,e.y+e.h,e.x,e.y,l);
  if(e.type==='circle')out+=start('CIRCLE',l,'AcDbCircle')+pair(10,fmt(e.x*f))+pair(20,fmt(e.y*f))+pair(30,0)+pair(40,fmt(e.r*f));
  if(e.type==='text')out+=start('TEXT',l,'AcDbText')+pair(10,fmt(e.x*f))+pair(20,fmt(e.y*f))+pair(30,0)+pair(40,fmt(e.height*f))+pair(1,e.value.replace(/[^\x20-\x7E]/g,'?'))+pair(7,'Standard')+pair(100,'AcDbText');
 }
 return base.before+out+base.after;
}
function svg(kind,unit,budget){
 const g=geometry(kind,unit,budget);const f=units[unit].factor;
 const esc=(s)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const minX=Math.min(0,...g.map(e=>e.x-(e.r||0)))-1;
 const maxX=Math.max(...g.map(e=>e.x+(e.w||e.r||0)+(e.type==='text'?e.value.length*e.height*.58:0)))+1;
 const minY=Math.min(...g.map(e=>e.y-(e.r||0)))-1;
 const maxY=Math.max(...g.map(e=>e.y+(e.h||e.r||e.height||0)))+1;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(minX*f)} ${fmt(-maxY*f)} ${fmt((maxX-minX)*f)} ${fmt((maxY-minY)*f)}"><title>${kind} reference in ${unit}</title><desc>One SVG user unit equals one ${units[unit].label} drawing unit. See accompanying DXF and evidence for assumptions.</desc>`;
 for(const e of g){
  const color=e.layer==='TARGET'?'#777':'#111';
  if(e.type==='circle')s+=`<circle cx="${fmt(e.x*f)}" cy="${fmt(-e.y*f)}" r="${fmt(e.r*f)}" fill="none" stroke="${color}" stroke-width="${fmt(.015*f)}"/>`;
  if(e.type==='rect')s+=`<rect x="${fmt(e.x*f)}" y="${fmt(-(e.y+e.h)*f)}" width="${fmt(e.w*f)}" height="${fmt(e.h*f)}" fill="none" stroke="${color}" stroke-width="${fmt(.015*f)}"/>`;
  if(e.type==='text')s+=`<text x="${fmt(e.x*f)}" y="${fmt(-e.y*f)}" font-family="Arial,sans-serif" font-size="${fmt(e.height*f)}">${esc(e.value)}</text>`;
 }
 return s+'</svg>\n';
}
root.MitoitusCAD={units,geometry,dxf,svg};
if(typeof module!=='undefined')module.exports=root.MitoitusCAD;
})(globalThis);
