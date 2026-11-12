import * as THREE from 'three';

export function profileArea(profile){return Math.abs(profile.reduce((sum,p,i)=>{const q=profile[(i+1)%profile.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;}
function contains(profile,x,y){
 let inside=false;
 for(let i=0,j=profile.length-1;i<profile.length;j=i++){
  const a=profile[j],b=profile[i],dx=b[0]-a[0],dy=b[1]-a[1],cross=(x-a[0])*dy-(y-a[1])*dx;
  if(Math.abs(cross)<1e-7&&x>=Math.min(a[0],b[0])-1e-7&&x<=Math.max(a[0],b[0])+1e-7&&y>=Math.min(a[1],b[1])-1e-7&&y<=Math.max(a[1],b[1])+1e-7)return true;
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
export function validateCapAnchor(solid,point){
 solid.updateWorldMatrix(true,false);const p=solid.worldToLocal(new THREE.Vector3(...point)),s=solid.userData.section;
 return Boolean(s&&Math.abs(p.z-s.plane.value)<1e-6&&contains(s.profile,p.x,p.y));
}
function extrusion(profile,zMin,zMax){
 if(!Number.isFinite(zMin)||!Number.isFinite(zMax)||profile.length<3||!(zMax>zMin)||!profile.flat().every(Number.isFinite)||profileArea(profile)<=0)throw new RangeError('Invalid prism profile/range');
 const shape=new THREE.Shape();profile.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:zMax-zMin,bevelEnabled:false});geometry.translate(0,0,zMin);return geometry;
}
function mesh(group,geometry,role,name){const m=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial());m.userData.role=role;m.name=name;group.add(m);return m;}
function edges(group,geometry){const line=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,30),new THREE.LineBasicMaterial());line.userData.edge=true;group.add(line);}
export function solidPrism(group,{profile,zMin,zMax,role='paving',name='solid'}){
 const result=new THREE.Group();result.name=name;group.add(result);const geometry=extrusion(profile,zMin,zMax);mesh(result,geometry,role,'body');edges(result,geometry);result.userData.profile=profile;return result;
}
/** Analytical Z-plane removal, with a distinct watertight cap; no renderer clipping trick. */
export function cutPrism(group,{profile,zMin,zMax,cutZ=0,keep='negative',role='paving',capRole='cutPaving',name='cut-solid',hatch=.3,croppedSide=null}){
 if(![null,'left','right'].includes(croppedSide))throw new RangeError('Invalid cropped side');
 if(!(cutZ>zMin&&cutZ<zMax)||!['negative','positive'].includes(keep))throw new RangeError('Cut must be inside the source prism');
 const result=new THREE.Group();result.name=name;group.add(result);
 const low=keep==='negative'?zMin:cutZ,high=keep==='negative'?cutZ:zMax,geometry=extrusion(profile,low,high),body=[],caps=[],outer=[];
 const p=geometry.attributes.position;
 const midX=(Math.min(...profile.map(p=>p[0]))+Math.max(...profile.map(p=>p[0])))/2;
 for(let i=0;i<p.count;i+=3){
  const isCap=[0,1,2].every(j=>Math.abs(p.getZ(i+j)-cutZ)<1e-6),sideFace=Math.max(...[0,1,2].map(j=>p.getZ(i+j)))-Math.min(...[0,1,2].map(j=>p.getZ(i+j)))>1e-6;
  const isOuter=croppedSide&&sideFace&&[0,1,2].every(j=>croppedSide==='left'?p.getX(i+j)<midX:p.getX(i+j)>midX),array=isCap?caps:isOuter?outer:body;
  for(let j=0;j<3;j++)array.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));
 }
 function triangles(array){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(array,3));g.computeVertexNormals();return g;}
 mesh(result,triangles(body),role,'body');const cap=mesh(result,triangles(caps),capRole,'cap');cap.userData.sectionCap=true;if(outer.length){const outside=mesh(result,triangles(outer),capRole,'cropped-end');outside.userData.croppedCut=true;}edges(result,geometry);geometry.dispose();
 result.userData.section={plane:{axis:'z',value:cutZ,normal:[0,0,keep==='negative'?1:-1],coordinateSpace:'local',keep},profile:profile.map(p=>[...p]),croppedSide,original:{zMin,zMax,volume:profileArea(profile)*(zMax-zMin)},retained:{zMin:low,zMax:high,volume:profileArea(profile)*(high-low)}};
 // Diagonal lines are clipped to the real cap polygon, including concave step profiles.
 if(hatch>0){const values=profile.map(([x,y])=>y-x),min=Math.min(...values),max=Math.max(...values),points=[];
  for(let c=Math.floor(min/hatch)*hatch;c<=max;c+=hatch){const hits=[];
   for(let i=0;i<profile.length;i++){const a=profile[i],b=profile[(i+1)%profile.length],da=a[1]-a[0]-c,db=b[1]-b[0]-c;if(Math.abs(da-db)<1e-10)continue;const t=da/(da-db);if(t>=0&&t<=1)hits.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
   hits.sort((a,b)=>a[0]-b[0]);for(let i=0;i<hits.length-1;i++){const a=hits[i],b=hits[i+1];if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7||!contains(profile,(a[0]+b[0])/2,(a[1]+b[1])/2))continue;points.push(new THREE.Vector3(...a,cutZ+(keep==='negative'?.0005:-.0005)),new THREE.Vector3(...b,cutZ+(keep==='negative'?.0005:-.0005)));}
  }
  const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial());line.userData.sectionHatch=true;result.add(line);
 }
 if(croppedSide&&hatch>0){
  const ys=profile.map(p=>p[1]),bottom=Math.min(...ys),top=Math.max(...ys),points=[];
  function outerX(y){const xs=[];for(let i=0;i<profile.length;i++){const a=profile[i],b=profile[(i+1)%profile.length];if(Math.abs(b[1]-a[1])<1e-9){if(Math.abs(y-a[1])<1e-6)xs.push(a[0],b[0]);continue;}const t=(y-a[1])/(b[1]-a[1]);if(t>=-1e-7&&t<=1+1e-7)xs.push(a[0]+t*(b[0]-a[0]));}return(croppedSide==='left'?Math.min(...xs):Math.max(...xs))+(croppedSide==='left'?-.0005:.0005);}
  for(let c=Math.floor((bottom-high)/hatch)*hatch;c<=top-low;c+=hatch){const start=Math.max(low,bottom-c),end=Math.min(high,top-c);if(end-start<1e-7)continue;const zs=[start,end,...ys.map(y=>y-c).filter(z=>z>start&&z<end)].sort((a,b)=>a-b);
   for(let i=0;i<zs.length-1;i++){const a=zs[i],b=zs[i+1];if(b-a<1e-7)continue;points.push(new THREE.Vector3(outerX(a+c),a+c,a),new THREE.Vector3(outerX(b+c),b+c,b));}
  }
  const line=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial());line.userData.sectionHatch=true;result.add(line);
 }

 return result;
}
export const rectangleProfile=(left,bottom,right,top)=>[[left,bottom],[right,bottom],[right,top],[left,top]];
