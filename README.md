# Sunspot — Malta beach booking platform

Static prototype for **sunspot.mt**, Malta's dedicated booking platform for beach clubs, lidos and rooftop pools. 112 venues across Malta, Gozo and Comino.

> **Pre-launch — site is gated.** All pages require sign-in before render.
> Email: `mark@sunspot.mt` · Password: `password`

## Running locally

It's a static site — no build step. Open any `.html` file in a browser, or serve the directory:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## What's here

| Path | What |
|---|---|
| `index.html` | Homepage — hero, live stats, search bar, venue grid |
| `club.html` | Single venue detail page |
| `experiences.html` | Boat tours, jetskis, kayaks, sunset cruises |
| `visiting.html` | Tourist landing — day-trip itinerary builder |
| `living.html` | Locals & expats — season passes, dog beaches, work-from-beach |
| `faq.html` | Help with FAQPage JSON-LD schema |
| `gifts.html` | Gift cards builder with live preview |
| `compare.html` | Side-by-side venue comparison |
| `app.html` | "Get the app" landing + PWA install |
| `shop/` | Shop subdomain (towels, bottles, goggles, apparel) |
| `clubs-data.js` | 112-venue catalog (the design source of truth) |
| `experiences-data.js` | 19 experiences catalog |
| `features.js` | Lazy load, favourites, compare, sea-state, newsletter, hamburger |
| `audiences.js` | Language / currency / family-mode / mode popup / distance |
| `icons.js` | SVG icon library (~40 stroke icons, currentColor) |
| `gate.js` | Pre-launch credential gate (this is what asks for the password) |
| `styles.css` | Brand tokens + component CSS |
| `COMPONENTS.md` | Component catalog |
| `CHANGELOG.md` | Reverse-chronological work log |

## About the password gate

`gate.js` is a **client-side curtain**, not real authentication:
- Anyone with browser devtools or "view source" can bypass it.
- The HTML, all data files, and the JS itself are publicly readable in the repo and in any deployed build.

It exists to stop casual visitors and search engines while the platform is in pre-launch. For real protection once we're live with operator/customer data, deploy via:

