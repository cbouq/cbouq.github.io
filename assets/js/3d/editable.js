/*
 * A block world you can change: chunked meshes (only the chunks next to an edit are rebuilt), a ray that walks the blocks to find what the
 * pointer is over, a little outline on it and the dust of a broken block. Used by the mine and by the builder.
 */
import * as THREE from 'three';
import { meshBlocks } from './voxel.js';

/** The three materials of a block world (solid, cut-out with alpha, water) and the depth material that lets leaves and glass cast cut shadows. */
export function blockMaterials(assets, { emissive = 0.5 } = {}) {
  const solid = new THREE.MeshLambertMaterial({ map: assets.map, vertexColors: true, emissiveMap: assets.glow, emissive: 0xffffff, emissiveIntensity: emissive });
  const cut = new THREE.MeshLambertMaterial({ map: assets.map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissiveMap: assets.glow, emissive: 0xffffff, emissiveIntensity: emissive });
  const water = new THREE.MeshPhongMaterial({ map: assets.map, vertexColors: true, transparent: true, opacity: 0.8, shininess: 80, specular: 0x667788 });
  const depthCut = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: assets.map, alphaTest: 0.5 });
  return { solid, cut, water, depthCut, all: [solid, cut, water], setEmissive(v) { solid.emissiveIntensity = cut.emissiveIntensity = v; } };
}

const CS = 16;

export class EditableWorld {
  constructor(assets, W, H, D, mats) {
    this.assets = assets; this.W = W; this.H = H; this.D = D; this.mats = mats;
    this.grid = new Uint16Array(W * H * D);
    this.group = new THREE.Group();
    this.chunks = new Map();
    this.dirty = new Set();
    this.nx = Math.ceil(W / CS); this.ny = Math.ceil(H / CS); this.nz = Math.ceil(D / CS);
  }
  id(name) { return this.assets.blocks[name].id + 1; }
  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.W && y < this.H && z < this.D; }
  get(x, y, z) { return this.inside(x, y, z) ? this.grid[(x * this.H + y) * this.D + z] : 0; }
  block(x, y, z) { const v = this.get(x, y, z); return v ? this.assets.blockById[v - 1] : null; }
  setRaw(x, y, z, v) { if (this.inside(x, y, z)) this.grid[(x * this.H + y) * this.D + z] = v; }
  /** Changes a block and marks every chunk that can see the change (corners shade by their neighbours) for a rebuild. */
  set(x, y, z, v) {
    if (!this.inside(x, y, z)) return;
    this.grid[(x * this.H + y) * this.D + z] = v;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const cx = Math.floor((x + dx) / CS), cy = Math.floor((y + dy) / CS), cz = Math.floor((z + dz) / CS);
      if (cx >= 0 && cy >= 0 && cz >= 0 && cx < this.nx && cy < this.ny && cz < this.nz) this.dirty.add((cx * this.ny + cy) * this.nz + cz);
    }
  }
  buildAll() {
    for (let cx = 0; cx < this.nx; cx++) for (let cy = 0; cy < this.ny; cy++) for (let cz = 0; cz < this.nz; cz++) this.dirty.add((cx * this.ny + cy) * this.nz + cz);
    this.rebuild();
  }
  rebuild() {
    if (!this.dirty.size) return false;
    const get = (x, y, z) => this.grid[(x * this.H + y) * this.D + z];
    for (const key of this.dirty) {
      const cz = key % this.nz, cy = Math.floor(key / this.nz) % this.ny, cx = Math.floor(key / (this.nz * this.ny));
      const old = this.chunks.get(key);
      if (old) { for (const m of old) { this.group.remove(m); m.geometry.dispose(); } }
      const g = meshBlocks(this.assets, this.W, this.H, this.D, get, [cx * CS, Math.min(this.W, (cx + 1) * CS), cy * CS, Math.min(this.H, (cy + 1) * CS), cz * CS, Math.min(this.D, (cz + 1) * CS)]);
      const list = [];
      for (const [geo, mat, cast, cut] of [[g.solid, this.mats.solid, true, false], [g.cut, this.mats.cut, true, true], [g.water, this.mats.water, false, false]]) {
        if (!geo) continue;
        const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; if (cut) m.customDepthMaterial = this.mats.depthCut;
        this.group.add(m); list.push(m);
      }
      this.chunks.set(key, list);
    }
    this.dirty.clear();
    return true;
  }
  /** A ray through the blocks (grid space). Returns { x, y, z, face: [nx, ny, nz], v } for the first block that is not air or water, or null. */
  cast(o, d, max = 160) {
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
    const tdx = sx ? Math.abs(1 / d.x) : Infinity, tdy = sy ? Math.abs(1 / d.y) : Infinity, tdz = sz ? Math.abs(1 / d.z) : Infinity;
    let tmx = sx ? ((sx > 0 ? x + 1 - o.x : o.x - x) * tdx) : Infinity, tmy = sy ? ((sy > 0 ? y + 1 - o.y : o.y - y) * tdy) : Infinity, tmz = sz ? ((sz > 0 ? z + 1 - o.z : o.z - z) * tdz) : Infinity;
    let face = [0, 0, 0], t = 0;
    for (let i = 0; i < 700 && t <= max; i++) {
      const v = this.get(x, y, z);
      if (v) { const b = this.assets.blockById[v - 1]; if (b && b.kind !== 2) return { x, y, z, face, v, t }; }
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; face = [-sx, 0, 0]; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; face = [0, -sy, 0]; }
      else { z += sz; t = tmz; tmz += tdz; face = [0, 0, -sz]; }
    }
    return null;
  }
  /** What is under the pointer: ndc in [-1, 1]. */
  pick(camera, ndcX, ndcY, max) {
    const o = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    const d = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera).sub(o).normalize();
    const p = this.group.position;
    return this.cast(new THREE.Vector3(o.x - p.x, o.y - p.y, o.z - p.z), d, max);
  }
  dispose() {
    for (const list of this.chunks.values()) for (const m of list) m.geometry.dispose();
    this.chunks.clear();
  }
}

