/*
 * The bestiary: the creatures, the villagers and the guardians of the game, each in its real voxel model. They breathe, look at your pointer,
 * and walk when you ask - the legs, wings and tails swing the way the game animates them.
 */
import { createShowcase } from './showcase.js';
import { loadJson } from './voxel.js';

const DATA = new URL('../../../wiki/data/', import.meta.url).href;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const GROUPS = [
  ['Villaggio', m => m.npc],
  ['Fauna', m => !m.npc && !m.hostile && !m.boss],
  ['Mostri', m => !m.npc && m.hostile && !m.boss],
  ['Guardiani', m => m.boss]
];

export async function initBestiary(root, assets) {
  const [mobs, bosses, index] = await Promise.all([fetch(DATA + 'mobs.json').then(r => r.json()), fetch(DATA + 'bosses.json').then(r => r.json()), loadJson('models/index.json')]);
  const have = new Set(index);
  const bossOf = {}; bosses.forEach(b => { bossOf[b.id] = b; });
  const list = mobs.filter(m => have.has('m_' + m.id));
  root.innerHTML = '<div class="stage-host"></div>' +
    '<aside class="card3d ui3d" aria-live="polite"></aside>' +
    '<div class="stage-left ui3d"><div class="groups3d" role="listbox" aria-label="Creature"></div></div>' +
    '<div class="stage-bottom ui3d"><button class="btn3d" type="button" data-walk aria-pressed="false">Cammina</button><button class="btn3d" type="button" data-rnd>Una a caso</button></div>' +
    '<p class="hint3d ui3d">Muovi il puntatore: ti guardano · trascina per girare</p>';
  const host = root.querySelector('.stage-host'), card = root.querySelector('.card3d'), groups = root.querySelector('.groups3d');
  const sc = await createShowcase(host, assets, { kind: 'meadow', fov: 36 });

  groups.innerHTML = GROUPS.map(([name, f]) => '<h4>' + name + '</h4>' + list.filter(f).map(m => '<button type="button" role="option" data-id="' + m.id + '" style="--c:' + esc(m.color) + '"><b></b>' + esc(m.name) + '</button>').join('')).join('');

  let cur = null;
  function chips(m) {
    const c = [];
    c.push(['Vita', m.health]);
    if (m.damage) c.push(['Danno', m.damage]);
    c.push(['Velocità', m.speed]);
    if (m.xp) c.push(['PE', m.xp]);
    return c.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('');
  }
  function flags(m) {
    const f = [];
    if (m.boss) f.push('Guardiano'); else if (m.npc) f.push(m.role || 'Abitante'); else f.push(m.hostile ? 'Ostile' : 'Pacifica');
    if (m.night) f.push('Esce di notte'); if (m.flies) f.push('Vola'); if (m.ranged) f.push('Attacca da lontano');
    if (m.mount) f.push('Cavalcabile');
    return f.map(x => '<span>' + esc(x) + '</span>').join('');
  }
  async function pick(id) {
    const m = list.find(x => x.id === id); if (!m) return;
    cur = m;
    groups.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    const b = bossOf[id];
    card.innerHTML = '<div class="flags">' + flags(m) + '</div><h3>' + esc(m.name) + '</h3>' +
      (b && b.epitaph ? '<p class="lore">' + esc(b.epitaph) + '</p>' : '') +
      '<dl class="stats3d lines">' + chips(m) + '</dl>' +
      (m.mountHint ? '<p class="meta">' + esc(m.mountHint) + '</p>' : '') +
      (b ? '<p class="meta">' + b.phases.length + ' fasi · bottino: <b>' + esc([b.trophy, b.weaponTrophy].filter(Boolean).join(', ') || '—') + '</b></p>' : '') +
      (m.npc ? '<p class="meta">Lo trovi nei villaggi: dà missioni e ricompense.</p>' : '');
    await sc.show('m_' + m.id, { size: 'creature', color: m.color, glow: 0, flies: m.flies });
    const sel = groups.querySelector('.on'); if (sel) { const r = sel.getBoundingClientRect(), g = groups.getBoundingClientRect(); if (r.top < g.top || r.bottom > g.bottom) groups.scrollTo({ top: sel.offsetTop - groups.clientHeight / 2, behavior: 'smooth' }); }
  }
  groups.addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (b) pick(b.dataset.id); });
  const walk = root.querySelector('[data-walk]');
  walk.addEventListener('click', () => { const v = !sc.getWalk(); sc.setWalk(v); walk.setAttribute('aria-pressed', v); walk.textContent = v ? 'Fermo' : 'Cammina'; });
  root.querySelector('[data-rnd]').addEventListener('click', () => { const m = list[Math.floor(Math.random() * list.length)]; pick(m.id); });
  root.tabIndex = 0;
  root.addEventListener('keydown', e => { if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; const i = list.findIndex(m => cur && m.id === cur.id), j = (i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length; pick(list[j].id); e.preventDefault(); });

  pick(list.some(m => m.id === 'WOLF') ? 'WOLF' : list[0].id);
  return { sc, view: sc.view, setTheme: t => sc.setTheme(t) };
}
