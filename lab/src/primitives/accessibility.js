import * as THREE from 'three';

function solid(parent,geometry,position,role,name){
 const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial());mesh.position.set(...position);mesh.userData.role=role;mesh.name=name;
 const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial());edge.userData.edge=true;mesh.add(edge);parent.add(mesh);return mesh;
}
/** Nominal analytic radius, sampled only for rendering; never a device silhouette. */
export function clearDisk(parent,{radius,x=0,z=0,name}){
 const mesh=solid(parent,new THREE.CylinderGeometry(radius,radius,.006,96),[x,.003,z],'clearance',name);
 mesh.userData.clearRadius=radius;return mesh;
}
/** Exact horizontal run/rise, solid to a common decorative base datum. */
export function rampRoute(parent,{stations,width,base=-.18,cutStart=false,cutEnd=false,name='ramp'}){
 const [startX,startY]=stations[0],[endX,endY]=stations.at(-1),shape=new THREE.Shape();
 shape.moveTo(startX,base);shape.lineTo(endX,base);
 if(cutEnd){shape.lineTo(endX-.08,base+(endY-base)/3);shape.lineTo(endX+.08,base+2*(endY-base)/3);}
 for(const [x,y]of [...stations].reverse())shape.lineTo(x,y);
 if(cutStart){shape.lineTo(startX+.08,base+2*(startY-base)/3);shape.lineTo(startX-.08,base+(startY-base)/3);}
 shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,curveSegments:1});
 const mesh=solid(parent,geometry,[0,0,-width/2],'paving',name);
 mesh.userData.profile={stations,width,base,cutStart,cutEnd};return mesh;
}
export function rampPrism(parent,{run,rise,width,startX=0,startY=0,base=-.18,cutStart=false,cutEnd=false,name='ramp'}){
 const mesh=rampRoute(parent,{stations:[[startX,startY],[startX+run,startY+rise]],width,base,cutStart,cutEnd,name});
 Object.assign(mesh.userData.profile,{run,rise,startX,startY});return mesh;
}
