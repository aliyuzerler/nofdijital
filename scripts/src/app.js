/* ============================================================
   NOF DİJİTAL — Uygulama Mantığı (vanilla JS)
   ============================================================ */
document.documentElement.classList.add('js');
(() => {
'use strict';

const IMG = window.__NOF_IMG__ || {};
const DATA = window.__NOF_DATA__ || {};
const { PROJECTS, SCENES, POSTS, CATS, SERVICES } = DATA;

/* ---- WhatsApp numarası buraya girilecek (boş bırakılırsa uyarı gösterilir) ---- */
const CFG = {
  whatsappNumber: '',            // ör: '905xxxxxxxxx'
  whatsappText: 'Merhaba, projemiz için görüşmek istiyoruz.',
};

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const PRM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 820px)');

/* mulberry32 – deterministik rastgele üretici */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Toast ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ============================================================
   0) TEMA — koyu/açık, kullanıcı seçimi (localStorage'da saklanır)
   ============================================================ */
const THEME_KEY = 'nof-theme';
function applyTheme(t, animate) {
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#15131B' : '#F7F6FA');
  $$('[data-theme-toggle]').forEach(b => {
    const lbl = t === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç';
    b.setAttribute('aria-label', lbl);
    b.setAttribute('title', lbl);
  });
  if (animate && !PRM) {
    document.documentElement.classList.add('th-anim');
    setTimeout(() => document.documentElement.classList.remove('th-anim'), 430);
  }
}
function initTheme() {
  let t = 'light';
  try { if (localStorage.getItem(THEME_KEY) === 'dark') t = 'dark'; } catch (e) {}
  applyTheme(t, false);
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    applyTheme(next, true);
    document.dispatchEvent(new CustomEvent('nof:theme', { detail: next }));
  }));
}
initTheme();

/* ============================================================
   1) HEADER + MOBİL MENÜ
   ============================================================ */
const hdr = $('#hdr');
const burger = $('#burger');
const mmenu = $('#mmenu');

function onHdrScroll() { hdr.classList.toggle('sc', scrollY > 26); }
addEventListener('scroll', onHdrScroll, { passive: true });
onHdrScroll();

function menuToggle(open) {
  const willOpen = open != null ? open : !mmenu.classList.contains('open');
  mmenu.classList.toggle('open', willOpen);
  burger.classList.toggle('open', willOpen);
  burger.setAttribute('aria-expanded', String(willOpen));
  mmenu.setAttribute('aria-hidden', String(!willOpen));
  document.body.style.overflow = willOpen ? 'hidden' : '';
}
burger.addEventListener('click', () => menuToggle());
$$('#mmenu a').forEach(a => a.addEventListener('click', () => menuToggle(false)));

/* Scrollspy (ana sayfa bölümleri) */
const spyMap = { anasayfa: 'anasayfa', hizmetler: 'hizmetler', calismalar: 'calismalar', hakkimizda: 'hakkimizda', surec: 'hakkimizda', blog: 'blog', iletisim: 'iletisim' };
const spyIO = new IntersectionObserver(entries => {
  if (document.body.dataset.view !== 'home') return;
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = spyMap[e.target.id] || e.target.id;
      $$('#navList a').forEach(a => a.classList.toggle('act', a.dataset.spy === id || (a.dataset.route === 'blog' && id === 'blog')));
    }
  });
}, { rootMargin: '-42% 0px -52% 0px' });
['anasayfa', 'hizmetler', 'calismalar', 'hakkimizda', 'surec', 'blog', 'iletisim'].forEach(id => {
  const el = document.getElementById(id);
  if (el) spyIO.observe(el);
});

/* ============================================================
   2) REVEAL + SAYAÇLAR + SÜREÇ
   ============================================================ */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in-view');
    if (e.target.hasAttribute('data-count')) runCounter(e.target);
    revealIO.unobserve(e.target);
  });
}, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal], [data-count], [data-bars]').forEach(el => revealIO.observe(el));

function runCounter(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  if (PRM) { el.textContent = target; return; }
  const t0 = performance.now(), dur = 1200;
  (function tick(t) {
    const p = clamp((t - t0) / dur, 0, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* Süreç adımları + ilerleme çizgisi */
const steps = $$('#steps [data-step]');
const stepsFill = $('#stepsFill');
if (steps.length) {
  const stepIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('act'); });
  }, { rootMargin: '0px 0px -38% 0px' });
  steps.forEach(s => stepIO.observe(s));
}
function onStepsScroll() {
  if (!stepsFill) return;
  const box = $('#steps');
  const r = box.getBoundingClientRect();
  const vh = innerHeight;
  const p = clamp((vh * .62 - r.top) / r.height, 0, 1);
  stepsFill.style.height = (p * (r.height - 44)) + 'px';
}
addEventListener('scroll', onStepsScroll, { passive: true });
onStepsScroll();

