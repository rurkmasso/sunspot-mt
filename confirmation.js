(function () {
 'use strict';
 const raw = localStorage.getItem('sunspot_last_booking');
 const root = document.getElementById('confirmation');
 if (!raw) {
 root.innerHTML = '<h1>No recent booking</h1><p><a href="index.html" class="btn-primary" style="display:inline-block;text-decoration:none">← Browse beaches</a></p>';
 return;
 }
 const b = JSON.parse(raw);

 const seatList = b.seats.map(function (s) {
 const t = { sunbed: 'Sunbed', cabana: 'Cabana', vip: 'VIP Gazebo' }[s.type];
 return '<li>' + t + ' <strong>' + s.id + '</strong>— €' + s.price + '</li>';
 }).join('');

 // QR code as a simple SVG matrix using the booking ref as a hash
 const qrSize = 12;
 const matrix = [];
 for (let y = 0; y < qrSize; y++) {
 matrix.push([]);
 for (let x = 0; x < qrSize; x++) {
 // Deterministic pseudo-random based on ref + position
 const seed = (b.ref.charCodeAt((x + y * 3) % b.ref.length) + x * 31 + y * 17) % 5;
 matrix[y].push(seed < 2 ? 1 : 0);
 }
 }
 // Force corner finder squares
 function setFinder(ox, oy) {
 for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
 const isEdge = x === 0 || y === 0 || x === 2 || y === 2;
 matrix[oy + y][ox + x] = isEdge ? 1 : 0;
 }
 }
 setFinder(0, 0); setFinder(qrSize - 3, 0); setFinder(0, qrSize - 3);
 let qrSvg = '<svg viewBox="0 0 ' + qrSize + ' ' + qrSize + '" class="qr">';
 for (let y = 0; y < qrSize; y++) for (let x = 0; x < qrSize; x++) {
 if (matrix[y][x]) qrSvg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0a1f3a"/>';
 }
 qrSvg += '</svg>';

 root.innerHTML =
 '<div class="conf-card">' +
 '<div class="conf-tick"></div>' +
 '<h1>You\'re booked!</h1>' +
 '<p class="muted">A confirmation has been sent to <strong>' + b.guest.email + '</strong>.</p>' +
 '<div class="conf-ref">Reference: <strong>' + b.ref + '</strong></div>' +
 '<div class="conf-grid">' +
 '<div class="conf-info">' +
 '<h2>' + b.clubName + '</h2>' +
 '<p>' + b.clubLocation + '</p>' +
 '<p><strong>' + b.date + '</strong>· ' + b.guests + ' guests</p>' +
 '<h3>Your spots</h3>' +
 '<ul class="conf-seats">' + seatList + '</ul>' +
 '<div class="conf-totals">' +
 '<div><span>Subtotal</span><span>€' + b.subtotal + '</span></div>' +
 '<div><span>Service fee</span><span>€' + b.fee + '</span></div>' +
 '<div class="t"><span>Paid</span><span>€' + b.total + '</span></div>' +
 '</div>' +
 '</div>' +
 '<div class="conf-qr">' +
 '<p class="qr-label">Show at the entrance</p>' +
 qrSvg +
 '<p class="qr-ref">' + b.ref + '</p>' +
 '</div>' +
 '</div>' +
 '<div class="conf-actions">' +
 '<a href="bookings.html" class="btn-primary" style="text-decoration:none;text-align:center;display:inline-block">View all my bookings</a>' +
 '<a href="index.html" class="btn-ghost" style="text-decoration:none;text-align:center;display:inline-block;line-height:1.4">← Book another beach</a>' +
 '</div>' +
 '</div>';
})();
