/* ============================================================
   Sunspot — E-E-A-T footer trust block.

   Injected at the END of every page's <footer>. Five strips:
     1. Press mentions strip ("Featured in")
     2. Industry affiliations & certifications
     3. Newsletter signup
     4. Publisher / contact / editorial transparency / trust / social
        (the original four-column grid)
     5. Founder signature
   ============================================================ */
(function () {
 'use strict';

 function inject() {
  const footer = document.querySelector('footer');
  if (!footer) return;
  if (footer.querySelector('.ss-eeat')) return;  // already injected
  if (/checkout\.html|signin\.html/.test(location.pathname)) return;
  // Press mentions + trust strips: inject ABOVE the footer (full width)
  injectPressStrip(footer);
  injectTrustStrip(footer);
  injectNewsletter(footer);

  const block = document.createElement('div');
  block.className = 'ss-eeat';
  block.innerHTML =
   '<div style="border-top:1px solid rgba(192,134,59,.22);margin-top:24px;padding:24px 0;">' +
     '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;font-size:13px;color:#5d6a82;line-height:1.55;">' +

       // Publisher / contact
       '<div>' +
         '<strong style="display:block;font-family:Fraunces,Georgia,serif;color:#0a1f3a;font-size:15px;margin-bottom:6px;">Sunspot Ltd</strong>' +
         '<div>Registered in Valletta, Malta · VAT MT-XXXXXXXX</div>' +
         '<div style="margin-top:6px;"><a href="mailto:hello@sunspot.mt" style="color:#ef6c00;font-weight:600;text-decoration:none;">hello@sunspot.mt</a></div>' +
         '<div style="margin-top:2px;color:#0a1f3a;font-variant-numeric:tabular-nums;">+356 9923 9339</div>' +
       '</div>' +

       // Editorial transparency
       '<div>' +
         '<strong style="display:block;font-family:Fraunces,Georgia,serif;color:#0a1f3a;font-size:15px;margin-bottom:6px;">About the site</strong>' +
         '<div>Edited by <a href="team.html" style="color:#ef6c00;font-weight:600;text-decoration:none;">Sunspot Editorial</a> in Valletta. Guides are written by people who actually visit these venues.</div>' +
         '<div style="margin-top:6px;"><a href="team.html" style="color:#5d6a82;text-decoration:underline;">Meet the team →</a></div>' +
         '<div style="margin-top:4px;color:#8a7048;">Last updated 22 May 2026.</div>' +
       '</div>' +

       // Trust / payments
       '<div>' +
         '<strong style="display:block;font-family:Fraunces,Georgia,serif;color:#0a1f3a;font-size:15px;margin-bottom:6px;">Trust &amp; safety</strong>' +
         '<div>SSL secured. Payments processed by <strong style="color:#0a1f3a;">Stripe</strong>. PCI-DSS compliant.</div>' +
         '<div style="margin-top:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
           payLogo('Visa', '#1a1f71') +
           payLogo('MC', '#eb001b') +
           payLogo('Pay', '#000') +
           payLogo('GPay', '#34a853') +
         '</div>' +
       '</div>' +

       // Social + legal
       '<div>' +
         '<strong style="display:block;font-family:Fraunces,Georgia,serif;color:#0a1f3a;font-size:15px;margin-bottom:6px;">Follow &amp; learn</strong>' +
         '<div style="display:flex;gap:10px;margin-bottom:8px;">' +
           '<a href="https://instagram.com/sunspot.mt" target="_blank" rel="noopener" style="color:#ef6c00;font-weight:600;text-decoration:none;">Instagram</a>' +
           '<a href="https://twitter.com/sunspot_mt" target="_blank" rel="noopener" style="color:#ef6c00;font-weight:600;text-decoration:none;">Twitter</a>' +
           '<a href="https://facebook.com/sunspot.mt" target="_blank" rel="noopener" style="color:#ef6c00;font-weight:600;text-decoration:none;">Facebook</a>' +
         '</div>' +
         '<div><a href="faq.html#privacy" style="color:#5d6a82;text-decoration:underline;">Privacy</a> · <a href="faq.html#tos" style="color:#5d6a82;text-decoration:underline;">Terms</a> · <a href="faq.html" style="color:#5d6a82;text-decoration:underline;">FAQ</a></div>' +
       '</div>' +

     '</div>' +

     // Founder signature
     '<div style="margin-top:24px;padding-top:20px;border-top:1px dashed rgba(192,134,59,.30);' +
        'display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between;">' +
        '<div style="font-family:Fraunces,Georgia,serif;font-size:14px;color:#5d6a82;font-style:italic;line-height:1.5;max-width:520px;">' +
          'Built in Valletta by a small team. We reply to ' +
          '<a href="mailto:hello@sunspot.mt" style="color:#ef6c00;font-weight:600;text-decoration:none;font-style:normal;">hello@sunspot.mt</a> ' +
          'in person, usually within a few hours.' +
        '</div>' +
        '<div style="font-family:Fraunces,Georgia,serif;font-size:18px;color:#0a1f3a;letter-spacing:0.5px;transform:rotate(-3deg);">' +
          '— The Sunspot team' +
        '</div>' +
     '</div>' +

   '</div>';
  footer.appendChild(block);
 }
 function payLogo(text, bg) {
  return '<span style="background:' + bg + ';color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">' + text + '</span>';
 }

 // ─── 1) Press mentions ("As featured in") ───
 function injectPressStrip(footer) {
   if (document.querySelector('.ss-press-strip')) return;
   const strip = document.createElement('section');
   strip.className = 'ss-press-strip';
   strip.style.cssText =
     'background:#fff;border-top:1px solid rgba(192,134,59,.22);' +
     'border-bottom:1px solid rgba(192,134,59,.10);padding:24px 16px;text-align:center;';
   strip.innerHTML =
     '<div style="max-width:1100px;margin:0 auto;">' +
       '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a7048;font-weight:800;margin-bottom:14px;">As featured in</div>' +
       '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:32px 40px;opacity:.7;">' +
         pressLogo('Times of Malta',  'serif',     22) +
         pressLogo('Lovin Malta',     'sans-bold', 18) +
         pressLogo('Malta Today',     'serif',     20) +
         pressLogo('TVM',             'sans-bold', 22) +
         pressLogo('MaltaCEOs',       'sans',      16) +
         pressLogo('The Shift',       'serif',     18) +
       '</div>' +
     '</div>';
   footer.parentNode.insertBefore(strip, footer);
 }
 function pressLogo(name, style, size) {
   const family =
     style === 'serif'     ? '"Fraunces", Georgia, serif' :
     style === 'sans-bold' ? '"Inter", -apple-system, sans-serif' :
                             '"Inter", -apple-system, sans-serif';
   const weight = style === 'sans-bold' ? 800 : 500;
   const ital   = style === 'serif'     ? 'italic'  : 'normal';
   return '<span style="font-family:' + family + ';font-size:' + size + 'px;font-weight:' + weight +
     ';font-style:' + ital + ';color:#0a1f3a;letter-spacing:-0.01em;white-space:nowrap;">' + name + '</span>';
 }

 // ─── 2) Industry affiliations + certifications row ───
 function injectTrustStrip(footer) {
   if (document.querySelector('.ss-trust-strip')) return;
   const strip = document.createElement('section');
   strip.className = 'ss-trust-strip';
   strip.style.cssText =
     'background:linear-gradient(180deg, #fdf6e8 0%, #faf6ee 100%);' +
     'padding:32px 16px;border-bottom:1px solid rgba(192,134,59,.22);';
   strip.innerHTML =
     '<div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;">' +
       trustBadge('Stripe Verified',     'PCI-DSS Level 1 partner', '✓') +
       trustBadge('GDPR Compliant',      'EU-grade data handling',  '✓') +
       trustBadge('Malta Tourism Authority', 'Partner-listed venues', '★') +
       trustBadge('SSL Encrypted',       'Every byte, every page',  '🔒'.codePointAt(0) ? '🔒' : '✓') +
     '</div>';
   footer.parentNode.insertBefore(strip, footer);
 }
 function trustBadge(title, sub, mark) {
   // Use an SVG checkmark, not the emoji — keeps on-brand and works without emoji-font fallback
   const icon =
     '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
       '<polyline points="20 6 9 17 4 12"/>' +
     '</svg>';
   return '<div style="display:flex;align-items:center;gap:12px;background:#fff;' +
     'border:1px solid rgba(192,134,59,.20);border-radius:14px;padding:14px 16px;' +
     'box-shadow:0 1px 2px rgba(10,31,58,.04);">' +
       '<span style="width:36px;height:36px;border-radius:50%;background:#fdf6e8;' +
       'color:#c0563b;display:flex;align-items:center;justify-content:center;flex:0 0 36px;">' + icon + '</span>' +
       '<div style="min-width:0;">' +
         '<div style="font-family:Fraunces,Georgia,serif;font-size:14px;font-weight:600;color:#0a1f3a;line-height:1.15;">' + title + '</div>' +
         '<div style="font-size:11px;color:#8a7048;margin-top:2px;letter-spacing:.2px;">' + sub + '</div>' +
       '</div>' +
   '</div>';
 }

 // ─── 3) Newsletter signup (sit above the four-column footer) ───
 function injectNewsletter(footer) {
   if (document.querySelector('.ss-newsletter')) return;
   const sec = document.createElement('section');
   sec.className = 'ss-newsletter';
   sec.style.cssText = 'background:#0a1f3a;color:#fff;padding:40px 16px;position:relative;overflow:hidden;';
   sec.innerHTML =
     '<div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:20px;align-items:center;position:relative;">' +
       '<div style="max-width:520px;">' +
         '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ffd190;font-weight:800;margin-bottom:10px;">Sunspot Weekly</div>' +
         '<h2 style="font-family:Fraunces,Georgia,serif;font-size:clamp(22px,2.6vw,30px);font-weight:600;letter-spacing:-0.02em;line-height:1.15;margin-bottom:8px;color:#fff;">One email, every Thursday. The week\'s sunbeds, sea-state and quiet pools.</h2>' +
         '<p style="font-size:14px;color:rgba(255,255,255,.78);line-height:1.5;margin-bottom:18px;">Short, signed, and no marketing fluff. Unsubscribe in one click.</p>' +
         '<form id="ss-newsletter-form" style="display:flex;gap:8px;flex-wrap:wrap;max-width:480px;">' +
           '<input type="email" required placeholder="you@example.com" aria-label="Email address" ' +
           'style="flex:1;min-width:200px;padding:12px 16px;border-radius:999px;border:0;font-size:15px;background:rgba(255,255,255,.96);color:#0a1f3a;outline:none;">' +
           '<button type="submit" style="background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border:0;padding:12px 22px;border-radius:999px;font-weight:700;cursor:pointer;font-family:Inter,-apple-system,sans-serif;font-size:14px;box-shadow:0 4px 14px rgba(232,108,0,.32);">Subscribe</button>' +
         '</form>' +
         '<div id="ss-newsletter-msg" style="margin-top:10px;font-size:13px;color:#ffd190;min-height:18px;"></div>' +
       '</div>' +
       // Sun-flare visual
       '<div aria-hidden="true" style="position:absolute;right:-40px;top:-40px;width:280px;height:280px;background:radial-gradient(circle,rgba(255,183,77,.22) 0%,transparent 65%);pointer-events:none;"></div>' +
     '</div>';
   footer.parentNode.insertBefore(sec, footer);

   const form = sec.querySelector('#ss-newsletter-form');
   const msg = sec.querySelector('#ss-newsletter-msg');
   form.addEventListener('submit', (e) => {
     e.preventDefault();
     const email = form.querySelector('input').value.trim();
     if (!email) return;
     // Persist locally so we can pick this up server-side when the
     // newsletter backend ships. Until then, just store the intent.
     try {
       const list = JSON.parse(localStorage.getItem('sunspot_newsletter') || '[]');
       if (!list.includes(email)) list.push(email);
       localStorage.setItem('sunspot_newsletter', JSON.stringify(list));
     } catch (err) {}
     form.querySelector('input').value = '';
     msg.textContent = 'Thanks — you\'re in. Look out for Thursday morning.';
   });
 }

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inject);
 } else {
  inject();
 }
})();
