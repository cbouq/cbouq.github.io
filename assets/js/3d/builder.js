/*
 * The builder: a little floating plot with a cottage, made of the game's own blocks. Pick a block, click to place it, switch to dig mode (or right-click)
 * to take one away, turn the day into night and watch the torches take over. Take a picture of what you built.
 */
import * as THREE from 'three';
import { View, Orbit, REDUCED, lerp, clamp, noise2 } from './rig.js';
import { hash3 } from './voxel.js';
import { Sky } from './sky.js';
import { EditableWorld, blockMaterials, makeOutline, Dust } from './editable.js';

export const PALETTE = ['STONE_BRICKS', 'COBBLESTONE', 'OAK_PLANKS', 'SPRUCE_PLANKS', 'DARK_OAK_PLANKS', 'CHERRY_PLANKS', 'OAK_WOOD', 'BRICK', 'SANDSTONE', 'QUARTZ_BLOCK', 'TERRACOTTA_RED', 'WOOL_WHITE', 'WOOL_RED', 'WOOL_BLUE',
  'GLASS', 'STAINED_GLASS_PURPLE', 'GLOWSTONE', 'SEA_LANTERN', 'TORCH', 'AMETHYST_BLOCK', 'OBSIDIAN', 'GOLD_BLOCK', 'BOOKSHELF', 'HAY_BALE', 'MOSSY_STONE_BRICKS', 'DEEPSLATE_BRICKS', 'GRASS', 'DIRT', 'SNOW', 'WATER', 'OAK_LEAVES'];
const LIGHTS = new Set(['TORCH', 'GLOWSTONE', 'SEA_LANTERN', 'MAGMA']);

