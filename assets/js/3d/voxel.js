/*
 * Voxel World — the 3D engine of the site: it reads what the game itself exported (the texture atlas, the table of blocks, the voxel models of
 * the weapons and the creatures, a village made by the game's generator) and builds real meshes out of it, with the same tricks the game uses:
 * shaded corners (ambient occlusion), faces of the wide natural surfaces turned at random so the tile never repeats, plants as crossed quads.
 */
import * as THREE from 'three';

export const BASE = new URL('../../3d/', import.meta.url).href;

const jsonCache = new Map();
export function loadJson(path) {
  if (!jsonCache.has(path)) jsonCache.set(path, fetch(BASE + path).then(r => { if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }));
  return jsonCache.get(path);
}

function loadTexture(url) {
  return new Promise((ok, bad) => new THREE.TextureLoader().load(url, ok, undefined, bad));
}

/** The atlas, the glow map and the block table - one per page. */
export class Assets {
  static async load() {
    const [info, blocks, dark, classic, glow] = await Promise.all([
      loadJson('atlas.json'), loadJson('blocks.json'),
      loadTexture(BASE + 'atlas-dark.png'), loadTexture(BASE + 'atlas-classic.png'), loadTexture(BASE + 'atlas-glow.png')
    ]);
    const a = new Assets();
    a.info = info;
    a.keyIndex = {};
    info.keys.forEach((k, i) => { a.keyIndex[k] = i; });
    a.blocks = {};          // name -> { kind, faces:[top,bottom,north,south,east,west] }
    a.blockById = {};
    blocks.forEach(b => { const o = { id: b[0], name: b[1], kind: b[2], faces: b.slice(3, 9) }; a.blocks[b[1]] = o; a.blockById[b[0]] = o; });
    a.calm = new Set(info.calm);
    a.turn = new Set(info.turn);
    a.glowKeys = new Set(info.glow);
    for (const t of [dark, classic, glow]) {
      t.flipY = false;
      t.colorSpace = t === glow ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 4;
      t.needsUpdate = true;
    }
    a.textures = { dark, classic };
    a.glow = glow;
    a.theme = 'dark';
    return a;
  }
  get map() { return this.textures[this.theme]; }
  /** The average colour of a tile of the atlas (for the dust of a broken block). */
  tileColor(key) {
    this._tc = this._tc || new Map();
    if (this._tc.has(key)) return this._tc.get(key);
    const { cols, tile } = this.info, img = this.textures.dark.image;
    const c = document.createElement('canvas'); c.width = c.height = tile;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, (key % cols) * tile, ((key / cols) | 0) * tile, tile, tile, 0, 0, tile, tile);
    const d = g.getImageData(0, 0, tile, tile).data; let r = 0, gr = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++; }
    const col = n ? [r / n / 255, gr / n / 255, b / n / 255] : [0.5, 0.5, 0.5];
    this._tc.set(key, col); return col;
  }
  setTheme(theme, materials) {
    this.theme = theme;
    for (const m of materials) { m.map = this.map; m.needsUpdate = true; }
  }
}

// ---------------------------------------------------------------------------------------------------- hashes, as in the game

function orientation(bx, by, bz, side) {
  let h = Math.imul(bx, 73856093) ^ Math.imul(by, 19349663) ^ Math.imul(bz, 83492791) ^ Math.imul(side, 2654435);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 3) & 7;
}
function hash3(x, y, z, s) {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791) ^ Math.imul(s, 2654435761);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h & 0xffff) / 65535;
}
export { hash3 };

// ---------------------------------------------------------------------------------------------------- the face table

// directions: 0 top(+y) 1 bottom(-y) 2 north(-z) 3 south(+z) 4 east(+x) 5 west(-x)
const DIRS = [[0, 1, 0], [0, -1, 0], [0, 0, -1], [0, 0, 1], [1, 0, 0], [-1, 0, 0]];
// for each direction: the four corners (counter-clockwise seen from outside, starting bottom-left) as offsets in the unit cube,
// and the two tangent axes used to find the neighbours that darken a corner
const FACES = [
  { c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], u: [1, 0, 0], v: [0, 0, -1] },
  { c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], u: [1, 0, 0], v: [0, 0, 1] },
  { c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], u: [-1, 0, 0], v: [0, 1, 0] },
  { c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], u: [1, 0, 0], v: [0, 1, 0] },
  { c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], u: [0, 0, -1], v: [0, 1, 0] },
  { c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], u: [0, 0, 1], v: [0, 1, 0] }
];
const SIDE_LIGHT = [1.0, 0.55, 0.82, 0.82, 0.9, 0.9];   // only for the shapes without lights (models seen unlit)
const AO = [0.58, 0.74, 0.88, 1.0];

