/* ============================================================
   Sunspot — E-E-A-T footer trust block.

   Injected at the END of every page's <footer>. Adds visible trust
   signals Google looks for as part of E-E-A-T (Experience, Expertise,
   Authoritativeness, Trustworthiness):

     - Registered legal name + Valletta address
     - Direct support email + phone
     - Social profile links (matches Organization JSON-LD sameAs)
     - Payment method logos (Visa, MC, Apple Pay, Google Pay)
     - "Last updated" date so visitors know the site is maintained
     - Link to the about/team page (publisher transparency)
     - GDPR / Cookie / Terms / Privacy links
   ============================================================ */
(function () {
 'use strict';

 function inject() {
  const footer = document.querySelector('footer');
  if (!footer) return;
  if (footer.querySelector('.ss-eeat')) return;  // already injected
  // Don't inject if the page is a checkout / signin (less distraction)
  if (/checkout\.html|signin\.html/.test(location.pathname)) return;

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
         '<div>Edited by <a href="about.html" style="color:#ef6c00;font-weight:600;text-decoration:none;">Sunspot Editorial</a> in Valletta. Guides are written by people who actually visit these venues.</div>' +
         '<div style="margin-top:6px;">Last updated 21 May 2026.</div>' +
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
   '</div>';
  footer.appendChild(block);
 }
 function payLogo(text, bg) {
  return '<span style="background:' + bg + ';color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:4px;letter-spacing:.3px;">' + text + '</span>';
 }

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inject);
 } else {
  inject();
 }
})();
