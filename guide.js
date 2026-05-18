(function () {
 'use strict';

 const params = new URLSearchParams(window.location.search);
 const slug = params.get('g') || 'best-sunsets';
 const guides = window.SUNSPOT_GUIDES || [];
 const clubs = window.SUNSPOT_CLUBS || [];

 const g = guides.find(x =>x.slug === slug);
 const root = document.getElementById('guide-root');

 if (!g) {
 root.innerHTML = '<div class="empty-card"><h2>Guide not found</h2><a href="guides.html" class="btn-primary" style="text-decoration:none;display:inline-block">← All guides</a></div>';
 return;
 }

 // SEO
 document.title = g.title + ' — Sunspot Guides';
 document.getElementById('meta-desc').setAttribute('content', g.excerpt);
 document.getElementById('canonical').setAttribute('href', 'https://sunspot.mt/guide.html?g=' + g.slug);
 document.getElementById('og-title').setAttribute('content', g.title);
 document.getElementById('og-desc').setAttribute('content', g.excerpt);

 document.getElementById('ld-article').textContent = JSON.stringify({
 "@context": "https://schema.org",
 "@type": "Article",
 "headline": g.title,
 "description": g.excerpt,
 "author": { "@type": "Organization", "name": "Sunspot" },
 "publisher": { "@type": "Organization", "name": "Sunspot", "logo": { "@type": "ImageObject", "url": "https://sunspot.mt/logo.svg" }},
 "datePublished": "2026-05-15",
 "dateModified": "2026-05-15",
 "mainEntityOfPage": { "@type": "WebPage", "@id": "https://sunspot.mt/guide.html?g=" + g.slug },
 });

 // Render body
 function renderBlock(b) {
 if (b.type === 'p') return '<p>' + b.text + '</p>';
 if (b.type === 'h2') return '<h2>' + b.text + '</h2>';
 if (b.type === 'ul') return '<ul class="guide-list">' + b.items.map(i =>'<li>' + i + '</li>').join('') + '</ul>';
 if (b.type === 'venue') {
 const c = clubs.find(x =>x.id === b.id);
 if (!c) return '';
 return `
 <a href="club.html?club=${c.id}" class="guide-venue-card">
<div class="gvc-thumb" style="background-image:url('${c.photos[0] || ''}')"></div>
<div class="gvc-info">
<div class="gvc-name">${c.name}</div>
<div class="gvc-loc">${c.location}</div>
<div class="gvc-meta"><span style="color:#f9a825"></span>${c.rating} · from €${c.sunbedFrom}</div>
<div class="gvc-cta">View venue →</div>
</div>
</a>`;
 }
 return '';
 }

 root.innerHTML = `
 <nav class="breadcrumb">
<a href="index.html">Sunspot</a><span>/</span>
<a href="guides.html">Guides</a><span>/</span>
<span>${g.title}</span>
</nav>

<header class="guide-header" style="background:linear-gradient(135deg, ${g.color}22, ${g.color}11)">
<span class="g-tag" style="background:${g.color}22;color:${g.color}">${g.tag}</span>
<div class="g-hero-emoji" aria-hidden="true">${g.heroEmoji}</div>
<h1>${g.title}</h1>
<p class="guide-excerpt">${g.excerpt}</p>
<p class="guide-meta">${g.readMinutes} min read · Updated May 2026</p>
</header>

<div class="guide-body">
${g.body.map(renderBlock).join('')}
</div>

<div class="guide-share">
<strong>Share this guide</strong>
<button class="btn-ghost" onclick="navigator.clipboard.writeText(window.location.href); this.textContent='Link copied '">Copy link</button>
<a class="btn-ghost" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(g.title + ' — Sunspot')}&url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" style="text-decoration:none;line-height:1.4">Tweet</a>
<a class="btn-ghost" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" style="text-decoration:none;line-height:1.4">Share</a>
</div>
`;

 // More guides
 const more = guides.filter(x =>x.slug !== g.slug).slice(0, 3);
 document.getElementById('more-guides').innerHTML = more.map(m =>`
 <a href="guide.html?g=${m.slug}" class="guide-card" style="border-left:4px solid ${m.color}">
<div class="g-tag" style="background:${m.color}22;color:${m.color}">${m.tag}</div>
<h2>${m.title}</h2>
<p>${m.excerpt}</p>
<span class="read-more">${m.readMinutes} min read →</span>
</a>
`).join('');
})();
