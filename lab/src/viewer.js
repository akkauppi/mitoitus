import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {STYLES} from '../styles.js';
import {createRecipe} from './registry.js';
import {drawAnnotations} from './annotations.js';

function disposeObject(group) {
  const geometries=new Set(),materials=new Set();
  group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

/** One context, caller-owned DOM, change-driven rendering. No document selectors. */
export function createSceneHost({canvas,overlay,viewport,onCameraChange=()=>{},onAvailability=()=>{}}) {
  let model=null,active=false,disposed=false,lost=false,frame=0,width=1,height=1;
  let dimensions=true,labels=true,cameraKey='iso',styleKey='paper';
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,500);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const ambient=new THREE.HemisphereLight('#fffdf3','#c6cbbf',2.8);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff9eb',1.1);sun.position.set(-20,35,20);scene.add(sun);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:100});
  sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.12}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.31;floor.receiveShadow=true;scene.add(floor);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=false;controls.enablePan=false;
  controls.minZoom=.65;controls.maxZoom=3;
  controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI/2-.005;
  controls.touches.ONE=null;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;canvas.style.touchAction='pan-y';
  const diagnostics={renders:0,shows:0,suspends:0,disposed:false,active:false};
  function queue(){if(active&&!disposed&&!lost&&!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
  controls.addEventListener('change',queue);
  function bounds(includeDimensions=false) {
    camera.updateMatrixWorld();model.group.updateMatrixWorld(true);
    if(includeDimensions&&model.comparison){
      const b=model.comparison.bounds,result=new THREE.Box3();
      for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])
        result.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
      return result;
    }
    const result=new THREE.Box3();
    model.group.traverseVisible(o=>{
      if(!o.isMesh&&!o.userData.envelope)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])
        result.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(o.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
    });
    if(includeDimensions)for(const d of model.dimensions)for(const p of [d.a,d.b])
      result.expandByPoint(new THREE.Vector3(...p).add(new THREE.Vector3(...d.offset)).applyMatrix4(camera.matrixWorldInverse));
    return result;
  }
  function fit() {
    const b=bounds(true),narrow=width<650,gutter=narrow?124:148;
    let left=labels?(narrow?18:gutter):30;const right=labels?gutter:30,top=40,bottom=48;
    if(narrow&&model.recipe.heightDimensionsOpposite)left=Math.max(left,44);
    const scale=Math.min(Math.max(40,width-left-right)/(b.max.x-b.min.x),Math.max(40,height-top-bottom)/(b.max.y-b.min.y));
    const cx=(b.min.x+b.max.x)/2,cy=(b.min.y+b.max.y)/2;
    camera.left=cx-(left+(width-left-right)/2)/scale;camera.right=camera.left+width/scale;
    camera.top=cy+(top+(height-top-bottom)/2)/scale;camera.bottom=camera.top-height/scale;camera.updateProjectionMatrix();
  }
  function imageBounds() {
    const b=bounds();const a=new THREE.Vector3(b.min.x,b.max.y,0).applyMatrix4(camera.projectionMatrix);
    const c=new THREE.Vector3(b.max.x,b.min.y,0).applyMatrix4(camera.projectionMatrix);
    return {left:(a.x+1)*width/2,right:(c.x+1)*width/2,top:(1-a.y)*height/2,bottom:(1-c.y)*height/2};
  }
  function render() {
    if(!model||!active||lost||disposed)return;
    fit();camera.updateMatrixWorld();renderer.render(scene,camera);
    drawAnnotations({overlay,canvas,viewport,camera,model,width,height,dimensions,labels,imageBounds});
    diagnostics.renders++;diagnostics.active=true;
    viewport.dataset.sceneReady='true';viewport.dataset.renderCount=String(diagnostics.renders);
    viewport.dataset.geometryCount=String(renderer.info.memory.geometries);
    viewport.dataset.cameraPosition=JSON.stringify(camera.position.toArray());
    viewport.dataset.recipe=model.recipe.id;
    viewport.dataset.section=JSON.stringify(model.recipe.cutViews?.includes(cameraKey)?(model.sections||[]).map(s=>s.userData.section):[]);
    viewport.dataset.comparisonFrame=JSON.stringify([camera.left,camera.right,camera.top,camera.bottom,camera.zoom]);
    if(model.measurement?.width){const d=model.dimensions[0],a=new THREE.Vector3(...d.a).project(camera),b=new THREE.Vector3(...d.b).project(camera);
      viewport.dataset.projectedWidth=String(Math.hypot((a.x-b.x)*width/2,(a.y-b.y)*height/2));}else delete viewport.dataset.projectedWidth;
    onAvailability(true);
  }
  function resize({width:w=viewport.clientWidth,height:h=viewport.clientHeight,pixelRatio=devicePixelRatio}={}) {
    if(disposed)return;model?.layout?.(w<650);width=Math.max(1,w);height=Math.max(1,h);
    renderer.setPixelRatio(Math.min(pixelRatio,2));renderer.setSize(width,height,false);
    overlay.setAttribute('viewBox',`0 0 ${width} ${height}`);queue();
  }
  const observer=new ResizeObserver(()=>resize());
  function setCamera(key,notify=false) {
    if(!model)return;
    cameraKey=model.recipe.allowedCameras.includes(key)?key:model.recipe.defaultCamera;
    model.applyView?.(cameraKey);controls.enableRotate=!model.recipe.fixedPlan;
    controls.maxPolarAngle=cameraKey==='section'?Math.PI/2:Math.PI/2-.005;controls.minPolarAngle=model.recipe.fixedPlan?0:.001;
    const target=new THREE.Vector3(...model.meta.target);camera.up.set(0,1,0);
    let direction=model.meta.camera;
    if(cameraKey==='plan'){direction=model.recipe.fixedPlan?[0,1,0]:[0,1,.0001];camera.up.set(0,0,-1);}
    if(cameraKey==='front')direction=[0,.001,1];
    if(cameraKey==='section')direction=[0,0,1];
    camera.position.copy(target).add(new THREE.Vector3(...direction).normalize().multiplyScalar(80));
    camera.lookAt(target);camera.zoom=1;controls.target.copy(target);controls.update();queue();
    if(notify)onCameraChange(cameraKey);
  }
  function setStyle(key) {
    styleKey=Object.hasOwn(STYLES,key)?key:'paper';const style=STYLES[styleKey];
    scene.background=new THREE.Color(style.background);viewport.style.background=style.background;
    const previous=new Set(),materials=new Map();
    model.group.traverse(o=>{
      if(o.isMesh){previous.add(o.material);const role=o.userData.role||'paving';
        if(!materials.has(role)){const config={color:style.colours[role],polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1};
          materials.set(role,style.light?new THREE.MeshLambertMaterial({...config,flatShading:true}):new THREE.MeshBasicMaterial(config));}
        o.material=materials.get(role);o.castShadow=true;o.receiveShadow=true;}
      if(o.userData.envelope)o.material.color.set(style.colours.metal);
      if(o.userData.edge||o.userData.sectionHatch){o.material.color.set(style.edge);o.material.opacity=style.edgeOpacity*(o.userData.sectionHatch ? .45 : 1);o.material.transparent=true;}
    });previous.forEach(m=>m.dispose());
    ambient.intensity=styleKey==='soft'?2.1:2.8;sun.intensity=styleKey==='soft'?2.5:1.1;
    renderer.shadowMap.enabled=style.shadows&&!model.recipe.noShadows;floor.visible=renderer.shadowMap.enabled;queue();
  }
  function releaseModel(){if(model){scene.remove(model.group);disposeObject(model.group);model=null;}renderer.renderLists.dispose();}
  function show({recipeId,camera:requestedCamera='iso',style='paper'}) {
    if(disposed)throw new Error('Scene host disposed');
    const same=model?.recipe.id===recipeId;
    const previousGroup=model?.comparison?.id;
    if(!same){releaseModel();model=createRecipe(recipeId);scene.add(model.group);floor.position.y=new THREE.Box3().setFromObject(model.group).min.y-.02;}
    active=true;controls.enabled=!lost;diagnostics.shows++;diagnostics.active=true;
    observer.observe(viewport);
    if(!same||style!==styleKey)setStyle(style);
    if((!same&&(!previousGroup||previousGroup!==model.comparison?.id))||requestedCamera!==cameraKey)setCamera(requestedCamera);
    resize();queue();
  }
  function suspend() {
    if(disposed)return;active=false;diagnostics.active=false;diagnostics.suspends++;
    observer.disconnect();controls.enabled=false;if(frame)cancelAnimationFrame(frame);frame=0;
    releaseModel();overlay.replaceChildren();delete viewport.dataset.sceneReady;viewport.dataset.geometryCount=String(renderer.info.memory.geometries);
  }
  function keydown(event) {
    if(!active||lost||!model||event.target!==viewport)return;
    const spherical=new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(camera.position,controls.target));
    if(event.key==='Home')setCamera(model.recipe.defaultCamera,true);
    else if(event.key==='+'||event.key==='=')camera.zoom=Math.min(3,camera.zoom*1.1);
    else if(event.key==='-')camera.zoom=Math.max(.65,camera.zoom/1.1);
    else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      if(model.recipe.fixedPlan){event.preventDefault();event.stopPropagation();return;}
      spherical.theta+=event.key==='ArrowLeft'?.12:event.key==='ArrowRight'?-.12:0;
      spherical.phi=Math.max(.03,Math.min(Math.PI/2-.01,spherical.phi+(event.key==='ArrowUp'?-.1:event.key==='ArrowDown'?.1:0)));
      camera.up.set(0,1,0);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));camera.lookAt(controls.target);
    }else return;
    event.preventDefault();event.stopPropagation();camera.updateProjectionMatrix();controls.update();queue();
  }
  function contextLost(event){event.preventDefault();lost=true;controls.enabled=false;if(frame)cancelAnimationFrame(frame);frame=0;onAvailability(false);}
  function contextRestored(){lost=false;controls.enabled=active;onAvailability(true);if(active){resize();queue();}}
  viewport.addEventListener('keydown',keydown);
  canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
  return {
    show,resize,suspend,
    setCamera:key=>setCamera(key,true),
    reset:()=>setCamera(model?.recipe.defaultCamera||'iso',true),
    setAnnotations:settings=>{dimensions=settings.dimensions??dimensions;labels=settings.callouts??labels;queue();},
    inspect:()=>({...diagnostics,camera:cameraKey,style:styleKey,recipe:model?.recipe.id||null,lost,geometries:renderer.info.memory.geometries}),
    dispose(){if(disposed)return;suspend();disposed=true;diagnostics.disposed=true;
      controls.removeEventListener('change',queue);controls.dispose();floor.geometry.dispose();floor.material.dispose();sun.shadow.dispose();
      viewport.removeEventListener('keydown',keydown);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);renderer.dispose();renderer.forceContextLoss();},
  };
}