/** Geometry builder: pushes quads with colours and atlas coordinates. */
class Quads {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.col = []; this.idx = []; this.n = 0; }
  quad(p, nrm, uvs, cols) {
    for (let i = 0; i < 4; i++) {
      this.pos.push(p[i][0], p[i][1], p[i][2]); this.nor.push(nrm[0], nrm[1], nrm[2]);
      this.uv.push(uvs[i][0], uvs[i][1]); this.col.push(cols[i][0], cols[i][1], cols[i][2]);
    }
    // flip the diagonal when the corners are lit unevenly, so the shading does not show a seam
    if (cols[0][0] + cols[2][0] > cols[1][0] + cols[3][0]) this.idx.push(this.n, this.n + 1, this.n + 2, this.n, this.n + 2, this.n + 3);
    else this.idx.push(this.n + 1, this.n + 2, this.n + 3, this.n + 1, this.n + 3, this.n);
    this.n += 4;
  }
  geometry() {
    if (!this.n) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

/**
 * Meshes a block world (or just the `bounds` = [x0,x1,y0,y1,z0,z1) piece of it). `get(x,y,z)` returns a block id (0 = air). Returns { solid, cut, water } geometries.
 */
export function meshBlocks(assets, W, H, D, get, bounds) {
  const { info } = assets;
  const cols = info.cols, rows = info.rows, tile = info.tile;
  const solid = new Quads(), cut = new Quads(), water = new Quads();
  // ids are block ordinals + 1 in the grid (0 = air), see worldFromVillage
  const blk = (x, y, z) => { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return null; const id = get(x, y, z); return id ? assets.blockById[id - 1] : null; };
  const opaque = b => b && (b.kind === 0 || b.kind === 3);

  function tileUv(key, corner, turn, flip) {
    // corner 0..3 = bottom-left, bottom-right, top-right, top-left of the face; the picture is turned by `turn` quarters and mirrored if `flip`
    const k = (corner + turn) & 3;
    let u = (k === 1 || k === 2) ? 1 : 0, v = (k >= 2) ? 1 : 0;
    if (flip) u = 1 - u;
    const cx = key % cols, cy = (key / cols) | 0, e = 0.35 / tile;       // a third of a texel in from the edge: no bleeding between neighbours
    return [(cx + e + u * (1 - 2 * e)) / cols, (cy + e + v * (1 - 2 * e)) / rows];
  }
  function solidAt(x, y, z) { const b = blk(x, y, z); return b && (b.kind === 0 || b.kind === 3) ? 1 : 0; }

  const [bx0, bx1, by0, by1, bz0, bz1] = bounds || [0, W, 0, H, 0, D];          // only a piece of the world (a chunk) when asked
  for (let x = bx0; x < bx1; x++) for (let y = by0; y < by1; y++) for (let z = bz0; z < bz1; z++) {
    const b = blk(x, y, z);
    if (!b) continue;
    if (b.kind === 1) {                                     // a plant: two crossed quads
      const key = b.faces[2], uvs = [0, 1, 2, 3].map(c => tileUv(key, c, 0, false));
      const j = (hash3(x, y, z, 7) - 0.5) * 0.18, jz = (hash3(x, y, z, 9) - 0.5) * 0.18;
      const col = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
      const q = [[[x + .08 + j, y, z + .08 + jz], [x + .92 + j, y, z + .92 + jz], [x + .92 + j, y + .95, z + .92 + jz], [x + .08 + j, y + .95, z + .08 + jz]],
                 [[x + .92 + j, y, z + .08 + jz], [x + .08 + j, y, z + .92 + jz], [x + .08 + j, y + .95, z + .92 + jz], [x + .92 + j, y + .95, z + .08 + jz]]];
      cut.quad(q[0], [0, 1, 0], uvs, col); cut.quad(q[1], [0, 1, 0], uvs, col);
      continue;
    }
    for (let d = 0; d < 6; d++) {
      const dx = DIRS[d][0], dy = DIRS[d][1], dz = DIRS[d][2];
      const nb = blk(x + dx, y + dy, z + dz);
      if (b.kind === 2) { if (d !== 0 && d !== 2 && d !== 3 && d !== 4 && d !== 5) continue; if (nb && (nb.kind === 2 || opaque(nb))) continue; }
      else if (b.kind === 3) { if (nb && opaque(nb)) continue; }
      else if (b.kind === 4) { if (nb && (nb.kind === 4 || opaque(nb))) continue; }
      else if (nb && opaque(nb)) continue;
      const f = FACES[d], key = b.faces[d];
      let turn = 0, flip = false;
      if (assets.turn.has(key) && b.kind !== 2) { const o = orientation(x, y, z, Math.round(dx * 3 + dy * 5 + dz * 7)); turn = o & 3; flip = (o & 4) !== 0; }
      const p = [], uvs = [], cl = [];
      for (let c = 0; c < 4; c++) {
        const co = f.c[c];
        const top = (b.kind === 2 && d === 0) ? 0.88 : 1;
        p.push([x + co[0], y + (co[1] ? top : 0), z + co[2]]);
        uvs.push(tileUv(key, c, turn, flip));
        // ambient occlusion of this corner: the two neighbours along the face and the one between them
        const ux = (co[0] * 2 - 1), uy = (co[1] * 2 - 1), uz = (co[2] * 2 - 1);
        let t1, t2;
        if (d < 2) { t1 = [ux, 0, 0]; t2 = [0, 0, uz]; } else if (d < 4) { t1 = [ux, 0, 0]; t2 = [0, uy, 0]; } else { t1 = [0, 0, uz]; t2 = [0, uy, 0]; }
        const s1 = solidAt(x + dx + t1[0], y + dy + t1[1], z + dz + t1[2]), s2 = solidAt(x + dx + t2[0], y + dy + t2[1], z + dz + t2[2]);
        const cn = solidAt(x + dx + t1[0] + t2[0], y + dy + t1[1] + t2[1], z + dz + t1[2] + t2[2]);
        const ao = AO[(s1 && s2) ? 0 : 3 - (s1 + s2 + cn)];
        const grain = 1 + (hash3(x, y, z, d) - 0.5) * 0.10;     // the quiet drift of tone from block to block
        const g = (b.kind === 2 || b.kind === 4) ? 1 : ao * grain;
        cl.push([g, g, g]);
      }
      (b.kind === 2 ? water : (b.kind === 3 || b.kind === 4) ? cut : solid).quad(p, [dx, dy, dz], uvs, cl);
    }
  }
  return { solid: solid.geometry(), cut: cut.geometry(), water: water.geometry() };
}

/** Rebuilds the grid of a village export: ids are block ordinals + 1. */
export function worldFromVillage(v) {
  const W = v.w, D = v.d, H = v.h;
  const grid = new Uint16Array(W * H * D);
  let i = 0;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const runs = v.cols[i++];
    for (let r = 0; r < runs; r++) {
      const y0 = v.cols[i++], len = v.cols[i++], id = v.cols[i++];
      for (let y = y0; y < y0 + len && y < H; y++) grid[(x * H + y) * D + z] = id + 1;
    }
  }
  return { W, H, D, grid, get: (x, y, z) => grid[(x * H + y) * D + z] };
}

