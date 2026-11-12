import * as THREE from 'three';

/** Original procedural illustration assets. Metres; Y up; travel along +Z.
 * Body envelopes preserve the rulebook values; heights and details are visual
 * assumptions, not clearance envelopes or manufacturers' vehicle models.
 * Materials are deliberately tagged so a single scene palette can restyle them.
 */
export const ASSET_SPECS = Object.freeze({
  person: { height: 1.75, provenance: 'Existing rulebook illustration assumption.' },
  tree: { height: 5, crown: 3, provenance: 'Illustrative tree, not a mature species specification.' },
  car: { length: 5, width: 1.8, height: 1.5, provenance: 'Body plan: existing rulebook S36. Height and detailing: illustration assumptions.' },
  tram: { length: 34, width: 2.4, height: 3.4, provenance: 'Existing rulebook nominal body plan. Height, articulation and detailing: illustration assumptions.' },
  bicycle: { length: 2, width: 0.6, height: 1.2, provenance: 'Existing rulebook typical cycle envelope; original illustrative geometry.' },
  bench: { length: 1.8, height: 0.85, provenance: 'Illustrative furniture dimensions, not a product specification.' },
});

const COLORS = {
  person: 0xc9ccca, foliage: 0xb5c9a7, trunk: 0x927e68,
  vehicle: 0xd4b0a5, glass: 0x6d858a, rubber: 0x616762,
  metal: 0x84908a, furniture: 0xc8ac87,
};

function group(kind) {
  const result = new THREE.Group();
  result.name = kind;
  result.userData.asset = kind;
  result.userData.spec = ASSET_SPECS[kind];
  return result;
}

function mesh(parent, geometry, role, position = [0, 0, 0], outline = false) {
  const result = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: COLORS[role], roughness: 1, metalness: 0,
  }));
  result.userData.role = role;
  result.position.set(...position);
  result.castShadow = true;
  result.receiveShadow = true;
  if (outline) {
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 32),
      new THREE.LineBasicMaterial({ color: 0x48534d, transparent: true, opacity: 0.65 }));
    edge.userData.edge = true;
    result.add(edge);
  }
  parent.add(result);
  return result;
}

function box(parent, size, position, role, outline = true) {
  return mesh(parent, new THREE.BoxGeometry(...size), role, position, outline);
}

function rod(parent, from, to, radius, role, segments = 8) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const result = mesh(parent,
    new THREE.CylinderGeometry(radius, radius, direction.length(), segments),
    role, a.clone().add(b).multiplyScalar(0.5).toArray());
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return result;
}

