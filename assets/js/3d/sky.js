/*
 * Sky, sun, moon, stars and clouds - the day of the game: fifteen minutes of day, ten of night, the same colours (the dark medieval grade of
 * the game softens them). setTime(t): t in [0,1), 0 = sunrise, 0.6 = sunset.
 */
import * as THREE from 'three';
import { lerp, clamp } from './rig.js';

const C = h => new THREE.Color(h);
const NIGHT_ZENITH = C(0x050617), NIGHT_HORIZON = C(0x0e1329), DAY_ZENITH = C(0x4d8be6), DAY_HORIZON = C(0xa6d1f7), DAWN_ZENITH = C(0x594d73), DAWN_HORIZON = C(0xf29966);
const NIGHT_AMBIENT = C(0x1f2133), DAY_AMBIENT = C(0x8c8c99), NIGHT_SUN = C(0x34385a), DAY_SUN = C(0xfff7e6), DAWN_SUN = C(0xff9959);
const DAY = 15, NIGHT = 10, CYCLE = DAY + NIGHT;

/** The sky grade of the dark theme: a slate blue instead of a bright one. */
function grade(c, dark) {
  if (!dark) return c;
  const l = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
  c.r = Math.min(1, (l + (c.r - l) * 0.76) * 0.84); c.g = Math.min(1, (l + (c.g - l) * 0.76) * 0.84); c.b = Math.min(1, (l + (c.b - l) * 0.76) * 0.86);
  return c;
}

export function skyState(t, dark = true) {
  const ct = ((t % 1) + 1) % 1 * CYCLE;
  const angle = ct < DAY ? (ct / DAY) * Math.PI : Math.PI + ((ct - DAY) / NIGHT) * Math.PI;
  const h = Math.sin(angle), x = Math.cos(angle);
  const dayK = clamp((h + 0.3) / 0.6, 0, 1), dusk = 1 - clamp(Math.abs(h) / 0.3, 0, 1);
  const zenith = NIGHT_ZENITH.clone().lerp(DAY_ZENITH, dayK).lerp(DAWN_ZENITH, dusk * 0.5);
  const horizon = NIGHT_HORIZON.clone().lerp(DAY_HORIZON, dayK).lerp(DAWN_HORIZON, dusk * 0.85);
  const ambient = NIGHT_AMBIENT.clone().lerp(DAY_AMBIENT, dayK);
  const sun = NIGHT_SUN.clone().lerp(DAY_SUN, dayK).lerp(DAWN_SUN, dusk * 0.6);
  grade(zenith, dark); grade(horizon, dark);
  const sunDir = new THREE.Vector3(-x, h, -0.35).normalize();       // where the sun is (the light comes from there)
  return { zenith, horizon, ambient, sun, sunDir, dayK, dusk, night: 1 - dayK, height: h };
}

const SKY_VS = 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const SKY_FS = `
varying vec3 vDir; uniform vec3 uZenith, uHorizon, uSunDir; uniform float uNight, uTime;
float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
void main(){
  float h = clamp(vDir.y, -0.2, 1.0);
  float k = pow(max(h, 0.0), 0.55);
  vec3 col = mix(uHorizon, uZenith, k);
  col = mix(col, uHorizon * 0.85, smoothstep(0.0, -0.2, vDir.y));
  // the haze of the sun
  float s = max(dot(normalize(vDir), uSunDir), 0.0);
  col += uHorizon * pow(s, 6.0) * 0.35 + vec3(1.0, 0.85, 0.6) * pow(s, 60.0) * 0.4 * (1.0 - uNight);
  // stars: square points of the blocky sky, twinkling
  vec3 g = floor(vDir * 90.0);
  float st = step(0.9965, hash(g));
  float tw = 0.65 + 0.35 * sin(uTime * 2.0 + hash(g + 3.0) * 40.0);
  col += vec3(0.9, 0.92, 1.0) * st * tw * uNight * smoothstep(0.02, 0.35, vDir.y);
  gl_FragColor = vec4(col, 1.0);
}`;

