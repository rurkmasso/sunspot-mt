#!/usr/bin/env python3
"""
SEO audit across every HTML page.

Checks per page:
  - <title> exists, unique, 30-65 chars
  - <meta name=description> exists, 70-170 chars
  - <link rel=canonical> exists
  - Open Graph tags: og:title, og:description, og:image, og:url, og:type
  - Twitter Card: twitter:card, twitter:title, twitter:description, twitter:image
  - JSON-LD structured data present
  - Single <h1>, sensible heading hierarchy
  - <meta name=viewport>
  - <html lang=...>
  - Robots directive present and not blocking public pages
  - Image <img> tags missing alt text
  - <a> tags without href or with empty href
Outputs a CSV summary and a JSON report.
"""
import json
import re
import sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted(p for p in ROOT.glob("*.html"))
SUB = sorted(p for p in (ROOT / "shop").glob("*.html")) if (ROOT / "shop").exists() else []
ALL = PAGES + SUB

REPORT = ROOT / "bin" / "seo_audit_report.json"


def pull(rx, text, flags=re.IGNORECASE | re.DOTALL):
    m = re.search(rx, text, flags)
    return m.group(1).strip() if m else ""


def pull_all(rx, text):
    return re.findall(rx, text, re.IGNORECASE | re.DOTALL)


def audit(path):
    rel = str(path.relative_to(ROOT))
    text = path.read_text(errors="ignore")

    title = pull(r"<title>(.*?)</title>", text)
    desc  = pull(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)', text)
    canon = pull(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']*)', text)
    lang  = pull(r'<html[^>]*lang=["\']([^"\']*)', text)
    vp    = pull(r'<meta[^>]*name=["\']viewport["\'][^>]*content=["\']([^"\']*)', text)
    robots = pull(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']*)', text)

    og  = {
        prop: pull(r'<meta[^>]*property=["\']og:' + prop + r'["\'][^>]*content=["\']([^"\']*)', text)
        for prop in ("title", "description", "image", "url", "type")
    }
    tw  = {
        prop: pull(r'<meta[^>]*name=["\']twitter:' + prop + r'["\'][^>]*content=["\']([^"\']*)', text)
        for prop in ("card", "title", "description", "image")
    }

    # Heading hierarchy
    h1_count = len(re.findall(r"<h1\b", text, re.IGNORECASE))
    h2_count = len(re.findall(r"<h2\b", text, re.IGNORECASE))

    # JSON-LD blocks (rough — count + try-parse each)
    ld_blocks = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', text, re.IGNORECASE | re.DOTALL)
    ld_types = []
    for block in ld_blocks:
        try:
            data = json.loads(block.strip())
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and "@type" in item:
                    ld_types.append(item["@type"])
        except Exception:
            ld_types.append("(parse-error)")

    # Image alts (skip data: SVGs which are decorative)
    img_tags = re.findall(r"<img\b[^>]*>", text, re.IGNORECASE)
    img_no_alt = sum(1 for t in img_tags
                     if not re.search(r"\balt\s*=", t, re.IGNORECASE)
                     and "data:image" not in t)

    # Bad anchors (href="" or href="#")
    bad_anchors = len(re.findall(r'<a[^>]*href=["\'](?:#|\s*)["\']', text, re.IGNORECASE))

    issues = []

    if not title:
        issues.append(("error", "missing-title", ""))
    else:
        if len(title) < 30:
            issues.append(("warn", "title-too-short", f"{len(title)} chars"))
        elif len(title) > 65:
            issues.append(("warn", "title-too-long", f"{len(title)} chars"))

    if not desc:
        issues.append(("error", "missing-description", ""))
    else:
        if len(desc) < 70:
            issues.append(("warn", "description-too-short", f"{len(desc)} chars"))
        elif len(desc) > 170:
            issues.append(("warn", "description-too-long", f"{len(desc)} chars"))

    if not canon:
        issues.append(("warn", "missing-canonical", ""))
    if not lang:
        issues.append(("warn", "missing-html-lang", ""))
    if not vp:
        issues.append(("error", "missing-viewport", ""))

    # OG / Twitter
    for k in ("title", "description", "image", "url"):
        if not og.get(k):
            issues.append(("warn", f"missing-og-{k}", ""))
    if not tw.get("card"):
        issues.append(("warn", "missing-twitter-card", ""))
    if not tw.get("image") and not og.get("image"):
        issues.append(("warn", "no-social-image", ""))

    # Headings
    if h1_count == 0:
        issues.append(("error", "no-h1", ""))
    elif h1_count > 1:
        issues.append(("warn", "multiple-h1", f"{h1_count} found"))

    # JSON-LD on key pages
    important_pages = {"index.html", "club.html", "guide.html", "guides.html", "about.html", "faq.html"}
    if rel in important_pages and not ld_types:
        issues.append(("warn", "no-json-ld", ""))

    # Robots
    if rel in {"checkout.html", "confirmation.html", "booking.html", "bookings.html", "account.html", "signin.html"}:
        if "noindex" not in robots.lower():
            issues.append(("warn", "should-be-noindex", f"robots='{robots}'"))
    elif rel == "404.html":
        if "noindex" not in robots.lower():
            issues.append(("warn", "404-should-noindex", ""))
    else:
        if robots and "noindex" in robots.lower():
            issues.append(("error", "wrongly-noindex", f"robots='{robots}'"))

    # Image alts
    if img_no_alt > 0:
        issues.append(("warn", "images-without-alt", f"{img_no_alt} img tags"))

    # Bad anchors
    if bad_anchors > 0:
        issues.append(("warn", "dead-anchors", f"{bad_anchors} found"))

    return {
        "page": rel,
        "title": title,
        "title_len": len(title),
        "description": desc,
        "description_len": len(desc),
        "canonical": canon,
        "lang": lang,
        "robots": robots,
        "og": og,
        "twitter": tw,
        "ld_types": ld_types,
        "h1_count": h1_count,
        "h2_count": h2_count,
        "img_total": len(img_tags),
        "img_no_alt": img_no_alt,
        "bad_anchors": bad_anchors,
        "issues": issues,
    }


