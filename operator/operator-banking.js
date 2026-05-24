/* ============================================================
   Sunspot Operator — Stripe Connect Express banking panel.

   Renders one of three states inside #op-banking-card:
     1. Not connected    → "Connect bank account" CTA, opens Stripe-hosted KYC
     2. Onboarding incomplete → "Finish setup" pill + list of what's missing
     3. Fully connected  → "Connected" tick + "Open Stripe dashboard" link

   In demo mode (no SUNSPOT_API_BASE / no JWT) we render a friendly
   "this is what the real version looks like" stub so the page is never
   broken for screenshot purposes.
   ============================================================ */
(function () {
 'use strict';

 const API   = window.SUNSPOT_API_BASE || null;
 const TOKEN = (() => { try { return localStorage.getItem('sunspot_op_jwt'); } catch (e) { return null; } })();
 const DEMO  = !API || !TOKEN;

 function boot() {
   const card = document.getElementById('op-banking-card');
   if (!card) return;
   if (DEMO) {
     renderDemo(card);
   } else {
     renderLive(card);
   }
   // Show success / refresh banner when returning from Stripe onboarding
   maybeShowReturnBanner();
 }

 // ─── 1) Demo state — looks like the real thing but doesn't hit Stripe ───
 function renderDemo(card) {
   card.innerHTML =
     '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
       '<div style="display:flex;align-items:center;gap:14px;">' +
         '<span style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ffb74d,#f57c00);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;">€</span>' +
         '<div>' +
           '<div style="font-family:Fraunces,Georgia,serif;font-size:18px;color:#0a1f3a;font-weight:600;">Bank account</div>' +
           '<div style="font-size:13px;color:#5d6a82;margin-top:2px;">Not connected · weekly payouts won\'t arrive yet.</div>' +
         '</div>' +
       '</div>' +
       '<button type="button" id="op-bank-cta" style="background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border:0;padding:11px 18px;border-radius:999px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(232,108,0,.32);">Connect bank account</button>' +
     '</div>' +
     '<div style="margin-top:14px;padding:12px 14px;background:#fdf6e8;border:1px solid rgba(192,134,59,.20);border-radius:10px;font-size:12px;color:#5d6a82;">' +
       '<strong style="color:#0a1f3a;">Demo:</strong> in production this opens a Stripe-hosted form to verify your business + IBAN. Takes ~3 minutes. We never see your bank details.' +
     '</div>';
   const btn = card.querySelector('#op-bank-cta');
   if (btn) btn.addEventListener('click', () => {
     if (window.opToast) window.opToast('Demo — would open Stripe Express onboarding', 'info');
     else alert('Demo — in production this would redirect to Stripe.');
   });
 }

 // ─── 2) Live state — hits the BE Stripe endpoints ───
 async function renderLive(card) {
   try {
     const r = await fetch(API + '/sunspot/v1/operator/stripe/status', {
       headers: { Authorization: 'Bearer ' + TOKEN },
     });
     if (!r.ok) throw new Error('HTTP ' + r.status);
     const s = await r.json();

     if (!s.connected) {
       card.innerHTML = bankCard({
         title: 'Bank account',
         status: 'Not connected',
         tone:   'warn',
         description: 'Weekly payouts will land in the IBAN you connect through Stripe. Sunspot never sees your bank details.',
         ctaLabel: 'Connect bank account',
         ctaAction: 'onboard',
       });
     } else if (!s.charges_enabled || !s.payouts_enabled || !s.details_submitted) {
       const missing = (s.requirements && s.requirements.currently_due) || [];
       card.innerHTML = bankCard({
         title: 'Bank account',
         status: 'Setup incomplete',
         tone:   'pending',
         description: (missing.length
           ? 'Stripe still needs: ' + missing.slice(0, 3).map(m => m.replace(/_/g, ' ')).join(', ') + '.'
           : 'Finish your Stripe Express verification to unlock payouts.'),
         ctaLabel: 'Finish setup',
         ctaAction: 'onboard',
       });
     } else {
       card.innerHTML = bankCard({
         title: 'Bank account',
         status: 'Connected · payouts active',
         tone:   'ok',
         description: 'Sunday midnight → IBAN by Monday morning. 92% of GMV.',
         ctaLabel: 'Open Stripe dashboard',
         ctaAction: 'dashboard',
       });
     }
     wireButton(card);
   } catch (e) {
     card.innerHTML = bankCard({
       title: 'Bank account',
       status: 'Couldn\'t check',
       tone:   'warn',
       description: 'Something went wrong loading your Stripe status. ' + e.message,
       ctaLabel: 'Retry',
       ctaAction: 'retry',
     });
     wireButton(card, () => renderLive(card));
   }
 }

 function bankCard({ title, status, tone, description, ctaLabel, ctaAction }) {
   const toneColors = {
     ok:      { bg: '#e6f4ea', dot: '#2e7d32' },
     pending: { bg: '#fff8e1', dot: '#f57c00' },
     warn:    { bg: '#ffebee', dot: '#c62828' },
   };
   const c = toneColors[tone] || toneColors.warn;
   return '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">' +
     '<div style="display:flex;align-items:center;gap:14px;">' +
       '<span style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ffb74d,#f57c00);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;">€</span>' +
       '<div>' +
         '<div style="font-family:Fraunces,Georgia,serif;font-size:18px;color:#0a1f3a;font-weight:600;">' + title + '</div>' +
         '<div style="font-size:13px;color:#5d6a82;margin-top:2px;display:flex;align-items:center;gap:6px;">' +
           '<span style="width:8px;height:8px;border-radius:50%;background:' + c.dot + ';display:inline-block;"></span>' + status +
         '</div>' +
       '</div>' +
     '</div>' +
     '<button type="button" data-cta="' + ctaAction + '" style="background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border:0;padding:11px 18px;border-radius:999px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(232,108,0,.32);">' + ctaLabel + '</button>' +
   '</div>' +
   '<div style="margin-top:14px;padding:12px 14px;background:' + c.bg + ';border-radius:10px;font-size:12px;color:#5d6a82;line-height:1.5;">' +
     description +
   '</div>';
 }

 function wireButton(card, override) {
   const btn = card.querySelector('[data-cta]');
   if (!btn) return;
   btn.addEventListener('click', async () => {
     if (override) return override();
     const act = btn.dataset.cta;
     btn.disabled = true;
     btn.textContent = 'Opening Stripe…';
     try {
       const path = act === 'dashboard'
         ? '/sunspot/v1/operator/stripe/dashboard-link'
         : '/sunspot/v1/operator/stripe/onboarding-link';
       const r = await fetch(API + path, {
         method: 'POST',
         headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
       });
       const data = await r.json();
       if (data.url) {
         window.location.href = data.url;
       } else {
         throw new Error(data.message || 'No URL returned');
       }
     } catch (e) {
       btn.disabled = false;
       btn.textContent = act === 'dashboard' ? 'Open Stripe dashboard' : 'Try again';
       if (window.opToast) window.opToast('Stripe link failed — ' + e.message, 'warn');
     }
   });
 }

 // ─── Return-from-Stripe banner ───
 function maybeShowReturnBanner() {
   const p = new URLSearchParams(location.search);
   if (!p.has('stripe')) return;
   const status = p.get('stripe');
   const msg = status === 'success'
     ? 'You\'re back from Stripe — checking your status…'
     : 'Stripe session expired. Open Settings to try again.';
   if (window.opToast) window.opToast(msg, status === 'success' ? 'success' : 'warn');
   // Clean the URL so the banner doesn't reappear on refresh
   history.replaceState({}, '', location.pathname);
   // Jump to Settings tab
   const settingsBtn = document.querySelector('[data-nav="settings"], [data-panel="settings"]');
   if (settingsBtn) setTimeout(() => settingsBtn.click(), 400);
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   setTimeout(boot, 0);
 }
})();
