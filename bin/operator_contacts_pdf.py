#!/usr/bin/env python3
"""
Generate an operator contacts PDF from clubs-data.js.

Per venue, pulls:
  - id, name, category, region, location
  - website, phone, email
  - social links (Instagram, Facebook, TripAdvisor)
  - notes column (bookable / capacity / sunbedFrom)

Output: bin/sunspot_operator_contacts.pdf
Re-run any time the data changes.
"""
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)

from pdf_brand import COLOURS, styles as brand_styles, on_page_branded, brand_cover

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "clubs-data.js"
OUT_PDF = ROOT / "bin" / "sunspot_operator_contacts.pdf"


def extract_venues():
    text = DATA_FILE.read_text()
    pat = re.compile(r"id:\s*['\"]([a-z0-9\-]+)['\"]")
    matches = list(pat.finditer(text))
    venues = []
    for i, m in enumerate(matches):
        vid = m.group(1)
        start, end = m.start(), matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]

        def field(rx, default=""):
            r = re.search(rx, block, re.DOTALL)
            return r.group(1).strip() if r else default

        def bool_field(rx):
            r = re.search(rx, block)
            return r and r.group(1) == "true"

        def int_field(rx):
            r = re.search(rx, block)
            return int(r.group(1)) if r else None

        socials_block = field(r"socials:\s*\{([^}]*)\}", "")
        def social(name):
            r = re.search(name + r":\s*['\"]([^'\"]*)['\"]", socials_block)
            return r.group(1).strip() if r else ""

        venues.append({
            "id": vid,
            "name":      field(r"name:\s*['\"]([^'\"]+)['\"]"),
            "category":  field(r"category:\s*['\"]([^'\"]+)['\"]"),
            "region":    field(r"region:\s*['\"]([^'\"]+)['\"]"),
            "location":  field(r"location:\s*['\"]([^'\"]+)['\"]"),
            "website":   field(r"website:\s*['\"]([^'\"]*)['\"]"),
            "phone":     field(r"phone:\s*['\"]([^'\"]*)['\"]"),
            "email":     field(r"email:\s*['\"]([^'\"]*)['\"]"),
            "instagram": social("instagram"),
            "facebook":  social("facebook"),
            "tripadvisor": social("tripadvisor"),
            "hasBookable": bool_field(r"hasBookableSunbeds:\s*(true|false)"),
            "sunbedFrom": int_field(r"sunbedFrom:\s*(\d+)"),
        })
    return venues


def link(url):
    if not url:
        return ""
    if not url.startswith("http"):
        url = "https://" + url
    return f'<link href="{url}" color="#0288d1">{url}</link>'


def ig_link(handle):
    if not handle:
        return ""
    if handle.startswith("http"):
        return link(handle)
    return f'<link href="https://instagram.com/{handle}" color="#0288d1">@{handle}</link>'


def fb_link(handle):
    if not handle:
        return ""
    if handle.startswith("http"):
        return link(handle)
    return f'<link href="https://facebook.com/{handle}" color="#0288d1">{handle}</link>'


def email_link(email):
    if not email:
        return ""
    return f'<link href="mailto:{email}" color="#ef6c00">{email}</link>'


def phone_link(phone):
    if not phone:
        return ""
    safe = re.sub(r"[^\d+]", "", phone)
    return f'<link href="tel:{safe}" color="#ef6c00">{phone}</link>'


