/*
 * The armoury: every weapon of the game on a dais, in its real voxel model. Pick a family and a mineral; click the weapon to swing it, drag to turn it.
 * The numbers (damage, speed, reach, wear, effects) come from the game itself.
 */
import { createShowcase } from './showcase.js';

const DATA = new URL('../../../wiki/data/', import.meta.url).href;
const RARITY = { 'Comune': 'r0', 'Insolito': 'r1', 'Raro': 'r2', 'Leggendario': 'r3' };

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bar = (v, max) => '<i style="--v:' + Math.max(4, Math.min(100, Math.round(v / max * 100))) + '%"></i>';

export async function initArmory(root, assets) {
  const [weapons, minerals] = await Promise.all([fetch(DATA + 'weapons.json').then(r => r.json()), fetch(DATA + 'minerals.json').then(r => r.json())]);
  const mineralOf = {}; minerals.forEach(m => { mineralOf[m.material] = m; });
  const types = []; weapons.forEach(w => { if (types.indexOf(w.type) < 0) types.push(w.type); });
  const rarities = []; weapons.forEach(w => { if (rarities.indexOf(w.rarity) < 0) rarities.push(w.rarity); });
  const maxDamage = Math.max(...weapons.map(w => w.damage));
  const maxDur = Math.max(...weapons.map(w => w.durability));

  root.innerHTML = '<div class="stage-host"></div>' +
    '<div class="stage-top ui3d"><div class="tabs3d" role="tablist" aria-label="Famiglia di armi"></div></div>' +
    '<aside class="card3d ui3d" aria-live="polite"></aside>' +
    '<div class="stage-bottom ui3d"><button class="nav3d prev" type="button" aria-label="Arma precedente">‹</button><div class="chips3d" role="listbox" aria-label="Materiale"></div><button class="nav3d next" type="button" aria-label="Arma successiva">›</button></div>' +
    '<p class="hint3d ui3d">Trascina per girarla · clic sull\'arma per brandirla</p>';
  const host = root.querySelector('.stage-host'), tabs = root.querySelector('.tabs3d'), chips = root.querySelector('.chips3d'), card = root.querySelector('.card3d');
  const sc = await createShowcase(host, assets, { kind: 'forge', fov: 34 });
  const state = { type: types[0], list: [], i: 0 };

  function listOf(type) { return weapons.filter(w => w.type === type).sort((a, b) => a.damage - b.damage); }

  function renderTabs() {
    tabs.innerHTML = types.map(t => '<button type="button" role="tab" aria-selected="' + (t === state.type) + '" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('');
  }
  function renderChips() {
    chips.innerHTML = state.list.map((w, i) => '<button type="button" role="option" class="chip3d ' + (RARITY[w.rarity] || '') + (i === state.i ? ' on' : '') + '" aria-selected="' + (i === state.i) + '" data-i="' + i + '" title="' + esc(w.name) + '"><b style="background:' + esc(w.color) + '"></b><span>' + esc(shortName(w)) + '</span></button>').join('');
    const on = chips.querySelector('.on'); if (on) chips.scrollTo({ left: on.offsetLeft - chips.clientWidth / 2 + on.clientWidth / 2, behavior: 'smooth' });
  }
  function shortName(w) { return w.trophy ? w.name.replace(/^(Spada|Pugnale|Ascia|Maglio|Lancia|Bastone|Scettro|Lama|Kopesh)\s+(di|del|della|dei|degli)?\s*/i, '') || w.name : w.material; }

  function renderCard(w) {
    const m = mineralOf[w.material];
    const perks = (w.perks || []).map(p => '<li>' + esc(p) + '</li>').join('');
    card.innerHTML = '<span class="pill ' + (RARITY[w.rarity] || '') + '">' + esc(w.rarity) + '</span>' +
      '<h3>' + esc(w.name) + '</h3><p class="lore">' + esc(w.lore) + '</p>' +
      '<dl class="stats3d"><div><dt>Danno</dt><dd>' + w.damage + '</dd>' + bar(w.damage, maxDamage) + '</div>' +
      '<div><dt>Velocità</dt><dd>' + (1 / w.cooldown).toFixed(1) + '/s</dd>' + bar(1 / w.cooldown, 3.2) + '</div>' +
      '<div><dt>Portata</dt><dd>' + w.reach + '</dd>' + bar(w.reach, 6) + '</div>' +
      '<div><dt>Resistenza</dt><dd>' + w.durability + '</dd>' + bar(w.durability, maxDur) + '</div></dl>' +
      (w.special ? '<p class="special"><b>' + esc(w.special) + '</b> ' + esc(w.specialText) + '</p>' : '') +
      (perks ? '<ul class="perks">' + perks + '</ul>' : '') +
      (w.trophy ? '<p class="meta">Trofeo di <b>' + esc(w.trophy) + '</b></p>' : (m ? '<p class="meta">Si forgia con <b>' + esc(m.name.toLowerCase()) + '</b>: la trovi tra <b>Y ' + m.minY + ' e ' + m.maxY + '</b>' + (m.province ? ', solo in certe regioni' : '') + '.</p>' : '<p class="meta">Livello richiesto: <b>' + w.level + '</b></p>'));
  }

  const glowOf = w => Math.min(1, (w.special ? 0.7 : 0) + (w.tier >= 4 ? 0.3 : 0) + (w.trophy ? 0.2 : 0));
  async function select(i, user) {
    state.i = (i + state.list.length) % state.list.length;
    const w = state.list[state.i];
    renderChips(); renderCard(w);
    await sc.show('w_' + w.id, { size: 'weapon', color: w.color, glow: glowOf(w) });
    if (user) sc.setSpin(true);
    // warm the neighbours so the next one pops in at once
    [state.i + 1, state.i - 1].forEach(j => { const n = state.list[(j + state.list.length) % state.list.length]; if (n) fetch(new URL('../../3d/models/w_' + n.id + '.json', import.meta.url)).catch(() => {}); });
  }
  function setType(t, pick) {
    state.type = t; state.list = listOf(t); renderTabs();
    let i = pick != null ? pick : Math.min(state.list.length - 1, Math.floor(state.list.length * 0.6));
    select(i);
  }

  tabs.addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) setType(b.dataset.t, 0); });
  chips.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b) select(+b.dataset.i, true); });
  root.querySelector('.prev').addEventListener('click', () => select(state.i - 1, true));
  root.querySelector('.next').addEventListener('click', () => select(state.i + 1, true));
  root.tabIndex = 0;
  root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { select(state.i + 1, true); e.preventDefault(); } else if (e.key === 'ArrowLeft') { select(state.i - 1, true); e.preventDefault(); } });

  setType(types[0], 6);
  return { sc, view: sc.view, setTheme: t => sc.setTheme(t) };
}
