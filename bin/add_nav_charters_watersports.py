#!/usr/bin/env python3
"""Inject the Charters + Watersports nav links into every page's <nav>.

Idempotent — re-running is a no-op once both links are present.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Look for the existing Experiences link as the anchor — we insert the two
# new links immediately after it. Matches:
#   <a href="experiences.html" …>Experiences</a>
EXP_LINK = re.compile(
    r'(<a\s+href="experiences\.html"[^>]*>\s*Experiences\s*</a>)',
    re.I,
)
INSERT = (
    '\n<a href="charters.html">Charters</a>'
    '\n<a href="watersports.html">Watersports</a>'
)

def patch(path: pathlib.Path) -> bool:
    src = path.read_text(encoding="utf-8")
    if 'href="charters.html"' in src and 'href="watersports.html"' in src:
        return False  # already done
    if not EXP_LINK.search(src):
        return False
    new = EXP_LINK.sub(lambda m: m.group(1) + INSERT, src, count=1)
    if new == src: return False
    path.write_text(new, encoding="utf-8")
    return True

def main():
    changed = []
    for p in sorted(ROOT.glob("*.html")):
        if patch(p): changed.append(p.name)
    print(f"Added Charters + Watersports nav to {len(changed)} pages")
    for n in changed: print(f"  • {n}")

if __name__ == "__main__":
    main()
