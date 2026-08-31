"""External integrations: Razorpay, Shiprocket, SMTP email."""
import asyncio, hashlib, hmac, time, logging
from email.message import EmailMessage
import httpx, aiosmtplib
import razorpay
from config import (
    RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
    SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_PICKUP,
    SMTP_HOST, SMTP_PORT, SMTP_MAIL, SMTP_PASS, SMTP_FROM,
)

log = logging.getLogger("integrations")

# ---- Razorpay ----
_razor = None
def razor():
    global _razor
    if _razor is None and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        _razor = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    return _razor


def razor_client_with(key_id: str, key_secret: str):
    """Build a razorpay client using explicit credentials (from DB settings)."""
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


async def razor_create_order_with(client, amount_paise: int, receipt: str, notes: dict = None):
    if not client:
        raise RuntimeError("Razorpay not configured — set keys in Admin > Settings or backend .env")
    try:
        return await asyncio.to_thread(
            client.order.create,
            data={"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes or {}}
        )
    except Exception as e:
        msg = str(e)
        try:
            import razorpay.errors as _re
            if isinstance(e, getattr(_re, "AuthenticationError", Exception)):
                msg = "Razorpay authentication failed — check keyId/keySecret in Admin > Settings > Integrations"
            elif isinstance(e, getattr(_re, "BadRequestError", Exception)):
                msg = f"Razorpay bad request: {e}"
        except Exception:
            pass
        log.warning(f"razorpay order create failed: {msg}")
        raise RuntimeError(msg)


async def razor_verify_signature_with(client, order_id: str, payment_id: str, signature: str) -> bool:
    if not client:
        return False
    try:
        await asyncio.to_thread(client.utility.verify_payment_signature, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })
        return True
    except Exception:
        return False


async def razor_create_order(amount_paise: int, receipt: str, notes: dict = None):
    client = razor()
    if not client:
        raise RuntimeError("Razorpay not configured")
    return await asyncio.to_thread(
        client.order.create,
        data={"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes or {}}
    )


async def razor_verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    client = razor()
    if not client:
        return False
    try:
        await asyncio.to_thread(client.utility.verify_payment_signature, {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })
        return True
    except Exception:
        return False


def razor_verify_webhook(raw_body: bytes, signature: str) -> bool:
    if not RAZORPAY_WEBHOOK_SECRET:
        return False
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


# ---- Shiprocket ----
SHIP_BASE = "https://apiv2.shiprocket.in/v1/external"
_ship_token, _ship_expiry = None, 0


async def ship_token():
    global _ship_token, _ship_expiry
    if _ship_token and time.time() < _ship_expiry - 60:
        return _ship_token
    if not SHIPROCKET_EMAIL or not SHIPROCKET_PASSWORD:
        raise RuntimeError("Shiprocket not configured")
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"{SHIP_BASE}/auth/login",
                         json={"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD})
        r.raise_for_status()
        body = r.json()
    _ship_token = body.get("token")
    _ship_expiry = time.time() + 9 * 24 * 3600
    return _ship_token


async def ship_request(method: str, path: str, **kwargs):
    global _ship_token
    async with httpx.AsyncClient(timeout=25) as c:
        try:
            token = await ship_token()
        except Exception as e:
            log.warning(f"Shiprocket auth failed: {e}")
            return {"error": str(e)}
        r = await c.request(method, f"{SHIP_BASE}{path}",
                            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                            **kwargs)
        if r.status_code == 401:
            _ship_token = None
            token = await ship_token()
            r = await c.request(method, f"{SHIP_BASE}{path}",
                                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                                **kwargs)
        try:
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            log.warning(f"Shiprocket {path} failed: {e.response.text}")
            return {"error": e.response.text, "status": r.status_code}


async def ship_create_order(payload: dict):
    return await ship_request("POST", "/orders/create/adhoc", json=payload)


async def ship_track_awb(awb: str):
    return await ship_request("GET", f"/courier/track/awb/{awb}")


# ---- Email (SMTP) ----
async def send_email(to: str, subject: str, html: str, text: str = ""):
    if not SMTP_MAIL:
        log.info(f"[email-stub] to={to} subj={subject}")
        return {"stubbed": True}
    msg = EmailMessage()
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text or "Please view this email in HTML.")
    msg.add_alternative(html, subtype="html")
    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_MAIL,
            password=SMTP_PASS,
            timeout=15,
        )
        return {"sent": True}
    except Exception as e:
        log.warning(f"email send failed: {e}")
        return {"error": str(e)}


def price_for_qty(tiers: list, qty: int, base_price: float) -> float:
    """B2B tier pricing engine. tiers = [{minQty, maxQty|None, price}]"""
    if not tiers:
        return base_price
    best = base_price
    for t in tiers:
        mn = t.get("minQty", 1)
        mx = t.get("maxQty")
        if qty >= mn and (mx is None or qty <= mx):
            best = float(t.get("price", base_price))
    return best
