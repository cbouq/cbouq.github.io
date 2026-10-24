/*
 * The floating island: a village made by the game's own generator (Faroventosa), cut into a piece of sky, with the real textures, real
 * people, torches that light the night and a sky that follows the game's day. The camera follows the scroll of the page.
 */
import * as THREE from 'three';
import { loadJson, worldFromVillage, meshBlocks, buildModel, hash3 } from './voxel.js';
import { View, REDUCED, lerp, clamp, smooth, noise2 } from './rig.js';
import { Sky } from './sky.js';

export const NPC_INFO = {
  ELDER: ['Anziano', 'Racconta le storie del villaggio e dà gli incarichi più importanti. Quando il Re Eterno è caduto, è lui che può risvegliare il regno: i guardiani tornano, più forti.'],
  MERCHANT: ['Mercante', 'Compra e vende quasi tutto. Più il villaggio ti stima, meno paghi: fino al 20% di sconto per gli eroi.'],
  SMITH: ['Fabbro', 'Vende armi e metalli, ripara quelle consumate e tempra le tue lame con i Frammenti d\'Eredità: +10% di danno a ogni livello.'],
  INNKEEPER: ['Oste', 'Cibo caldo e un letto: una notte di sonno cura tutto e fa passare il buio.'],
  FARMER: ['Contadino', 'Semi e raccolti, e sempre un lavoro per te. Ti paga in monete e in pane.'],
  HUNTER: ['Cacciatore', 'Pellicce, lance e storie di bestie. Compra i trofei e ti manda sulle tracce dei lupi.'],
  GUARD: ['Guardia', 'Vigila sul villaggio. Chiede aiuto contro i mostri e, dopo il risveglio del regno, mette taglie sui guardiani.'],
  HERBALIST: ['Erborista', 'Pozioni ed erbe rare. Per gli eroi del villaggio prepara anche l\'Elisir della Fenice.']
};

