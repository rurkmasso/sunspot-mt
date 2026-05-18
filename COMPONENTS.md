# Sunspot — components catalog

Every reusable / floating UI piece on the static prototype, where it lives, what it does, where it shows. Sorted by category.

> Convention: anything prefixed `ss-` is owned by `features.js` or `audiences.js` (injected at runtime, every page). Anything prefixed `hero-v2` / `exp-hero-v2` / `ss-finder` / `ss-mode-modal` is a page-level component declared in HTML/CSS.

---

## 1. Layout chrome

| Component | File | Where it appears | Notes |
|---|---|---|---|
| Site header | every page HTML | Top of every page | Sticky on most pages. Logo + nav + Sign-in button. Auto-collapses to hamburger ≤720px (via `features.js` `addMobileMenu`). |
| Site footer | every page HTML | Bottom of every page | Brand + links + copyright. |
| Skip-to-content link | `features.js → addSkipLink` | Visually hidden, visible on Tab | Points at `<main>` or first `.container`. |

## 2. Above-the-fold heroes (page-level)

| Page | Component class | Min height | Notes |
|---|---|---|---|
| `index.html` | `.hero-v2` | 520px, capped 560px (56vh) | Full-bleed Blue Lagoon photo, editorial type, live ticker, two CTAs. |
| `experiences.html` | `.exp-hero-v2` | 360px, capped 440px (46vh) | Crystal Lagoon photo, editorial type. |
| `visiting.html` | `.audience-hero` | text-only, padding `40px 0 28px` | Soft gradient (orange + cyan). |
| `living.html` | `.audience-hero` | text-only, padding `40px 0 28px` | Soft gradient (aqua + orange). |
| `gifts.html` | `.gift-hero` | text-only, padding `40px 0 28px` | Soft gradient. |
| `club.html` | gallery collage | `~380px` | Up to 5 venue photos in a grid. |

Rule: hero must leave room for the next section's top edge to be visible above the fold at 900px viewport. Apply to any new photo-led page.

## 3. Floating overlays (every page)

| Component | File | Position | Trigger | Notes |
|---|---|---|---|---|
| **Mode popup** | `audiences.js → showModePopup` | Centered modal | First visit only; or click "Context" chip | Three options (Visiting / Living / Cruise) + Skip. Backdrop blur. Saves `ss_mode_seen=1` once chosen. |
| **Pref bar** | `audiences.js → renderPrefBar` | Bottom-right, fixed | Always (except in editor / modal-open states) | Context chip · language · currency · Family-mode toggle. Click context chip to reopen mode popup. |
| **Sea-state pill** | `features.js → renderSea` | Bottom-LEFT, fixed | Always; dismissible per-session | Click to expand into full panel with air/sea/UV/tide/wind + origin selector. |
| **Compare drawer** | `features.js → refreshCmp` | Bottom strip, full width | Visible only when ≥1 venue compared | Lists slots, link to `compare.html`. |
| **Newsletter signup** | `features.js → renderNewsletter` | Inserted above footer | Always (every page) | Email capture, persists in localStorage, swap to Brevo API in prod. |
| **Sunset banner** | `features.js → renderSunset` | Top of body, dismissible | Only when ≤2 hours to sunset | "Sunset in N min · find a west-facing spot →". |
| **Toast** | `features.js → toast()` | Bottom-center, transient | Programmatic | Used by favourites, compare, pref-bar actions. |
| **Lightbox** | `lightbox.js` | Full-viewport overlay | Click any `.g-tile` in venue gallery | ESC + click-outside to close. |

## 4. Card components

| Component | File | Where | Notes |
|---|---|---|---|
| Venue card | `club-thumbs.js → buildCard` | Index venue grid, related-venues on club.html | Lazy-loaded background image, category badge, ♥/⇄ buttons added by `features.js → decorate`, distance chip added by `audiences.js`. |
| Experience card | `experiences.html` inline | Experiences grid + cross-sell on club.html | Photo + duration badge + category chip + price line. |
| Product card | `shop/index.html` inline | Shop grid | Photo + tag pill + title + summary + Add button. |
| Guide card | `guides.html` inline | Guides grid | Photo + category kicker + title + read-min. |
| Cart line | `shop/cart.html` inline | Shop cart | Image + meta + qty stepper + remove. |
| Customer testimonial | `index.html` inline | Homepage post-how-it-works | Stars + quote + author avatar+location. |

