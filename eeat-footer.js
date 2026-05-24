/* ============================================================
   Sunspot — E-E-A-T footer.

   ONE clean, container-constrained footer block. No more floating
   strips or copy that bleeds off the edges. Five rows top→bottom:

     1. Newsletter signup (Sunspot Weekly)
     2. Press mentions ("As featured in")
     3. Trust badges (Stripe / GDPR / MTA / SSL)
     4. Four-column site map (company / operators / customers / contact)
     5. Bottom rail: ©, legal links, language/currency hint

   Injected at the end of every page's <footer>. The site's existing
   .footer-bottom line gets removed first so we don't double up.
   ============================================================ */
(function () {
 'use strict';

 function boot() {
   const footer = document.querySelector('footer');
   if (!footer) return;
   if (footer.querySelector('.ss-eeat')) return;
   if (/checkout\.html|signin\.html/.test(location.pathname)) return;

   // Remove any leftover stale strips from older versions
   document.querySelectorAll('.ss-press-strip, .ss-trust-strip, .ss-newsletter').forEach(el => el.remove());
   // Remove the default "© 2026 Sunspot Ltd. · Built in Valletta" — we'll re-render below
   const oldBottom = footer.querySelector('.footer-bottom');
   if (oldBottom) oldBottom.remove();
   // Wipe any pre-existing 4-column footer-grid blocks from old templates
   footer.querySelectorAll('.footer-grid').forEach(el => el.remove());

   // Style the footer host itself — limestone surface, top border
   footer.style.background = '#fdf6e8';
   footer.style.borderTop  = '1px solid rgba(192,134,59,.22)';
   footer.style.marginTop  = '60px';
   footer.style.color      = '#0a1f3a';
   footer.style.fontFamily = 'Inter, -apple-system, sans-serif';
   footer.style.position   = 'relative';
   footer.style.overflow   = 'hidden';

   const block = document.createElement('div');
   block.className = 'ss-eeat';
   block.innerHTML = render();
   footer.appendChild(block);

   // Newsletter wiring
   const form = block.querySelector('#ss-newsletter-form');
   const msg  = block.querySelector('#ss-newsletter-msg');
   if (form) {
     form.addEventListener('submit', (e) => {
       e.preventDefault();
       const email = form.querySelector('input').value.trim();
       if (!email) return;
       try {
         const list = JSON.parse(localStorage.getItem('sunspot_newsletter') || '[]');
         if (!list.includes(email)) list.push(email);
         localStorage.setItem('sunspot_newsletter', JSON.stringify(list));
       } catch (err) {}
       form.querySelector('input').value = '';
       msg.textContent = 'Thanks — you\'re in. Look out for Thursday morning.';
     });
   }
 }

 // ─── Render the whole block ───
 function render() {
   return (
     // 1) Newsletter — full-width navy panel with sun-flare
     newsletterRow() +

     // 2) Press strip — narrow, centred, muted
     pressRow() +

     // 3) Trust badges
     trustRow() +

     // 4) Site map — four columns inside .container
     sitemapRow() +

     // 5) Bottom rail
     bottomRail()
   );
 }

 // ─── 1) Newsletter ───
 function newsletterRow() {
   return (
     '<section style="background:#0a1f3a;color:#fff;padding:48px 0;position:relative;overflow:hidden;">' +
       '<div aria-hidden="true" style="position:absolute;right:-60px;top:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(255,183,77,.22) 0%,transparent 65%);pointer-events:none;"></div>' +
       '<div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr;gap:18px;position:relative;">' +
         '<div style="max-width:560px;">' +
           '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ffd190;font-weight:800;margin-bottom:10px;">Sunspot Weekly</div>' +
           '<h2 style="font-family:Fraunces,Georgia,serif;font-size:clamp(20px,2.4vw,26px);font-weight:600;letter-spacing:-0.015em;line-height:1.2;margin:0 0 8px;color:#fff;">' +
             "One email, every Thursday. The week's sunbeds, sea-state, quiet pools." +
           '</h2>' +
           '<p style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.5;margin:0 0 16px;max-width:50ch;">Short, signed, and no marketing fluff. Unsubscribe in one click.</p>' +
           '<form id="ss-newsletter-form" style="display:flex;gap:8px;flex-wrap:wrap;max-width:520px;">' +
             '<input type="email" required placeholder="you@example.com" aria-label="Email address" ' +
               'style="flex:1;min-width:200px;padding:11px 16px;border-radius:999px;border:0;font-size:14px;background:#fff;color:#0a1f3a;outline:none;font-family:inherit;">' +
             '<button type="submit" style="background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border:0;padding:11px 22px;border-radius:999px;font-weight:700;cursor:pointer;font-family:inherit;font-size:14px;box-shadow:0 4px 14px rgba(232,108,0,.32);">Subscribe</button>' +
           '</form>' +
           '<div id="ss-newsletter-msg" style="margin-top:10px;font-size:13px;color:#ffd190;min-height:18px;"></div>' +
         '</div>' +
       '</div>' +
     '</section>'
   );
 }

 // ─── 2) Press strip — infinite marquee ───
 //
 // To activate real logos: drop SVG (or PNG) files at the paths in the
 // `slug` field below, e.g. assets/press/times-of-malta.svg. They auto-
 // swap in. Until then the typographic placeholders keep the layout intact.
 function pressRow() {
   // Each entry: slug for asset swap-in, displayed label, type treatment.
   // Treatments chosen so the strip reads as deliberate editorial typography,
   // not placeholders waiting for images. Mixed serif/sans creates the
   // newsstand feel of a real press wall.
   const logos = [
     { slug: 'times-of-malta', label: 'Times of Malta', style: 'serif-bold', size: 26 },
     { slug: 'lovin-malta',    label: 'Lovin Malta',    style: 'sans-tight', size: 24 },
     { slug: 'malta-today',    label: 'Malta Today',    style: 'serif-bold', size: 24 },
     { slug: 'tvm',            label: 'TVM',            style: 'sans-mono',  size: 30 },
     { slug: 'malta-ceos',     label: 'MaltaCEOs',      style: 'sans-mixed', size: 22 },
     { slug: 'the-shift',      label: 'The Shift',      style: 'serif-italic', size: 24 },
   ];
   const trackHTML = logos.concat(logos).map(pressLogo).join('');
   return (
     '<section class="ss-press" style="background:#fff;border-bottom:1px solid rgba(192,134,59,.10);padding:32px 0;overflow:hidden;">' +
       '<div style="max-width:1200px;margin:0 auto 18px;padding:0 24px;text-align:center;">' +
         '<div style="font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:#8a7048;font-weight:800;">As featured in</div>' +
       '</div>' +
       '<div class="ss-press-viewport" style="position:relative;width:100%;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);">' +
         '<div class="ss-press-track" style="display:flex;align-items:center;gap:64px;width:max-content;animation:ssPressScroll 40s linear infinite;will-change:transform;">' +
           trackHTML +
         '</div>' +
       '</div>' +
     '</section>'
   );
 }
 // Per-publication typography that reads as a deliberate brand wall, not a
 // wireframe. Customised to feel right for each masthead's actual identity
 // (serif/sans, weight, italic) without imitating their logo artwork.
 function pressLogo(logo) {
   const styles = {
     'serif-bold':   { family: '"Fraunces", Georgia, serif',      weight: 700, italic: 'normal', tracking: '-0.02em' },
     'serif-italic': { family: '"Fraunces", Georgia, serif',      weight: 600, italic: 'italic', tracking: '-0.015em' },
     'sans-tight':   { family: '"Inter", -apple-system, sans-serif', weight: 800, italic: 'normal', tracking: '-0.04em' },
     'sans-mono':    { family: '"Inter", -apple-system, sans-serif', weight: 900, italic: 'normal', tracking: '0.08em' },
     'sans-mixed':   { family: '"Inter", -apple-system, sans-serif', weight: 700, italic: 'normal', tracking: '-0.01em' },
   };
   const s = styles[logo.style] || styles['sans-tight'];
   const fallback =
     '<span style="font-family:' + s.family + ';font-size:' + logo.size + 'px;' +
       'font-weight:' + s.weight + ';font-style:' + s.italic + ';' +
       'letter-spacing:' + s.tracking + ';' +
       'color:#0a1f3a;white-space:nowrap;line-height:1;opacity:.85;">' + logo.label + '</span>';
   return (
     '<picture style="display:flex;align-items:center;height:36px;flex:0 0 auto;">' +
       '<img src="assets/press/' + logo.slug + '.svg" alt="' + logo.label + '" ' +
         'style="height:30px;width:auto;opacity:.85;" loading="lazy" decoding="async" ' +
         'onerror="this.replaceWith(this.nextElementSibling);">' +
       fallback +
     '</picture>'
   );
 }

 // ─── 3) Trust badges ───
 function trustRow() {
   const tick =
     '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
   const cell = (title, sub) =>
     '<div style="display:flex;align-items:center;gap:10px;">' +
       '<span style="width:32px;height:32px;border-radius:50%;background:#fff;color:#c0563b;display:flex;align-items:center;justify-content:center;border:1px solid rgba(192,134,59,.30);flex:0 0 32px;">' + tick + '</span>' +
       '<div style="min-width:0;">' +
         '<div style="font-family:Fraunces,Georgia,serif;font-size:13px;font-weight:600;color:#0a1f3a;line-height:1.15;">' + title + '</div>' +
         '<div style="font-size:11px;color:#8a7048;margin-top:1px;letter-spacing:.2px;line-height:1.3;">' + sub + '</div>' +
       '</div>' +
     '</div>';
   return (
     '<section style="background:#faf3e0;border-bottom:1px solid rgba(192,134,59,.20);padding:18px 0;">' +
       '<div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;">' +
         cell('Stripe Verified',         'PCI-DSS Level 1 partner') +
         cell('GDPR Compliant',           'EU-grade data handling') +
         cell('Malta Tourism Authority',  'Partner-listed venues') +
         cell('SSL Encrypted',            'Every byte, every page') +
       '</div>' +
     '</section>'
   );
 }

 // ─── 4) Four-column site map ───
 function sitemapRow() {
   const col = (title, rows) =>
     '<div>' +
       '<h3 style="font-family:Fraunces,Georgia,serif;font-size:15px;color:#0a1f3a;font-weight:600;margin:0 0 12px;letter-spacing:-0.01em;">' + title + '</h3>' +
       '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">' +
         rows.map(([href, label]) => '<li><a href="' + href + '" style="color:#5d6a82;text-decoration:none;font-size:13px;line-height:1.5;">' + label + '</a></li>').join('') +
       '</ul>' +
     '</div>';

   return (
     '<section style="background:#fdf6e8;padding:48px 0 32px;">' +
       '<div style="max-width:1200px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px;">' +

         // Brand column
         '<div>' +
           '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
             '<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">' +
               '<g stroke="#ff9800" stroke-width="2" stroke-linecap="round" opacity="0.6">' +
                 '<line x1="20" y1="2" x2="20" y2="6"/><line x1="20" y1="34" x2="20" y2="38"/>' +
                 '<line x1="2" y1="20" x2="6" y2="20"/><line x1="34" y1="20" x2="38" y2="20"/>' +
               '</g>' +
               '<circle cx="20" cy="20" r="11" fill="#ff9800"/>' +
               '<circle cx="20" cy="20" r="9" fill="#ffb74d"/>' +
               '<circle cx="24" cy="16" r="3" fill="#fff5e1"/>' +
             '</svg>' +
             '<span style="font-family:Fraunces,Georgia,serif;font-size:20px;font-weight:600;color:#0a1f3a;letter-spacing:-0.02em;">Sunspot</span>' +
           '</div>' +
           '<p style="font-size:13px;color:#5d6a82;line-height:1.55;margin:0 0 14px;max-width:34ch;">Malta\'s booking platform for beach clubs, lidos and rooftop pools. Built in Valletta by a small team.</p>' +
           '<p style="font-size:13px;color:#5d6a82;line-height:1.7;margin:0;">' +
             '<a href="mailto:hello@sunspot.mt" style="color:#ef6c00;font-weight:700;text-decoration:none;">hello@sunspot.mt</a><br>' +
             '<a href="tel:+35699239339" style="color:#0a1f3a;text-decoration:none;font-variant-numeric:tabular-nums;">+356 9923 9339</a>' +
           '</p>' +
         '</div>' +

         col('For beachgoers', [
           ['index.html',         'Browse all beaches'],
           ['experiences.html',   'Experiences'],
           ['guides.html',        'Field guide'],
           ['visiting.html',      'Visiting Malta?'],
           ['living.html',        'Living here'],
           ['bookings.html',      'My bookings'],
         ]) +

         col('For operators', [
           ['operator/',          'Open the operator app'],
           ['rates.html',         'Pricing &amp; rate card'],
           ['mailto:partners@sunspot.mt', 'Become a partner'],
           ['faq.html',           'FAQ'],
         ]) +

         col('Company', [
           ['about.html',         'About Sunspot'],
           ['team.html',          'Meet the team'],
           ['mailto:press@sunspot.mt', 'Press'],
           ['faq.html#privacy',   'Privacy'],
           ['faq.html#tos',       'Terms'],
         ]) +

       '</div>' +

       // Editorial transparency block under the columns
       '<div style="max-width:1200px;margin:24px auto 0;padding:0 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;border-top:1px dashed rgba(192,134,59,.30);padding-top:20px;font-size:12px;color:#5d6a82;">' +
         '<div style="max-width:60ch;line-height:1.55;">Edited by <a href="team.html" style="color:#ef6c00;font-weight:600;text-decoration:none;">Sunspot Editorial</a> in Valletta — guides are written by people who actually visit these venues. Last updated 24 May 2026.</div>' +
         '<div style="display:flex;gap:6px;align-items:center;">' +
           payLogo('Visa', '#1a1f71') +
           payLogo('MC', '#eb001b') +
           payLogo('Pay', '#000') +
           payLogo('GPay', '#34a853') +
         '</div>' +
       '</div>' +

     '</section>'
   );
 }
 function payLogo(text, bg) {
   return '<span style="background:' + bg + ';color:#fff;font-size:10px;font-weight:800;padding:3px 7px;border-radius:4px;letter-spacing:.3px;">' + text + '</span>';
 }

 // ─── 5) Bottom rail ───
 function bottomRail() {
   return (
     '<section style="background:#0a1f3a;color:rgba(255,255,255,.75);padding:14px 0;">' +
       '<div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;font-size:12px;">' +
         '<div>© 2026 Sunspot Ltd. · Registered in Valletta, Malta · VAT MT-XXXXXXXX</div>' +
         '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
           '<a href="https://instagram.com/sunspot.mt" target="_blank" rel="noopener" style="color:#ffd190;text-decoration:none;font-weight:600;">Instagram</a>' +
           '<a href="https://twitter.com/sunspot_mt"   target="_blank" rel="noopener" style="color:#ffd190;text-decoration:none;font-weight:600;">Twitter</a>' +
           '<a href="https://facebook.com/sunspot.mt"  target="_blank" rel="noopener" style="color:#ffd190;text-decoration:none;font-weight:600;">Facebook</a>' +
         '</div>' +
       '</div>' +
     '</section>'
   );
 }

 // CSS — collapse the 4-col grid on phone + tablet + press marquee
 const css = document.createElement('style');
 css.textContent =
   '@media (max-width: 900px) {' +
     '.ss-eeat section > div[style*="grid-template-columns: 1.4fr"] {' +
       'grid-template-columns: 1fr 1fr !important;' +
     '}' +
   '}' +
   '@media (max-width: 540px) {' +
     '.ss-eeat section > div[style*="grid-template-columns: 1.4fr"] {' +
       'grid-template-columns: 1fr !important;' +
     '}' +
   '}' +
   // Press marquee — translate the duplicated track by exactly 50%
   // so the second copy lines up with the first when it wraps.
   '@keyframes ssPressScroll {' +
     '0%   { transform: translateX(0); }' +
     '100% { transform: translateX(-50%); }' +
   '}' +
   '.ss-press-viewport:hover .ss-press-track { animation-play-state: paused; }' +
   // Respect prefers-reduced-motion — no marquee for users who asked
   '@media (prefers-reduced-motion: reduce) {' +
     '.ss-press-track { animation: none !important; transform: none !important; }' +
     '.ss-press-viewport { mask: none !important; -webkit-mask: none !important; }' +
   '}';
 document.head.appendChild(css);

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   setTimeout(boot, 0);
 }
})();
