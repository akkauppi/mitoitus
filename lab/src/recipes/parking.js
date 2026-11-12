import * as THREE from 'three';
import {createCar,createPerson,createTree} from '../../assets.js';
import {box,surfaceStrip,outline} from '../primitives/surfaces.js';
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});
export function parkingModule(group,{pairs=4}={}){
 if(!Number.isInteger(pairs)||pairs<1)throw new RangeError('Parking pairs must be positive');
 const length=pairs*2.5,bays=[];
 box(group,17,.24,length,0,-.18,0,'soil','module-base');
 const aisle=surfaceStrip(group,{width:7,length,role:'road',name:'full-aisle'});
 for(const side of [-1,1])for(let i=0;i<pairs;i++){const z=-length/2+1.25+i*2.5,mesh=surfaceStrip(group,{width:5,length:2.5,x:side*6,z,role:'paving',name:`bay-${side}-${i}`});mesh.userData.bay={side,index:i,area:12.5};bays.push(mesh);}
 return{bays,aisle,length,count:pairs*2,area:17*length};
}
export const PARKING_INFO={defaultCamera:'plan',allowedCameras:['plan','iso'],categoryOptions:['Layout · 8 bays','Area share · 1 bay'],categoryPrompt:'Show',categoryDefault:0,noShadows:true,categoryFacts:['','12.5 + 8.75 = 21.25 m²/space · 20-space module: 425 m².'],description:'Eight 2.5 by 5 metre parking bays face across the full 7 metre two-way aisle. The module is 17 metres overall. One space receives half the shared aisle for area accounting.',assumptions:['Dated repeating interior-bay example; row ends are excluded. End-bay widening, doors, transfers and manoeuvres are not validated by the scale cars. Car body plan 5 × 1.8 m, assumed height/detail; person 1.75 m and tree 5 m. Context pads and ground thickness are illustration assumptions outside the measured module. Highlight relief is a graphic overlay, not a construction layer.']};
export function parkingScene(){
 const group=new THREE.Group(),module=parkingModule(group),cars=[];
 for(const [x,z]of [[-6,-3.75],[-6,1.25],[6,-1.25],[6,3.75]]){const car=createCar();car.position.set(x,0,z);car.rotation.y=x<0?Math.PI/2:-Math.PI/2;group.add(car);cars.push(car);}
 surfaceStrip(group,{width:2,length:3,x:-10.5,z:-2,role:'paving',name:'person-context'});const person=createPerson();person.position.set(-10.5,0,-2);group.add(person);
 box(group,3.5,.24,3.5,11,-.18,2,'soil','tree-context-base');surfaceStrip(group,{width:3.5,length:3.5,x:11,z:2,role:'grass',name:'tree-context'});const tree=createTree();tree.position.set(11,0,2);group.add(tree);
 const share=new THREE.Group();share.name='accounting-overlay';group.add(share);
 box(share,5,.014,2.5,-6,.008,-1.25,'circulation','bay-allocation');box(share,3.5,.014,2.5,-1.75,.008,-1.25,'clearance','aisle-allocation');
 outline(share,[[0,.025,-5],[0,.025,5]],'accounting-midline');
 const model={group,dimensions:[],labels:[],measurement:{count:8,bayWidth:2.5,bayLength:5,aisleWidth:7,moduleWidth:17,moduleLength:10,moduleArea:170,bayArea:12.5,aisleShare:8.75,perSpace:21.25,facingPair:42.5,twentySpaces:425},comparison:{id:'parking-module',bounds:{min:[-12,-.4,-7.5],max:[13,5.2,7.5]}},meta:{target:[0,.5,0],camera:[.6,1.1,1.7]}};
 model.setCategory=value=>{if(value!==0&&value!==1)throw new RangeError('Unknown parking view');share.visible=value===1;cars.forEach(c=>c.visible=value===0);person.visible=tree.visible=value===0;for(const name of ['person-context','tree-context','tree-context-base'])group.getObjectByName(name).visible=value===0;
  model.dimensions=[dim([-8.5,0,5],[8.5,0,5],'17 m module',[0,0,1.5]),dim([-3.5,0,-5],[3.5,0,-5],'7 m aisle',[0,0,-1.8])];
  if(value===0)model.dimensions.push(dim([-8.5,0,5],[-3.5,0,5],'5 m bay',[0,0,.8]),dim([-8.5,0,2.5],[-8.5,0,5],'2.5 m',[-1.1,0,0]));
  model.labels=value===0?[{point:[-6,0,-1.25],text:'Bay'},{point:[0,0,1.25],text:'Shared aisle'},{point:[6,1.35,3.75],text:'Reference car'}]:[{point:[-6,.016,-1.25],text:'Bay 12.5 m²'},{point:[-1.75,.016,-1.25],text:'Share 8.75 m²'},{point:[2.5,0,1.25],text:'Full 7 m aisle'}];
 };model.setCategory(0);return model;
}
