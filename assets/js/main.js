/*
 * Voxel World, il sito: la pagina in 3D. Ogni zona (l'isola con il villaggio, l'armeria, il bestiario, le miniere, il costruttore) si carica solo quando
 * ci si avvicina, disegna solo quando e' visibile e abbassa da sola la risoluzione se il computer fatica. Senza WebGL restano le immagini.
 */
import { Assets } from './3d/voxel.js';
import { webglOk, REDUCED, clamp } from './3d/rig.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const GL = webglOk();
const root = document.documentElement;
if (!GL) root.classList.add('no3d');

const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
const state = { theme: store.get('vw-theme') === 'classic' ? 'classic' : 'dark', mods: [] };

let assetsP = null;
const getAssets = () => assetsP || (assetsP = Assets.load().then(a => { a.theme = state.theme; return a; }));
const fetchJson = p => fetch(new URL('../../' + p, import.meta.url)).then(r => r.json());

/** Runs fn once when the element comes within `margin` of the viewport. */
function whenNear(el, fn, margin = '700px') {
  if (!el) return;
  if (!('IntersectionObserver' in window)) { fn(); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(el);
}
function failed(el, why) {
  console.warn('3D zone failed:', why);
  el.classList.remove('loading'); el.classList.add('failed');
}
function register(mod) { state.mods.push(mod); if (mod.setTheme) mod.setTheme(state.theme); return mod; }

// ---------------------------------------------------------------------------------------------------- tema delle texture
function paintThemeButtons() { $$('[data-theme-toggle]').forEach(b => { const on = state.theme === 'classic'; b.setAttribute('aria-pressed', on); b.textContent = on ? 'Texture: classiche' : 'Texture: scure'; }); }
function setTheme(t) {
  state.theme = t; store.set('vw-theme', t);
  state.mods.forEach(m => m.setTheme && m.setTheme(t));
  paintThemeButtons();
}
$$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'classic' : 'dark')));
paintThemeButtons();

// ---------------------------------------------------------------------------------------------------- il viaggio sull'isola
const journey = $('#world');
const NPC = {};
if (journey) {
  const steps = $$('.j-step', journey), dots = $('.j-dots', journey), cue = $('.j-cue', journey), card = $('#npc-card');
  let isl = null, ticking = false;
  const progress = () => { const r = journey.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); };
  const marks = steps.map(s => (+s.dataset.from + +s.dataset.to) / 2);
  dots.innerHTML = steps.map((s, i) => '<button type="button" aria-label="Vai alla tappa ' + (i + 1) + '" data-i="' + i + '"></button>').join('');
  dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const r = journey.getBoundingClientRect(), top = r.top + scrollY, y = top + marks[+b.dataset.i] * (r.height - innerHeight); scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' }); });
  function apply() {
    ticking = false;
    const p = progress();
    steps.forEach((s, i) => { const on = p >= +s.dataset.from && p <= +s.dataset.to; s.classList.toggle('on', on); dots.children[i].classList.toggle('on', on); });
    cue.classList.toggle('off', p > 0.04);
    if (isl) isl.setProgress(p);
    if (card.classList.contains('on') && (p < 0.14 || p > 0.66)) card.classList.remove('on');
  }
  const tick = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick);
  apply();

  if (GL) {
    (async () => {
      try {
        const [assets, mod] = await Promise.all([getAssets(), import('./3d/island.js')]);
        isl = await mod.createIsland($('#world-host'), assets);
        Object.assign(NPC, mod.NPC_INFO);
        register(isl);
        isl.onNpc((role, info) => {
          if (!info) return;
          card.innerHTML = '<div class="j-card"><h4>' + info[0] + '</h4><p>' + info[1] + '</p><button class="btn sm ghost" type="button">Chiudi</button></div>';
          card.classList.add('on');
          card.querySelector('button').focus({ preventScroll: true });
          card.querySelector('button').addEventListener('click', () => card.classList.remove('on'));
        });
        journey.classList.add('ready');
        isl.setProgress(progress());
        let night = null;
        const tn = $('#t-night');
        if (tn) tn.addEventListener('click', () => { night = night === null ? true : night === true ? false : null; isl.setTime(night === null ? null : night ? 0.82 : 0.28); tn.textContent = night === null ? 'Ora: automatica' : night ? 'Ora: notte' : 'Ora: giorno'; tn.classList.toggle('on', night !== null); });
      } catch (err) { failed(journey, err); root.classList.add('no3d-hero'); journey.classList.add('ready'); }
    })();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') card.classList.remove('on'); });
}

