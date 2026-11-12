import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  createPerson, createTree, createCar, createTram, createBicycle, createBench,
} from '../assets.js';
import { buildScene, SCENES } from '../scenes.js';
import { STYLES } from '../styles.js';

const EPSILON = 2e-6;
function close(actual, expected, context) {
  assert.ok(Math.abs(actual - expected) < EPSILON,
    `${context}: expected ${expected}, received ${actual}`);
}
function bounds(object) {
  object.updateMatrixWorld(true);
  // Precise vertex bounds avoid enlarged rotated primitive bounding boxes.
  return new THREE.Box3().setFromObject(object, true);
}
function dimensions(object) {
  return bounds(object).getSize(new THREE.Vector3());
}
function dispose(object) {
  object.traverse(child => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
    else child.material?.dispose();
  });
}

test('scale assets retain their declared metric envelopes and ground contact', async t => {
  // Independent reference values: changing artwork cannot silently redefine the
  // dimensions by changing its own ASSET_SPECS metadata at the same time.
  const cases = [
    ['person', createPerson, { y: 1.75 }],
    ['tree', createTree, { x: 3, y: 5, z: 3 }],
    ['car', createCar, { x: 1.8, y: 1.5, z: 5 }],
    ['tram', createTram, { x: 2.4, y: 3.4, z: 34 }],
    ['bicycle', createBicycle, { x: 0.6, y: 1.2, z: 2 }],
    ['bench', createBench, { y: 0.85, z: 1.8 }],
  ];
  for (const [name, create, expected] of cases) await t.test(name, () => {
    const asset = create();
    try {
      const box = bounds(asset), size = box.getSize(new THREE.Vector3());
      close(box.min.y, 0, `${name} ground contact`);
      for (const [axis, value] of Object.entries(expected)) close(size[axis], value, `${name} ${axis}`);
    } finally { dispose(asset); }
  });
});

test('tree parameters create the requested height and crown diameter', () => {
  const asset = createTree({ height: 7, crown: 4 });
  try {
    const size = dimensions(asset);
    close(size.x, 4, 'tree crown X');
    close(size.z, 4, 'tree crown Z');
    close(size.y, 7, 'tree height');
  } finally { dispose(asset); }
  assert.throws(() => createTree({ height: 0 }), RangeError);
  assert.throws(() => createTree({ crown: -1 }), RangeError);
});

test('every displayed linear dimension equals its measured endpoint distance', async t => {
  for (const key of Object.keys(SCENES)) await t.test(key, () => {
    const scene = buildScene(key);
    try {
      assert.ok(scene.dimensions.length > 0, `${key} has measurable dimensions`);
      for (const dimension of scene.dimensions) {
        const match = /^(\d+(?:\.\d+)?) m$/.exec(dimension.label);
        assert.ok(match, `Unrecognised linear label: ${dimension.label}`);
        const a = new THREE.Vector3(...dimension.a), b = new THREE.Vector3(...dimension.b);
        close(a.distanceTo(b), Number(match[1]), `${key}: ${dimension.label}`);
        // Moving the dimension away from the model must not change its length.
        const offset = new THREE.Vector3(...dimension.offset);
        close(a.add(offset).distanceTo(b.add(offset)), Number(match[1]), `${key} offset: ${dimension.label}`);
      }
    } finally { dispose(scene.group); }
  });
});

