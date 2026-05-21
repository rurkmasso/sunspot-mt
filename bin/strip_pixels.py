#!/usr/bin/env python3
"""Strip tracking pixels and parked-domain placeholders that got pulled in
from venue websites' og:image / hero scraping. Replace each affected venue
with a clean whichbeach fallback matched to its location.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "clubs-data.js"
WB = "https://whichbeach.com.mt/wp-content/uploads/2022/01/"

JUNK = ["facebook.com/tr", "px.ads.linkedin", "hugedomains", "/collect/?", "PageView=1"]

# Venues whose only photos were junk → replace with location-matched fallback
FALLBACK = {
    "hugos-terrace":               [WB+"St.-Georges-Bay-2560x1440-1.jpg", WB+"Balluta-2560x1440-1.jpeg"],
    "intercontinental-beach-club": [WB+"St.-Georges-Bay-2560x1440-1.jpg"],
    "ion-harbour-sky":             [WB+"Rinella-2560x1440-1.jpeg"],
}


def is_junk(u):
    return any(j in u for j in JUNK)


def main():
    text = DATA.read_text()
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(text))
    out = text
    fixed = 0
    for m in reversed(matches):
        vid = m.group(1)
        start = m.start()
        nxt = pat.search(out, m.end())
        end = nxt.start() if nxt else len(out)
        block = out[start:end]
        pm = re.search(r"(photos:\s*\[)(.*?)(\])", block, re.DOTALL)
        if not pm:
            continue
        body = pm.group(2)
        urls = re.findall(r"['\"]([^'\"]+)['\"]", body)
        if not any(is_junk(u) for u in urls):
            continue
        # Strip junk
        cleaned = [u for u in urls if not is_junk(u)]
        # Add fallback if list is now too short
        if vid in FALLBACK:
            for u in FALLBACK[vid]:
                if u not in cleaned: cleaned.append(u)
        cleaned = cleaned[:3]
        if not cleaned:
            continue
        new_body = "\n" + ",\n".join(f"        '{u}'" for u in cleaned) + ",\n      "
        new_block = block[:pm.start(2)] + new_body + block[pm.end(2):]
        out = out[:start] + new_block + out[end:]
        fixed += 1
        print(f"  {vid} → cleaned {len(urls) - len(cleaned)} junk URLs, now {len(cleaned)} photos")
    DATA.write_text(out)
    print(f"\nFixed {fixed} venues")


if __name__ == "__main__":
    main()
