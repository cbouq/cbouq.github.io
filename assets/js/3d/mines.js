/*
 * The mine: a slab of the underworld cut open like an ant farm - strata, caves, a shaft with galleries, a cavern of crystals, a lake of magma -
 * with the minerals of the game at their real depths. Scroll (or drag the depth bar) to go down; click a block to dig it.
 */
import * as THREE from 'three';
import { View, REDUCED, lerp, clamp, smooth, noise2, noise3, rng } from './rig.js';
import { hash3 } from './voxel.js';
import { EditableWorld, blockMaterials, makeOutline, Dust } from './editable.js';

export const SURFACE = 108;

/** The minerals as the generator places them: [block, label, lowest y, highest y, how many veins in the diorama, vein size, where it glows]. */
export const ORES = [
  ['COAL_ORE', 'Carbone', 0, 96, 22, 7], ['COPPER_ORE', 'Rame', 0, 62, 16, 6], ['TIN_ORE', 'Stagno', 0, 54, 12, 5], ['IRON_ORE', 'Ferro', 0, 52, 14, 5],
  ['SILVER_ORE', 'Argento', 0, 40, 8, 4], ['GOLD_ORE', 'Oro', 0, 30, 4, 3], ['COBALT_ORE', 'Cobalto', 0, 28, 7, 4], ['REDSTONE_ORE', 'Rosso', 0, 24, 5, 4], ['LAPIS_ORE', 'Lapislazzuli', 0, 26, 4, 4],
  ['DIAMOND_ORE', 'Diamante', 0, 16, 3, 3],
  ['FIAMMITE_ORE', 'Fiammite', 4, 26, 3, 3], ['BRINITE_ORE', 'Brinite', 22, 62, 3, 3], ['VOLTITE_ORE', 'Voltite', 28, 80, 3, 3], ['SANGUINITE_ORE', 'Sanguinite', 4, 34, 2, 3], ['OMBRITE_ORE', 'Ombrite', 2, 12, 2, 3]
];
export const RARE = new Set(['FIAMMITE_ORE', 'BRINITE_ORE', 'VOLTITE_ORE', 'SANGUINITE_ORE', 'OMBRITE_ORE', 'COBALT_ORE']);

