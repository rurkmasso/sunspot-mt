#!/usr/bin/env python3
"""Inject ItemList + TouristTrip JSON-LD into experiences.html.

Reads experiences-data.js, extracts each tour, and writes a single
@graph schema block at the top of <head>:

  - CollectionPage  → the page itself
  - ItemList        → indexed list of all experiences
  - TouristTrip[]   → one per experience, with Offer + price

Idempotent — re-run any time experiences-data.js changes.
"""
from __future__ import annotations
import json, pathlib, re

ROOT   = pathlib.Path(__file__).resolve().parent.parent
ORIGIN = "https://sunspot.mt"
PAGE   = ROOT / "experiences.html"
MARK   = "<!-- ssbc:experiences-ld -->"
END    = "<!-- /ssbc:experiences-ld -->"

CATEGORY_LABELS = {
    "boat-tour": "Boat tour", "rib": "RIB / speedboat", "jetski": "Jetski",
    "kayak":     "Kayak / SUP", "diving": "Diving", "snorkel": "Snorkel tour",
    "sunset":    "Sunset cruise", "party": "Party boat",
    "parasail":  "Parasailing", "fishing": "Fishing",
    "culture":   "Culture tour", "transfer": "Transfer",
}

def parse_experiences() -> list[dict]:
    text = (ROOT / "experiences-data.js").read_text()
    blocks = re.split(r"\n\s*\{ id:", text)
    out = []
    for b in blocks[1:]:
        head = "{ id:" + b[: b.find("\n }")]
        def grab(pat, cast=str):
            m = re.search(pat, head)
            if not m: return None
            v = m.group(1)
            return cast(v) if cast is not str else v
        out.append({
            "id":         grab(r"id:\s*'([^']+)'"),
            "name":       grab(r"name:\s*'([^']+)'"),
            "cat":        grab(r"cat:\s*'([^']+)'"),
            "price":      grab(r"price:\s*(\d+)", int),
            "summary":    grab(r"summary:\s*'([^']+)'"),
            "duration_h": grab(r"duration_h:\s*(\d+)", int),
            "operator":   grab(r"operator:\s*'([^']+)'"),
            "max_pax":    grab(r"max_pax:\s*(\d+)", int),
            "hub":        grab(r"hub:\s*'([^']+)'"),
            "photo":      grab(r"photo:\s*'([^']+)'"),
        })
    return [e for e in out if e["id"] and e["name"] and e["price"] is not None]

def iso_duration(hours: int | None) -> str | None:
    if hours is None or hours <= 0: return None
    if hours >= 1: return f"PT{hours}H"
    return None

def build_graph(exps: list[dict]) -> dict:
    items = []
    trips = []
    for i, e in enumerate(exps, 1):
        url = f"{ORIGIN}/experiences.html?e={e['id']}"
        items.append({
            "@type": "ListItem",
            "position": i,
            "url": url,
            "name": e["name"],
        })
        trip = {
            "@type": "TouristTrip",
            "@id":   f"{ORIGIN}/experiences.html#{e['id']}",
            "name":  e["name"],
            "url":   url,
            "description": e.get("summary") or "",
            "touristType": "Mediterranean coast",
            "itinerary": {
                "@type": "Place",
                "name": e.get("hub") or "Malta",
                "address": { "@type": "PostalAddress", "addressCountry": "MT" },
            },
            "offers": {
                "@type": "Offer",
                "price": e["price"],
                "priceCurrency": "EUR",
                "url": url,
                "availability": "https://schema.org/InStock",
                "validFrom": "2026-05-01",
            },
        }
        dur = iso_duration(e.get("duration_h"))
        if dur:
            trip["subjectOf"] = { "@type": "Event", "duration": dur }
        if e.get("max_pax"):
            trip["maximumAttendeeCapacity"] = e["max_pax"]
        if e.get("photo"):
            trip["image"] = e["photo"]
        if e.get("operator"):
            trip["provider"] = { "@type": "Organization", "name": e["operator"] }
        if e.get("cat") and e["cat"] in CATEGORY_LABELS:
            trip["additionalType"] = CATEGORY_LABELS[e["cat"]]
        trips.append(trip)

    graph = [
        {
            "@type": "CollectionPage",
            "@id": f"{ORIGIN}/experiences.html#collection",
            "name": "Malta experiences — boat tours, jetski, kayak, sunset cruises",
            "description": "RIB tours to Comino, jetski safaris, sea-cave kayaks, sunset cruises, dive trips, party boats and Valletta walking tours.",
            "url": f"{ORIGIN}/experiences.html",
            "inLanguage": "en-MT",
            "isPartOf": { "@id": f"{ORIGIN}/#website" },
            "publisher": { "@id": f"{ORIGIN}/#organization" },
            "mainEntity": { "@id": f"{ORIGIN}/experiences.html#itemlist" },
        },
        {
            "@type": "ItemList",
            "@id": f"{ORIGIN}/experiences.html#itemlist",
            "name": "Sunspot experiences in Malta",
            "numberOfItems": len(items),
            "itemListElement": items,
        },
        *trips,
    ]
    return { "@context": "https://schema.org", "@graph": graph }

def patch_page(graph: dict) -> bool:
    src = PAGE.read_text(encoding="utf-8")
    block = (
        MARK + "\n"
        + '<script type="application/ld+json">\n'
        + json.dumps(graph, indent=1, ensure_ascii=False)
        + '\n</script>\n' + END
    )
    if MARK in src and END in src:
        new_src = re.sub(re.escape(MARK) + r".*?" + re.escape(END),
                         lambda _: block, src, count=1, flags=re.S)
    else:
        # insert just before </head>
        new_src = src.replace("</head>", block + "\n</head>", 1)
    if new_src != src:
        PAGE.write_text(new_src, encoding="utf-8")
        return True
    return False

def main():
    exps = parse_experiences()
    print(f"Parsed {len(exps)} experiences from experiences-data.js")
    graph = build_graph(exps)
    print(f"  CollectionPage + ItemList ({len(exps)}) + {len(exps)} TouristTrip items")
    if patch_page(graph):
        print("  experiences.html rewritten")
    else:
        print("  experiences.html unchanged")

if __name__ == "__main__":
    main()