## 5. Forms / inputs

| Component | File | Where | Notes |
|---|---|---|---|
| **Finder bar** (`.ss-finder`) | `index.html` inline | Sticky above the venue grid | Search input + 3 dropdowns + toggle switch in a single rounded pill. Hairline separators. Pill shrinks to stacked rows on mobile (≤760px). |
| Facet sidebar | `club-thumbs.js → renderFacets` | Left of venue grid | Price / rating / best-for / features / amenities checkboxes. |
| Booking card | `club.js → renderBookingCard` | Right column of club.html | Date / guests / type, sticky on scroll. |
| Itinerary planner | `visiting.html` inline | On visiting.html | Multi-step picker: base / days / group / budget / interests. |
| Gift card builder | `gifts.html` inline | gifts.html | Amount picker + delivery method + live preview card. |
| Newsletter input | `features.js` (CSS in `.ss-newsletter`) | Above every footer | Email + Subscribe button. |

## 6. Page-template components

| Component | Where | Notes |
|---|---|---|
| `.kicker` | All pages | Small uppercase eyebrow text above an H1. |
| `.live-stats` (dark panel) | Homepage post-toolbar | 4 metrics counting up on scroll. |
| `.section-head` | All pages | Centered h2 + lede paragraph. |
| `.section-head-row` | All pages | h2/lede left, "See all →" right. |
| `.how-it-works` (numbered steps) | Homepage | 3-step numbered list. |
| `.faq-item` (native `<details>`) | FAQ page + homepage FAQ section | Auto-generates JSON-LD FAQPage schema. |

## 7. Floating widgets that read data

| Widget | Reads from | Updates |
|---|---|---|
| Hero live ticker (`#hero-v2-bookable`, `#hero-v2-sea`, `#hero-v2-sunset`) | `SUNSPOT_CLUBS` array (sum of `spotsLeft`), deterministic daily sea seed, monthly Malta sunset table | On page load. |
| Live-stats panel (`#ss-live-stats`) | Same data | Counts up via IntersectionObserver, refreshes every 60s. |
| Sea-state pill | `features.js → buildSea()` (deterministic per-day mock). **Production swap:** replace `buildSea()` with `fetch('/wp-json/sunspot/v1/weather')`. | Refresh on page load. |

## 8. Component rules (so things stay consistent)

1. **No emojis anywhere.** Use SVG icons from `icons.js` (`SS_ICONS.location(18)` etc.) or clean text.
2. **All prices in `<strong data-eur="N">€N</strong>`** so `audiences.js → reprice()` can swap to GBP/USD live.
3. **All venue cards must render in `decorate()`-friendly markup:** `<article class="club-card-wrap"><a class="club-card" href="club.html?club=X">…<div class="club-thumb" data-bg="…"></div>…</a></article>` so favourites, compare, lazy-load, distance badges and family-mode marking all attach automatically.
4. **Every photo-led hero leaves the next section partially visible above the fold** at 900px viewport. See section 2 sizes as the spec.
5. **Floating widgets dock at corners**: bottom-LEFT = sea state, bottom-RIGHT = pref bar. Compare drawer is full-width along the bottom. They never crowd each other (CSS handles vertical stacking when multiple are visible).
6. **All page navs include the same items** in the same order: Beaches · Experiences · Guides · Visiting? · Living here · FAQ · About · Sign in. The hamburger menu shows the same.

## 9. The data flow (one sentence)

`clubs-data.js` + `experiences-data.js` are loaded → `club-thumbs.js` renders cards into the grid → `features.js` decorates cards with overlays → `audiences.js` adds language/currency/distance enhancements → CSS variables in `styles.css` style everything.

In production, `clubs-data.js` is replaced by a fetch to `/wp-json/wp/v2/sunspot_venue?_embed`. Everything else stays the same.