test('street and tram section widths agree with the physical surface boundaries', async t => {
  for (const [key, expectedWidth] of [['street', 11], ['tram', 12.5]]) await t.test(key, () => {
    const scene = buildScene(key);
    try {
      const roles = new Set(['paving', 'cycle', 'grass', 'road']);
      const surfaces = scene.group.children
        .filter(child => child.isMesh && roles.has(child.userData.role))
        .map(child => bounds(child))
        .filter(box => box.max.y < 0.5)
        .sort((a, b) => a.min.x - b.min.x);
      assert.ok(surfaces.length >= 3, `${key} section has adjacent surfaces`);
      const widthDimensions = scene.dimensions.filter(d => d.a[0] !== d.b[0]);
      assert.equal(surfaces.length, widthDimensions.length);
      for (let i = 0; i < surfaces.length; i++) {
        const surface = surfaces[i], dimension = widthDimensions[i];
        close(surface.min.x, dimension.a[0], `${key} surface ${i} start`);
        close(surface.max.x, dimension.b[0], `${key} surface ${i} end`);
        if (i) close(surfaces[i - 1].max.x, surface.min.x, `${key} contiguous surfaces`);
      }
      close(surfaces.at(-1).max.x - surfaces[0].min.x, expectedWidth, `${key} total width`);
      if (key === 'tram') {
        for (const surface of surfaces) close(surface.max.z - surface.min.z, 45, 'tram platform/track length');
      }
    } finally { dispose(scene.group); }
  });
});

test('the soil volume label matches the measured soil block, excluding its plinth', () => {
  const scene = buildScene('roots');
  try {
    const soilMeshes = scene.group.children.filter(child => child.isMesh && child.userData.role === 'soil');
    assert.equal(soilMeshes.length, 1, 'one defined soil volume');
    const size = dimensions(soilMeshes[0]);
    close(size.x, 5, 'soil width');
    close(size.z, 5, 'soil length');
    close(size.y, 1, 'soil depth');
    const label = scene.labels.find(item => /m³ soil$/.test(item.text));
    assert.ok(label, 'soil volume label exists');
    close(size.x * size.y * size.z, Number.parseFloat(label.text), 'soil volume claim');
  } finally { dispose(scene.group); }
});

test('each scene material has a valid colour in every visual treatment', async t => {
  for (const key of Object.keys(SCENES)) await t.test(key, () => {
    const scene = buildScene(key);
    try {
      scene.group.traverse(child => {
        if (!child.isMesh) return;
        assert.ok(child.userData.role, `${key}: mesh must declare its material role`);
        for (const [styleName, style] of Object.entries(STYLES)) {
          assert.match(style.colours[child.userData.role] ?? '', /^#[0-9a-f]{6}$/i,
            `${key}/${styleName}: missing colour for ${child.userData.role}`);
        }
      });
    } finally { dispose(scene.group); }
  });
});

test('scene geometry contains finite vertices and valid triangle references', async t => {
  for (const key of Object.keys(SCENES)) await t.test(key, () => {
    const scene = buildScene(key);
    try {
      scene.group.traverse(child => {
        if (!child.isMesh) return;
        const position = child.geometry.getAttribute('position');
        assert.ok(position && position.count >= 3, `${key}: renderable mesh`);
        assert.equal(position.itemSize, 3, `${key}: XYZ positions`);
        for (const value of position.array) assert.ok(Number.isFinite(value), `${key}: finite vertex`);
        for (const value of child.matrixWorld.elements) assert.ok(Number.isFinite(value), `${key}: finite transform`);
        const indices = child.geometry.index?.array;
        const count = indices?.length ?? position.count;
        assert.equal(count % 3, 0, `${key}: complete triangles`);
        if (indices) for (const index of indices) {
          assert.ok(Number.isInteger(index) && index >= 0 && index < position.count, `${key}: triangle index in range`);
        }
        // Standard revolution primitives can include collapsed triangles at a
        // pole. They are harmless; a whole zero-area mesh would be a failure.
        let hasArea = false;
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        for (let i = 0; i < count && !hasArea; i += 3) {
          a.fromBufferAttribute(position, indices ? indices[i] : i);
          b.fromBufferAttribute(position, indices ? indices[i + 1] : i + 1);
          c.fromBufferAttribute(position, indices ? indices[i + 2] : i + 2);
          hasArea = b.sub(a).cross(c.sub(a)).lengthSq() > 1e-18;
        }
        assert.ok(hasArea, `${key}: mesh has nonzero surface area`);
      });
    } finally { dispose(scene.group); }
  });
});
