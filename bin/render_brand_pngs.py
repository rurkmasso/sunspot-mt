#!/usr/bin/env python3
"""Render SVG brand assets to PNG via headless Chromium.

Run any time the SVGs change:

    python3 bin/render_brand_pngs.py

Outputs:
  - og-cover.png            (1200x630)  — root, referenced by SEO meta
  - apple-touch-icon.png    (180x180)   — root, referenced by SEO meta
  - assets/brand/og-cover.png
  - assets/brand/apple-touch-icon.png
"""
from __future__ import annotations
import pathlib, base64
from playwright.sync_api import sync_playwright

ROOT  = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / "assets" / "brand"

JOBS = [
    {"src": BRAND / "og-cover.svg", "out": [ROOT / "og-cover.png", BRAND / "og-cover.png"], "w": 1200, "h": 630, "bg": "#0a1f3a"},
    {"src": BRAND / "mark.svg",     "out": [ROOT / "apple-touch-icon.png", BRAND / "apple-touch-icon.png"], "w": 180,  "h": 180,  "bg": "#fff5e1", "pad": 14},
    {"src": BRAND / "mark.svg",     "out": [ROOT / "favicon-32.png",  BRAND / "favicon-32.png"],  "w": 32,  "h": 32,  "bg": "transparent"},
    {"src": BRAND / "mark.svg",     "out": [ROOT / "favicon-192.png", BRAND / "favicon-192.png"], "w": 192, "h": 192, "bg": "transparent"},
    {"src": BRAND / "mark.svg",     "out": [ROOT / "favicon-512.png", BRAND / "favicon-512.png"], "w": 512, "h": 512, "bg": "transparent"},
]

def render(page, job):
    svg = job["src"].read_text(encoding="utf-8")
    pad = job.get("pad", 0)
    bg  = job["bg"]
    bg_rule = "transparent" if bg == "transparent" else bg
    html = f"""<!doctype html>
<html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap">
<style>
  html,body{{margin:0;padding:0;background:{bg_rule}}}
  body{{display:flex;align-items:center;justify-content:center;width:{job["w"]}px;height:{job["h"]}px;overflow:hidden}}
  svg{{display:block;width:{job["w"]-2*pad}px;height:{job["h"]-2*pad}px}}
</style></head>
<body>{svg}</body></html>"""
    page.set_viewport_size({"width": job["w"], "height": job["h"]})
    page.set_content(html, wait_until="networkidle")
    page.wait_for_timeout(900)  # let Fraunces actually paint
    omit_bg = (bg == "transparent")
    img_bytes = page.screenshot(omit_background=omit_bg, type="png", clip={"x":0,"y":0,"width":job["w"],"height":job["h"]})
    for out in job["out"]:
        out.write_bytes(img_bytes)
        print(f"  wrote {out.relative_to(ROOT)} ({len(img_bytes):,} bytes)")

def main():
    print("Rendering brand PNGs (headless Chromium)")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for job in JOBS:
            print(f"\n• {job['src'].name} → {job['w']}x{job['h']}")
            render(page, job)
        browser.close()
    print("\ndone")

if __name__ == "__main__":
    main()