def main():
    venues = extract_venues()
    venues.sort(key=lambda v: (v["region"] or "", v["name"]))

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=landscape(A4),
        leftMargin=14 * mm, rightMargin=14 * mm,
        topMargin=22 * mm, bottomMargin=22 * mm,
        title="Sunspot — Operator contacts",
        author="Sunspot Ltd",
    )

    S = brand_styles()
    H1 = S["H1"]
    SUB = S["Sub"]
    REGION = ParagraphStyle("Region", parent=getSampleStyleSheet()["Heading2"],
                            fontName="Helvetica-Bold", fontSize=13,
                            textColor=COLOURS["terracotta"], spaceBefore=14, spaceAfter=8)
    CELL = ParagraphStyle("Cell", parent=getSampleStyleSheet()["Normal"],
                          fontName="Helvetica", fontSize=8, leading=10,
                          textColor=COLOURS["ink"])
    MUTED = S["Note"]

    story = []
    story.extend(brand_cover(
        "Operator contacts",
        kicker="Master reference — internal use",
        subtitle=f"{len(venues)} venues across Malta, Gozo and Comino",
    ))

    # Summary stats
    bookable = sum(1 for v in venues if v["hasBookable"])
    with_email = sum(1 for v in venues if v["email"])
    with_phone = sum(1 for v in venues if v["phone"])
    with_site  = sum(1 for v in venues if v["website"])
    story.append(Paragraph(
        f"<b>{len(venues)}</b> total · <b>{bookable}</b> bookable · "
        f"<b>{with_email}</b> with email · <b>{with_phone}</b> with phone · "
        f"<b>{with_site}</b> with website", SUB))

    # Group by region
    by_region = {}
    for v in venues:
        by_region.setdefault(v["region"] or "(unspecified)", []).append(v)

    REGION_LABEL = {
        "central": "Central — Sliema, St Julian's, Valletta",
        "north":   "North — Mellieha, Bugibba, Qawra, Golden Bay",
        "south":   "South — Marsaxlokk, Birzebbuga, Marsascala",
        "gozo":    "Gozo",
        "comino":  "Comino",
    }

    for region in sorted(by_region.keys()):
        story.append(Paragraph(REGION_LABEL.get(region, region.title()), REGION))

        # Build table: Name | Category | Location | Phone | Email | Website | Socials
        header = [
            Paragraph("<b>Venue</b>",    CELL),
            Paragraph("<b>Type</b>",     CELL),
            Paragraph("<b>Location</b>", CELL),
            Paragraph("<b>Phone</b>",    CELL),
            Paragraph("<b>Email</b>",    CELL),
            Paragraph("<b>Website</b>",  CELL),
            Paragraph("<b>Socials</b>",  CELL),
        ]
        rows = [header]
        for v in by_region[region]:
            socials_parts = []
            if v["instagram"]:  socials_parts.append("IG " + ig_link(v["instagram"]))
            if v["facebook"]:   socials_parts.append("FB " + fb_link(v["facebook"]))
            if v["tripadvisor"]: socials_parts.append("TA " + link(v["tripadvisor"]))
            socials = "<br/>".join(socials_parts) or "—"

            name_block = (
                f"<b>{v['name']}</b>"
                + (f'<br/><font color="#8a7048" size="6">ID: {v["id"]}</font>'
                   if v["id"] else "")
                + (f'<br/><font color="#2e7d32" size="6">BOOKABLE — from EUR {v["sunbedFrom"]}</font>'
                   if v["hasBookable"] and v["sunbedFrom"] else "")
            )

            rows.append([
                Paragraph(name_block, CELL),
                Paragraph((v["category"] or "—").replace("-", " "), CELL),
                Paragraph(v["location"] or "—", CELL),
                Paragraph(phone_link(v["phone"]) or "—", CELL),
                Paragraph(email_link(v["email"]) or "—", CELL),
                Paragraph(link(v["website"]) or "—", CELL),
                Paragraph(socials, CELL),
            ])

        col_widths = [42*mm, 22*mm, 36*mm, 30*mm, 50*mm, 50*mm, 42*mm]
        tbl = Table(rows, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fdf6e8")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.HexColor("#0a1f3a")),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, 0), 8),
            ("LINEBELOW",  (0, 0), (-1, 0), 0.8, colors.HexColor("#c0563b")),
            ("LINEBELOW",  (0, 1), (-1, -1), 0.3, colors.HexColor("#eee5d0")),
            ("VALIGN",     (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                [colors.white, colors.HexColor("#fbf8f2")]),
            ("LEFTPADDING",  (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 6))

    # Sunspot internal contacts at end
    story.append(PageBreak())
    story.append(Paragraph("Sunspot internal team", REGION))
    intern = [[
        Paragraph("<b>Role</b>", CELL),
        Paragraph("<b>Name</b>", CELL),
        Paragraph("<b>Email</b>", CELL),
        Paragraph("<b>Phone</b>", CELL),
    ]]
    intern += [
        [Paragraph("Founder & Editor", CELL),     Paragraph("Mark Russo",         CELL), Paragraph(email_link("mark@sunspot.mt"),     CELL), Paragraph(phone_link("+356 9923 9339"), CELL)],
        [Paragraph("Editorial team",   CELL),     Paragraph("Sunspot Editorial",  CELL), Paragraph(email_link("editorial@sunspot.mt"),CELL), Paragraph("—", CELL)],
        [Paragraph("Operator success", CELL),     Paragraph("Partner onboarding", CELL), Paragraph(email_link("partners@sunspot.mt"), CELL), Paragraph(phone_link("+356 9923 9339"), CELL)],
        [Paragraph("General",          CELL),     Paragraph("Anyone",             CELL), Paragraph(email_link("hello@sunspot.mt"),    CELL), Paragraph(phone_link("+356 9923 9339"), CELL)],
    ]
    tbl = Table(intern, colWidths=[40*mm, 50*mm, 55*mm, 40*mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fdf6e8")),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("LINEBELOW",  (0, 0), (-1, 0), 0.8, colors.HexColor("#c0563b")),
        ("LINEBELOW",  (0, 1), (-1, -1), 0.3, colors.HexColor("#eee5d0")),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)

    story.append(Spacer(1, 18))
    story.append(Paragraph(
        '<i>Generated from clubs-data.js. Re-run <b>python3 bin/operator_contacts_pdf.py</b> '
        'after editing venue records to refresh.</i>', MUTED))

    branded = on_page_branded("Operator contacts")
    doc.build(story, onFirstPage=branded, onLaterPages=branded)
    print(f"Generated {OUT_PDF} ({len(venues)} venues across {len(by_region)} regions)")


if __name__ == "__main__":
    main()
