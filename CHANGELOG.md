# Sunspot — changelog

Reverse chronological. Each entry is one session's worth of work.

---

## 2026-05-18 — Search toolbar redesign + ATF tightening

**Search/filter toolbar (`.ss-finder`)**
- Rebuilt the sticky toolbar above the venue grid as a single rounded pill.
- Search input with embedded magnifying-glass SVG, hairline separators between segments.
- Each dropdown segment shows: uppercase label + bold current value + caret. Hover state lightens the segment background.
- "Bookable" replaced from checkbox → real CSS toggle switch (orange when on).
- Mobile: collapses to stacked cards (search + each segment + toggle as full-width rows).
- File: `index.html` (component + CSS inline).

**Above-the-fold heights tightened**
- Homepage hero `min-height: 78vh; max-height: 760px` → `min-height: 520px; height: 56vh; max-height: 560px`. H1 line-height 0.98 → 1; vertical air reduced.
- Experiences hero `min-height: 460px` → `min-height: 360px; height: 46vh; max-height: 440px`.
- visiting / living / gifts page-head padding `60px 0 50px` → `40px 0 28px`. H1 clamp tightened.
- New rule documented in COMPONENTS.md §2: hero must leave next section visible above the fold at 900px viewport.

**Documentation**
- New `COMPONENTS.md` — full catalog of every component (layout chrome / heroes / floating overlays / cards / forms / data widgets) with file, location, and behaviour notes.
- New `CHANGELOG.md` (this file).

---

## 2026-05-18 (earlier) — Mode bar → popup, hero redesign, sea-state cleanup

**Top mode bar removed**
- Persistent "Who are you?" strip replaced with a centered modal popup that appears once on first visit (`localStorage ss_mode_seen`).
- Modal: backdrop blur, three options with SVG icons + descriptions + arrows, "Skip for now" link, ESC + click-outside both close it. Translated EN/MT/IT.
- Re-open anytime via the "Context" chip in the bottom-right pref bar.

**Homepage hero redesigned**
- Killed generic gradient + SVG beach illustration + 4-dropdown filter cluster.
- New: full-bleed Blue Lagoon photo, editorial display type ("112 ways to be _in the sea_ today."), live ticker (sunbeds free + sea temp + sunset), two CTAs.
- Filter form moved to its natural home — the sticky toolbar above the venue grid.

**Experiences hero**
- Same editorial treatment with Crystal Lagoon photo + "The sunbed is _just the start_."

---

## 2026-05-18 (earlier) — SEO + design + functional verification

**SEO normalization**
- Unique title + meta description per public page (killed cannibalization between index and booking pages).
- Funnel/account pages (booking, checkout, signin, account, bookings, compare, 404) set to `noindex,nofollow`.
- Canonical URL on every page; OG + Twitter card meta everywhere.
- Sitemap rebuilt: master index + sub-sitemaps for pages (8), venues (112), experiences (19). noindex pages excluded.

**Real photos**
- Scraped 30 real Maltese beach photos from `whichbeach.com.mt` via direct page fetches.
- Mapped 63 venues (beaches + rocky bays + natural pools + lidos) to whichbeach photos.
- 49 venues (pool clubs / rooftops / hotel decks without scrapable real sources) use deterministic picsum landscape placeholders.

**Functional verification**
- Playwright headless captured 42 page renders (21 pages × desktop + mobile). Zero JS errors, zero overflow, zero load failures.

---

## 2026-05-18 (earlier) — WP plugin: operator system + Experiences CPT

Added to `/sunspot-wp/sunspot-venues/includes/`:
- `experiences-cpt.php` — `sunspot_experience` CPT mirroring static `experiences-data.js`.
- `spots.php` — spot-level booking holds with DB-unique constraint guaranteeing zero double bookings. 10-min hold rows, cron release every 5 min, Stripe-webhook confirm flow.
- `notifications.php` — instant operator email + web-push hook + 18:00 daily digest cron.
- `stats-rest.php` — `/sunspot/v1/stats` endpoint (60s cache) returning live venue + sunbeds + occupancy + avg-booking-time.

New `bin/import-from-static.py` — one-shot importer that reads `clubs-data.js` + `experiences-data.js`, sideloads every photo into WP Media Library, creates posts with meta + taxonomy + featured image.

New `ARCHITECTURE.md` — full mapping of static → WP backend for images / content / widgets / CSS / plugins / components, plus the operator system playbook (DB-level no-double-booking, daily ops view, Stripe Connect payouts, when to consider a separate operator SaaS).

---

## 2026-05-18 (earlier) — SVG icon library + emoji purge

- New `icons.js` (~40 stroke SVGs, currentColor-inherited).
- Bulk emoji strip across 39 files (HTML, JS, CSS). Variation selectors + zero-width joiners cleaned. Hard rule: **no emojis anywhere on the site.**

---

## 2026-05-18 (earlier) — Shop subdirectory

- `/shop/` with: `index.html` (product grid), `product.html` (detail with colour swatches + size picker + qty stepper), `cart.html` (line items + summary). Free MT shipping over €40.
- `products.js` — minimal essentials catalog: towels (classic / XL / microfibre), bottles (500 / 750ml), goggles + snorkel set, dry bag, tee, cap, tote, sunscreen, flip-flops. Subtle branding only ("no big logos", "small embroidered sun").
- `cart.js` — localStorage cart with add/remove/qty/subtotal.
- `shop.css` — self-contained styles, ready to map to `shop.sunspot.mt` subdomain.

---

## Roadmap (next sessions)

1. **Stripe Connect onboarding** flow for operators (Express KYC → IBAN → back to dashboard).
2. **PaymentIntent webhook** handler that creates confirmed bookings from successful charges.
3. **Real seatmap editor** (drag-and-drop) — currently we store an SVG only.
4. **Web push notifications** (Service Worker + VAPID keys).
5. **Daily digest email** cron (already scheduled in `notifications.php`; just need SMTP config).
6. **Polylang configuration** for EN/MT/IT translation of post content.
7. **POS adapters** for operators already on Lightspeed / Square / iZettle (defer until 3+ operators ask).
