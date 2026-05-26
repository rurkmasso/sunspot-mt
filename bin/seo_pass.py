#!/usr/bin/env python3
"""Sunspot SEO + sitemap pass.

Idempotent. Re-run any time. Touches:
  - sitemap-*.xml      regenerated from clubs-data.js / guides-data.js / experiences-data.js
  - sitemap.xml        index, with today's lastmod
  - robots.txt         all sitemap URLs, polite crawl rules
  - sitemap.html       human-readable site map (good for crawlers + accessibility)
  - every public *.html
        - canonical → page-specific (fixes pages that pointed canonical=root)
        - hreflang en-MT / mt-MT / it-MT / x-default
        - robots → "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        - BreadcrumbList JSON-LD where missing
        - FAQPage JSON-LD on faq.html
        - "Explore Sunspot" internal-links block before </body>

Run:  python3 bin/seo_pass.py
"""
from __future__ import annotations
import re, pathlib, datetime, json, html
from typing import Iterable

ROOT      = pathlib.Path(__file__).resolve().parent.parent
ORIGIN    = "https://sunspot.mt"
TODAY     = datetime.date.today().isoformat()

# -----------------------------------------------------------
# 1. Data sources
# -----------------------------------------------------------
def slugs(filename: str, key: str) -> list[str]:
    text = (ROOT / filename).read_text()
    return re.findall(rf"{key}:\s*['\"]([a-z0-9-]+)['\"]", text)

CLUBS       = slugs("clubs-data.js", "id")
GUIDES      = slugs("guides-data.js", "slug")
EXPERIENCES = slugs("experiences-data.js", "id")

CATEGORIES = [
    "floating","rooftop","pool-club","lido","beach-club",
    "sandy-beach","rocky-bay","natural",
]
REGIONS = ["north","central","south","gozo","comino"]

# -----------------------------------------------------------
# 2. Public pages — single source of truth
# -----------------------------------------------------------
PUBLIC_PAGES: list[dict] = [
    # path,                title (for HTML sitemap), priority, changefreq, hreflang_root
    {"path":"index.html",      "title":"Home",                       "p":"1.0", "cf":"daily"},
    {"path":"experiences.html","title":"Experiences",                "p":"0.9", "cf":"weekly"},
    {"path":"guides.html",     "title":"Guides",                     "p":"0.9", "cf":"weekly"},
    {"path":"visiting.html",   "title":"Visiting Malta",             "p":"0.9", "cf":"weekly"},
    {"path":"living.html",     "title":"Living in Malta",            "p":"0.8", "cf":"weekly"},
    {"path":"compare.html",    "title":"Compare beach clubs",        "p":"0.7", "cf":"weekly"},
    {"path":"gifts.html",      "title":"Sunspot gift cards",         "p":"0.6", "cf":"monthly"},
    {"path":"faq.html",        "title":"FAQ",                        "p":"0.7", "cf":"monthly"},
    {"path":"about.html",      "title":"About Sunspot",              "p":"0.6", "cf":"monthly"},
    {"path":"team.html",       "title":"Team",                       "p":"0.5", "cf":"monthly"},
    {"path":"rates.html",      "title":"Operator rate card",         "p":"0.6", "cf":"monthly"},
    {"path":"brand.html",      "title":"Brand",                      "p":"0.4", "cf":"monthly"},
    {"path":"club.html",       "title":"Beach club & lido",          "p":"0.9", "cf":"weekly", "dynamic": True},
    {"path":"guide.html",      "title":"Field guide article",        "p":"0.85","cf":"weekly", "dynamic": True},
]

# Pages that should NOT be in the sitemap or indexed
NOINDEX_PAGES = {
    "checkout.html","confirmation.html","bookings.html",
    "signin.html","account.html","booking.html","app.html","404.html",
}

# Breadcrumb chains per page (title appears in BreadcrumbList JSON-LD)
BREADCRUMBS = {
    "index.html":        [("Home", "/")],
    "experiences.html":  [("Home","/"), ("Experiences","/experiences.html")],
    "guides.html":       [("Home","/"), ("Guides","/guides.html")],
    "visiting.html":     [("Home","/"), ("Visiting Malta","/visiting.html")],
    "living.html":       [("Home","/"), ("Living in Malta","/living.html")],
    "faq.html":          [("Home","/"), ("FAQ","/faq.html")],
    "about.html":        [("Home","/"), ("About","/about.html")],
    "team.html":         [("Home","/"), ("About","/about.html"), ("Team","/team.html")],
    "rates.html":        [("Home","/"), ("For operators","/rates.html")],
    "brand.html":        [("Home","/"), ("Brand","/brand.html")],
    "compare.html":      [("Home","/"), ("Compare clubs","/compare.html")],
    "gifts.html":        [("Home","/"), ("Gift cards","/gifts.html")],
    "club.html":         [("Home","/"), ("Beaches","/"), ("Beach club","/club.html")],
    "guide.html":        [("Home","/"), ("Guides","/guides.html"), ("Article","/guide.html")],
    "sitemap.html":      [("Home","/"), ("Site map","/sitemap.html")],
}