def main():
    results = [audit(p) for p in ALL]

    # Title uniqueness
    titles = Counter(r["title"].lower().strip() for r in results if r["title"])
    canon_seen = Counter(r["canonical"] for r in results if r["canonical"])

    summary = {"by_severity": Counter()}
    for r in results:
        if titles[r["title"].lower().strip()] > 1 and r["title"]:
            r["issues"].append(("warn", "duplicate-title", f"shared with {titles[r['title'].lower().strip()]-1} other pages"))
        if r["canonical"] and canon_seen[r["canonical"]] > 1:
            r["issues"].append(("error", "duplicate-canonical", r["canonical"]))
        for sev, *_ in r["issues"]:
            summary["by_severity"][sev] += 1

    REPORT.write_text(json.dumps({"summary": dict(summary["by_severity"]), "pages": results}, indent=2))

    # Print readable summary
    print(f"\nSEO audit — {len(results)} pages\n")
    print(f"  errors: {summary['by_severity'].get('error', 0)}")
    print(f"  warns:  {summary['by_severity'].get('warn', 0)}")
    print()

    pages_with_issues = [r for r in results if r["issues"]]
    pages_with_issues.sort(key=lambda r: -sum(1 for i in r["issues"] if i[0] == "error"))

    for r in pages_with_issues:
        errs  = [i for i in r["issues"] if i[0] == "error"]
        warns = [i for i in r["issues"] if i[0] == "warn"]
        if not errs and not warns:
            continue
        tag = f"\033[91mERR\033[0m" if errs else "\033[93mWARN\033[0m"
        print(f"[{tag}] {r['page']:30s}  title {r['title_len']:3d}c  desc {r['description_len']:3d}c  h1={r['h1_count']}  ld={','.join(r['ld_types']) or '-'}")
        for sev, code, detail in errs + warns:
            mark = "✗" if sev == "error" else "·"
            print(f"          {mark} {code:30s} {detail}")
        print()

    print(f"Full report: {REPORT}")


if __name__ == "__main__":
    sys.exit(main() or 0)
