/*
 * A stage for one voxel model at a time: a dais made of the game's own blocks, a warm key light and a cool rim, sparks that drift up, and a camera
 * you turn with a drag. Used for the weapons of the armoury and the creatures of the bestiary - the models are the game's own, exported as they are.
 */
import * as THREE from 'three';
import { View, Orbit, REDUCED, lerp, clamp, smooth } from './rig.js';
import { loadJson, buildModel, meshBlocks, hash3, bendElbows } from './voxel.js';
import { Dust } from './editable.js';

function sparkTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(8, 8, 16, 16);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
}
function haloTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.3, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** The dais: 'forge' (dark brick with a ring of light) or 'meadow' (a turf of grass with flowers). */
function buildDais(assets, kind) {
  const S = 15, Hh = 4, c = 7;
  const g = new Uint16Array(S * Hh * S), id = n => assets.blocks[n].id + 1;
  const set = (x, y, z, v) => { g[(x * Hh + y) * S + z] = v; };
  for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) {
    const dx = x - c, dz = z - c, r = Math.hypot(dx, dz) + (hash3(x, 0, z, 5) - 0.5) * 0.9;
    if (kind === 'forge') {
      if (r > 4.5) continue;
      set(x, 0, z, id('POLISHED_BLACKSTONE_BRICKS')); set(x, 1, z, id(r > 3.7 ? 'POLISHED_BLACKSTONE' : 'BLACKSTONE'));
      if (r <= 3.9) set(x, 2, z, id(r > 3.2 ? 'POLISHED_BLACKSTONE_BRICKS' : (r > 2.1 && r < 2.8 && (x + z) % 2 === 0 ? 'MAGMA' : ((x + z) % 2 ? 'POLISHED_DEEPSLATE' : 'DEEPSLATE_TILES'))));
    } else {
      if (r > 5.6) continue;
      set(x, 0, z, id(hash3(x, 1, z, 2) > 0.8 ? 'STONE' : 'DIRT')); set(x, 1, z, id('DIRT')); set(x, 2, z, id(r > 4.9 && hash3(x, 2, z, 3) > 0.5 ? 'DIRT' : 'GRASS'));
      if (r < 5.2 && r > 3.0 && hash3(x, 3, z, 4) > 0.8) set(x, 3, z, id(['TALL_GRASS', 'TALL_GRASS', 'DANDELION', 'BLUEBELL', 'FERN'][Math.floor(hash3(x, 4, z, 6) * 5)]));
    }
  }
  const m = meshBlocks(assets, S, Hh, S, (x, y, z) => g[(x * Hh + y) * S + z]);
  const grp = new THREE.Group();
  return { m, S, c, top: 3, grp };
}