# -----------------------------------------------------------
# 3. Sitemap XML generation
# -----------------------------------------------------------
def url_entry(loc: str, lastmod: str = TODAY, changefreq: str = "weekly",
              priority: str = "0.7", extras: list[str] | None = None) -> str:
    extras = extras or []
    parts = [f"<loc>{html.escape(loc)}</loc>",
             f"<lastmod>{lastmod}</lastmod>",
             f"<changefreq>{changefreq}</changefreq>",
             f"<priority>{priority}</priority>", *extras]
    return "  <url>" + "".join(parts) + "</url>"

def hreflang_extras(canonical_url: str) -> list[str]:
    """xhtml:link alternate annotations for sitemap (en-MT default, mt-MT, it-MT)."""
    sep = "&" if "?" in canonical_url else "?"
    return [
        f'<xhtml:link rel="alternate" hreflang="en-MT" href="{html.escape(canonical_url)}"/>',
        f'<xhtml:link rel="alternate" hreflang="mt-MT" href="{html.escape(canonical_url+sep+"lang=mt")}"/>',
        f'<xhtml:link rel="alternate" hreflang="it-MT" href="{html.escape(canonical_url+sep+"lang=it")}"/>',
        f'<xhtml:link rel="alternate" hreflang="x-default" href="{html.escape(canonical_url)}"/>',
    ]

def write_sitemap(path: str, entries: list[str], with_xhtml=True):
    ns = '\n  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    if with_xhtml:
        ns += '\n  xmlns:xhtml="http://www.w3.org/1999/xhtml"'
    body = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset{ns}>\n' + "\n".join(entries) + "\n</urlset>\n"
    (ROOT / path).write_text(body, encoding="utf-8")

def regen_sitemaps():
    # pages.xml — static informational pages (no dynamic)
    pg_entries = []
    for p in PUBLIC_PAGES:
        if p.get("dynamic"): continue
        loc = ORIGIN + ("/" if p["path"] == "index.html" else f"/{p['path']}")
        pg_entries.append(url_entry(loc, TODAY, p["cf"], p["p"],
                                    extras=hreflang_extras(loc)))
    # also link the human sitemap page
    pg_entries.append(url_entry(f"{ORIGIN}/sitemap.html", TODAY, "monthly", "0.4",
                                extras=hreflang_extras(f"{ORIGIN}/sitemap.html")))
    write_sitemap("sitemap-pages.xml", pg_entries)

    # venues.xml — 112 clubs
    write_sitemap("sitemap-venues.xml",
        [url_entry(f"{ORIGIN}/club.html?club={c}", TODAY, "weekly", "0.8",
                   extras=hreflang_extras(f"{ORIGIN}/club.html?club={c}"))
         for c in CLUBS])

    # guides.xml
    write_sitemap("sitemap-guides.xml",
        [url_entry(f"{ORIGIN}/guide.html?g={g}", TODAY, "weekly", "0.85",
                   extras=hreflang_extras(f"{ORIGIN}/guide.html?g={g}"))
         for g in GUIDES])

    # experiences.xml — currently empty: hub + individual jump-anchors
    exp_entries = [url_entry(f"{ORIGIN}/experiences.html", TODAY, "weekly", "0.9",
                              extras=hreflang_extras(f"{ORIGIN}/experiences.html"))]
    for e in EXPERIENCES:
        loc = f"{ORIGIN}/experiences.html?e={e}"
        exp_entries.append(url_entry(loc, TODAY, "weekly", "0.7",
                                     extras=hreflang_extras(loc)))
    write_sitemap("sitemap-experiences.xml", exp_entries)

    # categories.xml — filter views
    write_sitemap("sitemap-categories.xml",
        [url_entry(f"{ORIGIN}/?category={c}", TODAY, "weekly", "0.9",
                   extras=hreflang_extras(f"{ORIGIN}/?category={c}"))
         for c in CATEGORIES])

    # regions.xml — geo filter views
    write_sitemap("sitemap-regions.xml",
        [url_entry(f"{ORIGIN}/?region={r}", TODAY, "weekly", "0.8",
                   extras=hreflang_extras(f"{ORIGIN}/?region={r}"))
         for r in REGIONS])

    # beaches.xml — natural beach venues only (subset of clubs)
    NATURAL_BEACHES = re.findall(r"id:\s*['\"]([a-z0-9-]+)['\"]\s*,\s*name:[^,]*,\s*category:\s*['\"](?:sandy-beach|rocky-bay|natural)['\"]",
                                 (ROOT / "clubs-data.js").read_text())
    beach_entries = [url_entry(f"{ORIGIN}/club.html?club={b}", TODAY, "weekly", "0.7",
                                extras=hreflang_extras(f"{ORIGIN}/club.html?club={b}"))
                     for b in (NATURAL_BEACHES or CLUBS[:30])]  # fallback if regex misses
    write_sitemap("sitemap-beaches.xml", beach_entries)

    # sitemap.xml — index
    parts = ["pages","venues","experiences","beaches","regions","categories","guides"]
    body  = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for p in parts:
        body += f'  <sitemap><loc>{ORIGIN}/sitemap-{p}.xml</loc><lastmod>{TODAY}</lastmod></sitemap>\n'
    body += "</sitemapindex>\n"
    (ROOT / "sitemap.xml").write_text(body, encoding="utf-8")
    print(f"  sitemaps: pages={len(pg_entries)}  venues={len(CLUBS)}  guides={len(GUIDES)}  experiences={len(exp_entries)}  beaches={len(beach_entries)}  categories={len(CATEGORIES)}  regions={len(REGIONS)}")

