"""
Sunspot PDF brand kit — shared colours, page furniture, and styles for
every PDF we ship. Import this module from any *_pdf.py script:

  from pdf_brand import COLOURS, styles, on_page_branded, brand_cover

Sets the look across operator contacts / profits projection / how it
works / future decks so they all read as Sunspot.
"""
from pathlib import Path
import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle


# ─── Brand colours (same vars the website uses) ───────────────
COLOURS = {
    "ink":        colors.HexColor("#0a1f3a"),
    "ink_soft":   colors.HexColor("#1d2842"),
    "terracotta": colors.HexColor("#c0563b"),
    "sun":        colors.HexColor("#ef6c00"),
    "sun_light":  colors.HexColor("#ffb74d"),
    "honey":      colors.HexColor("#e89d3a"),
    "limestone":  colors.HexColor("#fdf6e8"),
    "limestone2": colors.HexColor("#f8edd6"),
    "muted":      colors.HexColor("#5d6a82"),
    "line":       colors.HexColor("#eee5d0"),
    "balcony":    colors.HexColor("#2f6e5b"),
    "card_alt":   colors.HexColor("#fbf8f2"),
}


def styles():
    """Returns the canonical paragraph style sheet for any Sunspot PDF."""
    base = getSampleStyleSheet()
    return {
        "H1": ParagraphStyle("H1", parent=base["Title"],
                             fontName="Helvetica-Bold",
                             fontSize=26, leading=30, textColor=COLOURS["ink"],
                             spaceAfter=4, alignment=0),
        "Sub": ParagraphStyle("Sub", parent=base["Normal"],
                              fontName="Helvetica-Oblique",
                              fontSize=10, textColor=COLOURS["muted"],
                              spaceAfter=18),
        "Kicker": ParagraphStyle("Kicker", parent=base["Normal"],
                                 fontName="Helvetica-Bold",
                                 fontSize=9, textColor=COLOURS["terracotta"],
                                 spaceAfter=6, leading=10),
        "H2":  ParagraphStyle("H2", parent=base["Heading2"],
                              fontName="Helvetica-Bold",
                              fontSize=16, textColor=COLOURS["terracotta"],
                              spaceBefore=18, spaceAfter=10),
        "H3":  ParagraphStyle("H3", parent=base["Heading3"],
                              fontName="Helvetica-Bold",
                              fontSize=12, textColor=COLOURS["ink"],
                              spaceBefore=12, spaceAfter=6),
        "Body": ParagraphStyle("Body", parent=base["Normal"],
                               fontName="Helvetica",
                               fontSize=10.5, leading=15, textColor=COLOURS["ink"],
                               spaceAfter=10),
        "Step": ParagraphStyle("Step", parent=base["Normal"],
                               fontName="Helvetica",
                               fontSize=10.5, leading=15, textColor=COLOURS["ink"],
                               leftIndent=20, spaceAfter=8),
        "Note": ParagraphStyle("Note", parent=base["Normal"],
                               fontName="Helvetica-Oblique",
                               fontSize=9, leading=12, textColor=COLOURS["muted"],
                               spaceAfter=10),
        "Big": ParagraphStyle("Big", parent=base["Normal"],
                              fontName="Helvetica-Bold",
                              fontSize=22, leading=24, textColor=COLOURS["sun"]),
        "Cell": ParagraphStyle("Cell", parent=base["Normal"],
                               fontName="Helvetica",
                               fontSize=9, leading=12, textColor=COLOURS["ink"]),
        "CellB": ParagraphStyle("CellB", parent=base["Normal"],
                                fontName="Helvetica-Bold",
                                fontSize=9, leading=12, textColor=COLOURS["ink"]),
    }


def branded_table(rows, col_widths, header=True):
    """Standard Sunspot table treatment — limestone header row, terracotta
    bottom rule, alternating cream rows."""
    S = styles()
    data = []
    for i, row in enumerate(rows):
        style = S["CellB"] if (i == 0 and header) else S["Cell"]
        data.append([Paragraph(str(c) if not isinstance(c, Paragraph) else c.text, style)
                     if not isinstance(c, Paragraph) else c
                     for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    ts = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1),
            [colors.white, COLOURS["card_alt"]]),
        ("LINEBELOW", (0, 0 if not header else 1), (-1, -1), 0.25, COLOURS["line"]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING",   (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
    ]
    if header:
        ts += [
            ("BACKGROUND", (0, 0), (-1, 0), COLOURS["limestone"]),
            ("LINEBELOW",  (0, 0), (-1, 0), 1.2, COLOURS["terracotta"]),
        ]
    t.setStyle(TableStyle(ts))
    return t


def on_page_branded(title):
    """Returns a `onFirstPage` / `onLaterPages` callback that paints the
    Sunspot header strip + footer on every page. Closure captures the title."""
    def draw(canvas, doc):
        w, h = A4
        # Top strip
        canvas.saveState()
        # Honey rule under top margin
        canvas.setStrokeColor(COLOURS["honey"])
        canvas.setLineWidth(0.6)
        canvas.line(18*mm, h - 14*mm, w - 18*mm, h - 14*mm)
        # Brand label
        canvas.setFont("Helvetica-Bold", 9)
        canvas.setFillColor(COLOURS["ink"])
        canvas.drawString(18*mm, h - 11*mm, "SUNSPOT")
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(COLOURS["muted"])
        canvas.drawRightString(w - 18*mm, h - 11*mm, title)
        # Footer
        canvas.setStrokeColor(COLOURS["line"])
        canvas.setLineWidth(0.4)
        canvas.line(18*mm, 14*mm, w - 18*mm, 14*mm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COLOURS["muted"])
        canvas.drawString(18*mm, 9*mm, "Sunspot Ltd · Valletta, Malta · hello@sunspot.mt · sunspot.mt")
        canvas.drawRightString(w - 18*mm, 9*mm, "Page %d" % doc.page)
        canvas.restoreState()
    return draw


def brand_cover(title, kicker="Sunspot", subtitle=""):
    """Returns a list of flowables for a branded cover block. Drop at the
    start of every PDF's `story`."""
    S = styles()
    today = datetime.date.today().strftime("%d %B %Y")
    flowables = [
        Paragraph(kicker.upper(), S["Kicker"]),
        Paragraph(title, S["H1"]),
        Paragraph(f"{subtitle + ' · ' if subtitle else ''}{today}", S["Sub"]),
    ]
    return flowables
