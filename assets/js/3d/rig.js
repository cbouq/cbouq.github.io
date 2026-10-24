/*
 * The plumbing of every 3D zone: one WebGL view per zone (it draws only while it is on screen), an adaptive resolution that never lets the page
 * stutter, and an orbit that turns what you drag but never steals the scroll of the page.
 */
import * as THREE from 'three';

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const LOW_DATA = !!(navigator.connection && navigator.connection.saveData);
export const COARSE = matchMedia('(pointer: coarse)').matches;

export function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

const views = new Set();
let raf = 0, last = 0;
function loop(now) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  for (const v of views) v.frame(dt, now / 1000);
}
function startLoop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

export class View {
  /** host: an element with a size (the zone); it gets a canvas that fills it. */
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: opts.antialias !== false, alpha: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.setClearColor(opts.clear ?? 0x0a0912, 1);
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'view3d-canvas';
    host.prepend(this.canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(opts.fov ?? 45, 1, opts.near ?? 0.3, opts.far ?? 900);
    this.visible = false;
    this.needs = true;                 // draw at least once
    this.dprMax = Math.min(devicePixelRatio || 1, opts.maxDpr ?? 2);
    this.q = COARSE ? 0.8 : 1;
    this.avg = 16;
    this.slow = 0; this.fast = 0;
    this.ready = false;
    this.update = null;                // (dt, t) -> void, set by the scene
    this.onResize = null;
    this.size = new THREE.Vector2();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.needs = true; }, { rootMargin: '80px' });
    this.io.observe(host);
    views.add(this);
    startLoop();
  }
  resize() {
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    this.size.set(w, h);
    this.renderer.setPixelRatio(this.dprMax * this.q);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.onResize) this.onResize(w, h);
    this.needs = true;
  }
  /** Draws once even when nothing moves (a click, a new choice). */
  invalidate() { this.needs = true; }
  frame(dt, t) {
    if (!this.visible || !this.ready || document.hidden) return;
    const moving = this.update ? this.update(dt, t) !== false : true;
    if (REDUCED && !this.needs && !this.opts.alwaysRender) return;
    if (!moving && !this.needs) return;
    this.needs = false;
    this.renderer.render(this.scene, this.camera);
    // keep the page smooth: lower the resolution when frames take too long, give it back when there is room
    this.avg += (dt * 1000 - this.avg) * 0.08;
    if (this.avg > 30) { this.slow += dt; this.fast = 0; } else if (this.avg < 18) { this.fast += dt; this.slow = 0; } else { this.slow = this.fast = 0; }
    if (this.slow > 1.2 && this.q > 0.55) { this.q *= 0.86; this.slow = 0; this.resize(); if (this.onQuality) this.onQuality(this.q); }
    else if (this.fast > 6 && this.q < 1) { this.q = Math.min(1, this.q * 1.08); this.fast = 0; this.resize(); if (this.onQuality) this.onQuality(this.q); }
  }
  dispose() {
    views.delete(this);
    this.ro.disconnect(); this.io.disconnect();
    this.renderer.dispose();
    this.canvas.remove();
  }
}

/** Orbit round a target: drag turns it (horizontal drags only on touch screens, vertical ones still scroll the page), it eases to a stop. */
export class Orbit {
  constructor(el, o = {}) {
    this.el = el;
    this.target = new THREE.Vector3(...(o.target || [0, 0, 0]));
    this.yaw = o.yaw ?? 0; this.pitch = o.pitch ?? 0.4; this.radius = o.radius ?? 10;
    this.minPitch = o.minPitch ?? -0.2; this.maxPitch = o.maxPitch ?? 1.35;
    this.minR = o.minR ?? 3; this.maxR = o.maxR ?? 40;
    this.auto = o.auto ?? 0.1;                 // radians per second
    this.vy = 0; this.vp = 0;
    this.dragging = false; this.idle = 0;
    this.enabled = true;
    this.offsetYaw = 0;                        // a drag on top of the scripted camera: it springs back
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    let lx = 0, ly = 0, id = null;
    el.addEventListener('pointerdown', e => { if (!this.enabled) return; this.dragging = true; id = e.pointerId; lx = e.clientX; ly = e.clientY; this.idle = 0; try { el.setPointerCapture(id); } catch (x) { /* ok */ } el.style.cursor = 'grabbing'; });
    el.addEventListener('pointermove', e => {
      if (!this.dragging || e.pointerId !== id) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      this.vy = -dx * 0.0055; this.vp = e.pointerType === 'touch' ? 0 : dy * 0.0045;
      this.yaw += this.vy; this.offsetYaw += this.vy; this.pitch = Math.min(this.maxPitch, Math.max(this.minPitch, this.pitch + this.vp));
      this.idle = 0; this.moved = true;
    });
    const end = e => { if (e.pointerId !== id) return; this.dragging = false; el.style.cursor = 'grab'; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  /** Advances the inertia; returns true while something is still moving. */
  step(dt, autoOn = true) {
    let moving = false;
    if (!this.dragging) {
      if (Math.abs(this.vy) > 1e-4 || Math.abs(this.vp) > 1e-4) { this.yaw += this.vy; this.offsetYaw += this.vy; this.pitch = Math.min(this.maxPitch, Math.max(this.minPitch, this.pitch + this.vp)); const k = Math.pow(0.0009, dt); this.vy *= k; this.vp *= k; moving = true; }
      this.idle += dt;
      if (autoOn && this.auto && this.idle > 1.6 && !REDUCED) { this.yaw += this.auto * dt; moving = true; }
    } else moving = true;
    return moving;
  }
  apply(camera) {
    const cp = Math.cos(this.pitch);
    camera.position.set(this.target.x + Math.sin(this.yaw) * cp * this.radius, this.target.y + Math.sin(this.pitch) * this.radius, this.target.z + Math.cos(this.yaw) * cp * this.radius);
    camera.lookAt(this.target);
  }
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
export function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

/** A small seeded noise (value noise, 2D) for the terrain-like bits. */
export function noise2(seed) {
  const h = (x, y) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
  };
}

/** A small seeded noise (value noise, 3D): smooth blobs, for caves. */
export function noise3(seed) {
  const h = (x, y, z) => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177) + Math.imul(seed, 2246822519); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const f = t => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = f(x - xi), v = f(y - yi), w = f(z - zi);
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), u), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
             l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
  };
}

/** A seeded random number generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
