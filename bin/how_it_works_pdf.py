#!/usr/bin/env python3
"""
Sunspot — how the platform works (PDF brief).

For investors, partners and operators who want to understand the full
shape of the platform without reading code. Three audiences:
customer, operator, Sunspot HQ — each their own flow.

Output: bin/sunspot_how_it_works.pdf
"""
import datetime
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image,
)
from pdf_brand import COLOURS, styles as brand_styles, on_page_branded, brand_cover

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "bin" / "sunspot_how_it_works.pdf"

INK       = COLOURS["ink"]
TERRA     = COLOURS["terracotta"]
SUN       = COLOURS["sun"]
HONEY     = COLOURS["honey"]
LIMESTONE = COLOURS["limestone"]
MUTED     = COLOURS["muted"]
LINE      = COLOURS["line"]


def make_styles():
    return brand_styles()


def step_table(rows):
    """Numbered step list as a 2-col table — number circle + body."""
    st = getSampleStyleSheet()
    num_style = ParagraphStyle("N", parent=st["Normal"], fontName="Helvetica-Bold",
                               fontSize=14, textColor=colors.white, alignment=1, leading=18)
    txt_style = ParagraphStyle("T", parent=st["Normal"], fontName="Helvetica",
                               fontSize=10.5, leading=15, textColor=INK)
    data = []
    for i, line in enumerate(rows, 1):
        data.append([
            Paragraph(str(i), num_style),
            Paragraph(line, txt_style),
        ])
    tbl = Table(data, colWidths=[12*mm, 160*mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), SUN),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",   (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
        ("LEFTPADDING",  (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ]))
    return tbl


