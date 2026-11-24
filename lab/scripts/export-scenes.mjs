import {readFileSync} from 'node:fs';
import {createRecipe, recipeInfo} from '../src/registry.js';

const manifest = JSON.parse(readFileSync(new URL('../posters/manifest.json', import.meta.url)));
const scenes = manifest.posters.map(({id, options}) => {
  const recipe = recipeInfo(id);
  const model = createRecipe(id);
  return {
    ...recipe,
    coordinateUnits: model.coordinateUnits ?? 'm',
    modelMeasurements: model.measurement ?? recipe.measurements ?? null,
    views: options.map(({category, label, files}) => {
      if (category !== null) model.setCategory(category);
      return {
        category, label, poster: files.compact.path,
        dimensions: (model.dimensions ?? []).map(({label, a, b}) => ({label, from: a, to: b})),
        labels: (model.labels ?? []).map(({text}) => text),
      };
    }),
  };
});
process.stdout.write(JSON.stringify(scenes));
