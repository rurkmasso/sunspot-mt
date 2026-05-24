/* ============================================================
   Sunspot Operator — web push registration.

   Renders a "Notifications" card inside #panel-settings with one
   of three states:
     - Browser doesn't support push  → muted message, no CTA
     - Permission not asked / denied → "Turn on notifications" CTA
     - Subscribed                    → confirmation + "Disable" link

   On opt-in we register the service worker (if not already),
   subscribe via PushManager with the VAPID public key, and POST
   the subscription to /sunspot/v1/push/subscribe so the BE can
   dispatch.

   VAPID public key is read from window.SUNSPOT_VAPID_PUBLIC. Set
   it on the server-rendered page when shipping to production.
   ============================================================ */
(function () {
 'use strict';

 const API   = window.SUNSPOT_API_BASE || null;
 const TOKEN = (() => { try { return localStorage.getItem('sunspot_op_jwt'); } catch (e) { return null; } })();
 const VAPID = window.SUNSPOT_VAPID_PUBLIC || '';

 function boot() {
   const settings = document.getElementById('panel-settings');
   if (!settings) return;
   if (document.getElementById('op-push-card')) return;

   const card = document.createElement('div');
   card.id = 'op-push-card';
   card.style.cssText = 'background:#fff;border:1px solid rgba(192,134,59,.22);border-radius:16px;padding:22px;margin:8px 16px 16px;box-shadow:0 1px 3px rgba(10,31,58,.05);';
   // Insert after the banking card if present, else at the top of settings
   const banking = document.getElementById('op-banking-card');
   if (banking && banking.parentNode) {
     banking.parentNode.insertBefore(card, banking.nextSibling);
   } else {
     settings.insertBefore(card, settings.firstChild);
   }
   render(card);
 }

 async function render(card) {
   const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
   if (!supported) {
     card.innerHTML = shell({
       title: 'Push notifications',
       statusDot: '#9e9e9e',
       statusText: 'Not supported in this browser',
       description: 'Open the operator app on iPhone (Safari 16.4+) or Android Chrome to get real-time booking alerts.',
       ctaLabel: null,
     });
     return;
   }

   const perm = Notification.permission;
   if (perm === 'denied') {
     card.innerHTML = shell({
       title: 'Push notifications',
       statusDot: '#c62828',
       statusText: 'Blocked by browser',
       description: 'You declined earlier. Open browser settings → site permissions → notifications → allow for sunspot.mt.',
       ctaLabel: null,
     });
     return;
   }

   // Check if we already have a subscription
   let subscribed = false;
   try {
     const reg = await navigator.serviceWorker.getRegistration();
     if (reg) {
       const sub = await reg.pushManager.getSubscription();
       subscribed = !!sub;
     }
   } catch (e) {}

   if (subscribed) {
     card.innerHTML = shell({
       title: 'Push notifications',
       statusDot: '#2e7d32',
       statusText: 'On — alerts ready',
       description: 'You\'ll get a notification within ~5 seconds of any new booking, even when this app isn\'t open.',
       ctaLabel: 'Turn off',
       ctaAction: 'off',
     });
     wire(card, () => render(card));
   } else {
     card.innerHTML = shell({
       title: 'Push notifications',
       statusDot: '#f57c00',
       statusText: 'Off',
       description: 'Get a phone notification the moment a new booking lands. No more refreshing the Today tab.',
       ctaLabel: 'Turn on notifications',
       ctaAction: 'on',
     });
     wire(card, () => render(card));
   }
 }

 function shell({ title, statusDot, statusText, description, ctaLabel, ctaAction }) {
   const cta = ctaLabel
     ? '<button type="button" data-cta="' + ctaAction + '" style="background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border:0;padding:11px 18px;border-radius:999px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(232,108,0,.32);">' + ctaLabel + '</button>'
     : '';
   return '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
     '<div style="display:flex;align-items:center;gap:14px;">' +
       '<span style="width:48px;height:48px;border-radius:12px;background:#fdf6e8;color:#ef6c00;display:flex;align-items:center;justify-content:center;">' +
         '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>' +
       '</span>' +
       '<div>' +
         '<div style="font-family:Fraunces,Georgia,serif;font-size:18px;color:#0a1f3a;font-weight:600;">' + title + '</div>' +
         '<div style="font-size:13px;color:#5d6a82;margin-top:2px;display:flex;align-items:center;gap:6px;">' +
           '<span style="width:8px;height:8px;border-radius:50%;background:' + statusDot + ';display:inline-block;"></span>' + statusText +
         '</div>' +
       '</div>' +
     '</div>' +
     cta +
   '</div>' +
   '<div style="margin-top:14px;padding:12px 14px;background:#fdf6e8;border-radius:10px;font-size:12px;color:#5d6a82;line-height:1.5;">' +
     description +
   '</div>';
 }

 function wire(card, refresh) {
   const btn = card.querySelector('[data-cta]');
   if (!btn) return;
   btn.addEventListener('click', async () => {
     const act = btn.dataset.cta;
     btn.disabled = true;
     btn.textContent = act === 'on' ? 'Asking…' : 'Disabling…';
     try {
       if (act === 'on') await subscribe();
       else              await unsubscribe();
       refresh();
       if (window.opToast) {
         window.opToast(act === 'on' ? 'Notifications on' : 'Notifications off',
                        act === 'on' ? 'success' : 'warn');
       }
     } catch (e) {
       btn.disabled = false;
       if (window.opToast) window.opToast('Failed — ' + (e.message || e), 'warn');
       refresh();
     }
   });
 }

 // ─── Subscribe / unsubscribe ───
 async function subscribe() {
   const perm = await Notification.requestPermission();
   if (perm !== 'granted') throw new Error('Permission ' + perm);

   // Register the SW relative to whichever page this is loaded from
   const swPath = location.pathname.indexOf('/operator/') !== -1 ? '../sw.js' : 'sw.js';
   const reg = await navigator.serviceWorker.register(swPath);
   await navigator.serviceWorker.ready;

   if (!VAPID) {
     // Demo mode — pretend to subscribe so the UI flow works
     await reg.showNotification('Sunspot demo', { body: 'You\'d now get bookings here.', tag: 'demo' });
     return;
   }

   const sub = await reg.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(VAPID),
   });

   if (API && TOKEN) {
     await fetch(API + '/sunspot/v1/push/subscribe', {
       method: 'POST',
       headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
       body: JSON.stringify({ subscription: sub }),
     });
   }
 }

 async function unsubscribe() {
   const reg = await navigator.serviceWorker.getRegistration();
   if (!reg) return;
   const sub = await reg.pushManager.getSubscription();
   if (sub) await sub.unsubscribe();
   // We don't currently have a DELETE endpoint server-side, but the
   // browser will stop accepting pushes once unsubscribed locally.
 }

 // VAPID key (base64url) → Uint8Array
 function urlBase64ToUint8Array(b64) {
   const padding = '='.repeat((4 - b64.length % 4) % 4);
   const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
   const raw = atob(base64);
   const out = new Uint8Array(raw.length);
   for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
   return out;
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   setTimeout(boot, 0);
 }
})();
