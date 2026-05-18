(function () {
 'use strict';
 const root = document.getElementById('bookings-root');
 const bookings = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');

 if (!bookings.length) {
 root.innerHTML =
 '<div class="empty-card">' +
 '<div class="empty-icon"></div>' +
 '<h2>No bookings yet</h2>' +
 '<p>Reserve your first sunbed in seconds.</p>' +
 '<a href="index.html" class="btn-primary" style="text-decoration:none;display:inline-block;text-align:center;margin-top:14px">Browse beaches →</a>' +
 '</div>';
 return;
 }

 function row(b) {
 const seatTypes = b.seats.reduce(function (acc, s) {
 acc[s.type] = (acc[s.type] || 0) + 1;
 return acc;
 }, {});
 const seatSummary = Object.keys(seatTypes).map(function (t) {
 const lbl = { sunbed: 'sunbed', cabana: 'cabana', vip: 'VIP gazebo' }[t];
 const n = seatTypes[t];
 return n + ' ' + lbl + (n>1 ? 's' : '');
 }).join(', ');
 return '' +
 '<article class="booking-card">' +
 '<div class="bc-header">' +
 '<div>' +
 '<div class="bc-club">' + b.clubName + '</div>' +
 '<div class="bc-loc">' + b.clubLocation + '</div>' +
 '</div>' +
 '<div class="bc-ref">' +
 '<span class="badge">' + b.ref + '</span>' +
 '</div>' +
 '</div>' +
 '<div class="bc-body">' +
 '<div class="bc-pill">' + b.date + '</div>' +
 '<div class="bc-pill">' + b.guests + ' guests</div>' +
 '<div class="bc-pill"> ' + seatSummary + '</div>' +
 '<div class="bc-pill bc-paid">Paid €' + b.total + '</div>' +
 '</div>' +
 '<div class="bc-footer">' +
 '<button class="btn-ghost" data-action="qr" data-ref="' + b.ref + '">Show QR</button>' +
 '<button class="btn-ghost" data-action="cancel" data-ref="' + b.ref + '">Cancel</button>' +
 '</div>' +
 '</article>';
 }

 function render() {
 const list = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
 if (!list.length) { window.location.reload(); return; }
 root.innerHTML = '<div class="bookings-list">' + list.map(row).join('') + '</div>';

 root.querySelectorAll('[data-action="cancel"]').forEach(function (btn) {
 btn.addEventListener('click', function () {
 const ref = btn.getAttribute('data-ref');
 if (!confirm('Cancel booking ' + ref + '? You\'ll be refunded in 3-5 business days.')) return;
 const all = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
 const updated = all.filter(function (x) { return x.ref !== ref; });
 localStorage.setItem('sunspot_bookings', JSON.stringify(updated));
 render();
 });
 });
 root.querySelectorAll('[data-action="qr"]').forEach(function (btn) {
 btn.addEventListener('click', function () {
 const ref = btn.getAttribute('data-ref');
 const all = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
 const found = all.find(function (x) { return x.ref === ref; });
 if (found) {
 localStorage.setItem('sunspot_last_booking', JSON.stringify(found));
 window.location.href = 'confirmation.html';
 }
 });
 });
 }

 render();
})();
