#!/usr/bin/env python3
"""Replace every page's <header class="site-header">…</header> with the
single canonical version below. Sets the "active" class based on the
current filename so the right nav link highlights per page.

Run after any nav change. One edit, propagated to all 21 pages.
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = sorted(p for p in ROOT.glob("*.html"))

# Canonical nav: kept short. Reader-first ordering, not feature-first.
# Each tuple = (href, label, classification key for active-marking).
NAV = [
    ("index.html",       "Beaches",       "browse"),
    ("experiences.html", "Experiences",   "experiences"),
    ("guides.html",      "Field guide",   "guides"),
    ("about.html",       "About",         "about"),
    ("rates.html",       "For operators", "operators"),
    ("bookings.html",    "My bookings",   "bookings"),
]

# Which page → which nav key gets the active class
ACTIVE_MAP = {
    "index.html":        "browse",
    "club.html":         "browse",
    "booking.html":      "browse",
    "compare.html":      "browse",
    "experiences.html":  "experiences",
    "guides.html":       "guides",
    "guide.html":        "guides",
    "visiting.html":     "about",   # audience pages tuck under About
    "living.html":       "about",
    "about.html":        "about",
    "team.html":         "about",
    "faq.html":          "about",
    "rates.html":        "operators",
    "bookings.html":     "bookings",
    "account.html":      "bookings",
    "checkout.html":     None,
    "confirmation.html": None,
    "signin.html":       None,
    "gifts.html":        None,
    "app.html":          None,
    "404.html":          None,
}

# Brand mark SVG — the animated Sunspot sun (sized 32px, pulse class)
BRAND_SVG = (
    '<svg class="brand-mark ss-brand-mark-anim" viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">'
      '<g stroke="#ff9800" stroke-width="2" stroke-linecap="round" opacity="0.6">'
        '<line x1="20" y1="2" x2="20" y2="6"/><line x1="20" y1="34" x2="20" y2="38"/>'
        '<line x1="2" y1="20" x2="6" y2="20"/><line x1="34" y1="20" x2="38" y2="20"/>'
        '<line x1="7" y1="7" x2="10" y2="10"/><line x1="30" y1="30" x2="33" y2="33"/>'
        '<line x1="33" y1="7" x2="30" y2="10"/><line x1="10" y1="30" x2="7" y2="33"/>'
      '</g>'
      '<circle cx="20" cy="20" r="11" fill="#ff9800"/>'
      '<circle cx="20" cy="20" r="9" fill="#ffb74d"/>'
      '<circle cx="24" cy="16" r="3" fill="#fff5e1"/>'
    '</svg>'
)


def build_header(filename):
    active_key = ACTIVE_MAP.get(filename, None)
    nav_html = []
    for href, label, key in NAV:
        cls = ' class="active" aria-current="page"' if key == active_key else ""
        nav_html.append(f'<a href="{href}"{cls}>{label}</a>')
    nav_html.append('<a href="signin.html" class="btn-ghost">Sign in</a>')
    return (
        '<header class="site-header">\n'
        '<div class="container">\n'
        f'<a href="index.html" class="brand" aria-label="Sunspot home">{BRAND_SVG}'
        '<span class="brand-name">Sunspot</span></a>\n'
        '<nav aria-label="Main navigation">\n'
        + '\n'.join(nav_html) + '\n'
        '</nav>\n'
        '</div>\n'
        '</header>'
    )


def main():
    # Match the existing <header class="site-header">…</header> block
    header_rx = re.compile(
        r'<header\s+class="site-header">.*?</header>',
        re.DOTALL | re.IGNORECASE,
    )
    patched = 0
    for p in PAGES:
        text = p.read_text()
        new_header = build_header(p.name)
        if not header_rx.search(text):
            print(f"  SKIP {p.name} — no <header class=\"site-header\"> found")
            continue
        new_text = header_rx.sub(lambda m: new_header, text, count=1)
        if new_text != text:
            p.write_text(new_text)
            patched += 1
            print(f"  ✓ {p.name}")
    print(f"\nReplaced header on {patched} pages")


if __name__ == "__main__":
    main()
