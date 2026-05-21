# Sunspot UX — three audiences, three surfaces

The product has three distinct user types. Each has a different surface and
a different set of jobs-to-be-done. This doc maps them so we don't
accidentally optimise one experience at the cost of another.

Last meaningful update: 2026-05-21

---

## 1. Customer (the beachgoer)

**Surface:** sunspot.mt (public site)

**Their day:**
- Land on `/` → see live stats + featured beach clubs
- Tap a region/category, or scroll the grid
- Tap a venue → `/club.html?club=…` for details, photos, hours
- Tap "Reserve" → `/booking.html?club=…`
- Pick a sunbed on the blueprint, set date + guests
- `/checkout.html` → guest details, pay
- `/confirmation.html` → receipt ticket with QR
- Later: `/bookings.html` polls every 4 s and pops a toast when the
  operator accepts/declines

**Tells us things are working:**
- The Map toggle on the homepage shows all 112 venues
- Filter chips persist via URL (`?region=gozo`)
- Mobile-first: bottom nav with Browse / Experiences / Sea today / My trips / Account
- Live status badges on the bookings page update without refresh
- QR + ref + venue name on the confirmation ticket

**Known gaps:**
- No login required to book (anonymous flow) — guest contact is captured
  at checkout and the BE now stores `_guest_name/_guest_email/_guest_phone`
- Customer email on operator action is wired BE-side but only fires when
  the webhook is live (not in localStorage demo)

---

## 2. Operator (the venue staff)

**Surface:** sunspot.mt/operator/ (PWA, mobile-first, installable)

**Their shift:**
- Open `/operator/` → greeting + clock + "10 bookings today"
- **Live hero** shows: spots occupied / pending arrivals / checked in
- **Activity feed**: chronological "Lara M. checked in to A12 · 2 min ago"
- **Up-next card** highlights the next thing demanding action
- Tap **Accept / Decline** on a pending booking → toast confirms
- Tap **Scan** (bottom nav) → camera opens, scan guest QR
- Tap **Walk-in FAB** → log a cash-paying guest in 5 seconds
- Switch venues via the polished switcher (cards, NOT a native `<select>`)
  — and they only see THEIR venues, never competitors'
- **Layout tab** → blueprint editor: add Pool / Deck / Sand / Bar areas,
  drop sunbeds with one tap, drag to position, ⚡ Auto-fill row for speed
- **Stats tab** → weekly metrics, payout amount

**Tells us it's working:**
- Greeting changes by time of day ("Good morning" → "Sunset shift —
  enjoy it.")
- Phone numbers in booking rows are tap-to-call (`tel:` links)
- Quick-search above the bookings list filters by name / ref / spot
- Toasts on every action so nothing fails silently
- Bottom-sheet confirms for destructive actions (decline, no-show, clear
  layout) — no jarring browser confirm()
- Three responsive layouts: mobile (bottom nav), tablet (icon rail), laptop
  (full sidebar)
- Brand: Fraunces serif numbers, sun-gradient CTAs, animated sun mark

**Known gaps:**
- Push notifications not wired yet (SW endpoint exists, FE wiring TBD)
- Stripe Connect Express KYC onboarding step missing
- Real BarcodeDetector wiring is a stub — currently shows demo alert

---

## 3. Sunspot admin + Operator power-user (WP admin)

**Surface:** wp.sunspot.mt/wp-admin (WordPress, real CRUD)

**Sunspot admin (us) tasks:**
- Onboard new operators: Users → Add New → role "Venue Operator"
- Assign operators to their venues: edit the venue post, set Author
- Bulk-import venues from CSV (`csv-import.php`)
- Monitor the platform: bookings list, Stripe webhook log
- Override operator actions: refund, force-cancel, swap venues
- Manage taxonomies (type, region, vibe) — single source of truth
- Edit guides, experiences, FAQ content (all CPTs)

**Operator power-user tasks (in the operator-stripped WP admin):**
- Edit their venue post — photos, hours, prices, amenities, layout
- See full booking history (past, future, all statuses)
- Bulk-update sunbed prices
- Export bookings CSV
- Update profile / change app password
- Connect Stripe Express dashboard (roadmap)

**What's stripped from operators in WP admin:**
- No Plugins menu, no Tools, no Posts, no Users (except their own profile)
- No "Add new venue" — Sunspot admin creates the post, then assigns it
- See `operator-dashboard.php` for the menu lockdown rules

**Tells us it's working:**
- An operator logging in sees only their own venue posts and bookings
- An admin sees everything
- `sunspot_my_venue_slugs()` is the single chokepoint enforcing isolation
- The polished operator PWA at `/operator/` is the primary daily UI; the
  WP admin is the back-office for power tasks and bulk operations

---

## Cross-cutting design rules

1. **Mobile-first ALWAYS** — design 390 × 844 first, enhance up
2. **No emojis** — SVG icons or clean text (cheap-looking otherwise)
3. **Brand palette** — sun-deep `#ff9800`, ink `#0a1f3a`, limestone
   `#fdf6e8`, honey `#e89d3a`, terracotta `#c0563b`, balcony `#2f6e5b`
4. **Type pairing** — Fraunces (display) + Inter (body)
5. **Sun-gradient pill** is the signature CTA — only used for primary actions
6. **Toasts, not alerts** — every action gives visual feedback
7. **Bottom-sheet confirms** — no `window.confirm()` for destructive actions

---

## Verifying the isolation (the critical security property)

**Customer cannot:**
- Access `/operator/*` content of any venue (FE has no such routes anyway)
- Read another customer's booking via `/me/bookings` (JWT-scoped to user_id)

**Operator cannot:**
- See another operator's venues in `/sunspot/v1/operator/venues`
  → enforced by `sunspot_my_venue_slugs()` (`post_author = current_user_id`)
- Hit `/operator/bookings/{id}/action` on a booking they don't own
  → `in_array($slug, sunspot_my_venue_slugs(), true)` guard at endpoint
- See another operator's stats, layout, or seatmap
  → same own-venue scope guard on every endpoint

**Demo mode mirrors this:** the demo operator sees only the AX Resorts
Group's 2 venues (Bonita + Solas), never Aqualuna or Noma. The sidebar
footer reminds them: *"You only see venues assigned to your account."*
