import * as THREE from 'three';
import {cutPrism} from './sections.js';
/** Diagram coordinates only. Strip metric volume metadata before exposing a recipe. */
export function conceptualCut(group,{profile,role='soil',capRole='cutSoil',name,depth=2.4,hatch=.28}){
 const solid=cutPrism(group,{profile,zMin:-depth,zMax:depth,role,capRole,name,hatch});
 const s=solid.userData.section;solid.userData.section={kind:'conceptual',coordinateUnits:'diagram',plane:s.plane,profile:s.profile};solid.userData.conceptual=true;return solid;
}
/** Static process glyph; dashed shafts denote a conditional process, never a rate. */
export function processArrow(group,{from,to,conditional=false,name='process',role='flow'}){
 const arrow=new THREE.Group();arrow.name=name;arrow.userData.process={from:[...from],to:[...to],conditional};group.add(arrow);
 const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a),length=direction.length();
 if(length<.25)throw new RangeError('Process arrow needs distinct endpoints');
 const shaftEnd=b.clone().addScaledVector(direction.clone().normalize(),-.18),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,shaftEnd]),conditional?new THREE.LineDashedMaterial({dashSize:.13,gapSize:.1}):new THREE.LineBasicMaterial());
 line.computeLineDistances();line.userData.envelope=true;arrow.add(line);
 const head=new THREE.Mesh(new THREE.ConeGeometry(.12,.24,6),new THREE.MeshLambertMaterial());head.userData.role=role;head.position.copy(b).addScaledVector(direction.clone().normalize(),-.12);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());arrow.add(head);return arrow;
}
