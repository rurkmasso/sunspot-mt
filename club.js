(function () {
 'use strict';

 const params = new URLSearchParams(window.location.search);
 const id = params.get('club') || 'noma';
 const club = (window.SUNSPOT_CLUBS || []).find(function (c) { return c.id === id; });

 if (!club) {
 document.querySelector('main').innerHTML = '<div class="container"><div class="empty-card"><h2>Beach not found</h2><a href="index.html" class="btn-primary" style="text-decoration:none;display:inline-block">← All beaches</a></div></div>';
 return;
 }

 // ---- SEO ----
 document.title = club.name + ' — Sunbeds & cabanas in ' + club.location + ' | Sunspot';
 document.getElementById('meta-desc').setAttribute('content',
 'Reserve sunbeds, cabanas and VIP gazebos at ' + club.name + ', ' + club.location + '. ' +
 club.summary + ' Live availability, instant confirmation.');
 document.getElementById('canonical').setAttribute('href', 'https://sunspot.mt/club.html?club=' + id);
 document.getElementById('og-title').setAttribute('content', club.name + ' — Sunspot');
 document.getElementById('og-desc').setAttribute('content', club.summary);
 if (club.photos[0]) document.getElementById('og-image').setAttribute('content', club.photos[0]);

 // JSON-LD (BeachResort/LocalBusiness)
 const ld = {
 "@context": "https://schema.org",
 "@type": "BeachResort",
 "name": club.name,
 "image": club.photos,
 "description": club.description,
 "address": { "@type": "PostalAddress", "addressLocality": club.location, "addressCountry": "MT" },
 "aggregateRating": { "@type": "AggregateRating", "ratingValue": club.rating, "reviewCount": club.reviews },
 "priceRange": "€" + club.sunbedFrom + (club.vipFrom ? "-€" + club.vipFrom : ""),
 "amenityFeature": club.amenities.map(function (a) {
 return { "@type": "LocationFeatureSpecification", "name": a };
 }),
 "openingHours": club.hours,
 };
 if (club.phone) ld.telephone = club.phone;
 if (club.email) ld.email = club.email;
 if (club.website) ld.url = club.website;
 if (club.socials) {
 const same = [];
 if (club.socials.instagram) same.push('https://instagram.com/' + club.socials.instagram);
 if (club.socials.facebook) same.push('https://facebook.com/' + club.socials.facebook);
 if (same.length) ld.sameAs = same;
 }
 document.getElementById('ld-club').textContent = JSON.stringify(ld);

 // ---- Gallery (collage of up to 5 photos) ----
 const photos = club.photos.length ? club.photos : [
 'data:image/svg+xml;utf8,' + encodeURIComponent(
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#bbe5ff"/><text x="400" y="300" text-anchor="middle" font-size="40" fill="#0288d1">' + club.name + '</text></svg>')
 ];
 const gallery = document.getElementById('club-gallery');
 const n = photos.length;
 const tiles = [];
 // Build tiles based on actual photo count — never repeat
 for (let i = 0; i < Math.min(5, n); i++) {
 tiles.push('<button class="g-tile g-' + i + '" data-i="' + i + '" type="button" style="background-image:url(\'' + photos[i] + '\')" aria-label="Photo ' + (i + 1) + '"></button>');
 }
 // Use a layout variant class so CSS adapts to the photo count (1, 2, 3, 4, 5+)
 const variant = n>= 5 ? 'g5' : 'g' + n;
 const allBtn = n>1 ? '<button class="g-allbtn" type="button">Show all ' + n + ' photos</button>' : '';
 gallery.innerHTML = '<div class="g-collage ' + variant + '">' + tiles.join('') + allBtn + '</div>';
 gallery.querySelectorAll('.g-tile').forEach(function (t) {
 t.addEventListener('click', function () {
 SunspotLightbox.open(photos, parseInt(t.getAttribute('data-i'), 10), club.name);
 });
 });
 gallery.querySelector('.g-allbtn').addEventListener('click', function () {
 SunspotLightbox.open(photos, 0, club.name);
 });

 // ---- Header & basics ----
 document.getElementById('bc-region').textContent = (
 { north: 'North Malta', central: 'Central Malta', south: 'South Malta', gozo: 'Gozo', comino: 'Comino' }[club.region] || 'Malta'
 );
 document.getElementById('bc-name').textContent = club.name;
 document.getElementById('club-name').textContent = club.name;
 document.getElementById('club-subline').innerHTML = ' ' + club.location;
 // Share + favourite buttons next to the title
 var titleEl = document.getElementById('club-name');
 if (titleEl && !document.getElementById('club-actions')) {
 var actions = document.createElement('div');
 actions.id = 'club-actions';
 actions.style.cssText = 'display:inline-flex;gap:8px;margin-left:16px;vertical-align:middle';
 actions.innerHTML =
 '<button id="club-share" type="button" aria-label="Share this venue" ' +
 'style="background:#fff;border:1px solid #e8e8ec;padding:8px 14px;border-radius:100px;cursor:pointer;font-weight:600;font-size:13px;color:#0a1f3a">' +
 ' Share</button>' +
 '<button id="club-fav-big" type="button" aria-label="Save to favourites" ' +
 'style="background:#fff;border:1px solid #e8e8ec;padding:8px 14px;border-radius:100px;cursor:pointer;font-weight:600;font-size:13px;color:#0a1f3a">' +
 ' Save</button>';
 titleEl.parentNode.insertBefore(actions, titleEl.nextSibling);

 document.getElementById('club-share').addEventListener('click', function () {
 var url = location.href;
 var title = 'Sunspot — ' + club.name;
 var text = club.summary || ('Book ' + club.name + ' on Sunspot');
 if (navigator.share) {
 navigator.share({ title: title, text: text, url: url })
 .catch(function () {});
 } else {
 navigator.clipboard.writeText(url).then(function () {
 if (window.SunspotFeatures) SunspotFeatures.toast(' Link copied');
 }, function () {
 prompt('Copy this link:', url);
 });
 }
 });
 document.getElementById('club-fav-big').addEventListener('click', function () {
 if (!window.SunspotFeatures) return;
 var added = SunspotFeatures.toggleFav(club.id);
 var btn = document.getElementById('club-fav-big');
 btn.innerHTML = added ? ' Saved' : ' Save';
 btn.style.background = added ? '#ff9800' : '#fff';
 btn.style.color = added ? '#fff' : '#0a1f3a';
 SunspotFeatures.toast(added ? ' Saved to favourites' : 'Removed from favourites');
 });
 // Reflect existing fav state
 if (window.SunspotFeatures && SunspotFeatures.getFavs().indexOf(club.id)>= 0) {
 var bf = document.getElementById('club-fav-big');
 bf.innerHTML = ' Saved';
 bf.style.background = '#ff9800';
 bf.style.color = '#fff';
 }
 }
 document.getElementById('map-loc').textContent = club.location;
 document.getElementById('club-stars').textContent = ''.repeat(Math.round(club.rating));
 document.getElementById('club-rating-num').textContent = club.rating;
 document.getElementById('club-reviews').textContent = '(' + club.reviews + ' reviews)';
 document.getElementById('club-description').textContent = club.description;

 // ---- Components (see components.js for the design) ----
 const C = window.SunspotComponents;

 // Features/best-for pills above amenities
 const pillsEl = document.getElementById('features-pills');
 if (pillsEl) pillsEl.outerHTML = C.featurePills(club);

 // Amenities — swap old <ul id="amenities">with new section
 const amenitiesEl = document.getElementById('amenities');
 if (amenitiesEl) {
 // The HTML has "<h2>What's included</h2><ul id='amenities'>"; replace from h2 down to</ul>
const parent = amenitiesEl.parentNode;
 const h2 = amenitiesEl.previousElementSibling; // the "What's included" h2
 if (h2 && h2.tagName === 'H2') h2.remove();
 amenitiesEl.outerHTML = C.amenitiesList(club);
 }

 // Quick facts — replace the old <dl>
const factsEl = document.getElementById('quick-facts');
 if (factsEl) {
 const h2 = factsEl.previousElementSibling;
 if (h2 && h2.tagName === 'H2') h2.remove();
 factsEl.outerHTML = C.quickFacts(club);
 }

 // Contact & socials card
 const contactEl = document.getElementById('contact-card');
 if (contactEl) contactEl.outerHTML = C.contactCard(club);

 // Map — replace the placeholder
 const mapEl = document.getElementById('club-map');
 if (mapEl) {
 const h2 = mapEl.previousElementSibling;
 if (h2 && h2.tagName === 'H2') h2.remove();
 mapEl.outerHTML = C.mapEmbed(club);
 }

 // ---- Booking sidebar ----
 const meta = [
 { label: 'Sunbed', from: club.sunbedFrom },
 club.cabanaFrom ? { label: 'Cabana (4)', from: club.cabanaFrom } : null,
 club.vipFrom ? { label: 'VIP (6)', from: club.vipFrom } : null,
 ].filter(Boolean);

 var priceFmt = (window.SunspotAudiences && window.SunspotAudiences.formatPrice) || function (eur) { return '€' + eur; };
 document.getElementById('booking-card').innerHTML =
 '<div class="bc-price">' +
 '<span class="bc-price-from">From</span>' +
 '<span class="bc-price-num" data-eur="' + club.sunbedFrom + '">' + priceFmt(club.sunbedFrom) + '</span>' +
 '<span class="bc-price-unit">/ day</span>' +
 '</div>' +
 '<p class="bc-rating"><span aria-hidden="true">' + ''.repeat(Math.round(club.rating)) + '</span><strong>' + club.rating + '</strong>· ' + club.reviews + ' reviews</p>' +
 '<div class="bc-types">' +
 meta.map(function (m) { return '<div class="bc-type"><span>' + m.label + '</span><strong data-eur="' + m.from + '">' + priceFmt(m.from) + '</strong></div>'; }).join('') +
 '</div>' +
 '<div class="bc-fields">' +
 '<label>Date <input type="date" id="bc-date" value="2026-05-15"></label>' +
 '<label>Guests <select id="bc-guests"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5+</option></select></label>' +
 '</div>' +
 '<a href="booking.html?club=' + id + '" class="btn-primary bc-cta" style="text-decoration:none;text-align:center;display:block">Choose your spot →</a>' +
 '<p class="bc-trust">Free cancellation 24h before · Secure payment</p>' +
 '<p class="bc-spots ' + (club.spotsLeft <= 10 ? 'avail-low' : club.spotsLeft <= 25 ? 'avail-medium' : 'avail-good') + '">● ' + club.spotsLeft + ' spots available today</p>';

 // ---- Sample online reviews (representative quotes) ----
 const names = ['Maya P.', 'Daniel B.', 'Chloe R.', 'Sven K.', 'Emma G.', 'James M.', 'Sara A.', 'Tom L.', 'Anya S.'];
 const review_texts = {
 azure: ['Front-row sunbed and shaded bar were perfect.', 'Pool is heated even in May. Lovely staff.', 'Great spot for a long lunch.'],
 blue: ['Worth the boat ride. Best lagoon I\'ve seen.', 'Cabana was small but the location is unmatched.', 'Sold out by 9am — book ahead!'],
 golden: ['186 stairs but absolutely worth it.', 'Sunset over the cliffs is unreal.', 'Family-friendly, kids loved it.'],
 rocky: ['Just rocks and sun — perfect.', 'Loved cliff jumping in the natural pool.', 'Bring water shoes!'],
 cove: ['Tucked-away gem. Seafood lunch credit was generous.', 'Stone steps right into the water.', 'Quieter than the busy beaches.'],
 gozo: ['Quiet and authentic. Loved the views back to Malta.', 'Red sand really is red.', 'Had the place almost to ourselves on a weekday.'],
 urban: ['Cocktails with a Valletta sunset — magic.', 'No sand but the rock platforms are spotless.', 'Rooftop is the move.'],
 rooftop: ['Pool stays warm even in October.', 'Best pool party in Malta.', 'Service was attentive without being pushy.'],
 floating: ['Boat shuttle was easy. The island feels exclusive.', 'Like a private yacht for the day.', 'Worth every euro.'],
 lido: ['Best Valletta view in Sliema.', 'Compact but really well-run.', 'Felt private — even on a Saturday.'],
 };
 const profile = ({
 'azure-bay': 'azure', 'blue-lagoon': 'blue', 'golden-sands': 'golden',
 'st-peters': 'rocky', 'xlendi': 'cove', 'ramla': 'gozo', 'paradise-bay': 'rocky',
 'flo': 'rooftop', 'noma': 'floating', 'dwejra': 'rocky', 'hondoq': 'gozo',
 'cafe-del-mar': 'rooftop', 'aqualuna': 'lido', '1926-la-plage': 'lido',
 'manta': 'lido', 'twentytwo': 'urban',
 })[id] || 'azure';
 const sample = review_texts[profile];
 const reviewsGrid = document.getElementById('reviews-grid');
 reviewsGrid.innerHTML = sample.map(function (txt, i) {
 const stars = (i + Math.round(club.rating * 7)) % 5>0 ? 5 : 4;
 return '<article class="review-card">' +
 '<div class="rc-head"><strong>' + names[i % names.length] + '</strong><span aria-hidden="true">' + ''.repeat(stars) + '</span></div>' +
 '<p>' + txt + '</p>' +
 '<p class="rc-date">' + (i === 0 ? '2 weeks ago' : i === 1 ? '1 month ago' : '3 months ago') + '</p>' +
 '</article>';
 }).join('');

 // ---- Comments (localStorage) ----
 const CK = 'sunspot_comments_' + id;
 function loadComments() {
 return JSON.parse(localStorage.getItem(CK) || '[]');
 }
 function saveComments(list) {
 localStorage.setItem(CK, JSON.stringify(list));
 }
 function renderComments() {
 const list = loadComments();
 const root = document.getElementById('comments-list');
 if (!list.length) {
 root.innerHTML = '<p class="empty-state">No comments yet. Be the first to share your experience!</p>';
 return;
 }
 root.innerHTML = list.map(function (c) {
 return '<article class="comment-card">' +
 '<div class="cc-head"><strong>' + (c.name || 'Anonymous') + '</strong><span class="cc-date">' + c.date + '</span></div>' +
 '<p>' + c.text.replace(/</g, '&lt;') + '</p>' +
 '</article>';
 }).join('');
 }
 const cf = document.getElementById('comment-form');
 if (cf) {
 cf.addEventListener('submit', function (e) {
 e.preventDefault();
 const name = document.getElementById('c-name').value.trim() || 'Anonymous';
 const text = document.getElementById('c-text').value.trim();
 if (!text) return;
 const list = loadComments();
 list.unshift({ name: name, text: text, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
 saveComments(list);
 document.getElementById('c-text').value = '';
 renderComments();
 });
 }
 renderComments();

 // ---- Similar beaches ----
 const regionNames = { north: 'North Malta', central: 'Central Malta', south: 'South Malta', gozo: 'Gozo', comino: 'Comino' };
 document.getElementById('similar-region').textContent = regionNames[club.region] || 'Malta';
 const all = window.SUNSPOT_CLUBS || [];
 const similar = all
 .filter(function (c) { return c.id !== id && c.region === club.region; })
 .sort(function (a, b) { return b.rating - a.rating; })
 .slice(0, 3);
 if (similar.length < 3) {
 const pad = all
 .filter(function (c) { return c.id !== id && similar.indexOf(c) < 0; })
 .sort(function (a, b) { return b.rating - a.rating; })
 .slice(0, 3 - similar.length);
 similar.push.apply(similar, pad);
 }
 document.getElementById('similar-grid').innerHTML = similar.map(function (s) {
 const photo = s.photos[0] || '';
 return '<a href="club.html?club=' + s.id + '" class="similar-card">' +
 '<div class="sc-thumb" style="background-image:url(\'' + photo + '\')"></div>' +
 '<div class="sc-info">' +
 '<h4>' + s.name + '</h4>' +
 '<p>' + s.location + '</p>' +
 '<p class="sc-meta"><span aria-hidden="true" style="color:#f9a825"></span>' + s.rating + ' · from <span data-eur="' + s.sunbedFrom + '">' + priceFmt(s.sunbedFrom) + '</span></p>' +
 '</div></a>';
 }).join('');
})();
