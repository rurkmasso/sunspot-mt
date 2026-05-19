/* ============================================================
   Sunspot — feature components for the static frontend.
   - Sea-state widget (top-right of hero)
   - Sunset countdown banner (top of page in last 2h before sunset)
   - Favourites (♥ button on every card, list in localStorage)
   - Compare drawer (up to 3 venues, bottom sticky)
   - Open-now badge (auto-renders on cards based on hours field)
   - Distance-from-me (geolocation) on venue pages
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     LAZY PHOTO LOADING (IntersectionObserver)
     Cards render with data-bg="…" and no background-image.
     This promotes data-bg → background-image when each card scrolls
     within 400px of the viewport.
     ============================================================ */
  let lazyObs;
  function ensureLazyObs() {
    if (lazyObs || !window.IntersectionObserver) return;
    lazyObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const url = el.dataset.bg;
        if (url) {
          const img = new Image();
          img.onload = () => {
            el.style.backgroundImage = "linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.35) 100%),url('" + url + "')";
            el.classList.add('ss-bg-loaded');
            el.removeAttribute('data-bg');
          };
          img.src = url;
        }
        lazyObs.unobserve(el);
      });
    }, { rootMargin: '400px 0px' });
  }
  function observeLazyBgs() {
    ensureLazyObs();
    if (!lazyObs) {
      // Fallback for ancient browsers: load immediately
      document.querySelectorAll('[data-bg]').forEach(el => {
        const url = el.dataset.bg;
        if (url) {
          el.style.backgroundImage = "linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.35) 100%),url('" + url + "')";
          el.removeAttribute('data-bg');
        }
      });
      return;
    }
    document.querySelectorAll('[data-bg]').forEach(el => lazyObs.observe(el));
  }

  /* ---------- shared style injection ---------- */
  const css = `
    /* Accessibility — skip link, focus rings */
    .ss-skip-link {
      position: absolute; left: -9999px; top: 0; z-index: 100;
      background: #0a1f3a; color: #fff;
      padding: 10px 16px; border-radius: 0 0 8px 0;
      text-decoration: none; font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
    }
    .ss-skip-link:focus { left: 0; }
    .club-card:focus-visible, .ss-fav-btn:focus-visible, .ss-compare-btn:focus-visible,
    .btn-ghost:focus-visible, .btn-primary:focus-visible {
      outline: 3px solid #ff9800; outline-offset: 2px;
    }
    /* Lazy-image fade-in */
    .ss-bg-loaded { transition: background-color .3s; }
    .club-thumb { transition: background-image .25s; }

    /* Newsletter signup */
    .ss-newsletter {
      background: linear-gradient(135deg, #fff8e8 0%, #f0f9fa 100%);
      padding: 48px 24px; margin-top: 40px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .ss-nl-inner {
      max-width: 980px; margin: 0 auto;
      display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
    }
    @media (max-width: 720px) {
      .ss-nl-inner { grid-template-columns: 1fr; gap: 20px; text-align: center; }
    }
    .ss-nl-text h3 {
      font-size: 24px; color: #0a1f3a; margin-bottom: 8px; letter-spacing: -.3px;
    }
    .ss-nl-text p { color: #50575e; font-size: 14px; line-height: 1.55; margin: 0; }
    .ss-nl-form {
      display: flex; gap: 8px; align-items: center;
    }
    .ss-nl-form input {
      flex: 1; padding: 14px 18px;
      border: 1px solid #e8e8ec; border-radius: 100px;
      font-size: 15px; background: #fff;
      box-shadow: 0 2px 8px rgba(10,31,58,.06);
    }
    .ss-nl-form input:focus { outline: 2px solid #ff9800; outline-offset: 2px; border-color: #ff9800; }
    .ss-nl-form button {
      background: #ff9800; color: #fff; border: 0;
      padding: 14px 24px; border-radius: 100px;
      font-weight: 700; font-size: 14px; cursor: pointer;
      white-space: nowrap;
    }
    .ss-nl-form button:hover { background: #ef6c00; }
    .ss-nl-success {
      background: #edfaef; color: #007017; border: 1px solid #b8e0c2;
      padding: 14px 18px; border-radius: 100px;
      font-size: 14px; flex: 1;
      display: flex; align-items: center; gap: 10px;
    }
    .ss-nl-success button {
      background: none; border: 0; color: #50575e;
      text-decoration: underline; cursor: pointer; font-size: 13px;
    }

    /* Sea-state widget — collapsed pill that sits BELOW the header (z-index
       below the sticky header). Tap to expand into the full panel with
       wind/wave/UV/tide chips. */
    /* Sea-state widget: pill collapsed by default → expands on click.
       Lives bottom-right, above the pref bar. Origin selector + chips hide
       in collapsed mode so the pill stays a compact "26°C · sea 24°C". */
    .ss-sea-state {
      position: fixed; right: 16px; bottom: 80px; z-index: 40;
      background: rgba(255,255,255,.96); backdrop-filter: blur(10px);
      border: 1px solid rgba(0,0,0,.08);
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      animation: ssSlideIn .4s ease-out;
      cursor: pointer;
      transition: border-radius .25s, padding .25s, width .25s;
      /* Collapsed = pill */
      border-radius: 100px;
      padding: 8px 14px 8px 10px;
      display: inline-flex; align-items: center; gap: 10px;
      width: auto;
      overflow: hidden;
    }
    .ss-sea-state.expanded {
      width: 280px;
      border-radius: 14px;
      padding: 14px 16px;
      cursor: default;
      display: block;
    }
    .ss-sea-state .icon { font-size: 22px; flex-shrink: 0; line-height: 1; }
    .ss-sea-state.expanded .icon { font-size: 30px; float: left; margin: 0 12px 6px 0; }
    .ss-sea-state .body { display: contents; }
    .ss-sea-state .t {
      font-weight: 700; color: #0a1f3a; font-size: 12px; line-height: 1.3;
      white-space: nowrap;
    }
    .ss-sea-state.expanded .t { font-size: 14px; white-space: normal; }
    .ss-sea-state .s {
      font-size: 12px; color: #50575e; line-height: 1.4; margin-top: 2px;
      display: none;
    }
    .ss-sea-state.expanded .s { display: block; }
    .ss-sea-extras {
      display: none; flex-wrap: wrap; gap: 6px;
      margin-top: 10px; clear: both;
    }
    .ss-sea-state.expanded .ss-sea-extras { display: flex; }
    .ss-sea-extras > span {
      font-size: 11px; padding: 3px 8px;
      background: #f6f7f7; border-radius: 100px;
      color: #50575e; white-space: nowrap;
    }
    .ss-sea-extras .ss-uv { background: rgba(0,0,0,.04); }
    .ss-sea-extras .ss-uv strong { color: var(--c); font-weight: 700; }
    .ss-origin-block {
      display: none;
      clear: both;
      margin-top: 12px;
      border-top: 1px solid #e8e8ec;
      padding-top: 10px;
    }
    .ss-sea-state.expanded .ss-origin-block { display: block; }
    .ss-sea-state .x {
      background: none; border: 0; color: #888; cursor: pointer;
      font-size: 18px; padding: 0 0 0 6px;
      display: none;
      position: absolute; top: 8px; right: 10px;
    }
    .ss-sea-state.expanded .x { display: inline-block; }
    .ss-sea-state.expanded { position: fixed; }
    /* Hint that the pill is tappable */
    .ss-sea-state::after {
      content: '▴'; font-size: 9px; color: #aaa; margin-left: 2px;
    }
    .ss-sea-state.expanded::after { display: none; }
    /* Pref bar normally lives bottom-right at 16px. Bump up z-index. */
    .ss-pref-bar { z-index: 70; }
    @keyframes ssSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 600px) {
      .ss-sea-state {
        bottom: 76px; left: 8px; right: auto;
        padding: 6px 12px 6px 8px;
      }
      .ss-sea-state .icon { font-size: 18px; }
      .ss-sea-state .t { font-size: 11px; }
      .ss-sea-state.expanded {
        left: 8px; right: 8px; width: auto;
      }
      body.has-compare .ss-sea-state { bottom: 140px; }
    }
    body.has-compare .ss-sea-state { bottom: 140px; }

    .ss-sunset-banner {
      background: linear-gradient(90deg, #ff9800, #ffb74d 50%, #ff6e40);
      color: #fff; padding: 10px 16px; text-align: center;
      font-size: 14px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .ss-sunset-banner a { color: #fff; text-decoration: underline; text-underline-offset: 2px; margin-left: 6px; }
    .ss-sunset-banner .countdown { background: rgba(0,0,0,.18); padding: 2px 10px; border-radius: 100px; font-weight: 700; }
    .ss-sunset-banner .x { background: none; border: 0; color: #fff; opacity: .8; cursor: pointer; margin-left: 12px; font-size: 16px; }

    .ss-fav-btn {
      position: absolute; top: 10px; right: 10px; z-index: 2;
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.92); border: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; line-height: 1;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      transition: transform .15s, background .15s;
    }
    .ss-fav-btn:hover { transform: scale(1.12); }
    .ss-fav-btn.on { background: #ff9800; color: #fff; }

    .ss-open-now {
      position: absolute; bottom: 10px; left: 10px; z-index: 2;
      background: rgba(0,160,40,.95); color: #fff;
      padding: 3px 10px; border-radius: 100px;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; gap: 5px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .ss-open-now::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%;
      background: #fff; animation: ssPulse 1.6s infinite;
    }
    @keyframes ssPulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

    .ss-compare-btn {
      position: absolute; top: 10px; left: 10px; z-index: 2;
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.92); border: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: #0a1f3a;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
      transition: transform .15s, background .15s;
    }
    .ss-compare-btn:hover { transform: scale(1.12); }
    .ss-compare-btn.on { background: #00838f; color: #fff; }

    .ss-compare-drawer {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: #0a1f3a; color: #fff;
      padding: 14px 20px;
      box-shadow: 0 -8px 32px rgba(0,0,0,.2);
      transform: translateY(110%); transition: transform .25s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .ss-compare-drawer.open { transform: translateY(0); }
    .ss-compare-inner {
      max-width: 1180px; margin: 0 auto;
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    }
    .ss-compare-inner strong { white-space: nowrap; font-size: 14px; }
    .ss-compare-slots { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; }
    .ss-compare-slot {
      background: rgba(255,255,255,.1); border-radius: 8px;
      padding: 6px 10px; font-size: 13px;
      display: flex; align-items: center; gap: 8px;
    }
    .ss-compare-slot .x {
      background: none; border: 0; color: #fff; opacity: .7;
      cursor: pointer; font-size: 14px; padding: 0;
    }
    .ss-compare-slot .x:hover { opacity: 1; }
    .ss-compare-go {
      background: #ff9800; color: #fff;
      padding: 8px 18px; border-radius: 100px;
      text-decoration: none; font-weight: 600; font-size: 13px;
      white-space: nowrap;
    }
    .ss-compare-go:hover { background: #ef6c00; color: #fff; }
    .ss-compare-go.disabled { opacity: .4; cursor: not-allowed; }

    .ss-toast {
      position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
      background: #0a1f3a; color: #fff;
      padding: 10px 18px; border-radius: 100px;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 10px 40px rgba(0,0,0,.25);
      z-index: 200; opacity: 0; pointer-events: none;
      transition: opacity .2s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .ss-toast.show { opacity: 1; }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ---------- toast ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'ss-toast';
  document.body.appendChild(toastEl);
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ============================================================
     1) SEA-STATE WIDGET  (deterministic per-day mock; swap for
        real weather API later — just change buildSea())
     ============================================================ */
  function dayOfYear() {
    const d = new Date();
    const s = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - s) / 86400000);
  }
  function buildSea() {
    let seed = dayOfYear();
    function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    const wind = 5 + Math.floor(r() * 18);
    const wave = +(0.1 + r() * 1.1).toFixed(1);
    const temp = 22 + Math.floor(r() * 10);
    const sea  = 20 + Math.floor(r() * 7);
    // UV index — peaks at midday in summer; rough Malta model.
    const month = new Date().getMonth() + 1;
    const baseUv = [1,2,4,6,8,10,11,10,8,5,3,1][month-1];  // monthly noon max
    const hr = new Date().getHours();
    const dayFactor = Math.max(0, 1 - Math.abs(13 - hr) / 6); // tapered around 13:00
    const uv = Math.round(baseUv * dayFactor);
    // Tide — Malta is semi-diurnal but very weak (15–20cm range). Useful info
    // for snorkellers near caves/inlets. Mock with a 12.4h sinusoidal cycle.
    const hoursSinceMidnight = hr + new Date().getMinutes()/60;
    const phase = ((hoursSinceMidnight + seed % 6) % 12.4) / 12.4 * 2 * Math.PI;
    const tideCm = +(15 * Math.sin(phase) + 8).toFixed(0);
    const tideDir = Math.cos(phase) > 0 ? '↑ rising' : '↓ falling';
    const verdict = wind < 12 && wave < 0.5 ? 'Calm — perfect swim conditions'
                  : wind < 18 ? 'Light breeze — fine for most beaches'
                  : 'Choppy — try sheltered bays';
    const icon = wind < 12 ? '☀️' : wind < 18 ? '⛅' : '🌬';
    return { wind, wave, temp, sea, verdict, icon, uv, tideCm, tideDir };
  }
  function uvBand(uv) {
    if (uv >= 11) return { txt: 'Extreme — avoid 11–16h', color: '#b32d2e' };
    if (uv >= 8)  return { txt: 'Very high — SPF 50+', color: '#ef6c00' };
    if (uv >= 6)  return { txt: 'High — wear sunscreen',  color: '#dba617' };
    if (uv >= 3)  return { txt: 'Moderate — SPF 30',     color: '#00837a' };
    if (uv >= 1)  return { txt: 'Low',                    color: '#007017' };
    return { txt: 'None', color: '#50575e' };
  }
  function renderSea() {
    if (sessionStorage.getItem('ss_sea_dismissed') === '1') return;
    if (document.querySelector('.ss-sea-state')) return;
    const s = buildSea();
    const uv = uvBand(s.uv);
    const w = document.createElement('div');
    w.className = 'ss-sea-state';
    w.setAttribute('role', 'button');
    w.setAttribute('aria-label', 'Today in Malta — tap for details');
    w.setAttribute('tabindex', '0');
    w.innerHTML =
      '<div class="icon" aria-hidden="true">' + s.icon + '</div>' +
      '<div style="flex:1; min-width:0">' +
        '<div class="t">' + s.temp + '°C · sea ' + s.sea + '°C</div>' +
        '<div class="s">' + s.verdict + '</div>' +
        '<div class="ss-sea-extras">' +
          '<span class="ss-uv" style="--c:' + uv.color + '" title="UV index">' +
            '<strong>UV ' + s.uv + '</strong> ' + uv.txt +
          '</span>' +
          '<span class="ss-tide" title="Tide (semi-diurnal, ~30cm range)">' +
            '🌊 +' + s.tideCm + 'cm ' + s.tideDir +
          '</span>' +
          '<span class="ss-wind" title="Wind &amp; wave">💨 ' + s.wind + 'kt · ' + s.wave + 'm</span>' +
        '</div>' +
      '</div>' +
      '<button class="x" aria-label="Dismiss">×</button>';

    // Click anywhere on the pill to expand; tap × to dismiss for the session.
    w.addEventListener('click', (e) => {
      if (e.target.closest('.x')) return;
      w.classList.toggle('expanded');
    });
    w.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); w.classList.toggle('expanded'); }
    });
    w.querySelector('.x').addEventListener('click', (e) => {
      e.stopPropagation();
      w.remove();
      sessionStorage.setItem('ss_sea_dismissed', '1');
    });
    document.body.appendChild(w);
  }

  /* ============================================================
     2) SUNSET BANNER  (last 2 hours before sunset)
     ============================================================ */
  const SUNSET = {1:'17:15', 2:'17:45', 3:'18:25', 4:'19:50', 5:'20:15', 6:'20:35',
                  7:'20:30', 8:'20:00', 9:'19:15', 10:'18:25', 11:'16:55', 12:'16:55'};
  function minutesToSunset() {
    const now = new Date();
    const set = SUNSET[now.getMonth() + 1] || '19:30';
    const [h,m] = set.split(':').map(Number);
    return (h*60+m) - (now.getHours()*60 + now.getMinutes());
  }
  function renderSunset() {
    if (sessionStorage.getItem('ss_sunset_dismissed') === '1') return;
    const mins = minutesToSunset();
    if (mins <= 0 || mins > 120) return;
    const b = document.createElement('div');
    b.className = 'ss-sunset-banner';
    b.innerHTML = '🌅 <span>Sunset in <span class="countdown">' + mins + ' min</span></span>' +
                  '<a href="index.html?vibe=sunset">Find a west-facing spot →</a>' +
                  '<button class="x" aria-label="Dismiss">×</button>';
    b.querySelector('.x').addEventListener('click', () => {
      b.remove();
      sessionStorage.setItem('ss_sunset_dismissed', '1');
    });
    document.body.insertBefore(b, document.body.firstChild);
  }

  /* ============================================================
     3) FAVOURITES — ♥ button on every card
     ============================================================ */
  const FAV_KEY = 'sunspot_favs';
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { return []; }
  }
  function setFavs(list) { localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
  function toggleFav(slug) {
    const list = getFavs();
    const i = list.indexOf(slug);
    if (i >= 0) list.splice(i,1); else list.push(slug);
    setFavs(list);
    return i < 0;
  }

  /* ============================================================
     4) COMPARE DRAWER
     ============================================================ */
  const CMP_KEY = 'sunspot_compare';
  const MAX_CMP = 3;
  function getCmp() { try { return JSON.parse(localStorage.getItem(CMP_KEY) || '[]'); } catch (e) { return []; } }
  function setCmp(list) { localStorage.setItem(CMP_KEY, JSON.stringify(list)); refreshCmp(); }
  function addCmp(slug, name) {
    const list = getCmp();
    if (list.some(v => v.slug === slug)) { toast('Already in compare'); return false; }
    if (list.length >= MAX_CMP) { toast('Max ' + MAX_CMP + ' venues'); return false; }
    list.push({ slug, name });
    setCmp(list);
    toast('Added to compare (' + list.length + '/' + MAX_CMP + ')');
    return true;
  }
  function removeCmp(slug) { setCmp(getCmp().filter(v => v.slug !== slug)); }
  function refreshCmp() {
    let drawer = document.querySelector('.ss-compare-drawer');
    const list = getCmp();
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.className = 'ss-compare-drawer';
      drawer.innerHTML = '<div class="ss-compare-inner">' +
        '<strong>Compare</strong>' +
        '<div class="ss-compare-slots"></div>' +
        '<a class="ss-compare-go" href="#">Compare →</a>' +
        '</div>';
      document.body.appendChild(drawer);
      drawer.addEventListener('click', e => {
        const x = e.target.closest('.ss-compare-slot .x');
        if (x) { removeCmp(x.dataset.slug); }
      });
    }
    const slots = drawer.querySelector('.ss-compare-slots');
    const go = drawer.querySelector('.ss-compare-go');
    if (slots) {
      slots.innerHTML = list.map(v =>
        '<div class="ss-compare-slot"><span>' + escapeHtml(v.name) + '</span>' +
        '<button class="x" data-slug="' + v.slug + '" aria-label="Remove">×</button></div>'
      ).join('');
    }
    if (go) {
      if (list.length >= 2) {
        go.href = 'compare.html?ids=' + list.map(v => v.slug).join(',');
        go.classList.remove('disabled');
      } else {
        go.href = '#';
        go.classList.add('disabled');
      }
    }
    drawer.classList.toggle('open', list.length > 0);
    // also refresh button states
    document.querySelectorAll('.ss-compare-btn').forEach(btn => {
      btn.classList.toggle('on', list.some(v => v.slug === btn.dataset.slug));
    });
    document.querySelectorAll('.ss-fav-btn').forEach(btn => {
      const on = getFavs().includes(btn.dataset.slug);
      btn.classList.toggle('on', on);
      btn.innerHTML = on ? '♥' : '♡';
    });
  }

  /* ============================================================
     5) DECORATE CARDS  (favourite + compare + open-now buttons)
     ============================================================ */
  function isOpenNow(hours) {
    if (!hours) return false;
    const m = String(hours).match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/);
    if (!m) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const o = +m[1]*60 + +m[2];
    const c = +m[3]*60 + +m[4];
    return c < o ? (cur >= o || cur < c) : (cur >= o && cur < c);
  }

  function decorate() {
    const clubs = (window.SUNSPOT_CLUBS || []);
    const bySlug = {}; clubs.forEach(v => bySlug[v.id] = v);

    // The club-thumbs renderer puts cards as <a class="club-card" href="club.html?club=ID">
    document.querySelectorAll('a.club-card').forEach(card => {
      if (card.dataset.ssDecorated) return;
      card.dataset.ssDecorated = '1';

      const m = card.href && card.href.match(/[?&]club=([^&]+)/);
      if (!m) return;
      const slug = decodeURIComponent(m[1]);
      const v = bySlug[slug];
      if (!v) return;

      // Make card relative so we can absolutely-position buttons over its image
      const imgWrap = card.querySelector('.club-img, .img, .card-img') || card.firstElementChild;
      if (imgWrap) imgWrap.style.position = 'relative';
      const host = imgWrap || card;
      host.style.position = host.style.position || 'relative';

      // ♥ favourite
      const favBtn = document.createElement('button');
      favBtn.className = 'ss-fav-btn';
      favBtn.dataset.slug = slug;
      favBtn.setAttribute('aria-label', 'Save to favourites');
      const on = getFavs().includes(slug);
      favBtn.classList.toggle('on', on);
      favBtn.innerHTML = on ? '♥' : '♡';
      favBtn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const added = toggleFav(slug);
        favBtn.classList.toggle('on', added);
        favBtn.innerHTML = added ? '♥' : '♡';
        toast(added ? '♥ Saved' : 'Removed');
      });
      host.appendChild(favBtn);

      // ⇄ compare
      const cmpBtn = document.createElement('button');
      cmpBtn.className = 'ss-compare-btn';
      cmpBtn.dataset.slug = slug;
      cmpBtn.title = 'Add to compare';
      cmpBtn.setAttribute('aria-label', 'Add to compare');
      cmpBtn.innerHTML = '⇄';
      const inCmp = getCmp().some(v => v.slug === slug);
      cmpBtn.classList.toggle('on', inCmp);
      cmpBtn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        if (getCmp().some(c => c.slug === slug)) {
          removeCmp(slug);
          toast('Removed from compare');
        } else {
          addCmp(slug, v.name);
        }
      });
      host.appendChild(cmpBtn);

      // ● open now
      if (isOpenNow(v.hours)) {
        const o = document.createElement('span');
        o.className = 'ss-open-now';
        o.textContent = 'Open now';
        host.appendChild(o);
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ============================================================
     Boot — render features once DOM and data ready.
     Re-decorate when the catalog re-renders (e.g. filter change).
     ============================================================ */
  /* ============================================================
     NEWSLETTER SIGNUP — auto-injects above the footer on every page.
     Stores subscriptions in localStorage for now; production swap point
     is the form submit handler (POST to WP REST or Brevo API).
     ============================================================ */
  function renderNewsletter() {
    if (document.querySelector('.ss-newsletter')) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    const sub = (() => {
      try { return localStorage.getItem('sunspot_newsletter') || ''; } catch (e) { return ''; }
    })();
    const block = document.createElement('section');
    block.className = 'ss-newsletter';
    block.innerHTML =
      '<div class="ss-nl-inner">' +
        '<div class="ss-nl-text">' +
          '<h3>Get the weekly Sunspot</h3>' +
          '<p>One email every Friday: this weekend\'s availability, sea-state forecast, and one operator deal. No spam, unsubscribe in one click.</p>' +
        '</div>' +
        '<form class="ss-nl-form" id="ss-nl-form">' +
          (sub
            ? '<div class="ss-nl-success">✓ You\'re subscribed as <strong>' + escapeHtml(sub) + '</strong>. <button type="button" id="ss-nl-unsub">Unsubscribe</button></div>'
            : '<input type="email" id="ss-nl-email" placeholder="you@example.com" required aria-label="Email address">' +
              '<button type="submit">Subscribe →</button>') +
        '</form>' +
      '</div>';
    footer.parentNode.insertBefore(block, footer);

    if (!sub) {
      block.querySelector('#ss-nl-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = block.querySelector('#ss-nl-email').value.trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast('Please enter a valid email');
          return;
        }
        try { localStorage.setItem('sunspot_newsletter', email); } catch (e) {}
        toast('✓ Subscribed — see you Friday!');
        renderNewsletter._refresh = true;
        block.remove();
        renderNewsletter();
      });
    } else {
      block.querySelector('#ss-nl-unsub').addEventListener('click', () => {
        try { localStorage.removeItem('sunspot_newsletter'); } catch (e) {}
        toast('Unsubscribed');
        block.remove();
        renderNewsletter();
      });
    }
  }

  /* ============================================================
     MOBILE HAMBURGER — injected into every .site-header that has a nav
     ============================================================ */
  function addMobileMenu() {
    document.querySelectorAll('.site-header .container').forEach(c => {
      if (c.querySelector('.ss-hamburger')) return;
      const nav = c.querySelector('nav');
      if (!nav) return;
      const btn = document.createElement('button');
      btn.className = 'ss-hamburger';
      btn.setAttribute('aria-label', 'Open menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span></span>';
      // Insert before the nav so it sits where the nav would be
      c.insertBefore(btn, nav);
      btn.addEventListener('click', () => {
        const open = document.body.classList.toggle('ss-menu-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ============================================================
     MOBILE BOTTOM NAV — primary actions in thumb reach (≤720px only)
     ============================================================ */
  function renderMobileBottomNav() {
    if (document.querySelector('.ss-mobile-nav')) return;
    var bar = document.createElement('nav');
    bar.className = 'ss-mobile-nav';
    bar.setAttribute('aria-label', 'Primary mobile navigation');

    // Detect path depth: pages inside /shop/ need '../' prefix on root links
    var inSubdir = /\/shop\//.test(location.pathname);
    var p = inSubdir ? '../' : '';
    var path = location.pathname.split('/').pop() || 'index.html';
    function active(href) { return path === href ? 'active' : ''; }

    // Tab order (mobile-first, thumb-priority): Browse · Experiences · Sea · Bookings · Account.
    // No duplicate labels, no confusion between 'Today' the section and 'Today' the weather.
    bar.innerHTML =
      '<div class="ss-mobile-nav-grid">' +
        '<a href="' + p + 'index.html" class="' + active('index.html') + '" aria-label="Browse beaches">' +
          '<span class="ss-mobile-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>' +
          'Browse' +
        '</a>' +
        '<a href="' + p + 'experiences.html" class="' + active('experiences.html') + '" aria-label="Experiences">' +
          '<span class="ss-mobile-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16h18l-2 5H5zM6 16V8l6-3 6 3v8M12 5v11"/></svg></span>' +
          'Experiences' +
        '</a>' +
        '<button type="button" data-mobile-open="sea" aria-label="Sea conditions today">' +
          '<span class="ss-mobile-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 18c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/></svg></span>' +
          'Sea today' +
        '</button>' +
        '<a href="' + p + 'bookings.html" class="' + active('bookings.html') + '" aria-label="My bookings">' +
          '<span class="ss-mobile-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></span>' +
          'My trips' +
        '</a>' +
        '<button type="button" data-mobile-open="prefs" aria-label="Settings &amp; preferences">' +
          '<span class="ss-mobile-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg></span>' +
          'Account' +
        '</button>' +
      '</div>';
    document.body.appendChild(bar);

    // Wire the two button tabs (Today / Me)
    bar.querySelectorAll('[data-mobile-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var what = btn.dataset.mobileOpen;
        if (what === 'sea') {
          document.body.classList.toggle('ss-sea-open');
          document.body.classList.remove('ss-prefs-open');
          // If the sea-state widget exists, ensure it's expanded
          var sea = document.querySelector('.ss-sea-state');
          if (sea) sea.classList.add('expanded');
        } else if (what === 'prefs') {
          document.body.classList.toggle('ss-prefs-open');
          document.body.classList.remove('ss-sea-open');
        }
      });
    });

    // Close popovers when tapping outside
    document.addEventListener('click', function (e) {
      if (e.target.closest('.ss-mobile-nav') ||
          e.target.closest('.ss-pref-bar')   ||
          e.target.closest('.ss-sea-state')) return;
      document.body.classList.remove('ss-prefs-open', 'ss-sea-open');
    });
  }

  function addSkipLink() {
    if (document.querySelector('.ss-skip-link')) return;
    // Look for an existing landmark to skip to
    const main = document.querySelector('main') ||
                 document.querySelector('#main') ||
                 document.querySelector('.main-content') ||
                 document.querySelector('.container');
    if (!main) return;
    if (!main.id) main.id = 'main-content';
    const a = document.createElement('a');
    a.className = 'ss-skip-link';
    a.href = '#' + main.id;
    a.textContent = 'Skip to content';
    document.body.insertBefore(a, document.body.firstChild);
  }

  function boot() {
    addSkipLink();
    addMobileMenu();
    renderMobileBottomNav();
    renderSea();
    renderSunset();
    renderNewsletter();
    refreshCmp();
    decorate();
    observeLazyBgs();
    // Observer to re-decorate + re-observe lazy bgs on grid re-renders
    const grid = document.getElementById('thumbs-grid') ||
                 document.getElementById('club-grid') ||
                 document.querySelector('.club-thumbs-grid') ||
                 document.querySelector('.club-grid') ||
                 document.body;
    if (grid && window.MutationObserver) {
      let timer;
      new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => { decorate(); observeLazyBgs(); }, 80);
      }).observe(grid, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
  } else {
    setTimeout(boot, 50);
  }

  // Expose
  window.SunspotFeatures = { toggleFav, addCmp, removeCmp, getFavs, getCmp, toast };
})();
