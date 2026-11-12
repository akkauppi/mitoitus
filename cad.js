/* Geometry is stored in metres. Rendering converts once to the chosen CAD units. */
(function(root){
'use strict';
const units={m:{factor:1,insunits:6,label:'metres'},mm:{factor:1000,insunits:4,label:'millimetres'},ft:{factor:1/0.3048,insunits:2,label:'feet'}};
const text=(x,y,value,height=.22)=>({type:'text',x,y,value,height});
const rect=(x,y,w,h,layer='REFERENCE')=>({type:'rect',x,y,w,h,layer});
const circle=(x,y,r,layer='REFERENCE')=>({type:'circle',x,y,r,layer});
const arc=(x,y,r,start=0,end=90,layer='REFERENCE')=>({type:'arc',x,y,r,start,end,layer});
const segment=(x,y,x2,y2,layer='REFERENCE')=>({type:'line',x,y,x2,y2,layer});
const fmt=(n)=>Number(n.toFixed(4)).toString();
function geometry(kind,unit='m'){
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
  title='STREET-SPACE WIDTH STRIPS';proof='street-cad';
  const rows=[['Footway',2.5],['One-way cycle lane',1.75],['Tree strip (not root volume)',3],['Bus-dimensioned local collector lane',3.25],['Light-rail corridor (Espoo 2010)',8]];
  let x=0;for(const [label,w] of rows){g.push(rect(x,0,w,20),text(x,-1,`${label}: ${dim(w)}`,.25));x+=w+5;}
  g.push(text(0,-3,'Separate reference strips, not one prescribed street section. Strip length 20 m is illustrative.',.3),text(0,-4,'Espoo 2010 pp. 16-19. Add stops, kerbs, separation, edges, snow, utilities and other required space.',.3));
 }else if(kind==='buildings'){
  title='BUILDING FOOTPRINT REPRESENTATIVES';proof='building-blocks';
  const forms=[['Slab module',26,11],['Square point block',20,20],['Small block module',9,9],['Row dwelling',6,9.5],['Detached, one storey',15,10]];
  let x=0;for(const [name,w,h] of forms){g.push(rect(x,0,w,h),text(x,h+2,name,.55),text(x,-2,`${dim(w)} x ${dim(h)}`,.45));x+=w+7;}
  g.push(text(0,-5,'Representative values within TKK 2007 ranges, not prescriptions. Repeat modules as labelled.',.5));
  g.push(text(0,-7,'Other footprint evidence: https://akkauppi.github.io/mitoitus/evidence.html#building-rows',.4));
  g.push(text(0,-8.5,'Detached-house evidence: https://akkauppi.github.io/mitoitus/evidence.html#building-detached',.4));
 }else if(kind==='turning'){
  title='TKK 2007 CAR AND BUS TURNING RADII';proof='car-turn';
  g=[circle(8,10,3),circle(8,10,6.5),circle(35,18,8.1),circle(35,18,15.2),text(0,0,`Car/van radii ${dim(3)} / ${dim(6.5)}`,.45),text(20,0,`Bus radii ${dim(8.1)} / ${dim(15.2)}`,.45)];
  for(const [x,y,ri,ro] of [[60,10,3,6.5],[85,10,8.1,15.2]])g.push(arc(x,y,ri),arc(x,y,ro),segment(x+ri,y,x+ro,y),segment(x,y+ri,x,y+ro));
  g.push(text(58,0,'Quarter-circle radius bands; same scale as the circles.',.45),text(0,-3,'Historical reference geometry, NOT a vehicle swept-path simulation.',.5));
  g.push(text(0,-5,'Bus evidence: https://akkauppi.github.io/mitoitus/evidence.html#bus-turn',.4));
 }else if(kind==='tram'){
  title='TRAM STOP - STRAIGHT DEDICATED TRACK EXAMPLE';proof='tram-width';
  g=[rect(0,0,45,3.5,'WALK'),rect(0,3.5,45,5.5,'TRAM'),rect(0,9,45,3.5,'WALK'),rect(-6,0,6,3.5,'OTHER'),rect(45,0,6,3.5,'OTHER'),rect(-6,9,6,3.5,'OTHER'),rect(45,9,6,3.5,'OTHER'),text(1,1.4,`Side platform: ${dim(3.5)} normal`,.5),text(1,6,`Between platforms: ${dim(5.5)}`,.5),text(1,10.5,`Side platform: ${dim(3.5)} normal`,.5),text(0,-2,`Flat service length ${dim(45)}; section width ${dim(12.5)} before outer routes/buffers.`,.45),text(0,-4,`End rectangles: illustrative ${dim(6)} ramps, assuming ${dim(.3)} rise at 5%.`,.4),text(0,-5.5,'Add crossing waiting areas. No shelters, tapered ends, rails or vehicle swept paths are specified.',.4),text(0,-7,'Length/height evidence: https://akkauppi.github.io/mitoitus/evidence.html#tram-length',.4)];
 }else throw new Error('Unknown template');
 const top=Math.max(...g.map(e=>e.y+(e.h||e.r||0)),0)+3;
 g.push(text(0,top,`${title} - units: ${u.label} (${unit}); geometry 1:1`,kind==='rescue'?.7:.35));
 g.push(text(0,top+1.2,`Evidence: https://akkauppi.github.io/mitoitus/evidence.html#${proof}`,kind==='rescue'?.45:.23));
 g.push(text(0,top+2.1,'Finnish source dimensions; 1 ft = 0.3048 m exactly. Teaching reference, not construction details.',kind==='rescue'?.45:.23));
 return g;
}
function dxf(kind,unit){
 const base=root.CAD_BASES?.[unit];if(!base)throw new Error('CAD export base unavailable');
 const f=units[unit].factor;let handle=0x1000;let out='';
 const pair=(c,v)=>`${c}\n${v}\n`;
 const start=(type,layer,sub)=>pair(0,type)+pair(5,(handle++).toString(16).toUpperCase())+pair(330,base.owner)+pair(100,'AcDbEntity')+pair(8,layer)+pair(100,sub);
 const line=(x1,y1,x2,y2,l)=>start('LINE',l,'AcDbLine')+pair(10,fmt(x1*f))+pair(20,fmt(y1*f))+pair(30,0)+pair(11,fmt(x2*f))+pair(21,fmt(y2*f))+pair(31,0);
 for(const e of geometry(kind,unit)){
  const l=e.layer||'ANNOTATION';
  if(e.type==='rect')out+=line(e.x,e.y,e.x+e.w,e.y,l)+line(e.x+e.w,e.y,e.x+e.w,e.y+e.h,l)+line(e.x+e.w,e.y+e.h,e.x,e.y+e.h,l)+line(e.x,e.y+e.h,e.x,e.y,l);
  if(e.type==='line')out+=line(e.x,e.y,e.x2,e.y2,l);
  if(e.type==='arc')out+=start('ARC',l,'AcDbCircle')+pair(10,fmt(e.x*f))+pair(20,fmt(e.y*f))+pair(30,0)+pair(40,fmt(e.r*f))+pair(100,'AcDbArc')+pair(50,e.start)+pair(51,e.end);
  if(e.type==='circle')out+=start('CIRCLE',l,'AcDbCircle')+pair(10,fmt(e.x*f))+pair(20,fmt(e.y*f))+pair(30,0)+pair(40,fmt(e.r*f));
  if(e.type==='text')out+=start('TEXT',l,'AcDbText')+pair(10,fmt(e.x*f))+pair(20,fmt(e.y*f))+pair(30,0)+pair(40,fmt(e.height*f))+pair(1,e.value.replace(/[^\x20-\x7E]/g,'?'))+pair(7,'Standard')+pair(100,'AcDbText');
 }
 return base.before+out+base.after;
}
function svg(kind,unit){
 const g=geometry(kind,unit);const f=units[unit].factor;
 const esc=(s)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const minX=Math.min(0,...g.map(e=>e.x-(e.r||0)))-1;
 const maxX=Math.max(...g.map(e=>e.x+(e.w||e.r||0)+(e.type==='text'?e.value.length*e.height*.58:0)))+1;
 const minY=Math.min(...g.map(e=>e.y-(e.r||0)))-1;
 const maxY=Math.max(...g.map(e=>e.y+(e.h||e.r||e.height||0)))+1;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fmt(minX*f)} ${fmt(-maxY*f)} ${fmt((maxX-minX)*f)} ${fmt((maxY-minY)*f)}"><title>${kind} reference in ${unit}</title><desc>One SVG user unit equals one ${units[unit].label} drawing unit. See accompanying DXF and evidence for assumptions.</desc>`;
 for(const e of g){
  const color=e.layer==='TARGET'?'#777':'#111';
  if(e.type==='line')s+=`<path d="M${fmt(e.x*f)} ${fmt(-e.y*f)}L${fmt(e.x2*f)} ${fmt(-e.y2*f)}" fill="none" stroke="${color}" stroke-width="${fmt(.015*f)}"/>`;
  if(e.type==='arc'){
   const a=e.start*Math.PI/180,b=e.end*Math.PI/180;
   s+=`<path d="M${fmt((e.x+e.r*Math.cos(a))*f)} ${fmt(-(e.y+e.r*Math.sin(a))*f)}A${fmt(e.r*f)} ${fmt(e.r*f)} 0 ${e.end-e.start>180?1:0} 0 ${fmt((e.x+e.r*Math.cos(b))*f)} ${fmt(-(e.y+e.r*Math.sin(b))*f)}" fill="none" stroke="${color}" stroke-width="${fmt(.015*f)}"/>`;
  }
  if(e.type==='circle')s+=`<circle cx="${fmt(e.x*f)}" cy="${fmt(-e.y*f)}" r="${fmt(e.r*f)}" fill="none" stroke="${color}" stroke-width="${fmt(.015*f)}"/>`;
  if(e.type==='rect')s+=`<rect x="${fmt(e.x*f)}" y="${fmt(-(e.y+e.h)*f)}" width="${fmt(e.w*f)}" height="${fmt(e.h*f)}" fill="none" stroke="${color}" stroke-width="${fmt(.015*f)}"/>`;
  if(e.type==='text')s+=`<text x="${fmt(e.x*f)}" y="${fmt(-e.y*f)}" font-family="Arial,sans-serif" font-size="${fmt(e.height*f)}">${esc(e.value)}</text>`;
 }
 return s+'</svg>\n';
}
root.MitoitusCAD={units,geometry,dxf,svg};
if(typeof module!=='undefined')module.exports=root.MitoitusCAD;
})(globalThis);
