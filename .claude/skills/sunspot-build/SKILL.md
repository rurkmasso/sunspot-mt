---
name: sunspot-build
description: The Sunspot static-site build chain. Use when you've changed clubs-data.js, experiences-data.js, guides-data.js, brand SVGs, or any HTML page — explains which build scripts to re-run, in which order, and what each one does. Invoke before pushing.
---

# Sunspot build chain

Six idempotent Python scripts in `bin/` keep the data, schemas, sitemaps,
brand assets and SEO in sync. None require a paid service.

## Run order

Run only what you need; the chain is incremental.

```
1. bin/render_brand_pngs.py       (only if assets/brand/*.svg changed)
2. bin/dedupe_venues.py           (only when removing a known duplicate venue)
3. bin/inject_itemlist.py         (after clubs-data.js changes)
4. bin/inject_experiences_schema.py (after experiences-data.js changes)
5. bin/sitemap_charters.py        (after experiences-data.js changes — refreshes charter sub-sitemap)
6. bin/seo_pass.py                (last — rebuilds master sitemap + page-level SEO)
7. bin/verify_venue_photos.py     (verification only — no writes to clubs-data.js)
```

## What each does

### `bin/render_brand_pngs.py`
Renders `assets/brand/{mark,og-cover}.svg` to PNG via headless Chromium.
Outputs `og-cover.png`, `apple-touch-icon.png`, `favicon-32/192/512.png`
to both the project root and `assets/brand/`.

### `bin/dedupe_venues.py`
Removes confirmed duplicates from `clubs-data.js`. Edit the
`DUPLICATES` list at the top with `[(id, reason), ...]` before running.

### `bin/inject_itemlist.py`
Reads `clubs-data.js` via Node, ranks top venues by reviews,
writes a Schema.org ItemList (12 BeachResort/BarOrPub items with
aggregateRating + image + address) into `index.html`'s `#ld-itemlist`.

### `bin/inject_experiences_schema.py`
Reads `experiences-data.js`, generates a `@graph` block with
CollectionPage + ItemList + N TouristTrip items, writes to
`experiences.html` between `<!-- ssbc:experiences-ld -->` markers.

### `bin/sitemap_charters.py`
Generates `sitemap-charters.xml` with one URL per charter
(`/charter.html?c=<id>`), updates `sitemap.xml` to include it.

### `bin/seo_pass.py`
The big one. Regenerates seven sub-sitemaps from source data,
rewrites `robots.txt`, refreshes `sitemap.html`, stamps the
brand-icons / canonical / hreflang / robots / breadcrumb-LD /
Explore-footer blocks on every public HTML page. Pull idempotent.

### `bin/verify_venue_photos.py`
HEADs every venue's photo URL in parallel, classifies as `ok-trusted`,
`ok-match`, `needs-review`, `broken`, `missing`. Writes
`data/photo-audit.{csv,json}` for follow-up. Read-only.

## Verify before push

```bash
python3 bin/verify_venue_photos.py 2>&1 | grep -E 'Status|Broken'
```

Should report `Broken (0):` with no follow-ups.

## When to re-run what

| You changed | Re-run |
|---|---|
| A venue in `clubs-data.js` | `inject_itemlist.py` + `seo_pass.py` |
| An experience in `experiences-data.js` | `inject_experiences_schema.py` + `sitemap_charters.py` + `seo_pass.py` |
| A guide in `guides-data.js` | `seo_pass.py` |
| A brand SVG | `render_brand_pngs.py` |
| Added a new HTML page | Add it to `PUBLIC_PAGES` in `seo_pass.py`, then re-run |
| Added a duplicate venue you want gone | Edit `DUPLICATES` in `dedupe_venues.py`, run, then chain from step 3 |
