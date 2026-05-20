#!/usr/bin/env python3
"""
QA the venue photos. For each photo URL, score how well it matches the
venue's name / location / category and flag likely mismatches.

Heuristics (none of these are perfect, but they catch the obvious wrongs):
  + filename contains the venue name → strong match
  + filename contains the venue location word (Sliema, Gozo, etc.) → match
  + filename contains a sibling category word (pool, rooftop, beach, sand) → match
  - filename contains 'montage', 'coat_of_arms', 'church', 'map', 'flag',
    'tower', 'statue', 'sign' → suspicious (probably wrong subject)
  - venue is rooftop/pool-club but filename mentions sand/beach/cove → wrong
  - venue is beach/sand but filename mentions rooftop/skyline → wrong

Outputs bin/photo_qa_report.json with a per-venue list of {url, score, notes}.
"""
import json
import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
REPORT = ROOT / "bin" / "photo_qa_report.json"

# ─── Vocab ───
LOCATION_WORDS = [
    "sliema", "valletta", "mellieha", "gozo", "comino", "bugibba", "qawra",
    "marsascala", "marsaskala", "marsaxlokk", "birzebbuga", "birzebbuġa",
    "st_julians", "st-julians", "st_paul", "ghajn_tuffieha", "għajn",
    "ramla", "san_blas", "xlendi", "marsalforn", "wied", "kalanka", "fomm",
    "armier", "paradise", "ghadira", "anchor", "dwejra", "blue_lagoon",
    "crystal_lagoon", "popeye", "salina", "marfa", "tigne", "balluta",
    "exiles", "fond_ghadir", "hofra", "delimara", "pretty_bay",
    "qbajjar", "xwejni", "hondoq", "dahlet", "ghar_lapsi", "rinella",
    "spinola", "portomaso", "dragonara", "paceville",
]
CATEGORY_WORDS = {
    "pool-club":   ["pool", "lido", "deck", "swim"],
    "rooftop":     ["roof", "rooftop", "sky", "terrace", "bar", "view", "panorama"],
    "lido":        ["lido", "pool", "deck", "swim"],
    "beach-club":  ["beach", "sand", "cove", "bay", "shore", "lido"],
    "sandy-beach": ["sand", "beach", "bay", "cove"],
    "rocky-bay":   ["rock", "bay", "cliff", "cove", "creek"],
    "natural":     ["cave", "grotto", "lagoon", "natural", "inland", "blue_hole"],
    "floating":    ["floating", "deck", "boat", "platform"],
}
# Filename red flags — almost certainly wrong subject
RED_FLAGS = [
    "montage", "coat_of_arms", "coat-of-arms", "church", "chapel",
    "flag", "map", "locator", "seal", "tower", "statue", "monument",
    "sign", "logo", "icon", "panel_", "balcony", "interior", "menu",
    "facade", "door", "window", "stairs", "wreath",
]


def extract_venues(text):
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(text))
    venues = []
    for i, m in enumerate(matches):
        start, end = m.start(), matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]
        name = (re.search(r"name:\s*['\"]([^'\"]+)['\"]", block) or [None, ""])[1]
        cat  = (re.search(r"category:\s*['\"]([^'\"]+)['\"]", block) or [None, ""])[1]
        loc  = (re.search(r"location:\s*['\"]([^'\"]+)['\"]", block) or [None, ""])[1]
        photos = []
        pm = re.search(r"photos:\s*\[(.*?)\]", block, re.DOTALL)
        if pm:
            urls = re.findall(r"['\"](https?://[^'\"]+)['\"]", pm.group(1))
            wb = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", pm.group(1))
            for u in urls: photos.append(u)
            for p in wb:   photos.append("https://whichbeach.com.mt/wp-content/uploads/" + p)
        venues.append({
            "id": m.group(1), "name": name, "category": cat,
            "location": loc, "photos": photos,
        })
    return venues


