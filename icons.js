// ============================================================
// Sunspot — SVG icon library
// Minimal stroke icons. Use SS_ICONS.name(size?, className?) to render.
// All icons inherit color from currentColor so they pick up CSS easily.
// ============================================================
(function () {
  'use strict';

  function svg(viewBox, body, size, cls) {
    const s = size || 18;
    const c = cls ? ' class="' + cls + '"' : '';
    return '<svg' + c + ' xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s +
           '" viewBox="' + viewBox + '" fill="none" stroke="currentColor" stroke-width="1.6" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  const ICONS = {
    // BRAND
    sunMark: (s, c) => '<span class="ss-brand-mark"' + (c?' class="'+c+'"':'') +
                       ' style="display:inline-block;width:' + (s||28) + 'px;height:' + (s||28) +
                       'px;background:radial-gradient(circle at 70% 28%, #fff5e1 8%, #ffb74d 14%, #ff9800 100%);border-radius:50%"></span>',

    // NAVIGATION / SECTIONS
    location: (s, c) => svg('0 0 24 24',
      '<path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>', s, c),
    search: (s, c) => svg('0 0 24 24',
      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', s, c),
    menu: (s, c) => svg('0 0 24 24', '<path d="M4 7h16M4 12h16M4 17h16"/>', s, c),
    close: (s, c) => svg('0 0 24 24', '<path d="M6 6l12 12M18 6l-6 6L6 18"/>', s, c),
    plus:  (s, c) => svg('0 0 24 24', '<path d="M12 5v14M5 12h14"/>', s, c),
    minus: (s, c) => svg('0 0 24 24', '<path d="M5 12h14"/>', s, c),
    arrowRight: (s, c) => svg('0 0 24 24', '<path d="M5 12h14M13 6l6 6-6 6"/>', s, c),
    arrowLeft: (s, c)  => svg('0 0 24 24', '<path d="M19 12H5M11 18l-6-6 6-6"/>', s, c),
    chevronDown: (s, c) => svg('0 0 24 24', '<path d="M6 9l6 6 6-6"/>', s, c),
    chevronRight:(s, c) => svg('0 0 24 24', '<path d="M9 6l6 6-6 6"/>', s, c),
    sliders: (s, c) => svg('0 0 24 24',
      '<path d="M4 6h7M16 6h4M4 12h2M11 12h9M4 18h13M19 18h1"/><circle cx="13" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="18" cy="18" r="1.5"/>', s, c),
    grid: (s, c) => svg('0 0 24 24',
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', s, c),
    list: (s, c) => svg('0 0 24 24',
      '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>', s, c),
    map: (s, c) => svg('0 0 24 24',
      '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>', s, c),

    // AUDIENCE / CONTEXT
    suitcase: (s, c) => svg('0 0 24 24',
      '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>', s, c),
    home: (s, c) => svg('0 0 24 24',
      '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-4v-6h-8v6H4a1 1 0 0 1-1-1z"/>', s, c),
    anchor: (s, c) => svg('0 0 24 24',
      '<circle cx="12" cy="5" r="2"/><path d="M12 7v15M5 12a7 7 0 0 0 14 0M5 12h2M19 12h-2M9 11h6"/>', s, c),
    family: (s, c) => svg('0 0 24 24',
      '<circle cx="8" cy="7" r="2.5"/><circle cx="16" cy="7" r="2.5"/><path d="M3 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2M13 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2"/><circle cx="12" cy="14.5" r="1.2"/>', s, c),
    user: (s, c) => svg('0 0 24 24',
      '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>', s, c),
    globe: (s, c) => svg('0 0 24 24',
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', s, c),

    // BEACH / SEA
    sun: (s, c) => svg('0 0 24 24',
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>', s, c),
    wave: (s, c) => svg('0 0 24 24',
      '<path d="M2 12c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 18c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/>', s, c),
    cloud: (s, c) => svg('0 0 24 24',
      '<path d="M6 18a4 4 0 0 1 1-7.9 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 18 18z"/>', s, c),
    wind: (s, c) => svg('0 0 24 24',
      '<path d="M3 8h13a3 3 0 1 0-3-3M3 12h17a3 3 0 1 1-3 3M3 16h10"/>', s, c),
    palm: (s, c) => svg('0 0 24 24',
      '<path d="M12 22V10M12 10c-1-3-4-4-6-3M12 10c1-3 4-4 6-3M12 10c-2-2-2-5 0-6M12 10c2 2 5 1 6-2M12 10c-2 2-5 1-6-2"/>', s, c),
    sunbed: (s, c) => svg('0 0 24 24',
      '<path d="M2 18h20M4 18v2M20 18v2M3 14h18l-1-4H4z"/><circle cx="8" cy="7" r="2"/>', s, c),
    cabana: (s, c) => svg('0 0 24 24',
      '<path d="M3 11 12 3l9 8M5 11v10h14V11M9 21v-7h6v7"/>', s, c),
    boat: (s, c) => svg('0 0 24 24',
      '<path d="M3 16h18l-2 5H5zM6 16V8l6-3 6 3v8M12 5v11"/>', s, c),

    // ACTIONS
    heart: (s, c) => svg('0 0 24 24',
      '<path d="M20.8 5.6a5 5 0 0 0-7 0L12 7.4l-1.8-1.8a5 5 0 0 0-7 7l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7z"/>', s, c),
    heartFilled: (s, c) => svg('0 0 24 24',
      '<path d="M20.8 5.6a5 5 0 0 0-7 0L12 7.4l-1.8-1.8a5 5 0 0 0-7 7l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7z" fill="currentColor"/>', s, c),
    compare: (s, c) => svg('0 0 24 24',
      '<path d="M7 17H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3M17 17h3a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3M9 4v16M15 4v16M10 9l-2 2 2 2M14 13l2-2-2-2"/>', s, c),
    share: (s, c) => svg('0 0 24 24',
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>', s, c),
    cart: (s, c) => svg('0 0 24 24',
      '<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>', s, c),
    bag: (s, c) => svg('0 0 24 24',
      '<path d="M5 7h14l-1 14H6zM9 7V5a3 3 0 0 1 6 0v2"/>', s, c),
    star: (s, c) => svg('0 0 24 24',
      '<path d="m12 3 2.7 6 6.3.5-4.8 4.4 1.5 6.3L12 17l-5.7 3.2 1.5-6.3L3 9.5 9.3 9z"/>', s, c),
    starFilled: (s, c) => svg('0 0 24 24',
      '<path d="m12 3 2.7 6 6.3.5-4.8 4.4 1.5 6.3L12 17l-5.7 3.2 1.5-6.3L3 9.5 9.3 9z" fill="currentColor"/>', s, c),
    calendar: (s, c) => svg('0 0 24 24',
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>', s, c),
    clock: (s, c) => svg('0 0 24 24',
      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s, c),
    check: (s, c) => svg('0 0 24 24', '<path d="M5 13l4 4 10-10"/>', s, c),
    info: (s, c) => svg('0 0 24 24',
      '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v6"/>', s, c),
    warning: (s, c) => svg('0 0 24 24',
      '<path d="M12 3 2 21h20zM12 10v5M12 18v.01"/>', s, c),

    // COMMS
    mail: (s, c) => svg('0 0 24 24',
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>', s, c),
    phone: (s, c) => svg('0 0 24 24',
      '<path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2 17 17 0 0 1-15-15 2 2 0 0 1 2-2z"/>', s, c),
    instagram: (s, c) => svg('0 0 24 24',
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>', s, c),
    facebook: (s, c) => svg('0 0 24 24',
      '<path d="M14 22v-9h3l1-4h-4V6a1 1 0 0 1 1-1h3V1h-3a5 5 0 0 0-5 5v3H7v4h3v9z"/>', s, c),
    twitter: (s, c) => svg('0 0 24 24',
      '<path d="M4 4l7.5 9.5L4 22h2.5l6-7 5.5 7H22l-7.8-10L21.5 4H19l-5.5 6.5L8 4z"/>', s, c),

    // SHOP
    truck: (s, c) => svg('0 0 24 24',
      '<rect x="2" y="8" width="11" height="9" rx="1"/><path d="M13 11h5l3 3v3h-8zM5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/>', s, c),
    refresh: (s, c) => svg('0 0 24 24',
      '<path d="M3 12a9 9 0 0 1 15.5-6.5L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.5 6.5L3 16M3 20v-4h4"/>', s, c),
    leaf: (s, c) => svg('0 0 24 24',
      '<path d="M4 20c10-1 16-7 17-17C11 4 5 10 4 20zM4 20l9-9"/>', s, c),
    lock: (s, c) => svg('0 0 24 24',
      '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', s, c),
    package: (s, c) => svg('0 0 24 24',
      '<path d="M3 7 12 3l9 4v10l-9 4-9-4zM12 12l9-5M12 12v9M12 12 3 7"/>', s, c),
  };

  window.SS_ICONS = ICONS;
})();