/** The outline of the block the pointer is on. */
export function makeOutline() {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.012, 1.012, 1.012));
  const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.95, depthTest: true }));
  line.visible = false; line.renderOrder = 5;
  return line;
}

/** Square specks that fly out of a broken block and fall. */
export class Dust {
  constructor(scene, count = 360, size = 0.2) {
    this.n = count; this.i = 0;
    this.pos = new Float32Array(count * 3); this.col = new Float32Array(count * 3); this.vel = new Float32Array(count * 3); this.life = new Float32Array(count);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
    this.pts = new THREE.Points(this.geo, this.mat); this.pts.frustumCulled = false;
    this.pos.fill(-9999);
    scene.add(this.pts);
    this.active = 0;
  }
  burst(p, color, n = 18, speed = 3.2) {
    for (let k = 0; k < n; k++) {
      const i = this.i; this.i = (this.i + 1) % this.n;
      this.pos[i * 3] = p.x + Math.random(); this.pos[i * 3 + 1] = p.y + Math.random(); this.pos[i * 3 + 2] = p.z + Math.random();
      const j = 0.75 + Math.random() * 0.5;
      this.col[i * 3] = color[0] * j; this.col[i * 3 + 1] = color[1] * j; this.col[i * 3 + 2] = color[2] * j;
      this.vel[i * 3] = (Math.random() - 0.5) * speed; this.vel[i * 3 + 1] = Math.random() * speed * 0.9 + 0.5; this.vel[i * 3 + 2] = (Math.random() - 0.5) * speed;
      this.life[i] = 0.7 + Math.random() * 0.5;
    }
    this.active = 1.4;
  }
  update(dt) {
    if (this.active <= 0) return false;
    this.active -= dt;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -9999; continue; }
      this.vel[i * 3 + 1] -= 11 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
    return true;
  }
}