export class Sky {
  constructor(scene, { clouds = true, dark = true } = {}) {
    this.scene = scene; this.dark = dark;
    this.mat = new THREE.ShaderMaterial({ vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false,
      uniforms: { uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uNight: { value: 0 }, uTime: { value: 0 } } });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 18), this.mat);
    this.dome.renderOrder = -10; this.dome.frustumCulled = false;
    scene.add(this.dome);
    // the sun and the moon: squares, like the game's
    const mk = (size, color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color, fog: false, depthWrite: false, transparent: true })); m.renderOrder = -9; scene.add(m); return m; };
    this.sunMesh = mk(70, 0xfff1b8); this.moonMesh = mk(52, 0xdfe8ff);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x554433, 1);
    this.sun = new THREE.DirectionalLight(0xffffff, 2);
    this.sun.castShadow = true;
    scene.add(this.hemi, this.sun, this.sun.target);
    scene.fog = new THREE.Fog(0x88aadd, 120, 420);
    this.clouds = clouds ? this.makeClouds() : null;
    this.state = null;
  }
  makeClouds() {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
    const count = 90, mesh = new THREE.InstancedMesh(g, m, count), d = new THREE.Object3D();
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    this.cloudData = [];
    let i = 0;
    for (let c = 0; c < 14 && i < count; c++) {
      const cx = (rnd() - 0.5) * 420, cz = (rnd() - 0.5) * 420, cy = 78 + rnd() * 26, puffs = 4 + Math.floor(rnd() * 4);
      for (let p = 0; p < puffs && i < count; p++) { this.cloudData.push({ x: cx + (rnd() - 0.5) * 26, y: cy + (rnd() - 0.5) * 3, z: cz + (rnd() - 0.5) * 14, sx: 8 + rnd() * 12, sy: 3 + rnd() * 2, sz: 6 + rnd() * 8 }); i++; }
    }
    mesh.count = this.cloudData.length;
    this.cloudMesh = mesh; this.cloudD = d; mesh.castShadow = false; mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.layoutClouds(0);
    return mesh;
  }
  layoutClouds(t) {
    if (!this.cloudMesh) return;
    const d = this.cloudD;
    this.cloudData.forEach((c, i) => {
      let x = ((c.x + t * 2.2 + 240) % 480) - 240;
      d.position.set(x, c.y, c.z); d.scale.set(c.sx, c.sy, c.sz); d.updateMatrix(); this.cloudMesh.setMatrixAt(i, d.matrix);
    });
    this.cloudMesh.instanceMatrix.needsUpdate = true;
  }
  setTime(t, time = 0) {
    const s = this.state = skyState(t, this.dark);
    const u = this.mat.uniforms;
    u.uZenith.value.copy(s.zenith); u.uHorizon.value.copy(s.horizon); u.uSunDir.value.copy(s.sunDir); u.uNight.value = s.night; u.uTime.value = time;
    this.scene.fog.color.copy(s.horizon).lerp(s.zenith, 0.12);
    // the sun by day, the moon (opposite) by night: the stronger one lights the world
    const dayAmt = s.dayK, moon = new THREE.Vector3().copy(s.sunDir).negate();
    this.sunMesh.position.copy(s.sunDir).multiplyScalar(560); this.sunMesh.lookAt(0, 0, 0);
    this.moonMesh.position.copy(moon).multiplyScalar(560); this.moonMesh.lookAt(0, 0, 0);
    this.sunMesh.material.opacity = clamp(s.height * 6 + 0.4, 0, 1); this.moonMesh.material.opacity = clamp(-s.height * 6 + 0.4, 0, 1);
    this.sunMesh.material.color.setHex(s.dusk > 0.5 ? 0xffb070 : 0xfff1b8);
    const light = dayAmt > 0.04 ? s.sunDir : moon;
    this.sun.position.copy(light).multiplyScalar(160);
    this.sun.color.copy(dayAmt > 0.04 ? s.sun : new THREE.Color(0x8fa4f0)).lerp(s.sun, 0.0);
    this.sun.intensity = dayAmt > 0.04 ? lerp(0.25, 2.5, clamp(s.height * 2.2, 0, 1)) * (0.4 + 0.6 * dayAmt) : 2.1 * s.night;
    this.hemi.color.copy(s.zenith).lerp(new THREE.Color(0x5a6cb8), 0.8 * s.night).lerp(new THREE.Color(0xffffff), 0.35 * dayAmt);
    this.hemi.groundColor.copy(s.ambient).lerp(new THREE.Color(0x2a2c52), s.night * 0.6).multiplyScalar(0.55);
    this.hemi.intensity = lerp(1.75, 1.25, dayAmt);
    if (this.cloudMesh) { const col = new THREE.Color(1, 1, 1).lerp(s.dusk > 0.1 ? new THREE.Color(1, 0.72, 0.55) : new THREE.Color(1, 1, 1), s.dusk).multiplyScalar(lerp(0.22, 1, dayAmt)); this.cloudMesh.material.color.copy(col); }
    return s;
  }
}
