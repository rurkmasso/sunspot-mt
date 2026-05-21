#!/usr/bin/env python3
"""Cleanup pass — my prior regex broke when an existing description
contained an apostrophe (the `[^"\']` class terminated the match early
at `Malta's`), producing concatenated junk like
  content="New text.'s old text continues here">
This script finds those breaks and replaces the description with the
clean canonical one from seo_fix.py's PAGES table.
"""
import re
from pathlib import Path
from seo_fix import PAGES  # type: ignore

ROOT = Path(__file__).resolve().parent.parent

# Robust regex — only allow chars that aren't the matching outer quote.
DESC_DOUBLE = re.compile(r'(<meta[^>]*name=["\']description["\'][^>]*content=")[^"]*(")', re.IGNORECASE)
OG_DESC     = re.compile(r'(<meta[^>]*property=["\']og:description["\'][^>]*content=")[^"]*(")', re.IGNORECASE)
TW_DESC     = re.compile(r'(<meta[^>]*name=["\']twitter:description["\'][^>]*content=")[^"]*(")', re.IGNORECASE)
TITLE       = re.compile(r"<title>.*?</title>", re.IGNORECASE | re.DOTALL)


def looks_broken(text):
    # The breakage signature: a description that ends with `."` mid-sentence
    # OR contains `>.` `<.` near apostrophes etc. Simplest: contains '.s ' or
    # '."s' or duplicate periods that suggest concatenation.
    m = DESC_DOUBLE.search(text)
    if not m:
        return False
    content = re.search(r'content="([^"]*)"', m.group(0)).group(1)
    # Heuristic: original had Malta's and our text ends in a period,
    # so the broken concat looks like "Real-time availability across Malta's beach clubs.'s best beach clubs..."
    return ".'s " in content or "..'s" in content or content.count(". ") > 4


def fix_file(name, cfg):
    p = ROOT / name
    if not p.exists():
        return
    text = p.read_text()
    orig = text
    desc = cfg["description"]
    title = cfg["title"]

    # If we detect breakage, force-replace description, og:description, twitter:description
    if looks_broken(text):
        text = DESC_DOUBLE.sub(r'\1' + desc + r'\2', text, count=1)
        text = OG_DESC.sub(r'\1' + desc + r'\2', text, count=1)
        text = TW_DESC.sub(r'\1' + desc + r'\2', text, count=1)
        print(f"  FIXED descriptions in {name}")

    # Same for titles — force replace if too short OR contains "title (too short)"
    m = TITLE.search(text)
    if m:
        cur = re.sub(r"<.*?>", "", m.group(0)).strip()
        if len(cur) < 30:
            text = TITLE.sub(f"<title>{title}</title>", text, count=1)
            print(f"  FIXED title in {name}: {cur} → {title}")

    if text != orig:
        p.write_text(text)


def main():
    for name, cfg in PAGES.items():
        fix_file(name, cfg)
    print("\nDone.")


if __name__ == "__main__":
    main()
