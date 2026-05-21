#!/usr/bin/env python3
"""Add heroImage to each guide by pulling the first photo of its first
linked venue. So sunsets guide → Café del Mar hero, Comino guide → Blue
Lagoon hero, etc. No more emoji heroes."""
import re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GUIDES = ROOT / "guides-data.js"
CLUBS  = ROOT / "clubs-data.js"

# Build venue → first photo map
clubs_text = CLUBS.read_text()
venue_photo = {}
pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
matches = list(pat.finditer(clubs_text))
for i, m in enumerate(matches):
    vid = m.group(1)
    start, end = m.start(), matches[i+1].start() if i+1 < len(matches) else len(clubs_text)
    block = clubs_text[start:end]
    pm = re.search(r"photos:\s*\[(.*?)\]", block, re.DOTALL)
    if pm:
        urls = re.findall(r"['\"](https?://[^'\"]+)['\"]", pm.group(1))
        wb = re.findall(r"WB\s*\+\s*['\"]([^'\"]+)['\"]", pm.group(1))
        if urls: venue_photo[vid] = urls[0]
        elif wb: venue_photo[vid] = "https://whichbeach.com.mt/wp-content/uploads/" + wb[0]

# Add heroImage to each guide based on its first listed venue
guides_text = GUIDES.read_text()
patched = 0
def add_hero(m):
    global patched
    block = m.group(0)
    # Find first venue id in the venues array
    vm = re.search(r"venues:\s*\[\s*['\"]([a-z0-9\-]+)['\"]", block)
    if not vm:
        return block
    photo = venue_photo.get(vm.group(1), "")
    if not photo:
        return block
    # Replace heroEmoji line with heroImage
    if "heroImage:" in block:
        return block
    new_block = re.sub(
        r"(heroEmoji:\s*'[^']*',)",
        r"\1\n heroImage: '" + photo + "',",
        block, count=1,
    )
    if new_block != block:
        patched += 1
    return new_block

# Operate on each guide object
guides_pat = re.compile(r"\{\s*slug:.*?(?=\n\s*\},?\s*(?:\{|\]))", re.DOTALL)
new_text = guides_pat.sub(add_hero, guides_text)
GUIDES.write_text(new_text)
print(f"Added heroImage to {patched} guides")
