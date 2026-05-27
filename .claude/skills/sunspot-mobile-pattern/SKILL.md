---
name: sunspot-mobile-pattern
description: The shared mobile-first page pattern for category-driven landing pages on Sunspot. Use when building or rewriting a hub page (/experiences, /charters, /watersports — and any new ones). Spells out the exact layout, the category-strip behaviour, the JS contract, and the count-the-cards verification step.
---

# Sunspot category hub pattern

`/experiences`, `/charters` and `/watersports` all share the same
shape. Anything new that ships a card grid should follow this.

## Anatomy

```
┌──────────────────────────────────────┐
│  HEADER (sticky, brand mark + nav)   │
├──────────────────────────────────────┤
│  HERO (aspect-ratio 21/9)            │
│  • photo, scrim, eyebrow pill        │
│  • h1 with one italic-amber phrase   │
│  • single-line p (no marketing copy) │
├──────────────────────────────────────┤
│  CATEGORY STRIP                       │
│  • horizontal-scroll on mobile        │
│  • 6-7 col grid on ≥720px            │
│  • each tile: label / sub / count    │
│  • is-on = ink-dark fill              │
├──────────────────────────────────────┤
│  SECTION HEAD (h2 + count)            │
│  • "All boats" + "19 available"      │
├──────────────────────────────────────┤
│  CARD GRID (auto-fill minmax 280px)  │
│  • photo, badge, name, meta, summary │
│  • price + "View →"                  │
└──────────────────────────────────────┘
```

## CSS conventions

Per-page CSS lives in the `<style>` inside `<head>`, scoped with a
2-letter prefix (`ch-` charters, `ws-` watersports, `exp-`
experiences). Don't push these into `styles.css` — keep them local
so they don't conflict.

Reuse the design tokens from `styles.css`:

- `var(--ink)`, `var(--ink-soft)`, `var(--muted)`
- `var(--honey)`, `var(--sun-deep)`, `var(--grad-sun)`
- `var(--sea-1)`, `var(--sea-2)`, `var(--sea-pale)`
- `var(--line)` for hairlines
- `var(--limestone)` for accent panel backgrounds
- `var(--font-display)` Fraunces, `var(--font-body)` Inter

## Hero rules

```css
.x-hero {
  aspect-ratio: 21/9;
  max-height: 360px;
  min-height: 220px;
  overflow: hidden;
}
.x-hero img { position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover; }
.x-hero h1 {
  font-family: var(--font-display); font-weight: 500;
  font-size: clamp(1.8rem, 4.8vw, 2.8rem);
  letter-spacing: -0.024em; line-height: 1.02;
  font-variation-settings: 'opsz' 64, 'SOFT' 30;
}
.x-hero h1 em { font-style: italic; color: #ffd58a; }
```

Don't make the hero taller than that — it eats the mobile fold and
pushes the cards down.

## Category strip rules

- **Every tile must have non-zero count** before ship. Count
  pre-computed in JS at boot, displayed in the `.count` pill.
- **Buckets sweep every sub-category.** If you add a new
  category to `experiences-data.js`, also update the bucket map in
  the page's JS.
- **Mobile**: horizontal scroll with `scroll-snap-type: x mandatory`,
  hidden scrollbar.
- **Desktop ≥720px**: switch to `grid-template-columns: repeat(N, 1fr)`
  where N is the number of tiles.

## JS contract

The page's inline script should:

1. Wait for DOMContentLoaded (defer scripts already loaded by then).
2. Filter `window.SUNSPOT_EXPERIENCES` (or CLUBS) to its domain.
3. Pre-compute every tile's count before any render.
4. Wire each tile to call `render(key)` on click.
5. After render, scroll the section heading into view smoothly.
6. Update URL state if needed, drop the param after activation.

## Verification

Always sanity-check by Playwright-rendering on a 390×844 viewport.
Set the gate token first:

```python
pg.evaluate(f"localStorage.setItem('sunspot_gate_v1', btoa({ts_ms} + '|ok'))")
```

Then count cards + tile counts:

```python
cards = pg.evaluate('document.querySelectorAll(".X-card").length')
counts = pg.evaluate('Array.from(document.querySelectorAll(".X-cat .count")).map(c => c.textContent)')
```

`cards` must be the same as the "All" count. No tile may show `0`.

## Anti-patterns

- **Two layers of category UI** (tiles + tabs) — pick one.
- **A tile that shows "0"** — kill the tile or extend the bucket.
- **A "Freedive" tile when Scuba already covers freediving** —
  buckets should be MECE.
- **Hero ≥ 60vh on mobile** — pushes everything below the fold.
- **Mobile filter strip that wraps to 3 rows** — collapse into a
  Filters button + sheet.
