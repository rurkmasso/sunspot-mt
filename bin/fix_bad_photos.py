#!/usr/bin/env python3
"""
Replace the 13 likely-wrong photos flagged by qa_photos.py with curated
fallbacks that are real photos of the right location.

Each replacement is hand-picked from whichbeach.com.mt (real Maltese
beach photography) and matches the venue's geography:
  - Sliema lidos → Exiles / Fond Ghadir / Sliema Pitch / Tigne Point
  - Marquee (Marsascala) → St Thomas Bay / Kalanka
  - Birzebbuga → Pretty Bay / Kalanka
  - Noma's "sign" file is actually fine (false positive on filename)
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "clubs-data.js"

WB = "https://whichbeach.com.mt/wp-content/uploads/"

# (bad URL substring) → (replacement URL). Substring match so any thumb-size
# variant of the same Wikipedia photo is caught.
BAD_TO_GOOD = {
    "Sliema_montage": [
        WB + "2022/01/Exiles-Bay-2560x1440-1.jpeg",
        WB + "2022/01/Fond-Ghadir-2560x1440-1.jpeg",
        WB + "2022/01/Sliema-Pitch-2560x1440-1.jpeg",
    ],
    "Marsascala_Church": [
        WB + "2022/01/St-Thomas-Bay-2560x1440-1.jpeg",
        WB + "2022/01/Kalanka-2560x1440-1.jpeg",
    ],
    "MarsascalaMalta": [
        WB + "2022/01/St-Thomas-Bay-2560x1440-1.jpeg",
    ],
    "Birzebbuga_": [
        WB + "2022/01/Kalanka-2560x1440-1.jpeg",
        WB + "2022/01/Pretty-Bay-2560x1440-1.jpeg",
    ],
    "Bahia_de_Ramla": [
        WB + "2022/01/Ramla-il-Hamra-2560x1440-1.jpeg",
    ],
    "Edward_Lear": [
        WB + "2022/01/Fond-Ghadir-2560x1440-1.jpeg",
    ],
}

# Rotating index so multiple bad photos in the same venue get different
# replacements (avoids three identical fallback images on one card).
ROTATE = {}


def replace_for(bad_url):
    for k, candidates in BAD_TO_GOOD.items():
        if k in bad_url:
            i = ROTATE.get(k, 0)
            ROTATE[k] = i + 1
            return candidates[i % len(candidates)]
    return None


def main():
    text = DATA.read_text()
    pat = re.compile(r"'(https?://[^']+)'")
    n_replaced = 0
    seen_urls = []
    def sub(m):
        nonlocal n_replaced
        u = m.group(1)
        new = replace_for(u)
        if new and new != u:
            n_replaced += 1
            seen_urls.append((u[:80], new[:80]))
            return "'" + new + "'"
        return m.group(0)
    new_text = pat.sub(sub, text)
    DATA.write_text(new_text)
    print(f"Replaced {n_replaced} bad photo URLs")
    for old, new in seen_urls:
        print(f"  - {old}")
        print(f"    → {new}\n")


if __name__ == "__main__":
    main()
