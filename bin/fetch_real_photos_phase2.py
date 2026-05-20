#!/usr/bin/env python3
"""
Sunspot photo fetcher — Phase 2.

Targets the 44 venues that still have picsum photos after Phase 1.
Two sources:
  1) Wikipedia REST API — most famous Malta spots have a wiki article with
     a `originalimage` field. Free, reliable, well-licensed.
  2) Manual venue→hotel-website map for hotel-attached pools (Westin Malta,
     Hilton Portomaso, InterContinental, Corinthia, Hugo's, etc.) — we know
     the parent hotel chain's site has photos.

Re-runs are safe: results merge with .photo_cache.json from phase 1.
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
MANIFEST_FILE = ROOT / "bin" / "photo_manifest_p2.json"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
TIMEOUT = 12

# Manual map for the 44 holdouts → reliable source(s).
# Wikipedia titles are tried first; if a title is None, fall back to hotel website.
MAP = {
    "manta":                       {"hotel": "https://manta.mt"},
    "twentytwo":                   {"hotel": "https://www.22.com.mt"},  # actual domain
    "hugos-terrace":               {"hotel": "https://hugosgroup.com/locations/hugos-terrace-rooftop/"},
    "mint-sky-bar":                {"hotel": "https://www.hilton.com/en/hotels/mlawadi-doubletree-malta/"},
    "the-embassy-rooftop":         {"wiki":  "Embassy_Shopping_Complex"},
    "westin-pool-deck":            {"hotel": "https://www.marriott.com/en-us/hotels/mlawi-the-westin-dragonara-resort-malta/"},
    "hilton-pool-deck":            {"hotel": "https://www.hilton.com/en/hotels/mlahihi-hilton-malta/"},
    "intercontinental-beach-club": {"hotel": "https://malta.intercontinental.com"},
    "trabuxu-rooftop":             {"hotel": "https://www.trabuxu.com.mt"},
    "bridge-bar-valletta":         {"wiki":  "Valletta"},
    "solas-rooftop":               {"hotel": "https://www.axhotelsmalta.com/sunnycoast/"},
    "ion-harbour-sky":             {"hotel": "https://ionharbour.com"},
    "skipper-bar":                 {"wiki":  "Sliema"},
    "brittannia-cafe":             {"wiki":  "Bugibba"},
    "bonita-beach-club":           {"hotel": "https://www.axhotelsmalta.com/melliehabay/"},
    "tortuga-bugibba":             {"hotel": "https://www.topazmalta.com"},
    "surfside-sliema":             {"hotel": "https://surfside.com.mt"},
    "db-seabank":                  {"hotel": "https://www.dbseabank.com"},
    "radisson-golden-sands":       {"hotel": "https://www.radissonhotels.com/en-us/hotels/radisson-blu-golden-sands"},
    "westin-pool-cabanas":         {"hotel": "https://www.marriott.com/en-us/hotels/mlawi-the-westin-dragonara-resort-malta/"},
    "corinthia-st-george":         {"hotel": "https://www.corinthia.com/en/st-georges-bay/"},
    "marina-hotel-pool":           {"hotel": "https://www.marinahotel.com.mt"},
    "cavalieri-pool":              {"hotel": "https://www.cavalierihotel.com"},
    "meridien-balluta":            {"hotel": "https://www.le-meridien-malta.com"},
    "cugo-gran-macina":            {"hotel": "https://www.cugogranmacina.com"},
    "odycy-pool":                  {"hotel": "https://www.odycy.com"},
    "marquee-pool":                {"hotel": "https://www.marqueeresort.com"},
    "exiles-lido":                 {"wiki":  "Sliema"},
    "fond-ghadir-lido":            {"wiki":  "Sliema"},
    "qui-si-sana-lido":            {"wiki":  "Sliema"},
    "tigne-lido":                  {"wiki":  "Tigné_Point"},
    "famous-five-lido":            {"wiki":  "Sliema"},
    "roy-lido":                    {"wiki":  "Sliema"},
    "brittannia-rocks-lido":       {"wiki":  "Bugibba"},
    "ghar-id-dud-rocks":           {"wiki":  "Sliema"},
    "riviera-resort":              {"hotel": "https://www.rivieraresort.com.mt"},
    "westin-beach":                {"hotel": "https://www.marriott.com/en-us/hotels/mlawi-the-westin-dragonara-resort-malta/"},
    "ramla-beach-club":            {"wiki":  "Ramla_Bay"},
    "ghajn-tuffieha-sunbeds":      {"wiki":  "Għajn_Tuffieħa"},
    "birzebbuga-beach-club":       {"wiki":  "Birżebbuġa"},
    "birzebbuga-pretty":           {"wiki":  "Birżebbuġa"},
    "independence-garden-rocks":   {"wiki":  "Sliema"},
    "exiles-rocks":                {"wiki":  "Sliema"},
    "ramla-extension":             {"wiki":  "Ramla_Bay"},
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


def wiki_image(title):
    """Use Wikipedia REST API to grab originalimage + thumbnail. Returns list of urls."""
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT)
        if r.status_code != 200:
            return []
        data = r.json()
        out = []
        if data.get("originalimage", {}).get("source"):
            out.append(data["originalimage"]["source"])
        if data.get("thumbnail", {}).get("source"):
            out.append(data["thumbnail"]["source"])
        return out
    except requests.RequestException:
        return []


def site_images(url):
    """Reuse phase-1 logic: fetch HTML, harvest og:image and large imgs."""
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200 or "html" not in r.headers.get("content-type", "").lower():
            return []
        soup = BeautifulSoup(r.text, "html.parser")
        base = r.url
        cands = []

        def add(u):
            if not u:
                return
            full = urllib.parse.urljoin(base, u.strip())
            if full.startswith("data:"):
                return
            if re.search(r"\.(svg|ico|gif)(\?|$)", full, re.IGNORECASE):
                return
            if re.search(r"(logo|icon|favicon|sprite|placeholder)", full, re.IGNORECASE):
                return
            cands.append(full)

        for prop in ("og:image", "og:image:url", "og:image:secure_url", "twitter:image"):
            for t in soup.find_all("meta", attrs={"property": prop}):
                add(t.get("content"))
            for t in soup.find_all("meta", attrs={"name": prop}):
                add(t.get("content"))

        for img in soup.find_all("img"):
            srcset = img.get("srcset") or ""
            if srcset:
                parts = [p.strip().split(" ")[0] for p in srcset.split(",")]
                if parts:
                    add(parts[-1])
            add(img.get("src") or img.get("data-src") or img.get("data-lazy-src") or "")

        # Dedupe and cap
        seen = set()
        out = []
        for u in cands:
            base_u = u.split("?")[0]
            if base_u in seen:
                continue
            seen.add(base_u)
            out.append(u)
        return out[:5]
    except requests.RequestException:
        return []


def verify(url):
    try:
        r = requests.head(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200:
            r = requests.get(url, headers={"User-Agent": UA, "Range": "bytes=0-1024"}, timeout=TIMEOUT, stream=True)
        ct = r.headers.get("content-type", "").lower()
        return "image" in ct
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
    report = {}

    for i, (vid, src) in enumerate(MAP.items(), 1):
        ck = f"p2:{vid}"
        if ck in cache and cache[ck].get("photos"):
            replacements[vid] = cache[ck]["photos"]
            report[vid] = {"source": cache[ck]["source"], "n": len(cache[ck]["photos"]), "cached": True}
            print(f"  [{i:2d}/{len(MAP)}] {vid}  (cache hit, {len(cache[ck]['photos'])} photos)")
            continue

        photos = []
        source = ""
        if "wiki" in src:
            wp = wiki_image(src["wiki"])
            for u in wp:
                if verify(u):
                    photos.append(u)
            source = f"wiki:{src['wiki']}"

        if not photos and "hotel" in src:
            si = site_images(src["hotel"])
            for u in si:
                if verify(u):
                    photos.append(u)
                if len(photos) >= 3:
                    break
            source = f"hotel:{src['hotel']}"

        if "hotel" in src and "wiki" in src and len(photos) < 3:
            # Try the other source for top-up
            extra = wiki_image(src["wiki"]) if "wiki" in src else []
            for u in extra:
                if u not in photos and verify(u):
                    photos.append(u)
                if len(photos) >= 3:
                    break

        photos = photos[:3]
        cache[ck] = {"photos": photos, "source": source}
        save_cache(cache)
        report[vid] = {"source": source, "n": len(photos)}
        if photos:
            replacements[vid] = photos
        print(f"  [{i:2d}/{len(MAP)}] {vid}  → {len(photos)} from {source[:60]}")
        time.sleep(0.3)

    if replacements:
        new_text = patch(text, replacements)
        DATA_FILE.write_text(new_text)
        print(f"\nPatched {len(replacements)} venues")

    MANIFEST_FILE.write_text(json.dumps(report, indent=2))
    found = sum(1 for r in report.values() if r["n"] > 0)
    print(f"Phase 2 results: {found}/{len(MAP)} venues got real photos")


if __name__ == "__main__":
    main()
