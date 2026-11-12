import * as THREE from 'three';

// Metre geometry. Surface/base thicknesses are display assumptions, not specs.
export function box(group,w,h,d,x,y,z,role,name){
 const geometry=new THREE.BoxGeometry(w,h,d);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial());mesh.userData.role=role;mesh.name=name;
 mesh.position.set(x,y,z);
 const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial());edge.userData.edge=true;mesh.add(edge);group.add(mesh);return mesh;
}

export function surfaceStrip(group,{width,length,x=0,z=0,role='paving',name='surface'}) {
 return box(group,width,.06,length,x,-.03,z,role,name);
}
export function tileRow(group,{count,tileWidth,length,z=0,role='cycle',name='envelope'}) {
 return Array.from({length:count},(_,index)=>{
  const x=(index-(count-1)/2)*tileWidth;
  const mesh=surfaceStrip(group,{width:tileWidth,length,x,z,role,name:`${name}-${index}`});
  return {mesh,x,z};
 });
}