// ---------------------------------------------------------------------------------------------------- armeria e bestiario
async function zone(id, loader, extra) {
  const el = $(id);
  if (!el) return;
  if (!GL) { el.classList.add('failed'); return; }
  whenNear(el, async () => {
    el.classList.add('loading');
    try {
      const [assets, mod] = await Promise.all([getAssets(), loader()]);
      const m = await extra(el, assets, mod);
      register(m); el.classList.remove('loading'); el.classList.add('ready');
    } catch (err) { failed(el, err); }
  });
}
zone('#armory', () => import('./3d/armory.js'), (el, assets, mod) => mod.initArmory(el, assets));
zone('#bestiary', () => import('./3d/bestiary.js'), (el, assets, mod) => mod.initBestiary(el, assets));
zone('#dojo', () => import('./3d/island.js'), async (el, assets, mod) => {
  const isl = await mod.createIsland($('#dojo-host'), assets, { file: 'dojo.json', keys: mod.DOJO_KEYS, auto: true });
  const card = $('#dojo-card');
  isl.onNpc((role, info) => {
    if (!info) return;
    card.innerHTML = '<div class="j-card"><h4>' + info[0] + '</h4><p>' + info[1] + '</p><button class="btn sm ghost" type="button">Chiudi</button></div>';
    card.classList.add('on');
    card.querySelector('button').addEventListener('click', () => card.classList.remove('on'));
  });
  const tn = $('#dojo-time');
  let night = null;
  if (tn) tn.addEventListener('click', () => { night = night === null ? true : night === true ? false : null; isl.setTime(night === null ? null : night ? 0.82 : 0.3); tn.textContent = night === null ? 'Ora: automatica' : night ? 'Ora: notte' : 'Ora: giorno'; tn.classList.toggle('on', night !== null); });
  return isl;
});

// ---------------------------------------------------------------------------------------------------- le miniere
const mineSec = $('#miniere');
if (mineSec && GL) {
  whenNear(mineSec, async () => {
    try {
      const [assets, mod, minerals] = await Promise.all([getAssets(), import('./3d/mines.js'), fetchJson('wiki/data/minerals.json')]);
      const mines = await mod.createMines($('#mine-host'), assets, minerals);
      register({ setTheme() { /* la miniera e' sempre al buio */ } });
      mineSec.classList.add('ready');
      const depthEl = $('#mine-y'), here = $('#mine-here'), got = $('#mine-got'), info = $('#mine-info'), tick = $('#gauge-tick');
      const byBlock = {}; minerals.forEach(m => { byBlock[m.id] = m; });
      const progress = () => { const r = mineSec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); };
      let ticking = false;
      const apply = () => { ticking = false; const p = progress(); mines.setDepth(p); tick.style.top = (p * 100) + '%'; };
      addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
      addEventListener('resize', apply);
      apply();
      let lastY = null;
      mines.onDepth((y, d) => {
        if (y === lastY) return; lastY = y;
        depthEl.textContent = 'Y ' + y;
        const list = mod.ORES.filter(o => y >= o[2] && y <= o[3]).sort((a, b) => b[4] - a[4]);
        here.innerHTML = list.length ? list.slice().reverse().map(o => '<span' + (mod.RARE.has(o[0]) ? ' class="rare"' : '') + '>' + o[1] + '</span>').join('') : '<span>Solo terra e radici</span>';
      });
      mines.onMine((b, col) => {
        const items = Object.keys(col).map(k => { const o = mod.ORES.find(x => x[0] === k); return '<span>' + (o ? o[1] : k === 'AMETHYST_BLOCK' ? 'Ametista' : 'Pietraluce') + ' x' + col[k] + '</span>'; });
        got.innerHTML = items.join('') || '<em>Ancora niente: clicca un blocco.</em>';
      });
      mines.onOre(name => {
        const m = byBlock[name]; const o = mod.ORES.find(x => x[0] === name);
        info.innerHTML = '<h4>' + (m ? m.name : o[1]) + '</h4><p>' + (m && m.special ? '<b>' + m.special + '</b>: ' + m.specialText + ' ' : '') + (m ? 'Armi: spada, pugnale, ascia, maglio, lancia, bastone.' : '') + '</p><p class="meta">Si trova tra Y ' + (m ? m.minY + ' e ' + m.maxY : o[2] + ' e ' + o[3]) + '.</p><button class="btn sm ghost" type="button">Chiudi</button>';
        info.hidden = false;
        info.querySelector('button').addEventListener('click', () => { info.hidden = true; });
      });
    } catch (err) { failed(mineSec, err); }
  });
}

