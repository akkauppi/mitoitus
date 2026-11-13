import * as THREE from 'three';
import {layoutCallouts} from '../callouts.js';
/** Numeric measures recede with the drawing; named callouts keep their own type. */
export function dimensionFontSize(width){
 return Math.max(5.5,Math.min(11,6.5+(Math.max(0,width)-320)*4/580));
}
/** Remove line intervals occupied by text; glyph backgrounds stay transparent. */
export function trimLine(a,b,rectangles){
 const dx=b.x-a.x,dy=b.y-a.y;if(Math.hypot(dx,dy)<1e-8)return [];
 const intervals=[];
 for(const r of rectangles){
  let lo=0,hi=1,hit=true;
  for(const [origin,delta,min,max]of [[a.x,dx,r.left,r.right],[a.y,dy,r.top,r.bottom]]){
   if(Math.abs(delta)<1e-10){if(origin<min||origin>max){hit=false;break;}}
   else{let p=(min-origin)/delta,q=(max-origin)/delta;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi){hit=false;break;}}
  }
  if(hit)intervals.push([lo,hi]);
 }
 intervals.sort((x,y)=>x[0]-y[0]);let cursor=0;const result=[];
 const point=t=>({x:a.x+t*dx,y:a.y+t*dy});
 for(const [lo,hi]of intervals){if(lo>cursor+1e-8)result.push([point(cursor),point(lo)]);cursor=Math.max(cursor,hi);}
 if(cursor<1-1e-8)result.push([point(cursor),point(1)]);return result;
}
export function drawAnnotations({overlay,canvas,viewport,camera,model,width,height,dimensions,labels,imageBounds}) {
const ns='http://www.w3.org/2000/svg';
const dimensionSize=dimensionFontSize(width);
overlay.style.setProperty('--dimension-font-size',`${dimensionSize}px`);
function svg(tag,attrs={},text){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function project(point){const v=new THREE.Vector3(...point).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,z:v.z};}
const pending=[];
function line(a,b,cls,measure=false){pending.push({a,b,cls,measure});}
function annotations(){
 overlay.replaceChildren();const occupied=[];
 function label(text,p,kind){
  const node=svg('text',{x:0,y:0,'text-anchor':'middle',class:kind==='dim'?'dim-label':'scene-label'},text);overlay.append(node);
  const glyph=node.getBBox(),font=kind==='dim'?dimensionSize:11,pad=Math.max(1,font*.18),gap=Math.max(1.2,font*.2);
  const w=glyph.width+pad*2,h=glyph.height+pad*2,edge=Math.max(2,font*.25),pitch=h+gap;
  const minY=h/2+edge,maxY=height-minY;
  let x=Math.max(w/2+edge,Math.min(width-w/2-edge,p.x)),y=Math.max(minY,Math.min(maxY,p.y));
  const preferred=y,candidates=[preferred];for(let k=1;k<Math.ceil(height/pitch);k++)candidates.push(preferred+k*pitch,preferred-k*pitch);
  const free=candidates.find(c=>c>=minY&&c<=maxY&&!occupied.some(r=>Math.abs(r.x-x)<(r.w+w)/2+gap&&Math.abs(r.y-c)<(r.h+h)/2+gap));
  if(free===undefined){node.remove();return;} y=free;occupied.push({x,y,w,h});
  if(Math.hypot(x-p.x,y-p.y)>font*1.3)line(p,{x,y},'leader');
  node.setAttribute('x',x);node.setAttribute('y',y-glyph.y-glyph.height/2);
 }
 if(labels){
  const narrow=width<650,clipLeft=narrow?0:148,clipRight=narrow?124:148;
  canvas.style.clipPath=`inset(0 ${clipRight}px 0 ${clipLeft}px)`;
  const b=imageBounds();const bounds={left:Math.max(clipLeft,b.left),right:Math.min(width-clipRight,b.right),top:Math.max(0,b.top),bottom:Math.min(height,b.bottom)};
  const anchors=model.labels.map((l,i)=>({...project(l.point),id:String(i),text:l.text})).filter(p=>p.z>=-1&&p.z<=1&&p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.top&&p.y<=bounds.bottom);
  viewport.dataset.visibleAnchors=String(anchors.length);
  const layout=layoutCallouts({anchors,bounds,width,height,labelWidth:narrow?92:110,labelHeight:24,gap:narrow?12:16,padding:narrow?8:14});
  overlay.dataset.calloutStatus=layout.status;overlay.dataset.calloutMode=layout.mode;
  // Diagnostic geometry also drives independent browser acceptance checks.
  viewport.dataset.callouts=JSON.stringify({items:layout.items,bounds,width,height});
  for(const item of layout.items){
   const group=svg('g',{'data-callout':item.id});group.append(svg('polyline',{points:item.points.map(p=>`${p.x},${p.y}`).join(' '),class:'callout-leader'}));
   const end=item.points[2];group.append(svg('circle',{cx:end.x,cy:end.y,r:2.6,class:'callout-dot'}));
   const r=item.label;occupied.push({x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height});
   const x=item.side==='left'?r.x+r.width:r.x;
   group.append(svg('text',{x,y:r.y+r.height/2+4,'text-anchor':item.side==='left'?'end':'start',class:'scene-label callout-text'},item.text));overlay.append(group);
  }
 }else{canvas.style.clipPath='none';overlay.dataset.calloutStatus='off';viewport.dataset.callouts='';}
 if(dimensions)for(const d of model.dimensions){
  const a=project(d.a),b=project(d.b),off=new THREE.Vector3(...d.offset),aa=project(new THREE.Vector3(...d.a).add(off).toArray()),bb=project(new THREE.Vector3(...d.b).add(off).toArray());
  const length=Math.hypot(bb.x-aa.x,bb.y-aa.y);if(length<.5)continue;line(a,aa,'extension-line');line(b,bb,'extension-line');line(aa,bb,'dimension-line',true);
  const ux=(bb.x-aa.x)/length,uy=(bb.y-aa.y)/length;for(const p of [aa,bb])line({x:p.x-3*(ux-uy),y:p.y-3*(uy+ux)},{x:p.x+3*(ux-uy),y:p.y+3*(uy+ux)},'dimension-line');label(d.label,{x:(aa.x+bb.x)/2+(d.labelOffsetPx?.[0]||0),y:(aa.y+bb.y)/2+(length<20?dimensionSize*1.6:0)+(d.labelOffsetPx?.[1]||0)},'dim');
 }

}

annotations();
// Measure actual text glyphs after layout, rather than placing opaque patches.
const rectangles=[...overlay.querySelectorAll('text')].map(el=>{const b=el.getBBox(),dim=el.classList.contains('dim-label'),padX=dim?Math.max(.8,dimensionSize*.15):3,padY=dim?Math.max(.6,dimensionSize*.12):2;return{left:b.x-padX,right:b.x+b.width+padX,top:b.y-padY,bottom:b.y+b.height+padY};});
const lines=overlay.ownerDocument.createDocumentFragment();
for(const command of pending){
 const parent=command.measure?svg('g',{class:'dimension-measure','data-a':JSON.stringify(command.a),'data-b':JSON.stringify(command.b)}):svg('g');
 for(const [a,b]of trimLine(command.a,command.b,rectangles))parent.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:command.cls}));
 lines.append(parent);
}
overlay.insertBefore(lines,overlay.firstChild);
}
