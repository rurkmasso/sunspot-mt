// ==========================================================
// Sunspot — UI components (reusable render functions)
// Each function returns an HTML string from a club object.
// Edit the design here in one place — used by club.js, etc.
// ==========================================================
window.SunspotComponents = (function () {
 'use strict';

 // ---- SVG icons (brand-correct, monochrome) -----------------
 const Icons = {
 web: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
 phone:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
 email:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
 ig: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
 fb: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/></svg>',
 ta: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><circle cx="7" cy="14" r="1.3" fill="currentColor"/><circle cx="17" cy="14" r="1.3" fill="currentColor"/><path d="M2 14C4 8 8 6 12 6s8 2 10 8" stroke-linecap="round"/></svg>',
 map: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
 clock:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 users:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
 car: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h-2v-6l2-5h14l2 5v6h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
 wave: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7 0M2 18c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7 0"/></svg>',
 check:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg>',
 };

 // ---- Contact & socials -------------------------------------
 function contactCard(club) {
 const items = [];
 if (club.website) items.push({ icon: Icons.web, color: '#0288d1', label: 'Official website', value: cleanUrl(club.website), href: club.website, external: true });
 if (club.phone) items.push({ icon: Icons.phone, color: '#2e7d32', label: 'Phone', value: club.phone, href: 'tel:' + club.phone.replace(/\s+/g,'') });
 if (club.email) items.push({ icon: Icons.email, color: '#f57c00', label: 'Email', value: club.email, href: 'mailto:' + club.email });
 const s = club.socials || {};
 if (s.instagram) items.push({ icon: Icons.ig, color: '#e91e63', label: 'Instagram', value: '@' + s.instagram, href: 'https://instagram.com/' + s.instagram, external: true });
 if (s.facebook) items.push({ icon: Icons.fb, color: '#1877f2', label: 'Facebook', value: s.facebook, href: 'https://facebook.com/' + s.facebook, external: true });
 if (s.tripadvisor) items.push({ icon: Icons.ta, color: '#00aa6c', label: 'TripAdvisor', value: 'View reviews', href: s.tripadvisor, external: true });

 if (!items.length) return '';

 return `
 <section class="contact-grid" aria-label="Contact and social media">
<h2>Contact &amp; socials</h2>
<div class="contact-cards">
${items.map(i =>`
 <a class="ic-card" href="${i.href}" ${i.external ? 'target="_blank" rel="noopener"' : ''}>
<span class="ic-icon" style="background:${hexToRgba(i.color, 0.12)};color:${i.color}">${i.icon}</span>
<span class="ic-text">
<span class="ic-label">${i.label}</span>
<span class="ic-value">${escape(i.value)}</span>
</span>
<span class="ic-arrow" aria-hidden="true">→</span>
</a>
`).join('')}
</div>
</section>
`;
 }

 // ---- Quick facts grid --------------------------------------
 function quickFacts(club) {
 const facts = [
 { icon: Icons.clock, label: 'Hours', value: club.hours },
 { icon: Icons.wave, label: 'Season', value: club.season },
 { icon: Icons.users, label: 'Capacity', value: club.capacity ? (club.capacity.total + ' guests · ' + club.capacity.sunbeds + ' sunbeds') : null },
 { icon: Icons.wave, label: 'Pool / water', value: club.poolType },
 { icon: Icons.map, label: 'Surface', value: club.surface },
 { icon: Icons.users, label: 'Dress code', value: club.dressCode },
 { icon: Icons.map, label: 'Getting there', value: club.gettingThere },
 { icon: Icons.car, label: 'Parking', value: club.parking },
 { icon: Icons.users, label: 'Accessibility', value: club.accessibility },
 ].filter(f =>f.value);

 return `
 <section class="quick-facts-grid" aria-label="Quick facts">
<h2>Quick facts</h2>
<div class="facts-cards">
${facts.map(f =>`
 <div class="fact-card">
<span class="fact-icon">${f.icon}</span>
<div>
<div class="fact-label">${f.label}</div>
<div class="fact-value">${escape(f.value)}</div>
</div>
</div>
`).join('')}
</div>
</section>
`;
 }

 // ---- Features / best-for pills -----------------------------
 function featurePills(club) {
 const items = (club.features || []).map(f =>({ text: f, kind: 'feature' }))
 .concat((club.bestFor || []).map(b =>({ text: 'Best for: ' + b, kind: 'best' })));
 if (!items.length) return '';
 return `
 <div class="features-pills">
${items.map(i =>`<span class="pill pill-${i.kind}">${escape(i.text)}</span>`).join('')}
</div>`;
 }

 // ---- Amenities checklist -----------------------------------
 function amenitiesList(club) {
 if (!club.amenities || !club.amenities.length) return '';
 return `
 <section class="amenities-section" aria-label="Amenities">
<h2>What's included</h2>
<ul class="amenities-grid">
${club.amenities.map(a =>`
 <li><span class="am-check">${Icons.check}</span>${escape(a)}</li>
`).join('')}
</ul>
</section>`;
 }

 // ---- Google Maps embed -------------------------------------
 function mapEmbed(club) {
 if (!club.coords || !club.coords.lat) return '';
 const { lat, lng } = club.coords;
 const url = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
 const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
 return `
 <section class="map-section" aria-label="Map">
<h2>Location</h2>
<div class="map-wrap">
<iframe
 src="${url}"
 width="100%" height="320"
 style="border:0;border-radius:12px"
 loading="lazy" referrerpolicy="no-referrer-when-downgrade"
 allowfullscreen></iframe>
<a class="directions-btn" href="${directionsUrl}" target="_blank" rel="noopener">
${Icons.map} Get directions
</a>
</div>
</section>`;
 }

 // ---- Helpers -----------------------------------------------
 function cleanUrl(u) {
 return u.replace(/^https?:\/\//, '').replace(/\/$/, '');
 }
 function escape(s) {
 return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
 }
 function hexToRgba(hex, a) {
 const h = hex.replace('#', '');
 const r = parseInt(h.substring(0, 2), 16);
 const g = parseInt(h.substring(2, 4), 16);
 const b = parseInt(h.substring(4, 6), 16);
 return `rgba(${r},${g},${b},${a})`;
 }

 return {
 contactCard,
 quickFacts,
 featurePills,
 amenitiesList,
 mapEmbed,
 };
})();
