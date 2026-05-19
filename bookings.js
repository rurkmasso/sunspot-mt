(function () {
 'use strict';

 function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
 function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
 function readBookings() {
  try { return JSON.parse(safeGet('sunspot_bookings') || '[]'); } catch (e) { return []; }
 }

 const root = document.getElementById('bookings-root');
 if (!root) return;

 // Status labels mirror the operator app's vocabulary so the customer sees
 // the same word the operator just tapped (pending → accepted → arrived).
 const STATUS_LABELS = {
  pending: { text: 'Pending operator confirmation', cls: 'is-pending' },
  accept:  { text: 'Confirmed by venue',            cls: 'is-accept' },
  arrived: { text: 'Checked in',                    cls: 'is-arrived' },
  decline: { text: 'Declined · refund issued',      cls: 'is-decline' },
  noshow:  { text: 'Recorded as no-show',           cls: 'is-noshow' },
 };

 function row(b) {
  const seats = Array.isArray(b.seats) ? b.seats : [];
  const seatTypes = seats.reduce(function (acc, s) {
   if (!s || !s.type) return acc;
   acc[s.type] = (acc[s.type] || 0) + 1;
   return acc;
  }, {});
  const seatSummary = Object.keys(seatTypes).map(function (t) {
   const lbl = { sunbed: 'sunbed', cabana: 'cabana', vip: 'VIP gazebo' }[t] || t;
   const n = seatTypes[t];
   return n + ' ' + lbl + (n > 1 ? 's' : '');
  }).join(', ') || 'No seats selected';

  const action = b.operator_action || 'pending';
  const status = STATUS_LABELS[action] || STATUS_LABELS.pending;

  return '' +
   '<article class="booking-card ' + status.cls + '">' +
    '<div class="bc-header">' +
     '<div>' +
      '<div class="bc-club">' + (b.clubName || 'Booking') + '</div>' +
      '<div class="bc-loc">' + (b.clubLocation || '') + '</div>' +
     '</div>' +
     '<div class="bc-ref">' +
      '<span class="badge">' + (b.ref || '—') + '</span>' +
     '</div>' +
    '</div>' +
    '<div class="bc-status">' + status.text + '</div>' +
    '<div class="bc-body">' +
     '<div class="bc-pill">' + (b.date || '—') + '</div>' +
     '<div class="bc-pill">' + (b.guests || 1) + ' guests</div>' +
     '<div class="bc-pill"> ' + seatSummary + '</div>' +
     '<div class="bc-pill bc-paid">Paid €' + (b.total || 0) + '</div>' +
    '</div>' +
    '<div class="bc-footer">' +
     '<button class="btn-ghost" data-action="qr" data-ref="' + (b.ref || '') + '">Show QR</button>' +
     (action === 'arrived' || action === 'noshow' || action === 'decline'
      ? ''
      : '<button class="btn-ghost" data-action="cancel" data-ref="' + (b.ref || '') + '">Cancel</button>') +
    '</div>' +
   '</article>';
 }

 function emptyState() {
  return '<div class="empty-card">' +
    '<div class="empty-icon"></div>' +
    '<h2>No bookings yet</h2>' +
    '<p>Reserve your first sunbed in seconds.</p>' +
    '<a href="index.html" class="btn-primary" style="text-decoration:none;display:inline-block;text-align:center;margin-top:14px">Browse beaches</a>' +
   '</div>';
 }

 function render() {
  const list = readBookings();
  if (!list.length) { root.innerHTML = emptyState(); return; }
  root.innerHTML = '<div class="bookings-list">' + list.map(row).join('') + '</div>';

  root.querySelectorAll('[data-action="cancel"]').forEach(function (btn) {
   btn.addEventListener('click', function () {
    const ref = btn.getAttribute('data-ref');
    if (!ref) return;
    if (!confirm('Cancel booking ' + ref + '? You\'ll be refunded in 3-5 business days.')) return;
    const all = readBookings();
    const updated = all.filter(function (x) { return x.ref !== ref; });
    safeSet('sunspot_bookings', JSON.stringify(updated));
    render();
   });
  });
  root.querySelectorAll('[data-action="qr"]').forEach(function (btn) {
   btn.addEventListener('click', function () {
    const ref = btn.getAttribute('data-ref');
    const all = readBookings();
    const found = all.find(function (x) { return x.ref === ref; });
    if (found) {
     safeSet('sunspot_last_booking', JSON.stringify(found));
     window.location.href = 'confirmation.html';
    }
   });
  });
 }

 render();
})();