export async function createShowcase(host, assets, opts = {}) {
  const kind = opts.kind || 'forge';
  const view = new View(host, { fov: opts.fov || 34, far: 200, maxDpr: 2, clear: kind === 'forge' ? 0x0b0a14 : 0x141b2e });
  const { scene, camera, renderer } = view;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.fog = new THREE.Fog(kind === 'forge' ? 0x0b0a14 : 0x141b2e, 18, 60);

  // the dais, from the game's blocks
  const dais = buildDais(assets, kind);
  const matSolid = new THREE.MeshLambertMaterial({ map: assets.map, vertexColors: true, emissiveMap: assets.glow, emissive: 0xffffff, emissiveIntensity: 1.1 });
  const matCut = new THREE.MeshLambertMaterial({ map: assets.map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, emissiveMap: assets.glow, emissive: 0xffffff, emissiveIntensity: 0.75 });
  const daisGroup = new THREE.Group();
  for (const [geo, mat] of [[dais.m.solid, matSolid], [dais.m.cut, matCut]]) if (geo) { const me = new THREE.Mesh(geo, mat); me.receiveShadow = true; me.castShadow = true; daisGroup.add(me); }
  daisGroup.position.set(-dais.c - 0.5, -dais.top, -dais.c - 0.5);
  scene.add(daisGroup);
  const materials = [matSolid, matCut];

  // light
  const hemi = new THREE.HemisphereLight(kind === 'forge' ? 0x8a90c8 : 0x9db0cf, 0x2b2036, 1.5), key = new THREE.DirectionalLight(0xffe2b8, 3.2), rim = new THREE.DirectionalLight(0x7aa2ff, 1.1);
  key.position.set(-8, 12, 9); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 2, far: 40 }); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.04;
  rim.position.set(9, 6, -10);
  const glowL = new THREE.PointLight(0xffaa55, 0, 14, 1.6); glowL.position.set(0, 1.5, 1.2);
  const fill = new THREE.PointLight(0xffffff, 14, 30, 1.2); scene.add(fill);
  scene.add(hemi, key, rim, glowL);

  // sparks drifting up
  const N = 90, sp = new Float32Array(N * 3), sv = new Float32Array(N), spCol = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { sp[i * 3] = (Math.random() - 0.5) * 12; sp[i * 3 + 1] = Math.random() * 8 - 2; sp[i * 3 + 2] = (Math.random() - 0.5) * 12; sv[i] = 0.25 + Math.random() * 0.6; spCol[i * 3] = 1; spCol[i * 3 + 1] = 0.8; spCol[i * 3 + 2] = 0.5; }
  const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
  const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: 0.11, map: sparkTexture(), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  sparks.frustumCulled = false; scene.add(sparks);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0xffaa55, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(5, 5, 1); scene.add(halo);
  const dust = new Dust(scene, 160, 0.16);

  // the camera
  const orbit = new Orbit(host, { target: [0, kind === 'forge' ? 1.4 : 1.6, 0], yaw: 0.6, pitch: 0.2, radius: 8, minPitch: -0.05, maxPitch: 0.95, auto: 0.35 });
  const st = { stage: null, holder: null, model: null, parts: {}, t0: 0, born: 0, swing: -1, walk: false, px: 0, py: 0, flies: false, glow: null, spin: true, baseRadius: 8, targetRadius: 8, kind, info: null };
  orbit.enabled = true;

  const cache = new Map();
  async function load(id) { if (!cache.has(id)) cache.set(id, loadJson('models/' + id + '.json')); return cache.get(id); }

  function clearModel() {
    if (st.holder) { scene.remove(st.holder); st.holder.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    st.holder = null; st.model = null; st.parts = {};
  }

  /** info: { id, color: '#rrggbb', glow: 0..1, flies: bool, size: 'weapon' | 'creature' } */
  async function show(id, info = {}) {
    const mine = ++st.seq;
    const data = await load(id);
    if (st.seq !== mine) return;
    clearModel();
    const m = buildModel(data);
    const group = m.group;
    const box = new THREE.Box3().setFromObject(group), size = new THREE.Vector3(), ctr = new THREE.Vector3();
    box.getSize(size); box.getCenter(ctr);
    const holder = new THREE.Group(), inner = new THREE.Group();
    inner.add(group);
    group.position.sub(ctr); group.position.y -= (kind === 'forge' ? 0 : box.min.y - ctr.y) * 0;       // centred; the feet are set below
    holder.add(inner);
    let k;
    if (info.size === 'weapon') { k = 3.5 / Math.max(size.y, size.x * 0.9, size.z); holder.userData.lift = 2.3; inner.rotation.z = -0.28; }
    else { k = Math.min(3.6 / Math.max(size.y, size.x, size.z), 2.6); holder.userData.lift = 0; }
    inner.scale.setScalar(k);
    const feet = (ctr.y - box.min.y) * k;                                         // from the centre down to the feet
    holder.position.y = info.size === 'weapon' ? holder.userData.lift : feet + (info.flies ? 0.9 : 0) + 0.02;
    scene.add(holder);
    holder.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
    st.holder = holder; st.inner = inner; st.model = m; st.parts = m.parts; st.born = performance.now(); st.flies = !!info.flies; st.info = info;
    st.size = size.clone().multiplyScalar(k);
    const col = new THREE.Color(info.color || '#ffaa55');
    halo.material.color.copy(col); glowL.color.copy(col);
    st.glow = info.glow || 0;
    st.baseY = holder.position.y;
    // the camera makes room for what it looks at
    const h = info.size === 'weapon' ? 3.4 : Math.max(st.size.y, st.size.x * 0.8, st.size.z * 0.8) + 1.2;
    st.targetRadius = info.size === 'weapon' ? 7.4 : clamp(h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.45 + 3.4, 6.5, 22);
    orbit.target.y = info.size === 'weapon' ? holder.position.y : feet + st.size.y * 0.5 * 0.9 - (info.flies ? 0.1 : 0);
    dust.burst(new THREE.Vector3(-0.5, kind === 'forge' ? 0.1 : 0.2, -0.5), [col.r, col.g, col.b], 26, 3.4);
    view.invalidate();
  }
  st.seq = 0;

  const tmp = new THREE.Vector3();
  view.update = (dt, time) => {
    const moving = orbit.step(dt, st.spin);
    orbit.radius += (st.targetRadius - orbit.radius) * Math.min(1, dt * 4);
    orbit.apply(camera);
    fill.position.copy(camera.position).add(tmp.set(-1.5, 2.2, 0.6));
    key.position.set(-8, 12, 9);
    // the model: it pops in, breathes, and does what the creature does
    if (st.holder) {
      const a = (performance.now() - st.born) / 1000, pop = a < 0.5 ? 1 + Math.sin(clamp(a / 0.5, 0, 1) * Math.PI) * 0.12 * (1 - a) : 1, grow = smooth(a / 0.35);
      st.holder.scale.setScalar(Math.max(0.01, grow * pop));
      const P = st.parts;
      if (st.info && st.info.size === 'weapon') {
        st.holder.position.y = st.baseY + (REDUCED ? 0 : Math.sin(time * 1.4) * 0.12);
        if (st.swing >= 0) { st.swing += dt * 3.2; const s = smooth(Math.min(1, st.swing)); st.inner.rotation.z = -0.28 + Math.sin(s * Math.PI) * -2.2; st.inner.rotation.y = s * Math.PI * 2; if (st.swing >= 1) { st.swing = -1; st.inner.rotation.set(0, 0, -0.28); } }
        for (let i = 0; i < 3; i++) { const mo = P['mote' + i]; if (mo) { mo.rotation.y = time * (1.4 + i * 0.4) + i * 2.1; mo.position.y = mo.userData.pivot.y + Math.sin(time * 1.7 + i) * 0.5; } }
      } else {
        const W = st.walk, ph = time * (W ? 7 : 0), amp = W ? 0.62 : 0, breathe = Math.sin(time * 1.8) * 0.012;
        st.inner.scale.y = st.inner.scale.x * (1 + breathe);
        if (P.legFL) { P.legFL.rotation.x = Math.sin(ph) * amp; P.legBR.rotation.x = Math.sin(ph) * amp; P.legFR.rotation.x = Math.sin(ph + Math.PI) * amp; P.legBL.rotation.x = Math.sin(ph + Math.PI) * amp; }
        if (P.legL && P.legR) { P.legL.rotation.x = Math.sin(ph) * amp; P.legR.rotation.x = Math.sin(ph + Math.PI) * amp; if (P.armL) P.armL.rotation.x = Math.sin(ph + Math.PI) * amp * 0.8; if (P.armR) P.armR.rotation.x = Math.sin(ph) * amp * 0.8; }
        else if (P.armL && P.armR) { P.armL.rotation.x = Math.sin(time * 1.2) * 0.06; P.armR.rotation.x = -Math.sin(time * 1.2) * 0.06; }
        if (P.armL && P.armR) bendElbows(P, P.armL.rotation.x, P.armR.rotation.x, W ? 1 : 0, 0.4, 0.4);
        if (P.wingL) { const f = Math.sin(time * (W ? 9 : 4)) * (W ? 0.7 : 0.35); P.wingL.rotation.z = f; if (P.wingR) P.wingR.rotation.z = -f; }
        for (const n of ['tail', 'tail1', 'tail2', 'tail3']) if (P[n]) P[n].rotation.y = Math.sin(time * 2.2 + (n.length > 4 ? +n[4] : 0)) * 0.35;
        if (P.cape) P.cape.rotation.x = Math.sin(time * 1.6) * 0.06 + 0.04;
        if (P.halo) P.halo.rotation.y = time * 0.9;
        if (P.head) { P.head.rotation.y += ((REDUCED ? 0 : clamp(st.px, -1, 1) * 0.9) - P.head.rotation.y) * Math.min(1, dt * 6); P.head.rotation.x += ((REDUCED ? 0 : -st.py * 0.35) - P.head.rotation.x) * Math.min(1, dt * 6); }
        st.holder.position.y = st.baseY + (st.flies ? Math.sin(time * 1.5) * 0.22 : (W ? Math.abs(Math.sin(ph)) * 0.05 : 0));
      }
    }
    // glow of the weapon: halo and a light of its colour
    const pulse = 0.8 + 0.2 * Math.sin(time * 3);
    halo.position.copy(st.holder ? tmp.set(0, st.baseY || 2, 0) : tmp.set(0, 2, 0));
    halo.material.opacity = (st.glow ? 0.16 + 0.22 * st.glow : 0) * pulse * (st.info && st.info.size === 'weapon' ? 1 : 0);
    glowL.intensity = (st.glow ? 4 + 9 * st.glow : 0) * pulse;
    glowL.position.y = (st.baseY || 2);
    // the sparks
    if (!REDUCED) { for (let i = 0; i < N; i++) { sp[i * 3 + 1] += sv[i] * dt; sp[i * 3] += Math.sin(time * 0.7 + i) * 0.1 * dt; if (sp[i * 3 + 1] > 7) sp[i * 3 + 1] = -1; } spGeo.attributes.position.needsUpdate = true; }
    dust.update(dt);
    return true;
  };
  host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); st.px = ((e.clientX - r.left) / r.width) * 2 - 1; st.py = -(((e.clientY - r.top) / r.height) * 2 - 1); });
  host.addEventListener('pointerleave', () => { st.px = 0; st.py = 0; });
  let dn = null;
  host.addEventListener('pointerdown', e => { dn = [e.clientX, e.clientY]; });
  host.addEventListener('pointerup', e => { if (dn && Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) < 6 && !e.target.closest('button, a, .ui3d') && st.info && st.info.size === 'weapon' && st.swing < 0) { st.swing = 0; dust.burst(new THREE.Vector3(0, st.baseY, 0), halo.material.color.toArray(), 24, 5); } dn = null; });
  view.ready = true;

  return {
    view, show,
    setWalk(v) { st.walk = !!v; view.invalidate(); },
    getWalk() { return st.walk; },
    setSpin(v) { st.spin = !!v; },
    setTheme(theme) { assets.theme = theme; for (const m of materials) { m.map = assets.map; m.needsUpdate = true; } view.invalidate(); },
    swing() { if (st.swing < 0) st.swing = 0; }
  };
}
