import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {SCENES,buildScene} from './scenes.js';
import {STYLES} from './styles.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const viewport=$('#viewport'), overlay=$('#overlay'), params=new URLSearchParams(location.search);
let sceneKey=Object.hasOwn(SCENES,params.get('scene'))?params.get('scene'):'street';
let styleKey=Object.hasOwn(STYLES,params.get('style'))?params.get('style'):'paper';
let viewKey=['iso','plan','section'].includes(params.get('view'))?params.get('view'):'iso';
let model,renderer,controls,width=1,height=1,frame=0;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,500);
const ambient=new THREE.HemisphereLight('#fffdf3','#c6cbbf',2.6);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff9eb',2);sun.position.set(-20,35,20);scene.add(sun);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:110});sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;sun.shadow.radius=3;
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.31;floor.receiveShadow=true;scene.add(floor);
function queueRender(){if(renderer&&!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
function urlState(){history.replaceState(null,'','?'+new URLSearchParams({scene:sceneKey,style:styleKey,view:viewKey}));}
function announce(text){$('#announcement').textContent=text;}
function updateText(){
 const meta=SCENES[sceneKey];$('#scene-kicker').textContent='STUDY '+meta.number;$('#scene-title').textContent=meta.name;$('#subtitle').textContent=meta.subtitle;
 $('#measurements').replaceChildren(...meta.rows.map(([key,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;div.append(dt,dd);return div;}));
 $('#source-note').textContent=meta.note;$('#scene-description').textContent=meta.description;viewport.setAttribute('aria-describedby','scene-description');
 $('#source-links').replaceChildren(...meta.sources.map(([title,anchor])=>{const li=document.createElement('li'),a=document.createElement('a');a.textContent=title+' ↗';a.href='../evidence.html#'+anchor;a.target='_blank';a.rel='noopener';li.append(a);return li;}));
 $$('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===sceneKey)));
}
function dispose(group){const gs=new Set(),ms=new Set();group.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
function setScene(key){sceneKey=key;if(model){scene.remove(model.group);dispose(model.group);}model=buildScene(key);scene.add(model.group);floor.position.y=key==='street'?-.98:-1.31;updateText();setStyle(styleKey);setView(viewKey);urlState();announce(SCENES[key].name);}
function setStyle(key){
 styleKey=key;const style=STYLES[key];scene.background=new THREE.Color(style.background);$('.drawing').style.background=style.background;
 const old=new Set(),materials=new Map();model?.group.traverse(o=>{
  if(o.isMesh){old.add(o.material);const role=o.userData.role||'paving';if(!materials.has(role)){const config={color:style.colours[role]||style.colours.paving,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1};materials.set(role,style.light?new THREE.MeshLambertMaterial({...config,flatShading:true}):new THREE.MeshBasicMaterial(config));}o.material=materials.get(role);o.castShadow=true;o.receiveShadow=true;}
  if(o.userData.edge){o.material.color.set(style.edge);o.material.opacity=style.edgeOpacity;o.material.transparent=true;}
 });old.forEach(m=>m.dispose());ambient.intensity=key==='soft'?2.1:2.8;sun.intensity=key==='soft'?2.5:1.1;
 if(renderer)renderer.shadowMap.enabled=style.shadows;floor.visible=style.shadows;
 $$('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===key)));$('#style-note').textContent=style.description;urlState();queueRender();
}
function setView(key){
 viewKey=key;const meta=SCENES[sceneKey],t=new THREE.Vector3(...meta.target);camera.up.set(0,1,0);
 let direction=meta.camera;if(key==='plan'){direction=[0,1,.0001];camera.up.set(0,0,-1);}if(key==='section')direction=[0,.001,1];
 camera.position.copy(t).add(new THREE.Vector3(...direction).normalize().multiplyScalar(80));camera.lookAt(t);camera.zoom=1;
 if(controls){controls.target.copy(t);controls.update();}fit();$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));urlState();queueRender();
}
function fit(){
 if(!model)return;camera.updateMatrixWorld();const bounds=new THREE.Box3().setFromObject(model.group),pts=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])pts.push(new THREE.Vector3(x,y,z));
 for(const d of model.dimensions)for(const p of [d.a,d.b])pts.push(new THREE.Vector3(...p).add(new THREE.Vector3(...d.offset)));
 const b=new THREE.Box3().setFromPoints(pts.map(p=>p.applyMatrix4(camera.matrixWorldInverse)));
 const maxX=Math.max(Math.abs(b.min.x),Math.abs(b.max.x)),maxY=Math.max(Math.abs(b.min.y),Math.abs(b.max.y));
 const halfH=Math.max(maxY,maxX*height/width)*(width<500?1.2:1.16);camera.top=halfH;camera.bottom=-halfH;camera.left=-halfH*width/height;camera.right=halfH*width/height;camera.updateProjectionMatrix();
}
function resize(){width=viewport.clientWidth;height=viewport.clientHeight;if(!renderer)return;renderer.setSize(width,height,false);overlay.setAttribute('viewBox',`0 0 ${width} ${height}`);fit();queueRender();}
const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs={},text){const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function project(point){const v=new THREE.Vector3(...point).project(camera);return{x:(v.x+1)*width/2,y:(1-v.y)*height/2,z:v.z};}
function line(a,b,cls){overlay.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:cls}));}
function annotations(){
 overlay.replaceChildren();const occupied=[];
 function label(text,p,kind){
  const w=text.length*(kind==='dim'?6.4:5.6)+14,h=22;let x=Math.max(w/2+6,Math.min(width-w/2-6,p.x)),y=Math.max(15,Math.min(height-15,p.y));
  let attempts=0;const intersects=()=>occupied.some(r=>Math.abs(r.x-x)<(r.w+w)/2+3&&Math.abs(r.y-y)<(r.h+h)/2+3);
  while(intersects()&&attempts<12){y+=y<height*.55?25:-25;y=Math.max(15,Math.min(height-15,y));attempts++;}occupied.push({x,y,w,h});
  if(Math.hypot(x-p.x,y-p.y)>12)line(p,{x,y},'leader');overlay.append(svg('rect',{x:x-w/2,y:y-11,width:w,height:h,class:'label-bg'}));overlay.append(svg('text',{x,y:y+4,'text-anchor':'middle',class:kind==='dim'?'dim-label':'scene-label'},text));
 }
 if($('#dimensions').checked)for(const d of model.dimensions){
  const a=project(d.a),b=project(d.b),off=new THREE.Vector3(...d.offset),aa=project(new THREE.Vector3(...d.a).add(off).toArray()),bb=project(new THREE.Vector3(...d.b).add(off).toArray());
  const length=Math.hypot(bb.x-aa.x,bb.y-aa.y);if(length<3)continue;line(a,aa,'extension-line');line(b,bb,'extension-line');line(aa,bb,'dimension-line');
  const ux=(bb.x-aa.x)/length,uy=(bb.y-aa.y)/length;for(const p of [aa,bb])line({x:p.x-3*(ux-uy),y:p.y-3*(uy+ux)},{x:p.x+3*(ux-uy),y:p.y+3*(uy+ux)},'dimension-line');label(d.label,{x:(aa.x+bb.x)/2,y:(aa.y+bb.y)/2},'dim');
 }
 if($('#labels').checked)for(const l of model.labels){const p=project(l.point);if(p.z<-1||p.z>1||p.x<0||p.x>width||p.y<0||p.y>height)continue;const dest={x:p.x,y:p.y-24};line(p,dest,'leader');label(l.text,dest,'scene');}
}
function render(){camera.updateMatrixWorld();renderer.render(scene,camera);annotations();document.body.dataset.ready='true';document.body.dataset.drawCalls=renderer.info.render.calls;}
function exportSVG(){
 const vector=new SVGRenderer();vector.setSize(width,height);vector.setQuality('high');const wasFloor=floor.visible;floor.visible=false;vector.render(scene,camera);floor.visible=wasFloor;
 const out=vector.domElement;out.setAttribute('xmlns',ns);out.setAttribute('role','img');out.prepend(svg('title',{},SCENES[sceneKey].name+' — '+STYLES[styleKey].name));
 const group=svg('g',{transform:`translate(${-width/2} ${-height/2})`});for(const el of overlay.children){const clone=el.cloneNode(true);for(const attr of ['fill','fill-opacity','stroke','stroke-width','font-family','font-size','font-weight','paint-order','stroke-linejoin'])clone.style.setProperty(attr,getComputedStyle(el).getPropertyValue(attr));group.append(clone);}out.append(group);
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(out)],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download=`mitoitus-${sceneKey}-${styleKey}-${viewKey}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Vector drawing exported.');
}
updateText();
try{
 renderer=new THREE.WebGLRenderer({canvas:$('#canvas'),antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.minZoom=.65;controls.maxZoom=3;controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI/2-.005;controls.addEventListener('change',queueRender);
 controls.touches.ONE=null;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;renderer.domElement.style.touchAction='pan-y';
 setScene(sceneKey);new ResizeObserver(resize).observe(viewport);resize();$('#loading').hidden=true;
 $('#canvas').addEventListener('webglcontextlost',e=>{e.preventDefault();$('#fallback').hidden=false;});$('#canvas').addEventListener('webglcontextrestored',()=>{$('#fallback').hidden=true;queueRender();});
}catch(error){$('#loading').hidden=true;$('#fallback').hidden=false;$('#export').disabled=true;$('#reset').disabled=true;console.error(error);}
$$('[data-scene]').forEach(b=>b.addEventListener('click',()=>{if(renderer)setScene(b.dataset.scene);else{sceneKey=b.dataset.scene;updateText();}}));
$$('[data-style]').forEach(b=>b.addEventListener('click',()=>{if(renderer)setStyle(b.dataset.style);}));$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(renderer)setView(b.dataset.view);}));
$('#reset').addEventListener('click',()=>setView('iso'));$('#export').addEventListener('click',exportSVG);$('#dimensions').addEventListener('change',queueRender);$('#labels').addEventListener('change',queueRender);
viewport.addEventListener('keydown',e=>{
 if(!renderer)return;const spherical=new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(camera.position,controls.target));
 if(e.key==='Home')setView('iso');else if(e.key==='+'||e.key==='='){camera.zoom=Math.min(3,camera.zoom*1.1);camera.updateProjectionMatrix();}else if(e.key==='-'){camera.zoom=Math.max(.65,camera.zoom/1.1);camera.updateProjectionMatrix();}
 else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){spherical.theta+=(e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0);spherical.phi=Math.max(.03,Math.min(Math.PI/2-.01,spherical.phi+(e.key==='ArrowUp'?-.1:e.key==='ArrowDown'?.1:0)));camera.up.set(0,1,0);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));camera.lookAt(controls.target);}else return;e.preventDefault();controls.update();queueRender();
});
window.addEventListener('pagehide',()=>{controls?.dispose();if(model)dispose(model.group);renderer?.dispose();});
