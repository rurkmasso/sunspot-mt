(function () {
 'use strict';

 const pendingRaw = localStorage.getItem('sunspot_pending');
 if (!pendingRaw) {
 document.getElementById('checkout-summary').innerHTML =
 '<h2>No reservation in progress</h2><p><a href="index.html" class="btn-primary" style="display:inline-block;text-align:center;text-decoration:none">← Pick a beach</a></p>';
 document.getElementById('checkout-form').style.display = 'none';
 return;
 }
 const pending = JSON.parse(pendingRaw);

 function renderSummary() {
 const seatLines = pending.seats.map(function (s) {
 const typeLabel = { sunbed: 'Sunbed', cabana: 'Cabana', vip: 'VIP Gazebo' }[s.type];
 return '<li><span><strong>' + typeLabel + ' ' + s.id + '</strong></span><span>€' + s.price + '</span></li>';
 }).join('');
 const thumb = pending.photo
 ? '<div class="summary-thumb" style="background-image:url(\'' + pending.photo + '\')"></div>'
 : '';
 document.getElementById('checkout-summary').innerHTML =
 '<h2>Booking summary</h2>' +
 thumb +
 '<div class="summary-club">' +
 '<strong>' + pending.clubName + '</strong>' +
 '<p>' + pending.clubLocation + '</p>' +
 '<p class="muted">' + pending.date + ' · ' + pending.guests + ' guests</p>' +
 '</div>' +
 '<ul class="summary-seats">' + seatLines + '</ul>' +
 '<div class="pricing-summary">' +
 '<div class="pricing-row"><span>Subtotal</span><span>€' + pending.subtotal + '</span></div>' +
 '<div class="pricing-row"><span>Service fee (8%)</span><span>€' + pending.fee + '</span></div>' +
 '<div class="pricing-row total"><span>Total</span><span>€' + pending.total + '</span></div>' +
 '</div>' +
 '<p class="trust-row">Secure · Free cancellation · QR check-in</p>' +
 '<p><a href="booking.html?club=' + pending.clubId + '" class="link-back">← Edit selection</a></p>';
 }
 renderSummary();

 document.getElementById('pay-btn').textContent = 'Pay €' + pending.total + ' & confirm';

 document.getElementById('checkout-form').addEventListener('submit', function (e) {
 e.preventDefault();
 if (!document.getElementById('terms').checked) {
 alert('Please accept the terms.');
 return;
 }
 const ref = 'BJ' + Date.now().toString(36).toUpperCase().slice(-6);
 const guest = {
 firstName: document.getElementById('first-name').value,
 lastName: document.getElementById('last-name').value,
 email: document.getElementById('email').value,
 phone: document.getElementById('phone').value,
 };
 const booking = Object.assign({}, pending, { ref: ref, guest: guest, createdAt: new Date().toISOString() });

 // Save to bookings list
 const bookings = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
 bookings.unshift(booking);
 localStorage.setItem('sunspot_bookings', JSON.stringify(bookings));
 // Mark this one as the latest confirmation for the next page
 localStorage.setItem('sunspot_last_booking', JSON.stringify(booking));
 localStorage.removeItem('sunspot_pending');

 window.location.href = 'confirmation.html';
 });

 // Mask the card number while typing (cosmetic)
 const cn = document.getElementById('card-number');
 cn.addEventListener('input', function () {
 const v = cn.value.replace(/\s/g, '').slice(0, 16);
 cn.value = v.replace(/(.{4})/g, '$1 ').trim();
 });
 const exp = document.getElementById('card-expiry');
 exp.addEventListener('input', function () {
 let v = exp.value.replace(/\D/g, '').slice(0, 4);
 if (v.length>2) v = v.slice(0, 2) + '/' + v.slice(2);
 exp.value = v;
 });
})();
