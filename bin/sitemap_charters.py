#!/usr/bin/env python3
"""Generate sitemap-charters.xml with one URL per individual charter.

Each charter at /charter.html?c=<id> gets its own sitemap entry so Google
indexes the deep editorial detail pages, not just the /charters hub.
"""
import json, pathlib, re, subprocess, datetime, html

ROOT   = pathlib.Path(__file__).resolve().parent.parent
ORIGIN = "https://sunspot.mt"
TODAY  = datetime.date.today().isoformat()

NODE = r"""
  const window = {};
  eval(require('fs').readFileSync(process.argv[1], 'utf8'));
  process.stdout.write(JSON.stringify(window.SUNSPOT_EXPERIENCES || []));
"""

def main():
    out = subprocess.check_output(
        ["node", "-e", NODE, str(ROOT / "experiences-data.js")],
        cwd=ROOT, text=True,
    )
    exps = json.loads(out)
    # Charter-class entries: private-charter + sunset-charters + sicily-day-cat + multi-hour boat-tours
    charters = [e for e in exps if e.get("cat") in ("private-charter",)
                or e.get("id") in ("sicily-day-cat", "yacht-day-charter")]
    entries = []
    for e in charters:
        loc = f"{ORIGIN}/charter.html?c={e['id']}"
        sep = "&"
        entries.append(
            "  <url>"
            f"<loc>{html.escape(loc)}</loc>"
            f"<lastmod>{TODAY}</lastmod>"
            "<changefreq>weekly</changefreq>"
            "<priority>0.85</priority>"
            f'<xhtml:link rel="alternate" hreflang="en-MT" href="{html.escape(loc)}"/>'
            f'<xhtml:link rel="alternate" hreflang="mt-MT" href="{html.escape(loc+sep+"lang=mt")}"/>'
            f'<xhtml:link rel="alternate" hreflang="it-MT" href="{html.escape(loc+sep+"lang=it")}"/>'
            f'<xhtml:link rel="alternate" hreflang="x-default" href="{html.escape(loc)}"/>'
            "</url>"
        )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap-charters.xml").write_text(body, encoding="utf-8")
    print(f"sitemap-charters.xml: {len(charters)} charter URLs")

    # Patch the index to include the new sitemap subset
    idx = ROOT / "sitemap.xml"
    src = idx.read_text(encoding="utf-8")
    if "sitemap-charters.xml" not in src:
        new = src.replace(
            f'<loc>{ORIGIN}/sitemap-experiences.xml</loc>',
            f'<loc>{ORIGIN}/sitemap-experiences.xml</loc></sitemap>\n'
            f'  <sitemap><loc>{ORIGIN}/sitemap-charters.xml</loc>',
        )
        # The above is fragile; safer to just append before the closing tag
        if "sitemap-charters.xml" not in new:
            new = src.replace(
                "</sitemapindex>",
                f'  <sitemap><loc>{ORIGIN}/sitemap-charters.xml</loc><lastmod>{TODAY}</lastmod></sitemap>\n</sitemapindex>'
            )
        idx.write_text(new, encoding="utf-8")
        print("sitemap.xml index updated to include sitemap-charters.xml")

if __name__ == "__main__":
    main()
