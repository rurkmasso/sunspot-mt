#!/usr/bin/env python3
"""Bulk SEO fixes — adds missing OG/Twitter tags, sane titles + descriptions
+ canonicals, and static JSON-LD fallback per page.

Per page we ship a small dict of {title, description, canonical, og_image, schema}.
Anything missing gets injected before </head>. Existing tags are NOT replaced.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

OG_DEFAULT_IMG = "https://sunspot.mt/og-cover.png"

# Per-page SEO config. Keys: title, description, canonical, og_image, schema (optional).
PAGES = {
    "index.html": {
        "title": "Sunspot — Malta beach clubs, lidos & rooftop pools booking",
        "description": "Book sunbeds, cabanas and floating cabanas at 112 beach clubs, lidos and rooftop pools across Malta, Gozo and Comino. Live availability, free cancellation, 8% service fee.",
        "canonical": "https://sunspot.mt/",
    },
    "guides.html": {
        "title": "Malta beach club guides — sunsets, pool parties, Comino, Gozo",
        "description": "In-depth, opinionated guides to Malta's coast — best sunset spots, Comino day-trips, Gozo wild swimming, family-friendly beaches, rooftop pools. Updated for 2026.",
        "canonical": "https://sunspot.mt/guides.html",
    },
    "guide.html": {
        # Filled dynamically by guide.js — keep a sensible static fallback so
        # crawlers that don't run JS still see something useful.
        "title": "Sunspot Field Guide — Malta beach & pool stories",
        "description": "Opinionated, on-the-ground guides to Malta's beach clubs, lidos and wild coast. Picked by people who actually go.",
        "canonical": "https://sunspot.mt/guides.html",
    },
    "club.html": {
        "title": "Beach club & lido details — Sunspot Malta",
        "description": "Real photos, sunbed prices, opening hours and live availability for Malta's beach clubs, lidos and rooftop pools. Reserve in 30 seconds.",
        "canonical": "https://sunspot.mt/",
    },
    "experiences.html": {
        "title": "Malta experiences — boat trips, spa days, sunset cruises",
        "description": "Curated experiences across Malta and Gozo — Comino boat days, sunset sails, spa packages, gozo island tours. Pre-book and skip the queue.",
        "canonical": "https://sunspot.mt/experiences.html",
    },
    "visiting.html": {
        "title": "Visiting Malta? Plan your beach days — Sunspot",
        "description": "First-time in Malta? This is the local's guide to picking the right beach for the day, the wind, and the kids — by Sunspot.",
        "canonical": "https://sunspot.mt/visiting.html",
    },
    "living.html": {
        "title": "Living in Malta? Your beach club season pass — Sunspot",
        "description": "If you live in Malta, Sunspot is the easiest way to lock in your weekend sunbed at the busy lidos and pools. Save your favourites, repeat your bookings.",
        "canonical": "https://sunspot.mt/living.html",
    },
    "faq.html": {
        "title": "FAQ — Sunspot Malta beach club booking",
        "description": "How Sunspot works: payments, cancellations, no-shows, QR check-in, refunds, operator onboarding. Answers in 30 seconds.",
        "canonical": "https://sunspot.mt/faq.html",
    },
    "about.html": {
        "title": "About Sunspot — Malta's beach booking platform",
        "description": "Sunspot is the Malta-built marketplace for beach clubs, lidos and rooftop pools. 8% commission, no flat fees, real-time inventory, automatic operator payouts.",
        "canonical": "https://sunspot.mt/about.html",
    },
    "compare.html": {
        "title": "Compare Malta beach clubs side by side — Sunspot",
        "description": "Pick two or three beach clubs and compare them on price, location, vibe, amenities and live availability. Decide in under a minute.",
        "canonical": "https://sunspot.mt/compare.html",
        "robots_override": "index, follow",
    },
    "404.html": {
        "title": "Page not found — Sunspot Malta",
        "description": "We couldn't find that page. Browse 112 beach clubs across Malta, Gozo and Comino instead.",
        "canonical": "https://sunspot.mt/404.html",
    },
    "signin.html": {
        "title": "Sign in to Sunspot",
        "description": "Sign in to manage your beach club bookings, see your QR check-ins and save your favourite venues.",
        "canonical": "https://sunspot.mt/signin.html",
    },
    "account.html": {
        "title": "My account — Sunspot",
        "description": "Your Sunspot profile, payment methods and saved beach clubs.",
        "canonical": "https://sunspot.mt/account.html",
    },
    "bookings.html": {
        "title": "My beach club bookings — Sunspot",
        "description": "All your Sunspot reservations in one place — show the QR, cancel before 24 h, see venue status.",
        "canonical": "https://sunspot.mt/bookings.html",
    },
    "checkout.html": {
        "title": "Checkout — Sunspot",
        "description": "Secure checkout for your Sunspot beach club reservation. Free cancellation up to 24 h before.",
        "canonical": "https://sunspot.mt/checkout.html",
    },
    "confirmation.html": {
        "title": "Booking confirmed — Sunspot",
        "description": "Your Sunspot reservation is confirmed. Show the QR at the gate.",
        "canonical": "https://sunspot.mt/confirmation.html",
    },
    "booking.html": {
        "title": "Choose your spot — Sunspot Malta",
        "description": "Pick the exact sunbed, cabana or VIP gazebo on the live layout. Real-time availability across Malta's beach clubs.",
        "canonical": "https://sunspot.mt/",
    },
    "gifts.html": {
        "title": "Gift a beach day — Sunspot gift cards",
        "description": "Send a Sunspot gift card — redeemable at any of Malta's 112 beach clubs, lidos and rooftop pools. Email delivery in seconds.",
        "canonical": "https://sunspot.mt/gifts.html",
    },
    "app.html": {
        "title": "Get the Sunspot app",
        "description": "Install Sunspot to your home screen. Faster bookings, push notifications, offline access.",
        "canonical": "https://sunspot.mt/app.html",
    },
}


def has_tag(text, rx):
    return bool(re.search(rx, text, re.IGNORECASE))


def inject_before_head_close(text, html_to_add):
    return re.sub(r"(</head>)", html_to_add + "\n\\1", text, count=1, flags=re.IGNORECASE)


def replace_or_keep(text, rx, replacement):
    """Replace if rx matches, else return unchanged. Used for fixing existing tags."""
    if re.search(rx, text, re.IGNORECASE | re.DOTALL):
        return re.sub(rx, replacement, text, count=1, flags=re.IGNORECASE | re.DOTALL)
    return text


def fix(file_name, cfg):
    p = ROOT / file_name
    if not p.exists():
        print(f"  SKIP {file_name} (not found)")
        return
    text = p.read_text()
    orig = text
    added = []

    # 1. Title — replace if too short, leave if already a good one
    title_m = re.search(r"<title>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
    if not title_m:
        text = inject_before_head_close(text, f"<title>{cfg['title']}</title>")
        added.append("title")
    elif len(title_m.group(1).strip()) < 30:
        text = re.sub(r"<title>.*?</title>", f"<title>{cfg['title']}</title>", text, count=1, flags=re.IGNORECASE | re.DOTALL)
        added.append("title (too short)")

    # 2. Description — add or replace if missing/short
    desc_m = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)', text, re.IGNORECASE)
    if not desc_m:
        text = inject_before_head_close(text, f'<meta name="description" content="{cfg["description"]}">')
        added.append("description")
    elif len(desc_m.group(1)) < 60:
        text = replace_or_keep(text, r'(<meta[^>]*name=["\']description["\'][^>]*content=["\'])[^"\']*', r'\1' + cfg["description"])
        added.append("description (too short)")

    # 3. Canonical
    if not has_tag(text, r'<link[^>]*rel=["\']canonical["\']'):
        text = inject_before_head_close(text, f'<link rel="canonical" href="{cfg["canonical"]}">')
        added.append("canonical")
    elif file_name in ("guide.html", "club.html", "booking.html"):
        # These pages share https://sunspot.mt/ — keep, JS rewrites at runtime.
        # But also drop a static <link rel="canonical" id="canonical"> that JS
        # can update without a duplicate. Already present in these files.
        pass

    # 4. Open Graph (only inject missing ones)
    og_pairs = [
        ("og:title",       cfg["title"]),
        ("og:description", cfg["description"]),
        ("og:url",         cfg["canonical"]),
        ("og:type",        "website"),
        ("og:image",       cfg.get("og_image") or OG_DEFAULT_IMG),
        ("og:site_name",   "Sunspot"),
        ("og:locale",      "en_MT"),
    ]
    og_to_add = []
    for prop, content in og_pairs:
        if not has_tag(text, r'<meta[^>]*property=["\']' + re.escape(prop) + r'["\']'):
            og_to_add.append(f'<meta property="{prop}" content="{content}">')
    if og_to_add:
        text = inject_before_head_close(text, "\n".join(og_to_add))
        added.append(f"og ({len(og_to_add)})")

    # 5. Twitter
    tw_pairs = [
        ("twitter:card",        "summary_large_image"),
        ("twitter:title",       cfg["title"]),
        ("twitter:description", cfg["description"]),
        ("twitter:image",       cfg.get("og_image") or OG_DEFAULT_IMG),
    ]
    tw_to_add = []
    for name, content in tw_pairs:
        if not has_tag(text, r'<meta[^>]*name=["\']' + re.escape(name) + r'["\']'):
            tw_to_add.append(f'<meta name="{name}" content="{content}">')
    if tw_to_add:
        text = inject_before_head_close(text, "\n".join(tw_to_add))
        added.append(f"twitter ({len(tw_to_add)})")

    # 6. Robots override (used to un-noindex compare.html)
    if "robots_override" in cfg:
        if re.search(r'<meta[^>]*name=["\']robots["\']', text, re.IGNORECASE):
            text = re.sub(
                r'<meta[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*["\']',
                f'<meta name="robots" content="{cfg["robots_override"]}"',
                text, count=1, flags=re.IGNORECASE,
            )
        else:
            text = inject_before_head_close(text, f'<meta name="robots" content="{cfg["robots_override"]}">')
        added.append("robots override")

    if text != orig:
        p.write_text(text)
        print(f"  PATCHED {file_name}: " + ", ".join(added))


def main():
    print("Bulk SEO patching...")
    for f, cfg in PAGES.items():
        fix(f, cfg)
    print("\nDone. Re-run bin/seo_audit.py to verify.")


if __name__ == "__main__":
    main()
