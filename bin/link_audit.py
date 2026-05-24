#!/usr/bin/env python3
"""Find broken internal links across every HTML page.

Checks every href + src that points to a local file and verifies it
exists on disk. Skips:
  - http(s):// (external — already verified by verify_photos)
  - mailto: / tel: / #anchors
  - {{template}} placeholders if any

Reports per-page list of broken links + a global tally.
"""
import re
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
PAGES = list(ROOT.glob("*.html")) + list((ROOT / "shop").glob("*.html"))
PAGES += list((ROOT / "operator").glob("*.html"))

# Match href="..." and src="..." values
HREF_RX = re.compile(r'\b(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)


def is_external(url):
    return url.startswith(("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:"))


def resolve(page_path, link):
    # Strip query and fragment
    link = link.split("#")[0].split("?")[0]
    if not link:
        return None
    if is_external(link):
        return None
    # Absolute path (starts with /) — relative to repo root
    if link.startswith("/"):
        target = ROOT / link.lstrip("/")
    else:
        target = page_path.parent / link
    return target.resolve()


def main():
    broken_by_page = defaultdict(list)
    checked = 0
    for page in PAGES:
        try:
            text = page.read_text(errors="ignore")
        except Exception:
            continue
        seen = set()
        for m in HREF_RX.finditer(text):
            link = m.group(1)
            if link in seen:
                continue
            seen.add(link)
            checked += 1
            target = resolve(page, link)
            if target is None:
                continue
            if not target.exists():
                broken_by_page[str(page.relative_to(ROOT))].append(link)

    print(f"Checked {checked} unique link references across {len(PAGES)} pages\n")
    if not broken_by_page:
        print("All internal links resolve.")
        return 0
    total = sum(len(v) for v in broken_by_page.values())
    print(f"BROKEN: {total} across {len(broken_by_page)} pages\n")
    for page, links in sorted(broken_by_page.items()):
        print(f"  {page}:")
        for link in links:
            print(f"    ✗ {link}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
