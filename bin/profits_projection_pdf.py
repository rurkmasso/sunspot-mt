#!/usr/bin/env python3
"""
Internal profits & projections deck — Sunspot.

For the founders' own use: revenue mechanics, unit economics, year-1
through year-3 projections, per-operator profit, what each founder gets
out of it.

Output: bin/sunspot_profits_projection.pdf
"""
import datetime
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
OUT = ROOT / "bin" / "sunspot_profits_projection.pdf"

INK     = COLOURS["ink"]
TERRA   = COLOURS["terracotta"]
SUN     = COLOURS["sun"]
HONEY   = COLOURS["honey"]
LIMESTONE = COLOURS["limestone"]
MUTED   = COLOURS["muted"]
LINE    = COLOURS["line"]

# ─── Assumptions (the levers — change these to re-project) ───
COMMISSION_RATE      = 0.08    # 8 % per booking
AVG_BOOKING_VALUE    = 45      # EUR per booking, blended (sunbed €25 / cabana €120 / VIP €280)
AVG_SUNBEDS_PER_OP   = 35      # bookable inventory per venue
SEASON_DAYS          = 165     # May 15 → Oct 30
TARGET_FILL_Y1       = 0.18    # 18 % of inventory booked through us in season 1
TARGET_FILL_Y2       = 0.42
TARGET_FILL_Y3       = 0.62
PARTNERS_Y1          = 12      # of 30 bookable Malta venues
PARTNERS_Y2          = 22
PARTNERS_Y3          = 30
TX_COST_PER_BOOKING  = 0.30    # Stripe fixed fee share
OPS_FIXED_MONTHLY    = 1200    # hosting + tools + email + domain
EDITORIAL_MONTHLY    = 0       # year 1: founders work for equity
GROWTH_BUDGET_Y1     = 8_000
GROWTH_BUDGET_Y2     = 24_000
GROWTH_BUDGET_Y3     = 60_000

FOUNDERS = [
    ("Mark Russo",            "Founder & CEO",   28),
    ("Edward Fenech Adami",   "Co-founder",      18),
    ("Daniel Cutajar",        "Co-founder",      18),
    ("Matthew Pizzuto",       "Co-founder",      18),
    ("Zach Sciberras",        "Co-founder",      18),
]

def yearly_bookings(partners, fill):
    return int(partners * AVG_SUNBEDS_PER_OP * SEASON_DAYS * fill)

def gmv(bookings):
    return bookings * AVG_BOOKING_VALUE

def revenue(bookings):
    return gmv(bookings) * COMMISSION_RATE

def tx_cost(bookings):
    return bookings * TX_COST_PER_BOOKING


def year_row(label, partners, fill, growth_budget):
    bk = yearly_bookings(partners, fill)
    g  = gmv(bk)
    r  = revenue(bk)
    tc = tx_cost(bk)
    ops = OPS_FIXED_MONTHLY * 12
    ed  = EDITORIAL_MONTHLY * 12
    profit = r - tc - ops - ed - growth_budget
    return [label, partners, f"{int(fill*100)}%", f"{bk:,}",
            f"€{g:,.0f}", f"€{r:,.0f}",
            f"€{(tc+ops+ed+growth_budget):,.0f}",
            f"€{profit:,.0f}"]


