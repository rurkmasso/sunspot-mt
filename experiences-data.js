// ============================================================
// Sunspot — Experiences catalog
// Activities, watersports, rentals, tours. Complements the sunbed
// catalog as upsell + cross-sell. Same booking model: 8% service fee.
// ============================================================
(function () {
 'use strict';

 const CATEGORIES = {
 'boat-tour':       { label: 'Boat tour',         icon: '', color: '#0288d1' },
 'private-charter': { label: 'Private charter',   icon: '', color: '#01579b' },
 'rib':             { label: 'RIB / speedboat',   icon: '', color: '#ef6c00' },
 'jetski':          { label: 'Jetski',            icon: '', color: '#c62828' },
 'kayak':           { label: 'Kayak / SUP',       icon: '', color: '#00838f' },
 'diving':          { label: 'Diving',            icon: '', color: '#1565c0' },
 'snorkel':         { label: 'Snorkel tour',      icon: '', color: '#26a69a' },
 'sunset':          { label: 'Sunset cruise',     icon: '', color: '#ff9800' },
 'party':           { label: 'Party boat',        icon: '', color: '#7b1fa2' },
 'parasail':        { label: 'Parasailing',       icon: '', color: '#558b2f' },
 'fishing':         { label: 'Fishing',           icon: '', color: '#5d4037' },
 'yoga':            { label: 'Beach + SUP yoga',  icon: '', color: '#9c27b0' },
 'cliff':           { label: 'Cliff jumping',     icon: '', color: '#bf360c' },
 'picnic':          { label: 'Beach picnic',      icon: '', color: '#827717' },
 'culture':         { label: 'Culture tour',      icon: '', color: '#6a1b9a' },
 'transfer':        { label: 'Transfer',          icon: '', color: '#455a64' },
 };

 // Each experience: id, name, cat, departs_from (slug or hub), region,
 // duration_h, price, max_pax, summary, photo, vibe[], operator
 const EXP = [

 // ===== COMINO / BLUE LAGOON =====
 { id: 'comino-rib-sliema', name: 'Sea Adventure Comino RIB', cat: 'rib',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 4, price: 65, max_pax: 12,
 summary: 'High-speed RIB to Blue & Crystal Lagoons + sea caves. Beat the slow ferries — first there, last to leave.',
 vibe: ['adventurer','small-group','snorkel'],
 operator: 'Sea Adventure Malta',
 photo: 'https://picsum.photos/seed/comino-rib/1200/800' },

 { id: 'comino-day-cruise', name: 'Comino Full-Day Catamaran', cat: 'boat-tour',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 8, price: 55, max_pax: 60,
 summary: 'Classic 8-hour catamaran: Blue Lagoon, Crystal Lagoon, Santa Marija. Lunch included.',
 vibe: ['family','classic','lunch'],
 operator: 'Captain Morgan Cruises',
 photo: 'https://picsum.photos/seed/comino-cat/1200/800' },

 { id: 'comino-sunset-rib', name: 'Comino Sunset RIB', cat: 'sunset',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 3, price: 75, max_pax: 12,
 summary: 'Late-afternoon departure, sunset over the cliffs, return in twilight. Includes cocktails.',
 vibe: ['romantic','sunset','small-group'],
 operator: 'Sea Adventure Malta',
 photo: 'https://picsum.photos/seed/comino-sunset/1200/800' },

 // ===== JETSKI =====
 { id: 'jetski-mellieha-30', name: 'Jetski 30-min Mellieha Bay', cat: 'jetski',
 departs_from: 'mellieha', region: 'north', hub: 'Mellieha Bay',
 duration_h: 0.5, price: 60, max_pax: 2,
 summary: 'Solo or tandem jetski in the calm waters of Mellieħa Bay. Instructor on jetski with you for first 5 min.',
 vibe: ['adrenaline','solo','beach'],
 operator: 'Bluewave Watersports',
 photo: 'https://picsum.photos/seed/jetski-mellieha/1200/800' },

 { id: 'jetski-safari-comino', name: 'Jetski Safari to Comino', cat: 'jetski',
 departs_from: 'mellieha', region: 'north', hub: 'Mellieha Bay',
 duration_h: 2.5, price: 180, max_pax: 2,
 summary: '2.5-hour guided jetski safari: Mellieħa → Blue Lagoon → Crystal Lagoon → Santa Marija. Driver license required.',
 vibe: ['adrenaline','adventure','small-group'],
 operator: 'Bluewave Watersports',
 photo: 'https://picsum.photos/seed/jetski-safari/1200/800' },

 // ===== KAYAK / SUP =====
 { id: 'kayak-comino', name: 'Comino Sea Caves Kayak', cat: 'kayak',
 departs_from: 'mellieha', region: 'comino', hub: 'Santa Marija Bay',
 duration_h: 3, price: 45, max_pax: 8,
 summary: 'Guided kayak around Comino — Santa Marija Bay, blue caves, hidden coves no boat fits in.',
 vibe: ['snorkel','quiet','adventurer'],
 operator: 'Sea Kayak Malta',
 photo: 'https://picsum.photos/seed/kayak-comino/1200/800' },

 { id: 'sup-sliema', name: 'SUP Rental — Sliema Front', cat: 'kayak',
 departs_from: 'sliema', region: 'central', hub: 'Tower Road, Sliema',
 duration_h: 1, price: 18, max_pax: 1,
 summary: 'Stand-up paddleboard rental by the hour. Calm bay, beginner-friendly.',
 vibe: ['beginner','solo','quiet'],
 operator: 'Sliema Watersports',
 photo: 'https://picsum.photos/seed/sup-sliema/1200/800' },

 { id: 'sup-tour-gozo', name: 'Gozo Coast SUP Tour', cat: 'kayak',
 departs_from: 'gozo-port', region: 'gozo', hub: 'Marsalforn Bay',
 duration_h: 2.5, price: 55, max_pax: 6,
 summary: 'Paddle Gozo\'s north coast — Marsalforn salt pans, mushroom rock, Wied il-Għasri cliffs.',
 vibe: ['scenic','small-group','photo-worthy'],
 operator: 'Gozo Adventures',
 photo: 'https://picsum.photos/seed/sup-gozo/1200/800' },

 // ===== DIVING / SNORKEL =====
 { id: 'dive-um-el-faroud', name: 'Wreck Dive — Um El Faroud', cat: 'diving',
 departs_from: 'qawra', region: 'south', hub: 'Wied iż-Żurrieq',
 duration_h: 4, price: 90, max_pax: 6,
 summary: 'Open-water dive on Malta\'s most famous wreck (110m tanker). PADI Advanced cert required.',
 vibe: ['advanced','wreck','photo-worthy'],
 operator: 'Dive Systems Malta',
 photo: 'https://picsum.photos/seed/dive-wreck/1200/800' },

 { id: 'snorkel-st-peters', name: 'St Peter\'s Pool Snorkel Tour', cat: 'snorkel',
 departs_from: 'valletta', region: 'south', hub: 'Marsaxlokk',
 duration_h: 3, price: 35, max_pax: 10,
 summary: 'Boat from Marsaxlokk to St Peter\'s Pool with guided snorkel stops. Includes mask + fins.',
 vibe: ['family','snorkel','small-group'],
 operator: 'Maltese Sea Tours',
 photo: 'https://picsum.photos/seed/snorkel-peter/1200/800' },

 // ===== BOAT RENTALS =====
 { id: 'rib-rental-self', name: 'Self-drive RIB (no license)', cat: 'rib',
 departs_from: 'sliema', region: 'central', hub: 'Manoel Island',
 duration_h: 4, price: 220, max_pax: 6,
 summary: 'Half-day self-drive RIB — Sliema, St Paul\'s Bay, swim stops. No license needed if max 30hp.',
 vibe: ['group','adventure','independence'],
 operator: 'Hop on Boat',
 photo: 'https://picsum.photos/seed/rib-rental/1200/800' },

 { id: 'yacht-day-charter', name: 'Yacht Day Charter', cat: 'boat-tour',
 departs_from: 'paceville', region: 'central', hub: 'Portomaso Marina',
 duration_h: 8, price: 880, max_pax: 8,
 summary: 'Private yacht (12m) with skipper — design your own route. Comino, Gozo, Blue Grotto, your call.',
 vibe: ['premium','private','group'],
 operator: 'Portomaso Charters',
 photo: 'https://picsum.photos/seed/yacht-charter/1200/800' },

 // ===== PARTY / SUNSET =====
 { id: 'party-boat-paceville', name: 'Paceville Party Boat', cat: 'party',
 departs_from: 'paceville', region: 'central', hub: 'St George\'s Bay',
 duration_h: 4, price: 50, max_pax: 80,
 summary: 'Friday & Saturday party boat from St George\'s Bay — DJ, open bar (vodka/beer), swim stop at Comino.',
 vibe: ['party','group','sunset'],
 operator: 'Charlie\'s Boat Parties',
 photo: 'https://picsum.photos/seed/party-boat/1200/800' },

 { id: 'sunset-catamaran', name: 'Sunset Catamaran + BBQ', cat: 'sunset',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 3.5, price: 70, max_pax: 40,
 summary: 'Sail from Sliema along the coast, anchor for sunset swim, BBQ dinner on board. 18:00 dep.',
 vibe: ['romantic','dinner','sunset'],
 operator: 'Hera Cruises',
 photo: 'https://picsum.photos/seed/sunset-cat/1200/800' },

 // ===== PARASAIL / FISHING =====
 { id: 'parasail-mellieha', name: 'Parasail Mellieha — Solo or Tandem', cat: 'parasail',
 departs_from: 'mellieha', region: 'north', hub: 'Mellieha Bay',
 duration_h: 0.25, price: 65, max_pax: 2,
 summary: '12-min parasail flight, 150m above the bay. Take-off and landing on the boat — feet stay dry if you want.',
 vibe: ['adrenaline','photo-worthy','quick'],
 operator: 'Bluewave Watersports',
 photo: 'https://picsum.photos/seed/parasail/1200/800' },

 { id: 'fishing-charter', name: 'Half-day Fishing Charter', cat: 'fishing',
 departs_from: 'qawra', region: 'north', hub: 'St Paul\'s Bay',
 duration_h: 4, price: 95, max_pax: 6,
 summary: 'Bottom + trolling fishing trip. Equipment + bait included. Take your catch home (or restaurants nearby will cook it).',
 vibe: ['family','foodie','quiet'],
 operator: 'Reel Malta',
 photo: 'https://picsum.photos/seed/fishing/1200/800' },

 // ===== CULTURE =====
 { id: 'valletta-walk', name: 'Valletta Walking Tour', cat: 'culture',
 departs_from: 'valletta', region: 'central', hub: 'City Gate, Valletta',
 duration_h: 2, price: 18, max_pax: 15,
 summary: '2-hour guided walk through Valletta — St John\'s Cathedral, Upper Barrakka Gardens, hidden gems. English/Italian.',
 vibe: ['culture','beginner','solo'],
 operator: 'Colour My Travel',
 photo: 'https://picsum.photos/seed/valletta-walk/1200/800' },

 { id: 'mdina-night-tour', name: 'Mdina Night Tour', cat: 'culture',
 departs_from: 'valletta', region: 'central', hub: 'Mdina Gate',
 duration_h: 2, price: 22, max_pax: 12,
 summary: 'Atmospheric evening walk through the Silent City — narrow lanes, ghost stories, knights\' palaces.',
 vibe: ['romantic','culture','small-group'],
 operator: 'Heritage Malta Tours',
 photo: 'https://picsum.photos/seed/mdina-night/1200/800' },

 // ===== TRANSFERS =====
 { id: 'airport-transfer-private', name: 'Private Airport Transfer', cat: 'transfer',
 departs_from: 'airport', region: 'south', hub: 'MLA arrivals',
 duration_h: 0.75, price: 35, max_pax: 4,
 summary: 'Door-to-door from airport to any hotel — fixed price, no surge. Meet & greet with name sign.',
 vibe: ['arrival','no-stress','family'],
 operator: 'Sunspot Concierge',
 photo: 'https://picsum.photos/seed/transfer/1200/800' },

 // =========================================================
 // PRIVATE CHARTERS — boats from half-day to full-week
 // =========================================================
 { id: 'sailing-yacht-halfday', name: 'Private Sailing Yacht — Half Day', cat: 'private-charter',
 departs_from: 'msida', region: 'central', hub: 'Msida Marina',
 duration_h: 4, price: 450, max_pax: 8,
 summary: 'Half-day skippered Bavaria 38 — sail down the harbour, swim off the back, lunch on board. Up to 8 guests, all kit included.',
 vibe: ['romantic','group','swim-stop','small-group'],
 operator: 'Sunspot Sailing',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Mistra-2560x1440-1.jpeg' },

 { id: 'sailing-yacht-fullday', name: 'Private Sailing Yacht — Full Day', cat: 'private-charter',
 departs_from: 'msida', region: 'central', hub: 'Msida Marina',
 duration_h: 8, price: 780, max_pax: 8,
 summary: 'Full-day skippered sail — Sliema → Comino → Crystal → St Paul\'s with anchored swim stops. Lunch + drinks included.',
 vibe: ['group','swim-stop','full-day','romantic'],
 operator: 'Sunspot Sailing',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Crystal-Lagoon-2560x1440-1.jpeg' },

 { id: 'catamaran-private-charter', name: 'Private Catamaran Charter', cat: 'private-charter',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 8, price: 1100, max_pax: 24,
 summary: 'Lagoon 42 cat with crew of three — your guest list, your stops. Catered lunch, music system, two paddleboards on board.',
 vibe: ['celebration','group','catered','full-day'],
 operator: 'Captain Morgan Private',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Blue-Lagoon-2560x1440-1.jpeg' },

 { id: 'speedboat-private-halfday', name: 'Private Speedboat — Half Day', cat: 'private-charter',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 4, price: 350, max_pax: 8,
 summary: 'Skippered speedboat to wherever you want — Comino sea caves, the south coast cliffs, Gozo for lunch. You choose.',
 vibe: ['flexible','small-group','swim-stop'],
 operator: 'Sea Adventure Malta',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Crystal-Lagoon-2560x1440-1.jpeg' },

 { id: 'sicily-day-cat', name: 'Sicily Day Trip — Catamaran', cat: 'boat-tour',
 departs_from: 'mgarr-gozo', region: 'gozo', hub: 'Mġarr Harbour',
 duration_h: 12, price: 120, max_pax: 40,
 summary: 'Pozzallo crossing on the fast cat. Wander Modica, eat granita, be back by midnight. Passport required.',
 vibe: ['adventure','full-day','food'],
 operator: 'Virtu Ferries',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Mgarr-Ix-xini-2560x1440-1.jpeg' },

 { id: 'fishing-private-fullday', name: 'Private Fishing Charter — Full Day', cat: 'fishing',
 departs_from: 'marsaxlokk', region: 'south', hub: 'Marsaxlokk Harbour',
 duration_h: 8, price: 280, max_pax: 6,
 summary: 'Big-game day on a Sea Hunter 33 — trolling for amberjack, tuna and dorado off the south coast. All gear + ice box for the catch.',
 vibe: ['fishing','adventure','full-day'],
 operator: 'Marsaxlokk Charters',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Mistra-2560x1440-1.jpeg' },

 { id: 'sunset-vittoriosa', name: 'Vittoriosa Sunset Aperitif Cruise', cat: 'sunset',
 departs_from: 'vittoriosa', region: 'south', hub: 'Vittoriosa Waterfront',
 duration_h: 2, price: 55, max_pax: 30,
 summary: 'Glass of bubbly as the bastions go gold. Quieter than the Sliema sunset boats and the Three Cities view is hard to beat.',
 vibe: ['sunset','romantic','small-group','aperitif'],
 operator: 'Three Cities Cruises',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Rinella-2560x1440-1.jpeg' },

 { id: 'glass-bottom-comino', name: 'Glass-bottom Boat — Comino Caves', cat: 'boat-tour',
 departs_from: 'cirkewwa', region: 'north', hub: 'Ċirkewwa Pier',
 duration_h: 1.5, price: 30, max_pax: 30,
 summary: 'See the seabed without getting wet. Best for kids and non-swimmers — Crystal Lagoon water clarity is hard to overstate.',
 vibe: ['family','kid-friendly','short'],
 operator: 'Comino Glass Boats',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Crystal-Lagoon-2560x1440-1.jpeg' },

 { id: 'booze-cruise-comino', name: 'Comino Day Booze Cruise', cat: 'party',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 7, price: 60, max_pax: 80,
 summary: '11:00 sail to Crystal + Blue Lagoon with open bar, DJ on the upper deck and two long swim stops. Adults only, weekends from June.',
 vibe: ['party','group','open-bar'],
 operator: 'Hera Cruises',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Blue-Lagoon-2560x1440-1.jpeg' },

 // =========================================================
 // SUN ACTIVITIES — yoga, picnics, cliff-jumping, walks
 // =========================================================
 { id: 'beach-yoga-sliema', name: 'Beach Yoga — Sliema Front', cat: 'yoga',
 departs_from: 'sliema', region: 'central', hub: 'Exiles Bay Lido',
 duration_h: 1, price: 25, max_pax: 16,
 summary: '07:00 vinyasa flow on the limestone slabs at Exiles. Bring a towel, the lido provides the mat. Coffee from the kiosk after.',
 vibe: ['wellness','morning','small-group'],
 operator: 'Yogagroup Malta',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Exiles-Bay-2560x1440-1-scaled-1.webp' },

 { id: 'sup-yoga-spinola', name: 'SUP Yoga — Spinola Bay', cat: 'yoga',
 departs_from: 'st-julians', region: 'central', hub: 'Spinola Bay',
 duration_h: 1.25, price: 40, max_pax: 10,
 summary: 'Yoga on a paddleboard, anchored in flat water at Spinola Bay. Falls in are part of the experience. All levels welcome — no experience needed.',
 vibe: ['wellness','playful','small-group'],
 operator: 'Maltaqua Sports',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Balluta-2560x1440-1.jpeg' },

 { id: 'sunset-yoga-golden-bay', name: 'Sunset Yoga — Golden Bay', cat: 'yoga',
 departs_from: 'mellieha', region: 'north', hub: 'Golden Bay',
 duration_h: 1.5, price: 30, max_pax: 20,
 summary: 'Slow flow + 10-minute meditation as the sun drops behind Lippija. Sandy spot at the south end of the bay, away from the bar music.',
 vibe: ['wellness','sunset','calm'],
 operator: 'Yogagroup Malta',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Golden-Bay-2560x1440-1.jpeg' },

 { id: 'cliff-jumping-comino', name: 'Cliff Jumping — Comino', cat: 'cliff',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Ferries',
 duration_h: 4, price: 70, max_pax: 12,
 summary: 'RIB to Comino\'s south cliffs. Three jump points from 2m, 5m and 10m, with a qualified jump-guide and rescue swimmer in the water.',
 vibe: ['adventure','adrenalin','small-group'],
 operator: 'Sea Adventure Malta',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Crystal-Lagoon-2560x1440-1.jpeg' },

 { id: 'coasteering-dingli', name: 'Coasteering — Dingli Cliffs', cat: 'cliff',
 departs_from: 'dingli', region: 'south', hub: 'Dingli Cliffs car park',
 duration_h: 3, price: 65, max_pax: 10,
 summary: 'Scramble, swim, leap and squeeze along the base of the Dingli Cliffs. Wetsuits, helmets and harnesses provided.',
 vibe: ['adventure','adrenalin','active'],
 operator: 'Malta Wild Adventures',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Ghar-Lapsi-2560x1440-1.jpeg' },

 { id: 'beach-picnic-mistra', name: 'Beach Picnic Package — Mistra Bay', cat: 'picnic',
 departs_from: 'st-pauls-bay', region: 'north', hub: 'Mistra Bay',
 duration_h: 4, price: 80, max_pax: 6,
 summary: 'Sunbed, parasol and a Maltese hamper — pastizzi, ftira, olives, gbejna, wine — delivered to your spot. Quiet rocky cove, mid-week sweet spot.',
 vibe: ['food','quiet','romantic','family'],
 operator: 'Picnic Malta',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Mistra-2560x1440-1.jpeg' },

 { id: 'saltpan-walk-marsalforn', name: 'Salt-Pan Walking Tour — Marsalforn', cat: 'culture',
 departs_from: 'marsalforn', region: 'gozo', hub: 'Xwejni car park',
 duration_h: 2, price: 25, max_pax: 14,
 summary: 'Walk the geometric salt pans from Xwejni to Qbajjar with a fifth-generation salt-maker. Take home a small jar of salt and a story.',
 vibe: ['culture','quiet','gozo','walking'],
 operator: 'Leli tal-Melħ',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2021/12/Xwejni-Bay-2560x1440-1.jpeg' },

 { id: 'sunrise-sup-coffee', name: 'Sunrise SUP + Coffee Tour', cat: 'kayak',
 departs_from: 'st-julians', region: 'central', hub: 'Balluta Bay',
 duration_h: 2, price: 38, max_pax: 10,
 summary: '05:30 launch. Paddle from Balluta to Sliema for sunrise, beach coffee from the early kiosk, paddle back. The flattest water of the day.',
 vibe: ['wellness','morning','calm'],
 operator: 'Maltaqua Sports',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Balluta-2560x1440-1.jpeg' },

 { id: 'photo-walk-sunset', name: 'Sunset Photography Workshop', cat: 'culture',
 departs_from: 'sliema', region: 'central', hub: 'Sliema Front',
 duration_h: 2.5, price: 120, max_pax: 6,
 summary: 'Three hours with a working travel photographer — composition, light, and how to shoot the Maltese coast without making it look like a postcard. Phone or DSLR.',
 vibe: ['creative','small-group','sunset'],
 operator: 'Frame Malta',
 photo: 'https://whichbeach.com.mt/wp-content/uploads/2022/01/Fond-Ghadir-2560x1440-1.jpeg' },
 ];

 window.SUNSPOT_EXPERIENCES = EXP;
 window.SUNSPOT_EXPERIENCE_CATEGORIES = CATEGORIES;
})();
