import {STYLES} from '../styles.js';
import {createSceneHost} from './viewer.js';
import {recipeInfo} from './registry.js';

/** One movable host; canonical figures and variant controls remain in each panel. */
export function createBookViewer({drawing:initialDrawing,onCameraChange}) {
  let drawing=initialDrawing,fallback=[],active=false,failed=false,host,categoryRecipe=null,categoryDefault=-1;
  const frame=document.createElement('section');frame.className='scene-host';
  frame.innerHTML='<p class="scene-case source-meta"></p><div class="scene-toolbar" role="group" aria-label="Model view"><button data-camera="iso">3D</button><button data-camera="plan">Plan</button><button data-camera="front">Front</button><button data-camera="section">Section</button><button data-reset>Reset</button></div><label class="scene-category" hidden>Compare planting<select aria-label="Planting category"><option value="-1">All four · same scale</option></select></label><div class="scene-viewport" tabindex="0" role="group"><canvas aria-hidden="true"></canvas><svg aria-hidden="true"></svg></div><div class="scene-options"><label><input type="checkbox" data-dimensions checked> Dimensions</label><label><input type="checkbox" data-callouts checked> Callouts</label><span data-hint></span></div>';
  const provenance=document.createElement('p');provenance.className='source-meta scene-provenance';frame.append(provenance);
  const companion=document.createElement('div');companion.className='scene-companion source-meta';companion.hidden=true;frame.append(companion);
  const summary=document.createElement('p');summary.className='scene-summary';summary.hidden=true;frame.append(summary);
  const metric=document.createElement('section');metric.className='metric-companion';metric.hidden=true;frame.append(metric);
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
  listen(frame.querySelector('.scene-category select'),'change',event=>host?.setCategory(Number(event.target.value)));
  listen(frame.querySelector('[data-reset]'),'click',()=>{frame.querySelector('.scene-category select').value=String(categoryDefault);host?.setCategory(categoryDefault);host?.reset();});
  for(const input of frame.querySelectorAll('input'))listen(input,'change',()=>host?.setAnnotations({dimensions:frame.querySelector('input[data-dimensions]').checked,callouts:frame.querySelector('input[data-callouts]').checked}));
  return {
    show({drawing:next=drawing,recipeId='trees--v0',camera='iso',style='paper'}={}){
      if(next!==drawing)attach(next);
      const recipe=recipeInfo(recipeId);active=true;frame.hidden=failed;
      const category=frame.querySelector('.scene-category');category.hidden=!recipe.categoryOptions;
      categoryDefault=recipe.categoryDefault??-1;category.firstChild.textContent=recipe.categoryPrompt||'Compare planting';
      category.querySelector('select').setAttribute('aria-label',recipe.categoryPrompt||'Planting category');
      if(categoryRecipe!==recipeId){categoryRecipe=recipeId;const select=category.querySelector('select');select.replaceChildren();if(categoryDefault===-1)select.add(new Option('All four · same scale','-1'));for(const [i,name]of (recipe.categoryOptions||[]).entries())select.add(new Option(name,String(i)));select.value=String(categoryDefault);}
      frame.querySelector('[data-dimensions]').closest('label').hidden=recipe.kind==='conceptual-3d';
      metric.replaceChildren();metric.hidden=!recipe.metricGraphicSelector;
      if(recipe.metricGraphicSelector){const original=drawing.querySelector(recipe.metricGraphicSelector);if(original){const caption=document.createElement('p');caption.textContent=recipe.metricGraphicCaption;const svg=original.closest('svg').cloneNode(false);svg.setAttribute('viewBox',recipe.metricGraphicViewBox);svg.setAttribute('aria-label',recipe.metricGraphicCaption);for(let node=original;node;node=node.nextElementSibling)svg.append(node.cloneNode(true));metric.append(caption,svg);}}

      frame.style.setProperty('--diagram-building',(STYLES[style]||STYLES.paper).colours.building);
      const selected=drawing.querySelector('[data-variant]:not([hidden]) svg .sub')||drawing.querySelector('figure svg .sub');
      frame.querySelector('.scene-case').textContent=recipe.caseTitle||selected?.textContent||'';
      frame.querySelector('.scene-case').hidden=!(recipe.caseTitle||selected);

      summary.textContent=recipe.quickFact||'';summary.hidden=!recipe.quickFact;
      companion.replaceChildren();companion.hidden=!(recipe.retainedTextSelector||recipe.explanation);
      if(recipe.retainedTextSelector)for(const original of drawing.querySelectorAll(recipe.retainedTextSelector)){if(original===selected)continue;const p=document.createElement('p');p.textContent=original.textContent;companion.append(p);}
      for(const text of recipe.explanation||[]){const p=document.createElement('p');p.textContent=text;companion.append(p);}
      if(recipe.sectionNote&&recipe.cutViews?.includes(camera)){const note=document.createElement('p');note.className='section-explanation';note.textContent=recipe.sectionNote;companion.append(note);companion.hidden=false;}
      if(recipe.floorExamples){
        const schematic=document.createElement('section');schematic.className='floor-schematic';schematic.setAttribute('aria-label','Schematic floor-count diagrams; no vertical metre scale');
        const heading=document.createElement('p');heading.textContent='Schematic floor count · no vertical metre scale';schematic.append(heading);
        const cards=document.createElement('div');cards.className='floor-cards';
        for(const example of recipe.floorExamples){const card=document.createElement('div'),stack=document.createElement('div');card.className='floor-card';stack.className='floor-stack';stack.dataset.floors=example.floors;
          for(let i=0;i<example.floors;i++){const plate=document.createElement('i');plate.style.bottom=`${i*12}px`;plate.style.height=`${example.depth*.8}px`;stack.append(plate);}
          const label=document.createElement('p');label.textContent=`${example.floors} floors · ${example.coverage*100}%`;const formula=document.createElement('p');formula.textContent=`${32*example.depth} m² × ${example.floors} = 1,024 m²`;card.append(stack,label,formula);cards.append(card);
        }schematic.style.setProperty('--floor-plate',STYLES[style].colours.building);schematic.append(cards);companion.append(schematic);companion.hidden=false;
      }
      if(recipe.retainedGraphicSelector){
        const original=drawing.querySelector(recipe.retainedGraphicSelector);if(original){const caption=document.createElement('p');caption.textContent=recipe.retainedGraphicCaption||'Original six-step flight · metric side profile';const graphic=original.cloneNode(true);graphic.classList.add('retained-profile');companion.append(caption,graphic);companion.hidden=false;}
      }
      frame.setAttribute('aria-label',`${recipe.panelId} diorama`);
      viewport.setAttribute('aria-label',(recipe.description||'Soil 5 by 5 metres, 1 metre deep, 25 cubic metres.')+(recipe.fixedPlan?' Plus/minus zoom, Home resets.':' Arrow keys orbit, plus/minus zoom, Home resets.'));
      frame.querySelector('[data-hint]').textContent=recipe.fixedPlan?(matchMedia('(pointer: coarse)').matches?'Two fingers to zoom':'Scroll to zoom · Home resets'):(matchMedia('(pointer: coarse)').matches?'Two fingers to orbit / zoom':'Drag to orbit · scroll to zoom');
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
