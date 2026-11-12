import {plantingScene,storageScene,LANDSCAPE_INFO} from './recipes/landscape.js';
import {ratioScene,equalDensityScene,stepsScene,rootSectionModel,SECTION_INFO} from './recipes/sections.js';
import {buildingScene,BUILDING_INFO} from './recipes/buildings.js';
import {connectionScene,CONNECTION_INFO} from './recipes/connections.js';
import {vehicleScene,vehicleInfo} from './recipes/vehicles.js';
import {buildScene} from '../scenes.js';
import {routeScene,cycleParkingScene,ROUTE_ASSUMPTIONS} from './recipes/routes.js';
import {accessibilityScene,ACCESSIBILITY_INFO} from './recipes/accessibility.js';
import {tramScene,TRAM_INFO} from './recipes/tram.js';
export const ROOT_RECIPE = Object.freeze({
  id:'trees--v0', panelId:'trees', sourceClaims:['trees'],
  defaultCamera:'iso', allowedCameras:['iso','plan','front','section'],
  cutViews:['section'],sectionNote:'The section through the middle removes the front half of the soil solid. Full example: 5 × 5 × 1 m = 25 m³; the cut display is not a smaller planting-volume requirement.',
  assumptions:['Tree 5 m high / 3 m crown; people 1.75 m; furniture and decorative base are illustration assumptions.'],
  measurements:{soilWidth:5,soilLength:5,soilDepth:1,soilVolume:25},
});
export function recipeInfo(id) {
  if(id===ROOT_RECIPE.id)return ROOT_RECIPE;
  const landscape=/^(ground|stormwater)--v0$/.exec(id);
  if(landscape)return {id,panelId:landscape[1],sourceClaims:[landscape[1]],...LANDSCAPE_INFO[landscape[1]]};
  const analytical=/^(section-ratio|equal-density|steps)--v0$/.exec(id);
  if(analytical)return {id,panelId:analytical[1],sourceClaims:[analytical[1]],...SECTION_INFO[analytical[1]]};
  const building=/^(building-blocks|building-rows|building-detached)--v0$/.exec(id);
  if(building)return {id,panelId:building[1],sourceClaims:[building[1]],...BUILDING_INFO[building[1]]};
  const connection=/^(crossing-refuge|clear-route-continuity)--v0(-height)?$/.exec(id);
  if(connection){if(connection[2]&&connection[1]!=='clear-route-continuity')throw new Error(`Unknown recipe: ${id}`);const key=connection[1];if(!CONNECTION_INFO[key])throw new Error(`Unknown recipe: ${id}`);return {id,panelId:connection[1],sourceClaims:[connection[1]],...CONNECTION_INFO[key]};}
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
  const model=recipe.panelId==='ground'?plantingScene():recipe.panelId==='stormwater'?storageScene():recipe.panelId==='section-ratio'?ratioScene():recipe.panelId==='equal-density'?equalDensityScene():recipe.panelId==='steps'?stepsScene():BUILDING_INFO[recipe.panelId]?buildingScene(recipe.panelId):CONNECTION_INFO[recipe.panelId]?connectionScene(recipe.panelId):['car-turn','bus-turn','rescue'].includes(recipe.panelId)?vehicleScene(recipe.panelId,Number(id.split('--v')[1])):TRAM_INFO[recipe.panelId]?tramScene(recipe.panelId):ACCESSIBILITY_INFO[recipe.panelId]?accessibilityScene(recipe.panelId):id===ROOT_RECIPE.id?rootSectionModel(buildScene('roots')):recipe.panelId==='bike-parking'?cycleParkingScene():routeScene(recipe.panelId,Number(id.split('--v')[1]));
  model.recipe=recipe;
  return model;
}