/** A side profile in Z/Y, extruded along X. */
function profile(parent, points, width, role, outline = true) {
  const shape = new THREE.Shape();
  points.forEach(([z, y], i) => i ? shape.lineTo(z, y) : shape.moveTo(z, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  // Shape X becomes world Z; extrusion Z becomes negative world X.
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(width / 2, 0, 0);
  return mesh(parent, geometry, role, [0, 0, 0], outline);
}

function wheel(parent, x, y, z, radius, width) {
  const tire = mesh(parent, new THREE.CylinderGeometry(radius, radius, width, 16),
    'rubber', [x, y, z]);
  tire.rotation.z = Math.PI / 2;
  const hub = mesh(parent, new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, width + 0.006, 12),
    'metal', [x, y, z]);
  hub.rotation.z = Math.PI / 2;
}

export function createPerson({ pose = 'standing' } = {}) {
  if (!['standing', 'walking', 'waiting'].includes(pose)) throw new RangeError(`Unknown person pose: ${pose}`);
  const result = group('person');
  result.userData.pose = pose;
  // Architectural entourage, not a population/clearance standard. A 0.23 m
  // shaped head, sloping shoulders and clothing taper keep the human silhouette
  // legible without faces, joint balls or an oversized toy-like head.
  // Rings are [height, half-width, half-depth, optional depth offset].
  function form(name, rings) {
    const sides = 12, vertices = [], indices = [];
    rings.forEach(([y, rx, rz, z = 0]) => {
      for (let i = 0; i < sides; i++) {
        const angle = i * Math.PI * 2 / sides;
        vertices.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz + z);
      }
    });
    for (let ring = 0; ring < rings.length - 1; ring++) {
      for (let i = 0; i < sides; i++) {
        const a = ring * sides + i, b = ring * sides + (i + 1) % sides;
        indices.push(a, a + sides, b, b, a + sides, b + sides);
      }
    }
    // The first and last ring have a closed cap even when their radius is not 0.
    for (let i = 1; i < sides - 1; i++) indices.push(0, i, i + 1);
    const top = (rings.length - 1) * sides;
    for (let i = 1; i < sides - 1; i++) indices.push(top, top + i + 1, top + i);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const part = mesh(result, geometry, 'person');
    part.name = name;
    return part;
  }
  function limb(name, from, to, radiusStart, radiusEnd, depth = 0.9) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a), length = direction.length();
    const part = form(name, [
      [0, radiusStart * 0.88, radiusStart * depth * 0.88],
      [length * 0.12, radiusStart, radiusStart * depth],
      [length * 0.76, radiusEnd * 1.08, radiusEnd * depth * 1.08],
      [length, radiusEnd, radiusEnd * depth],
    ]);
    part.position.copy(a);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return part;
  }

  form('torso', [
    [0.965, 0.157, 0.100], [1.055, 0.150, 0.105],
    [1.285, 0.183, 0.120], [1.395, 0.195, 0.106],
    [1.445, 0.125, 0.082], [1.475, 0.067, 0.064],
  ]);
  form('pelvis', [[0.83, 0.137, 0.085], [0.90, 0.157, 0.106], [1.005, 0.150, 0.102]]);
  form('neck', [[1.448, 0.052, 0.052], [1.548, 0.050, 0.048]]);
  form('head', [
    [1.52, 0.050, 0.057, 0.014], [1.555, 0.075, 0.078, 0.009],
    [1.635, 0.089, 0.087], [1.69, 0.082, 0.080, -0.003],
    [1.735, 0.052, 0.054, -0.004], [1.75, 0, 0, -0.004],
  ]);

  for (const side of [-1, 1]) {
    const name = side < 0 ? 'left' : 'right';
    const footZ = pose === 'walking' ? -side * 0.19 : side * -0.035;
    const footX = side * (side < 0 ? 0.095 : 0.12);
    const knee = [side * 0.095, 0.48, pose === 'walking' ? -side * 0.10 + 0.025 : 0.012];
    const ankle = [footX, 0.105, footZ];
    limb(`${name}-thigh`, [side * 0.085, 0.91, 0], knee, 0.080, 0.058, 1.10);
    limb(`${name}-calf`, [knee[0], 0.51, knee[2]], ankle, 0.060, 0.042, 1.04);
    const shoe = form(`${name}-shoe`, [
      [0, 0.054, 0.117, 0.035], [0.027, 0.057, 0.125, 0.040],
      [0.070, 0.050, 0.107, 0.033], [0.105, 0.035, 0.062, 0.005],
    ]);
    shoe.position.set(footX, 0, footZ);

    const shoulder = [side * 0.178, 1.390, 0];
    const elbow = [side * 0.225, 1.145, pose === 'walking' ? side * 0.065 : -0.018];
    let wrist = [side * 0.229, 0.90, pose === 'walking' ? side * 0.145 : 0.024];
    if (pose === 'waiting' && side > 0) wrist = [0.155, 1.025, 0.13];
    limb(`${name}-upper-arm`, shoulder, elbow, 0.065, 0.045);
    limb(`${name}-forearm`, [elbow[0], elbow[1] + 0.025, elbow[2]], wrist, 0.045, 0.031);
    const handEnd = pose === 'waiting' && side > 0
      ? [0.13, 0.97, 0.145]
      : [wrist[0] - side * 0.006, 0.79, wrist[2] + 0.014];
    limb(`${name}-hand`, wrist, handEnd, 0.035, 0.022, 0.68);
  }
  return result;
}

