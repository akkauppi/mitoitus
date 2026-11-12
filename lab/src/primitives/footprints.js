import {box,surfaceStrip} from './surfaces.js';
// These shallow plaques are drawing relief, never a representation of building height.
export const FOOTPRINT_RELIEF=.12;
export function footprint(group,{width,length,x=0,z=0,name,role='building',ground=true}){
 const base=ground?box(group,width,.24,length,x,-.12,z,'soil',name+'-base'):null;
 const plate=box(group,width,FOOTPRINT_RELIEF,length,x,FOOTPRINT_RELIEF/2,z,role,name);
 plate.userData.footprintArea=width*length;plate.userData.decorativeRelief=true;
 return {base,plate};
}
export function footprintRow(group,{count,width,length,x=0,z=0,name,alternating=false}){
 return Array.from({length:count},(_,index)=>footprint(group,{width,length,x:x+(index-(count-1)/2)*width,z,name:`${name}-${index}`,role:alternating&&index%2?'buildingAlt':'building'}).plate);
}
export function plotSurface(group,{width,length,x=0,z=0,name='plot'}){
 box(group,width,.24,length,x,-.18,z,'soil',name+'-base');
 const surface=surfaceStrip(group,{width,length,x,z,role:'grass',name});surface.userData.plotArea=width*length;return surface;
}
