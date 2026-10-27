/* La sezione "Scarica": legge downloads/releases.json (scritto da packaging/manifest.py) e mostra il file giusto per il sistema di chi guarda. */
(function () {
  'use strict';
  var cta = document.getElementById('dl-cta'), cards = document.getElementById('dl-os'), sha = document.getElementById('dl-sha');
  if (!cta || !cards) return;
  var NAMES = { mac: 'macOS', win: 'Windows', linux: 'Linux' };
  var STEPS = {
    mac: ['Apri il file <code>.dmg</code> e trascina <b>Voxel World</b> in Applicazioni.',
      'La prima volta macOS dice che non può verificare lo sviluppatore (il gioco non ha un certificato a pagamento): apri <b>Impostazioni di Sistema → Privacy e sicurezza</b> e premi <b>Apri comunque</b> (su macOS 14 e precedenti basta clic destro → Apri).',
      'Se compare «danneggiato», apri il Terminale e scrivi: <code>xattr -dr com.apple.quarantine "/Applications/Voxel World.app"</code>'],
    win: ['Estrai tutto lo <code>.zip</code> dove vuoi (anche sul desktop).',
      'Doppio clic su <code>VoxelWorld.vbs</code>. Se Windows avvisa, scegli <b>Maggiori informazioni → Esegui comunque</b>.',
      'Per un collegamento: clic destro su <code>VoxelWorld.vbs</code> → Invia a → Desktop.'],
    linux: ['Estrai: <code>tar xzf VoxelWorld-*-linux-x64.tar.gz</code>',
      'Per giocare subito: <code>cd VoxelWorld &amp;&amp; ./bin/voxelworld</code>',
      'Per averlo nel menu delle applicazioni: <code>./install.sh</code>']
  };
  // from the version with the launcher (0.3.2) the packages install themselves and the game offers a desktop shortcut
  var STEPS_NEW = {
    mac: ['Apri il file <code>.dmg</code> e trascina <b>Voxel World</b> in Applicazioni, poi espelli il disco.',
      'Aprilo da Launchpad. La prima volta macOS dice che non può verificare lo sviluppatore (il gioco non ha un certificato a pagamento): apri <b>Impostazioni di Sistema → Privacy e sicurezza</b> e premi <b>Apri comunque</b>.',
      'Il gioco ti propone un collegamento sul desktop: un clic e basta. Se compare «danneggiato»: <code>xattr -dr com.apple.quarantine "/Applications/Voxel World.app"</code>'],
    win: ['Estrai tutto lo <code>.zip</code> dove vuoi.',
      'Doppio clic su <code>Installa Voxel World.vbs</code>: lo installa, crea il collegamento sul desktop e nel menu Start e lo avvia. Se Windows avvisa, scegli <b>Maggiori informazioni → Esegui comunque</b>.',
      'Da lì basta l\'icona. Per toglierlo: <code>Disinstalla Voxel World.vbs</code> (i mondi restano).'],
    linux: ['Estrai: <code>tar xzf VoxelWorld-*-linux-x64.tar.gz</code>',
      'Installa e gioca: <code>cd VoxelWorld &amp;&amp; ./install.sh</code> (menu delle applicazioni, desktop e avvio).',
      'Senza installare: <code>./bin/voxelworld</code>. Per toglierlo: <code>./uninstall.sh</code> (i mondi restano).']
  };
  function newerThan(v, a, b, c) { var m = /(\d+)\.(\d+)\.?(\d*)/.exec(v || ''); if (!m) return false; var n = (+m[1] * 1000 + +m[2]) * 1000 + (+m[3] || 0); return n >= (a * 1000 + b) * 1000 + c; }
  function mb(n) { return n >= 1e8 ? Math.round(n / 1e6) + ' MB' : (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' MB'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ua = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
  var mine = /mac|iphone|ipad/i.test(ua) ? 'mac' : /win/i.test(ua) ? 'win' : /linux|x11|cros/i.test(ua) ? 'linux' : '';
  if (/android|iphone|ipad/i.test(navigator.userAgent || '')) mine = 'phone';

  function render(rel) {
    var files = rel.files || [];
    if (newerThan(rel.version, 0, 3, 2)) STEPS = STEPS_NEW;
    var by = function (os) { return files.filter(function (f) { return f.os === os; }); };
    var inst = ['mac', 'win', 'linux'];
    // the main button: the installer of this system (on a Mac, the one for its chip when the browser tells)
    var primary = null;
    function pick(list, arch) { return list.filter(function (f) { return f.arch === arch; })[0] || list[0]; }
    function showPrimary(arch) {
      var p = mine && mine !== 'phone' ? pick(by(mine), arch) : null;
      if (p) {
        cta.innerHTML = '<a class="btn" href="' + esc(p.url) + '" download>Scarica per ' + NAMES[mine] + ' · ' + mb(p.size) + '</a><a class="btn ghost" href="#dl-os">Altri sistemi</a>';
        sha.textContent = 'SHA-256 di ' + p.name + ': ' + p.sha256;
      } else if (mine === 'phone') {
        cta.innerHTML = '<a class="btn ghost" href="#dl-os">Il gioco è per computer: scegli il sistema</a>';
        sha.textContent = '';
      } else {
        cta.innerHTML = '<a class="btn" href="#dl-os">Scegli il tuo sistema</a>';
        sha.textContent = '';
      }
    }
    showPrimary('arm64');
    if (mine === 'mac' && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      navigator.userAgentData.getHighEntropyValues(['architecture']).then(function (v) { showPrimary(v.architecture === 'x86' ? 'x64' : 'arm64'); }).catch(function () {});
    }
    // one card per system, then the one for who has Java already
    var html = inst.map(function (os) {
      var list = by(os);
      var items = list.length ? list.map(function (f) { return '<a class="btn sm' + (os === mine ? '' : ' ghost') + '" href="' + esc(f.url) + '" download>' + esc(f.label) + ' · ' + mb(f.size) + '</a>'; }).join('') : '<p class="soon">In preparazione: per ora usa il pacchetto con Java qui a destra.</p>';
      return '<article data-os="' + os + '"' + (os === mine ? ' class="mine"' : '') + '><h4>' + NAMES[os] + (os === mine ? ' <span class="badge">il tuo</span>' : '') + '</h4><div class="dl-files">' + items + '</div><ol>' + STEPS[os].map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></article>';
    }).join('');
    var java = files.filter(function (f) { return f.os === 'any'; });
    html += '<article data-os="any"><h4>Con Java già installato</h4><div class="dl-files">' + java.map(function (f) { return '<a class="btn sm ghost" href="' + esc(f.url) + '" download>' + esc(f.label) + ' · ' + mb(f.size) + '</a>'; }).join('') + '</div><ol><li>Serve <a href="https://adoptium.net" target="_blank" rel="noopener">Java 17 o più recente</a>.</li><li>Estrai lo zip e avvia <code>avvia.command</code> (Mac), <code>avvia.bat</code> (Windows) o <code>avvia.sh</code> (Linux): oppure doppio clic sul <code>.jar</code>.</li></ol></article>';
    cards.innerHTML = html;
    cards.querySelectorAll('article').forEach(function (a) { a.classList.add('rv', 'in'); });
    var shaList = document.getElementById('dl-sums');
    if (shaList) shaList.innerHTML = files.map(function (f) { return '<div><b>' + esc(f.name) + '</b><span>' + f.sha256 + '</span></div>'; }).join('');
  }
  fetch('downloads/releases.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(render).catch(function () {
    cta.innerHTML = '<a class="btn ghost" href="novita.html">I download non sono raggiungibili ora: riprova tra poco</a>';
  });
})();