// ---------------------------------------------------------------------------------------------------- voxel models (weapons, creatures)

/**
 * Builds a model from the game's export. Returns { group, parts, size } where `parts` maps a part name to its THREE.Group (pivot at the joint),
 * so a creature can swing its limbs. Units are blocks.
 */
export function buildModel(data) {
  const [sx, sy, sz] = data.d, vs = data.v;
  const grid = new Int16Array(sx * sy * sz).fill(-1), part = new Int16Array(sx * sy * sz);
  const idx = (x, y, z) => (x * sy + y) * sz + z;
  const r = data.rows;
  for (let i = 0; i < r.length; i += 6) {
    const x0 = r[i], len = r[i + 1], y = r[i + 2], z = r[i + 3], p = r[i + 4], pt = r[i + 5];
    for (let x = x0; x < x0 + len; x++) { grid[idx(x, y, z)] = p; part[idx(x, y, z)] = pt; }
  }
  const pal = data.pal.map(h => new THREE.Color('#' + h)), glow = data.glow;
  const solidAt = (x, y, z) => (x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz && grid[idx(x, y, z)] >= 0) ? 1 : 0;
  const nParts = data.parts.length;
  const buckets = []; for (let i = 0; i < nParts; i++) buckets.push({ lit: { pos: [], nor: [], col: [], idx: [] }, glow: { pos: [], nor: [], col: [], idx: [] } });
  const cx = sx / 2, cz = sz / 2;
  for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) {
    const p = grid[idx(x, y, z)];
    if (p < 0) continue;
    const pi = part[idx(x, y, z)], isGlow = glow[p] === 1, B = isGlow ? buckets[pi].glow : buckets[pi].lit;
    for (let d = 0; d < 6; d++) {
      const dx = DIRS[d][0], dy = DIRS[d][1], dz = DIRS[d][2];
      if (solidAt(x + dx, y + dy, z + dz) && (part[idx(x + dx, y + dy, z + dz)] === pi)) continue;
      const f = FACES[d], base = B.pos.length / 3, c0 = pal[p];
      const cl = [];
      for (let c = 0; c < 4; c++) {
        const co = f.c[c], ux = co[0] * 2 - 1, uy = co[1] * 2 - 1, uz = co[2] * 2 - 1;
        let t1, t2;
        if (d < 2) { t1 = [ux, 0, 0]; t2 = [0, 0, uz]; } else if (d < 4) { t1 = [ux, 0, 0]; t2 = [0, uy, 0]; } else { t1 = [0, 0, uz]; t2 = [0, uy, 0]; }
        const s1 = solidAt(x + dx + t1[0], y + dy + t1[1], z + dz + t1[2]), s2 = solidAt(x + dx + t2[0], y + dy + t2[1], z + dz + t2[2]);
        const cn = solidAt(x + dx + t1[0] + t2[0], y + dy + t1[1] + t2[1], z + dz + t1[2] + t2[2]);
        cl.push(isGlow ? 1 : AO[(s1 && s2) ? 0 : 3 - (s1 + s2 + cn)]);
        B.pos.push((x + co[0] - cx) * vs, (y + co[1] - data.oy) * vs, (z + co[2] - cz) * vs);
        B.nor.push(dx, dy, dz);
        B.col.push(c0.r * cl[c], c0.g * cl[c], c0.b * cl[c]);
      }
      if (cl[0] + cl[2] > cl[1] + cl[3]) B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else B.idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
    }
  }
  // the pieces hang from each other at their joints
  const group = new THREE.Group(), parts = {}, holders = [];
  const matLit = new THREE.MeshLambertMaterial({ vertexColors: true });
  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const toGeo = B => {
    if (!B.idx.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
    g.setIndex(B.idx); return g;
  };
  data.parts.forEach((p, i) => {
    const holder = new THREE.Group();                      // pivot at the joint, in blocks (model space)
    holder.userData.pivot = new THREE.Vector3((p[2] - cx) * vs, (p[3] - data.oy) * vs, (p[4] - cz) * vs);
    holder.userData.name = p[0];
    const inner = new THREE.Group();                       // meshes are drawn around the model origin: shift them back by the pivot
    inner.position.copy(holder.userData.pivot).negate();
    const gl = toGeo(buckets[i].lit), gg = toGeo(buckets[i].glow);
    if (gl) { const m = new THREE.Mesh(gl, matLit); m.castShadow = true; m.receiveShadow = true; inner.add(m); }
    if (gg) inner.add(new THREE.Mesh(gg, matGlow));
    holder.add(inner);
    holders.push(holder); parts[p[0]] = holder;
  });
  data.parts.forEach((p, i) => {
    const parent = p[1] ? parts[p[1]] : null;
    if (parent) { holders[i].position.copy(holders[i].userData.pivot).sub(parent.userData.pivot); parent.add(holders[i]); }
    else { holders[i].position.copy(holders[i].userData.pivot); group.add(holders[i]); }
  });
  group.userData.size = new THREE.Vector3(sx * vs, sy * vs, sz * vs);
  group.userData.originY = data.oy * vs;
  return { group, parts, size: group.userData.size, materials: [matLit, matGlow] };
}

/**
 * The elbows (Fase 40): the forearm part (foreL / foreR, hanging from the arm at the elbow) folds forward as far as the arm lifts, a little
 * always and a little more in a stride - the same rule the game uses. `stiff` 0..1 keeps the arm straighter (a long tool carried in the hand).
 * Angles are in radians, negative = forward. Does nothing for a model whose arms are a single block.
 */
export function bendElbows(P, armL, armR, speed = 0, stiffL = 0, stiffR = 0) {
  const bend = (a, st) => Math.min(120, 8 + 10 * Math.min(1, speed) + 0.45 * Math.min(150, Math.max(0, -a * 57.29578))) * (1 - Math.min(1, Math.max(0, st))) * Math.PI / 180;
  if (P.foreL) P.foreL.rotation.x = -bend(armL, stiffL);
  if (P.foreR) P.foreR.rotation.x = -bend(armR, stiffR);
}
