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

/** Flat direction glyph: +Z forward; metre dimensions are illustrative. */
export function flatArrow(group,{x=0,z=0,rotation=0,length=1,width=.3,name='arrow',role='metal'}){
 const shape=new THREE.Shape(),tip=Math.min(length*.28,width*1.4);
 shape.moveTo(-width*.17,-length/2);shape.lineTo(width*.17,-length/2);shape.lineTo(width*.17,length/2-tip);shape.lineTo(width/2,length/2-tip);shape.lineTo(0,length/2);shape.lineTo(-width/2,length/2-tip);shape.lineTo(-width*.17,length/2-tip);shape.closePath();
 const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateZ(Math.PI),new THREE.MeshBasicMaterial());mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rotation;mesh.position.set(x,.01,z);mesh.userData.role=role;mesh.name=name;group.add(mesh);return mesh;
}
export function outline(group,points,name){
 const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
 const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({dashSize:.15,gapSize:.1}));line.computeLineDistances();line.userData.envelope=true;line.name=name;group.add(line);return line;
}