export function createTree({ height = 5, crown = 3 } = {}) {
  if (!(height > 0 && crown > 0)) throw new RangeError('Tree dimensions must be positive.');
  const result = group('tree');
  result.userData.spec = { ...ASSET_SPECS.tree, height, crown };
  const crownBottom = height * 0.42;
  const crownHeight = height - crownBottom;
  const trunkRadius = Math.min(crown * 0.045, height * 0.035);
  mesh(result, new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, height * 0.65, 7),
    'trunk', [0, height * 0.325, 0]);
  rod(result, [0, height * 0.34, 0], [-crown * 0.2, height * 0.65, crown * 0.08], trunkRadius * 0.48, 'trunk');
  rod(result, [0, height * 0.43, 0], [crown * 0.22, height * 0.75, -crown * 0.09], trunkRadius * 0.4, 'trunk');
  // An eight-sided, tiered crown gives a crisp silhouette without triangle lines.
  const rings = [
    [0, crownBottom], [crown * 0.34, crownBottom + crownHeight * 0.09],
    [crown * 0.5, crownBottom + crownHeight * 0.42],
    [crown * 0.43, crownBottom + crownHeight * 0.73],
    [crown * 0.23, crownBottom + crownHeight * 0.93], [0, height],
  ];
  const canopy = new THREE.LatheGeometry(rings.map(([r, y]) => new THREE.Vector2(r, y)), 8);
  const leaf = mesh(result, canopy, 'foliage');
  leaf.material.flatShading = true;
  return result;
}

export function createCar() {
  const result = group('car');
  profile(result, [[-2.5, 0.40], [-2.5, 0.65], [-2.30, 0.82], [2.05, 0.82], [2.5, 0.64], [2.5, 0.40]], 1.8, 'vehicle');
  profile(result, [[-1.35, 0.82], [-0.92, 1.5], [0.73, 1.5], [1.36, 0.82]], 1.52, 'vehicle');
  // Dark inset window bands, separated by the structural B pillar.
  for (const x of [-0.762, 0.762]) {
    const window = profile(result, [[-1.18, 0.91], [-0.84, 1.39], [0.65, 1.39], [1.12, 0.91]], 0.003, 'glass', false);
    window.position.x = x;
    box(result, [0.008, 0.48, 0.055], [x, 1.15, -0.1], 'vehicle', false);
  }
  // Windscreens sit within the cabin silhouette, avoiding exaggerated body bounds.
  const frontGlass = box(result, [1.33, 0.015, 0.69], [0, 1.155, 1.005], 'glass', false);
  frontGlass.rotation.x = Math.atan2(0.68, 0.63);
  const rearGlass = box(result, [1.33, 0.015, 0.62], [0, 1.155, -1.13], 'glass', false);
  rearGlass.rotation.x = -Math.atan2(0.68, 0.43);
  for (const x of [-0.785, 0.785]) for (const z of [-1.55, 1.55]) wheel(result, x, 0.31, z, 0.31, 0.19);
  for (const x of [-0.58, 0.58]) {
    box(result, [0.34, 0.12, 0.008], [x, 0.57, 2.495], 'furniture', false);
    box(result, [0.30, 0.10, 0.008], [x, 0.56, -2.495], 'vehicle', false);
  }
  return result;
}

