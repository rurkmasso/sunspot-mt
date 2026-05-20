#!/usr/bin/env python3
"""Phase 4 — final 8 holdouts. Broader Commons queries + fallback to a curated
   Malta beach photo from whichbeach.com.mt that we know exists."""
import json, re, time, urllib.parse
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
CACHE_FILE = ROOT / "bin" / ".photo_cache.json"
UA = "SunspotPhotoBot/1.0 (https://sunspot.mt)"
TIMEOUT = 12

# Final attempt: very broad Commons searches + a known-good whichbeach fallback
# scoped by venue type so the fallback is at least geographically plausible.
FINAL = {
    "manta":                  {"q": ["Sliema seafront", "Sliema Malta beach"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Fond-Ghadir-2560x1440-1.jpeg"]},
    "surfside-sliema":        {"q": ["Sliema lido", "Fond Għadir"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Fond-Ghadir-2560x1440-1.jpeg",
                                      "https://whichbeach.com.mt/wp-content/uploads/2022/01/Exiles-Bay-2560x1440-1.jpeg"]},
    "radisson-golden-sands":  {"q": ["Golden Bay Mellieha", "Riviera Bay Malta"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Golden-Bay-2560x1440-1.jpeg",
                                      "https://whichbeach.com.mt/wp-content/uploads/2022/01/Riviera-2560x1440-1.jpeg"]},
    "marquee-pool":           {"q": ["Marsascala Malta", "Marsaskala"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/St-Thomas-Bay-2560x1440-1.jpeg",
                                      "https://whichbeach.com.mt/wp-content/uploads/2022/01/Kalanka-2560x1440-1.jpeg"]},
    "roy-lido":               {"q": ["Sliema lido", "Sliema swimming"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Exiles-Bay-2560x1440-1.jpeg",
                                      "https://whichbeach.com.mt/wp-content/uploads/2022/01/Fond-Ghadir-2560x1440-1.jpeg"]},
    "brittannia-rocks-lido":  {"q": ["St Paul's Bay Malta", "Qawra Malta"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Bugibba-Perched-Beach-2560x1440-1.jpeg"]},
    "riviera-resort":         {"q": ["Riviera Bay Malta", "Marfa Ridge"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Riviera-2560x1440-1.jpeg",
                                      "https://whichbeach.com.mt/wp-content/uploads/2022/01/Paradise-Bay-2560x1440-1.jpeg"]},
    "ramla-beach-club":       {"q": ["Ramla l-Hamra Gozo", "Ramla Bay Gozo beach"],
                               "fb": ["https://whichbeach.com.mt/wp-content/uploads/2022/01/Ramla-il-Hamra-2560x1440-1.jpeg",
                                      "https://whichbeach.com.mt/wp-content/uploads/2022/01/San-Blas-2560x1440-1.jpeg"]},
}


def load_cache():
    if CACHE_FILE.exists():
        try: return json.loads(CACHE_FILE.read_text())
        except: return {}
    return {}

def save_cache(c): CACHE_FILE.write_text(json.dumps(c, indent=2))

def commons(query):
    api = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": query + " filetype:bitmap", "gsrnamespace": "6",
        "gsrlimit": "10", "prop": "imageinfo", "iiprop": "url|size",
        "iiurlwidth": "1600",
    }
    try:
        r = requests.get(api, params=params, headers={"User-Agent": UA}, timeout=TIMEOUT)
        if r.status_code != 200: return []
        pages = (r.json().get("query") or {}).get("pages") or {}
        out = []
        for p in pages.values():
            ii = (p.get("imageinfo") or [{}])[0]
            url = ii.get("thumburl") or ii.get("url")
            w = ii.get("width", 0)
            if not url or (w and w < 800): continue
            if re.search(r"(logo|coat_of_arms|flag|map|locator|seal)", url, re.I): continue
            if re.search(r"\.(svg|gif|ico)(\?|$)", url, re.I): continue
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

def patch(text, repl):
    out = text
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(out))
    for m in reversed(matches):
        vid = m.group(1)
        new = repl.get(vid)
        if not new: continue
        start = m.start()
        nxt = pat.search(out, m.end())
        end = nxt.start() if nxt else len(out)
        block = out[start:end]
        pm = re.search(r"(photos:\s*\[)(.*?)(\])", block, re.DOTALL)
        if not pm: continue
        existing = re.findall(r"['\"]([^'\"]+)['\"]", pm.group(2))
        wb = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", pm.group(2))
        keep = [u for u in existing if u.startswith("http") and "picsum" not in u]
        keep += ["https://whichbeach.com.mt/wp-content/uploads/" + p for p in wb]
        merged = []
        for u in keep + new:
            if u not in merged: merged.append(u)
        merged = merged[:3]
        if not merged: continue
        body = "\n" + ",\n".join(f"        '{u}'" for u in merged) + ",\n      "
        nb = block[:pm.start(2)] + body + block[pm.end(2):]
        out = out[:start] + nb + out[end:]
    return out


def main():
    text = DATA_FILE.read_text()
    cache = load_cache()
    repl = {}
    for i, (vid, src) in enumerate(FINAL.items(), 1):
        ck = f"p4:{vid}"
        if ck in cache and cache[ck].get("photos"):
            repl[vid] = cache[ck]["photos"]
            print(f"  [{i}/{len(FINAL)}] {vid}  (cache, {len(cache[ck]['photos'])})")
            continue

        photos = []
        for q in src["q"]:
            for u in commons(q):
                if u not in photos and verify(u): photos.append(u)
                if len(photos) >= 3: break
            if len(photos) >= 3: break
            time.sleep(0.3)

        # Whichbeach fallback (always real Maltese beach photos)
        for u in src["fb"]:
            if len(photos) >= 3: break
            if u not in photos and verify(u): photos.append(u)

        cache[ck] = {"photos": photos, "source": "phase4"}
        save_cache(cache)
        if photos: repl[vid] = photos
        print(f"  [{i}/{len(FINAL)}] {vid}  → {len(photos)} photos")
        time.sleep(0.2)

    if repl:
        DATA_FILE.write_text(patch(text, repl))
        print(f"\nPatched {len(repl)} venues")


if __name__ == "__main__":
    main()
