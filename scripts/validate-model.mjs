/**
 * AI-generated geometry validation. Run from the repository with:
 *   node scripts/validate-model.mjs
 * An external copy can target the same actual source with:
 *   node /path/to/validate-model.mjs --geometry /project/lib/tower-geometry.ts
 *
 * The source is transpiled and imported entirely in memory. The mesh recipe and
 * final grid reproduce TowerScene: 6-sided beams, 8-sided Top Deck cylinders,
 * other cylinders with 16 sides, 0.33 scale, and 0.24-unit cell spacing.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const geometryFlag = process.argv.indexOf('--geometry');
if (geometryFlag >= 0 && !process.argv[geometryFlag + 1]) {
  throw new Error('--geometry requires the actual TypeScript source path.');
}
const geometryPath = geometryFlag >= 0
  ? path.resolve(process.argv[geometryFlag + 1])
  : path.resolve(here, '../lib/tower-geometry.ts');
// Override only when validating a corresponding layout change in TowerScene.
const spacingFlag = process.argv.indexOf('--spacing');
const gridSpacing = spacingFlag >= 0 ? Number(process.argv[spacingFlag + 1]) : 0.24;
assert(Number.isFinite(gridSpacing) && gridSpacing > 0, '--spacing must be a positive finite number.');
const projectRoot = path.dirname(path.dirname(geometryPath));
const requireFromProject = createRequire(path.join(projectRoot, 'package.json'));
const ts = requireFromProject('typescript');
const THREE = requireFromProject('three');

const source = await readFile(geometryPath, 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: geometryPath,
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
});
const errors = (compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
assert.equal(errors.length, 0, errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
const memoryUrl = `data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`;
const { createTowerParts } = await import(memoryUrl);
assert.equal(typeof createTowerParts, 'function', 'The actual source must export createTowerParts().');
const parts = createTowerParts();
assert.equal(parts.length, 640, 'Expected 640 independent geometric parts.');
assert.equal(JSON.stringify(parts), JSON.stringify(createTowerParts()), 'Generation must be deterministic.');
assert.equal(new Set(parts.map(p => p.id)).size, parts.length, 'Part IDs must be unique.');

const sectionIds = new Set(['foundation', 'legs', 'lower', 'main-deck', 'upper', 'top-deck', 'spire']);
const colors = new Set(['orange', 'white', 'glass', 'dark', 'concrete']);
const bySection = {}, byShape = {};
const UP = new THREE.Vector3(0, 1, 0);
const EPSILON = 1e-7;
const material = new THREE.MeshBasicMaterial();
const geometries = new Set();
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const beamGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
geometries.add(boxGeometry); geometries.add(beamGeometry);
const assembledBounds = new THREE.Box3();
const sectionBounds = new Map();

function finiteTriple(value, description) {
  assert(Array.isArray(value) && value.length === 3 && value.every(Number.isFinite), description);
}

const meshes = parts.map(part => {
  assert(typeof part.id === 'string' && part.id.length && part.name, 'Every part must have an ID and name.');
  assert(sectionIds.has(part.section), `${part.id}: recognized section`);
  assert(colors.has(part.color), `${part.id}: recognized color`);
  assert(['beam', 'box', 'cylinder'].includes(part.shape), `${part.id}: recognized shape`);
  finiteTriple(part.position, `${part.id}: finite position`);
  finiteTriple(part.size, `${part.id}: finite size`);
  if (part.rotation) finiteTriple(part.rotation, `${part.id}: finite rotation`);
  if (part.from) finiteTriple(part.from, `${part.id}: finite beam start`);
  if (part.to) finiteTriple(part.to, `${part.id}: finite beam end`);
  bySection[part.section] = (bySection[part.section] ?? 0) + 1;
  byShape[part.shape] = (byShape[part.shape] ?? 0) + 1;

  let geometry = boxGeometry;
  if (part.shape === 'beam') geometry = beamGeometry;
  else if (part.shape === 'cylinder') {
    geometry = new THREE.CylinderGeometry(...part.size, part.section === 'top-deck' ? 8 : 16);
    geometries.add(geometry);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.fromArray(part.position);
  if (part.shape === 'beam') {
    assert(part.from && part.to, `${part.id}: beams require authoritative endpoints`);
    const start = new THREE.Vector3(...part.from), end = new THREE.Vector3(...part.to);
    const direction = end.clone().sub(start);
    assert(direction.length() > EPSILON && part.size[0] > 0, `${part.id}: nonzero beam and positive radius`);
    assert(mesh.position.distanceTo(start.clone().add(end).multiplyScalar(0.5)) < EPSILON, `${part.id}: midpoint matches endpoints`);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
    mesh.scale.set(part.size[0], direction.length(), part.size[0]);
  } else {
    assert(part.size.every(value => value > 0), `${part.id}: positive solid dimensions`);
    if (part.shape === 'box') mesh.scale.fromArray(part.size);
  }
  if (part.rotation) mesh.rotation.set(...part.rotation);
  mesh.updateMatrixWorld(true);
  assert(mesh.matrixWorld.elements.every(Number.isFinite), `${part.id}: finite world transform`);
  const bounds = new THREE.Box3().setFromObject(mesh, true);
  assert(!bounds.isEmpty(), `${part.id}: nonempty mesh bounds`);
  assembledBounds.union(bounds);
  if (!sectionBounds.has(part.section)) sectionBounds.set(part.section, new THREE.Box3());
  sectionBounds.get(part.section).union(bounds);
  return mesh;
});

assert.equal(Object.keys(bySection).length, 7, 'All seven tower systems must exist.');
assert(Math.abs(assembledBounds.min.y) < EPSILON, 'Assembled mesh starts at ground Y=0.');
assert(Math.abs(assembledBounds.max.y - 3.33) < EPSILON, 'Assembled mesh tip is 3.33 units / 333 m.');
for (const [section, height] of [['main-deck', 1.50], ['top-deck', 2.50]]) {
  const bounds = sectionBounds.get(section);
  assert(bounds.min.y <= height && bounds.max.y >= height, `${section} contains its official headline height.`);
}

// All emitted primitives are convex. SAT tests face normals and every pair of
// edge directions after world transformation, avoiding AABB false positives for
// rotated thin truss members. Touching within EPSILON is not volumetric overlap.
function appendDirection(list, direction) {
  if (direction.lengthSq() < 1e-18) return;
  direction.normalize();
  if (!list.some(existing => Math.abs(existing.dot(direction)) > 1 - 1e-9)) list.push(direction);
}

function convexWorldMesh(mesh) {
  const positions = mesh.geometry.getAttribute('position');
  const rawVertices = Array.from({ length: positions.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld));
  const vertexMap = new Map();
  for (const vertex of rawVertices) {
    const key = vertex.toArray().map(v => v.toFixed(9)).join(',');
    if (!vertexMap.has(key)) vertexMap.set(key, vertex);
  }
  const index = mesh.geometry.index;
  const count = index ? index.count : positions.count;
  const normals = [], edges = [];
  for (let i = 0; i < count; i += 3) {
    const a = rawVertices[index ? index.getX(i) : i];
    const b = rawVertices[index ? index.getX(i + 1) : i + 1];
    const c = rawVertices[index ? index.getX(i + 2) : i + 2];
    const ab = b.clone().sub(a), ac = c.clone().sub(a);
    appendDirection(normals, ab.clone().cross(ac));
    appendDirection(edges, ab); appendDirection(edges, ac); appendDirection(edges, c.clone().sub(b));
  }
  return { vertices: [...vertexMap.values()], normals, edges, bounds: new THREE.Box3().setFromObject(mesh, true) };
}

function separatedOnAxis(a, b, axis) {
  if (axis.lengthSq() < 1e-18) return false;
  axis.normalize();
  let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
  for (const vertex of a.vertices) { const p = vertex.dot(axis); minA = Math.min(minA, p); maxA = Math.max(maxA, p); }
  for (const vertex of b.vertices) { const p = vertex.dot(axis); minB = Math.min(minB, p); maxB = Math.max(maxB, p); }
  return Math.min(maxA, maxB) - Math.max(minA, minB) <= EPSILON;
}

function convexIntersects(a, b) {
  for (const normal of [...a.normals, ...b.normals]) {
    if (separatedOnAxis(a, b, normal.clone())) return false;
  }
  for (const edgeA of a.edges) for (const edgeB of b.edges) {
    if (separatedOnAxis(a, b, edgeA.clone().cross(edgeB))) return false;
  }
  return true;
}

const columns = Math.min(30, Math.ceil(Math.sqrt(parts.length * 1.65)));
const rows = Math.ceil(parts.length / columns);
const finalBounds = new THREE.Box3();
const exploded = meshes.map((mesh, slot) => {
  mesh.position.set((slot % columns - (columns - 1) / 2) * gridSpacing,
    (rows - 1 - Math.floor(slot / columns)) * gridSpacing + 0.25, 0);
  mesh.scale.multiplyScalar(0.33);
  mesh.updateMatrixWorld(true);
  const convex = convexWorldMesh(mesh);
  finalBounds.union(convex.bounds);
  return convex;
});
let candidatePairs = 0;
const intersections = [];
for (let i = 0; i < exploded.length; i++) for (let j = i + 1; j < exploded.length; j++) {
  if (!exploded[i].bounds.intersectsBox(exploded[j].bounds)) continue;
  candidatePairs++;
  if (convexIntersects(exploded[i], exploded[j])) {
    intersections.push({ a: parts[i].id, aName: parts[i].name, b: parts[j].id, bName: parts[j].name });
  }
}

const toBounds = bounds => ({ min: bounds.min.toArray().map(v => +v.toFixed(6)), max: bounds.max.toArray().map(v => +v.toFixed(6)) });
console.log(JSON.stringify({
  status: intersections.length ? 'FAIL: final explosion contains intersecting meshes' : 'PASS',
  source: path.relative(projectRoot, geometryPath).replaceAll('\\', '/'),
  parts: parts.length, deterministic: true, uniqueIds: true, finiteTransforms: true,
  bySection, byShape, assembledBounds: toBounds(assembledBounds),
  headlineHeights: { total: 3.33, mainDeck: 1.50, topDeck: 2.50 },
  fullExplosion: { columns, rows, spacing: gridSpacing, scale: 0.33,
    bounds: toBounds(finalBounds), broadPhaseCandidatePairs: candidatePairs,
    convexIntersections: intersections.length, intersections },
  scope: 'Model structure, rendered mesh bounds and final convex-mesh layout; not browser interaction or performance QA.',
}, null, 2));
geometries.forEach(geometry => geometry.dispose()); material.dispose();
if (intersections.length) process.exitCode = 1;

