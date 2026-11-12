import {vehicleScene,vehicleInfo} from './recipes/vehicles.js';
import {buildScene} from '../scenes.js';
import {routeScene,cycleParkingScene,ROUTE_ASSUMPTIONS} from './recipes/routes.js';
import {accessibilityScene,ACCESSIBILITY_INFO} from './recipes/accessibility.js';
import {tramScene,TRAM_INFO} from './recipes/tram.js';
export const ROOT_RECIPE = Object.freeze({
  id:'trees--v0', panelId:'trees', sourceClaims:['trees'],
  defaultCamera:'iso', allowedCameras:['iso','plan','front'],
  assumptions:['Tree 5 m high / 3 m crown; people 1.75 m; furniture and decorative base are illustration assumptions.'],
  measurements:{soilWidth:5,soilLength:5,soilDepth:1,soilVolume:25},
});
export function recipeInfo(id) {
  if(id===ROOT_RECIPE.id)return ROOT_RECIPE;
  const vehicle=/^(car-turn|bus-turn|rescue)--v(\d+)$/.exec(id);
  if(vehicle)return {id,panelId:vehicle[1],sourceClaims:[vehicle[1]],...vehicleInfo(vehicle[1],Number(vehicle[2]))};
  const tram=/^(tram-corridor|tram-width|tram-length)--v0$/.exec(id);
  if(tram)return {id,panelId:tram[1],sourceClaims:[tram[1]],...TRAM_INFO[tram[1]]};
  const access=/^(turning|ramps|arrival)--v0$/.exec(id);
  if(access)return {id,panelId:access[1],sourceClaims:[access[1]],...ACCESSIBILITY_INFO[access[1]]};
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
  const model=['car-turn','bus-turn','rescue'].includes(recipe.panelId)?vehicleScene(recipe.panelId,Number(id.split('--v')[1])):TRAM_INFO[recipe.panelId]?tramScene(recipe.panelId):ACCESSIBILITY_INFO[recipe.panelId]?accessibilityScene(recipe.panelId):id===ROOT_RECIPE.id?buildScene('roots'):recipe.panelId==='bike-parking'?cycleParkingScene():routeScene(recipe.panelId,Number(id.split('--v')[1]));
  model.recipe=recipe;
  return model;
}
