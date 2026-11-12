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

export function createPerson() {
  const result = group('person');
  // Restrained, neutral scale figure: no hair, clothing textures or facial detail.
  box(result, [0.15, 0.10, 0.27], [-0.11, 0.05, 0.035], 'person', false);
  box(result, [0.15, 0.10, 0.27], [0.11, 0.05, -0.035], 'person', false);
  rod(result, [-0.11, 0.10, 0.02], [-0.10, 0.90, 0], 0.068, 'person');
  rod(result, [0.11, 0.10, -0.04], [0.10, 0.90, 0], 0.068, 'person');
  const torso = mesh(result, new THREE.CylinderGeometry(0.27, 0.20, 0.58, 4), 'person', [0, 1.14, 0]);
  torso.rotation.y = Math.PI / 4;
  torso.scale.set(1, 1, 0.63);
  rod(result, [-0.21, 1.34, 0], [-0.27, 0.86, 0.045], 0.055, 'person');
  rod(result, [0.21, 1.34, 0], [0.27, 0.86, -0.045], 0.055, 'person');
  rod(result, [0, 1.40, 0], [0, 1.51, 0], 0.07, 'person');
  mesh(result, new THREE.SphereGeometry(0.13, 12, 8), 'person', [0, 1.62, 0]);
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
