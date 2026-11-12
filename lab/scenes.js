import * as THREE from 'three';
import {createPerson,createTree,createCar,createTram,createBicycle,createBench} from './assets.js';

export const SCENES = {
  street:{number:'01',name:'Walk, cycle & trees',short:'An everyday street',subtitle:'Parallel spaces, one shared scale.',span:25,target:[0,0,0],camera:[1.25,1.2,1.6],
    rows:[['Footway','2.5 m'],['Two-way cycle track','2.5 m'],['Tree planting strip','3.0 m'],['Local collector lane','3.0 m']],
    note:'A composed width study using separate dated source cases. Length and placement are illustrative.',sources:[['Walking · Espoo 2010','walking'],['Cycling · Helsinki 2014','cycling'],['Planting · Espoo 2010','ground'],['Lane width · Espoo 2010','car-turn']],
    description:'An eleven-metre-wide composition: a 2.5 metre footway, a 2.5 metre two-way cycle track, a 3 metre planting strip and one 3 metre traffic lane.'},
  tram:{number:'02',name:'A tram stop',short:'Platforms & movement',subtitle:'A long object, a legible cross-section.',span:55,target:[0,0,0],camera:[1.6,1.3,.8],
    rows:[['Side platform','3.5 m'],['Track zone','5.5 m'],['Side platform','3.5 m'],['Platform length','45 m']],
    note:'The 12.5 m section is the existing derived example. Outer routes and buffers are additional. Tram body: 34 × 2.4 m.',sources:[['Stop width · regional guide','tram-width'],['Length & levels · regional guide','tram-length']],
    description:'Two 3.5 metre side platforms surround a 5.5 metre track zone. Platforms are 45 metres long. A 34 by 2.4 metre stylized tram supplies scale.'},
  roots:{number:'03',name:'Below the tree',short:'Space beneath the surface',subtitle:'A measured volume, seen from both sides.',span:17,target:[0,1,0],camera:[1.3,1,1.7],
    rows:[['Soil width','5 m'],['Soil length','5 m'],['Soil depth','1 m'],['Illustrated volume','25 m³']],
    note:'The existing 5 × 5 × 1 m example illustrates volume; it is not a prescribed planting pit. Helsinki source is marked draft.',sources:[['Rooting volume · Helsinki draft','trees']],
    description:'A five by five metre soil block, one metre deep, with a five metre illustrative tree. The lower face reveals soil depth; a nearby person supplies scale.'}
};

function box(parent,w,h,d,x,y,z,role,outline=true) {
  const geometry=new THREE.BoxGeometry(w,h,d);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial());
  mesh.position.set(x,y,z);mesh.userData.role=role;mesh.castShadow=true;mesh.receiveShadow=true;
  if(outline){const line=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial());line.userData.edge=true;mesh.add(line);}
  parent.add(mesh);return mesh;
}
function place(group,object,x,y,z,rotation=0){object.position.set(x,y,z);object.rotation.y=rotation;group.add(object);return object;}
function surface(group,w,d,x,z,role,y=0){return box(group,w,.12,d,x,y-.06,z,role);}
const dim=(a,b,label,offset=[0,0,0])=>({a,b,label,offset});

