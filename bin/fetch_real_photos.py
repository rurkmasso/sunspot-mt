#!/usr/bin/env python3
"""
Sunspot — replace placeholder photos with real ones from each venue's website.

Strategy:
  1. Parse clubs-data.js, extract each venue's id, name, website, current photos.
  2. For each venue with a website, fetch it and harvest:
       - og:image / twitter:image
       - large <img> elements (hero candidates)
       - background images on hero/banner divs
  3. Keep only http(s) image URLs that resolve to image/* content-type.
  4. Patch clubs-data.js — replace ANY picsum.photos URL with up to 3 real
     ones we found. Leave whichbeach.com.mt URLs alone (already real).
  5. Write a manifest report so the user sees what got verified vs not.

This script is idempotent — re-run safely. It writes a cache so subsequent
runs don't re-hit sites.
"""

import json
import re
import sys
import time
import urllib.parse
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
CACHE_FILE = ROOT / "bin" / ".photo_cache.json"
MANIFEST_FILE = ROOT / "bin" / "photo_manifest.json"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
TIMEOUT = 10
MIN_IMG_BYTES = 8000  # skip tiny logos/icons


def load_cache():
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except Exception:
            return {}
    return {}


def save_cache(cache):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2))


def extract_venues(text):
    """
    Parse the JS file. Each venue is an object literal containing
    id, name, website, photos. We rely on simple regex — the file is
    machine-formatted so this is reliable.
    """
    # Split on the venue boundary: line starting with " id: '..."
    # For each venue block find website and photos
    venues = []
    # Find every occurrence of `id: '...'` and capture a window of text around it.
    pattern = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]", re.IGNORECASE)
    matches = list(pattern.finditer(text))
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]

        name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", block)
        website_match = re.search(r"website:\s*['\"]([^'\"]*)['\"]", block)
        ig_match = re.search(r"instagram:\s*['\"]([^'\"]*)['\"]", block)
        photos_match = re.search(r"photos:\s*\[(.*?)\]", block, re.DOTALL)

        photos = []
        if photos_match:
            photos = re.findall(r"['\"]([^'\"]+)['\"]", photos_match.group(1))
            # Skip the WB+ pattern (template variable, not a literal URL)
            photos = [p for p in photos if p.startswith("http")]
            # Also handle the WB + 'path' pattern by reading the raw block
            wb_paths = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", photos_match.group(1))
            for p in wb_paths:
                photos.append("https://whichbeach.com.mt/wp-content/uploads/" + p)

        venues.append({
            "id": m.group(1),
            "name": name_match.group(1) if name_match else m.group(1),
            "website": website_match.group(1) if website_match else "",
            "instagram": ig_match.group(1) if ig_match else "",
            "photos": photos,
        })
    return venues


def fetch_html(url):
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        ct = r.headers.get("content-type", "")
        if "html" not in ct.lower():
            return None, f"not html ({ct})"
        return r.text, r.url
    except requests.RequestException as e:
        return None, str(e)


def harvest_images(html, base_url):
    soup = BeautifulSoup(html, "html.parser")
    candidates = []

    def add(u):
        if not u:
            return
        # Normalize: absolutize, strip URL-encoded params
        full = urllib.parse.urljoin(base_url, u.strip())
        # Skip data: URIs, svg, gif, ico
        if full.startswith("data:"):
            return
        if re.search(r"\.(svg|ico|gif)(\?|$)", full, re.IGNORECASE):
            return
        # Skip obvious logos/sprites/icons
        if re.search(r"(logo|icon|favicon|sprite|placeholder)", full, re.IGNORECASE):
            return
        candidates.append(full)

    # 1. Meta tags
    for prop in ("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"):
        for tag in soup.find_all("meta", attrs={"property": prop}):
            add(tag.get("content"))
        for tag in soup.find_all("meta", attrs={"name": prop}):
            add(tag.get("content"))

    # 2. JSON-LD images
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            img = item.get("image")
            if isinstance(img, str):
                add(img)
            elif isinstance(img, list):
                for u in img:
                    add(u if isinstance(u, str) else u.get("url"))
            elif isinstance(img, dict):
                add(img.get("url"))

    # 3. Hero images / big <img> tags
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        srcset = img.get("srcset") or ""
        if srcset:
            # take the largest from srcset
            parts = [p.strip().split(" ")[0] for p in srcset.split(",")]
            if parts:
                add(parts[-1])
        add(src)

    # Dedupe preserving order
    seen = set()
    out = []
    for u in candidates:
        u_clean = u.split("?")[0]  # canonicalize for dedup
        if u_clean in seen:
            continue
        seen.add(u_clean)
        out.append(u)
    return out