export async function createMines(host, assets, mineralData) {
  const W = 72, H = 124, D = 16;
  const view = new View(host, { fov: 40, far: 600, maxDpr: 2, clear: 0x07060c });
  const { scene, camera } = view;
  const mats = blockMaterials(assets, { emissive: 0.9 });
  const world = new EditableWorld(assets, W, H, D, mats);
  world.group.position.set(-W / 2, 0, -D + 1);
  scene.add(world.group);
  const id = n => world.id(n);
  const R = rng(11), n3 = noise3(21), n3b = noise3(34), n2 = noise2(8);
  const surf = x => Math.round(SURFACE + (n2(x * 0.06, 3) - 0.5) * 8);
  const torches = [], lamps = [];

  // ------------------------------------------------------------------ strata
  for (let x = 0; x < W; x++) {
    const top = surf(x);
    for (let z = 0; z < D; z++) for (let y = 0; y <= top; y++) {
      let b;
      if (y <= 1) b = 'BEDROCK';
      else if (y === top) b = 'GRASS';
      else if (y > top - 4) b = 'DIRT';
      else if (y < 34) b = n3(x * 0.16, y * 0.2, z * 0.16) > 0.8 ? 'TUFF' : (n3b(x * 0.2, y * 0.2, z * 0.2) > 0.82 ? 'BLACKSTONE' : 'DEEPSLATE');
      else {
        const p = n3(x * 0.13 + 7, y * 0.16, z * 0.13);
        b = p > 0.78 ? 'GRANITE' : p < 0.2 ? 'ANDESITE' : (n3b(x * 0.12, y * 0.12 + 5, z * 0.12) > 0.8 ? 'DIORITE' : 'STONE');
        if (y > 80 && n3b(x * 0.3, y * 0.3, z * 0.3) > 0.78) b = 'COBBLESTONE';
      }
      world.setRaw(x, y, z, id(b));
    }
  }

  // the cut face is ragged, not flat: a few blocks deep here and there, so the walls have relief and the corners shade
  for (let x = 0; x < W; x++) for (let y = 3; y < surf(x) - 5; y++) {
    const k = Math.floor(n3(x * 0.22, y * 0.22, 3) * 2.6 + n3(x * 0.6, y * 0.6, 9) * 1.0);
    for (let z = D - 1; z > D - 1 - k; z--) world.setRaw(x, y, z, 0);
  }

  // ------------------------------------------------------------------ carving helpers
  const air = (x, y, z) => world.setRaw(x, y, z, 0);
  function box(x0, x1, y0, y1, z0, z1, fn) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) fn(x, y, z); }
  const zOpen = 3;                                  // the tunnels reach the cut face and go back to here
  // natural caves
  for (let x = 2; x < W - 2; x++) for (let y = 4; y < SURFACE - 10; y++) for (let z = zOpen; z < D; z++) {
    if (n3(x * 0.085, y * 0.13, z * 0.09 + 40) > 0.69) air(x, y, z);
  }
  // the grand cavern: crystals, a pool, a ceiling that glows
  const cav = { x: 46, y: 50, rx: 15, ry: 9 };
  for (let x = cav.x - cav.rx - 2; x <= cav.x + cav.rx + 2; x++) for (let y = cav.y - cav.ry - 2; y <= cav.y + cav.ry + 2; y++) for (let z = zOpen; z < D; z++) {
    const dx = (x - cav.x) / cav.rx, dy = (y - cav.y) / cav.ry, dz = (z - D * 0.75) / 9;
    const d = dx * dx + dy * dy * 1.3 + dz * dz * 0.5 + (n3(x * 0.3, y * 0.3, z * 0.3) - 0.5) * 0.28;
    if (d < 1) { if (y <= cav.y - 5) world.setRaw(x, y, z, y <= cav.y - 7 ? id('WATER') : 0); else air(x, y, z); }
  }
  // the magma lake at the bottom
  for (let x = 4; x < W - 4; x++) for (let y = 3; y <= 9; y++) for (let z = zOpen; z < D; z++) {
    const l = n3(x * 0.07, 0, z * 0.12 + 90) + (9 - y) * 0.06;
    if (l > 0.58 && n3(x * 0.1, y * 0.2, z * 0.1) > 0.28) world.setRaw(x, y, z, y <= 6 ? id('MAGMA') : 0);
  }
  // the shaft with its scaffolding and the galleries that leave it
  const SX = 9;
  box(SX, SX + 3, 36, SURFACE + 8, zOpen, D - 1, air);
  for (let y = 36; y <= SURFACE - 2; y += 12) {
    box(SX, SX + 3, y, y, zOpen, D - 1, (x, yy, z) => world.setRaw(x, yy, z, id('OAK_PLANKS')));
    for (const x of [SX, SX + 3]) box(x, x, y + 1, y + 11, D - 1, D - 1, (xx, yy, z) => { if (yy <= SURFACE + 2) world.setRaw(xx, yy, z, id('OAK_WOOD')); });
    torches.push([SX + 1, y + 1, D - 2], [SX + 2, y + 6, D - 2]);
    world.setRaw(SX + 1, y + 1, D - 2, id('TORCH'));
  }
  const galleries = [[88, 3, 0.2], [66, 4, 0.7], [44, 3, 0.4], [24, 4, 0.5]];
  galleries.forEach(([gy, h, wobble], gi) => {
    const x1 = gi % 2 ? 62 : 56;
    for (let x = SX + 4; x <= x1; x++) {
      const yy = gy + Math.round((n2(x * 0.1, gi * 7) - 0.5) * 3 * wobble * 2);
      for (let y = yy; y < yy + h; y++) for (let z = zOpen; z < D; z++) air(x, y, z);
      if (x % 9 === 0) {                                                       // timber frames
        for (let y = yy; y < yy + h; y++) { world.setRaw(x, y, D - 1, id('OAK_WOOD')); }
        for (let xx = x - 1; xx <= x + 1; xx++) world.setRaw(xx, yy + h, D - 1, id('OAK_PLANKS'));
      }
      if (x % 7 === 3) { world.setRaw(x, yy, D - 2, id('TORCH')); torches.push([x, yy, D - 2]); }
    }
  });
  // the entrance: a hut of planks at the top of the shaft, trees, flowers
  box(SX - 3, SX + 6, surf(SX) + 1, surf(SX) + 5, D - 6, D - 1, (x, y, z) => { const edge = x === SX - 3 || x === SX + 6 || z === D - 6 || z === D - 1 || y === surf(SX) + 5; if (edge) world.setRaw(x, y, z, id(y === surf(SX) + 5 ? 'OAK_PLANKS' : 'OAK_WOOD')); });
  box(SX, SX + 3, surf(SX), SURFACE + 6, zOpen, D - 1, (x, y, z) => { world.setRaw(x, y, z, 0); });
  for (let x = 0; x < W; x++) {
    if (x > SX - 5 && x < SX + 8) continue;
    const t = surf(x);
    if (hash3(x, 5, 9, 3) > 0.93) { for (let k = 1; k <= 5; k++) world.setRaw(x, t + k, D - 4, id('OAK_WOOD')); box(x - 2, x + 2, t + 5, t + 7, D - 6, D - 2, (a, b, c) => { if (!world.get(a, b, c) && hash3(a, b, c, 4) > 0.2) world.setRaw(a, b, c, id('OAK_LEAVES')); }); }
    else if (hash3(x, 6, 2, 3) > 0.7) world.setRaw(x, t + 1, D - 1 - Math.floor(hash3(x, 1, 1, 1) * 5), id(hash3(x, 2, 2, 2) > 0.5 ? 'TALL_GRASS' : (hash3(x, 3, 3, 3) > 0.5 ? 'DANDELION' : 'BLUEBELL')));
  }

  // ------------------------------------------------------------------ minerals: veins at their real depths; the rare ones mostly on the cut face, where you can see them
  const solidStone = v => v === id('STONE') || v === id('DEEPSLATE') || v === id('GRANITE') || v === id('ANDESITE') || v === id('DIORITE') || v === id('TUFF') || v === id('BLACKSTONE') || v === id('COBBLESTONE');
  const marks = [];
  for (const [name, label, lo, hi, count, size] of ORES) {
    const oid = id(name), rare = RARE.has(name);
    for (let k = 0; k < count; k++) {
      let x = 6 + Math.floor(R() * (W - 12)), y = Math.round(lo + R() * (hi - lo)), z = rare ? (R() < 0.8 ? D - 1 - Math.floor(R() * 3) : zOpen + Math.floor(R() * (D - zOpen))) : (R() < 0.55 ? D - 1 - Math.floor(R() * 3) : Math.floor(R() * D));
      let first = null;
      for (let s = 0; s < size; s++) {
        if (solidStone(world.get(x, y, z))) { world.setRaw(x, y, z, oid); if (!first) first = [x, y, z]; }
        const a = R();
        if (a < 0.33) x += R() < 0.5 ? -1 : 1; else if (a < 0.66) y += R() < 0.5 ? -1 : 1; else z = clamp(z + (R() < 0.5 ? -1 : 1), 0, D - 1);
      }
      if (first && rare && first[2] >= D - 3) marks.push({ name, label, x: first[0], y: first[1], z: D - 1 });
    }
  }
  // the crystals of the grand cavern
  for (let x = cav.x - cav.rx; x <= cav.x + cav.rx; x++) for (let z = zOpen; z < D; z++) {
    for (let y = cav.y + cav.ry + 1; y > cav.y - 8; y--) {                    // from the top: the first solid block is the ceiling
      if (world.get(x, y, z) === 0 && world.get(x, y + 1, z) && world.get(x, y + 1, z) !== id('WATER')) {
        const r = hash3(x, y, z, 12);
        if (r > 0.82) world.setRaw(x, y, z, id('AMETHYST_BLOCK')); else if (r > 0.7) world.setRaw(x, y, z, id('GLOWSTONE'));
        break;
      }
    }
    for (let y = cav.y - 7; y <= cav.y + cav.ry; y++) {                       // from the bottom: the floor
      if (world.get(x, y, z) === 0 && world.get(x, y - 1, z) && world.get(x, y - 1, z) !== id('WATER')) {
        const r = hash3(x, y, z, 13);
        if (r > 0.9) world.setRaw(x, y, z, id('CRYSTAL_CLUSTER')); else if (r > 0.82) world.setRaw(x, y, z, id('GLOW_SHROOM')); else if (r > 0.78) world.setRaw(x, y, z, id('AMETHYST_BLOCK'));
        break;
      }
    }
  }
  world.buildAll();

  // ------------------------------------------------------------------ light
  const hemi = new THREE.HemisphereLight(0x9aa6c8, 0x1a1020, 0.9), sun = new THREE.DirectionalLight(0xfff0d8, 1.9);
  sun.position.set(-50, 60, 50); sun.target.position.set(0, 60, 0);
  scene.add(hemi, sun, sun.target);
  scene.fog = new THREE.Fog(0x07060c, 40, 140);
  for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffa850, 0, 30, 1.3); scene.add(l); lamps.push(l); }
  const magmaL = new THREE.PointLight(0xff5a1a, 9, 60, 1.6); magmaL.position.set(0, 8, 8); scene.add(magmaL);
  const crystalL = new THREE.PointLight(0xb070ff, 8, 60, 1.2); crystalL.position.set(cav.x - W / 2, cav.y, 6); scene.add(crystalL);
  const torchPts = torches.map(t => new THREE.Vector3(t[0] + 0.5 - W / 2, t[1] + 0.8, t[2] + 0.5 - D + 1));
  const glow = new THREE.Points(new THREE.BufferGeometry().setFromPoints(torchPts), new THREE.PointsMaterial({ map: glowTexture(), size: 4.4, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.75, fog: false }));
  glow.frustumCulled = false; scene.add(glow);

  // ------------------------------------------------------------------ the camera: depth 0 = surface .. 1 = the bottom
  const outline = makeOutline(); scene.add(outline);
  const dust = new Dust(scene, 420, 0.34);
  const st = { depth: 0, depthTarget: 0, px: 0, py: 0, hover: null, sway: 0, collected: {}, onMine: null, onDepth: null };
  const yTop = SURFACE - 6, yBottom = 25;
  const yAt = d => lerp(yTop, yBottom, d);
  const tmp = new THREE.Vector3();
  const hot = document.createElement('div'); hot.className = 'hotspots'; host.appendChild(hot);
  const seen = new Set(), tags = [];
  marks.sort((a, b) => b.y - a.y).forEach(m => {
    const k = m.name; if (seen.has(k)) return; seen.add(k);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hotspot ore'; b.hidden = true; b.innerHTML = '<i></i><span>' + m.label + ' · Y ' + m.y + '</span>';
    b.addEventListener('click', e => { e.stopPropagation(); if (st.onOre) st.onOre(m.name); });
    hot.appendChild(b); tags.push({ m, b, p: new THREE.Vector3(m.x + 0.5 - W / 2, m.y + 0.5, m.z + 0.5 - D + 1) });
  });

  let lampT = 0, clickT = 0;
  view.update = (dt, time) => {
    st.depth += (st.depthTarget - st.depth) * Math.min(1, dt * 5);
    if (Math.abs(st.depthTarget - st.depth) < 1e-4) st.depth = st.depthTarget;
    const y = yAt(st.depth);
    st.sway += ((REDUCED ? 0 : st.px) - st.sway) * Math.min(1, dt * 2.5);
    const dist = host.clientWidth < host.clientHeight ? 70 : 56;
    camera.position.set(st.sway * 9, y + 4 - st.py * 1.5, dist);
    camera.fov = 40; camera.updateProjectionMatrix();
    camera.lookAt(st.sway * -2, y, -6);
    // the sky fades into the dark as you go down
    const sky = clamp((y - (SURFACE - 22)) / 24, 0, 1);
    const bg = view.renderer.getClearColor(new THREE.Color());
    bg.setRGB(lerp(0.027, 0.36, sky), lerp(0.024, 0.46, sky), lerp(0.047, 0.64, sky));
    view.renderer.setClearColor(bg, 1);
    scene.fog.color.copy(bg); scene.fog.near = lerp(26, 90, sky); scene.fog.far = lerp(120, 260, sky);
    hemi.intensity = lerp(0.42, 1.1, sky); sun.intensity = lerp(0.55, 2.2, sky);
    mats.setEmissive(lerp(1.7, 0.45, sky));
    // lights follow the camera
    lampT -= dt;
    if (lampT <= 0) { lampT = 0.3; const c = new THREE.Vector3(0, y, 0); torchPts.map(p => [Math.abs(p.y - y) + Math.abs(p.x) * 0.3, p]).sort((a, b) => a[0] - b[0]).slice(0, lamps.length).forEach((n, i) => lamps[i].position.copy(n[1]).setZ(n[1].z + 1.4)); }
    lamps.forEach((l, i) => { l.intensity = (REDUCED ? 1 : 0.85 + 0.15 * Math.sin(time * 11 + i * 2.3) * Math.sin(time * 7.3 + i)) * 13; });
    magmaL.intensity = 16 * (0.88 + 0.12 * Math.sin(time * 2.1)) * clamp((60 - y) / 40, 0, 1);
    crystalL.intensity = 30 * clamp(1 - Math.abs(y - cav.y) / 34, 0, 1) * (0.9 + 0.1 * Math.sin(time * 1.4));
    glow.material.opacity = 0.75;
    world.rebuild();
    dust.update(dt);
    // the labels of the rare minerals in view
    for (const t of tags) {
      tmp.copy(t.p).project(camera);
      const near = Math.abs(t.p.y - y) < 17 && tmp.z < 1 && Math.abs(tmp.x) < 1.04;
      const still = world.get(t.m.x, t.m.y, t.m.z) === assets.blocks[t.m.name].id + 1;
      t.b.hidden = !(near && still);
      if (!t.b.hidden) t.b.style.transform = 'translate(' + ((tmp.x * 0.5 + 0.5) * view.size.x).toFixed(1) + 'px,' + ((-tmp.y * 0.5 + 0.5) * view.size.y).toFixed(1) + 'px) translate(-50%,-135%)';
    }
    if (st.onDepth) st.onDepth(Math.round(y), st.depth);
    return true;
  };

  // ------------------------------------------------------------------ the pointer: outline and dig
  function hoverAt(e) {
    const r = host.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    st.px = nx; st.py = ny;
    const hit = world.pick(camera, nx, ny, 140);
    st.hover = hit;
    if (hit) { outline.visible = true; outline.position.set(hit.x + 0.5 + world.group.position.x, hit.y + 0.5, hit.z + 0.5 + world.group.position.z); } else outline.visible = false;
    host.style.cursor = hit ? 'crosshair' : 'default';
    view.invalidate();
  }
  host.addEventListener('pointermove', hoverAt);
  host.addEventListener('pointerleave', () => { outline.visible = false; st.hover = null; st.px = 0; st.py = 0; });
  let down = null;
  host.addEventListener('pointerdown', e => { if (e.target.closest('.hotspot, .ui3d, button, a')) return; down = [e.clientX, e.clientY, performance.now()]; });
  host.addEventListener('pointerup', e => {
    if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
    if (moved > 8) return;
    hoverAt(e);
    if (st.hover) dig(st.hover);
  });
  function dig(hit) {
    const b = assets.blockById[hit.v - 1];
    if (!b || b.name === 'BEDROCK') return;
    const col = assets.tileColor(b.faces[2]);
    world.set(hit.x, hit.y, hit.z, 0);
    dust.burst(new THREE.Vector3(hit.x + world.group.position.x, hit.y, hit.z + world.group.position.z), col, b.name.endsWith('_ORE') ? 30 : 14);
    if (b.name.endsWith('_ORE') || b.name === 'AMETHYST_BLOCK' || b.name === 'GLOWSTONE') { st.collected[b.name] = (st.collected[b.name] || 0) + 1; }
    if (st.onMine) st.onMine(b, st.collected);
    view.invalidate();
  }
  view.onQuality = q => { };
  view.ready = true;
  return {
    view, world, ORES,
    setDepth(d, now) { st.depthTarget = clamp(d, 0, 1); if (now) st.depth = st.depthTarget; view.invalidate(); },
    getDepth() { return st.depthTarget; },
    yOf: d => Math.round(yAt(d)),
    onMine(fn) { st.onMine = fn; }, onDepth(fn) { st.onDepth = fn; }, onOre(fn) { st.onOre = fn; },
    reset() { /* rebuild the world: not needed on the page, kept for the "ricomincia" button */ }
  };
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,214,130,1)'); r.addColorStop(0.25, 'rgba(255,170,70,0.5)'); r.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
