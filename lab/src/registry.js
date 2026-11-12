import {buildScene} from '../scenes.js';
export const ROOT_RECIPE = Object.freeze({
  id:'trees--v0', panelId:'trees', sourceClaims:['trees'],
  defaultCamera:'iso', allowedCameras:['iso','plan','front'],
  assumptions:['Tree 5 m high / 3 m crown; people 1.75 m; furniture and decorative base are illustration assumptions.'],
  measurements:{soilWidth:5,soilLength:5,soilDepth:1,soilVolume:25},
});
export function createRecipe(id) {
  if(id !== ROOT_RECIPE.id) throw new Error(`Unknown recipe: ${id}`);
  const model=buildScene('roots');
  model.recipe=ROOT_RECIPE;
  return model;
}
