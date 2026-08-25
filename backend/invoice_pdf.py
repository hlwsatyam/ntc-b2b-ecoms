"""Professional PDF invoice generator with dynamic branding."""
import io, os, re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import httpx

from config import PUBLIC_UPLOAD_URL, UPLOAD_DIR

# Register a Unicode-safe font so ₹ and other symbols render correctly
_FONT_REG = _FONT_BOLD = "Helvetica"
_FONT_BOLD_NAME = "Helvetica-Bold"
try:
    for base in ["/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/TTF", "/usr/share/fonts/dejavu"]:
        reg = os.path.join(base, "DejaVuSans.ttf")
        bold = os.path.join(base, "DejaVuSans-Bold.ttf")
        if os.path.exists(reg) and os.path.exists(bold):
            pdfmetrics.registerFont(TTFont("DejaVu", reg))
            pdfmetrics.registerFont(TTFont("DejaVu-Bold", bold))
            _FONT_REG = "DejaVu"
            _FONT_BOLD_NAME = "DejaVu-Bold"
            break
except Exception:
    pass


def _num_to_words_inr(n: float) -> str:
    n = int(round(float(n)))
    if n == 0:
        return "Zero Rupees Only"
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    def two(x):
        if x < 20: return ones[x]
        return tens[x // 10] + (" " + ones[x % 10] if x % 10 else "")
    def three(x):
        h, r = divmod(x, 100)
        s = (ones[h] + " Hundred" if h else "")
        if r: s = (s + " " if s else "") + two(r)
        return s
    parts = []
    crore, n = divmod(n, 10000000)
    lakh, n = divmod(n, 100000)
    thou, n = divmod(n, 1000)
    if crore: parts.append(three(crore) + " Crore")
    if lakh: parts.append(three(lakh) + " Lakh")
    if thou: parts.append(three(thou) + " Thousand")
    if n: parts.append(three(n))
    return " ".join(parts) + " Rupees Only"


def _hex_to_color(h: str, fallback: str = "#E11D48") -> colors.Color:
    h = (h or fallback).lstrip("#")
    if len(h) != 6:
        h = fallback.lstrip("#")
    return colors.HexColor("#" + h)


async def _load_logo(logo: str):
    if not logo:
        return None
    try:
        # local upload
        if logo.startswith(PUBLIC_UPLOAD_URL):
            fname = logo.replace(PUBLIC_UPLOAD_URL, "").lstrip("/")
            path = UPLOAD_DIR / fname
            if path.exists():
                return io.BytesIO(path.read_bytes())
        # remote http(s)
        if logo.startswith("http"):
            async with httpx.AsyncClient(timeout=6) as c:
                r = await c.get(logo)
                if r.status_code == 200:
                    return io.BytesIO(r.content)
    except Exception:
        return None
    return None


async def build_invoice_pdf(order: dict, settings: dict, buyer: dict) -> bytes:
    brand = settings.get("brand", {})
    theme = settings.get("theme", {})
    commerce = settings.get("commerce", {})
    primary = _hex_to_color(theme.get("primary"), "#E11D48")
    secondary = _hex_to_color(theme.get("secondary"), "#0F172A")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=12 * mm, bottomMargin=15 * mm,
        title=f"Invoice {order.get('orderNo')}",
        author=brand.get("storeName", "TradeHub"),
    )

    styles = getSampleStyleSheet()
    # Override default fonts with Unicode-safe font
    styles["Normal"].fontName = _FONT_REG
    styles.add(ParagraphStyle("h1x", parent=styles["Heading1"], fontName=_FONT_BOLD_NAME, fontSize=22, textColor=colors.white, leading=24, spaceAfter=0))
    styles.add(ParagraphStyle("brand", parent=styles["Normal"], fontName=_FONT_BOLD_NAME, fontSize=18, textColor=colors.white, leading=20, spaceAfter=2))
    styles.add(ParagraphStyle("brandSub", parent=styles["Normal"], fontName=_FONT_REG, fontSize=8, textColor=colors.white, alignment=TA_LEFT, leading=10))
    styles.add(ParagraphStyle("meta", parent=styles["Normal"], fontName=_FONT_REG, fontSize=9, textColor=colors.HexColor("#334155"), leading=12))
    styles.add(ParagraphStyle("metaRight", parent=styles["Normal"], fontName=_FONT_REG, fontSize=9, textColor=colors.HexColor("#334155"), leading=12, alignment=TA_RIGHT))
    styles.add(ParagraphStyle("label", parent=styles["Normal"], fontName=_FONT_BOLD_NAME, fontSize=7, textColor=colors.HexColor("#64748B"), leading=9))
    styles.add(ParagraphStyle("addr", parent=styles["Normal"], fontName=_FONT_REG, fontSize=9, textColor=colors.HexColor("#0F172A"), leading=12))
    styles.add(ParagraphStyle("tblH", parent=styles["Normal"], fontName=_FONT_BOLD_NAME, fontSize=8, textColor=colors.white, leading=10))
    styles.add(ParagraphStyle("tblCell", parent=styles["Normal"], fontName=_FONT_REG, fontSize=8, textColor=colors.HexColor("#0F172A"), leading=11))
    styles.add(ParagraphStyle("footer", parent=styles["Normal"], fontName=_FONT_REG, fontSize=8, textColor=colors.HexColor("#64748B"), alignment=TA_CENTER, leading=11))
    styles.add(ParagraphStyle("totLbl", parent=styles["Normal"], fontName=_FONT_REG, fontSize=9, textColor=colors.HexColor("#334155"), alignment=TA_RIGHT, leading=13))
    styles.add(ParagraphStyle("totVal", parent=styles["Normal"], fontName=_FONT_BOLD_NAME, fontSize=9, textColor=colors.HexColor("#0F172A"), alignment=TA_RIGHT, leading=13))
    styles.add(ParagraphStyle("grand", parent=styles["Normal"], fontName=_FONT_BOLD_NAME, fontSize=12, textColor=colors.white, alignment=TA_RIGHT, leading=15))

    story = []

    # ----- Header (brand strip) -----
    logo_stream = await _load_logo(brand.get("logo"))
    logo_flow = []
    if logo_stream:
        try:
            logo_flow.append(Image(logo_stream, width=32 * mm, height=32 * mm, kind="proportional"))
        except Exception:
            logo_flow = []
    if not logo_flow:
        logo_flow.append(Paragraph(f"<b>{brand.get('storeName', 'TradeHub')}</b>", styles["brand"]))

    brand_lines = "<br/>".join([
        f"<b>{brand.get('storeName', 'TradeHub')}</b>",
        brand.get("tagline", ""),
        brand.get("address", ""),
        (f"GSTIN: {brand.get('gstin')}" if brand.get("gstin") else ""),
        (f"Email: {brand.get('supportEmail')}" if brand.get("supportEmail") else ""),
        (f"Phone: {brand.get('phone')}" if brand.get("phone") else ""),
    ])
    header_tbl = Table(
        [[logo_flow, Paragraph(brand_lines, styles["brandSub"])]],
        colWidths=[45 * mm, None],
    )
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), secondary),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(header_tbl)

    # Red accent strip with title
    inv_prefix = commerce.get("invoicePrefix", "INV")
    inv_no = f"{inv_prefix}-{order.get('orderNo', '').split('-')[-1]}"
    title_tbl = Table(
        [[Paragraph("<font size=13 color='white'><b>TAX INVOICE</b></font>", styles["brand"]),
          Paragraph(f"<font color='white' size=8>Invoice No.</font><br/><font color='white' size=11><b>{inv_no}</b></font>", styles["brandSub"]),
          Paragraph(f"<font color='white' size=8>Order</font><br/><font color='white' size=11><b>{order.get('orderNo')}</b></font>", styles["brandSub"]),
          Paragraph(f"<font color='white' size=8>Date</font><br/><font color='white' size=11><b>{order.get('createdAt', '')[:10]}</b></font>", styles["brandSub"])]],
        colWidths=[55 * mm, 40 * mm, 40 * mm, 45 * mm],
    )
    title_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), primary),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(title_tbl)
    story.append(Spacer(1, 8))

    # ----- Bill To / Ship To -----
    addr = order.get("address", {})
    ship_lines = "<br/>".join([
        f"<b>{addr.get('fullName', '')}</b>",
        addr.get("company", "") or (buyer.get("company", "") if buyer else ""),
        addr.get("line1", ""),
        addr.get("line2", "") or "",
        f"{addr.get('city', '')}, {addr.get('state', '')} — {addr.get('pincode', '')}",
        addr.get("country", "India"),
        f"Phone: {addr.get('phone', '')}",
        (f"GSTIN: {addr.get('gstin')}" if addr.get("gstin") else ""),
    ])
    bill_lines = ship_lines  # same for MVP
    ba_tbl = Table(
        [[Paragraph("BILL TO", styles["label"]), Paragraph("SHIP TO", styles["label"])],
         [Paragraph(bill_lines, styles["addr"]), Paragraph(ship_lines, styles["addr"])]],
        colWidths=[90 * mm, 90 * mm],
    )
    ba_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (0, 1), 0.5, colors.HexColor("#E2E8F0")),
        ("BOX", (1, 0), (1, 1), 0.5, colors.HexColor("#E2E8F0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(ba_tbl)
    story.append(Spacer(1, 10))

    # ----- Items table -----
    header_row = [
        Paragraph("#", styles["tblH"]),
        Paragraph("ITEM / SKU", styles["tblH"]),
        Paragraph("HSN", styles["tblH"]),
        Paragraph("QTY", styles["tblH"]),
        Paragraph("RATE", styles["tblH"]),
        Paragraph("GST%", styles["tblH"]),
        Paragraph("TAX", styles["tblH"]),
        Paragraph("AMOUNT", styles["tblH"]),
    ]
    rows = [header_row]
    for i, it in enumerate(order.get("items", []), start=1):
        rows.append([
            Paragraph(str(i), styles["tblCell"]),
            Paragraph(f"<b>{it.get('name', '')}</b><br/><font color='#64748B' size=7>{it.get('sku', '')}</font>", styles["tblCell"]),
            Paragraph(str(it.get("hsn", "") or "-"), styles["tblCell"]),
            Paragraph(str(it.get("quantity", 0)), styles["tblCell"]),
            Paragraph(f"₹ {it.get('unitPrice', 0):,.2f}", styles["tblCell"]),
            Paragraph(f"{it.get('gst', 0)}%", styles["tblCell"]),
            Paragraph(f"₹ {it.get('lineTax', 0):,.2f}", styles["tblCell"]),
            Paragraph(f"₹ {it.get('lineTotal', 0):,.2f}", styles["tblCell"]),
        ])
    items_tbl = Table(rows, colWidths=[8 * mm, 60 * mm, 18 * mm, 12 * mm, 22 * mm, 14 * mm, 20 * mm, 26 * mm], repeatRows=1)
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), secondary),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.white),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 8))

    # ----- Totals block (right aligned) -----
    subtotal = float(order.get("subtotal", 0))
    tax = float(order.get("tax", 0))
    shipping = float(order.get("shipping", 0))
    discount = float(order.get("discount", 0))
    total = float(order.get("total", 0))
    same_state = True  # simplified — CGST/SGST for intra, IGST if you wire state
    cgst = round(tax / 2, 2) if same_state else 0
    sgst = round(tax / 2, 2) if same_state else 0
    igst = tax if not same_state else 0

    tot_rows = [
        [Paragraph("Subtotal", styles["totLbl"]), Paragraph(f"₹ {subtotal:,.2f}", styles["totVal"])],
    ]
    if discount:
        tot_rows.append([Paragraph("Discount", styles["totLbl"]), Paragraph(f"− ₹ {discount:,.2f}", styles["totVal"])])
    if same_state:
        tot_rows.append([Paragraph("CGST", styles["totLbl"]), Paragraph(f"₹ {cgst:,.2f}", styles["totVal"])])
        tot_rows.append([Paragraph("SGST", styles["totLbl"]), Paragraph(f"₹ {sgst:,.2f}", styles["totVal"])])
    else:
        tot_rows.append([Paragraph("IGST", styles["totLbl"]), Paragraph(f"₹ {igst:,.2f}", styles["totVal"])])
    tot_rows.append([Paragraph("Shipping", styles["totLbl"]), Paragraph(f"₹ {shipping:,.2f}", styles["totVal"])])
    tot_rows.append([Paragraph("<b>GRAND TOTAL</b>", styles["grand"]), Paragraph(f"<b>₹ {total:,.2f}</b>", styles["grand"])])

    totals_tbl = Table(tot_rows, colWidths=[40 * mm, 40 * mm])
    style_cmds = [
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, colors.HexColor("#E2E8F0")),
        ("BACKGROUND", (0, -1), (-1, -1), primary),
        ("TOPPADDING", (0, -1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]
    totals_tbl.setStyle(TableStyle(style_cmds))

    right_wrap = Table([["", totals_tbl]], colWidths=[100 * mm, 80 * mm])
    right_wrap.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(right_wrap)
    story.append(Spacer(1, 8))

    # Amount in words
    story.append(Paragraph(
        f"<font size=8 color='#64748B'><b>Amount in words:</b></font> "
        f"<font size=9 color='#0F172A'><b>{_num_to_words_inr(total)}</b></font>",
        styles["addr"]))
    story.append(Spacer(1, 10))

    # Payment + status pill
    pay_tbl = Table([[
        Paragraph(f"<b>Payment:</b> {order.get('paymentMethod', '').upper()}", styles["meta"]),
        Paragraph(f"<b>Status:</b> {order.get('paymentStatus', order.get('status', '')).upper()}", styles["meta"]),
        Paragraph(f"<b>Order status:</b> {order.get('status', '').upper()}", styles["meta"]),
    ]], colWidths=[60 * mm, 60 * mm, 60 * mm])
    pay_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(pay_tbl)
    story.append(Spacer(1, 18))

    # Signature + terms
    sign_tbl = Table([
        [Paragraph("<b>Terms &amp; Conditions</b><br/>"
                   "<font size=7 color='#64748B'>1. All prices inclusive of applicable GST. 2. Goods once sold will only be replaced as per return policy. "
                   "3. Subject to jurisdiction of registered office.</font>", styles["addr"]),
         Paragraph(f"<font size=8 color='#64748B'>For <b>{brand.get('storeName', 'TradeHub')}</b></font><br/><br/><br/>"
                   f"<font size=9 color='#0F172A'>_______________________</font><br/>"
                   f"<font size=8 color='#64748B'>Authorised Signatory</font>", styles["addr"])],
    ], colWidths=[110 * mm, 70 * mm])
    sign_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(sign_tbl)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.4, color=colors.HexColor("#E2E8F0")))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"This is a computer generated invoice. Generated on {datetime.now().strftime('%d %b %Y, %H:%M')} · "
        f"{brand.get('storeName', 'TradeHub')} · {brand.get('supportEmail', '')}",
        styles["footer"]))

    doc.build(story)
    return buf.getvalue()