- **Cloudflare Pages** with [Access](https://www.cloudflare.com/products/zero-trust/access/) (basic auth + SSO),
- **Vercel** project-level basic auth, or
- **Netlify** site-level basic auth.

All three sit in front of the static site at the platform level so the gate can't be bypassed by viewing source.

To **change** the credentials or remove the gate entirely, edit `gate.js` — the `REQ_USER` and `REQ_PASS` constants at the top.

To **reset** your session locally (force the gate to appear again): open browser console, type `ss_logout()`.

## Brand rules

1. **No emojis anywhere.** Use SVG icons from `icons.js` (`SS_ICONS.location(18)` etc.).
2. **All prices wrapped with `data-eur`** so the currency switcher can re-format live.
3. **Every photo-led hero** must leave the next section partially visible above the fold at 900px viewport.
4. Brand palette: orange `#ff9800` (`--sun-deep`), deep navy `#0a1f3a` (`--ink`), aqua `#0288d1` (`--sea-1`), cream `#fff8e8` (`--sand`).
5. Mobile-first **always** — design 390×844 first, then enhance up.

## Brand kit

Everything brand-related lives in **`assets/brand/`** and is documented
on the public `/brand` page (`brand.html`):

- `mark.svg` — primary sun mark with the asymmetric reflection glint
- `mark-mono.svg` — single-colour version (inherits `currentColor`)
- `wordmark.svg` — Sunspot wordmark in Fraunces
- `lockup.svg` — horizontal mark + wordmark
- `lockup-mono-light.svg` — lockup for dark backgrounds
- `og-cover.svg` / `og-cover.png` — 1200×630 social share image
- `favicon-32/192/512.png`, `apple-touch-icon.png` — icon family

The PNGs are rendered from the SVGs by `bin/render_brand_pngs.py`
(headless Chromium). Re-run any time the SVGs change so the rasters
stay in sync:

```bash
python3 bin/render_brand_pngs.py
```

`manifest.json` wires the icons + theme + shortcuts for installable
PWA. The favicon / apple-touch / manifest / theme-color block is
stamped on every HTML page by `seo_pass.py`, so the brand reads the
same the moment any URL loads.

`/brand` is also the press / partner page — palette swatches, type
specimens, voice and tone do/don't, and a downloads section.

## Build scripts

Three idempotent Python build scripts live in `bin/`. None of them
require a paid service — every step works offline against the source
files. Re-run any time the inputs change.

| Script | What it does |
|---|---|
| `bin/render_brand_pngs.py` | Renders the brand SVGs (`mark`, `og-cover`) to PNG via headless Chromium so the favicons and OG card stay in sync. |
| `bin/seo_pass.py`          | Regenerates the seven sub-sitemaps + index, rewrites `robots.txt`, refreshes `sitemap.html`, stamps the favicon/manifest/canonical/hreflang/breadcrumb/Explore-footer blocks on every public HTML page. |
| `bin/inject_itemlist.py`   | Reads `clubs-data.js` via Node, ranks the top venues, writes a full Schema.org `ItemList` (with `BeachResort`/`BarOrPub` items + `aggregateRating` + address + image) straight into `index.html` so Google sees the venues without executing the JS. |
| `bin/inject_experiences_schema.py` | Reads `experiences-data.js`, parses each tour, and writes a `@graph` block at the top of `experiences.html` with `CollectionPage` + `ItemList` (19) + 19 `TouristTrip` items each carrying an `Offer` (price, currency, availability), duration, max-pax, provider organisation, photo, and category. |

Order: `render_brand_pngs.py` first if the SVGs changed, then any
content edits, then `inject_itemlist.py` whenever `clubs-data.js`
changes, then `inject_experiences_schema.py` whenever
`experiences-data.js` changes, then `seo_pass.py` to refresh sitemaps
+ page-level SEO.

### Schema.org coverage (per page)

Every public page now ships the right Schema.org type for what it
actually is, all back-referenced to a single Organization + WebSite
graph anchored at `sunspot.mt/#organization` and `sunspot.mt/#website`.

| Page             | Main schemas                                                    |
|---|---|
| `/`              | Organization · WebSite · SearchAction · ItemList (12 venues)    |
| `/experiences/`  | CollectionPage · ItemList (19) · TouristTrip[] with Offer       |
| `/guides/`       | CollectionPage · ItemList of 9 articles                         |
| `/guide.html`    | Article (injected at runtime by `guide.js` from `guides-data.js`)|
| `/visiting/`     | Article · HowTo (4 steps for planning a Malta beach trip)       |
| `/living/`       | Article with `audience` = residents + expats                    |
| `/about/`        | AboutPage referencing the Organization                          |
| `/team/`         | AboutPage + 5 Person entities with `worksFor`, `knowsAbout`     |
| `/faq/`          | FAQPage with 32 Q&As (auto-extracted by `seo_pass.py`)          |
| `/gifts/`        | Product + AggregateOffer (€25–500, 8 denominations)             |
| `/rates/`        | Service + Offer (€0 listing, 8% guest-paid)                     |
| `/brand/`        | BreadcrumbList only — style guide is non-canonical content      |
| Every page       | BreadcrumbList, hreflang, robots, canonical, brand-icons block  |

## Mobile performance

The hero photo is preloaded via `rel="preload" as="image"` so the
LCP element starts downloading before parsing finishes. `whichbeach.com.mt`
gets a `crossorigin` preconnect so the preload reuses the same TLS
handshake. Decoding is async, mobile CTAs clear Apple's 44px tap
target, and the mobile hero has been re-tuned so the H1 + CTAs sit
above-the-fold on a 390×844 viewport.

A service worker (`sw.js`) precaches the brand kit + critical scripts
on first visit and uses network-first for HTML, cache-first for brand
SVGs/favicons, stale-while-revalidate for everything else. Repeat
visits feel instant; offline visits get a cached shell.

## SEO + sitemaps

Everything SEO-related is regenerated by one idempotent script:

```bash
python3 bin/seo_pass.py
```

Each run:

- Rebuilds 7 sub-sitemaps + the index, sourced from `clubs-data.js`,
  `guides-data.js` and `experiences-data.js` so coverage can't drift.
  Every entry carries `xhtml:link` hreflang siblings (en-MT / mt-MT /
  it-MT / x-default).
- Rewrites `robots.txt` — blocks transactional flows and AI scrapers
  (GPTBot, Google-Extended, CCBot, ClaudeBot, anthropic-ai), allows
  `.css` / `.js` so Google can render, lists every sitemap URL.
- Refreshes the human sitemap at `sitemap.html`.
- Patches every public `.html`:
  - Page-specific `canonical` (preserves `id="canonical"` on dynamic
    pages so `club.js` / `guide.js` can update at runtime).
  - `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
  - 4-way hreflang block (en-MT / mt-MT / it-MT / x-default).
  - `BreadcrumbList` JSON-LD per page (chains live in the script's
    `BREADCRUMBS` table — edit there to change).
  - `FAQPage` JSON-LD on `faq.html`, extracted from the page Q&A.
  - "Explore Sunspot" internal-links footer (self-link suppressed).

The script is the single source of truth for SEO. Don't hand-edit
sitemap XML, robots.txt, or the patched blocks — re-run instead.

## Production target

This static prototype is the **design source of truth**. Production runs on WordPress (separate repo `sunspot-wp`):
- Custom plugin `sunspot-venues` — CPTs, REST, roles, customer auth, spot-level inventory with DB-level no-double-booking
- Custom theme `sunspot-theme` — paired template parts
- WP admin preview at `/preview/` (full pixel-faithful look-alike)

See `ARCHITECTURE.md` in the `sunspot-wp` repo for the full static → WP mapping.

---

© 2026 Sunspot Ltd. · Built in Valletta.