def score_photo(url, venue):
    fname = unquote(url.lower().rsplit("/", 1)[-1])
    score = 0
    notes = []

    # Strong match: venue id or name word in the filename
    vid_parts = venue["id"].lower().split("-")
    name_parts = re.findall(r"[a-z]+", venue["name"].lower())
    target_parts = set(p for p in vid_parts + name_parts if len(p) > 3)
    matched_names = [p for p in target_parts if p in fname]
    if matched_names:
        score += 4
        notes.append("name-match:" + ",".join(matched_names[:2]))

    # Location words in filename
    loc_low = venue["location"].lower().replace("'", "")
    loc_words = re.findall(r"[a-zħ]+", loc_low)
    matched_loc = [w for w in LOCATION_WORDS if any(lw in fname for lw in [w, w.replace("_", "-"), w.replace("_", " "), w.replace("_", "")])]
    if matched_loc:
        score += 2
        notes.append("loc-match:" + ",".join(set(matched_loc) - set(matched_names))[:30])

    # Category vocab in filename
    cat_words = CATEGORY_WORDS.get(venue["category"], [])
    matched_cat = [w for w in cat_words if w in fname]
    if matched_cat:
        score += 1
        notes.append("cat-match:" + ",".join(matched_cat))

    # Red flags
    flags = [w for w in RED_FLAGS if w in fname]
    if flags:
        score -= 3
        notes.append("red-flag:" + ",".join(flags))

    # Category clash — strong signal
    if venue["category"] in ("rooftop", "pool-club", "lido"):
        clash = [w for w in ("sand", "cove", "cliff", "wave") if w in fname]
        if clash:
            score -= 3
            notes.append("cat-clash:" + ",".join(clash))
    if venue["category"] in ("sandy-beach", "beach-club"):
        clash = [w for w in ("rooftop", "skyline", "terrace") if w in fname]
        if clash:
            score -= 3
            notes.append("cat-clash:" + ",".join(clash))

    # Source preference: venue's own website > whichbeach > commons
    venue_id_words = set(vid_parts)
    if any(v in url.lower() for v in venue_id_words if len(v) > 3):
        score += 2
        notes.append("own-domain")

    return score, notes


def main():
    text = DATA_FILE.read_text()
    venues = extract_venues(text)
    report = {
        "summary": {"total": 0, "high": 0, "ok": 0, "suspect": 0, "bad": 0},
        "suspect": [],   # score 0..1
        "bad":     [],   # score < 0
        "by_venue": {},
    }
    for v in venues:
        rows = []
        for u in v["photos"]:
            s, n = score_photo(u, v)
            rows.append({"url": u, "score": s, "notes": n})
            report["summary"]["total"] += 1
            if   s >= 4: report["summary"]["high"]    += 1
            elif s >= 2: report["summary"]["ok"]      += 1
            elif s >= 0: report["summary"]["suspect"] += 1
            else:        report["summary"]["bad"]     += 1
            if s < 0:
                report["bad"].append({"venue": v["id"], "category": v["category"], **rows[-1]})
            elif s < 2:
                report["suspect"].append({"venue": v["id"], "category": v["category"], **rows[-1]})
        report["by_venue"][v["id"]] = {
            "name": v["name"], "category": v["category"], "photos": rows,
        }

    REPORT.write_text(json.dumps(report, indent=2))
    s = report["summary"]
    print(f"QA done — {s['total']} photos across {len(venues)} venues")
    print(f"  high confidence:  {s['high']}")
    print(f"  ok:               {s['ok']}")
    print(f"  suspect:          {s['suspect']}")
    print(f"  likely wrong:     {s['bad']}")
    print(f"\nReport: {REPORT}")
    if report["bad"]:
        print(f"\nTop 10 likely-wrong photos:")
        for r in report["bad"][:10]:
            print(f"  [{r['score']:+d}] {r['venue']:30s} {r['url'][:80]}")
            if r["notes"]: print(f"        notes: {', '.join(r['notes'])}")


if __name__ == "__main__":
    main()
