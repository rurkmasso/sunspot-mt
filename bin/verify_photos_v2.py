#!/usr/bin/env python3
"""
Thorough photo verification — slow + honest.

For every photo URL in clubs-data.js:
  1. HEAD request (or ranged GET if HEAD rejected)
  2. Verify HTTP 2xx
  3. Verify Content-Type matches image/*
  4. Verify Content-Length isn't a tiny error page (>4 KB)

Per-host throttling so we don't get 429s from Wikimedia or our own
operator hosts — the last run's "broken" count was inflated because
we hammered upload.wikimedia.org with parallel requests.

Outputs JSON report. Run again to verify after fixing.
"""
import json, re, sys, time
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
REPORT = ROOT / "bin" / "photo_verify_v2_report.json"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
TIMEOUT = 15
MIN_BYTES = 4000

# Per-host minimum delay (seconds) between requests to avoid rate limits
HOST_DELAY = {
    "upload.wikimedia.org": 0.9,
    "commons.wikimedia.org": 0.9,
    "wikimedia.org": 0.9,
    "*": 0.15,
}
_last_hit = defaultdict(float)


def throttle(host):
    delay = HOST_DELAY.get(host) or HOST_DELAY["*"]
    wait = (_last_hit[host] + delay) - time.time()
    if wait > 0:
        time.sleep(wait)
    _last_hit[host] = time.time()


def extract():
    text = DATA_FILE.read_text()
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(text))
    venues = []
    for i, m in enumerate(matches):
        vid = m.group(1)
        start, end = m.start(), matches[i+1].start() if i+1 < len(matches) else len(text)
        block = text[start:end]
        name = (re.search(r"name:\s*['\"]([^'\"]+)['\"]", block) or [None, vid])[1]
        urls, wb = [], []
        pm = re.search(r"photos:\s*\[(.*?)\]", block, re.DOTALL)
        if pm:
            urls = re.findall(r"['\"](https?://[^'\"]+)['\"]", pm.group(1))
            wb   = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", pm.group(1))
        photos = urls + ["https://whichbeach.com.mt/wp-content/uploads/" + p for p in wb]
        venues.append({"id": vid, "name": name, "photos": photos})
    return venues


def check_one(url):
    host = urlparse(url).hostname or "?"
    throttle(host)
    headers = {"User-Agent": UA, "Accept": "image/*, */*;q=0.8"}
    # Try HEAD first
    try:
        r = requests.head(url, headers=headers, timeout=TIMEOUT, allow_redirects=True)
        if r.status_code in (405, 403, 501):
            raise requests.RequestException("HEAD blocked")
    except requests.RequestException:
        try:
            r = requests.get(url, headers={**headers, "Range": "bytes=0-4095"}, timeout=TIMEOUT, stream=True, allow_redirects=True)
        except requests.RequestException as e:
            return {"ok": False, "status": 0, "ct": "(connect-error)", "size": 0, "err": str(e)[:80]}

    status = r.status_code
    ct = r.headers.get("content-type", "").lower()
    # Content-Length can be "*", missing, or the range size; pull from content-range if present
    cr = r.headers.get("content-range", "")
    size = 0
    if cr and "/" in cr:
        tail = cr.rsplit("/", 1)[-1]
        if tail.isdigit():
            size = int(tail)
    if not size:
        try: size = int(r.headers.get("content-length", "0") or 0)
        except ValueError: size = 0

    ok = (200 <= status < 400) and ("image" in ct) and (size == 0 or size >= MIN_BYTES)
    return {"ok": ok, "status": status, "ct": ct or "(none)", "size": size}


def main():
    venues = extract()
    total_photos = sum(len(v["photos"]) for v in venues)
    print(f"Verifying {total_photos} photos across {len(venues)} venues (throttled)...")
    print()

    bad_by_venue = defaultdict(list)
    by_host_status = defaultdict(lambda: defaultdict(int))
    checked = 0

    for v in venues:
        for url in v["photos"]:
            res = check_one(url)
            host = urlparse(url).hostname or "?"
            by_host_status[host][res["status"]] += 1
            checked += 1
            if not res["ok"]:
                bad_by_venue[v["id"]].append({"url": url, **res})
            if checked % 25 == 0:
                print(f"  checked {checked}/{total_photos}  ({sum(len(x) for x in bad_by_venue.values())} broken so far)")

    print()
    print(f"Total: {total_photos} URLs · OK: {total_photos - sum(len(x) for x in bad_by_venue.values())} · BROKEN: {sum(len(x) for x in bad_by_venue.values())}")
    print()
    if bad_by_venue:
        print("Broken by venue:")
        for vid, items in sorted(bad_by_venue.items()):
            v = next(x for x in venues if x["id"] == vid)
            print(f"  {vid} ({v['name']}):")
            for it in items[:3]:
                print(f"    [{it['status']}] {it['ct']:30s} {it['url'][:100]}")
    print()
    print("By host (status code → count):")
    for host, counts in sorted(by_host_status.items()):
        bits = ", ".join(f"{s}:{c}" for s, c in sorted(counts.items()))
        print(f"  {host:30s} {bits}")

    REPORT.write_text(json.dumps({
        "checked": checked,
        "broken": sum(len(x) for x in bad_by_venue.values()),
        "bad_by_venue": dict(bad_by_venue),
        "by_host_status": {h: dict(c) for h, c in by_host_status.items()},
    }, indent=2))
    print(f"\nReport: {REPORT}")
    return 1 if bad_by_venue else 0


if __name__ == "__main__":
    sys.exit(main())