# -----------------------------------------------------------
# 4. robots.txt
# -----------------------------------------------------------
def write_robots():
    body = f"""# Sunspot — robots.txt
User-agent: *
Allow: /
# Private transactional flows
Disallow: /checkout.html
Disallow: /confirmation.html
Disallow: /bookings.html
Disallow: /signin.html
Disallow: /account.html
Disallow: /booking.html
Disallow: /app.html
# JS/CSS must be crawlable for rendering
Allow: /*.css$
Allow: /*.js$
# Be polite — half a second between hits
Crawl-delay: 1

# Heavy AI scrapers — explicit opt-in only (block by default)
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: anthropic-ai
Disallow: /
User-agent: ClaudeBot
Disallow: /

Host: {ORIGIN.replace("https://","")}

Sitemap: {ORIGIN}/sitemap.xml
Sitemap: {ORIGIN}/sitemap-pages.xml
Sitemap: {ORIGIN}/sitemap-venues.xml
Sitemap: {ORIGIN}/sitemap-guides.xml
Sitemap: {ORIGIN}/sitemap-experiences.xml
Sitemap: {ORIGIN}/sitemap-beaches.xml
Sitemap: {ORIGIN}/sitemap-categories.xml
Sitemap: {ORIGIN}/sitemap-regions.xml
"""
    (ROOT / "robots.txt").write_text(body, encoding="utf-8")

# -----------------------------------------------------------
# 5. Per-page HTML patch
# -----------------------------------------------------------
HREFLANG_RX  = re.compile(r'<link\s+rel="alternate"\s+hreflang="[^"]+"[^>]*>')
CANONICAL_RX = re.compile(r'<link[^>]*\brel="canonical"[^>]*>')
ROBOTS_RX    = re.compile(r'<meta\s+name="robots"\s+content="[^"]*">')
HEAD_END_RX  = re.compile(r'</head>', re.I)
BODY_END_RX  = re.compile(r'</body>', re.I)
BREADCRUMB_MARK = "<!-- ssbc:breadcrumb-ld -->"
FAQ_MARK        = "<!-- ssbc:faq-ld -->"
EXPLORE_MARK    = "<!-- ssbc:explore-block -->"

def canonical_for(path: str) -> str:
    if path == "index.html": return f"{ORIGIN}/"
    return f"{ORIGIN}/{path}"

def breadcrumb_jsonld(path: str) -> str:
    chain = BREADCRUMBS.get(path) or [("Home","/")]
    items = [{
        "@type":"ListItem","position":i+1,"name":name,
        "item": ORIGIN + ("/" if href == "/" else href)
    } for i,(name,href) in enumerate(chain)]
    obj = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":items}
    return f'\n<script type="application/ld+json">{json.dumps(obj, separators=(",",":"))}</script>\n'