export async function createBuilder(host, assets) {
  const W = 34, H = 30, D = 34, GY = 8;
  const view = new View(host, { fov: 38, far: 1200, maxDpr: 2 });
  const { scene, camera, renderer } = view;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const sky = new Sky(scene, { dark: true });
  const mats = blockMaterials(assets, { emissive: 0.5 });
  const world = new EditableWorld(assets, W, H, D, mats);
  world.group.position.set(-W / 2, -GY, -D / 2);
  scene.add(world.group);
  const id = n => world.id(n), n2 = noise2(4);

  // ------------------------------------------------------------------ a floating plot with a cottage
  const R0 = Math.min(W, D) / 2 - 2.5;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const dx = x - W / 2 + 0.5, dz = z - D / 2 + 0.5, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
    const edge = R0 + 1.6 * Math.sin(3 * th + 0.5) + 1.1 * Math.sin(5 * th + 1.7) + 2 * (n2(x * 0.25, z * 0.25) - 0.5);
    if (r > edge) continue;
    const k = clamp(r / edge, 0, 1), depth = 3 + (1 - Math.pow(k, 1.5)) * 6 + (n2(x * 0.4 + 9, z * 0.4) - 0.5) * 2.2;
    for (let y = Math.max(0, Math.floor(GY - depth)); y <= GY; y++) world.setRaw(x, y, z, id(y === GY ? 'GRASS' : y > GY - 3 ? 'DIRT' : (hash3(x, y, z, 3) > 0.86 ? 'COBBLESTONE' : 'STONE')));
  }
  const put = (x, y, z, n) => world.setRaw(x, y, z, id(n));
  // cottage
  const cx = 11, cz = 13, cw = 9, cd = 7, fy = GY + 1;
  for (let x = cx; x < cx + cw; x++) for (let z = cz; z < cz + cd; z++) put(x, GY, z, 'COBBLESTONE');
  for (let y = fy; y < fy + 4; y++) for (let x = cx; x < cx + cw; x++) for (let z = cz; z < cz + cd; z++) {
    const edgeX = x === cx || x === cx + cw - 1, edgeZ = z === cz || z === cz + cd - 1;
    if (!edgeX && !edgeZ) continue;
    const corner = edgeX && edgeZ;
    let b = corner ? 'OAK_WOOD' : 'OAK_PLANKS';
    if (!corner && y === fy + 1 && ((edgeZ && (x === cx + 2 || x === cx + cw - 3)) || (edgeX && z === cz + 3))) b = 'GLASS';
    if (z === cz && x === cx + 4 && y <= fy + 1) continue;                    // the door
    put(x, y, z, b);
  }
  for (let l = 0; l < 4; l++) for (let x = cx - 1 + l; x <= cx + cw - l; x++) for (let z = cz - 1 + l; z <= cz + cd - l; z++) {
    if (x < cx - 1 + l || x > cx + cw - l || z < cz - 1 + l || z > cz + cd - l) continue;
    const ring = x === cx - 1 + l || x === cx + cw - l || z === cz - 1 + l || z === cz + cd - l;
    if (ring || l === 3) put(x, fy + 4 + l, z, 'SPRUCE_PLANKS');
  }
  put(cx + 4, fy, cz + 1, 'TORCH'); put(cx + 3, fy + 2, cz - 1, 'TORCH'); put(cx + 5, fy + 2, cz - 1, 'TORCH');
  for (let i = 1; i <= 5; i++) { put(cx + 4, GY, cz - i, 'COBBLESTONE'); if (i % 2) put(cx + 3 + (i % 4), GY, cz - i, 'GRAVEL'); }
  // a tree, flowers
  for (let y = 1; y <= 5; y++) put(24, GY + y, 10, 'OAK_WOOD');
  for (let x = 21; x <= 27; x++) for (let y = GY + 4; y <= GY + 8; y++) for (let z = 7; z <= 13; z++) { const d = Math.hypot(x - 24, (y - GY - 6) * 1.2, z - 10); if (d < 3.3 && (!world.get(x, y, z) || world.get(x, y, z) === id('OAK_LEAVES')) && hash3(x, y, z, 5) > 0.15) put(x, y, z, 'OAK_LEAVES'); }
  for (let x = 4; x < W - 4; x++) for (let z = 4; z < D - 4; z++) if (world.get(x, GY, z) === id('GRASS') && !world.get(x, GY + 1, z) && hash3(x, z, 7, 1) > 0.9) put(x, GY + 1, z, ['TALL_GRASS', 'DANDELION', 'BLUEBELL', 'POPPY', 'DAISY'][Math.floor(hash3(x, z, 3, 2) * 5)]);
  world.buildAll();

  // ------------------------------------------------------------------ light, sky and the torches
  const hemi = sky.hemi;
  const torchLamps = []; for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffa850, 0, 16, 1.5); scene.add(l); torchLamps.push(l); }
  let lightCells = [], lightsDirty = true;
  function scanLights() {
    lightCells = [];
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) { const v = world.grid[(x * H + y) * D + z]; if (v) { const b = assets.blockById[v - 1]; if (b && LIGHTS.has(b.name)) lightCells.push([x, y, z]); } }
    lightsDirty = false;
  }
  const sun = sky.sun; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 330 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.5;

  const outline = makeOutline(); scene.add(outline);
  const dust = new Dust(scene, 300, 0.3);
  const orbit = new Orbit(host, { target: [0, 3, 0], yaw: 0.9, pitch: 0.42, radius: 38, minPitch: 0.06, maxPitch: 1.3, minR: 14, maxR: 70, auto: 0.06 });
  const st = { mode: 'place', block: 'STONE_BRICKS', time: 0.25, timeTarget: 0.25, hover: null, history: [], px: 0, py: 0, onChange: null, count: 0 };
  const tmp = new THREE.Vector3();

  view.update = (dt, time) => {
    const moving = orbit.step(dt, !st.hover);
    orbit.apply(camera);
    let d = st.timeTarget - st.time; d = ((d + 1.5) % 1) - 0.5;
    if (Math.abs(d) > 1e-4) st.time += d * Math.min(1, dt * 2.5);
    const s = sky.setTime(st.time, time);
    mats.setEmissive(0.45 + 0.9 * s.night);
    sun.target.position.set(0, 0, 0); sun.position.copy(s.dayK > 0.04 ? s.sunDir : s.sunDir.clone().negate()).multiplyScalar(160);
    sky.layoutClouds(time);
    if (world.rebuild()) lightsDirty = true;
    if (lightsDirty) scanLights();
    const c = orbit.target;
    const near = lightCells.map(p => [Math.hypot(p[0] - W / 2 - c.x, p[1] - GY - c.y, p[2] - D / 2 - c.z), p]).sort((a, b) => a[0] - b[0]).slice(0, torchLamps.length);
    torchLamps.forEach((l, i) => { const n = near[i]; if (n) { l.position.set(n[1][0] + 0.5 - W / 2, n[1][1] + 0.8 - GY, n[1][2] + 0.5 - D / 2); l.intensity = (s.night * 20 + 1.2) * (0.9 + 0.1 * Math.sin(time * 9 + i)); } else l.intensity = 0; });
    dust.update(dt);
    return true;
  };

  // ------------------------------------------------------------------ pointer
  function target(e) {
    const r = host.getBoundingClientRect();
    const hit = world.pick(camera, ((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1), 160);
    return hit;
  }
  function showOutline(hit, remove) {
    if (!hit) { outline.visible = false; return; }
    const cell = remove ? [hit.x, hit.y, hit.z] : [hit.x + hit.face[0], hit.y + hit.face[1], hit.z + hit.face[2]];
    outline.visible = world.inside(...cell);
    outline.position.set(cell[0] + 0.5 + world.group.position.x, cell[1] + 0.5 + world.group.position.y, cell[2] + 0.5 + world.group.position.z);
    outline.material.color.set(remove ? 0xff8a7a : 0xffe9a8);
  }
  host.addEventListener('pointermove', e => { st.hover = target(e); showOutline(st.hover, st.mode === 'dig' || e.shiftKey); view.invalidate(); });
  host.addEventListener('pointerleave', () => { st.hover = null; outline.visible = false; });
  let dn = null;
  host.addEventListener('pointerdown', e => { if (e.target.closest('.ui3d, button, a')) return; dn = [e.clientX, e.clientY, e.button]; });
  host.addEventListener('pointerup', e => {
    if (!dn) return; const [x0, y0, b] = dn; dn = null;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > 7) return;
    const hit = target(e); if (!hit) return;
    act(hit, st.mode === 'dig' || b === 2 || e.shiftKey);
  });
  host.addEventListener('contextmenu', e => { e.preventDefault(); const hit = target(e); if (hit) act(hit, true); });

  function act(hit, remove) {
    if (remove) {
      const b = assets.blockById[hit.v - 1]; if (!b || b.name === 'BEDROCK') return;
      st.history.push([hit.x, hit.y, hit.z, hit.v, 0]); world.set(hit.x, hit.y, hit.z, 0);
      dust.burst(new THREE.Vector3(hit.x + world.group.position.x, hit.y + world.group.position.y, hit.z + world.group.position.z), assets.tileColor(b.faces[2]), 16);
    } else {
      const x = hit.x + hit.face[0], y = hit.y + hit.face[1], z = hit.z + hit.face[2];
      if (!world.inside(x, y, z) || world.get(x, y, z)) return;
      const v = id(st.block);
      st.history.push([x, y, z, 0, v]); world.set(x, y, z, v);
      dust.burst(new THREE.Vector3(x + world.group.position.x, y + world.group.position.y, z + world.group.position.z), assets.tileColor(assets.blockById[v - 1].faces[2]), 8, 1.6);
    }
    if (st.history.length > 400) st.history.shift();
    lightsDirty = true; st.count++; if (st.onChange) st.onChange(st.count, st.history.length);
    st.hover = null; outline.visible = false; view.invalidate();
  }
  view.ready = true;

  return {
    view, world, PALETTE,
    setBlock(n) { st.block = n; }, getBlock() { return st.block; },
    setMode(m) { st.mode = m; outline.visible = false; }, getMode() { return st.mode; },
    setNight(on) { st.timeTarget = on ? 0.8 : 0.25; view.invalidate(); },
    undo() { const h = st.history.pop(); if (!h) return false; world.set(h[0], h[1], h[2], h[3]); lightsDirty = true; if (st.onChange) st.onChange(st.count, st.history.length); view.invalidate(); return true; },
    zoom(f) { orbit.radius = clamp(orbit.radius * f, orbit.minR, orbit.maxR); view.invalidate(); },
    onChange(fn) { st.onChange = fn; },
    canUndo: () => st.history.length > 0,
    setTheme(theme) { assets.theme = theme; sky.dark = theme === 'dark'; mats.all.forEach(m => { m.map = assets.map; m.needsUpdate = true; }); mats.depthCut.map = assets.map; view.invalidate(); },
    snapshot() {
      return new Promise(res => { renderer.render(scene, camera); renderer.domElement.toBlob(b => res(b), 'image/png'); });
    }
  };
}
