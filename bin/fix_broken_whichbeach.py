#!/usr/bin/env python3
"""Replace the 4 actually-broken whichbeach URLs (verified via HEAD 404)
with URLs that the scraped sitemap confirmed exist."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "clubs-data.js"

# (broken URL) → (working URL).
# Working URLs verified by scraping whichbeach.com.mt/beach-sitemap.xml.
FIX = {
    "https://whichbeach.com.mt/wp-content/uploads/2022/01/Exiles-Bay-2560x1440-1.jpeg":
        "https://whichbeach.com.mt/wp-content/uploads/2022/01/Exiles-Bay-2560x1440-1-scaled-1.webp",
    "https://whichbeach.com.mt/wp-content/uploads/2022/01/St-Thomas-Bay-2560x1440-1.jpeg":
        "https://whichbeach.com.mt/wp-content/uploads/2022/01/St.-Tomas-Bay-2560x1440-1.jpg",
    "https://whichbeach.com.mt/wp-content/uploads/2022/01/Sliema-Pitch-2560x1440-1.jpeg":
        "https://whichbeach.com.mt/wp-content/uploads/2022/01/Fond-Ghadir-2560x1440-1.jpeg",
    "https://whichbeach.com.mt/wp-content/uploads/2022/01/Pretty-Bay-2560x1440-1.jpeg":
        "https://whichbeach.com.mt/wp-content/uploads/2022/01/Kalanka-2560x1440-1.jpeg",
}


def main():
    text = DATA.read_text()
    n = 0
    for bad, good in FIX.items():
        c = text.count(bad)
        if c:
            text = text.replace(bad, good)
            n += c
            print(f"  replaced {c}× {bad.rsplit('/', 1)[-1]}")
    DATA.write_text(text)
    print(f"\nReplaced {n} URLs total")


if __name__ == "__main__":
    main()