def hreflang_block(path: str) -> str:
    url = canonical_for(path)
    sep = "&" if "?" in url else "?"
    return (
        f'\n<link rel="alternate" hreflang="en-MT" href="{url}">\n'
        f'<link rel="alternate" hreflang="mt-MT" href="{url}{sep}lang=mt">\n'
        f'<link rel="alternate" hreflang="it-MT" href="{url}{sep}lang=it">\n'
        f'<link rel="alternate" hreflang="x-default" href="{url}">\n'
    )

EXPLORE_LINKS = [
    ("/",              "Browse beach clubs"),
    ("/experiences.html","Experiences & boat tours"),
    ("/guides.html",   "Field guides"),
    ("/visiting.html", "Plan your visit"),
    ("/living.html",   "For residents"),
    ("/faq.html",      "FAQ"),
    ("/about.html",    "About Sunspot"),
    ("/sitemap.html",  "Site map"),
]

def explore_block_html(current_path: str) -> str:
    items = []
    for href, label in EXPLORE_LINKS:
        # don't link to self
        if (current_path == "index.html" and href == "/") or current_path == href.lstrip("/"):
            continue
        items.append(f'<a href="{href}">{label}</a>')
    return (
        f"\n{EXPLORE_MARK}\n"
        '<nav class="ss-explore" aria-label="Explore Sunspot">\n'
        '  <div class="ss-explore-inner">\n'
        '    <span class="ss-explore-title">Explore Sunspot</span>\n'
        '    ' + "\n    ".join(items) + "\n"
        '  </div>\n'
        '</nav>\n'
    )

def patch_html(path: pathlib.Path):
    name = path.name
    if name in NOINDEX_PAGES:
        return False  # leave private pages alone
    src = path.read_text(encoding="utf-8")
    orig = src
    canonical = canonical_for(name)

    # 1. Canonical — replace if exists, else inject before </head>.
    #    Preserve `id="canonical"` if the existing tag has one — runtime JS
    #    on dynamic pages (club.html, guide.html) updates href via that id.
    m = CANONICAL_RX.search(src)
    preserve_id = bool(m and 'id="canonical"' in m.group(0))
    new_canon = (f'<link id="canonical" rel="canonical" href="{canonical}">' if preserve_id
                 else f'<link rel="canonical" href="{canonical}">')
    if m:
        src = CANONICAL_RX.sub(lambda _: new_canon, src, count=1)
    else:
        src = HEAD_END_RX.sub(lambda _: new_canon + "\n</head>", src, count=1)

    # 2. Robots — normalise (skip pages explicitly marked noindex)
    robots_dir = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    new_robots = f'<meta name="robots" content="{robots_dir}">'
    if ROBOTS_RX.search(src):
        # don't override an existing 'noindex' directive
        existing = ROBOTS_RX.search(src).group(0)
        if "noindex" not in existing:
            src = ROBOTS_RX.sub(lambda _: new_robots, src, count=1)
    else:
        src = HEAD_END_RX.sub(lambda _: new_robots + "\n</head>", src, count=1)

    # 3. Hreflang — strip all then inject fresh block. Also strip the orphan
    #    "<!-- hreflang ... -->" comment and collapse blank-line clutter left
    #    behind by previous passes.
    src = HREFLANG_RX.sub("", src)
    src = re.sub(r'<!--\s*hreflang[^>]*-->', "", src, flags=re.I)
    src = re.sub(r"\n{3,}", "\n\n", src)
    _hreflang = hreflang_block(name)
    src = HEAD_END_RX.sub(lambda _: _hreflang + "</head>", src, count=1)

    # 4. BreadcrumbList JSON-LD (idempotent via marker)
    if BREADCRUMB_MARK not in src:
        block = BREADCRUMB_MARK + breadcrumb_jsonld(name)
        src = HEAD_END_RX.sub(lambda _: block + "</head>", src, count=1)

    # 5. FAQPage JSON-LD on faq.html (extract Q/A from the page)
    if name == "faq.html" and FAQ_MARK not in src:
        qa_pairs = extract_faq(src)
        if qa_pairs:
            faq_obj = {
                "@context":"https://schema.org","@type":"FAQPage",
                "mainEntity":[{
                    "@type":"Question","name":q,
                    "acceptedAnswer":{"@type":"Answer","text":a}
                } for q,a in qa_pairs[:50]]
            }
            block = FAQ_MARK + f'\n<script type="application/ld+json">{json.dumps(faq_obj, separators=(",",":"))}</script>\n'
            src = HEAD_END_RX.sub(lambda _: block + "</head>", src, count=1)

    # 6. Explore internal-link footer block (skip transactional + 404)
    if EXPLORE_MARK not in src:
        explore = explore_block_html(name)
        src = BODY_END_RX.sub(lambda _: explore + "</body>", src, count=1)

    if src != orig:
        path.write_text(src, encoding="utf-8")
        return True
    return False

