// ============================================================
// Sunspot Shop — minimal essentials catalog.
// Towels, bottles, goggles, basic apparel. Subtle branding only
// (small embroidered/embossed sun mark, never a big logo).
// ============================================================
(function () {
 'use strict';

 const PRODUCTS = [
 // ===== TOWELS =====
 {
 id: 'towel-classic-sand', name: 'Classic Beach Towel',
 cat: 'towels', price: 28, eur: 28,
 tag: 'Bestseller',
 summary: 'Quick-dry Turkish cotton, 90×170cm. Small embroidered sun mark.',
 desc: '100% Turkish cotton woven for quick-dry and sand-shedding. 90×170cm. Subtle sun mark embroidered tonally on the corner. No big logos.',
 colors: [
 { name: 'Sand', hex: '#e8d9b5' },
 { name: 'Navy', hex: '#0a1f3a' },
 { name: 'Sage', hex: '#9aa886' },
 { name: 'Terra', hex: '#b8553c' },
 ],
 photo: 'https://picsum.photos/seed/towel-classic/900/900',
 photos: ['https://picsum.photos/seed/towel-classic/1200/1200',
 'https://picsum.photos/seed/towel-classic-2/1200/1200',
 'https://picsum.photos/seed/towel-classic-3/1200/1200'],
 },
 {
 id: 'towel-xl', name: 'XL Beach Towel',
 cat: 'towels', price: 38, eur: 38,
 summary: 'Oversized 100×200cm, fits two. Same cotton, plain.',
 desc: 'Our largest towel. 100×200cm — for two adults or one adult with stuff. Same Turkish cotton, plain — no print, no logo on the visible side.',
 colors: [
 { name: 'Sand', hex: '#e8d9b5' },
 { name: 'Navy', hex: '#0a1f3a' },
 ],
 photo: 'https://picsum.photos/seed/towel-xl/900/900',
 },
 {
 id: 'towel-quickdry', name: 'Microfibre Travel Towel',
 cat: 'towels', price: 18, eur: 18,
 summary: 'Packs to the size of a fist. Dries in 10 minutes.',
 desc: 'Compact microfibre. Folds into a pouch the size of a fist. Sand falls off completely when shaken. For travel days when you cannot fit a real towel.',
 colors: [
 { name: 'Stone', hex: '#a8a8a3' },
 { name: 'Aqua', hex: '#5fb5b8' },
 ],
 photo: 'https://picsum.photos/seed/towel-microfibre/900/900',
 },

 // ===== BOTTLES =====
 {
 id: 'bottle-500', name: 'Insulated Bottle 500ml',
 cat: 'bottles', price: 24, eur: 24,
 tag: 'Bestseller',
 summary: 'Double-wall steel. Cold for 24h. Powder-coated, no print.',
 desc: '500ml vacuum-insulated stainless steel with a powder-coated matte finish that does not chip on rocks. No printed logo — the bottle is the design. Threads sealed; will not leak in a bag.',
 colors: [
 { name: 'Sand', hex: '#e8d9b5' },
 { name: 'Navy', hex: '#0a1f3a' },
 { name: 'Black', hex: '#1d2327' },
 ],
 photo: 'https://picsum.photos/seed/bottle-500/900/900',
 },
 {
 id: 'bottle-750', name: 'Insulated Bottle 750ml',
 cat: 'bottles', price: 28, eur: 28,
 summary: 'The bigger one. Same build. Fits car cupholders.',
 desc: '750ml version of the bestseller. Same powder-coated matte finish, same vacuum insulation, fits all standard car cupholders.',
 colors: [
 { name: 'Sand', hex: '#e8d9b5' },
 { name: 'Navy', hex: '#0a1f3a' },
 ],
 photo: 'https://picsum.photos/seed/bottle-750/900/900',
 },

 // ===== GOGGLES =====
 {
 id: 'goggles', name: 'Swim Goggles',
 cat: 'water', price: 18, eur: 18,
 summary: 'Smoke-tinted lenses, anti-fog. For sea swims.',
 desc: 'Polycarbonate lenses with anti-fog coating and UV400 protection. Silicone gasket sized for adult faces. Smoke tint cuts glare on bright days. Comes in a recycled-cotton drawstring pouch.',
 colors: [
 { name: 'Smoke', hex: '#3c434a' },
 { name: 'Clear', hex: '#cfd6dc' },
 ],
 photo: 'https://picsum.photos/seed/goggles/900/900',
 },
 {
 id: 'snorkel-set', name: 'Snorkel Mask + Tube',
 cat: 'water', price: 32, eur: 32,
 summary: 'Tempered glass mask, dry-top snorkel. Adult sizing.',
 desc: 'Tempered glass single-pane mask, silicone skirt for a proper seal, dry-top snorkel that closes when you submerge. Works at every rocky bay in Malta.',
 colors: [
 { name: 'Black', hex: '#1d2327' },
 { name: 'Aqua', hex: '#5fb5b8' },
 ],
 photo: 'https://picsum.photos/seed/snorkel-set/900/900',
 },

 // ===== APPAREL — subtle branding =====
 {
 id: 'tee', name: 'Heavyweight Cotton Tee',
 cat: 'apparel', price: 28, eur: 28,
 summary: '240gsm organic cotton. Small tonal sun on left chest.',
 desc: '240gsm organic cotton. Slight relaxed cut, true to size. Small sun mark embroidered on the left chest in matching thread — visible only up close.',
 sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
 colors: [
 { name: 'Cream', hex: '#f4ecd8' },
 { name: 'Navy', hex: '#0a1f3a' },
 { name: 'Sage', hex: '#9aa886' },
 { name: 'Black', hex: '#1d2327' },
 ],
 photo: 'https://picsum.photos/seed/tee-classic/900/900',
 },
 {
 id: 'cap', name: 'Five-Panel Cap',
 cat: 'apparel', price: 24, eur: 24,
 summary: 'Cotton twill, low profile. Small embroidered sun.',
 desc: 'Unstructured five-panel cotton cap. Low profile, leather strapback. Sun embroidered in matching thread on the front panel.',
 colors: [
 { name: 'Cream', hex: '#f4ecd8' },
 { name: 'Olive', hex: '#6b6f3a' },
 { name: 'Navy', hex: '#0a1f3a' },
 ],
 photo: 'https://picsum.photos/seed/cap/900/900',
 },

 // ===== ACCESSORIES =====
 {
 id: 'tote', name: 'Canvas Tote',
 cat: 'accessories', price: 18, eur: 18,
 summary: 'Heavy 12oz natural canvas. Long handles. Plain.',
 desc: '12oz natural cotton canvas. Reinforced base panel. Long handles for shoulder carry. No print on the bag — just clean canvas and a small sewn-in label inside.',
 colors: [
 { name: 'Natural', hex: '#e8d9b5' },
 ],
 photo: 'https://picsum.photos/seed/tote-canvas/900/900',
 },
 {
 id: 'sunscreen', name: 'Reef-Safe SPF 50',
 cat: 'accessories', price: 16, eur: 16,
 tag: 'EU-made',
 summary: 'Mineral SPF 50, 100ml. Made in Sicily.',
 desc: 'Zinc oxide + titanium dioxide. No oxybenzone, no octinoxate — safe for the marine reserves around Comino and Gozo. 100ml tube fits in a beach bag.',
 photo: 'https://picsum.photos/seed/sunscreen/900/900',
 },
 {
 id: 'flip-flops', name: 'Recycled Rubber Flip-Flops',
 cat: 'accessories', price: 22, eur: 22,
 summary: 'Made from recycled rubber. Wide, comfortable strap.',
 desc: 'Sole and strap from post-consumer recycled rubber. Wider strap than typical flip-flops — does not cut between toes. Anti-slip on wet stone.',
 sizes: ['37', '38', '39', '40', '41', '42', '43', '44', '45'],
 colors: [
 { name: 'Sand', hex: '#e8d9b5' },
 { name: 'Navy', hex: '#0a1f3a' },
 ],
 photo: 'https://picsum.photos/seed/flipflops/900/900',
 },
 {
 id: 'dry-bag', name: 'Dry Bag 10L',
 cat: 'water', price: 26, eur: 26,
 summary: 'Roll-top waterproof dry bag. Phone fits, towel fits, keys fit.',
 desc: '10L roll-top dry bag in nylon. Welded seams. Phone, keys, towel and a t-shirt all fit. For boat days, kayaks, and Mġarr ix-Xini swims when you cannot leave a bag on shore.',
 colors: [
 { name: 'Sand', hex: '#e8d9b5' },
 { name: 'Navy', hex: '#0a1f3a' },
 ],
 photo: 'https://picsum.photos/seed/drybag/900/900',
 },
 ];

 const CATEGORIES = [
 { id: 'all', label: 'All' },
 { id: 'towels', label: 'Towels' },
 { id: 'bottles', label: 'Bottles' },
 { id: 'water', label: 'Water gear' },
 { id: 'apparel', label: 'Apparel' },
 { id: 'accessories', label: 'Accessories' },
 ];

 window.SUNSPOT_PRODUCTS = PRODUCTS;
 window.SUNSPOT_PRODUCT_CATEGORIES = CATEGORIES;
})();
