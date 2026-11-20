/* Lifeline live demo: a browser simulation of Lifeline's raid frames. */
(function () {
  'use strict';

  var CLASS_COLOR = { Warrior: '#C69B6D', Priest: '#FFFFFF', Rogue: '#FFF468', Mage: '#3FC7EB', Hunter: '#AAD372', Paladin: '#F48CBA', Druid: '#FF7C0A', Warlock: '#8788EE', Shaman: '#0070DD' };
  var DEBUFF_COLOR = { Magic: '#3B82F6', Curse: '#A855F7', Poison: '#22C55E', Disease: '#EAB308' };
  var POWER_COLOR = { Warrior: '#C81E1E', Rogue: '#E5C51A' };
  var MANA_USERS = ['Priest', 'Mage', 'Warlock', 'Paladin', 'Druid', 'Shaman', 'Hunter'];
  var SIZE = { party: [110, 52], '10': [104, 50], '20': [98, 46], '40': [88, 42] };
  var COUNT = { party: 5, '10': 10, '20': 20, '40': 40 };

  var framesEl = document.getElementById('frames');
  var legendEl = document.getElementById('legend');
  var runBtn = document.getElementById('run');
  if (!framesEl) return;

  var state = { layout: '20', orient: 'vertical', color: 'class', dispel: true, range: true, buffs: true, absorbs: true, banners: true, running: true };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) state.running = false;

  function r(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  var units = (function () {
    var classes = ['Warrior', 'Priest', 'Rogue', 'Mage', 'Hunter', 'Paladin', 'Druid', 'Warlock', 'Shaman'];
    var a = ['Ar', 'Bel', 'Cor', 'Dra', 'El', 'Fen', 'Gar', 'Hal', 'Ise', 'Jor', 'Kae', 'Lun', 'Mor', 'Nym', 'Ost', 'Pyr', 'Quel', 'Ras', 'Syl', 'Tor'];
    var b = ['ric', 'wyn', 'dan', 'ena', 'mir', 'thas', 'ora', 'vek', 'ith', 'gan'];
    var list = [];
    for (var i = 0; i < 40; i++) {
      list.push({
        name: a[(i * 7) % 20] + b[(i * 3) % 10], cls: classes[(i * 5 + Math.floor(i / 9)) % 9],
        hp: r(60, 100), power: r(50, 100), inc: 0, abs: 0, dead: false, deadTicks: 0,
        debuff: null, far: false, missing: i % 7 === 3, banner: null, bannerTicks: 0, afk: i === 13
      });
    }
    return list;
  })();

  var nodes = [];

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function build() {
    framesEl.innerHTML = '';
    framesEl.className = 'frames' + (state.orient === 'horizontal' ? ' horizontal' : '');
    nodes = [];
    var n = COUNT[state.layout];
    var size = SIZE[state.layout];
    for (var g = 0; g < n / 5; g++) {
      var group = el('div', 'group', framesEl);
      el('span', 'group-label', group).textContent = state.layout === 'party' ? 'Party' : 'Group ' + (g + 1);
      var list = el('div', 'units', group);
      for (var k = 0; k < 5; k++) {
        var u = el('div', 'unit', list);
        u.style.width = size[0] + 'px';
        u.style.height = size[1] + 'px';
        var node = {
          root: u,
          fill: el('div', 'fill', u),
          heal: el('div', 'heal', u),
          absorb: el('div', 'absorb', u),
          txt: el('div', 'txt', u),
          banner: el('div', 'banner', u),
          power: el('div', 'power', u),
          buff: el('span', 'buff', u),
          deb: el('span', 'deb', u)
        };
        node.nm = el('span', 'nm', node.txt);
        node.val = el('span', 'val', node.txt);
        node.buff.title = 'Missing buff';
        nodes.push(node);
      }
    }
    paint();
  }

  function paint() {
    var n = COUNT[state.layout];
    for (var i = 0; i < n; i++) {
      var u = units[i], d = nodes[i];
      if (!d) continue;
      var cc = CLASS_COLOR[u.cls];
      var base = state.color === 'class' ? cc : (state.color === 'dark' ? '#2F3A45' : '#15803D');
      var hasDebuff = state.dispel && !!u.debuff;
      var bar = hasDebuff ? DEBUFF_COLOR[u.debuff] : base;
      var inc = state.absorbs && !u.dead ? Math.min(u.inc, 100 - u.hp) : 0;
      var pct = Math.round(u.hp) + '%';

      d.root.classList.toggle('dead', u.dead);
      d.root.style.border = hasDebuff ? '2px solid ' + DEBUFF_COLOR[u.debuff] : '1px solid #000';
      d.root.style.opacity = state.range && u.far ? '0.45' : '1';
      d.fill.style.width = (u.dead ? 0 : u.hp) + '%';
      d.fill.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(0,0,0,0.22)), ' + bar;
      d.heal.style.left = u.hp + '%';
      d.heal.style.width = inc + '%';
      d.heal.style.background = bar;
      d.absorb.style.width = (state.absorbs && !u.dead ? u.abs : 0) + '%';
      d.power.style.width = (u.dead ? 0 : u.power) + '%';
      d.power.style.background = POWER_COLOR[u.cls] || '#1D4ED8';
      d.nm.textContent = u.name;
      d.nm.style.color = state.color === 'dark' ? cc : '#FFFFFF';
      d.nm.style.fontSize = (state.layout === '40' ? 11 : 12) + 'px';
      d.val.textContent = u.dead ? 'DEAD ' + Math.floor(u.deadTicks / 60) + ':' + String(u.deadTicks % 60).padStart(2, '0') : (u.afk ? 'AFK ' + pct : pct);
      var banner = state.banners && u.banner ? u.banner : '';
      d.banner.textContent = banner;
      d.banner.style.display = banner ? 'block' : 'none';
      d.buff.style.display = state.buffs && u.missing && !u.dead ? 'block' : 'none';
      d.deb.style.display = hasDebuff ? 'block' : 'none';
      d.deb.textContent = u.debuff ? u.debuff.charAt(0) : '';
      d.deb.style.background = u.debuff ? DEBUFF_COLOR[u.debuff] : 'transparent';
    }
  }

  function tick() {
    if (!state.running) return;
    var n = COUNT[state.layout];
    var types = ['Magic', 'Curse', 'Poison', 'Disease'];
    for (var i = 0; i < n; i++) {
      var v = units[i];
      if (v.dead) {
        v.deadTicks += 1;
        if (v.deadTicks > 14) { v.dead = false; v.deadTicks = 0; v.hp = 35; }
        continue;
      }
      if (Math.random() < 0.35) v.hp -= r(4, 22);
      if (Math.random() < 0.45) v.hp += r(6, 18);
      v.inc = Math.random() < 0.3 ? r(6, 20) : 0;
      v.abs = Math.random() < 0.05 ? r(12, 30) : Math.max(0, v.abs - 4);
      if (v.hp > 100) v.hp = 100;
      if (v.hp <= 0) {
        if (Math.random() < 0.5) { v.hp = 0; v.dead = true; v.debuff = null; v.banner = null; continue; }
        v.hp = 6;
      }
      var mana = MANA_USERS.indexOf(v.cls) >= 0;
      v.power = Math.max(0, Math.min(100, v.power + (mana ? r(-6, 3) : r(-15, 15))));
      if (v.banner) {
        v.bannerTicks -= 1;
        if (v.banner === 'DRINKING') v.power = Math.min(100, v.power + 12);
        if (v.bannerTicks <= 0) v.banner = null;
      } else if (Math.random() < 0.02) {
        var opts = ["CC'D"];
        if (v.cls === 'Mage') opts.push('ICE BLOCK');
        if (mana && v.power < 40) opts.push('DRINKING', 'DRINKING');
        v.banner = opts[r(0, opts.length - 1)];
        v.bannerTicks = v.banner === 'DRINKING' ? 8 : r(3, 5);
      }
      if (!v.debuff && Math.random() < 0.035) v.debuff = types[r(0, 3)];
      else if (v.debuff && Math.random() < 0.2) v.debuff = null;
      if (Math.random() < 0.025) v.far = !v.far;
      if (Math.random() < 0.015) v.missing = !v.missing;
    }
    paint();
  }

  function legend() {
    var html = '';
    if (state.dispel) ['Magic', 'Curse', 'Poison', 'Disease'].forEach(function (t) { html += '<span><i style="background:' + DEBUFF_COLOR[t] + '"></i>' + t + '</span>'; });
    if (state.buffs) html += '<span><i style="width:10px;height:10px;border-radius:2px;background:#FCD34D;border:1px solid #000"></i>Missing buff</span>';
    if (state.absorbs) html += '<span><i style="width:14px;height:4px;border-radius:0;background:#E5E7EB"></i>Absorb shield</span>';
    legendEl.innerHTML = html;
  }

  function syncControls() {
    document.querySelectorAll('.seg[data-key]').forEach(function (seg) {
      var key = seg.getAttribute('data-key');
      seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state[key])); });
    });
    document.querySelectorAll('[data-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!state[b.getAttribute('data-toggle')])); });
    runBtn.textContent = state.running ? 'Pause fight' : 'Resume fight';
    legend();
  }

  document.querySelectorAll('.seg[data-key]').forEach(function (seg) {
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var key = seg.getAttribute('data-key');
      state[key] = b.getAttribute('data-v');
      syncControls();
      if (key === 'layout' || key === 'orient') build(); else paint();
    });
  });
  document.querySelectorAll('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-toggle');
      state[key] = !state[key];
      syncControls();
      paint();
    });
  });
  runBtn.addEventListener('click', function () { state.running = !state.running; syncControls(); });

  syncControls();
  build();
  setInterval(tick, 650);
})();
