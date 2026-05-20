#!/usr/bin/env python3
"""Verify every photo URL in clubs-data.js returns a real image. Reports
broken/redirected URLs so we can fix them before the next deploy."""
import json
import re
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
TIMEOUT = 10


def extract():
    text = DATA_FILE.read_text()
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(text))
    pairs = []  # (venue_id, url)
    for i, m in enumerate(matches):
        vid = m.group(1)
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]
        pm = re.search(r"photos:\s*\[(.*?)\]", block, re.DOTALL)
        if not pm:
            continue
        urls = re.findall(r"['\"](https?://[^'\"]+)['\"]", pm.group(1))
        wb_paths = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", pm.group(1))
        for u in urls:
            pairs.append((vid, u))
        for p in wb_paths:
            pairs.append((vid, "https://whichbeach.com.mt/wp-content/uploads/" + p))
    return pairs


def check(vid, url):
    try:
        r = requests.head(url, headers={"User-Agent": UA}, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code == 405 or r.status_code >= 400:
            # Some CDNs reject HEAD — try a tiny ranged GET
            r = requests.get(url, headers={"User-Agent": UA, "Range": "bytes=0-1024"}, timeout=TIMEOUT, stream=True)
        ct = r.headers.get("content-type", "").lower()
        ok = r.status_code < 400 and "image" in ct
        return vid, url, r.status_code, ct, ok
    except requests.RequestException as e:
        return vid, url, 0, str(e)[:60], False


def main():
    pairs = extract()
    print(f"Verifying {len(pairs)} photo URLs across {len(set(p[0] for p in pairs))} venues...")
    broken = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(check, vid, url) for vid, url in pairs]
        for i, fut in enumerate(as_completed(futures), 1):
            vid, url, status, ct, ok = fut.result()
            if not ok:
                broken.append({"venue": vid, "url": url, "status": status, "ct": ct})
            if i % 30 == 0:
                print(f"  checked {i}/{len(pairs)}  ({len(broken)} broken so far)")
    print()
    print(f"Total: {len(pairs)} URLs · OK: {len(pairs) - len(broken)} · BROKEN: {len(broken)}")
    if broken:
        per_venue = {}
        for b in broken:
            per_venue.setdefault(b["venue"], []).append(b)
        print()
        print("Broken URLs by venue:")
        for vid, items in per_venue.items():
            print(f"  {vid}  ({len(items)})")
            for it in items[:3]:
                print(f"    [{it['status']}] {it['url'][:90]}")
    out = ROOT / "bin" / "photo_verify_report.json"
    out.write_text(json.dumps(broken, indent=2))
    print(f"\nReport: {out}")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
