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

## Production target

This static prototype is the **design source of truth**. Production runs on WordPress (separate repo `sunspot-wp`):
- Custom plugin `sunspot-venues` — CPTs, REST, roles, customer auth, spot-level inventory with DB-level no-double-booking
- Custom theme `sunspot-theme` — paired template parts
- WP admin preview at `/preview/` (full pixel-faithful look-alike)

See `ARCHITECTURE.md` in the `sunspot-wp` repo for the full static → WP mapping.

---

© 2026 Sunspot Ltd. · Built in Valletta.
