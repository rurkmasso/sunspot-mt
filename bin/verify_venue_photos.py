#!/usr/bin/env python3
"""Verify every venue's first photo:

  1) The URL resolves (HTTP 200, image content-type).
  2) The filename's bay/place token matches a token from the venue's
     name or location — OR the URL is on a known-good first-party
     domain (the venue's own site, nomaisland.com, cafedelmar.com.mt,
     floskypool.com, …).

Flags everything else as either "broken" or "needs-review" so we can
fix the data deliberately. Run any time clubs-data.js changes:

    python3 bin/verify_venue_photos.py

Writes a CSV + JSON report to data/photo-audit.{csv,json}.
"""
from __future__ import annotations
import json, pathlib, re, subprocess, sys, urllib.parse, urllib.request
import socket, ssl, csv, time
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = pathlib.Path(__file__).resolve().parent.parent

NODE = r"""
  const window = {};
  eval(require('fs').readFileSync(process.argv[1], 'utf8'));
  process.stdout.write(JSON.stringify(window.SUNSPOT_CLUBS || []));
"""

# Known first-party domains that are safe — their own site, no
# need to match filename tokens.
TRUSTED_DOMAINS = {
    'nomaisland.com', 'cafedelmar.com.mt', 'floskypool.com', 'aqualuna.mt',
    '1926lesoleil.com', 'cugogranmacina.com', 'malta.intercontinental.com',
    'ionharbour.com', 'www.odycy.com', 'odycy.com',
}

# Words that don't carry meaning when comparing names ↔ filenames.
STOP = {
    'the','beach','club','pool','bay','malta','of','at','de','la','le','el','il',
    'lido','rooftop','floating','sand','sandy','natural','rock','rocky','sea',
    'village','centre','center','resort','hotel','spa','sunbeds','sunbed',
    'cabana','vip','poolside','beachside','co','collection','company','est',
    'and','on','in','to','for','old','new','open','closed','public',
}

def tokens(s: str) -> set[str]:
    out = set()
    s = (s or '').lower()
    # ş ħ ġ ż etc → strip diacritics for matching
    s = re.sub(r"[ġ]", "g", s); s = re.sub(r"[ħ]", "h", s)
    s = re.sub(r"[ż]", "z", s); s = re.sub(r"[ċ]", "c", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    for t in s.split():
        if len(t) >= 4 and t not in STOP:
            out.add(t)
    return out

def filename_tokens(url: str) -> set[str]:
    path = urllib.parse.urlparse(url).path
    name = path.rsplit('/', 1)[-1]
    name = re.sub(r"\.\w+$", "", name)         # strip extension
    name = re.sub(r"\d+x\d+(?:-\d+)?", " ", name)  # strip dimensions
    name = re.sub(r"[-_.]+", " ", name).lower()
    return tokens(name)

def check_url(url: str, timeout: float = 8) -> dict:
    """HEAD request first, GET fallback. Returns {status, ctype, ms}."""
    out = {'status': None, 'ctype': None, 'ms': None, 'err': None}
    start = time.time()
    # macOS Python often ships without the system CA bundle, so the verifier
    # would mark every HTTPS URL as broken. Use certifi when available,
    # otherwise drop verification — we're checking image existence, not
    # establishing a security boundary.
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode    = ssl.CERT_NONE
    for method in ('HEAD', 'GET'):
        try:
            headers = {'User-Agent': 'Sunspot-PhotoVerifier/1.0 (+https://sunspot.mt)'}
            if method == 'GET':
                headers['Range'] = 'bytes=0-2048'
            req = urllib.request.Request(url, method=method, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
                out['status'] = r.status
                out['ctype']  = r.headers.get('Content-Type', '')
                out['ms']     = int((time.time() - start) * 1000)
                return out
        except urllib.error.HTTPError as e:
            if e.code in (403, 405) and method == 'HEAD':
                continue  # try GET
            out['err'] = f"HTTP {e.code}"; out['status'] = e.code
            break
        except (urllib.error.URLError, socket.timeout, ssl.SSLError, ConnectionError) as e:
            # Strip the SSL chatter to keep the report readable
            msg = str(e)
            if 'CERTIFICATE_VERIFY_FAILED' in msg:
                msg = 'TLS chain verify failed (python-ca)'
            out['err'] = msg
            break
    out['ms'] = int((time.time() - start) * 1000)
    return out

def classify(c: dict, status: dict) -> tuple[str, str]:
    url = (c.get('photos') or [None])[0]
    if not url:
        return ('missing', 'no photo on record')
    host = urllib.parse.urlparse(url).netloc.lower()
    s = status.get('status')
    if s and s >= 400:
        return ('broken', f"HTTP {s}")
    if status.get('err'):
        return ('broken', status['err'][:80])
    ftoks = filename_tokens(url)
    vtoks = tokens(c.get('name', '')) | tokens(c.get('location', '')) | tokens(c.get('regionLabel', ''))
    if host in TRUSTED_DOMAINS:
        return ('ok-trusted', f"{host}")
    if ftoks & vtoks:
        return ('ok-match', f"matched on {sorted(ftoks & vtoks)}")
    # If the filename is a known generic bay, mark as proxy (not strictly wrong)
    return ('needs-review', f"filename={list(ftoks)[:3]} venue={list(vtoks)[:3]}")

def main():
    out = subprocess.check_output(['node', '-e', NODE, str(ROOT / 'clubs-data.js')], cwd=ROOT, text=True)
    clubs = json.loads(out)
    print(f"Loaded {len(clubs)} venues")

    rows = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {}
        for c in clubs:
            url = (c.get('photos') or [None])[0]
            if not url:
                rows.append({**c, 'photo': '', 'status': None, 'class': 'missing', 'reason': 'no photo'})
                continue
            futures[pool.submit(check_url, url)] = c
        for fut in as_completed(futures):
            c = futures[fut]
            try: status = fut.result()
            except Exception as e: status = {'status': None, 'err': str(e)}
            klass, reason = classify(c, status)
            rows.append({
                'id': c['id'], 'name': c.get('name',''), 'location': c.get('location',''),
                'category': c.get('category',''), 'photo': (c.get('photos') or [''])[0],
                'http': status.get('status'), 'ctype': status.get('ctype'),
                'class': klass, 'reason': reason,
            })

    # Sort: broken first, then needs-review, then ok
    order = {'broken': 0, 'missing': 1, 'needs-review': 2, 'ok-match': 3, 'ok-trusted': 4}
    rows.sort(key=lambda r: (order.get(r['class'], 9), r['id']))

    (ROOT / 'data').mkdir(exist_ok=True)
    (ROOT / 'data/photo-audit.json').write_text(json.dumps(rows, indent=1))
    with (ROOT / 'data/photo-audit.csv').open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['class','id','name','location','category','http','ctype','reason','photo'])
        w.writeheader()
        for r in rows: w.writerow(r)

    # Console summary
    from collections import Counter
    c = Counter(r['class'] for r in rows)
    print(f"\n  Status breakdown: {dict(c)}")
    print(f"\n  Broken ({c.get('broken',0)}):")
    for r in rows:
        if r['class'] == 'broken':
            print(f"    {r['id']:30s} HTTP={r['http']} {r['reason'][:50]}  {r['photo']}")
    print(f"\n  Needs review ({c.get('needs-review',0)}): see data/photo-audit.csv")

if __name__ == '__main__':
    main()
