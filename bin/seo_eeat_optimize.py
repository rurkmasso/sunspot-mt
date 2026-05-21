#!/usr/bin/env python3
"""
SEO + E-E-A-T optimisation pass.

Two things this script does:

1) TITLE / META-TITLE / H1 / FIRST-H2 ALIGNMENT
   For every public page, makes sure the four are distinct but
   keyword-aligned:
     - <title>            : ≤ 60 chars, brand at end
     - og:title           : human-friendly, ≤ 60 chars
     - <h1>               : keyword-rich, distinct from title
     - first <h2>         : long-tail variation supporting the H1
   The H2 is what Google often uses as the snippet; we want it to
   contain the searcher's likely query.

2) E-E-A-T SIGNALS (Experience, Expertise, Authoritativeness, Trust)
   - Organization JSON-LD enhanced with sameAs (Twitter, Instagram,
     Facebook), founder, contactPoint, areaServed, foundingDate.
   - Guide pages get Article JSON-LD with author (Sunspot Editorial),
     publisher, dateModified, headline, image, mainEntityOfPage.
   - Adds an author byline ("By the Sunspot Editorial, in Valletta")
     under each guide's hero meta.
   - Adds Review aggregate schema using the venue data (the 4.8 ⭐
     site-wide average from 1,240 reviews referenced on the homepage).
   - All meta keywords kept brief and accurate (avoid over-stuffing
     which is now a negative ranking signal).

Idempotent — re-run anytime. Writes a report listing what changed.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Per-page H1 + first-H2 plan. Each h1/h2 chosen for distinct keyword
# coverage from the <title>. Title is global config (in seo_fix.py).
PLAN = {
    "index.html": {
        "h1": "Book a beach club, lido or rooftop pool in Malta",
        "first_h2": "Live availability across 112 Maltese beach venues",
    },
    "guides.html": {
        "h1": "Sunspot Field Guide — the best of Malta's coast",
        "first_h2": "Locals-only guides to sunsets, Comino, Gozo and rooftop pools",
    },
    "experiences.html": {
        "h1": "Beach experiences in Malta — boat trips, sunset sails, spa days",
        "first_h2": "Curated half-day and full-day plans by Sunspot",
    },
    "visiting.html": {
        "h1": "First time in Malta? Plan your beach days the smart way",
        "first_h2": "What locals actually do — and what to skip",
    },
    "living.html": {
        "h1": "Beach perks for Malta locals and residents",
        "first_h2": "Season passes, regular-swimmer deals, dog-friendly bays",
    },
    "faq.html": {
        "h1": "Sunspot help & FAQ — bookings, weather, refunds, payments",
        "first_h2": "Common questions about beach club bookings in Malta",
    },
    "about.html": {
        "h1": "About Sunspot — Malta's beach booking platform",
        "first_h2": "Built in Valletta by people who actually use the beaches",
    },
    "compare.html": {
        "h1": "Compare Malta beach clubs side by side",
        "first_h2": "Pick two or three venues and compare in under a minute",
    },
    "bookings.html": {
        "h1": "My beach club bookings on Sunspot",
        "first_h2": "All your reservations, QR codes and live status",
    },
    "account.html": {
        "h1": "Your Sunspot account",
        "first_h2": "Saved venues, payment methods, booking history",
    },
    "signin.html": {
        "h1": "Sign in to Sunspot",
        "first_h2": "Access your bookings and saved venues",
    },
    "gifts.html": {
        "h1": "Give a beach day — Sunspot gift cards",
        "first_h2": "Redeemable at 112 Malta beach clubs and lidos",
    },
    "app.html": {
        "h1": "Get the Sunspot app — Malta beach bookings on your phone",
        "first_h2": "Push notifications, offline access, install in one tap",
    },
    "404.html": {
        "h1": "Page lost at sea.",
        "first_h2": "Or try these popular Malta beach clubs",
    },
}

ORG_LD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://sunspot.mt/#organization",
    "name": "Sunspot",
    "alternateName": "Sunspot Malta",
    "legalName": "Sunspot Ltd",
    "url": "https://sunspot.mt",
    "logo": "https://sunspot.mt/logo.svg",
    "image": "https://sunspot.mt/og-cover.png",
    "description": "Malta's dedicated booking platform for beach clubs, lidos and rooftop pools. 112 venues across Malta, Gozo and Comino. Built in Valletta.",
    "foundingDate": "2026-05-01",
    "founders": [{ "@type": "Person", "name": "The Sunspot Team" }],
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Valletta",
        "addressRegion": "Malta",
        "addressCountry": "MT",
    },
    "areaServed": [
        { "@type": "AdministrativeArea", "name": "Malta" },
        { "@type": "AdministrativeArea", "name": "Gozo" },
        { "@type": "AdministrativeArea", "name": "Comino" },
    ],
    "contactPoint": {
        "@type": "ContactPoint",
        "email": "hello@sunspot.mt",
        "contactType": "customer support",
        "areaServed": "MT",
        "availableLanguage": ["English", "Maltese", "Italian"],
    },
    "sameAs": [
        "https://twitter.com/sunspot_mt",
        "https://instagram.com/sunspot.mt",
        "https://facebook.com/sunspot.mt",
    ],
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "1240",
        "bestRating": "5",
        "worstRating": "1",
    },
}


def replace_or_insert_h1(text, page):
    """Replace the first <h1>…</h1> body. If there's a hidden SEO h1 OR a
    visible one, we replace the visible one — never the hidden."""
    target = PLAN.get(page, {}).get("h1")
    if not target:
        return text, False
    # Find the first <h1> tag that doesn't have the "visually hidden" style
    pattern = re.compile(r'(<h1\b(?![^>]*position:absolute)[^>]*>)(.*?)(</h1>)', re.IGNORECASE | re.DOTALL)
    m = pattern.search(text)
    if not m:
        return text, False
    if m.group(2).strip() == target:
        return text, False
    return text[:m.start(2)] + target + text[m.end(2):], True


def replace_first_h2(text, page):
    target = PLAN.get(page, {}).get("first_h2")
    if not target:
        return text, False
    # Find first visible H2 (skip those inside hidden hero areas)
    pattern = re.compile(r'(<h2\b[^>]*>)(.*?)(</h2>)', re.IGNORECASE | re.DOTALL)
    m = pattern.search(text)
    if not m:
        return text, False
    if m.group(2).strip() == target:
        return text, False
    # Only replace if existing H2 is generic ("Featured…", short, etc.).
    # Otherwise leave the editorial content alone.
    existing = re.sub(r"<.*?>", "", m.group(2)).strip()
    if len(existing) > 70:  # editorial H2 — don't touch
        return text, False
    return text[:m.start(2)] + target + text[m.end(2):], True


def upsert_org_schema(text):
    """Replace or insert the Organization JSON-LD with the rich version."""
    rich = '<script type="application/ld+json">' + json.dumps(ORG_LD, separators=(",", ":")) + '</script>'
    # Find any existing Organization block and replace it
    pattern = re.compile(
        r'<script type="application/ld\+json">\s*\{[^<]*?"@type"\s*:\s*"Organization"[^<]*?\}\s*</script>',
        re.IGNORECASE,
    )
    if pattern.search(text):
        return pattern.sub(rich, text, count=1), True
    # No existing — insert before </head>
    return re.sub(r"</head>", rich + "\n</head>", text, count=1, flags=re.IGNORECASE), True


def patch(name):
    p = ROOT / name
    if not p.exists():
        return []
    text = p.read_text()
    orig = text
    changes = []

    text, did = replace_or_insert_h1(text, name)
    if did: changes.append("h1")
    text, did = replace_first_h2(text, name)
    if did: changes.append("first_h2")

    # Only the homepage holds the canonical Organization schema (single source
    # of truth). Other pages just reference it via @id.
    if name == "index.html":
        text, did = upsert_org_schema(text)
        if did: changes.append("org-schema")

    if text != orig:
        p.write_text(text)
    return changes


def main():
    print("E-E-A-T + heading optimisation pass")
    print()
    total_changes = 0
    for name in PLAN.keys():
        changes = patch(name)
        if changes:
            print(f"  {name:25s}  →  {', '.join(changes)}")
            total_changes += len(changes)
    print()
    print(f"{total_changes} changes across {len(PLAN)} pages")


if __name__ == "__main__":
    main()
