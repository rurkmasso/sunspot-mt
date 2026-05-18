/* ============================================================
   Sunspot — pre-launch site gate.
   Soft credential check (mark@sunspot.mt / password).
   Loaded FIRST in every <head> so it can hide the page before paint.

   NOT real security. This is a client-side curtain to keep casual
   visitors out before launch — anyone with devtools or "view source"
   can bypass it. For real protection use Cloudflare Pages basic auth
   or a real WP/Vercel deployment.
   ============================================================ */
(function () {
  'use strict';

  // Required credentials (case-insensitive on the username).
  // Bytes are intentionally trivial — the real protection is the platform layer.
  var REQ_USER = 'mark@sunspot.mt';
  var REQ_PASS = 'password';
  var TOKEN_KEY = 'sunspot_gate_v1';
  // Token = base64 of timestamp + a marker. Persisted across reloads. Expires in 30 days.
  var TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  function readToken() {
    try {
      var raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return false;
      var parts = atob(raw).split('|');
      if (parts.length !== 2 || parts[1] !== 'ok') return false;
      var ts = parseInt(parts[0], 10);
      if (!ts || Date.now() - ts > TOKEN_TTL_MS) return false;
      return true;
    } catch (e) { return false; }
  }
  function writeToken() {
    try { localStorage.setItem(TOKEN_KEY, btoa(Date.now() + '|ok')); } catch (e) {}
  }

  if (readToken()) return;   // Already in.

  // Hide the page until login is dismissed.
  document.documentElement.style.visibility = 'hidden';

  function mount() {
    document.documentElement.style.visibility = '';

    // Inject styles
    var css =
      '.ss-gate { position: fixed; inset: 0; z-index: 99999; ' +
      'background: radial-gradient(circle at 20% 20%, rgba(255,179,71,.30), transparent 50%),' +
      '            radial-gradient(circle at 80% 70%, rgba(38,198,218,.22), transparent 50%),' +
      '            linear-gradient(180deg, #fff8e8 0%, #fffbf3 100%);' +
      'display: flex; align-items: center; justify-content: center; padding: 24px;' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; color: #0a1f3a; }' +
      '.ss-gate-card { background: #fff; border-radius: 20px; padding: 40px 36px 32px; ' +
      'max-width: 440px; width: 100%; box-shadow: 0 24px 80px rgba(10,31,58,.16); }' +
      '.ss-gate-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; font-weight: 800; font-size: 20px; color: #0a1f3a; }' +
      '.ss-gate-mark { width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle at 70% 28%, #fff5e1 8%, #ffb74d 14%, #ff9800 100%); }' +
      '.ss-gate-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #ef6c00; margin-bottom: 8px; }' +
      '.ss-gate h1 { font-size: 28px; font-weight: 800; letter-spacing: -.8px; margin: 0 0 8px; line-height: 1.1; }' +
      '.ss-gate p { color: #5d6a82; font-size: 14px; line-height: 1.5; margin: 0 0 26px; }' +
      '.ss-gate label { display: block; font-size: 11px; font-weight: 700; color: #5d6a82; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px; }' +
      '.ss-gate input { width: 100%; padding: 12px 14px; border: 1.5px solid #e3e8ef; border-radius: 10px; font-size: 15px; background: #fff; color: #0a1f3a; font-family: inherit; transition: border-color .15s, box-shadow .15s; }' +
      '.ss-gate input:focus { outline: none; border-color: #ff9800; box-shadow: 0 0 0 3px rgba(255,152,0,.15); }' +
      '.ss-gate .field { margin-bottom: 16px; }' +
      '.ss-gate button { width: 100%; background: #ff9800; color: #fff; border: 0; padding: 14px; border-radius: 100px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background .15s, transform .12s; box-shadow: 0 8px 24px rgba(255,152,0,.30); }' +
      '.ss-gate button:hover { background: #ef6c00; transform: translateY(-1px); }' +
      '.ss-gate .err { color: #b32d2e; font-size: 13px; margin-top: 12px; min-height: 18px; }' +
      '.ss-gate .foot { margin-top: 22px; padding-top: 18px; border-top: 1px solid #e3e8ef; color: #5d6a82; font-size: 12px; text-align: center; }';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'ss-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="ss-gate-card">' +
        '<div class="ss-gate-brand"><span class="ss-gate-mark"></span> Sunspot</div>' +
        '<div class="ss-gate-eyebrow">Pre-launch · invite only</div>' +
        '<h1>The Maltese coast,<br>under wraps for now.</h1>' +
        '<p>Sunspot is still in private preview. Sign in to continue.</p>' +
        '<form id="ss-gate-form" autocomplete="on">' +
          '<div class="field">' +
            '<label for="ss-gate-u">Email</label>' +
            '<input type="email" id="ss-gate-u" autocomplete="username" required placeholder="you@example.com">' +
          '</div>' +
          '<div class="field">' +
            '<label for="ss-gate-p">Password</label>' +
            '<input type="password" id="ss-gate-p" autocomplete="current-password" required placeholder="••••••••">' +
          '</div>' +
          '<button type="submit">Enter →</button>' +
          '<div class="err" id="ss-gate-err"></div>' +
        '</form>' +
        '<div class="foot">If you should have access, email <a href="mailto:hello@sunspot.mt" style="color:#ef6c00">hello@sunspot.mt</a>.</div>' +
      '</div>';
    document.body.appendChild(overlay);
    // Lock background scroll while gate is up
    document.body.style.overflow = 'hidden';

    var form = document.getElementById('ss-gate-form');
    var err  = document.getElementById('ss-gate-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('ss-gate-u').value.trim().toLowerCase();
      var p = document.getElementById('ss-gate-p').value;
      if (u === REQ_USER.toLowerCase() && p === REQ_PASS) {
        writeToken();
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity .2s';
        setTimeout(function () {
          overlay.remove();
          document.body.style.overflow = '';
        }, 220);
      } else {
        err.textContent = 'Wrong email or password. Try again.';
        document.getElementById('ss-gate-p').value = '';
      }
    });
    document.getElementById('ss-gate-u').focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Expose a reset for testing in console: ss_logout()
  window.ss_logout = function () { try { localStorage.removeItem(TOKEN_KEY); location.reload(); } catch (e) {} };
})();
