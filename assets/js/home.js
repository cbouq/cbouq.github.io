(function () {
  'use strict';
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 30); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var burger = document.getElementById('burger');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('#menu a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

  // 3D lettering: the game's title and the CBOUQ tag
  if (window.VoxelText) {
    var t = document.getElementById('title3d');
    if (t) window.VoxelText(t, { text: 'VOXEL WORLD', plate: false });
    var g = document.getElementById('tag3d');
    if (g) window.VoxelText(g, { text: 'CBOUQ', plate: true });
  }

  // reveal on scroll
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // count up the numbers
  var stats = document.querySelectorAll('.stat b');
  function count(el) {
    var n = +el.dataset.n, t0 = performance.now(), d = 900;
    (function step(now) { var p = Math.min(1, (now - t0) / d); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { count(e.target); so.unobserve(e.target); } }); });
    stats.forEach(function (s) { so.observe(s); });
  } else { stats.forEach(function (s) { s.textContent = s.dataset.n; }); }

  // domain tabs
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (x) { x.setAttribute('aria-selected', x === tab ? 'true' : 'false'); });
      document.querySelectorAll('.dom').forEach(function (d) { d.classList.toggle('on', d.id === tab.dataset.target); });
    });
  });

  // gallery + lightbox
  var items = [
    ['village-day', 'Il mercato di un villaggio, con l\'eroe in terza persona'],
    ['void-ritual', 'Il rito: l\'eroe si alza in volo prima del dominio'],
    ['village-air', 'Un villaggio visto dall\'alto'],
    ['shrine-red', 'Santuario Malevolo: il cielo si tinge di rosso'],
    ['ui-smith', 'Il fabbro tempra le armi con i Frammenti d\'Eredità'],
    ['biome-enchanted', 'Foresta incantata'],
    ['dark-vs-classic', 'Texture classiche e texture scure, nello stesso posto'],
    ['fp-sword', 'La spada del Drago, in prima persona'],
    ['ui-market', 'Il mercato: compri e vendi con le monete'],
    ['void-lights', 'Vuoto Infinito: le luci'],
    ['ores-wall', 'I minerali nuovi, uno accanto all\'altro'],
    ['dojo', 'Un dojo tra i ciliegi'],
    ['ui-quests', 'Un anziano ti affida le missioni'],
    ['ui-grimoire', 'Il Grimorio: da studiare e maestria'],
    ['citadel', 'La Cittadella del Re Eterno'],
    ['ui-legacy', 'L\'Anziano può risvegliare il regno: l\'Eredità'],
    ['shrine-slashes', 'La tempesta di tagli'],
    ['place-card', 'Il cartello del luogo, in stile film'],
    ['biome-plains', 'Pianure, con la terza persona a un tasto'],
    ['ui-craft-weapons', 'L\'Artigiano con la ricerca e i filtri per le 112 armi'],
    ['fp-staff', 'La staffa di cristallo'],
    ['ui-sets', 'I set d\'armatura e i loro bonus'],
    ['menu-void', 'Il menu: un dominio al rallentatore'],
    ['pyramid', 'Regno abbandonato nel deserto'],
    ['biome-mountain', 'Montagne e nuvole'],
    ['ui-diary', 'Il diario di Eldrin'],
    ['biome-savanna', 'Savana'],
    ['ui-hud-cold', 'Il freddo: il termometro e la tomba'],
    ['hero-ritual', 'L\'eroe e il guardiano'],
    ['ui-imprese', 'Le Imprese']
  ];

  var gal = document.getElementById('gallery');
  items.forEach(function (it) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', 'Ingrandisci: ' + it[1]);
    b.innerHTML = '<img loading="lazy" src="assets/img/' + it[0] + '.webp" alt="' + it[1] + '" width="1600" height="900"><span>' + it[1] + '</span>';
    b.addEventListener('click', function () { open(it); });
    gal.appendChild(b);
  });
  var lb = document.getElementById('lightbox'), lbimg = document.getElementById('lbimg'), lbcap = document.getElementById('lbcap'), lastFocus;
  function open(it) { lastFocus = document.activeElement; lbimg.src = 'assets/img/' + it[0] + '.webp'; lbimg.alt = it[1]; lbcap.textContent = it[1]; lb.classList.add('on'); document.getElementById('lbx').focus(); }
  function close() { lb.classList.remove('on'); if (lastFocus) lastFocus.focus(); }
  document.getElementById('lbx').addEventListener('click', close);
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
