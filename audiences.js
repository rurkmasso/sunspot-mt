/* ============================================================
   Sunspot — audience features
   - Language switcher (EN / MT / IT)  — locals, Italians, English
   - Currency switcher (EUR / GBP / USD) — tourists
   - Family-mode toggle — hides adults-only, surfaces kid-friendly
   - "Visiting" / "Living here" mode pills
   - Distance-from-X selector (origin = hotel, area, or current location)
   - Day-of-week / time-of-day awareness for sun direction tips
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     i18n — minimal phrase pack. Add more keys as you internationalise.
     Falls back to EN when a key is missing.
     ============================================================ */
  const I18N = {
    en: {
      'nav.beaches': 'Beaches',
      'nav.guides': 'Guides',
      'nav.about': 'About',
      'nav.bookings': 'My bookings',
      'nav.signin': 'Sign in',
      'nav.book': 'Book a spot',
      'lang.label': 'Language',
      'cur.label': 'Currency',
      'mode.visiting': "I'm visiting",
      'mode.living':   'I live here',
      'mode.day':      'Cruise day-trip',
      'family.label':  'Family mode',
      'family.on':     'Family mode on — adults-only venues hidden',
      'from':          'from',
      'per_sunbed':    'per sunbed',
      'free':          'Free',
      'open_now':      'Open now',
      'spots_left':    'spots left',
      'minutes':       'min',
      'compare':       'Compare',
      'compare_open':  'Compare venues',
      'fav_saved':     '♥ Saved to favourites',
      'fav_removed':   'Removed from favourites',
      'origin.label':  'Distance from',
      'origin.use':    'Use my location',
      'no_results':    'No venues match — try fewer filters',
    },
    mt: {
      'nav.beaches':   'Bajjiet',
      'nav.guides':    'Gwidi',
      'nav.about':     'Dwarna',
      'nav.bookings':  'Il-prenotazzjonijiet tiegħi',
      'nav.signin':    'Idħol',
      'nav.book':      'Ipprenota post',
      'lang.label':    'Lingwa',
      'cur.label':     'Munita',
      'mode.visiting': 'Qed inżur',
      'mode.living':   'Ngħix hawn',
      'mode.day':      'Day-trip mill-vapur',
      'family.label':  'Mod familja',
      'family.on':     'Mod familja attivat — postijiet għall-adulti moħbija',
      'from':          'minn',
      'per_sunbed':    'kull sunbed',
      'free':          'Bla ħlas',
      'open_now':      'Miftuħ issa',
      'spots_left':    'postijiet illum',
      'minutes':       'min',
      'compare':       'Qabbel',
      'compare_open':  'Qabbel postijiet',
      'fav_saved':     '♥ Salvajt',
      'fav_removed':   'Tneħħa mill-favoriti',
      'origin.label':  'Distanza minn',
      'origin.use':    'Uża l-pożizzjoni tiegħi',
      'no_results':    'L-ebda riżultati — naqqas il-filtri',
    },
    it: {
      'nav.beaches':   'Spiagge',
      'nav.guides':    'Guide',
      'nav.about':     'Chi siamo',
      'nav.bookings':  'Le mie prenotazioni',
      'nav.signin':    'Accedi',
      'nav.book':      'Prenota un posto',
      'lang.label':    'Lingua',
      'cur.label':     'Valuta',
      'mode.visiting': 'Sono in vacanza',
      'mode.living':   'Vivo qui',
      'mode.day':      'Gita dalla nave',
      'family.label':  'Modalità famiglia',
      'family.on':     'Modalità famiglia attiva — locali per soli adulti nascosti',
      'from':          'da',
      'per_sunbed':    'a lettino',
      'free':          'Gratis',
      'open_now':      'Aperto ora',
      'spots_left':    'posti rimasti',
      'minutes':       'min',
      'compare':       'Confronta',
      'compare_open':  'Confronta locali',
      'fav_saved':     '♥ Salvato nei preferiti',
      'fav_removed':   'Rimosso dai preferiti',
      'origin.label':  'Distanza da',
      'origin.use':    'Usa la mia posizione',
      'no_results':    'Nessun risultato — riduci i filtri',
    },
  };

  // No flag emojis — they render inconsistently across OSes and look
  // off-brand. The 2-letter code does the same job and is reliable.
  const LANGS = [
    { code: 'en', flag: 'EN', name: 'English' },
    { code: 'mt', flag: 'MT', name: 'Malti' },
    { code: 'it', flag: 'IT', name: 'Italiano' },
  ];
  const CURRENCIES = [
    // Mid-2026 rough rates. Replace with live API later.
    { code: 'EUR', symbol: '€', rate: 1.00, name: 'Euro' },
    { code: 'GBP', symbol: '£', rate: 0.85, name: 'British Pound' },
    { code: 'USD', symbol: '$', rate: 1.08, name: 'US Dollar' },
  ];

  // ---------- persistent prefs ----------
  const PREFS_KEY = 'sunspot_prefs';
  function loadPrefs() {
    try { return Object.assign({ lang:'en', currency:'EUR', family:false, mode:'visiting', origin:null }, JSON.parse(localStorage.getItem(PREFS_KEY)||'{}')); }
    catch (e) { return { lang:'en', currency:'EUR', family:false, mode:'visiting', origin:null }; }
  }
  function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
  let prefs = loadPrefs();

  // Auto-detect language on first visit (browser language hint)
  if (!localStorage.getItem(PREFS_KEY)) {
    const browserLang = (navigator.language || 'en').slice(0,2).toLowerCase();
    if (browserLang === 'mt' || browserLang === 'it') {
      prefs.lang = browserLang;
      savePrefs();
    }
  }

  function t(key) { return (I18N[prefs.lang] && I18N[prefs.lang][key]) || I18N.en[key] || key; }
  function formatPrice(eur) {
    const c = CURRENCIES.find(x => x.code === prefs.currency) || CURRENCIES[0];
    const v = Math.round(eur * c.rate);
    return c.symbol + v;
  }

  /* ============================================================
     STYLES
     ============================================================ */
  const css = `
    .ss-pref-bar {
      position: fixed; bottom: 16px; right: 16px; z-index: 70;
      display: flex; gap: 6px; align-items: center;
      background: rgba(255,255,255,.96); backdrop-filter: blur(10px);
      border: 1px solid rgba(0,0,0,.08);
      border-radius: 100px;
      padding: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      transition: bottom .25s;
    }
    body.has-compare .ss-pref-bar { bottom: 84px; }
    @media (max-width: 600px) {
      body.has-compare .ss-pref-bar { bottom: 124px; }
    }
    .ss-pref-bar select {
      background: transparent; border: 0; padding: 6px 10px;
      border-radius: 100px; cursor: pointer; font: inherit;
      color: #0a1f3a; appearance: none; padding-right: 22px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23888' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 8px center;
    }
    .ss-pref-bar select:hover { background-color: rgba(0,0,0,.04); }
    .ss-pref-bar .sep { width: 1px; height: 22px; background: #e8e8ec; }
    .ss-pref-bar .toggle {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 100px;
      background: transparent; border: 0; cursor: pointer; font: inherit;
      color: #0a1f3a;
    }
    .ss-pref-bar .toggle:hover { background: rgba(0,0,0,.04); }
    .ss-pref-bar .toggle.on { background: #fff4e0; color: #ef6c00; }
    @media (max-width: 600px) {
      .ss-pref-bar { left: 8px; right: 8px; justify-content: center; flex-wrap: wrap; border-radius: 12px; }
    }

    /* ====================================================
       Mode popup — one-time modal on first visit.
       Replaces the old top-of-page mode bar.
       ==================================================== */
    .ss-mode-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(10,31,58,.55);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      opacity: 0;
      animation: ssModalFade .25s ease-out forwards;
    }
    @keyframes ssModalFade { to { opacity: 1; } }
    .ss-mode-modal {
      background: #fff;
      border-radius: 20px;
      max-width: 540px; width: 100%;
      box-shadow: 0 24px 80px rgba(10,31,58,.30);
      padding: 36px 32px 30px;
      position: relative;
      transform: translateY(20px) scale(.96);
      opacity: 0;
      animation: ssModalIn .35s cubic-bezier(.2,.85,.3,1.05) forwards .05s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    @keyframes ssModalIn { to { transform: translateY(0) scale(1); opacity: 1; } }
    .ss-mode-modal .close {
      position: absolute; top: 14px; right: 14px;
      background: none; border: 0;
      width: 36px; height: 36px;
      border-radius: 50%; cursor: pointer;
      color: #50575e;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
      font-size: 18px;
    }
    .ss-mode-modal .close:hover { background: #f0f0f1; color: #0a1f3a; }
    .ss-mode-modal h2 {
      font-size: 24px; font-weight: 800; color: #0a1f3a;
      letter-spacing: -.5px;
      margin: 0 0 8px;
    }
    .ss-mode-modal p.sub {
      color: #50575e; font-size: 14px;
      margin: 0 0 24px; line-height: 1.5;
    }
    .ss-mode-options {
      display: grid; gap: 8px;
    }
    .ss-mode-option {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 18px;
      background: #fafbfc;
      border: 1.5px solid #e8e8ec;
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all .12s;
    }
    .ss-mode-option:hover {
      border-color: #ff9800;
      background: #fff8e8;
      transform: translateX(2px);
    }
    .ss-mode-option .icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid #e8e8ec;
      display: flex; align-items: center; justify-content: center;
      color: #0a1f3a;
      flex-shrink: 0;
    }
    .ss-mode-option .text {
      flex: 1;
    }
    .ss-mode-option .text strong {
      display: block;
      color: #0a1f3a; font-weight: 700; font-size: 15px;
      margin-bottom: 2px;
    }
    .ss-mode-option .text span {
      color: #50575e; font-size: 13px; line-height: 1.4;
    }
    .ss-mode-option .arrow {
      color: #c3c4c7; font-size: 18px;
      transition: transform .15s, color .15s;
    }
    .ss-mode-option:hover .arrow { color: #ff9800; transform: translateX(4px); }
    .ss-mode-skip {
      display: block;
      margin: 16px auto 0;
      background: none; border: 0;
      color: #50575e; font-size: 13px;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .ss-mode-skip:hover { color: #0a1f3a; }
    @media (max-width: 480px) {
      .ss-mode-modal { padding: 28px 22px 22px; border-radius: 16px; }
      .ss-mode-modal h2 { font-size: 20px; }
      .ss-mode-option { padding: 14px 16px; gap: 12px; }
      .ss-mode-option .icon { width: 40px; height: 40px; }
    }

    /* Tiny "context" chip in the pref bar to re-open the modal */
    .ss-mode-chip {
      background: transparent; border: 0;
      padding: 6px 10px; border-radius: 100px;
      color: #50575e; font-size: 12px; font-weight: 500;
      cursor: pointer; font-family: inherit;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .ss-mode-chip:hover { background: rgba(0,0,0,.04); color: #0a1f3a; }
    .ss-mode-chip strong { color: #ff9800; font-weight: 700; }

    .ss-distance-badge {
      position: absolute; top: 10px; left: 56px; z-index: 2;
      background: rgba(255,255,255,.92); color: #0a1f3a;
      padding: 3px 10px; border-radius: 100px;
      font-size: 11px; font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,.08);
    }
    .ss-distance-badge.far { background: rgba(255,193,7,.92); }
    .ss-distance-badge.veryfar { background: rgba(244,67,54,.85); color: #fff; }

    .ss-family-overlay {
      display: none;
    }
    body.family-mode .ss-family-overlay {
      display: block;
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      background: #fff8e8; color: #8a6500; border: 1px solid #f5e1a4;
      padding: 8px 16px; border-radius: 100px;
      font-size: 13px; font-weight: 600; z-index: 65;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,.08);
    }

    /* Hide adults-only cards when family mode is on. The .club-card-wrap is the
       <article> grid cell; .club-card is the inner anchor. Hide the wrapper
       so the grid collapses cleanly. */
    body.family-mode .club-card-wrap[data-adults="1"],
    body.family-mode .club-card[data-adults="1"] { display: none !important; }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /* ============================================================
     PREF BAR  (language + currency + family toggle)
     ============================================================ */
  function renderPrefBar() {
    if (document.querySelector('.ss-pref-bar')) return;
    // Friendly label for current mode (shown in the Context chip)
    const modeLabel = prefs.mode === 'living'  ? t('mode.living')
                    : prefs.mode === 'cruise'  ? t('mode.day')
                    : t('mode.visiting');

    const bar = document.createElement('div');
    bar.className = 'ss-pref-bar';
    bar.innerHTML =
      '<button class="ss-mode-chip" id="ss-mode-chip" title="Change context">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>' +
        '<strong>' + modeLabel + '</strong>' +
      '</button>' +
      '<span class="sep"></span>' +
      '<select id="ss-lang" aria-label="' + t('lang.label') + '">' +
        LANGS.map(l => '<option value="'+l.code+'"' + (l.code===prefs.lang?' selected':'') + '>' + l.flag + ' ' + l.name + '</option>').join('') +
      '</select>' +
      '<span class="sep"></span>' +
      '<select id="ss-cur" aria-label="' + t('cur.label') + '">' +
        CURRENCIES.map(c => '<option value="'+c.code+'"' + (c.code===prefs.currency?' selected':'') + '>' + c.symbol + ' ' + c.code + '</option>').join('') +
      '</select>' +
      '<span class="sep"></span>' +
      '<button class="toggle' + (prefs.family ? ' on' : '') + '" id="ss-family" title="' + t('family.label') + '">' + t('family.label') + '</button>';
    document.body.appendChild(bar);

    bar.querySelector('#ss-mode-chip').addEventListener('click', showModePopup);
    bar.querySelector('#ss-lang').addEventListener('change', e => {
      prefs.lang = e.target.value; savePrefs(); applyAll();
    });
    bar.querySelector('#ss-cur').addEventListener('change', e => {
      prefs.currency = e.target.value; savePrefs(); reprice(); refreshPrefBar();
    });
    bar.querySelector('#ss-family').addEventListener('click', () => {
      prefs.family = !prefs.family; savePrefs();
      document.body.classList.toggle('family-mode', prefs.family);
      bar.querySelector('#ss-family').classList.toggle('on', prefs.family);
      if (prefs.family) toast(t('family.on'));
    });

    // Family overlay banner (subtle, no emoji)
    const fo = document.createElement('div');
    fo.className = 'ss-family-overlay';
    fo.textContent = t('family.label') + ' — on';
    document.body.appendChild(fo);
  }
  function refreshPrefBar() {
    const bar = document.querySelector('.ss-pref-bar'); if (!bar) return;
    bar.remove();
    document.querySelector('.ss-family-overlay')?.remove();
    renderPrefBar();
    // Update labels in existing UI
    applyTranslations();
  }

  /* ============================================================
     MODE BAR  (Visiting / Living / Cruise) — top of page
     ============================================================ */
  /**
   * Show the mode-picker modal. Called automatically on first visit, or manually
   * via the "Context" chip in the pref bar. Sets prefs.mode and dismisses.
   */
  function showModePopup() {
    if (document.querySelector('.ss-mode-backdrop')) return;
    if (document.body.hasAttribute('data-no-mode-bar')) return;
    if (/visiting\.html|living\.html/.test(location.pathname)) return;

    const heading = prefs.lang === 'mt' ? 'Min int?'
                  : prefs.lang === 'it' ? 'Chi sei?'
                  : 'Who are you?';
    const sub     = prefs.lang === 'mt' ? 'Niperonalizzaw kif tara s-sit.'
                  : prefs.lang === 'it' ? 'Personalizziamo cosa vedi.'
                  : "We'll tailor what you see.";
    const skip    = prefs.lang === 'mt' ? 'Aqbeż għalissa'
                  : prefs.lang === 'it' ? 'Salta per ora'
                  : 'Skip for now';

    // Inline SVG icons for each mode
    const ICONS = {
      visiting: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
      living:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-4v-6h-8v6H4a1 1 0 0 1-1-1z"/></svg>',
      cruise:   '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v15M5 12a7 7 0 0 0 14 0M5 12h2M19 12h-2M9 11h6"/></svg>',
    };

    const SUBLINES = prefs.lang === 'it' ? {
      visiting: 'Crea il mio itinerario di spiagge',
      living:   'Pass stagionale + spiagge per residenti',
      cruise:   "Vicino al porto, prima dell'orario di partenza",
    } : prefs.lang === 'mt' ? {
      visiting: 'Bena pjan ta\' bajja personalizzat',
      living:   'Pass tas-sajf + bajjiet għar-residenti',
      cruise:   'Eperjenzi qrib il-port',
    } : {
      visiting: "Build me a custom beach itinerary",
      living:   'Resident pass + locals-only beaches',
      cruise:   'Half-day picks near the cruise port',
    };

    const modal = document.createElement('div');
    modal.className = 'ss-mode-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'ss-mode-h');
    modal.innerHTML =
      '<div class="ss-mode-modal">' +
        '<button class="close" aria-label="Close">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<h2 id="ss-mode-h">' + heading + '</h2>' +
        '<p class="sub">' + sub + '</p>' +
        '<div class="ss-mode-options">' +
          '<a class="ss-mode-option" href="visiting.html" data-mode="visiting">' +
            '<span class="icon">' + ICONS.visiting + '</span>' +
            '<span class="text"><strong>' + t('mode.visiting') + '</strong><span>' + SUBLINES.visiting + '</span></span>' +
            '<span class="arrow">→</span>' +
          '</a>' +
          '<a class="ss-mode-option" href="living.html" data-mode="living">' +
            '<span class="icon">' + ICONS.living + '</span>' +
            '<span class="text"><strong>' + t('mode.living') + '</strong><span>' + SUBLINES.living + '</span></span>' +
            '<span class="arrow">→</span>' +
          '</a>' +
          '<a class="ss-mode-option" href="visiting.html?mode=cruise" data-mode="cruise">' +
            '<span class="icon">' + ICONS.cruise + '</span>' +
            '<span class="text"><strong>' + t('mode.day') + '</strong><span>' + SUBLINES.cruise + '</span></span>' +
            '<span class="arrow">→</span>' +
          '</a>' +
        '</div>' +
        '<button class="ss-mode-skip" type="button">' + skip + '</button>' +
      '</div>';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    function close() {
      modal.style.opacity = '0';
      document.body.style.overflow = '';
      setTimeout(() => modal.remove(), 200);
      localStorage.setItem('ss_mode_seen', '1');
    }

    modal.querySelector('.close').addEventListener('click', close);
    modal.querySelector('.ss-mode-skip').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', function escClose(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escClose); }
    });
    modal.querySelectorAll('[data-mode]').forEach(a => a.addEventListener('click', () => {
      prefs.mode = a.dataset.mode; savePrefs();
      localStorage.setItem('ss_mode_seen', '1');
    }));
  }

  /**
   * Auto-show on first visit only. Delay slightly so the page has visual
   * weight before the modal interrupts.
   */
  function maybeAutoShowMode() {
    if (localStorage.getItem('ss_mode_seen') === '1') return;
    if (document.body.hasAttribute('data-no-mode-bar')) return;
    if (/visiting\.html|living\.html/.test(location.pathname)) return;
    setTimeout(showModePopup, 1400);
  }

  /* ============================================================
     CURRENCY — re-price every visible price on the page
     Walks every [data-eur="N"] element and overwrites its text
     with the formatted price in the current currency.
     ============================================================ */
  function reprice() {
    document.querySelectorAll('[data-eur]').forEach(el => {
      const eur = +el.dataset.eur;
      if (!isNaN(eur)) el.textContent = formatPrice(eur);
    });
  }

  /* ============================================================
     FAMILY MODE — annotate cards with data-adults="1" if their
     "features" or "bestFor" contain "Adults only"
     ============================================================ */
  function applyFamilyMarks() {
    const clubs = (window.SUNSPOT_CLUBS || []);
    const adultsOnly = {};
    clubs.forEach(v => {
      const all = [].concat(v.features || [], v.bestFor || [], v.amenities || []);
      adultsOnly[v.id] = all.some(x => /adults?\s*only/i.test(x));
    });
    document.querySelectorAll('a.club-card[href*="club.html?club="]').forEach(card => {
      const m = card.href.match(/club=([^&]+)/);
      if (!m) return;
      const slug = decodeURIComponent(m[1]);
      if (adultsOnly[slug]) {
        card.dataset.adults = '1';
        // also mark the .club-card-wrap article so the grid cell collapses
        const wrap = card.closest('.club-card-wrap');
        if (wrap) wrap.dataset.adults = '1';
      }
    });
    if (prefs.family) document.body.classList.add('family-mode');
  }

  /* ============================================================
     DISTANCE-FROM-X
     Origin = one of: hotel/area preset OR user geolocation
     Adds .ss-distance-badge to each card with "X min by car"
     ============================================================ */
  const ORIGINS = [
    { id:'sliema',   name: 'Sliema',                lat: 35.9131, lng: 14.5042 },
    { id:'paceville',name: 'St Julian\'s / Paceville', lat: 35.9244, lng: 14.4905 },
    { id:'valletta', name: 'Valletta (cruise port)', lat: 35.8957, lng: 14.5147 },
    { id:'mellieha', name: 'Mellieħa',              lat: 35.9572, lng: 14.3623 },
    { id:'qawra',    name: 'Bugibba / Qawra',       lat: 35.9580, lng: 14.4220 },
    { id:'airport',  name: 'Malta Airport (MLA)',   lat: 35.8575, lng: 14.4775 },
    { id:'gozo-port',name: 'Mġarr Gozo (ferry)',    lat: 36.0245, lng: 14.2992 },
  ];

  // Haversine distance in km
  function dist(a, b) {
    const toRad = d => d * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const x = Math.sin(dLat/2)**2 +
              Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
              Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  }
  function minutesByCar(km) {
    // Rough Malta driving estimate: avg 25 km/h including traffic
    return Math.max(3, Math.round(km / 25 * 60));
  }

  function applyDistanceBadges() {
    if (!prefs.origin) return;
    const origin = prefs.origin.coords;
    if (!origin) return;
    const clubs = (window.SUNSPOT_CLUBS || []);
    const bySlug = {}; clubs.forEach(v => bySlug[v.id] = v);
    document.querySelectorAll('a.club-card[href*="club.html?club="]').forEach(card => {
      const m = card.href.match(/club=([^&]+)/);
      if (!m) return;
      const v = bySlug[decodeURIComponent(m[1])];
      if (!v || !v.coords) return;
      // Remove existing badge
      card.querySelector('.ss-distance-badge')?.remove();
      const km = dist(origin, v.coords);
      const mins = minutesByCar(km);
      const cls = mins > 35 ? 'veryfar' : mins > 20 ? 'far' : '';
      const badge = document.createElement('span');
      badge.className = 'ss-distance-badge ' + cls;
      badge.textContent = mins + ' ' + t('minutes') + ' · ' + km.toFixed(1) + 'km';
      const host = card.querySelector('.club-img, .img, .card-img') || card.firstElementChild || card;
      host.appendChild(badge);
    });
  }

  function injectOriginSelector() {
    if (document.querySelector('#ss-origin-pick')) return;
    const sea = document.querySelector('.ss-sea-state');
    if (!sea) return;
    // Append the origin block inside the sea-state widget. CSS hides it when
    // the widget is collapsed (default state) and reveals it on expand.
    const block = document.createElement('div');
    block.className = 'ss-origin-block';
    block.innerHTML =
      '<label style="font-size:11px;color:#50575e;display:block;margin-bottom:4px;font-weight:600">' +
        t('origin.label') + ':' +
      '</label>' +
      '<select id="ss-origin-pick" style="border:1px solid #e8e8ec;border-radius:6px;padding:6px 8px;font-size:12px;width:100%;background:#fff">' +
        '<option value="">—</option>' +
        ORIGINS.map(o => '<option value="' + o.id + '"' + (prefs.origin?.id===o.id?' selected':'') + '>📍 ' + o.name + '</option>').join('') +
        '<option value="__me">📡 ' + t('origin.use') + '</option>' +
      '</select>';
    sea.appendChild(block);
    block.querySelector('select').addEventListener('change', handleOriginChange);
    // Stop click on the select from collapsing the pill
    block.addEventListener('click', e => e.stopPropagation());
  }

  function handleOriginChange(e) {
    const v = e.target.value;
    if (!v) {
      prefs.origin = null; savePrefs();
      document.querySelectorAll('.ss-distance-badge').forEach(b => b.remove());
      return;
    }
    if (v === '__me') {
      if (!navigator.geolocation) { toast('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        prefs.origin = { id:'me', name:'Your location', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }};
        savePrefs();
        applyDistanceBadges();
        toast('📍 Distances updated for your location');
      }, () => toast('Could not get your location'));
      return;
    }
    const o = ORIGINS.find(x => x.id === v);
    if (o) {
      prefs.origin = { id: o.id, name: o.name, coords: { lat: o.lat, lng: o.lng } };
      savePrefs();
      applyDistanceBadges();
      toast('📍 Distances from ' + o.name);
    }
  }

  /* ============================================================
     TRANSLATIONS — apply to nav, common buttons
     ============================================================ */
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    // Common nav patterns — relabel by href match
    document.querySelectorAll('header nav a, .site-header nav a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (/^index\.html$/.test(href) || /^\.?\/?$/.test(href)) a.textContent = t('nav.beaches');
      else if (/guides\.html/.test(href)) a.textContent = t('nav.guides');
      else if (/about\.html/.test(href)) a.textContent = t('nav.about');
      else if (/bookings\.html/.test(href)) a.textContent = t('nav.bookings');
    });
    // Sign-in chip
    document.querySelectorAll('.btn-ghost').forEach(b => {
      if (b.textContent.trim().toLowerCase() === 'sign in') b.textContent = t('nav.signin');
    });
    document.documentElement.setAttribute('lang', prefs.lang === 'en' ? 'en-MT' : prefs.lang);
  }

  /* ============================================================
     toast (shared)
     ============================================================ */
  function toast(msg) {
    const SF = window.SunspotFeatures;
    if (SF && typeof SF.toast === 'function') return SF.toast(msg);
    // Fallback
    let t = document.querySelector('.ss-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'ss-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ============================================================
     Compare-drawer collision handling (raise pref bar when visible)
     ============================================================ */
  function watchCompareDrawer() {
    const drawer = document.querySelector('.ss-compare-drawer');
    if (!drawer || !window.MutationObserver) return;
    new MutationObserver(() => {
      document.body.classList.toggle('has-compare', drawer.classList.contains('open'));
    }).observe(drawer, { attributes: true, attributeFilter: ['class'] });
  }

  /* ============================================================
     Boot
     ============================================================ */
  function applyAll() {
    applyTranslations();
    refreshPrefBar();
    applyFamilyMarks();
    applyDistanceBadges();
    reprice();
  }

  function boot() {
    renderPrefBar();
    // Don't interrupt first-time visitors with a modal — they can open it
    // anytime via the "Context" chip in the pref bar.
    // maybeAutoShowMode();
    setTimeout(injectOriginSelector, 200);   // after features.js has rendered sea-state
    applyTranslations();
    applyFamilyMarks();
    setTimeout(applyDistanceBadges, 300);
    watchCompareDrawer();

    // Re-apply when the grid re-renders
    const grid = document.getElementById('club-grid') ||
                 document.getElementById('thumbs-grid') ||
                 document.querySelector('.club-thumbs-grid') ||
                 document.body;
    if (grid && window.MutationObserver) {
      let timer;
      new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(() => { applyFamilyMarks(); applyDistanceBadges(); reprice(); }, 100);
      }).observe(grid, { childList: true, subtree: true });
    }
    // First-paint reprice (covers any prices rendered before audiences.js loaded)
    setTimeout(reprice, 250);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 100));
  } else {
    setTimeout(boot, 100);
  }

  // Expose API
  window.SunspotAudiences = {
    t, formatPrice, getPrefs: () => Object.assign({}, prefs),
    setPref: (k, v) => { prefs[k] = v; savePrefs(); applyAll(); },
    distance: dist, minutesByCar, ORIGINS, LANGS, CURRENCIES,
  };
})();
