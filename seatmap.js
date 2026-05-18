// ==========================================================
// Sunspot — beach seatmap (clean rewrite)
// Each club has its own background + seat layout.
// All SVG is built in JS to avoid DOM-clearing edge cases.
// ==========================================================
(function () {
 'use strict';

 const SVG_NS = 'http://www.w3.org/2000/svg';

 // -- helpers ---------------------------------------------------
 function s(tag, attrs) {
 const e = document.createElementNS(SVG_NS, tag);
 if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
 return e;
 }
 function txt(tag, attrs, text) {
 const e = s(tag, attrs);
 e.textContent = text;
 return e;
 }
 function row(prefix, type, startX, y, w, h, price, count, opts) {
 opts = opts || {};
 const gap = opts.gap == null ? 4 : opts.gap;
 const sold = opts.sold || [];
 const out = [];
 for (let i = 0; i < count; i++) {
 out.push({
 id: prefix + (i + 1),
 type: type,
 x: startX + i * (w + gap),
 y: y, w: w, h: h, price: price,
 status: sold.indexOf(i)>= 0 ? 'sold' : 'available',
 });
 }
 return out;
 }
 function palm(x, y) {
 const g = s('g', { transform: 'translate(' + x + ',' + y + ')' });
 g.appendChild(s('rect', { x: -2, y: 0, width: 4, height: 20, fill: '#6d4c41' }));
 g.appendChild(s('circle', { cx: 0, cy: -2, r: 14, fill: '#558b2f' }));
 g.appendChild(s('circle', { cx: -8, cy: 2, r: 10, fill: '#689f38' }));
 g.appendChild(s('circle', { cx: 8, cy: 2, r: 10, fill: '#558b2f' }));
 return g;
 }
 function rock(cx, cy, rx, ry, color) {
 return s('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: color || '#a89180', stroke: '#7a6856', 'stroke-width': 1 });
 }
 function entrance(svg, x, y) {
 svg.appendChild(s('rect', { x: x, y: y, width: 90, height: 28, fill: '#fff', stroke: '#5d6a82' }));
 svg.appendChild(txt('text', { x: x + 45, y: y + 19, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', fill: '#0a1f3a' }, 'ENTRANCE'));
 }

 // -- club configs ----------------------------------------------
 const CLUBS = {

 // 1. AZURE BAY (Mellieha) -----------------------------------
 'azure-bay': {
 name: 'Azure Bay Club',
 location: ' Mellieha Bay, North Malta',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 90, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 55, class: 'sea-label', 'text-anchor': 'middle' }, 'MEDITERRANEAN SEA'));
 svg.appendChild(s('path', { d: 'M 0 90 Q 50 98 100 90 T 200 90 T 300 90 T 400 90 T 500 90 T 600 90 T 700 90 T 800 90 T 900 90 L 900 110 L 0 110 Z', fill: '#f0d9a8' }));
 svg.appendChild(s('rect', { x: 0, y: 100, width: 900, height: 570, fill: 'url(#sand-grad)' }));
 entrance(svg, 780, 115);
 // Bar building (curved)
 svg.appendChild(s('path', { d: 'M 540 180 Q 620 170 690 200 Q 750 240 760 320 Q 750 400 680 430 Q 610 445 540 435 Z', fill: '#c8a882', stroke: '#8b6f47', 'stroke-width': 1.5 }));
 svg.appendChild(txt('text', { x: 640, y: 320, class: 'zone-label', 'text-anchor': 'middle' }, ' BAR & LOUNGE'));
 // Pool
 svg.appendChild(s('rect', { x: 90, y: 340, width: 120, height: 75, rx: 4, fill: '#4fc3f7', stroke: '#0288d1', 'stroke-width': 2 }));
 svg.appendChild(txt('text', { x: 150, y: 385, 'font-size': 14, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', opacity: 0.9 }, 'POOL'));
 // Palms + boardwalk
 [palm(250, 210), palm(460, 500), palm(820, 540), palm(80, 550)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(s('rect', { x: 30, y: 645, width: 840, height: 20, fill: 'url(#wood-deck)', stroke: '#8b6f47' }));
 // Zone labels
 svg.appendChild(txt('text', { x: 150, y: 175, class: 'zone-label', 'text-anchor': 'middle' }, 'FRONT ROW · SEA VIEW'));
 svg.appendChild(txt('text', { x: 340, y: 480, class: 'zone-label', 'text-anchor': 'middle' }, 'CENTRAL DECK'));
 svg.appendChild(txt('text', { x: 150, y: 440, class: 'zone-label', 'text-anchor': 'middle' }, 'POOLSIDE'));
 },
 seats: [].concat(
 row('F', 'sunbed', 50, 120, 22, 32, 45, 14, { sold: [3, 9] }),
 row('B', 'sunbed', 50, 165, 22, 32, 35, 14, { sold: [0, 5, 11] }),
 row('P', 'sunbed', 50, 240, 25, 32, 30, 6, { sold: [2, 4] }),
 [
 { id: 'C1', type: 'cabana', x: 230, y: 240, w: 62, h: 52, price: 120, status: 'available' },
 { id: 'C2', type: 'cabana', x: 300, y: 240, w: 62, h: 52, price: 120, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 370, y: 240, w: 62, h: 52, price: 120, status: 'available' },
 { id: 'C4', type: 'cabana', x: 440, y: 240, w: 62, h: 52, price: 120, status: 'available' },
 ],
 row('D', 'sunbed', 240, 310, 22, 30, 28, 12, { sold: [1, 7, 10] }),
 row('L', 'sunbed', 50, 440, 25, 32, 30, 6, { sold: [3] }),
 [
 { id: 'V1', type: 'vip', x: 300, y: 435, w: 80, h: 65, price: 220, status: 'available' },
 { id: 'V2', type: 'vip', x: 390, y: 435, w: 80, h: 65, price: 220, status: 'available' },
 { id: 'V3', type: 'vip', x: 480, y: 435, w: 80, h: 65, price: 220, status: 'sold' },
 ],
 row('BW', 'sunbed', 80, 570, 24, 40, 25, 18, { sold: [2, 8, 15] })
 ),
 },

 // 2. BLUE LAGOON (Comino) -----------------------------------
 'blue-lagoon': {
 name: 'Blue Lagoon Lounge',
 location: ' Comino Island',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: '#fef9e7' }));
 // Cliffs left/right (Comino is rocky)
 svg.appendChild(s('path', { d: 'M 0 0 L 130 0 Q 110 100 130 200 Q 100 300 130 400 Q 100 500 130 600 Q 90 660 0 700 Z', fill: '#cdb798', stroke: '#9e8b6f', 'stroke-width': 1.5 }));
 svg.appendChild(s('path', { d: 'M 900 0 L 770 0 Q 790 100 770 200 Q 800 300 770 400 Q 800 500 770 600 Q 810 660 900 700 Z', fill: '#cdb798', stroke: '#9e8b6f', 'stroke-width': 1.5 }));
 // Turquoise lagoon (curvy, central top)
 svg.appendChild(s('path', { d: 'M 130 0 Q 300 60 600 40 Q 720 60 770 0 L 770 340 Q 700 400 580 360 Q 400 330 250 360 Q 180 380 130 340 Z', fill: '#26c6da', stroke: '#0097a7', 'stroke-width': 2 }));
 svg.appendChild(s('path', { d: 'M 200 80 Q 350 100 500 80 Q 600 70 700 90 L 700 280 Q 550 300 380 280 Q 280 290 200 270 Z', fill: '#80deea', opacity: 0.5 }));
 svg.appendChild(txt('text', { x: 450, y: 200, class: 'sea-label', 'text-anchor': 'middle', fill: '#006064' }, 'BLUE LAGOON'));
 // Boat dock
 svg.appendChild(s('rect', { x: 420, y: 60, width: 60, height: 8, fill: '#8b6f47' }));
 svg.appendChild(s('rect', { x: 445, y: 0, width: 10, height: 70, fill: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 45, 'font-size': 10, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle' }, ' DOCK'));
 // Rocks
 svg.appendChild(rock(150, 380, 30, 12));
 svg.appendChild(rock(750, 380, 25, 10));
 // Beach bar
 svg.appendChild(s('rect', { x: 380, y: 430, width: 140, height: 60, rx: 6, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 465, class: 'zone-label', 'text-anchor': 'middle' }, ' BEACH BAR'));
 // Entrance + palms
 entrance(svg, 405, 660);
 [palm(150, 460), palm(750, 460), palm(160, 600), palm(740, 600)].forEach(function (p) { svg.appendChild(p); });
 // Labels
 svg.appendChild(txt('text', { x: 450, y: 410, class: 'zone-label', 'text-anchor': 'middle' }, 'LAGOONSIDE LOUNGE'));
 svg.appendChild(txt('text', { x: 450, y: 540, class: 'zone-label', 'text-anchor': 'middle' }, 'CABANA STRIP'));
 },
 seats: [].concat(
 row('L', 'sunbed', 180, 380, 26, 36, 50, 12, { sold: [4, 8] }),
 [
 { id: 'C1', type: 'cabana', x: 200, y: 510, w: 70, h: 60, price: 180, status: 'available' },
 { id: 'C2', type: 'cabana', x: 285, y: 510, w: 70, h: 60, price: 180, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 545, y: 510, w: 70, h: 60, price: 180, status: 'available' },
 { id: 'C4', type: 'cabana', x: 630, y: 510, w: 70, h: 60, price: 180, status: 'available' },
 { id: 'V1', type: 'vip', x: 360, y: 580, w: 90, h: 70, price: 320, status: 'available' },
 { id: 'V2', type: 'vip', x: 455, y: 580, w: 90, h: 70, price: 320, status: 'sold' },
 ]
 ),
 },

 // 3. GOLDEN SANDS (Ghajn Tuffieha) --------------------------
 'golden-sands': {
 name: 'Golden Sands Beach Club',
 location: ' Ghajn Tuffieha (Riviera), Malta',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 130, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 75, class: 'sea-label', 'text-anchor': 'middle' }, 'MEDITERRANEAN SEA'));
 svg.appendChild(s('path', { d: 'M 0 130 Q 100 150 200 135 Q 350 110 500 130 Q 650 150 800 130 Q 850 125 900 135 L 900 160 L 0 160 Z', fill: '#f5d98a' }));
 svg.appendChild(s('rect', { x: 0, y: 150, width: 900, height: 540, fill: '#f0c97c' }));
 // Orange clay cliffs
 svg.appendChild(s('path', { d: 'M 0 130 Q 60 200 30 300 Q 60 400 30 500 Q 60 600 0 700 L 0 130 Z', fill: '#d4955a', stroke: '#a06b3d', 'stroke-width': 1.5 }));
 svg.appendChild(s('path', { d: 'M 900 130 Q 840 200 870 300 Q 840 400 870 500 Q 840 600 900 700 L 900 130 Z', fill: '#d4955a', stroke: '#a06b3d', 'stroke-width': 1.5 }));
 entrance(svg, 405, 660);
 // Bar/grill
 svg.appendChild(s('rect', { x: 350, y: 540, width: 200, height: 70, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 580, class: 'zone-label', 'text-anchor': 'middle' }, ' BEACH BAR & GRILL'));
 [palm(110, 200), palm(790, 200), palm(120, 450), palm(780, 450)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 195, class: 'zone-label', 'text-anchor': 'middle' }, 'PREMIUM SHORELINE'));
 svg.appendChild(txt('text', { x: 450, y: 335, class: 'zone-label', 'text-anchor': 'middle' }, 'SECOND ROW'));
 svg.appendChild(txt('text', { x: 450, y: 470, class: 'zone-label', 'text-anchor': 'middle' }, 'GAZEBO ROW'));
 },
 seats: [].concat(
 row('F', 'sunbed', 80, 215, 22, 32, 40, 28, { sold: [4, 11, 19, 25], gap: 3 }),
 row('S', 'sunbed', 80, 260, 22, 32, 30, 28, { sold: [6, 14, 22], gap: 3 }),
 row('T', 'sunbed', 80, 350, 22, 32, 22, 28, { sold: [3, 17], gap: 3 }),
 row('Q', 'sunbed', 80, 395, 22, 32, 22, 28, { sold: [10, 25], gap: 3 }),
 [
 { id: 'G1', type: 'cabana', x: 130, y: 480, w: 70, h: 50, price: 90, status: 'available' },
 { id: 'G2', type: 'cabana', x: 215, y: 480, w: 70, h: 50, price: 90, status: 'available' },
 { id: 'G3', type: 'cabana', x: 615, y: 480, w: 70, h: 50, price: 90, status: 'sold' },
 { id: 'G4', type: 'cabana', x: 700, y: 480, w: 70, h: 50, price: 90, status: 'available' },
 ]
 ),
 },

 // 4. ST. PETER'S POOL (Marsaxlokk) --------------------------
 'st-peters': {
 name: "St. Peter's Pool Club",
 location: ' Marsaxlokk, Southeast Malta',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: '#e8dcc4' }));
 svg.appendChild(s('path', { d: 'M 0 0 L 900 0 L 900 80 Q 800 120 700 100 Q 600 70 500 90 Q 400 110 300 90 Q 200 70 100 100 Q 50 110 0 80 Z', fill: 'url(#sea-grad)' }));
 // Natural rock pool (kidney shape)
 svg.appendChild(s('path', { d: 'M 280 220 Q 220 260 240 340 Q 250 420 320 450 Q 420 470 520 460 Q 620 440 660 380 Q 680 300 620 250 Q 540 210 440 215 Q 350 210 280 220 Z', fill: '#26c6da', stroke: '#006064', 'stroke-width': 3 }));
 svg.appendChild(s('path', { d: 'M 320 250 Q 290 290 310 350 Q 330 410 400 425 Q 500 435 580 420 Q 630 390 640 330 Q 620 280 540 260 Q 450 250 380 255 Z', fill: '#80deea', opacity: 0.55 }));
 svg.appendChild(txt('text', { x: 460, y: 345, class: 'sea-label', 'text-anchor': 'middle', fill: '#006064', 'font-size': 24 }, 'NATURAL ROCK POOL'));
 // Rocks scattered
 [[120, 200, 50, 22], [180, 170, 35, 14], [750, 200, 50, 22], [800, 250, 30, 14], [150, 500, 45, 18], [800, 500, 45, 18], [450, 580, 60, 20]]
 .forEach(function (r) { svg.appendChild(rock(r[0], r[1], r[2], r[3])); });
 // Diving platform
 svg.appendChild(s('circle', { cx: 660, cy: 230, r: 12, fill: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 660, y: 234, 'font-size': 14, 'text-anchor': 'middle', fill: '#fff' }, '⤓'));
 svg.appendChild(txt('text', { x: 700, y: 235, 'font-size': 11, 'font-weight': 700, fill: '#0a1f3a' }, 'DIVE'));
 entrance(svg, 405, 660);
 svg.appendChild(txt('text', { x: 150, y: 130, class: 'zone-label', 'text-anchor': 'middle' }, 'WEST ROCKS'));
 svg.appendChild(txt('text', { x: 750, y: 130, class: 'zone-label', 'text-anchor': 'middle' }, 'EAST ROCKS'));
 svg.appendChild(txt('text', { x: 450, y: 540, class: 'zone-label', 'text-anchor': 'middle' }, 'SUN PLATFORM'));
 },
 seats: [].concat(
 // West rocks
 [
 { id: 'W1', type: 'sunbed', x: 70, y: 240, w: 26, h: 40, price: 18 },
 { id: 'W2', type: 'sunbed', x: 70, y: 290, w: 26, h: 40, price: 18 },
 { id: 'W3', type: 'sunbed', x: 70, y: 340, w: 26, h: 40, price: 15, status: 'sold' },
 { id: 'W4', type: 'sunbed', x: 70, y: 390, w: 26, h: 40, price: 15 },
 { id: 'W5', type: 'sunbed', x: 70, y: 440, w: 26, h: 40, price: 15 },
 { id: 'W6', type: 'sunbed', x: 110, y: 280, w: 26, h: 40, price: 18 },
 { id: 'W7', type: 'sunbed', x: 110, y: 330, w: 26, h: 40, price: 18, status: 'sold' },
 { id: 'W8', type: 'sunbed', x: 110, y: 380, w: 26, h: 40, price: 18 },
 { id: 'W9', type: 'sunbed', x: 150, y: 310, w: 26, h: 40, price: 25 },
 { id: 'W10', type: 'sunbed', x: 150, y: 360, w: 26, h: 40, price: 25 },
 // East rocks
 { id: 'E1', type: 'sunbed', x: 800, y: 240, w: 26, h: 40, price: 18 },
 { id: 'E2', type: 'sunbed', x: 800, y: 290, w: 26, h: 40, price: 18, status: 'sold' },
 { id: 'E3', type: 'sunbed', x: 800, y: 340, w: 26, h: 40, price: 15 },
 { id: 'E4', type: 'sunbed', x: 800, y: 390, w: 26, h: 40, price: 15 },
 { id: 'E5', type: 'sunbed', x: 800, y: 440, w: 26, h: 40, price: 15 },
 { id: 'E6', type: 'sunbed', x: 760, y: 280, w: 26, h: 40, price: 18 },
 { id: 'E7', type: 'sunbed', x: 760, y: 330, w: 26, h: 40, price: 18 },
 { id: 'E8', type: 'sunbed', x: 760, y: 380, w: 26, h: 40, price: 18, status: 'sold' },
 { id: 'E9', type: 'sunbed', x: 720, y: 310, w: 26, h: 40, price: 25 },
 { id: 'E10', type: 'sunbed', x: 720, y: 360, w: 26, h: 40, price: 25 },
 ],
 row('S', 'sunbed', 250, 600, 24, 36, 30, 14, { sold: [3, 8] })
 ),
 },

 // 5. XLENDI COVE (Gozo) -------------------------------------
 'xlendi': {
 name: 'Xlendi Cove Resort',
 location: ' Xlendi, Gozo',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: '#f0d9a8' }));
 // Tall cliffs
 svg.appendChild(s('path', { d: 'M 0 0 L 250 0 Q 240 100 270 200 Q 290 300 270 400 Q 240 500 260 600 Q 280 660 250 700 L 0 700 Z', fill: '#bda88a', stroke: '#8b7355', 'stroke-width': 1.5 }));
 svg.appendChild(s('path', { d: 'M 900 0 L 650 0 Q 660 100 630 200 Q 610 300 630 400 Q 660 500 640 600 Q 620 660 650 700 L 900 700 Z', fill: '#bda88a', stroke: '#8b7355', 'stroke-width': 1.5 }));
 // Inlet
 svg.appendChild(s('path', { d: 'M 270 0 L 630 0 Q 620 80 640 160 Q 630 220 600 240 L 300 240 Q 270 220 260 160 Q 280 80 270 0 Z', fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 100, class: 'sea-label', 'text-anchor': 'middle', 'font-size': 26 }, 'XLENDI BAY'));
 // Stone steps
 svg.appendChild(s('rect', { x: 410, y: 240, width: 80, height: 30, fill: '#cdb798', stroke: '#9e8b6f' }));
 svg.appendChild(txt('text', { x: 450, y: 260, 'font-size': 10, 'font-weight': 700, fill: '#5a4a32', 'text-anchor': 'middle' }, ' STEPS'));
 // Bar
 svg.appendChild(s('rect', { x: 360, y: 580, width: 180, height: 60, rx: 6, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 615, class: 'zone-label', 'text-anchor': 'middle' }, ' SEAFOOD GRILL'));
 entrance(svg, 405, 660);
 [palm(310, 320), palm(590, 320), palm(310, 540), palm(590, 540)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 290, class: 'zone-label', 'text-anchor': 'middle' }, 'WATERSIDE'));
 svg.appendChild(txt('text', { x: 450, y: 480, class: 'zone-label', 'text-anchor': 'middle' }, 'COVE LOUNGE'));
 },
 seats: [].concat(
 row('W', 'sunbed', 290, 305, 25, 36, 45, 11, { sold: [2, 7] }),
 row('M', 'sunbed', 290, 360, 25, 36, 35, 11, { sold: [5] }),
 row('K', 'sunbed', 290, 410, 25, 36, 28, 11, { sold: [4, 9] }),
 [
 { id: 'C1', type: 'cabana', x: 290, y: 470, w: 70, h: 60, price: 140, status: 'available' },
 { id: 'C2', type: 'cabana', x: 540, y: 470, w: 70, h: 60, price: 140, status: 'sold' },
 { id: 'V1', type: 'vip', x: 380, y: 480, w: 140, h: 75, price: 280, status: 'available' },
 ]
 ),
 },

 // 7. PARADISE BAY (Cirkewwa) --------------------------------
 'paradise-bay': {
 name: 'Paradise Bay Club',
 location: ' Ċirkewwa (Marfa Ridge), Malta',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: 'url(#sand-grad)' }));
 svg.appendChild(s('path', { d: 'M 0 0 L 200 0 Q 220 80 180 180 L 200 700 L 0 700 Z', fill: '#bda88a', stroke: '#8b7355', 'stroke-width': 1.5 }));
 svg.appendChild(s('path', { d: 'M 900 0 L 700 0 Q 680 80 720 180 L 700 700 L 900 700 Z', fill: '#bda88a', stroke: '#8b7355', 'stroke-width': 1.5 }));
 // Open water in middle
 svg.appendChild(s('rect', { x: 200, y: 0, width: 500, height: 220, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 130, class: 'sea-label', 'text-anchor': 'middle' }, 'OPEN SEA'));
 // Stone steps to water
 svg.appendChild(s('rect', { x: 410, y: 220, width: 80, height: 30, fill: '#cdb798', stroke: '#9e8b6f' }));
 // Bar
 svg.appendChild(s('rect', { x: 350, y: 580, width: 200, height: 60, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 615, class: 'zone-label', 'text-anchor': 'middle' }, ' PARADISE BAR'));
 entrance(svg, 405, 660);
 [palm(240, 320), palm(660, 320), palm(240, 510), palm(660, 510)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 280, class: 'zone-label', 'text-anchor': 'middle' }, 'WATERFRONT'));
 svg.appendChild(txt('text', { x: 450, y: 480, class: 'zone-label', 'text-anchor': 'middle' }, 'CABANAS'));
 },
 seats: [].concat(
 row('W', 'sunbed', 230, 290, 24, 36, 35, 18, { sold: [3, 8, 14] }),
 row('S', 'sunbed', 230, 340, 24, 36, 28, 18, { sold: [5, 12] }),
 row('T', 'sunbed', 230, 390, 24, 36, 22, 18, { sold: [9] }),
 [
 { id: 'C1', type: 'cabana', x: 250, y: 460, w: 70, h: 55, price: 100, status: 'available' },
 { id: 'C2', type: 'cabana', x: 340, y: 460, w: 70, h: 55, price: 100, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 490, y: 460, w: 70, h: 55, price: 100, status: 'available' },
 { id: 'C4', type: 'cabana', x: 580, y: 460, w: 70, h: 55, price: 100, status: 'available' },
 ]
 ),
 },

 // 8. SLIEMA FRONT (Sliema, urban) ---------------------------
 'flo': {
 name: 'FLO Skypool',
 location: ' Paceville rooftop, St Julian\'s',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 200, fill: 'url(#sea-grad)' }));
 // Valletta skyline silhouette across water
 svg.appendChild(s('path', {
 d: 'M 0 110 L 60 110 L 70 95 L 130 95 L 140 80 L 200 80 L 215 95 L 280 95 L 290 70 L 340 70 L 355 90 L 420 90 L 435 75 L 510 75 L 525 95 L 600 95 L 615 78 L 680 78 L 700 95 L 760 95 L 775 88 L 840 88 L 855 95 L 900 95 L 900 200 L 0 200 Z',
 fill: '#0a1f3a', opacity: 0.85,
 }));
 svg.appendChild(txt('text', { x: 450, y: 60, class: 'sea-label', 'text-anchor': 'middle' }, 'GRAND HARBOUR VIEW'));
 // Concrete platform / urban beach
 svg.appendChild(s('rect', { x: 0, y: 200, width: 900, height: 470, fill: '#e0e3e8' }));
 svg.appendChild(s('rect', { x: 0, y: 200, width: 900, height: 30, fill: '#cfd4dc' }));
 // VIP zone
 svg.appendChild(s('rect', { x: 350, y: 540, width: 200, height: 100, rx: 8, fill: '#ede0c0', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 580, class: 'zone-label', 'text-anchor': 'middle' }, ' ROOFTOP BAR'));
 entrance(svg, 405, 660);
 [palm(120, 460), palm(780, 460)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 260, class: 'zone-label', 'text-anchor': 'middle' }, 'HARBOUR-VIEW DECK'));
 svg.appendChild(txt('text', { x: 450, y: 410, class: 'zone-label', 'text-anchor': 'middle' }, 'CITY DECK'));
 },
 seats: [].concat(
 row('H', 'sunbed', 80, 285, 22, 32, 50, 26, { sold: [3, 8, 14, 20], gap: 3 }),
 row('D', 'sunbed', 80, 340, 22, 32, 35, 26, { sold: [4, 11, 22], gap: 3 }),
 row('M', 'sunbed', 80, 430, 22, 32, 30, 26, { sold: [7, 17], gap: 3 }),
 [
 { id: 'C1', type: 'cabana', x: 100, y: 480, w: 65, h: 50, price: 150, status: 'available' },
 { id: 'C2', type: 'cabana', x: 180, y: 480, w: 65, h: 50, price: 150, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 660, y: 480, w: 65, h: 50, price: 150, status: 'available' },
 { id: 'C4', type: 'cabana', x: 740, y: 480, w: 65, h: 50, price: 150, status: 'available' },
 { id: 'V1', type: 'vip', x: 380, y: 555, w: 140, h: 75, price: 250, status: 'available' },
 ]
 ),
 },

 // 9. LONG BEACH (Xemxija) -----------------------------------
 'noma': {
 name: 'Noma Island',
 location: ' Floating · 7 min boat from Sliema',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 90, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 55, class: 'sea-label', 'text-anchor': 'middle' }, "ST. PAUL'S BAY"));
 svg.appendChild(s('path', { d: 'M 0 90 Q 200 100 450 92 Q 700 84 900 95 L 900 110 L 0 110 Z', fill: '#f5d98a' }));
 svg.appendChild(s('rect', { x: 0, y: 100, width: 900, height: 570, fill: '#fff5e1' }));
 // Lots of cabanas (family-friendly)
 entrance(svg, 405, 660);
 svg.appendChild(s('rect', { x: 350, y: 580, width: 200, height: 60, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 615, class: 'zone-label', 'text-anchor': 'middle' }, ' KIDS\' KITCHEN'));
 [palm(80, 200), palm(820, 200), palm(80, 450), palm(820, 450)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 175, class: 'zone-label', 'text-anchor': 'middle' }, 'WATERFRONT SUNBEDS'));
 svg.appendChild(txt('text', { x: 450, y: 330, class: 'zone-label', 'text-anchor': 'middle' }, 'CABANA VILLAGE'));
 svg.appendChild(txt('text', { x: 450, y: 490, class: 'zone-label', 'text-anchor': 'middle' }, 'BUDGET ROW'));
 },
 seats: [].concat(
 row('F', 'sunbed', 80, 200, 22, 32, 22, 26, { sold: [4, 11, 18], gap: 3 }),
 row('B', 'sunbed', 80, 245, 22, 32, 17, 26, { sold: [6, 14], gap: 3 }),
 // 8 cabanas in a row (lots!)
 [
 { id: 'C1', type: 'cabana', x: 110, y: 350, w: 70, h: 60, price: 95 },
 { id: 'C2', type: 'cabana', x: 195, y: 350, w: 70, h: 60, price: 95, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 280, y: 350, w: 70, h: 60, price: 95 },
 { id: 'C4', type: 'cabana', x: 365, y: 350, w: 70, h: 60, price: 95 },
 { id: 'C5', type: 'cabana', x: 450, y: 350, w: 70, h: 60, price: 95 },
 { id: 'C6', type: 'cabana', x: 535, y: 350, w: 70, h: 60, price: 95, status: 'sold' },
 { id: 'C7', type: 'cabana', x: 620, y: 350, w: 70, h: 60, price: 95 },
 { id: 'C8', type: 'cabana', x: 705, y: 350, w: 70, h: 60, price: 95 },
 ],
 row('Q', 'sunbed', 80, 510, 22, 32, 17, 26, { sold: [9, 21], gap: 3 })
 ),
 },

 // 10. DWEJRA INLAND SEA (Gozo) ------------------------------
 'dwejra': {
 name: 'Dwejra Inland Sea Club',
 location: ' San Lawrenz, Gozo',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: '#cdb798' }));
 // Inland sea (large oval, central)
 svg.appendChild(s('ellipse', { cx: 380, cy: 350, rx: 280, ry: 180, fill: '#26c6da', stroke: '#006064', 'stroke-width': 3 }));
 svg.appendChild(s('ellipse', { cx: 380, cy: 350, rx: 240, ry: 144, fill: '#80deea', opacity: 0.5 }));
 svg.appendChild(txt('text', { x: 380, y: 360, class: 'sea-label', 'text-anchor': 'middle', fill: '#006064' }, 'INLAND SEA'));
 // Tunnel to open sea (right)
 svg.appendChild(s('rect', { x: 660, y: 335, width: 180, height: 30, fill: '#26c6da' }));
 svg.appendChild(txt('text', { x: 750, y: 355, 'font-size': 11, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle' }, '↔ TUNNEL'));
 svg.appendChild(s('rect', { x: 840, y: 280, width: 60, height: 140, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 870, y: 270, 'font-size': 10, 'font-weight': 700, fill: '#0a1f3a', 'text-anchor': 'middle' }, 'OPEN SEA'));
 entrance(svg, 405, 660);
 // Boat dock
 svg.appendChild(s('rect', { x: 300, y: 540, width: 160, height: 14, fill: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 380, y: 552, 'font-size': 11, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle' }, ' BOAT DOCK'));
 svg.appendChild(txt('text', { x: 200, y: 130, class: 'zone-label', 'text-anchor': 'middle' }, 'WEST PLATFORM'));
 svg.appendChild(txt('text', { x: 200, y: 600, class: 'zone-label', 'text-anchor': 'middle' }, 'SOUTH PLATFORM'));
 },
 seats: [].concat(
 row('N', 'sunbed', 100, 150, 24, 36, 28, 7),
 [
 { id: 'W1', type: 'sunbed', x: 60, y: 250, w: 26, h: 40, price: 30 },
 { id: 'W2', type: 'sunbed', x: 60, y: 300, w: 26, h: 40, price: 30, status: 'sold' },
 { id: 'W3', type: 'sunbed', x: 60, y: 350, w: 26, h: 40, price: 30 },
 { id: 'W4', type: 'sunbed', x: 60, y: 400, w: 26, h: 40, price: 30 },
 { id: 'W5', type: 'sunbed', x: 60, y: 450, w: 26, h: 40, price: 28 },
 ],
 row('P', 'sunbed', 100, 610, 24, 36, 25, 11, { sold: [3, 8] })
 ),
 },

 // 11. HONDOQ (Gozo, Qala) -----------------------------------
 'hondoq': {
 name: 'Ħondoq ir-Rummien',
 location: ' Qala, Gozo',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 90, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 55, class: 'sea-label', 'text-anchor': 'middle' }, 'COMINO CHANNEL'));
 // Comino in the distance
 svg.appendChild(s('ellipse', { cx: 450, cy: 80, rx: 120, ry: 18, fill: '#a89180', opacity: 0.4 }));
 svg.appendChild(s('path', { d: 'M 0 90 Q 200 100 450 92 Q 700 84 900 95 L 900 110 L 0 110 Z', fill: '#f5d98a' }));
 svg.appendChild(s('rect', { x: 0, y: 100, width: 900, height: 570, fill: '#fff5e1' }));
 // Cliffs left/right (modest)
 svg.appendChild(s('path', { d: 'M 0 100 Q 60 200 30 400 Q 60 600 0 700 Z', fill: '#cdb798' }));
 svg.appendChild(s('path', { d: 'M 900 100 Q 840 200 870 400 Q 840 600 900 700 Z', fill: '#cdb798' }));
 // Bar
 svg.appendChild(s('rect', { x: 350, y: 580, width: 200, height: 60, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 615, class: 'zone-label', 'text-anchor': 'middle' }, ' LOCAL KIOSK'));
 entrance(svg, 405, 660);
 [palm(120, 200), palm(780, 200), palm(120, 450), palm(780, 450)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 175, class: 'zone-label', 'text-anchor': 'middle' }, 'COMINO-VIEW ROW'));
 svg.appendChild(txt('text', { x: 450, y: 380, class: 'zone-label', 'text-anchor': 'middle' }, 'CABANAS'));
 },
 seats: [].concat(
 row('F', 'sunbed', 80, 200, 22, 32, 24, 26, { sold: [5, 12, 19], gap: 3 }),
 row('B', 'sunbed', 80, 245, 22, 32, 19, 26, { sold: [3, 16], gap: 3 }),
 [
 { id: 'C1', type: 'cabana', x: 130, y: 400, w: 70, h: 55, price: 95 },
 { id: 'C2', type: 'cabana', x: 220, y: 400, w: 70, h: 55, price: 95, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 310, y: 400, w: 70, h: 55, price: 95 },
 { id: 'C4', type: 'cabana', x: 520, y: 400, w: 70, h: 55, price: 95 },
 { id: 'C5', type: 'cabana', x: 610, y: 400, w: 70, h: 55, price: 95 },
 { id: 'C6', type: 'cabana', x: 700, y: 400, w: 70, h: 55, price: 95 },
 ],
 row('S', 'sunbed', 80, 490, 22, 32, 19, 26, { sold: [7], gap: 3 })
 ),
 },

 // 12. PRETTY BAY (Birzebbuga) -------------------------------
 'cafe-del-mar': {
 name: 'Café del Mar Malta',
 location: ' Qawra (St Paul\'s Bay)',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 130, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 55, class: 'sea-label', 'text-anchor': 'middle' }, 'PRETTY BAY'));
 // Freeport silhouette in distance
 svg.appendChild(s('rect', { x: 80, y: 50, width: 220, height: 60, fill: '#5d6a82', opacity: 0.7 }));
 [[100, 30, 6, 20], [140, 25, 6, 25], [180, 30, 6, 20], [230, 25, 6, 25], [270, 30, 6, 20]].forEach(function (p) {
 svg.appendChild(s('rect', { x: p[0], y: p[1], width: p[2], height: p[3], fill: '#5d6a82', opacity: 0.7 }));
 });
 svg.appendChild(s('path', { d: 'M 0 130 Q 200 138 450 132 Q 700 126 900 135 L 900 150 L 0 150 Z', fill: '#f5d98a' }));
 svg.appendChild(s('rect', { x: 0, y: 140, width: 900, height: 530, fill: '#ffe9c4' }));
 // Bar
 svg.appendChild(s('rect', { x: 350, y: 580, width: 200, height: 60, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 615, class: 'zone-label', 'text-anchor': 'middle' }, ' SNACK BAR'));
 entrance(svg, 405, 660);
 [palm(80, 250), palm(820, 250), palm(80, 470), palm(820, 470)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 450, y: 215, class: 'zone-label', 'text-anchor': 'middle' }, 'BAY ROW'));
 svg.appendChild(txt('text', { x: 450, y: 380, class: 'zone-label', 'text-anchor': 'middle' }, 'CENTRAL DECK'));
 svg.appendChild(txt('text', { x: 450, y: 530, class: 'zone-label', 'text-anchor': 'middle' }, 'BUDGET ROW'));
 },
 seats: [].concat(
 row('F', 'sunbed', 80, 240, 22, 30, 18, 26, { sold: [5, 13], gap: 3 }),
 row('B', 'sunbed', 80, 280, 22, 30, 16, 26, { sold: [10], gap: 3 }),
 row('M', 'sunbed', 80, 400, 22, 30, 14, 26, { sold: [8, 19], gap: 3 }),
 row('N', 'sunbed', 80, 440, 22, 30, 14, 26, { sold: [4, 22], gap: 3 }),
 [
 { id: 'C1', type: 'cabana', x: 200, y: 490, w: 70, h: 55, price: 70 },
 { id: 'C2', type: 'cabana', x: 290, y: 490, w: 70, h: 55, price: 70, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 540, y: 490, w: 70, h: 55, price: 70 },
 { id: 'C4', type: 'cabana', x: 630, y: 490, w: 70, h: 55, price: 70 },
 ]
 ),
 },

 // 6. RAMLA RED (Gozo) --------------------------------------
 'ramla': {
 name: 'Ramla Red Beach Club',
 location: ' Ramla Bay, Gozo',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 110, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 65, class: 'sea-label', 'text-anchor': 'middle' }, 'MEDITERRANEAN SEA'));
 svg.appendChild(s('path', { d: 'M 0 110 Q 100 130 200 115 Q 350 90 500 110 Q 650 130 800 110 Q 850 105 900 115 L 900 140 L 0 140 Z', fill: '#e8a87c' }));
 // Red sand!
 svg.appendChild(s('rect', { x: 0, y: 130, width: 900, height: 560, fill: '#d97a4a' }));
 svg.appendChild(s('rect', { x: 0, y: 130, width: 900, height: 560, fill: '#cf6a3a', opacity: 0.3 }));
 // Calypso cave
 svg.appendChild(s('path', { d: 'M 60 250 Q 30 320 60 400 Q 100 420 140 410 Q 170 380 165 320 Q 150 270 110 255 Z', fill: '#5a3a28', stroke: '#3a2418', 'stroke-width': 2 }));
 svg.appendChild(txt('text', { x: 110, y: 340, 'font-size': 14, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle' }, ' CAVE'));
 // Bar
 svg.appendChild(s('rect', { x: 350, y: 580, width: 200, height: 60, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 615, class: 'zone-label', 'text-anchor': 'middle' }, ' SUNSET BAR'));
 entrance(svg, 780, 660);
 [palm(220, 200), palm(450, 200), palm(680, 200), palm(820, 460)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 500, y: 175, class: 'zone-label', 'text-anchor': 'middle' }, 'WATERFRONT ROW'));
 svg.appendChild(txt('text', { x: 500, y: 320, class: 'zone-label', 'text-anchor': 'middle' }, 'BEACH UMBRELLAS'));
 svg.appendChild(txt('text', { x: 500, y: 470, class: 'zone-label', 'text-anchor': 'middle' }, 'CABANAS'));
 },
 seats: [].concat(
 row('F', 'sunbed', 200, 220, 22, 32, 35, 22, { sold: [3, 8, 14, 19], gap: 3 }),
 row('B', 'sunbed', 200, 260, 22, 32, 28, 22, { sold: [6, 12], gap: 3 }),
 row('U', 'sunbed', 200, 340, 22, 32, 25, 22, { sold: [5, 17], gap: 3 }),
 row('Z', 'sunbed', 200, 380, 22, 32, 25, 22, { sold: [11], gap: 3 }),
 [
 { id: 'C1', type: 'cabana', x: 230, y: 490, w: 70, h: 55, price: 110, status: 'available' },
 { id: 'C2', type: 'cabana', x: 320, y: 490, w: 70, h: 55, price: 110, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 510, y: 490, w: 70, h: 55, price: 110, status: 'available' },
 { id: 'C4', type: 'cabana', x: 600, y: 490, w: 70, h: 55, price: 110, status: 'available' },
 ]
 ),
 },

 // 13. AQUALUNA LIDO (Gżira/Sliema Creek) --------------------
 'aqualuna': {
 name: 'Aqualuna Lido',
 location: ' The Strand, Gżira',
 drawBackground: function (svg) {
 // Wide sea on top + bottom (lido is on a platform jutting out)
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 60, class: 'sea-label', 'text-anchor': 'middle' }, 'SLIEMA CREEK'));
 // Manoel Island silhouette across the water (top)
 svg.appendChild(s('rect', { x: 100, y: 80, width: 700, height: 50, fill: '#8b7355', opacity: 0.55 }));
 svg.appendChild(s('rect', { x: 220, y: 60, width: 60, height: 70, fill: '#7a6347', opacity: 0.6 }));
 svg.appendChild(s('rect', { x: 480, y: 55, width: 50, height: 75, fill: '#7a6347', opacity: 0.6 }));
 svg.appendChild(txt('text', { x: 450, y: 105, 'font-size': 11, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', opacity: 0.85 }, 'MANOEL ISLAND'));
 // The lido platform (jutting into the creek)
 svg.appendChild(s('rect', { x: 50, y: 170, width: 800, height: 460, rx: 12, fill: 'url(#wood-deck)', stroke: '#8b6f47', 'stroke-width': 2 }));
 // Saltwater pool (centre)
 svg.appendChild(s('rect', { x: 320, y: 290, width: 260, height: 100, rx: 6, fill: '#4fc3f7', stroke: '#0288d1', 'stroke-width': 2 }));
 svg.appendChild(txt('text', { x: 450, y: 348, 'font-size': 14, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', opacity: 0.9 }, 'SALTWATER POOL'));
 // Restaurant building (back)
 svg.appendChild(s('rect', { x: 200, y: 540, width: 500, height: 70, rx: 8, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 580, class: 'zone-label', 'text-anchor': 'middle' }, ' SEA-EDGE RESTAURANT'));
 entrance(svg, 405, 660);
 [palm(100, 250), palm(800, 250), palm(100, 500), palm(800, 500)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 150, y: 250, class: 'zone-label', 'text-anchor': 'middle' }, 'POOLSIDE'));
 svg.appendChild(txt('text', { x: 750, y: 250, class: 'zone-label', 'text-anchor': 'middle' }, 'SEA-EDGE'));
 },
 seats: [].concat(
 row('P', 'sunbed', 110, 230, 24, 36, 25, 9, { sold: [3, 7] }),
 row('S', 'sunbed', 530, 230, 24, 36, 25, 9, { sold: [4] }),
 row('M', 'sunbed', 110, 440, 24, 36, 25, 28, { sold: [2, 9, 16, 22] }),
 [
 { id: 'C1', type: 'cabana', x: 130, y: 350, w: 70, h: 60, price: 140 },
 { id: 'C2', type: 'cabana', x: 220, y: 350, w: 70, h: 60, price: 140, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 610, y: 350, w: 70, h: 60, price: 140 },
 { id: 'C4', type: 'cabana', x: 700, y: 350, w: 70, h: 60, price: 140 },
 { id: 'V1', type: 'vip', x: 100, y: 575, w: 90, h: 60, price: 240 },
 { id: 'V2', type: 'vip', x: 710, y: 575, w: 90, h: 60, price: 240, status: 'sold' },
 ]
 ),
 },

 // 14. 1926 LA PLAGE (Sliema, infinity pool) ----------------
 '1926-la-plage': {
 name: '1926 La Plage',
 location: ' Thornton Street, Sliema',
 drawBackground: function (svg) {
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 280, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 90, class: 'sea-label', 'text-anchor': 'middle' }, 'MEDITERRANEAN SEA'));
 // Infinity pool (visually merging into the sea)
 svg.appendChild(s('rect', { x: 120, y: 220, width: 660, height: 130, fill: '#26c6da', stroke: '#0288d1', 'stroke-width': 2 }));
 svg.appendChild(s('path', { d: 'M 120 220 L 780 220 L 780 230 Q 450 245 120 230 Z', fill: '#80deea', opacity: 0.7 }));
 svg.appendChild(txt('text', { x: 450, y: 295, 'font-size': 16, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', opacity: 0.9 }, 'INFINITY POOL'));
 // Pool deck (whole bottom is wooden Art Deco deck)
 svg.appendChild(s('rect', { x: 0, y: 350, width: 900, height: 320, fill: '#d4b896' }));
 // Art deco pattern
 for (let i = 0; i < 9; i++) {
 svg.appendChild(s('line', { x1: i * 100, y1: 350, x2: i * 100, y2: 670, stroke: '#b89968', 'stroke-width': 0.5, opacity: 0.4 }));
 }
 // La Vie restaurant block (right)
 svg.appendChild(s('rect', { x: 580, y: 460, width: 220, height: 130, rx: 6, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 690, y: 525, class: 'zone-label', 'text-anchor': 'middle' }, ' LA VIE'));
 svg.appendChild(txt('text', { x: 690, y: 545, 'font-size': 9, 'font-weight': 600, fill: '#5a4a32', 'text-anchor': 'middle' }, 'EVENING GASTRONOMY'));
 // Bar (left)
 svg.appendChild(s('rect', { x: 100, y: 460, width: 220, height: 80, rx: 6, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 210, y: 505, class: 'zone-label', 'text-anchor': 'middle' }, ' BAR'));
 entrance(svg, 405, 660);
 svg.appendChild(txt('text', { x: 450, y: 385, class: 'zone-label', 'text-anchor': 'middle' }, 'POOLSIDE ART DECO DECK'));
 },
 seats: [].concat(
 // Pool-edge premium sunbeds (front row)
 row('F', 'sunbed', 130, 365, 26, 36, 50, 18, { sold: [3, 11], gap: 4 }),
 row('B', 'sunbed', 130, 410, 26, 36, 35, 18, { sold: [7, 14], gap: 4 }),
 [
 { id: 'C1', type: 'cabana', x: 100, y: 555, w: 80, h: 70, price: 150 },
 { id: 'C2', type: 'cabana', x: 195, y: 555, w: 80, h: 70, price: 150, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 350, y: 555, w: 80, h: 70, price: 150 },
 { id: 'V1', type: 'vip', x: 460, y: 555, w: 100, h: 75, price: 260 },
 { id: 'V2', type: 'vip', x: 590, y: 595, w: 100, h: 30, price: 260, status: 'sold' },
 ]
 ),
 },

 // 15. MANTA (Tigné, garden pool) ----------------------------
 'manta': {
 name: 'Manta Beach Club',
 location: ' Tigné Seafront, Sliema',
 drawBackground: function (svg) {
 // Valletta skyline at top
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 90, fill: 'url(#sea-grad)' }));
 svg.appendChild(txt('text', { x: 450, y: 35, class: 'sea-label', 'text-anchor': 'middle' }, 'GRAND HARBOUR'));
 // Valletta silhouette
 svg.appendChild(s('path', { d: 'M 0 100 L 80 100 L 90 80 L 160 80 L 170 65 L 230 65 L 250 80 L 330 80 L 345 60 L 410 60 L 425 75 L 510 75 L 525 55 L 610 55 L 625 78 L 700 78 L 720 85 L 780 85 L 790 70 L 870 70 L 880 80 L 900 80 L 900 120 L 0 120 Z', fill: '#0a1f3a', opacity: 0.85 }));
 svg.appendChild(s('rect', { x: 0, y: 100, width: 900, height: 25, fill: '#01579b' }));
 // Garden
 svg.appendChild(s('rect', { x: 0, y: 125, width: 900, height: 545, fill: '#a4c97c' }));
 // Texture (garden)
 for (let i = 0; i < 60; i++) {
 const cx = (i * 79) % 900;
 const cy = 130 + ((i * 37) % 530);
 svg.appendChild(s('circle', { cx: cx, cy: cy, r: 5, fill: '#7fb05a', opacity: 0.45 }));
 }
 // Pool (kidney-ish)
 svg.appendChild(s('path', { d: 'M 250 200 Q 200 240 220 320 Q 250 400 360 410 Q 500 415 600 380 Q 680 340 660 260 Q 600 200 480 195 Q 350 195 250 200 Z', fill: '#4fc3f7', stroke: '#0288d1', 'stroke-width': 2 }));
 svg.appendChild(txt('text', { x: 450, y: 310, 'font-size': 16, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle', opacity: 0.9 }, 'GARDEN POOL'));
 // Restaurant
 svg.appendChild(s('rect', { x: 200, y: 530, width: 500, height: 100, rx: 12, fill: '#c8a882', stroke: '#8b6f47' }));
 svg.appendChild(txt('text', { x: 450, y: 580, class: 'zone-label', 'text-anchor': 'middle' }, ' MANTA · SUSHI · BRUNCH'));
 entrance(svg, 405, 660);
 [palm(100, 250), palm(800, 250), palm(80, 480), palm(820, 480)].forEach(function (p) { svg.appendChild(p); });
 svg.appendChild(txt('text', { x: 100, y: 175, class: 'zone-label', 'text-anchor': 'middle' }, 'GARDEN POOL'));
 },
 seats: [].concat(
 // Pool-edge sunbeds (curved arrangement, simplified to rows)
 row('P', 'sunbed', 120, 220, 24, 36, 30, 6, { sold: [2] }),
 row('Q', 'sunbed', 700, 220, 24, 36, 30, 6, { sold: [4] }),
 // Garden sunbeds
 row('G', 'sunbed', 90, 440, 22, 32, 25, 30, { sold: [4, 11, 18, 24], gap: 3 }),
 row('H', 'sunbed', 90, 485, 22, 32, 25, 30, { sold: [9, 21], gap: 3 }),
 [
 { id: 'C1', type: 'cabana', x: 130, y: 360, w: 70, h: 55, price: 130 },
 { id: 'C2', type: 'cabana', x: 220, y: 360, w: 70, h: 55, price: 130, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 610, y: 360, w: 70, h: 55, price: 130 },
 { id: 'C4', type: 'cabana', x: 700, y: 360, w: 70, h: 55, price: 130 },
 { id: 'V1', type: 'vip', x: 350, y: 410, w: 90, h: 65, price: 220 },
 { id: 'V2', type: 'vip', x: 460, y: 410, w: 90, h: 65, price: 220, status: 'sold' },
 ]
 ),
 },

 // 16. TWENTY TWO (22nd floor Portomaso Tower) ---------------
 'twentytwo': {
 name: 'Twenty Two',
 location: ' 22nd Floor, Portomaso Tower',
 drawBackground: function (svg) {
 // Sky gradient (rooftop = sky/dusk)
 const dusk = s('linearGradient', { id: 'dusk', x1: 0, y1: 0, x2: 0, y2: 1 });
 dusk.appendChild(s('stop', { offset: '0%', 'stop-color': '#5e35b1' }));
 dusk.appendChild(s('stop', { offset: '60%', 'stop-color': '#ff7043' }));
 dusk.appendChild(s('stop', { offset: '100%', 'stop-color': '#ffb74d' }));
 const defs = svg.querySelector('defs') || (function () { const d = s('defs'); svg.insertBefore(d, svg.firstChild); return d; })();
 defs.appendChild(dusk);
 svg.appendChild(s('rect', { x: 0, y: 0, width: 900, height: 700, fill: 'url(#dusk)' }));
 // City lights on horizon (multiple layers)
 svg.appendChild(s('rect', { x: 0, y: 280, width: 900, height: 6, fill: '#0a1f3a', opacity: 0.5 }));
 for (let i = 0; i < 80; i++) {
 svg.appendChild(s('circle', { cx: 10 + i * 12, cy: 283, r: 1.5, fill: '#ffeb3b', opacity: 0.8 }));
 }
 svg.appendChild(txt('text', { x: 450, y: 70, class: 'sea-label', 'text-anchor': 'middle', fill: '#fff', opacity: 0.6 }, '22ND FLOOR · MALTA SKYLINE'));
 // The terrace (polished concrete)
 svg.appendChild(s('rect', { x: 50, y: 300, width: 800, height: 360, rx: 10, fill: '#e0e3e8', stroke: '#5d6a82', 'stroke-width': 1.5 }));
 // Glass panels (decorative)
 for (let i = 0; i < 8; i++) {
 svg.appendChild(s('rect', { x: 50 + i * 100, y: 300, width: 2, height: 360, fill: '#90caf9', opacity: 0.4 }));
 }
 // Cocktail bar
 svg.appendChild(s('rect', { x: 350, y: 550, width: 200, height: 80, rx: 6, fill: '#0a1f3a' }));
 svg.appendChild(txt('text', { x: 450, y: 590, class: 'zone-label', 'text-anchor': 'middle', fill: '#fff', opacity: 0.95 }, ' COCKTAIL BAR'));
 svg.appendChild(txt('text', { x: 450, y: 608, 'font-size': 10, 'font-weight': 600, fill: '#ffb74d', 'text-anchor': 'middle' }, 'DJ FROM 18:00'));
 entrance(svg, 405, 660);
 svg.appendChild(txt('text', { x: 450, y: 330, class: 'zone-label', 'text-anchor': 'middle' }, 'SUN TERRACE'));
 svg.appendChild(txt('text', { x: 450, y: 510, class: 'zone-label', 'text-anchor': 'middle' }, 'VIP TABLES'));
 },
 seats: [].concat(
 // Sun terrace sunbeds (limited - small capacity at this altitude)
 row('S', 'sunbed', 100, 360, 28, 40, 35, 13, { sold: [3, 8] }),
 row('B', 'sunbed', 100, 420, 28, 40, 35, 13, { sold: [6, 11] }),
 [
 { id: 'C1', type: 'cabana', x: 100, y: 490, w: 90, h: 55, price: 180 },
 { id: 'C2', type: 'cabana', x: 210, y: 490, w: 90, h: 55, price: 180, status: 'sold' },
 { id: 'C3', type: 'cabana', x: 600, y: 490, w: 90, h: 55, price: 180 },
 { id: 'C4', type: 'cabana', x: 710, y: 490, w: 90, h: 55, price: 180 },
 { id: 'V1', type: 'vip', x: 100, y: 555, w: 100, h: 70, price: 320 },
 { id: 'V2', type: 'vip', x: 220, y: 555, w: 100, h: 70, price: 320 },
 { id: 'V3', type: 'vip', x: 580, y: 555, w: 100, h: 70, price: 320, status: 'sold' },
 { id: 'V4', type: 'vip', x: 700, y: 555, w: 100, h: 70, price: 320 },
 ]
 ),
 },
 };

 // -- normalize seats (default status) --------------------------
 for (const id in CLUBS) {
 CLUBS[id].seats.forEach(function (seat) {
 if (!seat.status) seat.status = 'available';
 });
 }

 // -- bootstrap -------------------------------------------------
 const params = new URLSearchParams(window.location.search);
 const clubId = params.get('club') || 'azure-bay';
 const club = CLUBS[clubId] || CLUBS['azure-bay'];

 document.getElementById('club-name').textContent = club.name;
 document.getElementById('club-subtitle').textContent = club.location + ' · Wed, 13 May 2026';
 document.title = club.name + ' — Reserve a sunbed | Sunspot';
 const bcLink = document.getElementById('bc-club-link');
 if (bcLink) {
 bcLink.textContent = club.name;
 bcLink.href = 'club.html?club=' + clubId;
 }

 // ---- SEO: per-club meta + JSON-LD ----
 function setMeta(id, prop, val) {
 const el = document.getElementById(id);
 if (el) el.setAttribute(prop, val);
 }
 const desc = 'Reserve sunbeds, cabanas and VIP gazebos at ' + club.name + ' (' + club.location +
 '). Live availability, instant confirmation, free cancellation 24h before.';
 setMeta('meta-description', 'content', desc);
 setMeta('og-title', 'content', club.name + ' — Sunspot');
 setMeta('og-desc', 'content', desc);
 setMeta('canonical', 'href', 'https://sunspot.mt/booking.html?club=' + clubId);

 // Lowest available price for the structured-data
 const availSeats = club.seats.filter(function (x) { return x.status === 'available'; });
 const lowest = availSeats.length ? Math.min.apply(null, availSeats.map(function (x) { return x.price; })) : 0;
 const ld = {
 "@context": "https://schema.org",
 "@graph": [
 {
 "@type": "BreadcrumbList",
 "itemListElement": [
 { "@type": "ListItem", "position": 1, "name": "Sunspot", "item": "https://sunspot.mt/" },
 { "@type": "ListItem", "position": 2, "name": "Beach clubs", "item": "https://sunspot.mt/" },
 { "@type": "ListItem", "position": 3, "name": club.name, "item": "https://sunspot.mt/booking.html?club=" + clubId },
 ],
 },
 {
 "@type": "BeachResort",
 "name": club.name,
 "url": "https://sunspot.mt/booking.html?club=" + clubId,
 "address": {
 "@type": "PostalAddress",
 "addressLocality": club.location.replace(' ', ''),
 "addressCountry": "MT",
 },
 "amenityFeature": [
 { "@type": "LocationFeatureSpecification", "name": "Sunbeds" },
 { "@type": "LocationFeatureSpecification", "name": "Cabanas" },
 { "@type": "LocationFeatureSpecification", "name": "VIP gazebos" },
 { "@type": "LocationFeatureSpecification", "name": "Beach bar" },
 ],
 "offers": {
 "@type": "AggregateOffer",
 "lowPrice": lowest,
 "priceCurrency": "EUR",
 "availability": availSeats.length>0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
 "offerCount": availSeats.length,
 },
 },
 ],
 };
 const ldEl = document.getElementById('ld-club');
 if (ldEl) ldEl.textContent = JSON.stringify(ld);

 // Build the SVG fresh
 const host = document.getElementById('svg-host');
 const svg = s('svg', {
 id: 'seatmap',
 xmlns: SVG_NS,
 viewBox: '0 0 900 700',
 preserveAspectRatio: 'xMidYMid meet',
 style: 'width:100%;height:auto;display:block;',
 });
 // Defs (gradients/patterns)
 const defs = s('defs');
 const seaGrad = s('linearGradient', { id: 'sea-grad', x1: 0, y1: 0, x2: 0, y2: 1 });
 seaGrad.appendChild(s('stop', { offset: '0%', 'stop-color': '#4fc3f7' }));
 seaGrad.appendChild(s('stop', { offset: '100%', 'stop-color': '#81d4fa' }));
 defs.appendChild(seaGrad);
 const sandGrad = s('linearGradient', { id: 'sand-grad', x1: 0, y1: 0, x2: 0, y2: 1 });
 sandGrad.appendChild(s('stop', { offset: '0%', 'stop-color': '#fff5e1' }));
 sandGrad.appendChild(s('stop', { offset: '100%', 'stop-color': '#ffe9c4' }));
 defs.appendChild(sandGrad);
 const wood = s('pattern', { id: 'wood-deck', x: 0, y: 0, width: 30, height: 8, patternUnits: 'userSpaceOnUse' });
 wood.appendChild(s('rect', { width: 30, height: 8, fill: '#d4b896' }));
 wood.appendChild(s('line', { x1: 0, y1: 0, x2: 30, y2: 0, stroke: '#b89968', 'stroke-width': 0.5 }));
 defs.appendChild(wood);
 svg.appendChild(defs);

 // Draw background
 try { club.drawBackground(svg); } catch (err) { console.error('drawBackground failed:', err); }

 // Seats layer
 const seatsLayer = s('g', { id: 'seats-layer' });
 svg.appendChild(seatsLayer);

 host.appendChild(svg);

 // -- render seats ---------------------------------------------
 const tooltip = document.getElementById('tooltip');
 const selected = new Map();

 function buildSeat(seat) {
 let cls = 'seat ' + seat.status;
 if (seat.type === 'cabana') cls += ' cabana';
 if (seat.type === 'vip') cls += ' vip';
 const g = s('g', { class: cls, 'data-seat-id': seat.id });

 if (seat.type === 'sunbed') {
 g.appendChild(s('rect', { x: seat.x, y: seat.y, width: seat.w, height: seat.h, rx: 3 }));
 g.appendChild(s('rect', { x: seat.x + 3, y: seat.y + 2, width: seat.w - 6, height: 5, rx: 2, 'fill-opacity': 0.5 }));
 } else if (seat.type === 'cabana') {
 g.appendChild(s('rect', { x: seat.x, y: seat.y, width: seat.w, height: seat.h, rx: 4 }));
 // Roof posts (pure decoration, no styling so they stay visible)
 [[4, 4], [seat.w - 8, 4], [4, seat.h - 8], [seat.w - 8, seat.h - 8]].forEach(function (p) {
 g.appendChild(s('rect', { x: seat.x + p[0], y: seat.y + p[1], width: 4, height: 4, fill: '#856404', 'fill-opacity': 0.4 }));
 });
 g.appendChild(txt('text', {
 x: seat.x + seat.w / 2, y: seat.y + seat.h / 2 + 4,
 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#856404', 'pointer-events': 'none'
 }, seat.id));
 } else if (seat.type === 'vip') {
 g.appendChild(s('rect', { x: seat.x, y: seat.y, width: seat.w, height: seat.h, rx: 6 }));
 g.appendChild(txt('text', {
 x: seat.x + seat.w / 2, y: seat.y + seat.h / 2 - 2,
 'text-anchor': 'middle', 'font-size': 16, 'pointer-events': 'none'
 }, ''));
 g.appendChild(txt('text', {
 x: seat.x + seat.w / 2, y: seat.y + seat.h / 2 + 14,
 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#6a1b9a', 'pointer-events': 'none'
 }, seat.id));
 }

 g.addEventListener('click', function () { onSeatClick(seat, g); });
 g.addEventListener('mouseenter', function (e) { showTip(seat, e); });
 g.addEventListener('mousemove', moveTip);
 g.addEventListener('mouseleave', hideTip);
 return g;
 }

 club.seats.forEach(function (seat) {
 seatsLayer.appendChild(buildSeat(seat));
 });

 // -- interactions ---------------------------------------------
 function onSeatClick(seat, g) {
 if (seat.status === 'sold') return;
 if (selected.has(seat.id)) {
 selected.delete(seat.id);
 g.classList.remove('selected');
 } else {
 selected.set(seat.id, seat);
 g.classList.add('selected');
 }
 updateSidebar();
 }

 function updateSidebar() {
 const list = document.getElementById('selection-list');
 const empty = document.getElementById('empty-state');
 const btn = document.getElementById('checkout-btn');
 list.innerHTML = '';
 if (selected.size === 0) {
 list.appendChild(empty);
 btn.disabled = true;
 btn.textContent = 'Select spots to continue';
 document.getElementById('subtotal').textContent = '€0';
 document.getElementById('service-fee').textContent = '€0';
 document.getElementById('total').textContent = '€0';
 return;
 }
 let subtotal = 0;
 selected.forEach(function (seat) {
 const li = document.createElement('li');
 const typeLabel = { sunbed: 'Sunbed', cabana: 'Cabana', vip: 'VIP Gazebo' }[seat.type];
 li.innerHTML =
 '<div><div class="seat-label">' + typeLabel + ' ' + seat.id + '</div>' +
 '<div class="seat-price">€' + seat.price + '</div></div>' +
 '<button class="remove-btn" data-id="' + seat.id + '" aria-label="Remove">×</button>';
 list.appendChild(li);
 subtotal += seat.price;
 });
 list.querySelectorAll('.remove-btn').forEach(function (rb) {
 rb.addEventListener('click', function () {
 const id = rb.getAttribute('data-id');
 selected.delete(id);
 const g = seatsLayer.querySelector('[data-seat-id="' + id + '"]');
 if (g) g.classList.remove('selected');
 updateSidebar();
 });
 });
 const fee = Math.round(subtotal * 0.08);
 document.getElementById('subtotal').textContent = '€' + subtotal;
 document.getElementById('service-fee').textContent = '€' + fee;
 document.getElementById('total').textContent = '€' + (subtotal + fee);
 btn.disabled = false;
 btn.textContent = 'Reserve ' + selected.size + ' spot' + (selected.size>1 ? 's' : '') + ' · €' + (subtotal + fee);
 }

 function showTip(seat, e) {
 const typeLabel = { sunbed: 'Sunbed', cabana: 'Cabana (4 guests)', vip: 'VIP Gazebo (6 guests)' }[seat.type];
 const status = seat.status === 'sold' ? ' Sold' : '€' + seat.price;
 tooltip.innerHTML = '<strong>' + seat.id + '</strong>· ' + typeLabel + '<br>' + status;
 tooltip.classList.add('visible');
 moveTip(e);
 }
 function moveTip(e) {
 const c = document.getElementById('seatmap-container');
 const r = c.getBoundingClientRect();
 tooltip.style.left = (e.clientX - r.left + c.scrollLeft) + 'px';
 tooltip.style.top = (e.clientY - r.top + c.scrollTop - 50) + 'px';
 tooltip.style.transform = 'translateX(-50%)';
 }
 function hideTip() { tooltip.classList.remove('visible'); }

 // -- zoom -----------------------------------------------------
 let scale = 1;
 document.getElementById('zoom-in').addEventListener('click', function () {
 scale = Math.min(2.5, scale * 1.2);
 svg.style.transform = 'scale(' + scale + ')';
 svg.style.transformOrigin = '0 0';
 });
 document.getElementById('zoom-out').addEventListener('click', function () {
 scale = Math.max(0.5, scale * 0.8);
 svg.style.transform = 'scale(' + scale + ')';
 svg.style.transformOrigin = '0 0';
 });
 document.getElementById('zoom-reset').addEventListener('click', function () {
 scale = 1;
 svg.style.transform = 'scale(1)';
 });

 // -- checkout -------------------------------------------------
 document.getElementById('checkout-btn').addEventListener('click', function () {
 if (selected.size === 0) return;
 const seats = [];
 selected.forEach(function (s) { seats.push({ id: s.id, type: s.type, price: s.price }); });
 const subtotal = seats.reduce(function (a, b) { return a + b.price; }, 0);
 const fee = Math.round(subtotal * 0.08);
 // Pull photo from SUNSPOT_CLUBS if available
 const clubMeta = (window.SUNSPOT_CLUBS || []).find(function (c) { return c.id === clubId; });
 const photo = clubMeta && clubMeta.photos && clubMeta.photos[0] ? clubMeta.photos[0] : '';
 const pending = {
 clubId: clubId,
 clubName: club.name,
 clubLocation: club.location,
 photo: photo,
 date: 'Wed, 13 May 2026',
 guests: 2,
 seats: seats,
 subtotal: subtotal,
 fee: fee,
 total: subtotal + fee,
 };
 localStorage.setItem('sunspot_pending', JSON.stringify(pending));
 window.location.href = 'checkout.html';
 });

 console.log('[Sunspot] Loaded', club.name, 'with', club.seats.length, 'seats');
})();
