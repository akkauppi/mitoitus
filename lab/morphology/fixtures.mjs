import {building, defaultParameters, perimeterBlock, polygon, rectangle} from './geometry.mjs';

const rect = (id,x,y,width,depth,height,storeys,axis) => ({
  ...building(id,[rectangle(x,y,width,depth)],height,storeys),...(axis ? {axis} : {}),
});
const site = (width,length,buildings,extra) => ({boundary:polygon(rectangle(0,0,width,length)),buildings,...extra});

export const fixtures = {
  'closed-perimeter': {
    label:'Closed perimeter block', parameters:defaultParameters,
    make:parameters => perimeterBlock(parameters),
    expected:{'study-area':1280,'footprint-area':896,'building-coverage':0.7,
      'floor-area':3584,'floor-area-ratio':2.8,'courtyard-area':384,'courtyard-width':24,'spatial-enclosure':1},
  },
  'detached-building': {
    label:'Rectangular detached building', parameters:{plot:[25,30],wallFootprint:[15,10],canopy:[5,5],storeys:1},
    make:()=>site(25,30,[rect('house',5,10,15,10,4,1,[1,0])],{canopy:[polygon(rectangle(3,23,5,5))]}),
    expected:{'study-area':750,'footprint-area':150,'building-coverage':0.2,'floor-area':150,
      'floor-area-ratio':0.2,'canopy-coverage':1/30},
  },
  'l-shaped-building': {
    label:'L-shaped building', parameters:{plot:[30,30],wingAreas:[120,80],storeys:3},
    make:()=>site(30,30,[{...building('l-shape',[[[5,5],[25,5],[25,11],[13,11],[13,21],[5,21],[5,5]]],9,3),axis:[1,0]}]),
    expected:{'study-area':900,'footprint-area':200,'building-coverage':2/9,'floor-area':600,'floor-area-ratio':2/3},
  },
  'open-perimeter': {
    label:'Open perimeter block', parameters:{...defaultParameters,opening:'north'},
    make:parameters=>perimeterBlock(parameters,true),
    expected:{'study-area':1280,'footprint-area':704,'building-coverage':0.55,'floor-area':2816,'floor-area-ratio':2.2,
      'courtyard-area':384,'courtyard-width':24,'spatial-enclosure':0.7},
  },
  'parallel-slabs': {
    label:'Parallel slab buildings', parameters:{plot:[48,40],slab:[36,8],clearSpacing:8,storeys:3},
    make:()=>site(48,40,[rect('south-slab',6,8,36,8,9,3,[1,0]),rect('north-slab',6,24,36,8,9,3,[1,0])]),
    expected:{'study-area':1920,'footprint-area':576,'building-coverage':0.3,'floor-area':1728,'floor-area-ratio':0.9},
  },
  'point-buildings': {
    label:'Point buildings', parameters:{plot:[40,40],footprint:[8,8],count:4,storeys:5},
    make:()=>site(40,40,[[6,6],[26,6],[6,26],[26,26]].map(([x,y],index)=>rect('point-'+(index+1),x,y,8,8,15,5))),
    expected:{'study-area':1600,'footprint-area':256,'building-coverage':0.16,'floor-area':1280,'floor-area-ratio':0.8},
  },
  'irregular-footprint': {
    label:'Irregular footprint', parameters:{plot:[25,24],cornerCount:5,storeys:2},
    make:()=>site(25,24,[building('irregular',[[[4,4],[18,4],[22,10],[16,18],[7,16],[4,4]]],6,2)]),
    expected:{'study-area':600,'footprint-area':183,'building-coverage':0.305,'floor-area':366,'floor-area-ratio':0.61},
  },
  'asymmetric-street': {
    label:'Asymmetric street section', parameters:{plot:[60,30],facadeGap:20,leftHeight:12,rightHeight:18},
    make:()=>site(60,30,[rect('west-building',5,5,15,20,12,4),rect('east-building',40,5,15,20,18,6)],
      {street:{transect:[[20,15],[40,15]],buildings:['west-building','east-building']}}),
    expected:{'study-area':1800,'footprint-area':600,'building-coverage':1/3,'floor-area':3000,'floor-area-ratio':5/3,
      'street-space-width':20,'height-to-width-ratio':0.75},
  },
};
