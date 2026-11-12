import {createSceneHost} from './viewer.js';
import {ROOT_RECIPE} from './registry.js';

/** Root-panel adapter. Static figures stay in place for fallback and printing. */
export function createBookViewer({drawing,onCameraChange}) {
  const fallback=[...drawing.children];
  const frame=document.createElement('section');frame.className='scene-host';frame.setAttribute('aria-label','Rooting volume diorama');
  frame.innerHTML='<div class="scene-toolbar" role="group" aria-label="Model view"><button data-camera="iso">3D</button><button data-camera="plan">Plan</button><button data-camera="front">Front</button><button data-reset>Reset</button></div><div class="scene-viewport" tabindex="0" role="group" aria-label="Interactive rooting-volume model: soil 5 by 5 metres, 1 metre deep, 25 cubic metres. Arrow keys orbit, plus and minus zoom, Home resets."><canvas aria-hidden="true"></canvas><svg aria-hidden="true"></svg></div><div class="scene-options"><label><input type="checkbox" data-dimensions checked> Dimensions</label><label><input type="checkbox" data-callouts checked> Callouts</label><span data-hint></span></div>';
  const provenance=document.createElement('p');provenance.className='source-meta scene-provenance';
  provenance.textContent='Diorama artwork: assistant draft. '+ROOT_RECIPE.assumptions.join(' ')+' The soil block is an illustration of volume, not a prescribed planting pit.';
  frame.append(provenance);
  const status=document.createElement('p');status.className='scene-status';status.setAttribute('role','status');status.hidden=true;
  drawing.append(frame,status);
  const viewport=frame.querySelector('.scene-viewport'),canvas=frame.querySelector('canvas'),overlay=frame.querySelector('svg');
  frame.querySelector('[data-hint]').textContent=matchMedia('(pointer: coarse)').matches?'Two fingers to orbit / zoom':'Drag to orbit · scroll to zoom';
  let active=false,failed=false,host;
  function availability(available) {
    const live=active&&available;
    frame.hidden=!live;status.hidden=!active||available;
    status.textContent=available?'':'3D is unavailable. The reference drawing is shown.';
    for(const element of fallback)element.classList.toggle('scene-fallback-hidden',live);
    drawing.dataset.live=String(live);
    if(live){viewport.tabIndex=0;if(drawing.ownerDocument.activeElement===drawing)viewport.focus({preventScroll:true});}
  }
  try{host=createSceneHost({canvas,overlay,viewport,onCameraChange:camera=>{for(const button of frame.querySelectorAll('[data-camera]'))button.setAttribute('aria-pressed',String(button.dataset.camera===camera));onCameraChange(camera);},onAvailability:availability});}
  catch(error){failed=true;availability(false);}
  const listeners=[];
  function listen(element,type,handler){element.addEventListener(type,handler);listeners.push(()=>element.removeEventListener(type,handler));}
  for(const button of frame.querySelectorAll('[data-camera]'))listen(button,'click',()=>host?.setCamera(button.dataset.camera));
  listen(frame.querySelector('[data-reset]'),'click',()=>host?.reset());
  for(const input of frame.querySelectorAll('input'))listen(input,'change',()=>host?.setAnnotations({dimensions:frame.querySelector('input[data-dimensions]').checked,callouts:frame.querySelector('input[data-callouts]').checked}));
  return {
    show({camera='iso',style='paper'}={}) {
      active=true;frame.hidden=failed;
      for(const button of frame.querySelectorAll('[data-camera]'))button.setAttribute('aria-pressed',String(button.dataset.camera===camera));
      if(failed){availability(false);return;}
      host.show({recipeId:'trees--v0',camera,style});
    },
    suspend(){active=false;host?.suspend();availability(false);},
    inspect:()=>host?.inspect()||{failed:true,active:false},
    dispose(){active=false;listeners.forEach(remove=>remove());host?.dispose();fallback.forEach(el=>el.classList.remove('scene-fallback-hidden'));frame.remove();status.remove();},
  };
}