export function buildScene(key) {
  const group=new THREE.Group();const dimensions=[];const labels=[];
  if(key==='street'){
    box(group,11,.55,18,0,-.395,0,'soil');box(group,11,.3,18,0,-.82,0,'subsoil');
    surface(group,2.5,18,-4.25,0,'paving');surface(group,2.5,18,-1.75,0,'cycle');
    surface(group,3,18,1,0,'grass');surface(group,3,18,4,0,'road');
    for(const z of [-7,-3,1,5]) box(group,.06,.012,1.5,-1.75,.012,z,'white',false);
    for(const z of [-5.7,1.2,6.4])place(group,createTree({height:5,crown:2.7}),1,0,z);
    place(group,createPerson({pose:'walking'}),-4.3,0,1.2);place(group,createPerson(),-3.7,0,-4.5,.3);
    place(group,createPerson({pose:'walking'}),-4.75,0,4,-.3);place(group,createBicycle(),-2.4,0,-3.8);
    place(group,createBicycle(),-1.05,0,4.2,Math.PI);place(group,createCar(),4,0,-3);
    place(group,createBench(),1,0,-1.8,Math.PI/2);
    [[-5.5,-3,'2.5 m'],[-3,-.5,'2.5 m'],[-.5,2.5,'3 m'],[2.5,5.5,'3 m']].forEach(([a,b,label])=>dimensions.push(dim([a,0,9],[b,0,9],label,[0,0,1.3])));
    labels.push({point:[-4.25,0,-7.5],text:'Footway'},{point:[-1.75,0,-7.5],text:'Cycle track'},{point:[1,0,-7.5],text:'Trees'},{point:[4,0,5],text:'Traffic'});
  }else if(key==='tram'){
    box(group,12.5,.75,45,0,-.495,0,'soil');box(group,12.5,.35,45,0,-1.045,0,'subsoil');
    surface(group,5.5,45,0,0,'grass');
    box(group,3.5,.42,45,-4.5,.09,0,'paving');box(group,3.5,.42,45,4.5,.09,0,'paving');
    // Rail geometry is decorative: gauge and centre spacing are declared drawing assumptions.
    for(const x of [-2,-1,1,2])box(group,.055,.04,45,x,-.02,0,'rail');
    for(const x of [-2.93,2.93])box(group,.18,.015,45,x,.31,0,'white',false);
    place(group,createTram(),-1.5,0,-2);
    for(const [x,z] of [[-4.5,-15],[-4.2,-3],[-5,7],[3.6,-9],[4.2,4],[4,13]]) place(group,createPerson({pose:'waiting'}),x,.3,z);
    for(const z of [-10,10])place(group,createBench(),4.7,.3,z);
    // Compact open shelter with a visually permeable frame.
    for(const z of [-3,3])for(const x of [4,5.5])box(group,.07,2.5,.07,x,1.55,z,'metal');
    box(group,2.1,.13,7,4.75,2.86,0,'paving');
    [[-6.25,-2.75,'3.5 m'],[-2.75,2.75,'5.5 m'],[2.75,6.25,'3.5 m']].forEach(([a,b,label])=>dimensions.push(dim([a,.3,22.5],[b,.3,22.5],label,[0,0,2])));
    dimensions.push(dim([6.25,.3,-22.5],[6.25,.3,22.5],'45 m',[2,0,0]));
    labels.push({point:[-4.5,.3,-19],text:'Platform'},{point:[1.5,0,-19],text:'Track zone'},{point:[4.5,.3,-19],text:'Platform'});
  }else{
    // Root soil is exactly 5 × 5 × 1 m; decorative lower plinth is separate.
    box(group,5,1,5,0,-.5,0,'soil');box(group,5,.28,5,0,-1.14,0,'subsoil');
    surface(group,5,5,0,0,'grass',.06);
    surface(group,2.5,7.5,-3.85,-1.25,'paving',.06);box(group,2.5,.8,7.5,-3.85,-.46,-1.25,'subsoil');
    place(group,createTree({height:5,crown:3}),.3,.06,-.3);
    place(group,createPerson(),-3.8,.06,.8);place(group,createBench(),-3.7,.06,-3.2);
    dimensions.push(dim([-2.5,0,2.5],[2.5,0,2.5],'5 m',[0,0,1]));
    dimensions.push(dim([2.5,0,-2.5],[2.5,0,2.5],'5 m',[1,0,0]));
    dimensions.push(dim([2.5,0,2.5],[2.5,-1,2.5],'1 m',[1.25,0,1.25]));
    labels.push({point:[0,-.5,2.51],text:'25 m³ soil'},{point:[.3,4.4,-.3],text:'Tree · 5 m'});
  }
  group.updateMatrixWorld(true);
  return {group,dimensions,labels,meta:SCENES[key]};
}