/* ============================================================
   3) ÇALIŞMALARIMIZ — SCROLL GALERİ MOTORU
   ============================================================ */
const Works = (() => {
  const stage = $('#wstage'), track = $('#wtrack');
  const sticky = $('.wsticky'), view = $('.wview');
  const sceneEls = $$('.wscene');
  if (!stage || !track || sceneEls.length !== 3) return { flat: () => [] };

  const SEEDS = [12345 + Math.floor(Math.random() * 9000), 54321 + Math.floor(Math.random() * 9000), 999 + Math.floor(Math.random() * 9000)];
  let flat = [];
  let vw = 0, sw = 0, trackW = 0, active = false, lastX = -1, mobile = isMobile.matches;

  const COLS_D = [[.34, .24, .26, .16], [.26, .30, .24, .20], [.22, .30, .28, .20]];
  const ROWS_D = [[.40, .34, .26], [.30, .42, .28], [.36, .28, .36]];
  const COLS_M = [[.42, .34, .24], [.36, .40, .24], [.30, .42, .28]];
  const ROWS_M = [[.30, .26, .24, .20], [.24, .30, .26, .20], [.28, .24, .28, .20]];

  function layoutScene(el, si, H) {
    el.innerHTML = '';
    const W = el.offsetWidth;
    const rng = mulberry32(SEEDS[si]);
    const mob = W > H * 1.1; // sahne genişse masaüstü mantığı
    const mX = Math.max(16, W * .036), mT = H * .055, mB = H * .135;
    const iw = W - mX * 2, ih = H - mT - mB;

    /* Hücre ızgarası: düzensiz sütun/satır bölünmeleri */
    const cols = (mob ? COLS_D : COLS_M)[si].slice();
    const rows = (mob ? ROWS_D : ROWS_M)[si].slice();
    /* kontrolsüz shuffle */
    for (let i = cols.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [cols[i], cols[j]] = [cols[j], cols[i]]; }
    for (let i = rows.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [rows[i], rows[j]] = [rows[j], rows[i]]; }
    const cxs = []; let acc = 0; cols.forEach(c => { cxs.push(acc); acc += c; });
    const rys = []; acc = 0; rows.forEach(r => { rys.push(acc); acc += r; });

    const cells = [];
    for (let r = 0; r < rows.length; r++)
      for (let c = 0; c < cols.length; c++)
        cells.push({ x: mX + cxs[c] * iw, y: mT + rys[r] * ih, w: cols[c] * iw, h: rows[r] * ih, r, c });
    /* shuffle */
    for (let i = cells.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; }

    /* 7 hücre seç: satır/sütun dağılımını koru, aşırı yığılmayı engelle */
    const maxPerRow = 3, maxPerCol = cols.length; // satır bazında sınır yeterli
    const rowCnt = {}, colCnt = {};
    const picked = [];
    for (const cell of cells) {
      if (picked.length >= 7) break;
      if ((rowCnt[cell.r] || 0) >= maxPerRow) continue;
      if ((colCnt[cell.c] || 0) >= maxPerCol) continue;
      picked.push(cell);
      rowCnt[cell.r] = (rowCnt[cell.r] || 0) + 1;
      colCnt[cell.c] = (colCnt[cell.c] || 0) + 1;
    }
    /* yedek: kısıtları gevşet */
    for (const cell of cells) {
      if (picked.length >= 7) break;
      if (!picked.includes(cell)) picked.push(cell);
    }
    /* kapsama: her kolon ve her satır en az 1 görsel içersin (boş kuşak olmasın) */
    for (let c = 0; c < cols.length; c++) {
      if (!(colCnt[c] > 0)) {
        const donors = picked.filter(pc => (colCnt[pc.c] || 0) >= 2);
        if (donors.length) {
          const d = donors[(rng() * donors.length) | 0];
          picked.splice(picked.indexOf(d), 1);
          colCnt[d.c]--;
          const cand = cells.filter(cell => cell.c === c && !picked.includes(cell));
          const n = cand[(rng() * cand.length) | 0];
          picked.push(n); colCnt[c] = 1;
          rowCnt[n.r] = (rowCnt[n.r] || 0) + 1;
          rowCnt[d.r] = Math.max(0, (rowCnt[d.r] || 1) - 1);
        }
      }
    }
    for (let r = 0; r < rows.length; r++) {
      if (!(rowCnt[r] > 0)) {
        const donors = picked.filter(pc => (rowCnt[pc.r] || 0) >= 2);
        if (donors.length) {
          const d = donors[(rng() * donors.length) | 0];
          picked.splice(picked.indexOf(d), 1);
          rowCnt[d.r]--;
          const cand = cells.filter(cell => cell.r === r && !picked.includes(cell));
          const n = cand[(rng() * cand.length) | 0];
          picked.push(n); rowCnt[r] = 1;
          colCnt[n.c] = (colCnt[n.c] || 0) + 1;
          colCnt[d.c] = Math.max(0, (colCnt[d.c] || 1) - 1);
        }
      }
    }

    SCENES[si].forEach((id, k) => {
      const cell = picked[k];
      const meta = PROJECTS[id];
      const pad = .10 + rng() * .07;
      const w = cell.w * (1 - pad), h = cell.h * (1 - pad);
      const x = cell.x + rng() * (cell.w - w);
      const y = cell.y + rng() * (cell.h - h);
      const rotMax = (mob ? 2.6 : 3.4) * (1.45 - Math.min(1, w / W * 2.2));
      const rot = (rng() * 2 - 1) * rotMax;

      const fig = document.createElement('figure');
      fig.className = 'wcard';
      fig.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;--rot:${rot.toFixed(2)}deg`;
      fig.setAttribute('tabindex', '0');
      fig.setAttribute('role', 'button');
      fig.setAttribute('aria-label', `${meta.t} — büyüt`);
      fig.dataset.idx = flat.length;
      fig.innerHTML = `<img src="${IMG[id] || ''}" alt="${meta.t}" decoding="async" draggable="false"><figcaption class="wcap"><b>${meta.t}</b><span>${meta.c}</span></figcaption>`;
      el.appendChild(fig);
      flat.push({ id, t: meta.t, c: meta.c, fig, el });
      fig.addEventListener('click', () => LB.open(+fig.dataset.idx));
      fig.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); LB.open(+fig.dataset.idx); } });
    });
  }

  function build() {
    flat = [];
    vw = innerWidth;
    mobile = isMobile.matches;
    sw = mobile ? Math.round(vw * 1.66) : vw;
    sceneEls.forEach(el => { el.style.width = sw + 'px'; });
    trackW = sw * sceneEls.length;
    sceneEls.forEach((el, si) => layoutScene(el, si, view.clientHeight));
    stage.style.height = 'calc(' + ((sceneEls.length - 1) * (mobile ? 120 : 165) + 100) + 'vh)';
    stage.style.height = 'calc(' + ((sceneEls.length - 1) * (mobile ? 120 : 165) + 100) + 'svh)';
  }

  /* Scroll ↔ yatay geçiş */
  const fill = $('#wuiFill'), count = $('#wuiCount');
  function engine() {
    if (!active) return;
    const total = Math.max(1, stage.offsetHeight - view.clientHeight);
    const top = stage.getBoundingClientRect().top;
    const p = clamp(-top / total, 0, 1);
    const x = p * (trackW - vw);
    if (Math.abs(x - lastX) > .3) {
      lastX = x;
      track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
      if (fill) fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      const s = Math.min(sceneEls.length, Math.floor(p * sceneEls.length * .999) + 1);
      const txt = 'Sahne 0' + s + ' / 0' + sceneEls.length;
      if (count && count.textContent !== txt) count.textContent = txt;
    }
    requestAnimationFrame(engine);
  }

  const io = new IntersectionObserver(en => {
    const was = active;
    active = en[0].isIntersecting;
    if (active && !was && !PRM) requestAnimationFrame(engine);
  }, { threshold: 0 });
  io.observe(stage);

  let rT;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      const need = Math.abs(innerWidth - vw) > 24 || isMobile.matches !== mobile;
      if (need && !staticMode) build();
    }, 200);
  });

  /* Reduced-motion → statik kolaj modu */
  let staticMode = false;
  if (PRM) {
    staticMode = true;
    stage.classList.add('works--static');
    sceneEls.forEach(el => { el.style.width = '100%'; });
    flat = [];
    sceneEls.forEach((el, si) => layoutScene(el, si, innerHeight * .86));
    addEventListener('resize', () => {
      clearTimeout(rT);
      rT = setTimeout(() => { flat = []; sceneEls.forEach((el, si) => layoutScene(el, si, innerHeight * .86)); }, 220);
    });
    return { flat: () => flat, rebuild: () => {} };
  }

  build();
  return { flat: () => flat };
})();

/* ---------- Lightbox ---------- */
const LB = (() => {
  const lb = $('#lb'), img = $('#lbImg'), tEl = $('#lbTitle'), cEl = $('#lbCat'), cnt = $('#lbCount');
  if (!lb) return { open: () => {} };
  let cur = 0, list = [];

  function render() {
    const it = list[cur];
    img.src = IMG[it.id] || '';
    img.alt = it.t;
    tEl.textContent = it.t;
    cEl.textContent = it.c;
    cnt.textContent = (cur + 1) + ' / ' + list.length;
  }
  function open(i) {
    list = Works.flat();
    if (!list.length) return;
    cur = clamp(i, 0, list.length - 1);
    render();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#lbX').focus({ preventScroll: true });
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  function nav(d) { cur = (cur + d + list.length) % list.length; render(); }

  $('#lbX').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', () => nav(-1));
  $('#lbNext').addEventListener('click', () => nav(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') nav(-1);
    if (e.key === 'ArrowRight') nav(1);
  });
  /* dokunmatik kaydırma */
  let tx = 0, ty = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) nav(dx < 0 ? 1 : -1);
  }, { passive: true });

  return { open, close };
})();

/* ============================================================
   4) CANVAS ARKA PLAN — scroll ile sahne değişen 2D derinlik
   ============================================================ */
(function initBG() {
  try {
    const cv = $('#bg');
    const ctx = cv.getContext('2d');
    if (!cv || !ctx) throw new Error('no-canvas');
    let W = 0, H = 0, DPR = 1, t = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
    const TAU = Math.PI * 2;
    const shapeCache = new WeakMap();
    let secs = [];

    const THEMES = {
      light: { bg: '#F7F6FA', c1: '130,84,216', c2: '88,52,157' },
      dark: { bg: '#15131B', c1: '185,160,239', c2: '255,255,255' }
    };

    function resize() {
      W = innerWidth; H = innerHeight;
      DPR = Math.min(devicePixelRatio || 1, 1.6);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      collect();
    }

    function collect() {
      secs = $$('[data-th]').filter(el => el.offsetParent !== null).map(el => ({ el, dark: el.dataset.th === 'dark', w: 0 }));
    }

    /* Şekil üretimi — her bölüm için bir kez */
    function buildShapes(sec) {
      if (shapeCache.has(sec.el)) return shapeCache.get(sec.el);
      const rng = mulberry32(sec.el.id ? [...sec.el.id].reduce((a, c) => a + c.charCodeAt(0), 7) : 42);
      const kind = sec.el.id || 'default';
      const S = [];
      const add = (type, n, cfg) => { for (let i = 0; i < n; i++) S.push(Object.assign({ type, x: rng(), y: rng(), r: rng(), ph: rng() * TAU, spd: .1 + rng() * .3, depth: .05 + rng() * .16, a: .05 + rng() * .1 }, cfg)); };
      switch (kind) {
        case 'anasayfa':
          add('iris', 2, { s: .16 + rng() * .1, a: .09 });
          add('ring', 7, { s: .04 + rng() * .12, dash: rng() > .5 });
          add('bokeh', 10, { s: .02 + rng() * .05, a: .04 + rng() * .05 });
          add('dot', 12, {}); add('plus', 4, {});
          break;
        case 'hizmetler':
          add('frame', 5, { s: .07 + rng() * .1, ar: .55 + rng() * .3 });
          add('plus', 6, {}); add('dot', 14, {});
          add('chart', 2, { s: .1 + rng() * .06 }); add('tl', 1, { s: .16 });
          break;
        case 'calismalar':
          add('frame', 4, { s: .08 + rng() * .12, ar: .6 + rng() * .3, a: .05 });
          add('dot', 9, { a: .04 }); add('ring', 3, { s: .05 + rng() * .08, a: .05 });
          break;
        case 'hakkimizda':
          add('dot', 13, {}); add('ring', 4, { s: .04 + rng() * .09 });
          add('chart', 2, { s: .09 + rng() * .05 }); add('plus', 3, {});
          break;
        case 'surec':
          add('tl', 2, { s: .14 + rng() * .1 }); add('dot', 12, {});
          add('ring', 3, { s: .04 + rng() * .07 }); add('plus', 4, {});
          break;
        case 'blog':
          add('frame', 3, { s: .06 + rng() * .09, ar: .6 + rng() * .3 });
          add('dot', 12, {}); add('chart', 2, { s: .08 + rng() * .05 });
          break;
        case 'iletisim':
          add('ring', 4, { s: .05 + rng() * .1 });
          add('bokeh', 8, { s: .02 + rng() * .045, a: .04 + rng() * .04 });
          add('dot', 10, { a: .04 }); add('plus', 3, {});
          break;
        default:
          add('dot', 8, { a: .04 }); add('ring', 2, { s: .04 + rng() * .06, a: .05 });
      }
      shapeCache.set(sec.el, S);
      return S;
    }

    function stroke(col, a) { ctx.strokeStyle = `rgba(${col},${a.toFixed(3)})`; ctx.fillStyle = ctx.strokeStyle; }

    function drawShape(s, col, a, dt) {
      const dep = s.depth;
      const yy = (((s.y * H) - (scrollY * dep) + t * s.spd * 14 * dt) % (H + 160) + (H + 160)) % (H + 160) - 80;
      const xx = s.x * W + tmx * dep * 34 + Math.sin(t * s.spd + s.ph) * 6;
      ctx.save();
      ctx.translate(xx, yy);
      ctx.lineWidth = 1.4;
      const sz = s.s ? s.s * Math.min(W, H) : 0;
      switch (s.type) {
        case 'dot': stroke(col, a); ctx.beginPath(); ctx.arc(0, 0, 2.6 + s.r * 2.4, 0, TAU); ctx.fill(); break;
        case 'bokeh': stroke(col, a); ctx.beginPath(); ctx.arc(0, 0, sz * .5 + 8, 0, TAU); ctx.fill(); break;
        case 'ring':
          stroke(col, a);
          if (s.dash) ctx.setLineDash([5, 9]);
          ctx.beginPath(); ctx.arc(0, 0, sz + 10, 0, TAU); ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'plus':
          stroke(col, a); ctx.beginPath();
          ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.moveTo(0, -7); ctx.lineTo(0, 7);
          ctx.stroke(); break;
        case 'frame': {
          stroke(col, a);
          const w = sz * 2.4, h = w * s.ar;
          ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.stroke();
          const L = 10;
          [[-w/2,-h/2,1,1],[w/2,-h/2,-1,1],[-w/2,h/2,1,-1],[w/2,h/2,-1,-1]].forEach(([px,py,dx,dy]) => {
            ctx.beginPath(); ctx.moveTo(px, py + dy * L); ctx.lineTo(px, py); ctx.lineTo(px + dx * L, py); ctx.stroke();
          });
          break;
        }
        case 'chart': {
          stroke(col, a);
          ctx.beginPath();
          const pts = 4, st = sz;
          for (let i = 0; i < pts; i++) {
            const px = -st + (i / (pts - 1)) * st * 2;
            const py = Math.sin(i * 1.7 + s.ph) * st * .35 + (i % 2 ? -8 : 8);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          break;
        }
        case 'tl': {
          stroke(col, a);
          ctx.beginPath(); ctx.moveTo(-sz, 0); ctx.lineTo(sz, 0); ctx.stroke();
          [-sz * .5, 0, sz * .5].forEach(px => {
            ctx.beginPath(); ctx.moveTo(px, -5); ctx.lineTo(px, 5); ctx.stroke();
            ctx.beginPath(); ctx.rect(px - 3, -16 - s.r * 8, 6, 9); ctx.fill();
          });
          break;
        }
        case 'iris': {
          stroke(col, a);
          const R = sz;
          ctx.beginPath(); ctx.arc(0, 0, R + 12, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, R * .5, 0, TAU); ctx.stroke();
          const n = 7, rot = t * .12 + s.ph;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const a1 = rot + (i / n) * TAU;
            const a2 = a1 + (TAU / n) * 2.3;
            ctx.moveTo(Math.cos(a1) * R, Math.sin(a1) * R);
            ctx.lineTo(Math.cos(a2) * R, Math.sin(a2) * R);
          }
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    }

    function frame(dt) {
      t += dt;
      /* aktif bölüm (şekil sahneleri yine scroll ile değişir) */
      const mark = scrollY + H * .45;
      let target = secs.length - 1;
      for (let i = 0; i < secs.length; i++) {
        const top = secs[i].el.getBoundingClientRect().top + scrollY;
        if (top <= mark) target = i;
      }
      secs.forEach((s, i) => s.w = lerp(s.w, i === target ? 1 : 0, .07));
      /* Arka plan + renkler scroll ile DEĞİŞMEZ; yalnızca kullanıcı temasına uyar */
      const th = THEMES[document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'];
      ctx.fillStyle = th.bg;
      ctx.fillRect(0, 0, W, H);
      tmx = lerp(tmx, mx, .05); tmy = lerp(tmy, my, .05);
      secs.forEach(s => {
        if (s.w < .02) return;
        buildShapes(s).forEach(sh => drawShape(sh, sh.r > .78 ? th.c2 : th.c1, sh.a * s.w, dt));
      });
      ctx.globalAlpha = 1;
    }

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!document.hidden) frame(dt);
      raf = requestAnimationFrame(loop);
    }
    let raf = requestAnimationFrame(loop);

    if (PRM) {
      cancelAnimationFrame(raf);
      let pending = false;
      const drawStatic = () => { frame(0); pending = false; };
      const queue = () => { if (!pending) { pending = true; requestAnimationFrame(drawStatic); } };
      addEventListener('scroll', queue, { passive: true });
      document.addEventListener('nof:theme', queue);
    }

    if (matchMedia('(pointer:fine)').matches) {
      addEventListener('mousemove', e => {
        mx = (e.clientX / W - .5); my = (e.clientY / H - .5);
      }, { passive: true });
    }

    let rz;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 160); });
    addEventListener('nof:route', () => setTimeout(collect, 80));
    resize();
  } catch (err) {
    document.documentElement.classList.add('no-canvas');
  }
})();

/* ============================================================
   5) BLOG — önizleme, arşiv, detay
   ============================================================ */
const ICON_CAL = '__ICON:calendar__', ICON_CLK = '__ICON:clock__', ICON_ARR = '__ICON:arrow-right__';
const metaHTML = p => `<div class="bmeta"><span>${ICON_CAL}${p.date}</span><span>${ICON_CLK}${p.read} okuma</span></div>`;
const catHTML = c => `<span class="bcat">${c}</span>`;

function renderBP() {
  const host = $('#bpGrid');
  if (!host) return;
  const [f, s1, s2] = POSTS;
  host.innerHTML = `
    <a class="bcard bp-feat" href="#/blog/${f.slug}" data-reveal>
      <span class="bimg"><img src="${IMG[f.img]}" alt="${f.t}" loading="lazy" decoding="async"></span>
      <span class="bcard-body">${catHTML(f.cat)}<h3>${f.t}</h3><p>${f.ex}</p>${metaHTML(f)}</span>
    </a>
    <div class="bp-side">
      ${[s1, s2].map((p, i) => `
      <a class="bcard bp-sm" href="#/blog/${p.slug}" data-reveal style="--d:${(i + 1) * 90}ms">
        <span class="bimg"><img src="${IMG[p.img]}" alt="${p.t}" loading="lazy" decoding="async"></span>
        <span class="bcard-body">${catHTML(p.cat)}<h4>${p.t}</h4>${metaHTML(p)}</span>
      </a>`).join('')}
    </div>`;
  $$('#bpGrid [data-reveal]').forEach(el => revealIO.observe(el));
}

/* ---- Arşiv ---- */
const AR = { cat: 'Tümü', q: '', page: 1, PER: 6 };

function renderChips() {
  const host = $('#bChips');
  const counts = { 'Tümü': POSTS.length };
  CATS.forEach(c => counts[c] = POSTS.filter(p => p.cat === c).length);
  host.innerHTML = Object.keys(counts).filter(c => AR.cat === 'Tümü' || c === 'Tümü' || counts[c] > 0).map(c =>
    `<button class="chip ${AR.cat === c ? 'act' : ''}" data-chip="${c}">${c} · ${counts[c]}</button>`).join('');
  $$('#bChips [data-chip]').forEach(b => b.addEventListener('click', () => {
    AR.cat = b.dataset.chip; AR.page = 1; renderArchive();
  }));
}

function filteredPosts() {
  const q = AR.q.trim().toLocaleLowerCase('tr');
  return POSTS.filter(p => (AR.cat === 'Tümü' || p.cat === AR.cat) &&
    (!q || (p.t + ' ' + p.ex).toLocaleLowerCase('tr').includes(q)));
}

function renderArchive() {
  const host = $('#bList'), pag = $('#bPag');
  const list = filteredPosts();
  $('#bCount').textContent = list.length + ' yazı';
  renderChips();

  if (!list.length) {
    host.innerHTML = `<div class="bempty" style="display:block"><span class="ic">__ICON:search__</span><h3>Sonuç bulunamadı</h3><p>Farklı bir arama deneyin ya da filtreyi sıfırlayın.</p><button class="btn btn--ghost" id="bReset">Filtreyi Sıfırla</button></div>`;
    const bReset = $('#bReset');
    if (bReset) bReset.addEventListener('click', () => { AR.cat = 'Tümü'; AR.q = ''; $('#bSearch').value = ''; AR.page = 1; renderArchive(); });
    pag.innerHTML = '';
    return;
  }

  const feat = list[0];
  const rest = list.slice(1);
  const pages = Math.max(1, Math.ceil(rest.length / AR.PER));
  AR.page = clamp(AR.page, 1, pages);
  const slice = rest.slice((AR.page - 1) * AR.PER, AR.page * AR.PER);
  const spans = [7, 5, 5, 7, 6, 6];

  host.innerHTML = `
    <a class="bfeat" href="#/blog/${feat.slug}">
      <span class="bimg"><img src="${IMG[feat.img]}" alt="${feat.t}" decoding="async"></span>
      <span class="bfeat-body">${catHTML(feat.cat)}<h2>${feat.t}</h2><p>${feat.ex}</p>${metaHTML(feat)}<span class="svc-link">Yazıyı Oku ${ICON_ARR}</span></span>
    </a>
    <div class="bgrid">${slice.map((p, i) => `
      <a class="bcard" style="--sp:${spans[i % spans.length]};--i:${i}" href="#/blog/${p.slug}">
        <span class="bimg"><img src="${IMG[p.img]}" alt="${p.t}" loading="lazy" decoding="async"></span>
        <span class="bcard-body">${catHTML(p.cat)}<h3>${p.t}</h3><p>${p.ex}</p>${metaHTML(p)}</span>
      </a>`).join('')}</div>`;

  pag.innerHTML = pages > 1 ? `
    <button class="pg" data-pg="prev" ${AR.page === 1 ? 'disabled' : ''} aria-label="Önceki sayfa">‹</button>
    ${Array.from({ length: pages }, (_, i) => `<button class="pg ${AR.page === i + 1 ? 'act' : ''}" data-pg="${i + 1}">${i + 1}</button>`).join('')}
    <button class="pg" data-pg="next" ${AR.page === pages ? 'disabled' : ''} aria-label="Sonraki sayfa">›</button>` : '';

  $$('#bPag [data-pg]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.pg === 'prev') AR.page--;
    else if (b.dataset.pg === 'next') AR.page++;
    else AR.page = +b.dataset.pg;
    renderArchive();
    const top = $('#view-blog .bctrl').getBoundingClientRect().top + scrollY - 90;
    scrollTo({ top, behavior: PRM ? 'auto' : 'smooth' });
  }));
}

const bSearch = $('#bSearch');
let sT;
if (bSearch) bSearch.addEventListener('input', () => {
  clearTimeout(sT);
  sT = setTimeout(() => { AR.q = bSearch.value; AR.page = 1; renderArchive(); }, 220);
});

/* ---- Yazı detayı ---- */
function renderPost(slug) {
  const wrap = $('#postWrap');
  const p = POSTS.find(x => x.slug === slug);
  if (!p) { location.hash = '#/blog'; return; }
  const idx = POSTS.indexOf(p);
  const prev = POSTS[idx - 1], next = POSTS[idx + 1];
  let rel = POSTS.filter(x => x !== p && x.cat === p.cat).slice(0, 3);
  if (rel.length < 3) rel = rel.concat(POSTS.filter(x => x !== p && !rel.includes(x)).slice(0, 3 - rel.length));

  wrap.innerHTML = `
  <article class="pv">
    <a class="pv-back" href="#/blog">__ICON:corner-up-left__Tüm Yazılar</a>
    <div class="pv-meta">${catHTML(p.cat)}<span>${ICON_CAL}${p.date}</span><span>${ICON_CLK}${p.read} okuma</span></div>
    <h1>${p.t}</h1>
    <figure class="pv-cover"><img src="${IMG[p.img]}" alt="${p.t}" decoding="async"></figure>
    <div class="article">${p.body}</div>
    <div class="pv-author">
      <span class="pv-ava">ND</span>
      <div><b>NOF DİJİTAL Ekibi</b><span>Prodüksiyon &amp; Performans ekibinden saha notları</span></div>
    </div>
    <div class="pv-share">
      <span>Paylaş:</span>
      <button data-share aria-label="Paylaş (temsili)">__ICON:share-2__</button>
      <button data-share aria-label="Bağlantıyı kopyala (temsili)">__ICON:link__</button>
    </div>
    <nav class="pn">
      ${prev ? `<a href="#/blog/${prev.slug}"><span>Önceki Yazı</span><b>${prev.t}</b></a>` : '<span></span>'}
      ${next ? `<a href="#/blog/${next.slug}"><span>Sonraki Yazı</span><b>${next.t}</b></a>` : '<span></span>'}
    </nav>
  </article>
  <section class="rel">
    <div class="wrap">
      <div class="sec-head"><div><span class="idx"><i></i>İlgili Yazılar</span><h2 style="font-size:clamp(26px,3vw,36px)">Bu konular da ilginizi çekebilir</h2></div></div>
      <div class="bgrid">${rel.map((r, i) => `
        <a class="bcard" style="--sp:${[5, 4, 3][i]};--i:${i}" href="#/blog/${r.slug}">
          <span class="bimg"><img src="${IMG[r.img]}" alt="${r.t}" loading="lazy" decoding="async"></span>
          <span class="bcard-body">${catHTML(r.cat)}<h3 style="font-size:18px">${r.t}</h3>${metaHTML(r)}</span>
        </a>`).join('')}</div>
    </div>
  </section>`;

  $$('[data-share]', wrap).forEach(b => b.addEventListener('click', () => toast('Prototip: paylaşım bağlantıları temsilidir.')));
}

/* ============================================================
   6) ROUTER — hash tabanlı görünümler + history
   ============================================================ */
const views = { home: $('#view-home'), blog: $('#view-blog'), post: $('#view-post') };
const memory = {};
let lastKey = null, popFlag = false, lastHash = location.hash;

/* Gerçek geri/ileri gezinmeyi ayırt et: bilinçli hash değişimlerine "niyet" damgası */
let navIntent = 0;
document.addEventListener('click', e => {
  const a = e.target && e.target.closest && e.target.closest('a[href^="#"]');
  if (a) navIntent = Date.now();
}, true);
addEventListener('popstate', () => { popFlag = (Date.now() - navIntent > 60); });

function parseHash() {
  const h = location.hash;
  if (!h || h === '#' || h === '#/' || h === '#anasayfa') return { v: 'home', sec: h === '#anasayfa' ? 'anasayfa' : null };
  if (h.startsWith('#/blog')) {
    const slug = h.slice(6).replace(/^\/+/, '');
    return slug ? { v: 'post', slug } : { v: 'blog' };
  }
  return { v: 'home', sec: h.slice(1) };
}

function scrollToSec(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + scrollY - 78;
  scrollTo({ top: y, behavior: PRM ? 'auto' : 'smooth' });
}

function applyRoute() {
  const r = parseHash();
  const key = r.v === 'post' ? 'post:' + r.slug
    : (r.v === 'home' && r.sec ? 'home:' + r.sec : r.v);

  if (lastKey) memory[lastKey] = scrollY;

  if (r.v === 'post' && !POSTS.find(x => x.slug === r.slug)) { navIntent = Date.now(); location.replace('#/blog'); return; }

  if (r.v === 'blog') renderArchive();
  if (r.v === 'post') renderPost(r.slug);

  Object.entries(views).forEach(([k, el]) => el.classList.toggle('act', k === r.v));
  document.body.dataset.view = r.v === 'home' ? 'home' : 'blog';

  document.title = r.v === 'home' ? 'NOF DİJİTAL — Dijital Prodüksiyon & Performans Ajansı'
    : r.v === 'blog' ? 'Blog — NOF DİJİTAL'
    : (POSTS.find(x => x.slug === r.slug) || { t: 'Blog' }).t + ' — NOF DİJİTAL Blog';

  menuToggle(false);

  /* Nav aktif durumu */
  $$('#navList a').forEach(a => a.classList.toggle('act', a.dataset.route === 'blog' && r.v !== 'home'));

  /* Canvas bölge listesini tazele (görünümler açılıp kapandığında) */
  window.dispatchEvent(new Event('nof:route'));

  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (popFlag && memory[key] != null) scrollTo(0, memory[key]);
    else if (r.v === 'home' && r.sec) scrollToSec(r.sec);
    else scrollTo(0, 0);
    if (r.v === 'blog') onHdrScroll();
    popFlag = false;
    lastKey = key;
  }));
}

addEventListener('hashchange', applyRoute);

/* ============================================================
   7) FORM / WHATSAPP / DİĞERLERİ
   ============================================================ */
const form = $('#contactForm');
if (form) form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  $('#ctForm').classList.add('done');
  toast('Bu bir prototiptir — mesaj gerçek bir sunucuya gönderilmedi.');
});
const fReset = $('#fReset');
if (fReset) fReset.addEventListener('click', () => {
  $('#ctForm').classList.remove('done');
  form.reset();
});

/* Hizmet listesi footer'a + hizmet seçim bağlantıları (tek merkezli bağlama) */
const ftrSvc = $('#ftrSvc');
if (ftrSvc) ftrSvc.innerHTML = SERVICES.map(s => `<li><a href="#hizmetler" data-svc="${s}">${s}</a></li>`).join('');
$$('[data-svc]').forEach(a => a.addEventListener('click', () => {
  const sel = $('#fSvc');
  if (sel) sel.value = a.dataset.svc;
}));

/* WhatsApp */
const wa = $('#waBtn');
if (wa) wa.addEventListener('click', () => {
  if (CFG.whatsappNumber) {
    open('https://wa.me/' + CFG.whatsappNumber.replace(/\D/g, '') + '?text=' + encodeURIComponent(CFG.whatsappText), '_blank');
  } else {
    toast('WhatsApp numarası ayarlanmamış — CFG.whatsappNumber alanına eklenecek.');
  }
});

/* Sosyal bağlantılar (prototip) */
$$('[data-social]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  toast('Prototip: sosyal medya bağlantıları temsilidir.');
}));

/* Hero play → çalışmalara götür */
const hvPlay = $('#hvPlay');
if (hvPlay) hvPlay.addEventListener('click', () => scrollToSec('calismalar'));

/* Footer hizmet listesi yukarıda tek merkezli kuruldu */

/* Marquee kopya içerik */
const marq = $('#marqTrack');
if (marq) {
  const clone = marq.firstElementChild.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  marq.appendChild(clone);
}

/* Yukarı dön */
const toTop = $('#toTop');
if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: PRM ? 'auto' : 'smooth' }));

/* Yıl */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

/* ============================================================
   BAŞLAT
   ============================================================ */
renderBP();
applyRoute();
addEventListener('load', () => setTimeout(() => document.body.classList.add('loaded'), 60));
setTimeout(() => document.body.classList.add('loaded'), 900); // load olayı gecikirse sigorta
})();
