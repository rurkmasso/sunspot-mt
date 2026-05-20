#!/usr/bin/env python3
"""
Sunspot photo fetcher — Phase 3.

For the venues still on picsum, fall back to Wikimedia Commons. Commons hosts
freely-licensed Malta photography organized by place category. For each
holdout venue we search Commons by location + venue type and pick the best
matches.
"""
import json
import re
import time
import urllib.parse
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
CACHE_FILE = ROOT / "bin" / ".photo_cache.json"

UA = "SunspotPhotoBot/1.0 (https://sunspot.mt; markrusso8@gmail.com)"
TIMEOUT = 12

# Venue → Commons search query (precise → broad). We try in order and take
# the first 3 photos that aren't logos/SVGs.
COMMONS_QUERIES = {
    "manta":                       ["Manta Beach Club Malta", "Sliema beach club"],
    "twentytwo":                   ["Portomaso", "St Julian's Malta"],
    "mint-sky-bar":                ["DoubleTree Hilton Qawra", "Qawra Malta"],
    "the-embassy-rooftop":         ["Valletta rooftop", "Embassy Valletta"],
    "westin-pool-deck":            ["Westin Dragonara Malta", "Dragonara Point"],
    "hilton-pool-deck":            ["Portomaso Malta", "Hilton Malta Portomaso"],
    "trabuxu-rooftop":             ["Republic Street Valletta", "Valletta"],
    "solas-rooftop":               ["Qawra Malta", "Salina Bay"],
    "bonita-beach-club":           ["Mellieha Bay", "Mellieha"],
    "tortuga-bugibba":             ["Bugibba", "St Paul's Bay Malta"],
    "surfside-sliema":             ["Sliema seafront", "Sliema lido"],
    "db-seabank":                  ["Mellieha Bay", "St Paul's Bay"],
    "radisson-golden-sands":       ["Golden Bay Malta", "Riviera Bay Malta"],
    "westin-pool-cabanas":         ["Dragonara Point", "St Julian's Malta"],
    "corinthia-st-george":         ["St Julian's Malta", "St George's Bay"],
    "cavalieri-pool":              ["Spinola Bay", "St Julian's Malta"],
    "meridien-balluta":            ["Balluta Bay", "St Julian's Malta"],
    "marquee-pool":                ["Marsascala", "Malta resort"],
    "tigne-lido":                  ["Tigné Point", "Sliema"],
    "roy-lido":                    ["Sliema lido", "Fond Għadir"],
    "brittannia-rocks-lido":      ["Bugibba", "St Paul's Bay Malta"],
    "riviera-resort":              ["Marfa Ridge", "Riviera Bay Malta"],
    "westin-beach":                ["Dragonara Point", "St Julian's Malta"],
    "ramla-beach-club":            ["Ramla Bay Gozo", "Ramla l-Ħamra"],
    "ghajn-tuffieha-sunbeds":      ["Għajn Tuffieħa", "Riviera Bay"],
    "birzebbuga-beach-club":       ["Pretty Bay Birżebbuġa", "Birżebbuġa"],
    "birzebbuga-pretty":           ["Pretty Bay Birżebbuġa", "Birżebbuġa"],
    "ramla-extension":             ["Ramla Bay Gozo", "Ramla l-Ħamra"],
}


def load_cache():
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except Exception:
            return {}
    return {}


def save_cache(c):
    CACHE_FILE.write_text(json.dumps(c, indent=2))


def commons_search(query):
    """Return list of image URLs from Commons matching the query."""
    api = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query + " filetype:bitmap",
        "gsrnamespace": "6",  # File:
        "gsrlimit": "10",
        "prop": "imageinfo",
        "iiprop": "url|size",
        "iiurlwidth": "1600",
    }
    try:
        r = requests.get(api, params=params, headers={"User-Agent": UA}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        data = r.json()
        pages = (data.get("query") or {}).get("pages") or {}
        out = []
        for p in pages.values():
            ii = (p.get("imageinfo") or [{}])[0]
            url = ii.get("thumburl") or ii.get("url")
            width = ii.get("width", 0)
            if not url:
                continue
            # Skip tiny images, logos, SVGs, maps
            if width and width < 800:
                continue
            if re.search(r"(logo|coat_of_arms|flag|map|locator|svg|seal)", url, re.IGNORECASE):
                continue
            if re.search(r"\.(svg|gif|ico)(\?|$)", url, re.IGNORECASE):
                continue
            out.append(url)
        return out
    except requests.RequestException:
        return []


def verify(url):
    try:
        r = requests.head(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200:
            r = requests.get(url, headers={"User-Agent": UA, "Range": "bytes=0-1024"}, timeout=TIMEOUT, stream=True)
        return "image" in r.headers.get("content-type", "").lower()
    except requests.RequestException:
        return False


def patch(text, replacements):
    out = text
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(out))
    for m in reversed(matches):
        vid = m.group(1)
        new = replacements.get(vid)
        if not new:
            continue
        start = m.start()
        nxt = pat.search(out, m.end())
        end = nxt.start() if nxt else len(out)
        block = out[start:end]
        pm = re.search(r"(photos:\s*\[)(.*?)(\])", block, re.DOTALL)
        if not pm:
            continue
        existing = re.findall(r"['\"]([^'\"]+)['\"]", pm.group(2))
        wb_paths = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", pm.group(2))
        keep = [u for u in existing if u.startswith("http") and "picsum" not in u]
        keep += ["https://whichbeach.com.mt/wp-content/uploads/" + p for p in wb_paths]
        merged = []
        for u in keep + new:
            if u not in merged:
                merged.append(u)
        merged = merged[:3]
        if not merged:
            continue
        body = "\n" + ",\n".join(f"        '{u}'" for u in merged) + ",\n      "
        new_block = block[:pm.start(2)] + body + block[pm.end(2):]
        out = out[:start] + new_block + out[end:]
    return out


def main():
    text = DATA_FILE.read_text()
    cache = load_cache()
    replacements = {}
    found_count = 0
    total = len(COMMONS_QUERIES)

    for i, (vid, queries) in enumerate(COMMONS_QUERIES.items(), 1):
        ck = f"p3:{vid}"
        if ck in cache and cache[ck].get("photos"):
            replacements[vid] = cache[ck]["photos"]
            found_count += 1
            print(f"  [{i:2d}/{total}] {vid}  (cache, {len(cache[ck]['photos'])} photos)")
            continue

        photos = []
        used_q = None
        for q in queries:
            urls = commons_search(q)
            for u in urls:
                if u in photos:
                    continue
                if verify(u):
                    photos.append(u)
                if len(photos) >= 3:
                    break
            if photos:
                used_q = q
                break
            time.sleep(0.3)

        cache[ck] = {"photos": photos, "source": f"commons:{used_q}" if used_q else "commons:none"}
        save_cache(cache)
        if photos:
            replacements[vid] = photos
            found_count += 1
        print(f"  [{i:2d}/{total}] {vid}  → {len(photos)} from \"{used_q or '(no results)'}\"")
        time.sleep(0.2)

    if replacements:
        new_text = patch(text, replacements)
        DATA_FILE.write_text(new_text)
        print(f"\nPatched {len(replacements)} venues")
    print(f"Phase 3 results: {found_count}/{total} got Commons photos")


if __name__ == "__main__":
    main()
