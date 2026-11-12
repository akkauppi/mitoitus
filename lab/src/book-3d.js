import {createSceneHost} from './viewer.js';
import {recipeInfo} from './registry.js';

/** One movable host; canonical figures and variant controls remain in each panel. */
export function createBookViewer({drawing:initialDrawing,onCameraChange}) {
  let drawing=initialDrawing,fallback=[],active=false,failed=false,host;
  const frame=document.createElement('section');frame.className='scene-host';
  frame.innerHTML='<p class="scene-case"></p><div class="scene-toolbar" role="group" aria-label="Model view"><button data-camera="iso">3D</button><button data-camera="plan">Plan</button><button data-camera="front">Front</button><button data-reset>Reset</button></div><div class="scene-viewport" tabindex="0" role="group"><canvas aria-hidden="true"></canvas><svg aria-hidden="true"></svg></div><div class="scene-options"><label><input type="checkbox" data-dimensions checked> Dimensions</label><label><input type="checkbox" data-callouts checked> Callouts</label><span data-hint></span></div>';
  const provenance=document.createElement('p');provenance.className='source-meta scene-provenance';frame.append(provenance);
  const companion=document.createElement('div');companion.className='scene-companion';companion.hidden=true;frame.append(companion);
  const status=document.createElement('p');status.className='scene-status';status.setAttribute('role','status');status.hidden=true;
  const viewport=frame.querySelector('.scene-viewport'),canvas=frame.querySelector('canvas'),overlay=frame.querySelector('svg');
  frame.querySelector('[data-hint]').textContent=matchMedia('(pointer: coarse)').matches?'Two fingers to orbit / zoom':'Drag to orbit · scroll to zoom';
  function restoreFallback(){fallback.forEach(el=>el.classList.remove('scene-fallback-hidden'));if(drawing)drawing.dataset.live='false';}
  function attach(next){restoreFallback();drawing=next;fallback=[...drawing.querySelectorAll('figure')];drawing.append(frame,status);}
  attach(drawing);
  function availability(available){
    const live=active&&available;frame.hidden=!live;status.hidden=!active||available;
    status.textContent=available?'':'3D is unavailable. The reference drawing is shown.';
    fallback.forEach(el=>el.classList.toggle('scene-fallback-hidden',live));drawing.dataset.live=String(live);
    if(live&&drawing.ownerDocument.activeElement===drawing)viewport.focus({preventScroll:true});
  }
  try{host=createSceneHost({canvas,overlay,viewport,onCameraChange:camera=>{onCameraChange(camera);},onAvailability:availability});}
  catch(error){failed=true;availability(false);}
  const listeners=[];
  function listen(el,type,handler){el.addEventListener(type,handler);listeners.push(()=>el.removeEventListener(type,handler));}
  for(const button of frame.querySelectorAll('[data-camera]'))listen(button,'click',()=>host?.setCamera(button.dataset.camera));
  listen(frame.querySelector('[data-reset]'),'click',()=>host?.reset());
  for(const input of frame.querySelectorAll('input'))listen(input,'change',()=>host?.setAnnotations({dimensions:frame.querySelector('input[data-dimensions]').checked,callouts:frame.querySelector('input[data-callouts]').checked}));
  return {
    show({drawing:next=drawing,recipeId='trees--v0',camera='iso',style='paper'}={}){
      if(next!==drawing)attach(next);
      const recipe=recipeInfo(recipeId);active=true;frame.hidden=failed;
      const selected=drawing.querySelector('[data-variant]:not([hidden]) svg .sub')||drawing.querySelector('figure svg .sub');
      frame.querySelector('.scene-case').textContent=selected?.textContent||'';
      frame.querySelector('.scene-case').hidden=!selected;

      companion.replaceChildren();companion.hidden=!recipe.retainedTextSelector;
      if(recipe.retainedTextSelector)for(const original of drawing.querySelectorAll(recipe.retainedTextSelector)){if(original===selected)continue;const p=document.createElement('p');p.textContent=original.textContent;companion.append(p);}
      frame.setAttribute('aria-label',`${recipe.panelId} diorama`);
      viewport.setAttribute('aria-label',(recipe.description||'Soil 5 by 5 metres, 1 metre deep, 25 cubic metres.')+' Arrow keys orbit, plus/minus zoom, Home resets.');
      provenance.textContent='Diorama artwork: assistant draft. '+recipe.assumptions.join(' ');
      for(const button of frame.querySelectorAll('[data-camera]')){button.hidden=!recipe.allowedCameras.includes(button.dataset.camera);button.setAttribute('aria-pressed',String(button.dataset.camera===camera));}
      if(failed){availability(false);return;}
      host.show({recipeId,camera,style});
    },
    suspend(){active=false;host?.suspend();availability(false);},
    inspect:()=>host?.inspect()||{failed:true,active:false},
    dispose(){active=false;listeners.forEach(remove=>remove());host?.dispose();restoreFallback();frame.remove();status.remove();},
  };
}