def extract_faq(html_src: str) -> list[tuple[str,str]]:
    """Very forgiving extractor: <details><summary>Q</summary><p>A</p></details> pairs."""
    pairs = []
    for m in re.finditer(r"<details[^>]*>\s*<summary[^>]*>(.+?)</summary>\s*(.+?)</details>", html_src, re.S|re.I):
        q = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        a = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2))).strip()
        if q and a: pairs.append((q, a))
    if pairs: return pairs
    # fallback: <h3>Q</h3><p>A</p>
    for m in re.finditer(r"<h[23][^>]*>(.+?)</h[23]>\s*<p[^>]*>(.+?)</p>", html_src, re.S|re.I):
        q = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        a = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(2))).strip()
        if q.endswith("?") and a: pairs.append((q, a))
    return pairs

# -----------------------------------------------------------
# 6. HTML sitemap (sitemap.html) — for users + crawlers
# -----------------------------------------------------------
def write_html_sitemap():
    section = lambda heading, items: (
        f'  <section><h2>{heading}</h2><ul>\n' +
        "\n".join(f'    <li><a href="{href}">{label}</a></li>' for href,label in items) +
        "\n  </ul></section>\n"
    )
    pages_items = [("/" if p["path"]=="index.html" else f"/{p['path']}", p["title"])
                   for p in PUBLIC_PAGES if not p.get("dynamic")]
    cats_items  = [(f"/?category={c}", c.replace("-"," ").title()) for c in CATEGORIES]
    regions_items = [(f"/?region={r}", r.title()) for r in REGIONS]
    venue_items = [(f"/club.html?club={c}", c.replace("-"," ").title()) for c in CLUBS]
    guide_items = [(f"/guide.html?g={g}", g.replace("-"," ").title()) for g in GUIDES]
    exp_items   = [(f"/experiences.html?e={e}", e.replace("-"," ").title()) for e in EXPERIENCES]

    head = f'''<!doctype html><html lang="en-MT"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Site map — Sunspot Malta</title>
<meta name="description" content="Complete index of every page on Sunspot — beach clubs, lidos, rooftop pools, experiences, guides and resources.">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{ORIGIN}/sitemap.html">
<link rel="stylesheet" href="styles.css">
<style>
  .ss-sitemap{{max-width:980px;margin:0 auto;padding:24px 18px 80px;font:16px/1.55 Inter,system-ui,sans-serif;color:#1f2937}}
  .ss-sitemap h1{{font:600 28px/1.2 Fraunces,Georgia,serif;margin:0 0 6px}}
  .ss-sitemap p.lead{{color:#4b5563;margin:0 0 28px}}
  .ss-sitemap section{{margin:0 0 28px;border-top:1px solid #e5e7eb;padding-top:18px}}
  .ss-sitemap h2{{font:600 16px/1.2 Inter,sans-serif;color:#111827;margin:0 0 12px;letter-spacing:-.01em}}
  .ss-sitemap ul{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 18px}}
  .ss-sitemap a{{color:#1f3a5f;text-decoration:none;border-bottom:1px solid transparent}}
  .ss-sitemap a:hover{{border-bottom-color:#1f3a5f}}
</style>
</head><body>
<main class="ss-sitemap">
  <h1>Site map</h1>
  <p class="lead">Every page on Sunspot, organised. {len(CLUBS)} venues · {len(GUIDES)} guides · {len(EXPERIENCES)} experiences.</p>
'''
    body = (
        section("Main pages",        pages_items) +
        section("Browse by category", cats_items) +
        section("Browse by region",   regions_items) +
        section(f"Beach clubs · lidos · rooftops ({len(CLUBS)})", venue_items) +
        section(f"Field guides ({len(GUIDES)})", guide_items) +
        section(f"Experiences ({len(EXPERIENCES)})", exp_items)
    )
    foot = "</main></body></html>\n"
    (ROOT / "sitemap.html").write_text(head + body + foot, encoding="utf-8")

# -----------------------------------------------------------
# Run
# -----------------------------------------------------------
def main():
    print("Sunspot SEO pass")
    print(f"  origin={ORIGIN}  date={TODAY}")
    regen_sitemaps()
    write_robots()
    write_html_sitemap()
    changed = 0
    for path in sorted(ROOT.glob("*.html")):
        if patch_html(path): changed += 1
    print(f"  HTML pages patched: {changed}")
    print("done")

if __name__ == "__main__":
    main()
