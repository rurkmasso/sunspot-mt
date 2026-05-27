---
name: sunspot-add-venue
description: How to add a real Malta or Gozo beach club / lido / pool / rooftop / beach to clubs-data.js. Use when the user asks to add a new venue, or you're researching a real place and need to know exactly which fields are mandatory and which photo URL to pick.
---

# Adding a venue to clubs-data.js

A venue is a JS object inside the `CLUBS = [ … ]` array.
Insert it before the closing `];` (line ~844). The order doesn't
affect SEO — the homepage ItemList ranks by review count.

## Mandatory fields

The `bin/publish-gate.php` rules in the WP plugin enforce these on
publish. Match the same shape here so the WP import is clean:

```js
{
  id: 'slug-without-spaces',         // unique kebab-case
  name: 'Real Venue Name',
  category: 'pool-club',              // see CATEGORIES at top of file
  region: 'central',                  // 'north' | 'central' | 'south' | 'gozo' | 'comino'
  location: 'Real address, town',
  regionLabel: 'Sliema',              // human label, shown on cards
  coords: { lat: 35.91, lng: 14.50 }, // verify on Google Maps
  hasBookableSunbeds: true,           // false for public beaches
  rating: 4.5, reviews: 412,          // real numbers; 1-5 rating
  summary: '1-line opinionated pitch.',
  description: 'Longer paragraph in brand voice.',
  photos: [ 'https://…' ],            // see Photo conventions below
}
```

## Strongly-recommended fields

```js
sunbedFrom: 25, cabanaFrom: 120, vipFrom: 220, spotsLeft: 18,
amenities: ['Outdoor pool', 'Bar', 'Towel service'],
website: 'https://venue.com',
socials: { instagram: 'handle', facebook: 'handle' },
phone: '+356 …', email: 'info@venue.com',
hours: '09:00–20:00 daily',
season: 'May–October',
capacity: { sunbeds: 60, cabanas: 8, vip: 2, total: 110 },
poolType: 'Outdoor freshwater pool',
surface: 'Stone deck',
features: ['Rooftop', 'Adults-only after 17:00'],
bestFor: ['Couples', 'Sunset'],
dressCode: 'Swimwear at the pool',
gettingThere: 'Bus 13 from Sliema Ferries, 4 minutes.',
parking: 'Hotel parking + The Point garage next door',
accessibility: 'Lift to the rooftop, step-free deck',
```

## Optional polish

```js
badge: { text: 'New', class: 'badge-new' },
// 'badge-new' (balcony green) or 'badge-hot' (sun deep)
```

## Coordinate bounding box

The WP publish-gate rejects venues outside Malta. Stay within:

```
lat: 35.6 to 36.20   N
lng: 14.10 to 14.70  E
```

Common landmarks to anchor against:

| Place      | Lat        | Lng      |
|---|---|---|
| Valletta gate | 35.8966 | 14.5072 |
| Sliema ferries | 35.913 | 14.504 |
| Mellieħa Bay  | 35.957 | 14.366 |
| Blue Lagoon, Comino | 35.989 | 14.327 |
| San Lawrenz, Gozo | 36.056 | 14.209 |

Tip: in Google Maps right-click the venue → click the lat/lng to copy.

## Photo conventions

Photo URLs in `photos: [...]` resolve in this priority:

1. **Venue's own first-party domain** (`venuename.com.mt`) — best,
   `bin/verify_venue_photos.py` marks these `ok-trusted`.
2. **whichbeach.com.mt** photo whose filename matches the bay name
   (e.g. Mellieħa venue → `Mellieha-Bay-2560x1440-1.jpeg`).
3. **whichbeach.com.mt** photo for the nearest neighbouring bay
   when the venue has no dedicated image. Verifier flags these as
   `needs-review` but doesn't break the build.

Don't use:
* `picsum.photos` — placeholder, kills brand trust
* A photo from another country/city (the Verdi-Prague mistake)
* A photo whose filename clearly shows a different bay

## Voice checklist

Read `.claude/skills/sunspot-brand-voice/SKILL.md` before writing
the `summary` and `description`. Quick rules: specific over
"stunning", lead with the useful detail, Maltese names not italicised.

## After adding

```bash
python3 bin/inject_itemlist.py
python3 bin/seo_pass.py
python3 bin/verify_venue_photos.py 2>&1 | grep -E 'Status|Broken'
```

Confirm `Broken (0):` then commit.
