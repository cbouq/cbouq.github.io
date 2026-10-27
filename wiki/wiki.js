(function () {
  'use strict';
  var D = window.WIKI_DATA, P = window.WIKI_PAGES || {};
  var doc = document.getElementById('doc'), side = document.getElementById('side');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function list(a) { return (a && a.length) ? a.map(esc).join(' · ') : '—'; }
  function by(rows, key, val) { return (rows || []).filter(function (r) { return r[key] === val; })[0]; }

  var KIND = { STRIKE: 'Colpo', BLINK: 'Salto', BEAM: 'Raggio', SUMMON: 'Evocazione', NOVA: 'Esplosione', DASH: 'Scatto', FREEZE_WATER: 'Gelo sull\'acqua', WALL: 'Muro', DOMAIN: 'Dominio', BLOOM_GROUND: 'Fioritura', MOUNT: 'Cavalcatura', SHIELD: 'Scudo', PROJECTILE: 'Proiettile', HEAL: 'Cura', ZONE: 'Zona' };
  var KINDS = { MATERIAL: 'Materiale', TOOL: 'Strumento', FOOD: 'Cibo', POTION: 'Pozione' };
  function kindName(v) { return KIND[v] || v; }

  /* Ogni dataset: colonne, filtri a tendina, riga di dettaglio (clic sulla riga). */
  var DATASETS = {
    incantesimi: { title: 'Incantesimi', data: 'spells', filters: ['school', 'tier', 'kind'], fmt: { kind: kindName },
      cols: [['name', 'Nome'], ['school', 'Scuola'], ['kind', 'Tipo'], ['tier', 'Grado'], ['mana', 'Mana'], ['stamina', 'Stamina'], ['cooldown', 'Recupero s'], ['level', 'Livello'], ['damage', 'Danno'], ['text', 'Descrizione']],
      detail: function (r) { return chips([['Richiede', r.attrName + ' ' + r.attribute + ', livello ' + r.level, 'g'], r.radius ? ['Raggio', r.radius, 'c'] : null, r.duration ? ['Durata', r.duration + ' s', 'c'] : null, r.range ? ['Gittata', r.range, 'c'] : null, r.secret ? ['', 'Magia segreta: si impara da una pergamena', 'p'] : null]) + (r.study && r.study.length ? '<p><b>Studio:</b> ' + list(r.study) + '</p>' : ''); } },
    armi: { title: 'Armi', data: 'weapons', filters: ['type', 'material', 'rarity'],
      cols: [['name', 'Nome'], ['type', 'Tipo'], ['tier', 'Grado'], ['material', 'Materiale'], ['damage', 'Danno'], ['cooldown', 'Recupero s'], ['rarity', 'Rarità'], ['lore', 'Storia']],
      detail: function (r) { return chips([['Portata', r.reach, 'c'], ['Livello', r.level, 'g'], ['Resistenza', r.durability + ' colpi', ''], r.special ? ['Speciale', r.special, 'p'] : null, r.trophy ? ['Trofeo', r.trophy, 'r'] : null]) + (r.specialText ? '<p>' + esc(r.specialText) + '</p>' : '') + (r.perks && r.perks.length ? '<p><b>Bonus:</b> ' + list(r.perks) + '</p>' : ''); } },
    armature: { title: 'Armature e gioielli', data: 'gear', filters: ['slot', 'material', 'rarity', 'set'],
      cols: [['name', 'Nome'], ['slot', 'Slot'], ['power', 'Potere'], ['material', 'Materiale'], ['set', 'Set'], ['rarity', 'Rarità'], ['lore', 'Storia']],
      detail: function (r) { return chips([['Livello', r.level, 'g'], r.durability ? ['Resistenza', r.durability + ' colpi', ''] : ['', 'Non si consuma', 'c'], r.trophy ? ['Trofeo', r.trophy, 'r'] : null]) + (r.perks && r.perks.length ? '<p><b>Bonus:</b> ' + list(r.perks) + '</p>' : ''); } },
    set: { title: 'Set e bonus', view: 'sets' },
    ricette: { title: 'Ricette', data: 'recipes', filters: ['category', 'station'],
      cols: [['name', 'Nome'], ['category', 'Categoria'], ['station', 'Banco'], ['inputs', 'Ingredienti'], ['schema', 'Schema'], ['text', 'Note']] },
    oggetti: { title: 'Oggetti', data: 'items', filters: ['kind'], fmt: { kind: function (v) { return KINDS[v] || v; } },
      cols: [['name', 'Nome'], ['kind', 'Tipo'], ['stack', 'Pila'], ['durability', 'Durata'], ['food', 'Cibo'], ['use', 'Effetto']] },
    blocchi: { title: 'Blocchi', data: 'blocks', filters: ['tool'],
      cols: [['name', 'Nome'], ['hardness', 'Durezza'], ['tool', 'Strumento'], ['minTier', 'Grado minimo']] },
    creature: { title: 'Creature', data: 'mobs', filters: ['hostile', 'mountHint'],
      cols: [['name', 'Nome'], ['health', 'Vita'], ['damage', 'Danno'], ['speed', 'Velocità'], ['hostile', 'Ostile'], ['mountHint', 'Cavalcatura']] },
    boss: { title: 'Guardiani e boss', view: 'bosses' },
    imprese: { title: 'Imprese', data: 'achievements', filters: ['category'],
      cols: [['category', 'Categoria'], ['name', 'Impresa'], ['text', 'Cosa fare'], ['xp', 'PE']] },
    classi: { title: 'Classi', data: 'classes', filters: ['attribute'],
      cols: [['name', 'Classe'], ['attribute', 'Attributo'], ['schools', 'Scuole'], ['art', 'Arte marziale'], ['text', 'Descrizione']] },
    razze: { title: 'Razze', data: 'races', cols: [['name', 'Razza'], ['mods', 'Modificatori'], ['text', 'Descrizione']] },
    biomi: { title: 'Biomi', data: 'biomes', cols: [['name', 'Bioma'], ['temperature', 'Temperatura (−1 gelo, +1 torrido)']] },
    schemi: { title: 'Schemi', data: 'blueprints', cols: [['name', 'Schema'], ['text', 'Cosa apre'], ['where', 'Dove trovarlo']] },
    minerali: { title: 'Minerali', data: 'minerals', filters: ['province'],
      cols: [['name', 'Minerale'], ['material', 'Materiale'], ['minY', 'Da Y'], ['maxY', 'A Y'], ['per100', 'Pezzi ogni 100 chunk'], ['province', 'Solo in certe regioni'], ['special', 'Effetto sulle armi'], ['bestDamage', 'Danno max'], ['tool', 'Strumento']],
      detail: function (r) { return chips([['Durezza', r.hardness, ''], ['Grado minimo', r.minTier, 'g']]) + (r.specialText ? '<p><b>' + esc(r.special) + ':</b> ' + esc(r.specialText) + '</p>' : '') + '<p><b>Armi:</b> ' + list(r.makes) + '</p>'; } },
    abitanti: { title: 'Abitanti dei villaggi', data: 'npcs', cols: [['name', 'Mestiere'], ['trades', 'Commercia'], ['quests', 'Dà missioni'], ['text', 'Cosa fa']] },
    eredita: { title: 'Eredità', data: 'legacy', cols: [['rank', 'Grado'], ['title', 'Titolo'], ['garrisonHealth', 'Vita guardiani ×'], ['garrisonDamage', 'Danno guardiani ×'], ['wildHealth', 'Vita mostri ×'], ['wildDamage', 'Danno mostri ×'], ['xp', 'Esperienza ×'], ['maxTemper', 'Tempra max']] },
    diario: { title: 'Diario di Eldrin', data: 'lore', cols: [['name', 'Pagina'], ['text', 'Testo (contiene spoiler)']] }
  };

  /* Menu a sinistra. Le chiavi sono pagine scritte a mano (content.js) o dataset. */
  var NAV = [
    ['Inizia', [['home', 'Benvenuto'], ['per-iniziare', 'Per iniziare'], ['controlli', 'Controlli'], ['modalita', 'Creativo e Sopravvivenza'], ['faq', 'Domande frequenti'], ['guida', 'Guida del gioco (F1)']]],
    ['Il mondo', [['villaggi', 'Villaggi e missioni'], ['abitanti', 'Abitanti'], ['minerali', 'Minerali'], ['biomi', 'Biomi'], ['strutture', 'Strutture e regni'], ['boss', 'Guardiani e boss'], ['creature', 'Creature'], ['cavalcature', 'Cavalcature'], ['blocchi', 'Blocchi'], ['oggetti', 'Oggetti'], ['ricette', 'Ricette']]],
    ['L\'eroe', [['eredita', 'Eredità'], ['comfort', 'Comfort e nitidezza'], ['classi', 'Classi'], ['razze', 'Razze'], ['combattimento', 'Combattimento'], ['arti', 'Arti marziali'], ['armi', 'Armi'], ['armature', 'Armature'], ['set', 'Set e bonus'], ['imprese', 'Imprese']]],
    ['Magia', [['magia', 'Guida alla magia'], ['incantesimi', 'Incantesimi'], ['domini', 'I sei Domini']]],
    ['Sopravvivenza', [['sopravvivenza', 'Guida alla sopravvivenza'], ['schemi', 'Schemi e Forgia'], ['clima', 'Freddo e caldo'], ['usura', 'Usura e riparazioni'], ['diario', 'Diario di Eldrin']]],
    ['Avanzate', [['multiplayer', 'Multiplayer'], ['console', 'Console e comandi']]]
  ];

  function chips(a) {
    return '<div class="chips">' + a.filter(Boolean).map(function (c) { return '<span class="chip ' + (c[2] || '') + '">' + (c[0] ? esc(c[0]) + ': ' : '') + '<b>' + esc(c[1]) + '</b></span>'; }).join('') + '</div>';
  }
  function cell(v, fmt) {
    if (fmt) v = fmt(v);
    if (Array.isArray(v)) return v.map(esc).join('<br>') || '—';
    if (v === true) return 'sì'; if (v === false) return '—';
    return v === null || v === '' || v === undefined ? '—' : esc(v);
  }
  function renderNav(cur) {
    side.innerHTML = NAV.map(function (g) { return '<h4>' + g[0] + '</h4>' + g[1].map(function (i) { return '<a href="#/' + i[0] + '"' + (i[0] === cur ? ' aria-current="page"' : '') + '>' + i[1] + '</a>'; }).join(''); }).join('');
  }

  /* ---------- tabella con filtro testuale, filtri a tendina, ordinamento, dettaglio ---------- */
  function table(ds, mount) {
    var rows = D[ds.data] || [];
    var id = 't' + Math.random().toString(36).slice(2, 7);
    var fmt = ds.fmt || {};
    var colTitle = {};
    ds.cols.forEach(function (c) { colTitle[c[0]] = c[1]; });
    var selects = (ds.filters || []).map(function (k) {
      var vals = [];
      rows.forEach(function (r) { var v = r[k]; if (v === '' || v === null || v === undefined) return; if (vals.indexOf(v) < 0) vals.push(v); });
      vals.sort(function (a, b) { return typeof a === 'number' ? a - b : String(fmt[k] ? fmt[k](a) : a).localeCompare(String(fmt[k] ? fmt[k](b) : b)); });
      return '<select data-f="' + k + '" aria-label="' + esc(colTitle[k] || k) + '"><option value="">' + esc(colTitle[k] || k) + ': tutti</option>' + vals.map(function (v) { return '<option value="' + esc(v) + '">' + esc(typeof v === 'boolean' ? (v ? 'sì' : 'no') : (fmt[k] ? fmt[k](v) : v)) + '</option>'; }).join('') + '</select>';
    }).join('');
    mount.insertAdjacentHTML('beforeend', '<div class="tools"><input type="search" placeholder="Cerca…" aria-label="Cerca nella tabella" id="' + id + 'q">' + selects + '<span class="count" id="' + id + 'c"></span></div><div class="tw"><table class="t' + (ds.detail ? ' x' : '') + '"><thead><tr>' +
      ds.cols.map(function (c, i) { return '<th data-i="' + i + '">' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody id="' + id + 'b"></tbody></table></div>' + (ds.detail ? '<p class="hint">Tocca una riga per aprire i dettagli.</p>' : ''));
    var tb = document.getElementById(id + 'b'), cnt = document.getElementById(id + 'c'), root = tb.closest('.tw').previousElementSibling;
    var sortI = -1, asc = true, q = '', fl = {}, open = null;
    function draw() {
      var out = rows.filter(function (r) {
        for (var k in fl) { if (fl[k] !== '' && String(r[k]) !== fl[k]) return false; }
        return !q || ds.cols.some(function (c) { var v = r[c[0]]; return (Array.isArray(v) ? v.join(' ') : String(v)).toLowerCase().indexOf(q) >= 0; });
      });
      if (sortI >= 0) { var k = ds.cols[sortI][0]; out = out.slice().sort(function (a, b) { var x = a[k], y = b[k]; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * (asc ? 1 : -1); }); }
      var html = '';
      out.forEach(function (r, n) {
        html += '<tr' + (ds.detail ? ' class="exp" data-n="' + n + '"' : '') + '>' + ds.cols.map(function (c, i) { return '<td' + (typeof r[c[0]] === 'number' ? ' class="n"' : (String(r[c[0]]).length > 48 ? ' class="long"' : '')) + '>' + (i === 0 ? '<b>' + cell(r[c[0]], fmt[c[0]]) + '</b>' : cell(r[c[0]], fmt[c[0]])) + '</td>'; }).join('') + '</tr>';
        if (ds.detail && open === r.id + '|' + r.name) html += '<tr class="detail"><td colspan="' + ds.cols.length + '">' + ds.detail(r) + '</td></tr>';
      });
      tb.innerHTML = html || '<tr><td colspan="' + ds.cols.length + '" class="empty">Nessun risultato.</td></tr>';
      cnt.textContent = out.length + ' / ' + rows.length;
      tb._out = out;
    }
    root.querySelector('input').addEventListener('input', function (e) { q = e.target.value.toLowerCase(); draw(); });
    root.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', function () { fl[s.dataset.f] = s.value; draw(); }); });
    tb.addEventListener('click', function (e) {
      var tr = e.target.closest('tr.exp'); if (!tr) return;
      var r = tb._out[+tr.dataset.n], key = r.id + '|' + r.name; open = open === key ? null : key; draw();
    });
    tb.closest('.tw').querySelectorAll('th').forEach(function (th) {
      th.addEventListener('click', function () { var i = +th.dataset.i; asc = sortI === i ? !asc : true; sortI = i; tb.closest('.tw').querySelectorAll('th').forEach(function (x) { x.classList.remove('sorted', 'asc'); }); th.classList.add('sorted'); if (asc) th.classList.add('asc'); draw(); });
    });
    draw();
  }

  /* ---------- set: schede con pezzi e bonus ---------- */
  function setsView(mount) {
    mount.insertAdjacentHTML('beforeend', '<p class="intro">Indossa più pezzi dello stesso set per attivare i bonus: ogni gradino si somma al precedente. I pezzi del set si trovano in <a href="#/armature">Armature e gioielli</a>.</p><div class="cardgrid wide">' + (D.sets || []).map(function (s) {
      return '<div class="card" style="--cc:' + esc(s.color) + '"><h3>' + esc(s.name) + '</h3><div class="sub">' + esc(s.text) + '</div><div class="chips">' + (s.pieces || []).map(function (p) { return '<span class="chip">' + esc(p) + '</span>'; }).join('') + '</div>' +
        (s.bonuses || []).map(function (b) { return '<p><b class="g">' + b.pieces + ' pezzi · ' + esc(b.title) + '</b><br>' + list(b.effects) + '</p>'; }).join('') + '</div>';
    }).join('') + '</div>');
  }

  /* ---------- boss: schede con fasi, drop e pergamene ---------- */
  function bossesView(mount) {
    mount.insertAdjacentHTML('beforeend', '<p class="intro">Sette guardiani, uno per regno. Ognuno ha più fasi: a ogni fase aggiunge attacchi, tutti avvertiti da un bagliore o un\'ombra prima del colpo. Il Re Eterno è il boss finale e si apre solo con i sigilli degli altri guardiani.</p><div class="cardgrid wide">' + (D.bosses || []).map(function (b) {
      return '<div class="card" style="--cc:' + esc(b.color) + '"><h3>' + esc(b.name) + (b.final ? ' <span class="chip r">boss finale</span>' : '') + '</h3><div class="sub"><i>' + esc(b.epitaph) + '</i></div>' +
        chips([['Vita', b.health, 'r'], b.minion ? ['Servitori', b.minion, ''] : null]) +
        '<p><b class="g">Fasi</b></p><ol class="ph">' + (b.phases || []).map(function (f) { return '<li>' + list(f.attacks) + '</li>'; }).join('') + '</ol>' +
        '<p><b class="g">Bottino</b><br>' + [b.trophy ? 'Trofeo: ' + b.trophy : '', b.weaponTrophy ? 'Arma: ' + b.weaponTrophy : '', (b.scrolls && b.scrolls.length) ? 'Pergamena: ' + b.scrolls.join(', ') : '', b.blueprint ? 'Schema: ' + b.blueprint : '', b.page ? 'Pagina del diario: «' + b.page + '»' : ''].filter(Boolean).map(esc).join('<br>') + '</p></div>';
    }).join('') + '</div>');
  }

  /* ---------- tabelle incorporate nelle pagine scritte a mano ---------- */
  function simpleTable(head, rows) {
    return '<div class="tw"><table class="t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (typeof c === 'number' ? ' class="n"' : '') + '>' + (i === 0 ? '<b>' + c + '</b>' : c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  var EMBED = {
    mounts: function () {
      return simpleTable(['Cavalcatura', 'Vita', 'Velocità', 'Come si doma', 'Caratteristica'], (D.mobs || []).filter(function (m) { return m.mount; }).map(function (m) {
        return [esc(m.name), m.health, m.speed, Math.round(m.tame * 100) + '% a tentativo', esc(m.mountHint || '—')];
      }));
    },
    domains: function () {
      var rows = (D.spells || []).filter(function (s) { return s.kind === 'DOMAIN'; }).map(function (s) {
        var b = (D.bosses || []).filter(function (x) { return (x.scrolls || []).indexOf(s.name) >= 0; })[0];
        return [esc(s.name.replace('Dominio: ', '')), s.level, s.attrName + ' ' + s.attribute, s.mana + ' / ' + s.stamina, s.cooldown + ' s', s.duration + ' s', s.radius, b ? esc(b.name) : '—'];
      });
      return simpleTable(['Dominio', 'Livello', 'Requisito', 'Mana / Stamina', 'Recupero', 'Durata', 'Raggio', 'Pergamena dal boss'], rows);
    },
    npcs: function () {
      return simpleTable(['Mestiere', 'Cosa fa', 'Commercia', 'Dà missioni'], (D.npcs || []).map(function (n) { return [esc(n.name), esc(n.text), n.trades ? 'sì' : '—', n.quests ? 'sì' : '—']; }));
    },
    temper: function () {
      return simpleTable(['Livello', 'Frammenti', 'Danno', 'Usura'], (D.temper || []).map(function (t) { return ['+' + t.from + ' → +' + t.to, t.shards, '+' + Math.round((t.damage - 1) * 100) + '%', '×' + t.wear]; }));
    },
    arts: function () {
      return simpleTable(['Arte', 'Cos\'è'], (D.arts || []).map(function (a) { return [esc(a.name), esc(a.text)]; }));
    }
  };

  function guideSection(title) {
    var p = by(D.guide, 'title', title);
    if (!p) return '';
    return p.sections.map(function (s) {
      var rows = (s.rows && s.rows.length) ? '<dl class="kv">' + s.rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' : '';
      return '<h3>' + esc(s.heading) + '</h3>' + rows + (s.text ? '<p>' + esc(s.text) + '</p>' : '');
    }).join('');
  }
  function guide() {
    doc.innerHTML = '<h1>Guida del gioco</h1><p class="intro">Le pagine della guida che si apre in gioco con F1, copiate così come sono.</p>' + D.guide.map(function (p) { return '<h2>' + esc(p.title) + '</h2>' + guideSection(p.title); }).join('');
  }
  function page(key) {
    var pg = P[key];
    doc.innerHTML = '<h1>' + pg.title + '</h1>' + pg.html;
    doc.querySelectorAll('[data-guide]').forEach(function (el) { el.outerHTML = guideSection(el.getAttribute('data-guide')); });
    doc.querySelectorAll('[data-table]').forEach(function (el) { var f = EMBED[el.getAttribute('data-table')]; if (f) el.outerHTML = f(); });
  }

  function home() {
    var cards = Object.keys(DATASETS).map(function (k) { var d = DATASETS[k]; var n = d.data ? (D[d.data] || []).length : (D[d.view === 'sets' ? 'sets' : 'bosses'] || []).length; return '<a class="card" href="#/' + k + '"><h3>' + d.title + '</h3><div class="sub">' + n + ' voci</div></a>'; }).join('');
    var feat = [['per-iniziare', 'Per iniziare', 'i primi dieci minuti'], ['controlli', 'Controlli', 'tutti i tasti'], ['sopravvivenza', 'Guida alla sopravvivenza', 'fame, schemi, tomba'], ['magia', 'Guida alla magia', 'scuole, mana, maestria'], ['domini', 'I sei Domini', 'le mosse definitive'], ['combattimento', 'Combattimento', 'parate e schivate'], ['villaggi', 'Villaggi e missioni', 'mestieri, prezzi, reputazione'], ['eredita', 'Eredità', 'il regno si risveglia'], ['faq', 'Domande frequenti', 'problemi e trucchi'], ['console', 'Console e comandi', 'strumenti di prova']];
    doc.innerHTML = '<h1>Wiki di Voxel World</h1><p class="intro">Tutto quello che c\'è nel gioco, con i numeri veri (esportati dal gioco stesso, versione 0.3.1 beta). Usa l\'indice a sinistra o la ricerca in alto.</p>' +
      '<h2>Guide</h2><div class="cardgrid">' + feat.map(function (f) { return '<a class="card" href="#/' + f[0] + '"><h3>' + f[1] + '</h3><div class="sub">' + f[2] + '</div></a>'; }).join('') + '</div>' +
      '<h2>Tutti i dati</h2><div class="cardgrid">' + cards + '</div>';
  }

  function strip(h) { return String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '); }
  function search(q) {
    var s = q.toLowerCase(), out = '';
    var pages = Object.keys(P).filter(function (k) { return (P[k].title + ' ' + strip(P[k].html)).toLowerCase().indexOf(s) >= 0; });
    if (pages.length) out += '<h2>Pagine (' + pages.length + ')</h2><ul>' + pages.map(function (k) { return '<li><a href="#/' + k + '">' + esc(P[k].title) + '</a></li>'; }).join('') + '</ul>';
    Object.keys(DATASETS).forEach(function (k) {
      var ds = DATASETS[k], src = ds.data || (ds.view === 'sets' ? 'sets' : 'bosses');
      var hits = (D[src] || []).filter(function (r) { return String(r.name || r.title || '').toLowerCase().indexOf(s) >= 0 || String(r.text || '').toLowerCase().indexOf(s) >= 0 || String(r.lore || '').toLowerCase().indexOf(s) >= 0; });
      if (hits.length) out += '<h2>' + ds.title + ' (' + hits.length + ')</h2><ul>' + hits.slice(0, 12).map(function (r) { return '<li><a href="#/' + k + '">' + esc(r.name) + '<small>' + esc(String(r.text || r.school || r.type || r.lore || '').slice(0, 70)) + '</small></a></li>'; }).join('') + '</ul>';
    });
    doc.innerHTML = '<div class="results"><h1>Cerca: «' + esc(q) + '»</h1>' + (out || '<p class="empty">Nessun risultato.</p>') + '</div>';
  }

  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/'), key = h[0] || 'home', title = 'Wiki';
    document.body.classList.remove('menu-open');
    renderNav(key);
    if (key === 'cerca') search(decodeURIComponent(h.slice(1).join('/')));
    else if (key === 'home') home();
    else if (key === 'guida') { guide(); title = 'Guida del gioco'; }
    else if (DATASETS[key]) {
      var ds = DATASETS[key]; title = ds.title;
      doc.innerHTML = '<h1>' + ds.title + '</h1>' + (P[key] ? '<div class="pre">' + P[key].html + '</div>' : '');
      if (ds.view === 'sets') setsView(doc); else if (ds.view === 'bosses') bossesView(doc); else table(ds, doc);
    } else if (P[key]) { page(key); title = P[key].title; }
    else home();
    document.title = (title === 'Wiki' ? '' : title + ' · ') + 'Wiki · Voxel World';
    window.scrollTo(0, 0);
  }
  document.getElementById('menuBtn').addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
  document.getElementById('searchForm').addEventListener('submit', function (e) { e.preventDefault(); var v = document.getElementById('search').value.trim(); if (v) location.hash = '#/cerca/' + encodeURIComponent(v); });
  window.addEventListener('hashchange', route);
  route();
})();