const TERRAIN = new Set(['GRASS', 'DIRT', 'STONE', 'SAND', 'GRAVEL', 'COARSE_DIRT', 'PODZOL', 'CLAY', 'SNOW', 'SANDSTONE', 'RED_SAND', 'MUD', 'PACKED_MUD', 'ROOTED_DIRT', 'SAVANNA_GRASS', 'JUNGLE_GRASS', 'CHERRY_GRASS', 'ENCHANTED_GRASS']);

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,214,130,1)'); r.addColorStop(0.25, 'rgba(255,170,70,0.55)'); r.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function createIsland(host, assets) {
  const view = new View(host, { fov: 42, far: 1400, maxDpr: 2 });
  const { scene, camera, renderer } = view;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const sky = new Sky(scene, { dark: true });

  // ------------------------------------------------------------------ the island: the village, cut round and carved underneath
  const village = await loadJson('village.json');
  const src = worldFromVillage(village);
  const PAD = 28, W = src.W, D = src.D, H = src.H + PAD;
  const grid = new Uint16Array(W * H * D);
  const id = n => assets.blocks[n].id + 1;
  const stone = id('STONE'), cobble = id('COBBLESTONE'), dirt = id('DIRT'), andesite = assets.blocks.ANDESITE ? id('ANDESITE') : stone;
  const nz = noise2(5), nz2 = noise2(9);
  const [vcx, vcz] = village.center;
  // the ground of every column (the highest block of natural terrain)
  const ground = new Int16Array(W * D).fill(-1);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    for (let y = src.H - 1; y >= 0; y--) {
      const b = assets.blockById[src.get(x, y, z) - 1];
      if (b && TERRAIN.has(b.name)) { ground[x * D + z] = y; break; }
    }
  }
  const R0 = Math.min(W, D) / 2 - 3.2;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const dx = x - W / 2 + 0.5, dz = z - D / 2 + 0.5, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
    const edge = R0 + 2.6 * Math.sin(3 * th + 0.7) + 1.7 * Math.sin(5 * th + 2.1) + 3 * (nz(x * 0.2, z * 0.2) - 0.5);
    if (r > edge) continue;
    const g = ground[x * D + z] < 0 ? 12 : ground[x * D + z];
    const k = clamp(r / edge, 0, 1);
    const depth = 5 + (1 - Math.pow(k, 1.5)) * 31 + (nz2(x * 0.32, z * 0.32) - 0.5) * 9;
    const bottom = Math.floor(g - depth) + PAD;                           // in the padded grid
    for (let y = Math.max(0, bottom); y < H; y++) {
      const sy = y - PAD;
      let v = sy >= 0 ? src.get(x, sy, z) : 0;
      if (sy < 0) v = (hash3(x, y, z, 3) > 0.9) ? cobble : (hash3(x, y, z, 4) > 0.86 ? andesite : stone);
      grid[(x * H + y) * D + z] = v;
    }
  }
  const mesh = meshBlocks(assets, W, H, D, (x, y, z) => grid[(x * H + y) * D + z]);

  const matSolid = new THREE.MeshLambertMaterial({ map: assets.map, vertexColors: true, emissiveMap: assets.glow, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const matCut = new THREE.MeshLambertMaterial({ map: assets.map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissiveMap: assets.glow, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const matWater = new THREE.MeshPhongMaterial({ map: assets.map, vertexColors: true, transparent: true, opacity: 0.8, shininess: 80, specular: 0x667788 });
  const depthCut = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: assets.map, alphaTest: 0.5 });
  const rootG = new THREE.Group();
  const add = (geo, mat, cast, cut) => { if (!geo) return; const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; if (cut) m.customDepthMaterial = depthCut; rootG.add(m); };
  add(mesh.solid, matSolid, true, false); add(mesh.cut, matCut, true, true); add(mesh.water, matWater, false, false);
  const gcenter = (ground[Math.floor(vcx) * D + Math.floor(vcz)] || 12) + PAD;
  rootG.position.set(-vcx, -gcenter, -vcz);
  scene.add(rootG);
  const materials = [matSolid, matCut, matWater];

  // floating rocks around the island
  const rocks = [];
  function rock(seed, r, tree) {
    const S = r * 2 + 3, g = new Uint16Array(S * S * S), c = S / 2;
    for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) for (let z = 0; z < S; z++) {
      const d = Math.hypot(x - c + 0.5, (y - c) * 1.5 + 0.5, z - c + 0.5) + (hash3(x, y, z, seed) - 0.5) * 1.6;
      if (d < r) g[(x * S + y) * S + z] = (y > c + 0.6) ? ((y > c + 1.6) ? id('GRASS') : dirt) : (hash3(x, y, z, seed + 1) > 0.88 ? cobble : stone);
    }
    if (tree) { for (let y = 0; y < 5; y++) g[(Math.floor(c) * S + Math.floor(c + 2) + y) * S + Math.floor(c)] = id('OAK_WOOD'); }
    const m = meshBlocks(assets, S, S, S, (x, y, z) => g[(x * S + y) * S + z]);
    const grp = new THREE.Group();
    for (const [geo, mat, cut] of [[m.solid, matSolid, false], [m.cut, matCut, true]]) if (geo) { const me = new THREE.Mesh(geo, mat); me.castShadow = true; me.receiveShadow = true; if (cut) me.customDepthMaterial = depthCut; grp.add(me); }
    grp.userData.size = S; return grp;
  }
  [[-62, 10, -34, 4, false], [58, -4, 30, 3, true], [-30, -6, 62, 3, false], [34, 18, -64, 4, false], [-76, 2, 22, 2, false], [74, 12, -18, 2, false], [8, -22, 78, 2, false]].forEach(([x, y, z, r, tree], i) => {
    const g = rock(40 + i, r, tree); g.position.set(x - g.userData.size / 2, y, z - g.userData.size / 2); g.userData.base = g.position.y; g.userData.ph = i * 1.7;
    scene.add(g); rocks.push(g);
  });

  // ------------------------------------------------------------------ light of the torches
  const torchId = assets.blocks.TORCH ? assets.blocks.TORCH.id + 1 : -1, torches = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) if (grid[(x * H + y) * D + z] === torchId) torches.push(new THREE.Vector3(x + 0.5 - vcx, y + 0.78 - gcenter, z + 0.5 - vcz));
  const glowGeo = new THREE.BufferGeometry().setFromPoints(torches);
  const glowMat = new THREE.PointsMaterial({ map: glowTexture(), size: 5.2, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6, fog: false });
  const glowPts = new THREE.Points(glowGeo, glowMat); glowPts.frustumCulled = false; scene.add(glowPts);
  const lamps = [];
  for (let i = 0; i < 5; i++) { const l = new THREE.PointLight(0xffa850, 0, 18, 1.5); scene.add(l); lamps.push(l); }

  // ------------------------------------------------------------------ the people
  const people = [];
  const hot = document.createElement('div'); hot.className = 'hotspots'; host.appendChild(hot);
  const infoCb = { fn: null };
  await Promise.all(village.npcs.map(async ([role, title, x, y, z, mob]) => {
    try {
      const m = buildModel(await loadJson('models/m_' + mob + '.json'));
      const pos = new THREE.Vector3(x + 0.5 - vcx, y - gcenter - 0.02 + PAD * 0, z + 0.5 - vcz);
      pos.y = (y + 0) - gcenter + PAD;
      m.group.position.copy(pos); m.group.rotation.y = hash3(x, y, z, 5) * Math.PI * 2;
      m.group.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
      scene.add(m.group);
      const btn = document.createElement('button'); btn.className = 'hotspot'; btn.type = 'button'; btn.hidden = true;
      btn.innerHTML = '<i></i><span>' + (NPC_INFO[role] ? NPC_INFO[role][0] : title) + '</span>';
      btn.addEventListener('click', e => { e.stopPropagation(); if (infoCb.fn) infoCb.fn(role, NPC_INFO[role]); });
      hot.appendChild(btn);
      people.push({ role, title, model: m, pos, btn, phase: hash3(x, y, z, 8) * 6.28, head: m.parts.head, base: m.group.rotation.y });
    } catch (e) { /* a missing model is just a missing person */ }
  }));
  const where = {};
  people.forEach(p => { if (!where[p.role]) where[p.role] = p.pos.clone().add(new THREE.Vector3(0, 1.5, 0)); });

  // ------------------------------------------------------------------ the camera: keyframes round targets, driven by the scroll
  const T = (r, dy = 0) => ({ role: r, dy });
  // a line through the blocks (world space): the signs over the people show only for those you can see
  const opaque = (gx, gy, gz) => {
    if (gx < 0 || gy < 0 || gz < 0 || gx >= W || gy >= H || gz >= D) return false;
    const b = assets.blockById[grid[(gx * H + gy) * D + gz] - 1];
    return !!b && (b.kind === 0 || b.kind === 3);
  };
  const solidWorld = (x, y, z) => opaque(Math.floor(x + vcx), Math.floor(y + gcenter), Math.floor(z + vcz));
  function clearLine(a, b) {
    const n = Math.ceil(a.distanceTo(b) * 2.5);
    for (let i = 1; i < n; i++) { const t = i / n; if (solidWorld(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t)) return false; }
    return true;
  }
  // az (degrees): the camera stands on the side of the plaza, looking at the person
  const KEYS = [
    { p: 0.00, tgt: [0, 6, 0], az: 28, dist: 112, elev: 20, fov: 40, time: 0.38 },
    { p: 0.10, tgt: [0, 6, 0], az: 70, dist: 92, elev: 17, fov: 40, time: 0.34 },
    { p: 0.30, tgt: T('MERCHANT'), az: 108, dist: 13, elev: 24, fov: 52, time: 0.26 },
    { p: 0.50, tgt: T('SMITH'), az: 30, dist: 12, elev: 16, fov: 54, time: 0.2 },
    { p: 0.68, tgt: [0, 10, 0], az: 150, dist: 44, elev: 21, fov: 46, time: 0.62 },
    { p: 0.84, tgt: [0, 8, 0], az: 215, dist: 38, elev: 12, fov: 48, time: 0.82 },
    { p: 1.00, tgt: [0, 2, 0], az: 270, dist: 150, elev: 30, fov: 38, time: 0.99 }
  ];
  function resolve(t) { return Array.isArray(t) ? new THREE.Vector3(...t) : (where[t.role] ? where[t.role].clone().add(new THREE.Vector3(0, t.dy, 0)) : new THREE.Vector3(0, 8, 0)); }
  const state = { p: 0, timeOverride: null, time: KEYS[0].time, user: 0, drag: false, hotOn: false, userPitch: 0, glow: 0 };
  function pose(p) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = smooth((p - a.p) / (b.p - a.p));
    const ta = resolve(a.tgt), tb = resolve(b.tgt);
    let da = b.az - a.az; da = ((da + 540) % 360) - 180;
    return { tgt: ta.lerp(tb, k), az: a.az + da * k, dist: lerp(a.dist, b.dist, k), elev: lerp(a.elev, b.elev, k), fov: lerp(a.fov, b.fov, k), time: lerp(a.time, b.time, k) };
  }
  // drag: turn round the scene; it springs back to the script when you let go
  let lx = 0, id0 = null;
  host.style.touchAction = 'pan-y';
  host.addEventListener('pointerdown', e => { if (e.target.closest('.hotspot, .ui3d, a, button')) return; state.drag = true; id0 = e.pointerId; lx = e.clientX; try { host.setPointerCapture(id0); } catch (x) { /* ok */ } });
  host.addEventListener('pointermove', e => { if (!state.drag || e.pointerId !== id0) return; state.user -= (e.clientX - lx) * 0.35; lx = e.clientX; view.invalidate(); });
  const endDrag = e => { if (e.pointerId === id0) state.drag = false; };
  host.addEventListener('pointerup', endDrag); host.addEventListener('pointercancel', endDrag);

  // ------------------------------------------------------------------ the shadow of the sun covers the island
  const sh = sky.sun.shadow; sh.mapSize.set(2048, 2048);
  Object.assign(sh.camera, { left: -62, right: 62, top: 62, bottom: -62, near: 10, far: 420 });
  sh.bias = -0.0006; sh.normalBias = 0.5;
  sky.sun.target.position.set(0, 0, 0);

  let timeNow = KEYS[0].time, lampT = 0, spin = 0;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function applySky(t, time) {
    const s = sky.setTime(t, time);
    const night = s.night;
    matSolid.emissiveIntensity = matCut.emissiveIntensity = 0.45 + 0.75 * night;
    glowMat.opacity = 0.28 + 0.7 * night;
    return s;
  }
  applySky(timeNow, 0);

  view.update = (dt, time) => {
    spin += dt;
    const target = state.timeOverride != null ? state.timeOverride : pose(state.p).time;
    // the day glides to where it should be (the shortest way round)
    let d = target - timeNow; d = ((d + 1.5) % 1) - 0.5;
    if (Math.abs(d) > 1e-4) timeNow += d * Math.min(1, dt * 2.2);
    const s = applySky(timeNow, time);
    const ps = pose(state.p);
    const heroSpin = REDUCED ? 0 : (state.p < 0.06 ? spin * 5 : 0);
    if (!state.drag) state.user *= Math.pow(0.4, dt);               // eases back to the script
    const az = (ps.az + heroSpin * (1 - state.p / 0.06) + state.user) * Math.PI / 180, el = ps.elev * Math.PI / 180;
    camera.position.set(ps.tgt.x + Math.sin(az) * Math.cos(el) * ps.dist, ps.tgt.y + Math.sin(el) * ps.dist, ps.tgt.z + Math.cos(az) * Math.cos(el) * ps.dist);
    // a tall, narrow screen sees less to the sides: pull back from the wide shots and open the lens a little on the close ones
    const asp = view.size.x / Math.max(1, view.size.y), tall = clamp((1.15 - asp) / 0.6, 0, 1), wide = clamp((ps.dist - 30) / 40, 0, 1);
    camera.position.sub(ps.tgt).multiplyScalar(1 + 0.7 * tall * wide).add(ps.tgt);
    camera.fov = ps.fov * (1 + 0.3 * tall * (1 - wide));
    // in the first view the island sits to the right of the title: the picture is shifted, not the world
    const w = view.size.x, h = view.size.y, shift = (w > h * 1.15 ? 0.19 : 0) * (1 - smooth(state.p / 0.13));
    if (shift > 0.001) camera.setViewOffset(w, h, -shift * w, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    camera.lookAt(ps.tgt);
    // the sun follows the sky; its shadow box stays on the island
    sky.sun.target.position.set(0, 0, 0); sky.sun.position.copy(s.dayK > 0.04 ? s.sunDir : s.sunDir.clone().negate()).multiplyScalar(170);
    sky.layoutClouds(time);
    rocks.forEach(r => { r.position.y = r.userData.base + Math.sin(time * 0.5 + r.userData.ph) * 1.6; r.rotation.y = Math.sin(time * 0.12 + r.userData.ph) * 0.1; });
    // the people breathe, look about; the torches flicker and the nearest ones light the street
    people.forEach(p => {
      const m = p.model;
      m.group.scale.y = 1 + Math.sin(time * 1.6 + p.phase) * 0.008;
      if (p.head) p.head.rotation.y = Math.sin(time * 0.5 + p.phase) * 0.45 * Math.max(0, Math.sin(time * 0.17 + p.phase * 2));
      if (m.parts.armR) m.parts.armR.rotation.x = Math.sin(time * 1.3 + p.phase) * 0.06;
      if (m.parts.armL) m.parts.armL.rotation.x = -Math.sin(time * 1.3 + p.phase) * 0.06;
    });
    lampT -= dt;
    if (lampT <= 0) {
      lampT = 0.35;
      const c = ps.tgt;
      const near = torches.map(t => [t.distanceToSquared(c), t]).sort((a, b) => a[0] - b[0]).slice(0, lamps.length);
      near.forEach((n, i) => lamps[i].position.copy(n[1]));
    }
    const night = s.night;
    lamps.forEach((l, i) => { l.intensity = (night * 34 + 1.5) * (0.88 + 0.12 * Math.sin(time * 11 + i * 2.3) * Math.sin(time * 7.1 + i)); });
    // the signs over the people
    if (state.hotOn) {
      const w = view.size.x, h = view.size.y;
      people.forEach(p => {
        tmp.copy(p.pos); tmp.y += 2.9; tmp.project(camera);
        let vis = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 && camera.position.distanceTo(p.pos) < 17;
        if (vis) { tmp2.copy(p.pos); tmp2.y += 1.5; vis = clearLine(camera.position, tmp2); }            // a sign only for people you can see
        p.btn.hidden = !vis;
        if (vis) p.btn.style.transform = 'translate(' + ((tmp.x * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-tmp.y * 0.5 + 0.5) * h).toFixed(1) + 'px) translate(-50%,-100%)';
      });
    } else people.forEach(p => { p.btn.hidden = true; });
    return true;
  };
  view.onQuality = q => { sky.sun.castShadow = q > 0.62; };
  view.ready = true;

  return {
    view, sky, people,
    setProgress(p) { state.p = clamp(p, 0, 1); state.hotOn = state.p > 0.16 && state.p < 0.62; view.invalidate(); },
    setTime(t) { state.timeOverride = t; view.invalidate(); },
    getTime() { return timeNow; },
    setTheme(theme) { assets.theme = theme; sky.dark = theme === 'dark'; materials.forEach(m => { m.map = assets.map; m.needsUpdate = true; }); depthCut.map = assets.map; view.invalidate(); },
    onNpc(fn) { infoCb.fn = fn; }
  };
}
