#!/usr/bin/env python3
"""Remove confirmed duplicate venue entries from clubs-data.js.

Operates on the JavaScript source directly (not via Node load + write,
which would lose formatting). Reads each {…} block, drops the ones in
DUPLICATES, and preserves the rest verbatim.

Idempotent. Re-run any time you spot more duplicates — list them in
DUPLICATES.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC  = ROOT / "clubs-data.js"

# IDs to drop. Each row: (id, "reason this is a duplicate").
DUPLICATES = [
    ("gnejna-bay",         "duplicate of `gnejna` (Gnejna Bay) — same coords, same beach"),
    ("birzebbuga-pretty",  "duplicate of `pretty-bay` (Pretty Bay) — same public beach"),
    ("san-blas-cove",      "duplicate of `san-blas-bay` — same red-sand cove"),
    ("inland-sea-dwejra-2","duplicate of `dwejra` — same inland sea lagoon"),
]

def main():
    src = SRC.read_text(encoding="utf-8")
    removed = []
    for vid, reason in DUPLICATES:
        # Match the venue's opening brace through to its closing brace + comma.
        # Each venue entry starts with `{ id: "vid"` or `{ id: 'vid'` and ends
        # at the next `},\n` at the same indent level. The catalogue's blocks
        # are all one logical "object" — find the open brace, count braces
        # forward until balanced, then drop including a trailing comma+newline.
        pat = re.compile(r"\{\s*id:\s*['\"]" + re.escape(vid) + r"['\"]")
        m = pat.search(src)
        if not m:
            print(f"  not found: {vid}")
            continue
        i = m.start()
        # Find the matching closing brace, respecting string literals.
        depth = 0
        j = i
        in_str = None
        while j < len(src):
            ch = src[j]
            if in_str:
                if ch == "\\" and j + 1 < len(src):
                    j += 2; continue
                if ch == in_str: in_str = None
            else:
                if ch in "'\"": in_str = ch
                elif ch == "{":  depth += 1
                elif ch == "}":  depth -= 1;
                if depth == 0 and ch == "}": j += 1; break
            j += 1
        # Eat trailing comma + whitespace so the JS stays valid.
        k = j
        while k < len(src) and src[k] in " \t\r,":
            k += 1
        # Preserve a single trailing newline.
        if k < len(src) and src[k] == "\n": k += 1
        src = src[:i] + src[k:]
        removed.append((vid, reason))

    SRC.write_text(src, encoding="utf-8")
    print(f"Removed {len(removed)} duplicate venue(s):")
    for vid, reason in removed:
        print(f"  - {vid:24s}  ({reason})")

if __name__ == "__main__":
    main()
