import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPerson } from '../assets.js';

const bounds = object => new THREE.Box3().setFromObject(object, true);
const size = object => bounds(object).getSize(new THREE.Vector3());
const close = (value, expected) => assert.ok(Math.abs(value - expected) < 2e-6, `${value} should equal ${expected}`);
const within = (value, min, max, message) => assert.ok(value >= min && value <= max, `${message}: ${value}`);

// These constrain the chosen illustration, not real-world anthropometric
// ranges. The scale reference must survive a pose or silhouette revision.
for (const pose of ['standing', 'walking', 'waiting']) {
  test(`${pose} person keeps adult-scale proportions and ground contact`, () => {
    const person = createPerson({ pose });
    try {
      person.updateMatrixWorld(true);
      close(size(person).y, 1.75);
      close(bounds(person).min.y, 0);
      const head = size(person.getObjectByName('head'));
      close(head.y, 0.23);
      within(1.75 / head.y, 7.4, 7.8, 'head/body proportion');
      within(head.x, 0.16, 0.20, 'head width');
      const torso = size(person.getObjectByName('torso'));
      within(torso.x, 0.36, 0.44, 'clothed torso width');
      within(size(person.getObjectByName('pelvis')).x, 0.28, 0.34, 'hip width');
      for (const side of ['left', 'right']) {
        close(bounds(person.getObjectByName(`${side}-shoe`)).min.y, 0);
        within(bounds(person.getObjectByName(`${side}-hand`)).min.y, 0.75, 1.02, 'hand height');
      }
      person.traverse(part => {
        if (part.isMesh) assert.equal(part.userData.role, 'person', 'a neutral light-grey scale figure');
      });
    } finally {
      person.traverse(part => { part.geometry?.dispose(); part.material?.dispose(); });
    }
  });
}

test('walking pose separates the feet without stretching the figure', () => {
  const person = createPerson({ pose: 'walking' });
  try {
    const a = bounds(person.getObjectByName('left-shoe')).getCenter(new THREE.Vector3());
    const b = bounds(person.getObjectByName('right-shoe')).getCenter(new THREE.Vector3());
    within(Math.abs(a.z - b.z), 0.35, 0.42, 'short walking step');
    close(size(person).y, 1.75);
  } finally {
    person.traverse(part => { part.geometry?.dispose(); part.material?.dispose(); });
  }
});
