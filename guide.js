/* ============================================================
   Sunspot — Guide article (magazine layout).

   Visible upgrades over the old layout:
     - Full-bleed hero image with scrim + serif title overlay
     - Drop-cap on the first paragraph
     - Sun-ray rule above every h2
     - Premium venue cards (thumb + name + rating + price + CTA)
     - Pull-quote blocks supported via { type: 'quote', text: '…' }
     - Reading progress bar pinned to the top of the viewport
     - Editorial share row, "More guides" footer
   ============================================================ */
(function () {
 'use strict';

 const params = new URLSearchParams(window.location.search);
 const slug = params.get('g') || 'best-sunsets';
 const guides = window.SUNSPOT_GUIDES || [];
 const clubs  = window.SUNSPOT_CLUBS  || [];

 const g    = guides.find(x => x.slug === slug);
 const root = document.getElementById('guide-root');
 if (!g) {
  root.innerHTML =
   '<div class="ss-empty" style="padding:80px 24px;">' +
    '<div class="ss-empty-icon"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 9h.01M15 9h.01M9 16c1.5-1 4.5-1 6 0"/></svg></div>' +
    '<h3>Guide not found</h3>' +
    '<p>Sorry — that one\'s not in the field guide.</p>' +
    '<a href="guides.html" class="btn-primary" style="text-decoration:none;display:inline-block;">All guides →</a>' +
   '</div>';
  return;
 }

 // ─── SEO ───
 document.title = g.title + ' — Sunspot Field Guide';
 const setMeta = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('content', val); };
 setMeta('meta-desc', g.excerpt);
 const can = document.getElementById('canonical');
 if (can) can.setAttribute('href', 'https://sunspot.mt/guide.html?g=' + g.slug);
 setMeta('og-title', g.title);
 setMeta('og-desc', g.excerpt);

 const ld = document.getElementById('ld-article');
 if (ld) ld.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": g.title,
  "description": g.excerpt,
  "image": g.heroImage || undefined,
  "author":    { "@type": "Organization", "name": "Sunspot" },
  "publisher": { "@type": "Organization", "name": "Sunspot", "logo": { "@type": "ImageObject", "url": "https://sunspot.mt/logo.svg" }},
  "datePublished": "2026-05-15",
  "dateModified":  "2026-05-15",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://sunspot.mt/guide.html?g=" + g.slug },
 });

 // ─── Render body blocks ───
 function renderBlock(b) {
  if (b.type === 'p')  return '<p>' + b.text + '</p>';
  if (b.type === 'h2') return '<h2>' + b.text + '</h2>';
  if (b.type === 'quote') return '<blockquote>' + b.text + '</blockquote>';
  if (b.type === 'ul') return '<ul>' + b.items.map(i => '<li>' + i + '</li>').join('') + '</ul>';
  if (b.type === 'venue') {
   const c = clubs.find(x => x.id === b.id);
   if (!c) return '';
   const photo = (c.photos && c.photos[0]) || '';
   const sunbedFrom = c.sunbedFrom ? '<span class="price">From <strong>€' + c.sunbedFrom + '</strong></span>' : '';
   const rating = c.rating ? '<span class="rating">★ ' + c.rating + '</span>' : '';
   return '<a href="club.html?club=' + c.id + '" class="ss-article-venue">' +
     '<div class="thumb" style="background-image:url(\'' + photo + '\')"></div>' +
     '<div class="info">' +
       '<div>' +
         '<div class="name">' + c.name + '</div>' +
         '<div class="loc">' + (c.location || '') + '</div>' +
         '<div class="meta">' + rating + sunbedFrom + '</div>' +
       '</div>' +
       '<span class="cta">Reserve →</span>' +
     '</div>' +
   '</a>';
  }
  return '';
 }

 // ─── Compose hero + body ───
 const heroBg = g.heroImage
   ? "background-image:url('" + g.heroImage + "')"
   : "background:linear-gradient(135deg," + (g.color || '#1d2842') + ",#0a1f3a)";

 root.innerHTML =
  '<div class="ss-progress"><div class="bar"></div></div>' +

  '<header class="ss-article-hero">' +
   '<div class="photo" style="' + heroBg + '"></div>' +
   '<div class="scrim"></div>' +
   '<div class="inner">' +
     '<span class="kicker">' + g.tag + '</span>' +
     '<h1>' + g.title + '</h1>' +
     '<p class="excerpt">' + g.excerpt + '</p>' +
     '<div class="meta">' +
       '<span>' + g.readMinutes + ' min read</span>' +
       '<span class="dot"></span>' +
       '<span>Updated May 2026</span>' +
       '<span class="dot"></span>' +
       '<a href="guides.html" style="color:#ffd190;font-weight:600;text-decoration:none;">All guides</a>' +
     '</div>' +
   '</div>' +
  '</header>' +

  '<article class="ss-article">' +
   '<div class="ss-article-body">' +
     g.body.map(renderBlock).join('') +

     '<div class="ss-article-share">' +
       '<strong>Share</strong>' +
       '<button type="button" id="ss-share-copy">Copy link</button>' +
       '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(g.title + ' — Sunspot') +
         '&url=' + encodeURIComponent(window.location.href) + '" target="_blank" rel="noopener">Twitter</a>' +
       '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href) +
         '" target="_blank" rel="noopener">Facebook</a>' +
       '<a href="https://wa.me/?text=' + encodeURIComponent(g.title + ' — ' + window.location.href) +
         '" target="_blank" rel="noopener">WhatsApp</a>' +
     '</div>' +
   '</div>' +
  '</article>';

 // Copy-link button feedback
 const copyBtn = document.getElementById('ss-share-copy');
 if (copyBtn) {
  copyBtn.addEventListener('click', () => {
   navigator.clipboard.writeText(window.location.href);
   copyBtn.textContent = 'Copied ✓';
   setTimeout(() => copyBtn.textContent = 'Copy link', 1800);
  });
 }

 // ─── More guides ───
 const more = guides.filter(x => x.slug !== g.slug).slice(0, 3);
 const moreEl = document.getElementById('more-guides');
 if (moreEl) {
  moreEl.outerHTML =
   '<section class="ss-more-guides">' +
     '<h2>Keep reading</h2>' +
     '<div class="ss-guides-grid">' +
       more.map(m => {
         const hero = m.heroImage
           ? "background-image:url('" + m.heroImage + "')"
           : "background:linear-gradient(135deg,#1d2842,#0a1f3a)";
         return '<a href="guide.html?g=' + m.slug + '" class="ss-guide-cover">' +
           '<div class="photo" style="' + hero + '"></div>' +
           '<div class="scrim"></div>' +
           '<div class="content">' +
             '<span class="kicker">' + m.tag + '</span>' +
             '<h2>' + m.title + '</h2>' +
             '<div class="meta"><span>' + m.readMinutes + ' min read</span></div>' +
           '</div>' +
         '</a>';
       }).join('') +
     '</div>' +
   '</section>';
 }

 // ─── Reading progress bar ───
 const bar = root.querySelector('.ss-progress .bar');
 if (bar) {
  const tick = () => {
   const h = document.documentElement;
   const max = (h.scrollHeight - h.clientHeight) || 1;
   const pct = Math.min(100, Math.max(0, (h.scrollTop / max) * 100));
   bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', tick, { passive: true });
  tick();
 }
})();