export function createTram() {
  const result = group('tram');
  const sectionLength = 6.4;
  for (let section = 0; section < 5; section++) {
    const z = (section - 2) * 6.9;
    // Glazing and door faces complete the 2.4 m envelope; the shell is inset
    // by 10 mm so flat-colour materials show the panels without z-fighting.
    box(result, [2.38, 2.48, sectionLength - 0.02], [0, 1.76, z], 'vehicle');
    box(result, [2.18, 0.15, sectionLength - 0.12], [0, 3.075, z], 'metal');
    for (const x of [-1.196, 1.196]) {
      box(result, [0.004, 1.05, sectionLength - 0.5], [x, 2.12, z], 'glass', false);
      // Doors interrupt the window strip; a single centre seam is enough detail.
      box(result, [0.006, 1.90, 1.1], [x, 1.66, z - 0.9], 'metal', false);
      box(result, [0.008, 0.89, 0.89], [x, 2.12, z - 0.9], 'glass', false);
      box(result, [0.008, 1.88, 0.035], [x, 1.66, z - 0.9], 'vehicle', false);
    }
    if (section % 2 === 0) {
      for (const x of [-0.94, 0.94]) for (const dz of [-1.6, 1.6]) wheel(result, x, 0.40, z + dz, 0.40, 0.22);
    }
    if (section < 4) {
      box(result, [2.18, 2.45, 0.5], [0, 1.76, z + 3.45], 'rubber', false);
    }
  }
  for (const z of [-16.9975, 16.9975]) {
    box(result, [1.94, 1.1, 0.005], [0, 2.15, z], 'glass', false);
    for (const x of [-0.83, 0.83]) box(result, [0.22, 0.12, 0.005], [x, 0.96, z], 'furniture', false);
  }
  // A simple roof collector reads at thumbnail size without pretending to show
  // operating wire height. Its highest face fixes the illustrative height.
  box(result, [1.3, 0.1, 0.12], [0, 3.35, 0], 'metal', false);
  rod(result, [-0.45, 3.15, -0.45], [0, 3.30, 0], 0.025, 'metal');
  rod(result, [0.45, 3.15, -0.45], [0, 3.30, 0], 0.025, 'metal');
  return result;
}

export function createBicycle() {
  const result = group('bicycle');
  for (const z of [-0.65, 0.65]) {
    const tire = mesh(result, new THREE.TorusGeometry(0.327, 0.023, 6, 24), 'rubber', [0, 0.35, z]);
    tire.rotation.y = Math.PI / 2;
    rod(result, [-0.05, 0.35, z], [0.05, 0.35, z], 0.035, 'metal');
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 4;
      rod(result, [0, 0.35 + Math.sin(angle) * 0.30, z + Math.cos(angle) * 0.30],
        [0, 0.35 - Math.sin(angle) * 0.30, z - Math.cos(angle) * 0.30], 0.009, 'metal', 5);
    }
  }
  const rear = [0, 0.35, -0.65], crank = [0, 0.36, -0.06];
  const seat = [0, 0.88, -0.28], stem = [0, 0.92, 0.43], front = [0, 0.35, 0.65];
  for (const [a, b] of [[rear, crank], [crank, seat], [seat, rear], [seat, stem], [stem, crank], [stem, front]]) rod(result, a, b, 0.028, 'vehicle');
  rod(result, seat, [0, 1.02, -0.31], 0.025, 'metal');
  box(result, [0.17, 0.06, 0.29], [0, 1.05, -0.33], 'rubber', false);
  rod(result, stem, [0, 1.175, 0.48], 0.024, 'metal');
  rod(result, [-0.3, 1.175, 0.48], [0.3, 1.175, 0.48], 0.025, 'metal');
  rod(result, [-0.12, 0.36, -0.06], [0.12, 0.36, -0.06], 0.02, 'metal');
  return result;
}

export function createBench() {
  const result = group('bench');
  box(result, [0.52, 0.10, 1.8], [0, 0.45, 0], 'furniture');
  box(result, [0.07, 0.38, 1.8], [-0.235, 0.66, 0], 'furniture');
  for (const z of [-0.64, 0.64]) {
    box(result, [0.40, 0.4, 0.055], [0, 0.2, z], 'metal', false);
    box(result, [0.48, 0.045, 0.055], [0, 0.64, z], 'metal', false);
    rod(result, [0.16, 0.45, z], [0.16, 0.64, z], 0.025, 'metal');
  }
  return result;
}
