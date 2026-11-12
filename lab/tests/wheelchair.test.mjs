import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWheelchairUser} from '../assets.js';
import {trimLine} from '../src/annotations.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<2e-6,`${a} != ${b}`);
test('manual chair user keeps declared illustrative bounds and head proportions',()=>{
 const group=createWheelchairUser();group.updateMatrixWorld(true);
 const b=new THREE.Box3().setFromObject(group,true),s=b.getSize(new THREE.Vector3());
 near(s.x,.72);near(s.y,1.35);near(s.z,1.2);near(b.min.y,0);
 const head=new THREE.Box3().setFromObject(group.getObjectByName('head'),true);near(head.max.y-head.min.y,.23);
 group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
test('dimension gap cuts line around text without changing measured endpoints',()=>{
 const a={x:0,y:5},b={x:100,y:5},r={left:40,right:60,top:0,bottom:10};
 assert.deepEqual(trimLine(a,b,[r]),[[a,{x:40,y:5}],[{x:60,y:5},b]]);
 assert.deepEqual(trimLine(b,a,[r]),[[b,{x:60,y:5}],[{x:40,y:5},a]]);
 assert.deepEqual(trimLine({x:50,y:-10},{x:50,y:20},[r]),[[{x:50,y:-10},{x:50,y:0}],[{x:50,y:10},{x:50,y:20}]]);
 assert.deepEqual(trimLine({x:45,y:5},{x:55,y:5},[r]),[]);
 assert.deepEqual(trimLine({x:0,y:20},{x:100,y:20},[r]),[[{x:0,y:20},{x:100,y:20}]]);
});
