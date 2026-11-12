import {buildScene} from '../scenes.js';
import {routeScene,cycleParkingScene,ROUTE_ASSUMPTIONS} from './recipes/routes.js';
export const ROOT_RECIPE = Object.freeze({
  id:'trees--v0', panelId:'trees', sourceClaims:['trees'],
  defaultCamera:'iso', allowedCameras:['iso','plan','front'],
  assumptions:['Tree 5 m high / 3 m crown; people 1.75 m; furniture and decorative base are illustration assumptions.'],
  measurements:{soilWidth:5,soilLength:5,soilDepth:1,soilVolume:25},
});
export function recipeInfo(id) {
  if(id===ROOT_RECIPE.id)return ROOT_RECIPE;
  const match=/^(walking|cycling|bike-parking)--v(\d+)$/.exec(id);
  if(!match)throw new Error(`Unknown recipe: ${id}`);
  const panel=match[1],index=Number(match[2]),count=panel==='walking'?4:panel==='cycling'?5:1;
  if(index>=count)throw new Error(`Unknown recipe: ${id}`);
  return {id,panelId:panel,sourceClaims:[panel],defaultCamera:'iso',allowedCameras:['iso','plan','front'],
    assumptions:panel==='bike-parking'?['Five bicycle envelopes 0.6 × 2 m; handling depth 2 m; bicycle form and decorative base are illustrations, not rack specifications.']:ROUTE_ASSUMPTIONS,
    description:panel==='bike-parking'?'Five cycles and handling space: 3 by 4 metres, 12 square metres, 2.4 square metres per cycle.':`${panel==='walking'?'Walking width':'Cycle facility'} source case ${index+1}.`};
}
export function createRecipe(id) {
  const recipe=recipeInfo(id);
  const model=id===ROOT_RECIPE.id?buildScene('roots'):recipe.panelId==='bike-parking'?cycleParkingScene():routeScene(recipe.panelId,Number(id.split('--v')[1]));
  model.recipe=recipe;
  return model;
}
