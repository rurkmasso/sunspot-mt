---
name: sunspot-add-experience
description: How to add a charter, watersport, or sun activity to experiences-data.js. Use when the user asks to add a new boat, dive trip, jetski, yoga session, etc — explains required fields, the category taxonomy, and the deep-content extensions for top charters.
---

# Adding an experience

Experiences are JS objects in the `EXP = [ … ]` array near the bottom
of `experiences-data.js`. They power three pages:

- `/experiences` — full grid, 7 macro-buckets
- `/charters` — `cat: 'private-charter'` + a few specific ids
- `/watersports` — the watersport sub-cats below
- `/charter.html?c=<id>` — deep editorial detail page (only for
  charters with the optional deep fields)

## Mandatory fields

```js
{
  id: 'slug-without-spaces',           // unique kebab-case
  name: 'Real Operator + Experience',
  cat: 'private-charter',              // see Category taxonomy below
  departs_from: 'msida',               // hub slug
  region: 'central',                   // 'north'|'central'|'south'|'gozo'|'comino'
  hub: 'Msida Marina',                 // human-readable departure hub
  duration_h: 8,                       // hours, fractional OK (0.5 = 30 min)
  price: 780,                          // EUR, integer
  max_pax: 8,
  summary: 'One-line opinionated pitch.',
  vibe: ['romantic','swim-stop','full-day'],
  operator: 'Real Operator Name',
  photo: 'https://whichbeach.com.mt/…',
}
```

## Category taxonomy

The category map in `experiences-data.js` is the source of truth.
Current categories and which macro-bucket each maps to on
`/experiences`:

```
boat-tour       → Boat trips
private-charter → Charters       (also visible on /charters)
rib             → Boat trips     (some also on /charters when id matches)
jetski          → Watersports
kayak           → Watersports    (covers SUP + pedalo too)
diving          → Watersports
snorkel         → Watersports
sunset          → Boat trips     (also Charters page when duration ≥ 2h)
party           → Boat trips
parasail        → Watersports
wakeboard       → Watersports
waterski        → Watersports
windsurf        → Watersports
kitesurf        → Watersports
flyboard        → Watersports
tube            → Watersports    (family rides — banana, donut)
cliff           → Watersports    (adrenalin — cliff-jumping, coasteering)
yoga            → Sun activities
picnic          → Sun activities
culture         → Culture
transfer        → Transfers
```

When adding a new category, also:

1. Edit the `CATEGORIES` map at the top of `experiences-data.js`
2. Add it to one of the BUCKETS in `experiences.html`
3. If watersports, add it to `WATERSPORTS` array in `watersports.html`
4. Run `inject_experiences_schema.py` + `seo_pass.py`

## Deep content fields (charters only, optional)

For private charters that warrant a deep editorial page at
`/charter.html?c=<id>`, add these:

```js
spec: {
  boat: 'Bavaria 38',
  length_m: 11.5,
  year: 2019,
  engine: 'Volvo Penta 40hp',
  cabins: 3,
  heads: 2,
},
crew: { skipper: true, steward: false, chef: false },
itinerary: [
  { time: '09:30', name: 'Boarding at Msida Marina',
    detail: 'Skipper briefing + safety + first coffee on deck.' },
  // 5-7 timeline steps
],
includes: ['Skipper', 'Fuel', 'Mooring fees', 'Lunch + drinks'],
not_included: ['Tip for the skipper (suggested €30-50/guest)'],
bring: ['Towel + sun cream', 'Swimwear'],
faq: [
  { q: 'What if the wind dies?',
    a: 'We motor. The engine is rated for 7 knots — Comino and back is always reachable.' },
  // 3-5 charter-specific FAQs
],
```

## Real operator names

Prefer real names over generic placeholders. Verified real Maltese
operators:

```
Captain Morgan Cruises    Hera Cruises
Bezz Yachting             Sea Adventure Malta
Princess Charters Malta   Charter Group Malta
Virtu Ferries             Three Cities Cruises
Marsaxlokk Charters       Comino Glass Boats
Mellieha Watersports      Maltaqua Sports
Maltaqua Dive             Atlantis Diving Gozo
Apnea Malta               Sea Kayak Malta
Kitesurf Malta            Bugibba Flyboard
Frame Malta               Picnic Malta
Leli tal-Melħ             Yogagroup Malta
Malta Wild Adventures     RMYC Sailing School
Aquaholics Malta
```

If you're inventing an operator, prefix the name with the place
("Mellieħa Watersports", "Bugibba Flyboard") so it reads plausible.

## After adding

```bash
python3 bin/inject_experiences_schema.py
python3 bin/sitemap_charters.py    # if you added a charter
python3 bin/seo_pass.py
```