def verify_image(url):
    """HEAD-check that URL serves an image. Returns (ok, content-length)."""
    try:
        r = requests.head(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200:
            # Some servers reject HEAD — try GET range
            r = requests.get(
                url,
                headers={"User-Agent": UA, "Range": "bytes=0-1024"},
                timeout=TIMEOUT,
                stream=True,
            )
        ct = r.headers.get("content-type", "").lower()
        cl = int(r.headers.get("content-length", "0") or 0)
        if "image" not in ct:
            return False, 0
        if cl and cl < MIN_IMG_BYTES:
            return False, cl
        return True, cl
    except requests.RequestException:
        return False, 0


def process_venue(v, cache):
    """Returns (real_photos, source) where source describes provenance."""
    cache_key = v["website"] or f"id:{v['id']}"
    if cache_key in cache:
        return cache[cache_key]["photos"], cache[cache_key]["source"]

    # No website → keep existing whichbeach photos, mark "no_website"
    if not v["website"]:
        real = [p for p in v["photos"] if "picsum.photos" not in p]
        result = {"photos": real, "source": "no_website"}
        cache[cache_key] = result
        return real, "no_website"

    html, base = fetch_html(v["website"])
    if not html:
        result = {"photos": [], "source": f"site_unreachable:{base}"}
        cache[cache_key] = result
        return [], result["source"]

    candidates = harvest_images(html, base)
    if not candidates:
        result = {"photos": [], "source": "no_images_in_html"}
        cache[cache_key] = result
        return [], "no_images_in_html"

    # Verify the first N — bail at 3 successful images
    verified = []
    for u in candidates[:15]:
        ok, _ = verify_image(u)
        if ok:
            verified.append(u)
            if len(verified) >= 3:
                break
        time.sleep(0.1)

    source = f"website:{base}" if verified else "no_verified_images"
    result = {"photos": verified, "source": source}
    cache[cache_key] = result
    return verified, source


def patch_clubs_data(text, replacements):
    """
    For each venue id in `replacements`, replace any picsum URL in its photos
    array with the new URLs. We do this with a per-venue regex that targets
    only the photos:[...] block within that venue's text window.
    """
    out = text
    # Walk venues again to get current bounds
    pattern = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]", re.IGNORECASE)
    # Process in reverse so byte offsets after each replacement stay valid
    matches = list(pattern.finditer(out))
    for m in reversed(matches):
        vid = m.group(1)
        new_photos = replacements.get(vid)
        if not new_photos:
            continue
        # Find this venue's photos: [...] window
        start = m.start()
        # End at the next venue id or end of file
        next_m = pattern.search(out, m.end())
        end = next_m.start() if next_m else len(out)
        block = out[start:end]

        photos_match = re.search(r"(photos:\s*\[)(.*?)(\])", block, re.DOTALL)
        if not photos_match:
            continue

        original_arr = photos_match.group(2)
        # Existing real URLs to preserve (anything not picsum)
        existing_urls = re.findall(r"['\"]([^'\"]+)['\"]", original_arr)
        existing_real = [u for u in existing_urls if "picsum.photos" not in u and u.startswith("http")]

        # Merge: preserve existing real, append new ones, dedupe, cap at 3
        merged = []
        for u in existing_real + new_photos:
            if u not in merged:
                merged.append(u)
        merged = merged[:3]
        if not merged:
            continue

        # Build new array body matching the file's indent style
        indent = "        "  # matches existing style (8 spaces)
        new_body = "\n" + ",\n".join(f"{indent}'{u}'" for u in merged) + ",\n      "
        new_block = block[:photos_match.start(2)] + new_body + block[photos_match.end(2):]
        out = out[:start] + new_block + out[end:]
    return out


def main():
    text = DATA_FILE.read_text()
    venues = extract_venues(text)
    cache = load_cache()
    print(f"Found {len(venues)} venues in clubs-data.js")

    replacements = {}
    manifest = {"verified": [], "no_website": [], "site_unreachable": [], "no_verified_images": [], "no_images_in_html": []}

    for i, v in enumerate(venues, 1):
        # Has picsum? skip if not — already real
        has_picsum = any("picsum.photos" in p for p in v["photos"])
        if not has_picsum:
            manifest["verified"].append({"id": v["id"], "source": "already_real", "n": len(v["photos"])})
            continue

        print(f"  [{i:3d}/{len(venues)}] {v['id']}  ({v['website'] or '(no website)'})")
        new_photos, source = process_venue(v, cache)
        if new_photos:
            replacements[v["id"]] = new_photos
            manifest["verified"].append({"id": v["id"], "source": source, "n": len(new_photos)})
        else:
            # Bucket by source for the report
            for key in ("no_website", "site_unreachable", "no_verified_images", "no_images_in_html"):
                if source.startswith(key.split(":")[0]):
                    manifest[key].append({"id": v["id"], "source": source})
                    break
            else:
                manifest["site_unreachable"].append({"id": v["id"], "source": source})

        save_cache(cache)  # incremental save
        time.sleep(0.2)

    # Patch the file
    if replacements:
        new_text = patch_clubs_data(text, replacements)
        DATA_FILE.write_text(new_text)
        print(f"\nPatched clubs-data.js — {len(replacements)} venues got new photos")
    else:
        print("\nNo replacements applied")

    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2))
    print("Manifest:", MANIFEST_FILE)
    print(f"  verified:           {len(manifest['verified'])}")
    print(f"  no_website:         {len(manifest['no_website'])}")
    print(f"  site_unreachable:   {len(manifest['site_unreachable'])}")
    print(f"  no_verified_images: {len(manifest['no_verified_images'])}")
    print(f"  no_images_in_html:  {len(manifest['no_images_in_html'])}")


if __name__ == "__main__":
    sys.exit(main() or 0)