// ---------------------------------------------------------------------------------------------------- il costruttore
const buildEl = $('#builder');
if (buildEl) {
  if (!GL) buildEl.classList.add('failed');
  else whenNear(buildEl, async () => {
    buildEl.classList.add('loading');
    try {
      const [assets, mod] = await Promise.all([getAssets(), import('./3d/builder.js')]);
      buildEl.innerHTML = '<div class="stage-host"></div>' +
        '<div class="stage-top ui3d"><div class="build-tools">' +
        '<button class="btn3d on" type="button" data-mode="place">Costruisci</button><button class="btn3d" type="button" data-mode="dig">Scava</button>' +
        '<button class="btn3d" type="button" data-night aria-pressed="false">Notte</button><button class="btn3d" type="button" data-undo disabled>Annulla</button>' +
        '<button class="btn3d" type="button" data-zoom="0.82" aria-label="Avvicina">+</button><button class="btn3d" type="button" data-zoom="1.22" aria-label="Allontana">−</button>' +
        '<button class="btn3d" type="button" data-photo>Foto</button></div></div>' +
        '<div class="stage-bottom ui3d"><div class="palette" role="listbox" aria-label="Blocchi"></div></div>' +
        '<p class="hint3d ui3d">Clic: metti · Maiusc o tasto destro: togli · trascina per girare</p>';
      const b = await mod.createBuilder($('.stage-host', buildEl), assets);
      register(b);
      const pal = $('.palette', buildEl);
      mod.PALETTE.forEach((name, i) => {
        const blk = assets.blocks[name]; if (!blk) return;
        const btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('role', 'option'); btn.dataset.b = name; btn.title = name.replace(/_/g, ' ').toLowerCase();
        const c = document.createElement('canvas'); c.width = c.height = 32;
        const key = blk.faces[0], { cols, tile } = assets.info;
        c.getContext('2d').drawImage(assets.textures.dark.image, (key % cols) * tile, ((key / cols) | 0) * tile, tile, tile, 0, 0, 32, 32);
        btn.appendChild(c); if (i === 0) btn.classList.add('on'); pal.appendChild(btn);
      });
      pal.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; b.setBlock(t.dataset.b); $$('button', pal).forEach(x => x.classList.toggle('on', x === t)); b.setMode('place'); $$('[data-mode]', buildEl).forEach(x => x.classList.toggle('on', x.dataset.mode === 'place')); });
      $$('[data-mode]', buildEl).forEach(t => t.addEventListener('click', () => { b.setMode(t.dataset.mode); $$('[data-mode]', buildEl).forEach(x => x.classList.toggle('on', x === t)); }));
      const night = $('[data-night]', buildEl); night.addEventListener('click', () => { const on = night.getAttribute('aria-pressed') !== 'true'; night.setAttribute('aria-pressed', on); night.textContent = on ? 'Giorno' : 'Notte'; b.setNight(on); });
      const undo = $('[data-undo]', buildEl); undo.addEventListener('click', () => b.undo()); b.onChange((n, h) => { undo.disabled = h === 0; });
      $$('[data-zoom]', buildEl).forEach(z => z.addEventListener('click', () => b.zoom(+z.dataset.zoom)));
      $('[data-photo]', buildEl).addEventListener('click', async () => { const blob = await b.snapshot(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'voxel-world-costruzione.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
      buildEl.tabIndex = 0;
      buildEl.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { b.undo(); e.preventDefault(); } });
      buildEl.classList.remove('loading'); buildEl.classList.add('ready');
    } catch (err) { failed(buildEl, err); }
  });
}

// ---------------------------------------------------------------------------------------------------- video dei domini (partono solo se visibili)
$$('.vid').forEach(box => {
  const v = $('video', box), btn = $('.play', box), bar = $('.bar i', box);
  if (!v) return;
  let want = !REDUCED, loaded = false;
  const small = matchMedia('(max-width: 820px)').matches || (navigator.connection && navigator.connection.saveData);          // a lighter file for phones and slow lines
  const load = () => { if (loaded) return; loaded = true; $$('source', v).forEach(s => { s.src = small && s.dataset.small ? s.dataset.small : s.dataset.src; }); v.load(); };
  const sync = vis => {
    if (vis) load();
    if (vis && want && v.paused) v.play().catch(() => {});
    if (!vis && !v.paused) v.pause();
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => sync(e.isIntersecting && box.offsetParent !== null)), { threshold: 0.35 }).observe(box);
  if (btn) { btn.textContent = want ? 'Pausa' : 'Riproduci'; btn.addEventListener('click', () => { want = v.paused; if (want) { load(); v.play().catch(() => {}); } else v.pause(); btn.textContent = want ? 'Pausa' : 'Riproduci'; }); }
  v.addEventListener('timeupdate', () => { if (bar && v.duration) bar.style.width = (v.currentTime / v.duration * 100) + '%'; });
  box.closest('.dom') && new MutationObserver(() => sync(box.offsetParent !== null)).observe(box.closest('.dom'), { attributes: true, attributeFilter: ['class'] });
});
