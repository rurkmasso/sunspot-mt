// ==========================================================
// Sunspot — photo lightbox (swipe gallery)
// Loaded on every page that needs gallery viewing.
// Window: SunspotLightbox.open(photos, startIndex, title)
// ==========================================================
(function () {
 'use strict';

 let root, imgEl, captionEl, dotsEl;
 let photos = [];
 let idx = 0;
 let title = '';
 let startX = null;

 function ensureRoot() {
 if (root) return;
 root = document.createElement('div');
 root.className = 'lb-root';
 root.innerHTML =
 '<div class="lb-backdrop"></div>' +
 '<div class="lb-frame">' +
 '<button class="lb-close" aria-label="Close">×</button>' +
 '<div class="lb-title"></div>' +
 '<button class="lb-nav lb-prev" aria-label="Previous">‹</button>' +
 '<img class="lb-img" alt="" />' +
 '<button class="lb-nav lb-next" aria-label="Next">›</button>' +
 '<div class="lb-dots"></div>' +
 '</div>';
 document.body.appendChild(root);

 imgEl = root.querySelector('.lb-img');
 captionEl = root.querySelector('.lb-title');
 dotsEl = root.querySelector('.lb-dots');

 root.querySelector('.lb-close').addEventListener('click', close);
 root.querySelector('.lb-backdrop').addEventListener('click', close);
 root.querySelector('.lb-prev').addEventListener('click', prev);
 root.querySelector('.lb-next').addEventListener('click', next);

 // Keyboard
 document.addEventListener('keydown', function (e) {
 if (!root.classList.contains('open')) return;
 if (e.key === 'Escape') close();
 else if (e.key === 'ArrowLeft') prev();
 else if (e.key === 'ArrowRight') next();
 });

 // Touch swipe
 imgEl.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
 imgEl.addEventListener('touchend', function (e) {
 if (startX == null) return;
 const dx = e.changedTouches[0].clientX - startX;
 if (Math.abs(dx)>50) (dx < 0 ? next : prev)();
 startX = null;
 });
 }

 function show() {
 imgEl.src = photos[idx];
 imgEl.alt = title + ' — photo ' + (idx + 1) + ' of ' + photos.length;
 captionEl.textContent = title + ' · ' + (idx + 1) + ' / ' + photos.length;
 dotsEl.innerHTML = photos.map(function (_, i) {
 return '<span class="lb-dot' + (i === idx ? ' active' : '') + '"></span>';
 }).join('');
 }
 function next() { idx = (idx + 1) % photos.length; show(); }
 function prev() { idx = (idx - 1 + photos.length) % photos.length; show(); }
 function close() {
 root.classList.remove('open');
 document.body.style.overflow = '';
 }

 function open(photoList, startIndex, t) {
 if (!photoList || !photoList.length) return;
 ensureRoot();
 photos = photoList;
 idx = startIndex || 0;
 title = t || '';
 show();
 root.classList.add('open');
 document.body.style.overflow = 'hidden';
 }

 window.SunspotLightbox = { open: open, close: close };
})();
