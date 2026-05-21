#!/usr/bin/env python3
"""Swap Wikimedia hotlinks for whichbeach.com.mt photos matched by location.

Wikimedia hotlinks work in browsers but (a) violate Wikimedia's terms,
(b) are rate-limit-fragile, (c) can be deleted any time. Whichbeach is
local Maltese beach photography we've already verified.

For each venue currently using only Wikimedia URLs, pick the best-fitting
whichbeach photo based on geography. Most pool clubs / rooftops near the
sea get the closest beach as their hero (e.g. a Sliema rooftop gets a
Fond Ghadir shot).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "clubs-data.js"

WB = "https://whichbeach.com.mt/wp-content/uploads/2022/01/"

# Venue → list of 3 whichbeach photos (matched by geography)
MAP = {
    "manta":                       [WB+"Fond-Ghadir-2560x1440-1.jpeg", WB+"Qui-si-sana-2560x1440-1.jpeg", WB+"Exiles-Bay-2560x1440-1-scaled-1.webp"],
    "twentytwo":                   [WB+"St.-Georges-Bay-2560x1440-1.jpg", WB+"Balluta-2560x1440-1.jpeg"],
    "mint-sky-bar":                [WB+"Buggiba-Front-2560x1440-1.jpeg", WB+"Qawra-Point-2560x1440-1.jpeg"],
    "the-embassy-rooftop":         [WB+"Rinella-2560x1440-1.jpeg"],  # closest harbour view we have
    "westin-pool-deck":            [WB+"St.-Georges-Bay-2560x1440-1.jpg", WB+"Balluta-2560x1440-1.jpeg"],
    "hilton-pool-deck":            [WB+"St.-Georges-Bay-2560x1440-1.jpg", WB+"Balluta-2560x1440-1.jpeg"],
    "trabuxu-rooftop":             [WB+"Rinella-2560x1440-1.jpeg"],
    "bridge-bar-valletta":         [WB+"Rinella-2560x1440-1.jpeg"],
    "solas-rooftop":               [WB+"Qawra-Point-2560x1440-1.jpeg", WB+"Buggiba-Front-2560x1440-1.jpeg"],
    "brittannia-cafe":             [WB+"Buggiba-Front-2560x1440-1.jpeg", WB+"Qawra-Point-2560x1440-1.jpeg"],
    "bonita-beach-club":           [WB+"Mellieha-Bay-2560x1440-1.jpeg"],
    "tortuga-bugibba":             [WB+"Buggiba-Front-2560x1440-1.jpeg"],
    "db-seabank":                  [WB+"Mellieha-Bay-2560x1440-1.jpeg"],
    "radisson-golden-sands":       [WB+"Golden-Bay-2560x1440-1.jpeg", WB+"Riviera-2560x1440-1.jpeg"],
    "westin-pool-cabanas":         [WB+"St.-Georges-Bay-2560x1440-1.jpg", WB+"Balluta-2560x1440-1.jpeg"],
    "corinthia-st-george":         [WB+"St.-Georges-Bay-2560x1440-1.jpg"],
    "cavalieri-pool":              [WB+"Balluta-2560x1440-1.jpeg", WB+"St.-Georges-Bay-2560x1440-1.jpg"],
    "meridien-balluta":            [WB+"Balluta-2560x1440-1.jpeg"],
    "tigne-lido":                  [WB+"Fond-Ghadir-2560x1440-1.jpeg", WB+"Qui-si-sana-2560x1440-1.jpeg"],
    "brittannia-rocks-lido":       [WB+"Buggiba-Front-2560x1440-1.jpeg"],
    "riviera-resort":              [WB+"Riviera-2560x1440-1.jpeg", WB+"Mellieha-Bay-2560x1440-1.jpeg"],
    "westin-beach":                [WB+"St.-Georges-Bay-2560x1440-1.jpg"],
    "ghajn-tuffieha-sunbeds":      [WB+"Gnejna-2560x1440-1.jpeg", WB+"Golden-Bay-2560x1440-1.jpeg"],
    "birzebbuga-beach-club":       [WB+"Kalanka-2560x1440-1.jpeg"],
    "birzebbuga-pretty":           [WB+"Kalanka-2560x1440-1.jpeg"],
    "ramla-beach-club":            [WB+"Ramla-il-Hamra-2560x1440-1.jpeg", WB+"San-Blas-2560x1440-1.jpeg"],
    "ramla-extension":             [WB+"Ramla-il-Hamra-2560x1440-1.jpeg", WB+"San-Blas-2560x1440-1.jpeg"],
    "ghar-id-dud-rocks":           [WB+"Fond-Ghadir-2560x1440-1.jpeg"],
    "independence-garden-rocks":   [WB+"Fond-Ghadir-2560x1440-1.jpeg"],
    "exiles-rocks":                [WB+"Exiles-Bay-2560x1440-1-scaled-1.webp"],
    "qui-si-sana-lido":            [WB+"Qui-si-sana-2560x1440-1.jpeg"],
    "famous-five-lido":            [WB+"Fond-Ghadir-2560x1440-1.jpeg"],
    "roy-lido":                    [WB+"Fond-Ghadir-2560x1440-1.jpeg"],
    "surfside-sliema":             [WB+"Fond-Ghadir-2560x1440-1.jpeg", WB+"Qui-si-sana-2560x1440-1.jpeg"],
    "marquee-pool":                [WB+"St.-Tomas-Bay-2560x1440-1.jpg"],
}


def main():
    text = DATA.read_text()
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(text))
    out = text
    n = 0
    for m in reversed(matches):  # reverse so offsets stay valid
        vid = m.group(1)
        new = MAP.get(vid)
        if not new:
            continue
        start = m.start()
        nxt = pat.search(out, m.end())
        end = nxt.start() if nxt else len(out)
        block = out[start:end]
        pm = re.search(r"(photos:\s*\[)(.*?)(\])", block, re.DOTALL)
        if not pm:
            continue
        # Keep existing non-wikimedia URLs, replace wikimedia with the new ones
        body = pm.group(2)
        existing_urls = re.findall(r"['\"]([^'\"]+)['\"]", body)
        wb_paths = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", body)
        keep = [u for u in existing_urls
                if u.startswith("http")
                and "wikimedia" not in u
                and "wikipedia" not in u
                and "picsum" not in u]
        keep += ["https://whichbeach.com.mt/wp-content/uploads/" + p for p in wb_paths]

        merged = []
        for u in keep + new:
            if u not in merged: merged.append(u)
        merged = merged[:3]
        if not merged:
            continue
        new_body = "\n" + ",\n".join(f"        '{u}'" for u in merged) + ",\n      "
        new_block = block[:pm.start(2)] + new_body + block[pm.end(2):]
        out = out[:start] + new_block + out[end:]
        n += 1
        print(f"  {vid} → {len(merged)} photos")

    DATA.write_text(out)
    print(f"\nUpdated {n} venues")


if __name__ == "__main__":
    main()
