#!/usr/bin/env python3
"""Inject a build-time ItemList JSON-LD into index.html.

The current placeholder is a 12-item empty list filled by JS at runtime.
Search crawlers may not execute the JS — so the list reads as empty
when it gets indexed. This script generates real Schema.org ListItem
entries from clubs-data.js so Google sees the top venues immediately.

Strategy: shell out to Node, source the IIFE-wrapped data file in a
window shim, and dump the array as JSON. Then build the JSON-LD and
patch index.html in place.

Idempotent. Run any time the catalogue changes:

    python3 bin/inject_itemlist.py
"""
from __future__ import annotations
import json, pathlib, re, subprocess, sys

ROOT   = pathlib.Path(__file__).resolve().parent.parent
ORIGIN = "https://sunspot.mt"
TOP_N  = 12  # the number already declared in the placeholder

NODE_SCRIPT = r"""
  const window = {};
  require('fs').readFileSync(process.argv[1], 'utf8') &&
    eval(require('fs').readFileSync(process.argv[1], 'utf8'));
  const clubs = window.SUNSPOT_CLUBS || [];
  // Rank: bookable first, then by reviews (popularity proxy)
  clubs.sort((a, b) => {
    const ab = a.hasBookableSunbeds ? 1 : 0;
    const bb = b.hasBookableSunbeds ? 1 : 0;
    if (ab !== bb) return bb - ab;
    return (b.reviews || 0) - (a.reviews || 0);
  });
  process.stdout.write(JSON.stringify(clubs.slice(0, parseInt(process.argv[2], 10))));
"""

def load_clubs() -> list[dict]:
    out = subprocess.check_output(
        ["node", "-e", NODE_SCRIPT, str(ROOT / "clubs-data.js"), str(TOP_N)],
        cwd=ROOT, text=True,
    )
    return json.loads(out)

def build_itemlist(clubs: list[dict]) -> dict:
    items = []
    for i, c in enumerate(clubs, 1):
        item = {
            "@type": "ListItem",
            "position": i,
            "item": {
                "@type": "BeachResort" if c.get("category") != "rooftop" else "BarOrPub",
                "name": c["name"],
                "url": f"{ORIGIN}/club.html?club={c['id']}",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": c.get("location") or "",
                    "addressRegion": "Malta",
                    "addressCountry": "MT",
                },
            },
        }
        if c.get("rating") and c.get("reviews"):
            item["item"]["aggregateRating"] = {
                "@type": "AggregateRating",
                "ratingValue": c["rating"],
                "reviewCount": c["reviews"],
                "bestRating": 5,
                "worstRating": 1,
            }
        if c.get("photos") and isinstance(c["photos"], list) and c["photos"]:
            item["item"]["image"] = c["photos"][0]
        if c.get("summary"):
            item["item"]["description"] = c["summary"][:160]
        items.append(item)
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Beach clubs in Malta and Gozo",
        "numberOfItems": len(items),
        "itemListElement": items,
    }

def patch_index(itemlist: dict) -> bool:
    index = ROOT / "index.html"
    src = index.read_text(encoding="utf-8")
    new_block = (
        '<script type="application/ld+json" id="ld-itemlist">\n'
        + json.dumps(itemlist, indent=1, ensure_ascii=False)
        + '\n</script>'
    )
    pattern = re.compile(
        r'<script\s+type="application/ld\+json"\s+id="ld-itemlist">.*?</script>',
        re.S,
    )
    new_src, n = pattern.subn(lambda _: new_block, src, count=1)
    if n == 0:
        sys.stderr.write("could not find #ld-itemlist placeholder in index.html\n")
        return False
    if new_src != src:
        index.write_text(new_src, encoding="utf-8")
        return True
    return False

def main() -> None:
    print("Injecting ItemList JSON-LD into index.html")
    clubs = load_clubs()
    print(f"  loaded {len(clubs)} clubs from clubs-data.js")
    itemlist = build_itemlist(clubs)
    changed = patch_index(itemlist)
    print(f"  {'rewrote' if changed else 'no change to'} index.html (top {len(clubs)})")

if __name__ == "__main__":
    main()
