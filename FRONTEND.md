# Sunspot — Frontend (living doc)

The customer-facing static site + the operator PWA. Both ship from this repo to GitHub Pages. **Update this file whenever you add a page, change the data shape, or move a build step.**

Last meaningful update: 2026-05-18

---

## At a glance

- **Stack:** vanilla HTML + CSS + ES2015 JS. No framework, no bundler, no build step.
- **Hosting:** GitHub Pages off `main`.
- **Backend mode toggle:** if `window.SUNSPOT_API_BASE` is set, `api-bridge.js` swaps `window.SUNSPOT_CLUBS` for live REST data from the WordPress plugin. Without it, everything reads from `clubs-data.js` (static).
- **Demo backend:** `localStorage.sunspot_bookings` is the shared bus between `checkout.html` and `operator/`. Operator actions write back so the customer "My bookings" page reflects status changes.
- **Auth gate:** `gate.js` is a client-side password gate (not secure — keeps casual eyes out before launch).

---

## Repo layout

```
/                       customer site (root)
  index.html            home + browse grid (entry point)
  club.html             venue detail
  booking.html          seatmap + spot picker
  checkout.html         guest details + (demo) payment
  confirmation.html     receipt + QR
  bookings.html         "my trips"
  account.html          profile + saved
  experiences.html      curated activities
  guide.html            island guides
  visiting.html         tourist landing
  living.html           local landing
  compare.html          side-by-side venue compare
  about.html / faq.html / signin.html / app.html / 404.html
  shop/                 the gifts/merchandise sub-site
  operator/             the operator PWA (separate manifest + SW)
```

### JS modules (root)
| File | Job |
|---|---|
| `clubs-data.js` | 112 venues — the source of truth in static mode |
| `experiences-data.js` | 19 experiences |
| `guides-data.js` | guide articles |
| `features.js` | sea-state widget, mobile bottom nav, language pref |
| `audiences.js` | mode-picker (visitor/local/family), pref bar, multi-origin selector |
| `seatmap.js` | sunbed grid + hold creation on the booking page |
| `checkout.js` | demo checkout flow, writes `sunspot_bookings` |
| `bookings.js` / `confirmation.js` / `club.js` / `guide.js` | per-page glue |
| `components.js` | shared header, footer, breadcrumbs |
| `icons.js` | SVG icon library (no emojis anywhere in product) |
| `nav-auth.js` / `auth.js` | demo sign-in state |
| `api-bridge.js` | reads `SUNSPOT_API_BASE` and swaps in live REST data |
| `lightbox.js` | photo gallery |
| `club-thumbs.js` | thumb deduper for the grid |
| `gate.js` | password gate |
| `sw.js` | service worker (offline shell) |

### Operator PWA (`operator/`)
| File | Job |
|---|---|
| `index.html` | shell — top header (desktop) + bottom nav (mobile) + tab panels |
| `operator.js` | data wiring; reads `localStorage.sunspot_bookings`, persists actions back; talks to operator REST when `SUNSPOT_API_BASE` is set |
| `manifest.webmanifest` | install-to-home-screen metadata |

---

## Design rules (non-negotiable)

1. **Mobile-first.** Phone is the primary viewport. Hide non-essentials below 720 px and surface them through the bottom nav or popovers.
2. **No emojis.** Use SVG icons from `icons.js` (`SS_ICONS.name(size)`). Emojis read cheap.
3. **44 px tap targets** minimum on phone. 16 px form inputs (prevents iOS zoom).
4. **Brand palette:** `--sun-deep` `#ff9800`, `--ink` `#0a1f3a`, aqua `#0288d1`, cream `#fff8e8`.
5. **Above-the-fold discipline:** every hero ≤ 320 px tall on phone. No hero pushing the listing below the fold.

---

## Data flow

```
Static mode (default — GitHub Pages):
  clubs-data.js  ──►  window.SUNSPOT_CLUBS  ──►  page renderers

API mode (set window.SUNSPOT_API_BASE):
  /wp-json/wp/v2/sunspot_venue?_embed  ──►  api-bridge.js
                                         ──►  window.SUNSPOT_CLUBS (replaced)
                                         ──►  page renderers
```

Customer booking demo loop:
```
booking.html  ──►  hold (localStorage)
checkout.html ──►  writes booking { ref: "BJ-1234", ... } to localStorage.sunspot_bookings
operator/     ──►  reads sunspot_bookings, shows pulsing "new" badge
              ──►  operator action writes status back to sunspot_bookings
bookings.html ──►  reads same key, shows updated status
```

---

## Adding a new page (recipe)

1. Copy an existing page that's close (e.g. `about.html`).
2. Keep `<head>` order: meta → `styles.css` → `gate.js` → page-specific data → `api-bridge.js` if it needs venues → `features.js` → `audiences.js`.
3. Use `<main class="container">` as the wrapper.
4. Don't add new CSS files; extend `styles.css` with a clearly-commented section.
5. If the page should swap in live data, add it to `api-bridge.js`'s page list.
6. Add a row to the "Repo layout" table above.

---

## Adding a new venue field

1. Add it to `clubs-data.js` (every venue).
2. Read it in the renderer (`index.html` grid card, `club.html` detail page).
3. Mirror the field name in the WP plugin's `meta.php` (or the field will be missing in API mode).
4. Update `api-bridge.js` to map the REST response into the same field name.

The frontend should not care whether the data came from `clubs-data.js` or the REST API — both must produce the same shape.

---

## Known sharp edges

- **Service Worker caching.** `sw.js` does cache-first for same-origin. After a deploy, users may see stale JS for ~24 h. Bump the cache version in `sw.js` when you change anything user-visible.
- **`gate.js` is not security.** Source is public. Move to real auth before any sensitive data lands here.
- **`window.SUNSPOT_CLUBS` is global.** Page scripts assume it's there by the time they run. If you add a script that needs venues, load it AFTER `clubs-data.js` and `api-bridge.js`.
- **Image hosting.** 49 venues still use picsum placeholders; 63 have real photos from whichbeach.com.mt. Real photos for the remainder is on the roadmap.

---

## Roadmap

- [ ] Real photos for remaining 49 venues
- [ ] Web push registration in operator PWA (endpoint exists on BE)
- [ ] Real seatmap drag-editor (currently tap-per-bed)
- [ ] Stripe Connect Express onboarding embed in operator app
- [ ] 24 h reminder email template
- [ ] Empty-state pass across booking funnel
