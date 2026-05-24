#!/usr/bin/env python3
"""Site-wide performance pass.

What it does:
  1. Adds `defer` to every <script src="..."> that doesn't already have
     it AND isn't gate.js (which must block to hide the page until login).
  2. Adds `loading="lazy"` + `decoding="async"` to every <img> that
     doesn't already have it. Skips images marked fetchpriority="high"
     (those are hero/LCP images we want eagerly loaded).
  3. Adds preconnect hints for whichbeach.com.mt + nomaisland.com etc.
     (the photo CDNs) so the browser opens TCP/TLS sockets sooner.
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = sorted(p for p in ROOT.glob("*.html"))

PRECONNECT = (
    '<link rel="preconnect" href="https://whichbeach.com.mt">\n'
    '<link rel="dns-prefetch" href="https://whichbeach.com.mt">'
)

SCRIPT_RX = re.compile(r'<script\s+src="([^"]+)"([^>]*)></script>')
IMG_RX    = re.compile(r'<img\b([^>]*?)>', re.IGNORECASE)

def patch(text):
    changes = []

    # 1. defer all <script src="..."> except gate.js / those already deferred
    def script_sub(m):
        src = m.group(1)
        attrs = m.group(2)
        if 'defer' in attrs or 'async' in attrs:
            return m.group(0)
        if 'gate.js' in src:
            return m.group(0)  # MUST block — hides page until login
        return f'<script src="{src}"{attrs} defer></script>'
    new_text = SCRIPT_RX.sub(script_sub, text)
    if new_text != text:
        before = len(SCRIPT_RX.findall(text))
        after_with_defer = sum(1 for m in SCRIPT_RX.finditer(new_text) if 'defer' in m.group(2) or 'gate.js' in m.group(1))
        changes.append(f"deferred scripts")
    text = new_text

    # 2. lazy + async-decode on <img> tags
    def img_sub(m):
        attrs = m.group(1)
        if 'loading=' in attrs or 'fetchpriority=' in attrs:
            return m.group(0)
        return f'<img loading="lazy" decoding="async"{attrs}>'
    new_text = IMG_RX.sub(img_sub, text)
    if new_text != text:
        changes.append("lazy imgs")
    text = new_text

    # 3. preconnect to whichbeach if it isn't already preconnected
    if 'whichbeach.com.mt' not in text:
        # No images point at whichbeach on this page — skip
        pass
    elif 'preconnect" href="https://whichbeach' not in text:
        # Insert before the existing preconnects (right after charset or viewport)
        new_text = text.replace(
            '<link rel="preconnect" href="https://fonts.googleapis.com">',
            PRECONNECT + '\n<link rel="preconnect" href="https://fonts.googleapis.com">',
            1,
        )
        if new_text != text:
            changes.append("preconnect whichbeach")
        text = new_text

    return text, changes


def main():
    total = 0
    for p in PAGES:
        text = p.read_text()
        new_text, changes = patch(text)
        if new_text != text:
            p.write_text(new_text)
            print(f"  {p.name:25s} → {', '.join(changes)}")
            total += 1
    print(f"\nPatched {total} pages")


if __name__ == "__main__":
    main()
