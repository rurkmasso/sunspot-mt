/* ============================================================
   Sunspot — Confirmation page.
   Uses .ss-ticket from the brand system to give the moment of
   delight after payment a real "ticket in hand" feel — notched
   edges, perforation divider, sun-rays brand mark above the title,
   QR + ref at the bottom for the gate scan.
   ============================================================ */
(function () {
 'use strict';

 const raw = localStorage.getItem('sunspot_last_booking');
 const root = document.getElementById('confirmation');
 if (!root) return;

 if (!raw) {
  root.innerHTML =
   '<div class="ss-empty" style="padding:80px 24px;">' +
    '<div class="ss-empty-icon">' +
     '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' +
    '</div>' +
    '<h3>No recent booking</h3>' +
    '<p>Looks like you haven\'t made a reservation in this browser.</p>' +
    '<a href="index.html" class="btn-primary" style="text-decoration:none;display:inline-block;">Browse the coast →</a>' +
   '</div>';
  return;
 }

 const b = JSON.parse(raw);

 // ─── Seat list ───
 const seatList = (b.seats || []).map(function (s) {
  const t = ({ sunbed: 'Sunbed', cabana: 'Cabana', vip: 'VIP Gazebo' })[s.type] || 'Spot';
  return '<li style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(192,134,59,.18);">' +
    '<span>' + t + ' <strong>' + s.id + '</strong></span>' +
    '<span style="font-variant-numeric:tabular-nums;">€' + s.price + '</span>' +
   '</li>';
 }).join('');

 // ─── Pseudo QR ───
 const qrSize = 12;
 const matrix = [];
 for (let y = 0; y < qrSize; y++) {
  matrix.push([]);
  for (let x = 0; x < qrSize; x++) {
   const seed = (b.ref.charCodeAt((x + y * 3) % b.ref.length) + x * 31 + y * 17) % 5;
   matrix[y].push(seed < 2 ? 1 : 0);
  }
 }
 function setFinder(ox, oy) {
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
   const isEdge = x === 0 || y === 0 || x === 2 || y === 2;
   matrix[oy + y][ox + x] = isEdge ? 1 : 0;
  }
 }
 setFinder(0, 0); setFinder(qrSize - 3, 0); setFinder(0, qrSize - 3);
 let qrSvg = '<svg viewBox="0 0 ' + qrSize + ' ' + qrSize + '" style="width:160px;height:160px;display:block;margin:0 auto;background:#fff;padding:8px;border-radius:8px;">';
 for (let y = 0; y < qrSize; y++) for (let x = 0; x < qrSize; x++) {
  if (matrix[y][x]) qrSvg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0a1f3a"/>';
 }
 qrSvg += '</svg>';

 // ─── Compose the ticket ───
 const sunMark =
  '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
   '<polyline points="20 6 9 17 4 12"/>' +
  '</svg>';

 root.innerHTML =
  '<div class="ss-ticket" style="margin-top:32px;">' +
   '<div class="ss-ticket-mark">' + sunMark + '</div>' +
   '<h1 style="text-align:center;font-family:var(--font-display);font-size:30px;letter-spacing:-0.4px;color:var(--ink);margin-bottom:6px;">You\'re booked.</h1>' +
   '<p style="text-align:center;color:var(--muted);font-size:14px;margin-bottom:18px;">' +
    'Confirmation emailed to <strong style="color:var(--ink);">' + (b.guest && b.guest.email || 'you') + '</strong>' +
   '</p>' +

   '<div class="ss-ticket-divider"></div>' +

   '<div style="text-align:center;margin-bottom:14px;">' +
    '<div style="font-family:var(--font-display);font-size:22px;color:var(--ink);letter-spacing:-0.3px;">' + (b.clubName || 'Your venue') + '</div>' +
    '<div style="font-size:13px;color:var(--muted);margin-top:2px;">' + (b.clubLocation || '') + '</div>' +
    '<div style="margin-top:10px;display:inline-flex;gap:10px;flex-wrap:wrap;justify-content:center;">' +
     '<span class="ss-accent-pill">' + (b.date || '') + '</span>' +
     '<span class="ss-accent-pill">' + (b.guests || 1) + ' guest' + ((b.guests || 1) === 1 ? '' : 's') + '</span>' +
    '</div>' +
   '</div>' +

   '<ul style="list-style:none;padding:0;margin:14px 0 16px;font-size:14px;color:var(--ink);">' + seatList + '</ul>' +

   '<div style="display:flex;justify-content:space-between;font-family:var(--font-display);font-size:18px;color:var(--ink);padding:10px 0 0;border-top:1px solid rgba(192,134,59,.18);">' +
    '<span>Paid</span>' +
    '<span style="color:var(--sun-deep);">€' + (b.total || 0) + '</span>' +
   '</div>' +

   '<div class="ss-ticket-divider"></div>' +

   '<div style="text-align:center;">' +
    '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--terracotta);font-weight:700;margin-bottom:10px;">Show at the gate</div>' +
    qrSvg +
    '<div style="font-family:var(--font-display);font-size:18px;letter-spacing:1px;color:var(--ink);margin-top:10px;font-variant-numeric:tabular-nums;">' + (b.ref || '—') + '</div>' +
   '</div>' +
  '</div>' +

  '<div style="display:flex;gap:10px;justify-content:center;margin:24px auto 40px;max-width:520px;flex-wrap:wrap;">' +
   '<a href="bookings.html" class="btn-primary" style="text-decoration:none;text-align:center;display:inline-block;">View all my bookings</a>' +
   '<a href="index.html" style="text-decoration:none;text-align:center;display:inline-block;padding:12px 24px;border-radius:999px;font-weight:700;color:var(--ink);background:#fff;border:1px solid var(--line);">Book another beach</a>' +
  '</div>';
})();
