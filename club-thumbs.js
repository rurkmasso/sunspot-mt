// ==========================================================
// Sunspot — listing renderer (cards + filters)
// ==========================================================
(function () {
 'use strict';

 const CLUBS = window.SUNSPOT_CLUBS || [];
 const CATS = window.SUNSPOT_CATEGORIES || {};

 const REGIONS = {
 all: 'Malta &amp; Gozo',
 north: 'North Malta',
 central: 'Central Malta',
 south: 'South Malta',
 gozo: 'Gozo',
 comino: 'Comino',
 };

 function spotsClass(n) {
 return n <= 10 ? 'avail-low' : n <= 25 ? 'avail-medium' : 'avail-good';
 }

 function buildCard(c) {
 const cat = CATS[c.category] || { label: c.category, icon: '', color: '#888' };
 const stars = ''.repeat(Math.round(c.rating));
 const photo = c.photos[0];
 const photoCount = c.photos.length;

 // Category chip on the photo
 const catChip = '<span class="cat-chip" style="background:' + cat.color + '">' + cat.icon + ' ' + cat.label + '</span>';

 // Badge (premium label)
 const badge = c.badge
 ? '<span class="badge ' + (c.badge.class || '') + '">' + c.badge.text + '</span>'
 : '';

 const photoBtn = photoCount>1
 ? '<button class="photo-btn" data-club="' + c.id + '" type="button" aria-label="View ' + photoCount + ' photos">' + photoCount + '</button>'
 : '';

 // Defer the photo until the card is near the viewport (IntersectionObserver
 // in features.js promotes data-bg → background-image when the card scrolls in).
 const thumbStyle = 'background-color:#f0f0f1;background-size:cover;background-position:center;';
 const thumbBg = photo ? ' data-bg="' + photo + '"' : '';
 const thumbAlt = ' role="img" aria-label="' + c.name + ' — photo"';

 // Different "info row" depending on bookable.
 // Each price is wrapped with data-eur so currency switcher can re-format.
 let meta, availability;
 if (c.hasBookableSunbeds) {
 const priceFmt = (window.SunspotAudiences && window.SunspotAudiences.formatPrice) || (eur =>'€' + eur);
 meta = [
 'Sunbeds <strong data-eur="' + c.sunbedFrom + '">' + priceFmt(c.sunbedFrom) + '</strong>',
 c.cabanaFrom ? 'Cabanas <strong data-eur="' + c.cabanaFrom + '">' + priceFmt(c.cabanaFrom) + '</strong>' : null,
 c.vipFrom ? 'VIP <strong data-eur="' + c.vipFrom + '">' + priceFmt(c.vipFrom) + '</strong>' : null,
 ].filter(Boolean).join(' · ');
 availability = '<p class="availability ' + spotsClass(c.spotsLeft) + '">● ' + c.spotsLeft + ' spots available</p>';
 } else {
 meta = '<span class="walk-on-pill">Walk-on · Free entry</span>';
 availability = '<p class="availability avail-good" style="color:var(--muted)">● Public beach — no booking needed</p>';
 }

 return '' +
 '<article class="club-card-wrap" data-region="' + c.region + '" data-category="' + c.category + '" data-bookable="' + c.hasBookableSunbeds + '">' +
 '<a href="club.html?club=' + c.id + '" class="club-card" aria-label="View ' + c.name + '">' +
 '<div class="club-thumb has-photo" style="' + thumbStyle + '"' + thumbBg + thumbAlt + '>' +
 catChip + badge + photoBtn +
 '</div>' +
 '<div class="club-info">' +
 '<h3>' + c.name + '</h3>' +
 '<p class="location">' + c.location + '</p>' +
 '<p class="rating"><span aria-hidden="true">' + stars + '</span><strong>' + c.rating + '</strong><span class="reviews">(' + c.reviews + ' reviews)</span></p>' +
 '<p class="summary">' + c.summary + '</p>' +
 '<p class="meta">' + meta + '</p>' +
 availability +
 '</div>' +
 '</a>' +
 '</article>';
 }

 const grid = document.getElementById('club-grid');
 if (!grid) return;

 // ---------- FACET SIDEBAR ----------
 const sidebar = document.getElementById('facet-sidebar');
 const activeFacets = { amenity: new Set(), feature: new Set(), bestFor: new Set(), price: null, rating: null };

 function buildFacetCounts() {
 // Tally how many venues have each option
 const tally = (arr, set) =>arr.forEach(v =>set.set(v, (set.get(v) || 0) + 1));
 const am = new Map(), feat = new Map(), best = new Map();
 CLUBS.forEach(c =>{
 tally(c.amenities || [], am);
 tally(c.features || [], feat);
 tally(c.bestFor || [], best);
 });
 const top = (m, n) =>[...m.entries()].sort((a,b) =>b[1] - a[1]).slice(0, n);
 return {
 amenities: top(am, 10),
 features: top(feat, 8),
 bestFor: top(best, 8),
 };
 }

 function renderFacets() {
 if (!sidebar) return;
 const f = buildFacetCounts();
 const group = (title, items, kind, key = null) =>`
 <div class="facet-group">
<h4>${title}</h4>
<ul>
${items.map(([v, n]) =>`
 <li>
<label>
<input type="checkbox" data-kind="${kind}" data-value="${v.replace(/"/g, '&quot;')}">
<span>${v}</span>
<span class="facet-count">${n}</span>
</label>
</li>
`).join('')}
</ul>
</div>`;

 sidebar.innerHTML = `
 <div class="facet-header">
<h3>Filters</h3>
<button class="link-btn" id="reset-facets">Reset</button>
</div>

<div class="facet-group">
<h4>Price</h4>
<ul>
${['Under €20','€20–€30','€30–€50','€50+'].map((p, i) =>`
 <li><label><input type="radio" name="price" data-kind="price" data-value="${i}"><span>${p}</span></label></li>
`).join('')}
</ul>
</div>

<div class="facet-group">
<h4>Min rating</h4>
<ul>
${[4.5, 4.0].map(r =>`
 <li><label><input type="radio" name="rating" data-kind="rating" data-value="${r}"><span>${r}+ <span style="color:#f9a825"></span></span></label></li>
`).join('')}
</ul>
</div>

${group('Best for', f.bestFor, 'bestFor')}
 ${group('Features', f.features, 'feature')}
 ${group('Amenities', f.amenities, 'amenity')}
 `;

 sidebar.querySelectorAll('input[type=checkbox]').forEach(cb =>{
 cb.addEventListener('change', () =>{
 const kind = cb.dataset.kind;
 const val = cb.dataset.value;
 const set = activeFacets[kind];
 if (cb.checked) set.add(val); else set.delete(val);
 applyFilters();
 });
 });
 sidebar.querySelectorAll('input[type=radio]').forEach(rb =>{
 rb.addEventListener('change', () =>{
 activeFacets[rb.dataset.kind] = rb.dataset.value;
 applyFilters();
 });
 });
 document.getElementById('reset-facets').addEventListener('click', () =>{
 activeFacets.amenity.clear();
 activeFacets.feature.clear();
 activeFacets.bestFor.clear();
 activeFacets.price = null;
 activeFacets.rating = null;
 sidebar.querySelectorAll('input').forEach(i =>{ i.checked = false; });
 applyFilters();
 });
 }
 renderFacets();

 // Price band → numeric range
 const priceBand = (i) =>[[0,20],[20,30],[30,50],[50,Infinity]][i];

 function applyFacets(list) {
 if (activeFacets.amenity.size) {
 list = list.filter(c =>[...activeFacets.amenity].every(a =>(c.amenities||[]).includes(a)));
 }
 if (activeFacets.feature.size) {
 list = list.filter(c =>[...activeFacets.feature].every(a =>(c.features||[]).includes(a)));
 }
 if (activeFacets.bestFor.size) {
 list = list.filter(c =>[...activeFacets.bestFor].every(a =>(c.bestFor||[]).includes(a)));
 }
 if (activeFacets.price !== null) {
 const [min, max] = priceBand(+activeFacets.price);
 list = list.filter(c =>c.sunbedFrom>= min && c.sunbedFrom < max);
 }
 if (activeFacets.rating !== null) {
 const r = +activeFacets.rating;
 list = list.filter(c =>c.rating>= r);
 }
 return list;
 }

 function render(list) {
 grid.innerHTML = list.map(buildCard).join('');
 grid.querySelectorAll('.photo-btn').forEach(function (b) {
 b.addEventListener('click', function (e) {
 e.preventDefault(); e.stopPropagation();
 const cid = b.getAttribute('data-club');
 const club = CLUBS.find(function (x) { return x.id === cid; });
 if (club) SunspotLightbox.open(club.photos, 0, club.name);
 });
 });
 const noRes = document.getElementById('no-results');
 if (noRes) noRes.hidden = list.length>0;
 const summary = document.getElementById('result-summary');
 if (summary) {
 const region = document.getElementById('f-region').value;
 const cat = document.getElementById('f-category') ? document.getElementById('f-category').value : 'all';
 const bookOnly = document.getElementById('f-bookable') && document.getElementById('f-bookable').checked;
 const catLbl = cat !== 'all' ? CATS[cat].label.toLowerCase() : 'beach club';
 summary.innerHTML = list.length + ' ' + catLbl + (list.length === 1 ? '' : 's') +
 ' in ' + REGIONS[region] +
 (bookOnly ? ' · with bookable sunbeds' : '');
 }
 }

 function applyFilters() {
 // The Region + Type hidden inputs now hold comma-separated lists (multi-select)
 // or the string "all" when nothing is checked.
 const regionVal = document.getElementById('f-region').value;
 const regions = (regionVal && regionVal !== 'all') ? regionVal.split(',') : null;
 const guests = parseInt(document.getElementById('f-guests').value, 10);
 const catVal = document.getElementById('f-category') ? document.getElementById('f-category').value : 'all';
 const cats = (catVal && catVal !== 'all') ? catVal.split(',') : null;
 const bookOnly = document.getElementById('f-bookable') && document.getElementById('f-bookable').checked;
 const qEl = document.getElementById('f-query');
 const q = qEl ? qEl.value.trim().toLowerCase() : '';
 let list = CLUBS.slice();
 if (regions) list = list.filter(function (c) { return regions.indexOf(c.region)   !== -1; });
 if (cats)    list = list.filter(function (c) { return cats.indexOf(c.category)    !== -1; });
 if (bookOnly) list = list.filter(function (c) { return c.hasBookableSunbeds; });
 if (guests>= 5) list = list.filter(function (c) { return c.vipFrom; });
 if (q) {
 list = list.filter(function (c) {
 const haystack = [
 c.name, c.location, c.regionLabel, c.summary,
 c.category, (c.bestFor || []).join(' '), (c.features || []).join(' ')
 ].join(' ').toLowerCase();
 return q.split(/\s+/).every(word =>haystack.includes(word));
 });
 }
 list = applyFacets(list);
 render(list);
 }

 document.getElementById('f-region').addEventListener('change', applyFilters);
 document.getElementById('f-guests').addEventListener('change', applyFilters);
 const catSel = document.getElementById('f-category');
 if (catSel) catSel.addEventListener('change', applyFilters);
 const bookCb = document.getElementById('f-bookable');
 if (bookCb) bookCb.addEventListener('change', applyFilters);
 // Multi-select wiring for Type + Region popovers
 function wireMulti(kind, hiddenId, valueSelector, defaultLabel) {
   const checks = document.querySelectorAll('input[data-multi="' + kind + '"]');
   const hidden = document.getElementById(hiddenId);
   const valueEl = document.querySelector(valueSelector);
   const clearBtn = document.querySelector('[data-multi-clear="' + kind + '"]');
   if (!checks.length || !hidden || !valueEl) return;

   function sync() {
     const selected = Array.from(checks).filter(c => c.checked);
     const labels   = selected.map(c => c.parentElement.textContent.trim());
     hidden.value = selected.length ? selected.map(c => c.value).join(',') : 'all';
     if (selected.length === 0) {
       valueEl.textContent = defaultLabel;
     } else if (selected.length === 1) {
       valueEl.textContent = labels[0];
     } else {
       valueEl.textContent = labels[0] + ' + ' + (selected.length - 1) + ' more';
     }
     applyFilters();
   }
   checks.forEach(c => c.addEventListener('change', sync));
   if (clearBtn) clearBtn.addEventListener('click', () => {
     checks.forEach(c => c.checked = false);
     sync();
   });
 }
 wireMulti('cat',    'f-category', '#f-category-multi .ss-finder-multi-value', 'All types');
 wireMulti('region', 'f-region',   '#f-region-multi   .ss-finder-multi-value', 'Malta & Gozo');

 // Close multi-select popovers when clicking outside or pressing Escape
 document.addEventListener('click', (e) => {
   document.querySelectorAll('details.ss-finder-multi[open]').forEach(d => {
     if (!d.contains(e.target)) d.open = false;
   });
 });
 document.addEventListener('keydown', (e) => {
   if (e.key === 'Escape') {
     document.querySelectorAll('details.ss-finder-multi[open]').forEach(d => d.open = false);
   }
 });

 // Live text search — debounced
 const qInput = document.getElementById('f-query');
 if (qInput) {
 let qTimer;
 qInput.addEventListener('input', function () {
 clearTimeout(qTimer);
 qTimer = setTimeout(applyFilters, 120);
 });
 }
 document.getElementById('filter-form').addEventListener('submit', function (e) { e.preventDefault(); applyFilters(); });
 const clear = document.getElementById('clear-filters');
 if (clear) clear.addEventListener('click', function (e) {
 e.preventDefault();
 document.getElementById('f-region').value = 'all';
 document.getElementById('f-guests').value = '2';
 if (catSel) catSel.value = 'all';
 if (bookCb) bookCb.checked = false;
 if (qInput) qInput.value = '';
 applyFilters();
 });

 render(CLUBS);

 // SEO ItemList
 const ldEl = document.getElementById('ld-itemlist');
 if (ldEl) {
 ldEl.textContent = JSON.stringify({
 "@context": "https://schema.org",
 "@type": "ItemList",
 "name": "Beach clubs, pool clubs, lidos and beaches in Malta and Gozo",
 "numberOfItems": CLUBS.length,
 "itemListElement": CLUBS.map(function (c, i) {
 return {
 "@type": "ListItem",
 "position": i + 1,
 "item": {
 "@type": c.hasBookableSunbeds ? "BeachResort" : "Beach",
 "name": c.name,
 "url": "https://sunspot.mt/club.html?club=" + c.id,
 "image": c.photos[0],
 "address": { "@type": "PostalAddress", "addressLocality": c.location, "addressCountry": "MT" },
 "geo": { "@type": "GeoCoordinates", "latitude": c.coords.lat, "longitude": c.coords.lng },
 "aggregateRating": { "@type": "AggregateRating", "ratingValue": c.rating, "reviewCount": c.reviews },
 "priceRange": c.hasBookableSunbeds ? "€" + c.sunbedFrom + (c.vipFrom ? "-€" + c.vipFrom : "") : "Free",
 "description": c.summary,
 }
 };
 }),
 });
 }

 // Homepage stats
 const countEl = document.querySelector('.stats .stat:first-child strong');
 if (countEl) countEl.textContent = CLUBS.length;
})();
