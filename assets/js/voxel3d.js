/*
 * Voxel 3D — a tiny software 3D renderer for pixel-art lettering (no libraries, no assets).
 * It builds the text out of real cubes with the game's own 5x7 alphabet, culls the hidden faces,
 * sorts the visible ones and paints them on a 2D canvas, so the tag really has depth: it sways,
 * follows the pointer, can be dragged and spun, and a glint of light runs across the gold.
 *
 *   VoxelText(canvas, { text: 'CBOUQ', plate: true })   -> the CBOUQ tag (plate, ring and chain)
 *   VoxelText(canvas, { text: 'VOXEL WORLD', plate: false }) -> the game's title
 */
(function () {
  'use strict';
  var FONT = window.PIXEL_FONT || {};
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, k) { return 'rgb(' + Math.max(0, Math.min(255, Math.round(c[0] * k))) + ',' + Math.max(0, Math.min(255, Math.round(c[1] * k))) + ',' + Math.max(0, Math.min(255, Math.round(c[2] * k))) + ')'; }

  var GOLD_TOP = rgb('#ffe28a'), GOLD_BOT = rgb('#d8761c'), OUTLINE = rgb('#2b1507');
  var PLATE_A = rgb('#1c1634'), PLATE_B = rgb('#0e0b1d'), RIM = rgb('#e0a93c'), RIM_IN = rgb('#4a3a73'), METAL = rgb('#9aa3b8'), METAL_D = rgb('#5b6378');

  /** Builds the voxels: Map "x,y,z" -> { c: [r,g,b], glow: bool } */
  function build(text, plate) {
    var vox = {};
    function set(x, y, z, c, glow) { vox[x + ',' + y + ',' + z] = { x: x, y: y, z: z, c: c, glow: !!glow }; }
    var letters = text.toUpperCase().split('');
    var charW = 6;                                   // 5 wide + 1 gap
    var textW = letters.length * charW - 1, textH = 7;
    var padX = plate ? 5 : 2, padY = plate ? 4 : 2;
    var W = textW + padX * 2, H = textH + padY * 2;
    var ox = padX, oy = padY;                        // text origin (bottom-left of the first letter)
    var solid = {};
    letters.forEach(function (ch, li) {
      var rows = FONT[ch];
      if (!rows) return;
      for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) {
        if (rows[r].charAt(c) === '1') solid[(ox + li * charW + c) + ',' + (oy + (6 - r))] = [li, r, c];
      }
    });
    if (plate) {
      var DEPTH = 3;                                 // the plate is three voxels thick
      for (var x = 0; x < W; x++) for (var y = 0; y < H; y++) {
        var cx = Math.min(x, W - 1 - x), cy = Math.min(y, H - 1 - y);
        if (cx + cy < 3) continue;                   // rounded corners
        var rim = cx <= 1 || cy <= 1 || (cx + cy <= 3);
        var inner = (cx === 2 || cy === 2) && cx >= 2 && cy >= 2;
        var t = y / H;
        var base = mix(PLATE_B, PLATE_A, t);
        for (var z = 0; z < DEPTH; z++) {
          var col = base;
          if (rim) col = z === DEPTH - 1 ? RIM : mix(RIM, OUTLINE, 0.55);
          else if (z === DEPTH - 1 && inner) col = RIM_IN;
          // the ring for the chain, top-left: a 3x3 gold ring with a hole in the middle
          if (x >= 3 && x <= 5 && y >= H - 6 && y <= H - 4) {
            if (x === 4 && y === H - 5) continue;
            col = METAL;
          }
          set(x, y, z, col, false);
        }
      }
      // the chain: from the ring up and to the left, alternating links
      var chain = [[4, H - 3], [4, H - 2], [4, H - 1], [3, H], [4, H + 1], [4, H + 2], [5, H + 3], [4, H + 4], [4, H + 5], [3, H + 6]];
      chain.forEach(function (p, i) { for (var z = 1; z <= 2; z++) set(p[0], p[1], z, (i + z) % 2 ? METAL_D : METAL, false); });
        } else {
      // an outline plate behind the letters, one voxel wider, like the game's title
      Object.keys(solid).forEach(function (k) {
        var p = k.split(',').map(Number);
        for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
          var key = (p[0] + dx) + ',' + (p[1] + dy) + ',1';
          if (!vox[key]) set(p[0] + dx, p[1] + dy, 1, OUTLINE, false);
          var key0 = (p[0] + dx) + ',' + (p[1] + dy) + ',0';
          if (!vox[key0]) set(p[0] + dx, p[1] + dy, 0, mix(OUTLINE, [0, 0, 0], 0.4), false);
        }
      });
    }
    var rnd = 11;
    function rand() { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; }
    Object.keys(solid).forEach(function (k) {
      var p = k.split(',').map(Number), info = solid[k];
      var t = info[1] / 6;                            // 0 top .. 1 bottom
      var base = mix(GOLD_TOP, GOLD_BOT, t);
      var dark = mix(base, [0, 0, 0], 0.42);
      var z0 = plate ? 3 : 2;                         // the letters stand on the plate (or on the outline)
      for (var z = z0; z < z0 + 3; z++) set(p[0], p[1], z, dark, false);
      set(p[0], p[1], z0 + 3, base, false);
      set(p[0], p[1], z0 + 4, mix(base, [255, 255, 255], 0.14 + 0.1 * rand()), true);
    });
    return { vox: vox, W: W, H: H + (plate ? 7 : 0), plate: plate, textY: oy };
  }

  var DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  function faces(model) {
    var out = [];
    var vox = model.vox;
    Object.keys(vox).forEach(function (k) {
      var v = vox[k];
      DIRS.forEach(function (d) {
        if (vox[(v.x + d[0]) + ',' + (v.y + d[1]) + ',' + (v.z + d[2])]) return;
        out.push({ x: v.x + 0.5 + d[0] * 0.5, y: v.y + 0.5 + d[1] * 0.5, z: v.z + 0.5 + d[2] * 0.5, n: d, c: v.c, glow: v.glow });
      });
    });
    return out;
  }

  function VoxelText(canvas, opts) {
    opts = opts || {};
    var model = build(opts.text || 'CBOUQ', opts.plate !== false);
    var fcs = faces(model);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = 0, ch = 0;
    var yaw = 0, pitch = 0, yawV = 0;
    var tYaw = 0, tPitch = 0;
    var pointer = null, dragging = false, lastX = 0, dragMoved = 0;
    var time = 0, last = 0, raf = 0, alive = true, visible = true;
    var sparks = [];
    var sway = opts.sway !== false && !REDUCED;
    var cx0 = model.W / 2, cy0 = model.H / 2 - (model.plate ? 3.2 : 0), cz0 = 3.5;
    var light = (function () { var l = [-0.45, 0.75, 0.6]; var m = Math.hypot(l[0], l[1], l[2]); return [l[0] / m, l[1] / m, l[2] / m]; })();

    function resize() {
      var r = canvas.getBoundingClientRect();
      cw = Math.max(50, Math.round(r.width)); ch = Math.max(50, Math.round(r.height));
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);

    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * 2 - 1, py = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer = { x: Math.max(-1.4, Math.min(1.4, px)), y: Math.max(-1.4, Math.min(1.4, py)) };
      if (dragging) {
        var dx = e.clientX - lastX; lastX = e.clientX; dragMoved += Math.abs(dx);
        yaw += dx * 0.012; yawV = dx * 0.012 * 60;
      }
    }
    function onDown(e) { dragging = true; lastX = e.clientX; dragMoved = 0; try { canvas.setPointerCapture(e.pointerId); } catch (x) { } }
    function onUp() {
      if (dragging && dragMoved < 5 && !REDUCED) { yawV = 11; burst(40); }
      dragging = false;
    }
    function onLeave() { if (!dragging) pointer = null; }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.style.touchAction = 'pan-y';
    canvas.style.cursor = 'grab';

    var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && alive && !raf) { last = 0; raf = requestAnimationFrame(frame); } }) : null;
    if (io) io.observe(canvas);

    function burst(n) {
      for (var i = 0; i < n; i++) {
        sparks.push({ x: (Math.random() - 0.5) * cw * 0.7, y: (Math.random() - 0.5) * ch * 0.5, vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 90, life: 0.8 + Math.random() * 0.9, age: 0, s: 2 + Math.random() * 3, hot: Math.random() < 0.5 });
      }
    }

    function frame(ts) {
      raf = 0;
      if (!alive) return;
      if (!visible) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts; time += dt;
      // where the tag wants to point: a slow sway plus a lean towards the pointer
      var swayY = sway ? Math.sin(time * 0.7) * 0.32 : 0, swayP = sway ? Math.sin(time * 0.5 + 1) * 0.08 : 0;
      tYaw = swayY + (pointer ? pointer.x * 0.5 : 0);
      tPitch = swayP + (pointer ? pointer.y * 0.22 : 0);
      if (!dragging) {
        // unwind full turns, then spring towards the target
        while (yaw > Math.PI) yaw -= Math.PI * 2;
        while (yaw < -Math.PI) yaw += Math.PI * 2;
        yawV += (tYaw - yaw) * 38 * dt - yawV * 4.2 * dt;
        yaw += yawV * dt;
      }
      pitch += (tPitch - pitch) * Math.min(1, dt * 6);
      if (!REDUCED && Math.random() < dt * 14) burst(1);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function draw() {
      ctx.clearRect(0, 0, cw, ch);
      var unit = Math.min(cw / (model.W + 6), ch / (model.H + 8)) ;
      var D = 46;                                    // camera distance in voxels
      var f = D * unit * 0.98;                       // projection scale
      var cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var ox = cw / 2, oy = ch / 2 + (model.plate ? unit * 1.2 : 0);
      var list = [];
      var sweep = ((time * 0.55) % 2.2 - 0.6) * model.W;       // the glint's position along the text
      for (var i = 0; i < fcs.length; i++) {
        var fa = fcs[i];
        var x = fa.x - cx0, y = fa.y - cy0, z = fa.z - cz0;
        // yaw around Y, then pitch around X
        var x1 = x * cyaw + z * syaw, z1 = -x * syaw + z * cyaw;
        var y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        var nx = fa.n[0] * cyaw + fa.n[2] * syaw, nz0 = -fa.n[0] * syaw + fa.n[2] * cyaw;
        var ny = fa.n[1] * cp - nz0 * sp, nz = fa.n[1] * sp + nz0 * cp;
        // visible when it faces the camera (at +z, distance D)
        if (nx * (0 - x1) + ny * (0 - y1) + nz * (D - z2) <= 0) continue;
        list.push({ f: fa, x: x1, y: y1, z: z2, nx: nx, ny: ny, nz: nz, dep: z2 });
      }
      list.sort(function (a, b) { return a.dep - b.dep; });
      for (var k = 0; k < list.length; k++) {
        var it = list[k], fa2 = it.f;
        var diff = Math.max(0, it.nx * light[0] + it.ny * light[1] + it.nz * light[2]);
        var shade = 0.40 + 0.78 * diff;
        var col = fa2.c;
        var g = 0;
        if (fa2.glow || (fa2.n[2] === 1 && fa2.z > 5)) {
          var d = (fa2.x - cx0 - sweep * 1) ;
          g = Math.exp(-d * d / 9) * 0.55;
        }
        var cstr = g > 0.02 ? css(mix(col, [255, 255, 255], g), shade + g * 0.5) : css(col, shade);
        // the four corners of the face
        var t1, t2;                                   // tangents in model space
        var n = fa2.n;
        if (n[0] !== 0) { t1 = [0, 0.5, 0]; t2 = [0, 0, 0.5]; }
        else if (n[1] !== 0) { t1 = [0.5, 0, 0]; t2 = [0, 0, 0.5]; }
        else { t1 = [0.5, 0, 0]; t2 = [0, 0.5, 0]; }
        ctx.beginPath();
        var sg = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        for (var c = 0; c < 4; c++) {
          var px = fa2.x - cx0 + t1[0] * sg[c][0] + t2[0] * sg[c][1];
          var py = fa2.y - cy0 + t1[1] * sg[c][0] + t2[1] * sg[c][1];
          var pz = fa2.z - cz0 + t1[2] * sg[c][0] + t2[2] * sg[c][1];
          var qx = px * cyaw + pz * syaw, qz = -px * syaw + pz * cyaw;
          var qy = py * cp - qz * sp, qz2 = py * sp + qz * cp;
          var s = f / (D - qz2);
          var sx = ox + qx * s, sy = oy - qy * s;
          if (c === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = cstr; ctx.fill();
        ctx.strokeStyle = cstr; ctx.lineWidth = 0.6; ctx.stroke();
      }
      // sparks drifting up
      for (var q = sparks.length - 1; q >= 0; q--) {
        var sp2 = sparks[q];
        sp2.age += 0.016; sp2.x += sp2.vx * 0.016; sp2.y += sp2.vy * 0.016; sp2.vy += 20 * 0.016;
        if (sp2.age > sp2.life) { sparks.splice(q, 1); continue; }
        var a = 1 - sp2.age / sp2.life;
        ctx.fillStyle = sp2.hot ? 'rgba(255,170,60,' + a + ')' : 'rgba(255,226,140,' + a + ')';
        ctx.fillRect(ox + sp2.x, oy + sp2.y, sp2.s, sp2.s);
      }
    }

    raf = requestAnimationFrame(frame);
    return {
      destroy: function () { alive = false; if (raf) cancelAnimationFrame(raf); canvas.removeEventListener('pointermove', onMove); },
      burst: burst
    };
  }

  window.VoxelText = VoxelText;
})();
