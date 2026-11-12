/* Static categories work offline and without modules; live selections also
 * update the reviewed print/fallback poster for the same panel. */
(() => {
  'use strict';
  function select(figure, value) {
    const control=figure.querySelector('[data-poster-choice]');
    if(!control||![...control.options].some(option=>option.value===String(value)))return false;
    control.value=String(value);
    figure.querySelectorAll('[data-poster-option]').forEach(option=>{option.hidden=option.dataset.posterOption!==String(value);});
    figure.dispatchEvent(new CustomEvent('poster-selection-change',{bubbles:true,detail:{value:Number(value)}}));
    return true;
  }
  const figures=[...document.querySelectorAll('[data-poster-set]')];
  const defaults=new Map(figures.map(figure=>[figure,figure.querySelector('[data-poster-choice]')?.value]));
  function restore(){
    const query=new URL(location.href).searchParams;
    for(const figure of figures){
      const value=query.get('poster-'+figure.dataset.posterSet)??defaults.get(figure);
      if(!select(figure,value))select(figure,defaults.get(figure));
    }
  }
  restore();
  addEventListener('popstate',restore);
  addEventListener('change',event=>{
    const staticControl=event.target.closest('[data-poster-choice]');
    if(!staticControl)return;
    const figure=staticControl.closest('[data-poster-set]');
    if(!select(figure,staticControl.value))return;
    const url=new URL(location.href);url.searchParams.set('poster-'+figure.dataset.posterSet,event.target.value);
    history.replaceState(history.state,'',url);
  });
})();