def main():
    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=22*mm, bottomMargin=22*mm,
        title="Sunspot — how it works",
        author="Sunspot Ltd",
    )
    S = make_styles()
    s = []

    # ─── Cover ───
    s.extend(brand_cover(
        "How it works",
        kicker="Platform brief — 4 pages",
        subtitle="Customer · Operator · Sunspot HQ",
    ))

    # ─── What it is ───
    s.append(Paragraph("What Sunspot is, in one paragraph", S["H2"]))
    s.append(Paragraph(
        "Sunspot is a marketplace for Maltese beach venues. Customers reserve the exact sunbed, "
        "cabana or VIP gazebo they want, pay through us, and present a QR code at the gate. "
        "Operators get bookings on their phone, accept or decline, and receive weekly bank "
        "payouts. Sunspot takes 8% of each transaction; the operator keeps the other 92% with "
        "no listing fees, no monthly minimums, no exclusivity. Built in Valletta. 112 venues "
        "across Malta, Gozo and Comino at launch.",
        S["Body"]))

    # ─── Three audiences ───
    s.append(Paragraph("Three audiences, three surfaces", S["H2"]))
    s.append(Paragraph(
        "Each audience has a different surface. They share the same data backbone.",
        S["Body"]))

    aud = [
        ["Audience",  "Surface",                   "What they do"],
        ["Customer",  "sunspot.mt (public site)",  "Browse, pick a spot, pay, get a QR"],
        ["Operator",  "sunspot.mt/operator/ (PWA)", "Accept bookings, scan QR, manage layout"],
        ["Sunspot HQ + power operator", "WordPress admin", "Onboard venues, override actions, edit content"],
    ]
    tbl = Table([[Paragraph(c, S["Cell"]) for c in r] for r in aud],
                colWidths=[40*mm, 60*mm, 72*mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIMESTONE),
        ("LINEBELOW", (0, 0), (-1, 0), 1, TERRA),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fbf8f2")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    s.append(tbl)
    s.append(Spacer(1, 10))

    # ─── Customer flow ───
    s.append(PageBreak())
    s.append(Paragraph("The customer flow", S["H2"]))
    s.append(Paragraph("From landing page to checked-in, end to end.", S["Note"]))
    s.append(step_table([
        "<b>Land on sunspot.mt</b>. Live header strip shows how many sunbeds are bookable right now, the sea temperature, and tonight's sunset time.",
        "<b>Browse 112 venues</b> by region (Sliema, Gozo, Comino…) or category (beach club, lido, rooftop, floating). The Map toggle plots them all on Malta with click-through.",
        "<b>Tap a venue</b> → full detail page with photos, hours, amenities, location.",
        "<b>Reserve</b> opens the booking page with the live blueprint of the venue. Tap the exact sunbed, cabana or VIP gazebo — each is colour-coded and price-tagged.",
        "<b>Pick a date + guest count</b>, see the live total update as you add or remove spots.",
        "<b>Checkout</b> — name, email, phone, card (or Apple/Google Pay). Stripe handles payment, with a 10-minute hold so nobody else can grab the spot while you finish.",
        "<b>Confirmation</b> page shows a branded receipt ticket with the venue, your spots, the QR code and the booking reference (BJ-1234-XY format).",
        "<b>Day-of</b> — show the QR at the gate. Operator scans it and your status flips to 'arrived'. Free cancellation up to 24 hours before.",
        "<b>My bookings</b> — every reservation in one place, status updates live (Pending → Confirmed by venue → Checked in) without refreshing.",
    ]))

    # ─── Operator flow ───
    s.append(PageBreak())
    s.append(Paragraph("The operator flow", S["H2"]))
    s.append(Paragraph(
        "Operators install the PWA from sunspot.mt/operator/ — adds to home screen like a real app.",
        S["Note"]))
    s.append(step_table([
        "<b>Onboard</b>: Sunspot HQ creates the venue in WordPress, assigns the operator as the author of that post. Operator gets a temporary password.",
        "<b>First sign-in</b> — operator picks their venue from a card-based switcher (they only ever see their own venues; never competitors').",
        "<b>Set up the layout</b> in the Layout tab — one-click templates for Pool club / Beach club / Rooftop / Lido give them a full venue in seconds. Drag to fine-tune, add or remove spots, set per-spot prices.",
        "<b>Connect Stripe</b> (one-time KYC via Stripe Connect Express) — sets up weekly bank payouts to the operator's IBAN.",
        "<b>Wake up to bookings</b> on the Today tab. The live hero shows occupied / pending arrivals / checked in. Activity feed: 'Lara M. checked in to A12 · 2 min ago'.",
        "<b>Accept or decline</b> each booking with one tap. Customer is notified by email and live in their My bookings page. Declined bookings auto-refund and free the spot.",
        "<b>Walk-ins</b> via the floating + button — staff captures a cash-paying guest in 5 seconds.",
        "<b>Gate scan</b> — tap Scan in the bottom nav, point the phone camera at the QR, status flips to 'arrived' instantly.",
        "<b>Stats tab</b> — weekly bookings, revenue, payout amount, top booking days.",
        "<b>Sunday midnight</b> — Stripe auto-payout. 92% to the operator's IBAN, 8% to Sunspot. Operator sees it in the Stats tab on Monday.",
    ]))

    # ─── Sunspot HQ flow ───
    s.append(PageBreak())
    s.append(Paragraph("The Sunspot HQ flow", S["H2"]))
    s.append(Paragraph(
        "What we do day-to-day in WordPress admin. The 'power operator' subset is what we give "
        "to operators who outgrow the PWA and need bulk tools.",
        S["Note"]))
    s.append(step_table([
        "<b>Onboard a new operator</b>: WP admin → Users → Add new → role Venue Operator. Send them their app password.",
        "<b>Create their venue post</b> → set photos, hours, amenities, location, sunbed prices. Assign them as the post author so they're scoped to that venue server-side.",
        "<b>Bulk-import</b> when listing many venues at once via the CSV importer.",
        "<b>Monitor</b> the booking queue across all venues (admin sees everything; operators only see their own).",
        "<b>Override</b> when an operator can't (manual refund, force-cancel, swap a booking to a different venue).",
        "<b>Edit content</b> — Field Guide articles, FAQ entries, partner experiences, all CPTs in WP.",
        "<b>Weekly</b> — Stripe payouts run automatically; we check the Stats dashboard for anomalies (unusual cancellation rate, stuck holds, etc.).",
    ]))

    # ─── Trust + safety ───
    s.append(PageBreak())
    s.append(Paragraph("Trust, safety, and what makes us different", S["H2"]))

    s.append(Paragraph("Double-booking is physically impossible", S["H3"]))
    s.append(Paragraph(
        "Custom MySQL table <b>wp_sunspot_holds</b> with a UNIQUE constraint on (venue, spot, "
        "date, status). Even if two browsers race for the same sunbed, the second INSERT throws "
        "a duplicate-key error and that customer sees \"this spot was just taken\". No race "
        "condition is possible at the database layer.",
        S["Body"]))

    s.append(Paragraph("Operators only see their own venues", S["H3"]))
    s.append(Paragraph(
        "Every operator REST endpoint is gated by capability check + own-venue scope via "
        "<b>sunspot_my_venue_slugs()</b>. Even with a valid JWT, an operator cannot read "
        "another operator's bookings, layout, or stats. Verified server-side; not a UI illusion.",
        S["Body"]))

    s.append(Paragraph("Idempotent Stripe webhook", S["H3"]))
    s.append(Paragraph(
        "Stripe occasionally re-delivers webhook events. We track the last 500 event IDs and "
        "short-circuit replays. Belt-and-braces lookup by <b>_stripe_pi</b> ensures we never "
        "create a duplicate booking even if both safeguards fail.",
        S["Body"]))

    s.append(Paragraph("Editorial integrity", S["H3"]))
    s.append(Paragraph(
        "Sponsored guide articles are labelled at the top, not hidden in a footnote. Featured "
        "placements don't buy positive reviews — we've turned down sponsorships for venues we "
        "wouldn't recommend. All published rates are on the public rate card.",
        S["Body"]))

    # ─── Footer ───
    today = datetime.date.today().strftime("%d %B %Y")
    s.append(Spacer(1, 14))
    s.append(Paragraph(
        f"<i>Generated {today}. Source: <b>bin/how_it_works_pdf.py</b>. "
        f"For questions about anything in this brief, mark@sunspot.mt.</i>",
        S["Note"]))

    branded = on_page_branded("How it works")
    doc.build(s, onFirstPage=branded, onLaterPages=branded)
    print(f"Generated {OUT}")


if __name__ == "__main__":
    main()
