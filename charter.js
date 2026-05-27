/* ============================================================
   Sunspot — Charter detail page renderer.

   URL: /charter.html?c=<charter-id>

   Reads experiences-data.js (window.SUNSPOT_EXPERIENCES), finds the
   matching entry, and renders a deep editorial page with:
     - hero photo + headline
     - intro lede
     - boat spec card (sticky)
     - itinerary timeline
     - what's included / not included
     - what to bring
     - FAQ
     - related charters
   Also rewrites <title>, <meta description>, OG/Twitter, canonical
   and emits a TouristTrip + Service JSON-LD block for SEO. The
   page works without JS only as a fallback message, since 95% of
   our value is JS-rendered detail — but the static <head> meta is
   enough for a crawler to know what the URL is.
   ============================================================ */
(function () {
 'use strict';

 const ORIGIN = 'https://sunspot.mt';

 function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 }
 function fmtDuration(h) {
  if (!h) return '—';
  if (h >= 24) { const d = Math.round(h/24); return d + ' day' + (d===1?'':'s'); }
  if (h >= 1)  return h + ' hr' + (h===1?'':'s');
  return Math.round(h*60) + ' min';
 }

 function getId() {
  return new URLSearchParams(location.search).get('c') || '';
 }

 function setMeta(e) {
  const title = e.name + ' — Charter — Sunspot';
  document.title = title;
  const setText = (id, v) => { const el = document.getElementById(id); if (el && 'content' in el) el.setAttribute('content', v); };
  setText('meta-desc', e.summary);
  setText('og-title', title);
  setText('og-desc', e.summary);
  if (e.photo) setText('og-image', e.photo);
  const can = document.getElementById('canonical');
  if (can) can.setAttribute('href', ORIGIN + '/charter.html?c=' + e.id);
 }

 function emitSchema(e) {
  const trip = {
   '@context': 'https://schema.org',
   '@type': 'TouristTrip',
   '@id': ORIGIN + '/charter.html?c=' + e.id + '#trip',
   name: e.name,
   description: e.summary,
   url: ORIGIN + '/charter.html?c=' + e.id,
   image: e.photo,
   touristType: 'Private boat charter, Malta',
   provider: { '@type': 'Organization', name: e.operator },
   itinerary: {
     '@type': 'Place',
     name: e.hub || 'Malta',
     address: { '@type': 'PostalAddress', addressCountry: 'MT' },
   },
   offers: {
     '@type': 'Offer',
     price: e.price,
     priceCurrency: 'EUR',
     url: ORIGIN + '/charter.html?c=' + e.id,
     availability: 'https://schema.org/InStock',
     validFrom: '2026-05-01',
   },
  };
  if (e.duration_h) trip.subjectOf = { '@type': 'Event', duration: 'PT' + Math.round(e.duration_h) + 'H' };
  if (e.max_pax)    trip.maximumAttendeeCapacity = e.max_pax;

  const blocks = [trip];
  // Breadcrumb
  blocks.push({
   '@context': 'https://schema.org',
   '@type': 'BreadcrumbList',
   itemListElement: [
     { '@type': 'ListItem', position: 1, name: 'Home',     item: ORIGIN + '/' },
     { '@type': 'ListItem', position: 2, name: 'Charters', item: ORIGIN + '/charters.html' },
     { '@type': 'ListItem', position: 3, name: e.name,     item: ORIGIN + '/charter.html?c=' + e.id },
   ],
  });
  if (e.faq && e.faq.length) {
   blocks.push({
     '@context': 'https://schema.org',
     '@type': 'FAQPage',
     mainEntity: e.faq.map(q => ({
       '@type': 'Question', name: q.q,
       acceptedAnswer: { '@type': 'Answer', text: q.a },
     })),
   });
  }
  const el = document.getElementById('ld-charter');
  if (el) el.textContent = JSON.stringify(blocks);
 }

 function renderSpec(spec, crew) {
  if (!spec && !crew) return '';
  const rows = [];
  if (spec) {
   if (spec.boat)      rows.push(['Boat',     spec.boat]);
   if (spec.length_m)  rows.push(['Length',   spec.length_m + ' m']);
   if (spec.year)      rows.push(['Year',     spec.year]);
   if (spec.engine)    rows.push(['Engine',   spec.engine]);
   if (spec.cabins)    rows.push(['Cabins',   spec.cabins]);
   if (spec.heads)     rows.push(['Heads',    spec.heads]);
  }
  if (crew) {
   const list = [];
   if (crew.skipper) list.push('Skipper');
   if (crew.steward) list.push('Steward');
   if (crew.chef)    list.push('Chef');
   if (list.length)  rows.push(['Crew', list.join(' · ')]);
  }
  if (!rows.length) return '';
  return '<aside class="ch-spec"><h3>Boat &amp; crew</h3><dl>' +
    rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('') +
    '</dl></aside>';
 }

 function renderItinerary(steps) {
  if (!steps || !steps.length) return '';
  return '<section class="ch-section"><h2>The day, broadly.</h2>' +
   '<ol class="ch-itin">' +
   steps.map(s =>
     '<li class="ch-itin-step">' +
       '<span class="ch-itin-time">' + esc(s.time) + '</span>' +
       '<h4>' + esc(s.name) + '</h4>' +
       '<p>' + esc(s.detail) + '</p>' +
     '</li>'
   ).join('') +
   '</ol></section>';
 }

 function renderList(items, klass, title) {
  if (!items || !items.length) return '';
  return '<section class="ch-section"><h2>' + esc(title) + '</h2>' +
   '<ul class="ch-list ' + klass + '">' +
     items.map(i => '<li>' + esc(i) + '</li>').join('') +
   '</ul></section>';
 }

 function renderFAQ(faq) {
  if (!faq || !faq.length) return '';
  return '<section class="ch-section ch-faq"><h2>Frequently asked.</h2>' +
   faq.map(q =>
     '<details><summary>' + esc(q.q) + '</summary>' +
     '<p>' + esc(q.a) + '</p></details>'
   ).join('') +
   '</section>';
 }

 function renderRelated(currentId, all) {
  const others = all.filter(e =>
   e.cat === 'private-charter' && e.id !== currentId
  ).slice(0, 3);
  if (!others.length) return '';
  return '<section class="ch-section"><h2>Other charters.</h2>' +
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">' +
   others.map(e =>
     '<a href="charter.html?c=' + esc(e.id) + '" style="display:block;padding:18px;background:#fafaf6;border:1px solid var(--line);border-radius:12px;text-decoration:none;color:var(--ink);">' +
       '<strong style="font-family:var(--font-display);font-size:17px;display:block;margin-bottom:4px;">' + esc(e.name) + '</strong>' +
       '<span style="font-size:13px;color:var(--muted);display:block;margin-bottom:10px;line-height:1.45;">' + esc(e.summary.slice(0, 100)) + '…</span>' +
       '<span style="color:var(--sun-deep);font-weight:600;font-size:13px;">From €' + Number(e.price).toLocaleString('en-GB') + '</span>' +
     '</a>'
   ).join('') +
   '</div></section>';
 }

 function renderNotFound(id) {
  return '<p class="ch-back"><a href="charters.html" style="color:inherit;text-decoration:none;">← Back to charters</a></p>' +
   '<h1 style="font-family:var(--font-display);font-weight:500;">We can\'t find that charter.</h1>' +
   '<p style="color:var(--muted);">The id <code style="background:#fafaf6;padding:2px 6px;border-radius:4px;">' + esc(id) + '</code> doesn\'t match anything in the catalogue. Pick another from <a href="charters.html">/charters</a>.</p>';
 }

 function render(e, all) {
  const root = document.getElementById('ch-root');
  if (!root) return;
  const hero = '<a class="ch-back" href="charters.html">← All charters</a>' +
   '<section class="ch-hero">' +
     (e.photo ? '<img src="' + esc(e.photo) + '" alt="' + esc(e.name) + '" loading="eager" fetchpriority="high">' : '') +
     '<div class="ch-hero-cap">' +
       '<span class="eyebrow">' + (e.operator ? esc(e.operator) : 'Private charter') + '</span>' +
       '<h1>' + esc(e.name) + '</h1>' +
     '</div>' +
   '</section>';

  const lede = '<p class="ch-lede">' + esc(e.summary) + '</p>';

  const left =
    '<div>' +
    lede +
    renderItinerary(e.itinerary) +
    renderList(e.includes,     'included', 'What\'s included.') +
    renderList(e.not_included, 'excluded', 'Not included.') +
    renderList(e.bring,        'included', 'What to bring.') +
    renderFAQ(e.faq) +
    renderRelated(e.id, all) +
    '</div>';

  const book = '<aside class="ch-book">' +
    '<p class="price-from">From</p>' +
    '<p class="price">€' + Number(e.price).toLocaleString('en-GB') + '<small>for the boat</small></p>' +
    '<div class="meta">' +
      '<div>Duration<strong>' + esc(fmtDuration(e.duration_h)) + '</strong></div>' +
      '<div>Capacity<strong>up to ' + esc(e.max_pax || '—') + '</strong></div>' +
      '<div>Departs<strong>' + esc(e.hub || '—') + '</strong></div>' +
      '<div>Operator<strong>' + esc(e.operator || '—') + '</strong></div>' +
    '</div>' +
    '<a class="cta" href="experiences.html?e=' + esc(e.id) + '">Check availability →</a>' +
    '<p class="terms">Free cancellation up to 72 hours before the sail. Weather cancellations refunded automatically. <a href="faq.html">More on charter terms</a>.</p>' +
   '</aside>';

  const spec = renderSpec(e.spec, e.crew);

  root.innerHTML = hero +
    '<div class="ch-layout">' +
    left +
    '<div>' + book + (spec ? '<div style="margin-top:18px;">' + spec + '</div>' : '') + '</div>' +
    '</div>';
 }

 function boot() {
  const id = getId();
  const all = window.SUNSPOT_EXPERIENCES || [];
  const e = all.find(x => x.id === id);
  if (!e) {
   const root = document.getElementById('ch-root');
   if (root) root.innerHTML = renderNotFound(id);
   return;
  }
  setMeta(e);
  emitSchema(e);
  render(e, all);
 }

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
 } else {
  boot();
 }
})();