def main():
    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=22*mm, bottomMargin=22*mm,
        title="Sunspot — Profit projection (internal)",
        author="Sunspot Ltd",
    )
    styles = getSampleStyleSheet()
    H1 = ParagraphStyle("H1", parent=styles["Title"], fontName="Helvetica-Bold",
                        fontSize=22, textColor=INK, spaceAfter=4, alignment=0)
    SUB = ParagraphStyle("Sub", parent=styles["Normal"], fontName="Helvetica",
                         fontSize=10, textColor=MUTED, spaceAfter=14)
    H2  = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                         fontSize=14, textColor=TERRA, spaceBefore=14, spaceAfter=8)
    H3  = ParagraphStyle("H3", parent=styles["Heading3"], fontName="Helvetica-Bold",
                         fontSize=11, textColor=INK, spaceBefore=10, spaceAfter=4)
    BODY = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=10, leading=14, textColor=INK, spaceAfter=8)
    NOTE = ParagraphStyle("Note", parent=styles["Normal"], fontName="Helvetica-Oblique",
                          fontSize=9, textColor=MUTED)
    CELL = ParagraphStyle("Cell", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=9, leading=12, textColor=INK)
    CELLB = ParagraphStyle("CellB", parent=styles["Normal"], fontName="Helvetica-Bold",
                           fontSize=9, leading=12, textColor=INK)
    BIG = ParagraphStyle("Big", parent=styles["Normal"], fontName="Helvetica-Bold",
                         fontSize=20, leading=22, textColor=SUN)

    s = []
    today = datetime.date.today().strftime("%d %B %Y")

    # ─── Cover ───
    s.extend(brand_cover(
        "Profit projection",
        kicker="Internal document — founders only",
        subtitle="3-year revenue model · base / bear / bull",
    ))
    s.append(Spacer(1, 4))
    s.append(Paragraph(
        "What this is: the realistic 3-year revenue and profit picture for Sunspot, "
        "with assumptions you can challenge in one column. Use it to align on hiring, "
        "founder distributions, and when each of us can replace day-job income.",
        BODY))

    # ─── How we make money ───
    s.append(Paragraph("How we make money", H2))
    s.append(Paragraph(
        f"Marketplace model. Operator pays nothing flat — Sunspot takes "
        f"<b>{int(COMMISSION_RATE*100)}%</b> of every booking, captured at Stripe payment time, "
        f"settled with the operator on weekly automated payout. No listing fees, no monthly "
        f"minimums, no exclusivity.",
        BODY))
    s.append(Paragraph(
        f"Average booking value across our mix (sunbed €25 / cabana €120 / VIP €280) = "
        f"<b>€{AVG_BOOKING_VALUE}</b>. That gives us <b>€{AVG_BOOKING_VALUE*COMMISSION_RATE:.2f}</b> "
        f"per booking before Stripe fees.",
        BODY))

    # ─── Unit economics ───
    s.append(Paragraph("Unit economics — per booking", H2))
    ue = [
        ["Item", "Amount", "Notes"],
        ["Average booking value (€)", f"€{AVG_BOOKING_VALUE}", "Blended across sunbed / cabana / VIP"],
        ["Sunspot commission", f"€{AVG_BOOKING_VALUE*COMMISSION_RATE:.2f}", f"{int(COMMISSION_RATE*100)}% of GMV"],
        ["Stripe fees", f"−€{TX_COST_PER_BOOKING:.2f}", "1.4% + €0.25 EU card, averaged"],
        ["Gross margin per booking", f"€{(AVG_BOOKING_VALUE*COMMISSION_RATE - TX_COST_PER_BOOKING):.2f}",
         "Contribution to fixed costs"],
    ]
    s.append(_table(ue, [70*mm, 35*mm, 65*mm]))

    # ─── Per-operator economics ───
    s.append(Paragraph("Per-operator economics — what they make, what we make", H2))
    daily_bk_op = int(AVG_SUNBEDS_PER_OP * TARGET_FILL_Y2)
    season_bk_op = daily_bk_op * SEASON_DAYS
    op_gmv = season_bk_op * AVG_BOOKING_VALUE
    op_keeps = op_gmv * (1 - COMMISSION_RATE)
    sunspot_share = op_gmv * COMMISSION_RATE
    rows = [
        ["Per-operator metric", "Year 2 estimate", "Reference"],
        ["Bookable sunbeds", f"{AVG_SUNBEDS_PER_OP}", "Average per partner venue"],
        ["Season length (days)", f"{SEASON_DAYS}", "May 15 → Oct 30"],
        [f"Sunspot-driven fill rate", f"{int(TARGET_FILL_Y2*100)}%", "Year 2 target"],
        ["Daily Sunspot bookings", f"{daily_bk_op}", f"= {AVG_SUNBEDS_PER_OP} × {int(TARGET_FILL_Y2*100)}%"],
        ["Season bookings via Sunspot", f"{season_bk_op:,}", "Day × Season days"],
        ["Operator GMV via Sunspot", f"€{op_gmv:,.0f}", "What the booking generates"],
        ["Operator keeps", f"€{op_keeps:,.0f}", f"{int((1-COMMISSION_RATE)*100)}% of GMV"],
        ["Sunspot revenue from this venue", f"€{sunspot_share:,.0f}", f"{int(COMMISSION_RATE*100)}% commission"],
    ]
    s.append(_table(rows, [70*mm, 45*mm, 55*mm], header_color=LIMESTONE))
    s.append(Paragraph(
        f"<b>For the operator:</b> €{(op_keeps - 0):,.0f} of extra-season revenue, captured automatically, "
        f"with no chasing no-shows. Their staff stop manning a phone for bookings.",
        BODY))

    # ─── Three-year projection ───
    s.append(PageBreak())
    s.append(Paragraph("Three-year projection — Sunspot consolidated", H2))
    s.append(Paragraph(
        "Conservative. Assumes Malta's bookable beach-club market is ~30 venues "
        "(matches our research). No expansion into Cyprus or other Mediterranean markets in "
        "the base case.",
        BODY))

    proj = [
        ["", "Partners", "Fill %", "Bookings", "GMV", "Revenue", "Costs", "Profit"],
        year_row("Year 1 (2026)", PARTNERS_Y1, TARGET_FILL_Y1, GROWTH_BUDGET_Y1),
        year_row("Year 2 (2027)", PARTNERS_Y2, TARGET_FILL_Y2, GROWTH_BUDGET_Y2),
        year_row("Year 3 (2028)", PARTNERS_Y3, TARGET_FILL_Y3, GROWTH_BUDGET_Y3),
    ]
    s.append(_table(proj, [27*mm, 18*mm, 14*mm, 22*mm, 24*mm, 22*mm, 22*mm, 24*mm],
                    header_color=LIMESTONE))

    # Year 3 highlight
    y3 = year_row("Year 3", PARTNERS_Y3, TARGET_FILL_Y3, GROWTH_BUDGET_Y3)
    s.append(Spacer(1, 6))
    s.append(Paragraph("By Year 3 — what it looks like", H3))
    s.append(Paragraph(
        f"<b>{y3[3]}</b> bookings · <b>{y3[4]}</b> GMV across the network · "
        f"<b>{y3[5]}</b> Sunspot revenue · <b>{y3[7]}</b> EBIT after Stripe, hosting, "
        f"growth budget. That's running break-even on hiring 1 full-time engineer + "
        f"1 part-time editorial.",
        BODY))

    # ─── Cost structure ───
    s.append(Paragraph("Cost structure", H2))
    costs = [
        ["Bucket", "Year 1", "Year 2", "Year 3", "Notes"],
        ["Stripe processing", f"€{tx_cost(yearly_bookings(PARTNERS_Y1, TARGET_FILL_Y1)):,.0f}",
         f"€{tx_cost(yearly_bookings(PARTNERS_Y2, TARGET_FILL_Y2)):,.0f}",
         f"€{tx_cost(yearly_bookings(PARTNERS_Y3, TARGET_FILL_Y3)):,.0f}",
         "Variable, ~€0.30/booking"],
        ["Hosting + infra", "€2,400", "€4,800", "€9,000",
         "WP host, Stripe, domains, email"],
        ["Tooling", "€2,400", "€6,000", "€10,000",
         "Analytics, support, ops"],
        ["Editorial (Year 2+)", "€0", "€12,000", "€36,000",
         "1 part-time writer @ Y2"],
        ["Engineering (Year 3)", "€0", "€0", "€55,000",
         "1 mid engineer FT"],
        ["Growth / marketing", f"€{GROWTH_BUDGET_Y1:,}", f"€{GROWTH_BUDGET_Y2:,}", f"€{GROWTH_BUDGET_Y3:,}",
         "Operator acquisition + paid + PR"],
        ["Operator success FTE", "€0", "€18,000", "€42,000",
         "Onboarding + retention"],
    ]
    s.append(_table(costs, [38*mm, 20*mm, 20*mm, 20*mm, 60*mm], header_color=LIMESTONE))
    s.append(Paragraph(
        "<b>Year 1 is founder-funded.</b> No salaries — we ship in evenings + weekends. "
        "First real hire (editorial) lands when Year 2 revenue confirms the model.",
        NOTE))

    # ─── Founder distributions ───
    s.append(PageBreak())
    s.append(Paragraph("What each founder gets", H2))
    s.append(Paragraph(
        "Equity-weighted distribution from net profit, after re-investing 40% back into the "
        "business each year. Numbers below are illustrative — change the split column to "
        "rerun. Suggested split: Mark 28% (operating lead), other four at 18% each.",
        BODY))

    y3_profit = float(y3[7].replace("€", "").replace(",", ""))
    distributable = y3_profit * 0.6   # 40 % re-invested
    rows = [["Founder", "Role", "Equity %", "Year 3 distribution"]]
    for name, role, equity in FOUNDERS:
        share = distributable * equity / 100
        rows.append([name, role, f"{equity}%", f"€{share:,.0f}"])
    s.append(_table(rows, [50*mm, 50*mm, 20*mm, 40*mm], header_color=LIMESTONE))
    s.append(Paragraph(
        f"<b>Total distributed in Year 3 (60% of net profit): €{distributable:,.0f}.</b> "
        "The other 40% reinvested into hiring, photography, paid acquisition, and "
        "expansion into Cyprus/Greece if Malta saturates.",
        BODY))

    # ─── Sensitivity ───
    s.append(Paragraph("Sensitivity — what happens if we miss", H2))
    sens = [
        ["Scenario", "Year 3 fill", "Year 3 revenue", "Year 3 profit"],
    ]
    for label, fill in [("Bear (under-perform)", 0.40),
                        ("Base (plan)",          TARGET_FILL_Y3),
                        ("Bull (over-perform)",  0.80)]:
        r = year_row("y3", PARTNERS_Y3, fill, GROWTH_BUDGET_Y3)
        sens.append([label, f"{int(fill*100)}%", r[5], r[7]])
    s.append(_table(sens, [50*mm, 30*mm, 40*mm, 40*mm], header_color=LIMESTONE))
    s.append(Paragraph(
        "<b>Read:</b> even in the bear case (40% fill — half of our base plan) we cover "
        "operating costs and have headroom to pay each founder. The base case is comfortable; "
        "the bull case is when we hire the second engineer and look at the next market.",
        BODY))

    # ─── What this brings to Malta ───
    s.append(Paragraph("Side bonus — what this brings to Malta", H2))
    s.append(Paragraph(
        "Every Maltese beach club we onboard captures revenue that currently leaks to "
        "walk-ins, no-shows, and seasonal cash. Our service fee replaces that leak: 8% of "
        "captured GMV stays in Malta (Sunspot is Valletta-registered), and the operator "
        "keeps the other 92% predictably.",
        BODY))
    s.append(Paragraph(
        "Once we plug into the Malta Tourism Authority's open data feed (beach quality, "
        "lifeguard status, blue-flag), Sunspot becomes the canonical 'where to swim today' "
        "answer for tourists — driving spend toward licensed, compliant venues and away "
        "from informal kiosks.",
        BODY))

    # ─── Footer ───
    s.append(Spacer(1, 18))
    s.append(Paragraph(
        f"<i>Generated {today}. Re-run "
        f"<b>python3 bin/profits_projection_pdf.py</b> after tweaking assumptions at the top "
        f"of the script.</i>", NOTE))

    branded = on_page_branded("Profit projection · internal")
    doc.build(s, onFirstPage=branded, onLaterPages=branded)
    print(f"Generated {OUT}")


def _table(rows, widths, header_color=LIMESTONE):
    """Helper for consistent table styling."""
    styles = getSampleStyleSheet()
    cell = ParagraphStyle("c", parent=styles["Normal"], fontName="Helvetica",
                          fontSize=9, leading=12, textColor=INK)
    cellH = ParagraphStyle("ch", parent=styles["Normal"], fontName="Helvetica-Bold",
                           fontSize=9, leading=12, textColor=INK)
    data = []
    for i, row in enumerate(rows):
        style = cellH if i == 0 else cell
        data.append([Paragraph(str(c), style) for c in row])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("LINEBELOW",  (0, 0), (-1, 0), 0.8, TERRA),
        ("LINEBELOW",  (0, 1), (-1, -1), 0.25, LINE),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fbf8f2")]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
    ]))
    return t


if __name__ == "__main__":
    main()
