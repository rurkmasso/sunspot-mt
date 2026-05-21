/* ============================================================
   Sunspot — cookie consent (EU/Malta GDPR-friendly)

   Minimal, on-brand banner — slides up from the bottom on first
   visit. Two choices:
     - Accept     → stores `ss_cc=all`, no further prompt
     - Essentials → stores `ss_cc=essentials`, blocks future analytics
   The choice persists in localStorage so we don't ask again.

   This banner doesn't *block* anything by default — Sunspot currently
   uses no third-party analytics or marketing cookies. When we add
   them (Plausible, GA, etc.) check window.ssConsent === 'all' before
   loading them.

   Drop the <script> tag on every page; the module self-bootstraps.
   ============================================================ */
(function () {
 'use strict';

 const KEY = 'ss_cc';
 function read() {
  try { return localStorage.getItem(KEY); } catch (e) { return null; }
 }
 function write(v) {
  try { localStorage.setItem(KEY, v); } catch (e) {}
  window.ssConsent = v;
 }

 const existing = read();
 if (existing) { window.ssConsent = existing; return; }

 function boot() {
  // Don't show on certain pages (signin, checkout — would interfere)
  if (/checkout\.html|signin\.html/.test(location.pathname)) return;

  const banner = document.createElement('aside');
  banner.id = 'ss-cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie preferences');
  banner.style.cssText =
   'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;' +
   'background:#fff;border:1px solid rgba(192,134,59,.25);' +
   'border-radius:16px;padding:16px 18px;' +
   'box-shadow:0 12px 36px rgba(10,31,58,.18), 0 1px 3px rgba(10,31,58,.06);' +
   'max-width:560px;margin:0 auto;' +
   'display:flex;flex-wrap:wrap;align-items:center;gap:12px;' +
   'font-family:Inter,-apple-system,sans-serif;color:#0a1f3a;font-size:14px;line-height:1.5;' +
   'transform:translateY(120%);transition:transform .35s cubic-bezier(.2,.8,.2,1);';

  banner.innerHTML =
   '<div style="flex:1 1 240px;min-width:200px;">' +
     '<strong style="display:block;font-family:Fraunces,Georgia,serif;font-size:16px;margin-bottom:2px;">Cookies for the good kind of beach.</strong>' +
     'We use the bare minimum — just what\'s needed to remember your booking and language. <a href="faq.html#privacy" style="color:#ef6c00;font-weight:600;text-decoration:underline;">More</a>.' +
   '</div>' +
   '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
     '<button type="button" data-cc="essentials" style="background:#fff;border:1px solid #d0d7e2;padding:9px 14px;border-radius:999px;font-weight:600;color:#0a1f3a;cursor:pointer;font-size:13px;">Essentials only</button>' +
     '<button type="button" data-cc="all" style="background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border:0;padding:9px 18px;border-radius:999px;font-weight:700;cursor:pointer;font-size:13px;box-shadow:0 3px 10px rgba(232,108,0,.30);">Accept all</button>' +
   '</div>';

  document.body.appendChild(banner);
  requestAnimationFrame(() => { banner.style.transform = 'translateY(0)'; });

  banner.querySelectorAll('[data-cc]').forEach(btn => {
   btn.addEventListener('click', () => {
    write(btn.dataset.cc);
    banner.style.transform = 'translateY(120%)';
    setTimeout(() => banner.remove(), 350);
   });
  });
 }

 if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
 } else {
  setTimeout(boot, 0);
 }
})();
