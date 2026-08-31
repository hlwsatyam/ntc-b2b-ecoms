"""Tests for the 3 new features: Legal Policies (admin toggle/edit), GSTIN verification
at checkout, and Razorpay credential handling / clear error surface."""
import copy
import os
import time
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing from env and /app/frontend/.env")
API = base_url.rstrip("/") + "/api"

ADMIN = ("admin@tradehub.com", "admin123")
BUYER = ("buyer@tradehub.com", "buyer123")

VALID_GSTIN = "27AAPFU0939F1ZV"
BAD_CHECKSUM_GSTIN = "29AABCB1234C1Z1"
POLICY_KEYS = ["terms", "privacy", "return", "shipping"]


def _login(email, pw):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login {email} failed {r.status_code}: {r.text[:300]}")
    return r.json()["token"]


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


def _detail(resp):
    try:
        return str(resp.json().get("detail", ""))
    except Exception:
        return resp.text[:500]


@pytest.fixture(scope="module")
def admin_token():
    return _login(*ADMIN)


@pytest.fixture(scope="module")
def buyer_token():
    return _login(*BUYER)


@pytest.fixture(scope="module")
def fresh_buyer():
    """A brand-new customer with no GST state — used for the fresh-default assertions."""
    email = f"TEST_gst_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test@12345", "name": "TEST GST Buyer",
        "phone": "9876543210", "company": "TEST Co", "gstin": "", "role": "customer",
    }, timeout=40)
    assert r.status_code == 200, f"register failed {r.status_code}: {r.text[:300]}"
    body = r.json()
    return {"email": email, "token": body["token"], "id": body["user"]["id"]}


@pytest.fixture(scope="module")
def rzp_buyer():
    """Dedicated buyer for razorpay checkout attempts so the shared buyer cart is not polluted."""
    email = f"TEST_rzp_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test@12345", "name": "TEST Rzp Buyer",
        "phone": "9876543213", "role": "customer"}, timeout=40)
    assert r.status_code == 200, r.text[:300]
    return r.json()["token"]


@pytest.fixture(scope="module")
def original_settings(admin_token):
    r = requests.get(f"{API}/settings", timeout=30)
    assert r.status_code == 200
    snap = copy.deepcopy(r.json())
    yield snap
    # restore policies + integrations exactly as they were
    payload = {}
    if "policies" in snap:
        payload["policies"] = snap["policies"]
    if "integrations" in snap:
        payload["integrations"] = snap["integrations"]
    if payload:
        requests.put(f"{API}/settings", json=payload, headers=hdr(admin_token), timeout=30)


# ---------------- POLICIES ----------------
class TestPolicies:
    def test_get_all_policies(self):
        r = requests.get(f"{API}/policies", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in POLICY_KEYS:
            assert k in d, f"missing policy key {k}"
            assert set(["enabled", "title", "body"]).issubset(d[k].keys())
            assert isinstance(d[k]["enabled"], bool)
            assert isinstance(d[k]["title"], str) and len(d[k]["title"]) > 0
            assert isinstance(d[k]["body"], str) and len(d[k]["body"]) > 20

    def test_get_single_policy_enabled(self):
        for k in POLICY_KEYS:
            r = requests.get(f"{API}/policies/{k}", timeout=30)
            assert r.status_code == 200, f"{k} -> {r.status_code} {r.text[:200]}"
            d = r.json()
            assert d["enabled"] is True
            assert d["title"] and d["body"]

    def test_unknown_policy_key_404(self):
        r = requests.get(f"{API}/policies/nonexistent", timeout=30)
        assert r.status_code == 404

    def test_admin_toggle_and_edit_persists(self, admin_token, original_settings):
        current = requests.get(f"{API}/settings", timeout=30).json().get("policies") or {}
        new_pol = copy.deepcopy(current)
        new_pol["terms"] = {"enabled": False, "title": "TEST Terms Edited",
                            "body": "TEST body content for terms policy edited by QA."}
        r = requests.put(f"{API}/settings", json={"policies": new_pol},
                         headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["policies"]["terms"]["enabled"] is False

        # disabled policy must 404 on public single-policy endpoint
        r2 = requests.get(f"{API}/policies/terms", timeout=30)
        assert r2.status_code == 404, f"expected 404 for disabled policy, got {r2.status_code}"

        # other policies unaffected
        assert requests.get(f"{API}/policies/privacy", timeout=30).status_code == 200

        # edit persisted in list endpoint
        allp = requests.get(f"{API}/policies", timeout=30).json()
        assert allp["terms"]["title"] == "TEST Terms Edited"
        assert allp["terms"]["enabled"] is False

        # re-enable and verify it comes back
        new_pol["terms"]["enabled"] = True
        r3 = requests.put(f"{API}/settings", json={"policies": new_pol},
                          headers=hdr(admin_token), timeout=30)
        assert r3.status_code == 200
        assert requests.get(f"{API}/policies/terms", timeout=30).status_code == 200

    def test_policies_require_admin(self, buyer_token):
        r = requests.put(f"{API}/settings", json={"policies": {}},
                         headers=hdr(buyer_token), timeout=30)
        assert r.status_code in (401, 403), f"buyer was able to write settings: {r.status_code}"


# ---------------- GST VERIFY ----------------
class TestGst:
    def test_gst_me_fresh_defaults(self, fresh_buyer):
        r = requests.get(f"{API}/gst/me", headers=hdr(fresh_buyer["token"]), timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["gstin"] == ""
        assert d["gstVerified"] is False
        assert d.get("gstDetails") in (None, {}, "")

    def test_gst_me_requires_auth(self):
        r = requests.get(f"{API}/gst/me", timeout=30)
        assert r.status_code in (401, 403)

    def test_verify_malformed_gstin(self, fresh_buyer):
        r = requests.post(f"{API}/gst/verify", json={"gstin": "INVALID123"},
                          headers=hdr(fresh_buyer["token"]), timeout=40)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["valid"] is False
        assert "format" in d["error"].lower()

    def test_verify_bad_checksum_gstin(self, fresh_buyer):
        r = requests.post(f"{API}/gst/verify", json={"gstin": BAD_CHECKSUM_GSTIN},
                          headers=hdr(fresh_buyer["token"]), timeout=40)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["valid"] is False
        assert "checksum" in d["error"].lower()
        # must NOT mark the user verified
        me = requests.get(f"{API}/gst/me", headers=hdr(fresh_buyer["token"]), timeout=30).json()
        assert me["gstVerified"] is False

    def test_verify_valid_gstin_and_persist(self, fresh_buyer):
        r = requests.post(f"{API}/gst/verify", json={"gstin": VALID_GSTIN},
                          headers=hdr(fresh_buyer["token"]), timeout=40)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["valid"] is True, d
        assert d["gstin"] == VALID_GSTIN
        assert d["state"] == "Maharashtra"
        assert d["stateCode"] == "27"
        assert d["pan"] == VALID_GSTIN[2:12]

        me = requests.get(f"{API}/gst/me", headers=hdr(fresh_buyer["token"]), timeout=30).json()
        assert me["gstVerified"] is True
        assert me["gstin"] == VALID_GSTIN
        assert me["gstDetails"]["state"] == "Maharashtra"

    def test_verify_lowercase_input_normalised(self, fresh_buyer):
        r = requests.post(f"{API}/gst/verify", json={"gstin": VALID_GSTIN.lower()},
                          headers=hdr(fresh_buyer["token"]), timeout=40)
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["gstin"] == VALID_GSTIN

    def test_verify_requires_auth(self):
        r = requests.post(f"{API}/gst/verify", json={"gstin": VALID_GSTIN}, timeout=30)
        assert r.status_code in (401, 403)


# ---------------- CHECKOUT: GST precondition + Razorpay ----------------
ADDR = {
    "fullName": "TEST GST Buyer", "phone": "9876543210", "line1": "12 QA Street",
    "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "country": "India",
    "company": "TEST Co",
}


def _addr(gstin=""):
    a = dict(ADDR)
    a["gstin"] = gstin
    return a


def _add_to_cart(token):
    """Add a product respecting MOQ."""
    prods = requests.get(f"{API}/products", timeout=30).json()["items"]
    p = prods[0]
    q = max(int(p.get("moq") or 1), 1)
    r = requests.post(f"{API}/cart/add", json={"productId": p["id"], "quantity": q},
                      headers=hdr(token), timeout=30)
    assert r.status_code == 200, f"cart/add failed {r.status_code}: {r.text[:300]}"
    return r.json()


class TestCheckoutGst:
    def test_checkout_blocked_with_unverified_gstin(self, admin_token):
        """New user, GSTIN in address never verified -> 400 with a clear message."""
        email = f"TEST_chk_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Test@12345", "name": "TEST Chk",
            "phone": "9876543211", "role": "customer",
        }, timeout=40)
        assert reg.status_code == 200, reg.text[:300]
        tok = reg.json()["token"]
        _add_to_cart(tok)
        r = requests.post(f"{API}/orders/checkout", json={
            "address": _addr(VALID_GSTIN), "paymentMethod": "cod",
        }, headers=hdr(tok), timeout=60)
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text[:300]}"
        detail = (r.json().get("detail") or "").lower()
        assert "verify" in detail and "gstin" in detail, detail

        # after verifying, the same checkout must succeed
        v = requests.post(f"{API}/gst/verify", json={"gstin": VALID_GSTIN},
                          headers=hdr(tok), timeout=40)
        assert v.status_code == 200 and v.json()["valid"] is True
        r2 = requests.post(f"{API}/orders/checkout", json={
            "address": _addr(VALID_GSTIN), "paymentMethod": "cod",
        }, headers=hdr(tok), timeout=60)
        assert r2.status_code == 200, f"post-verify checkout failed {r2.status_code}: {r2.text[:400]}"
        order = r2.json()["order"]
        assert order["orderNo"].startswith("ORD")
        assert order["paymentMethod"] == "cod"
        assert order["address"]["gstin"] == VALID_GSTIN
        # verify persistence
        g = requests.get(f"{API}/orders/{order['id']}", headers=hdr(tok), timeout=30)
        assert g.status_code == 200, g.text[:200]
        assert g.json()["orderNo"] == order["orderNo"]

    def test_checkout_empty_gstin_cod_succeeds(self):
        email = f"TEST_nogst_{uuid.uuid4().hex[:8]}@example.com"
        reg = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Test@12345", "name": "TEST NoGst",
            "phone": "9876543212", "role": "customer",
        }, timeout=40)
        assert reg.status_code == 200
        tok = reg.json()["token"]
        _add_to_cart(tok)
        r = requests.post(f"{API}/orders/checkout", json={
            "address": _addr(""), "paymentMethod": "cod",
        }, headers=hdr(tok), timeout=60)
        assert r.status_code == 200, f"COD w/o gstin failed {r.status_code}: {r.text[:400]}"
        d = r.json()
        assert d["order"]["paymentStatus"] == "cod_pending"
        assert d["razorpay"] is None
        # cart cleared for COD
        cart = requests.get(f"{API}/cart", headers=hdr(tok), timeout=30).json()
        assert cart["items"] == []


class TestCheckoutRazorpay:
    def test_razorpay_no_credentials_returns_clear_400(self, admin_token, original_settings, rzp_buyer):
        """With razorpay creds blanked in settings AND env fallback present, we can only
        assert the error surface is human readable. Blank settings + blank env -> 400."""
        # blank out settings creds
        r = requests.put(f"{API}/settings",
                         json={"integrations": {"razorpay": {"keyId": "", "keySecret": "", "webhookSecret": ""}}},
                         headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        _add_to_cart(rzp_buyer)
        resp = requests.post(f"{API}/orders/checkout", json={
            "address": _addr(""), "paymentMethod": "razorpay",
        }, headers=hdr(rzp_buyer), timeout=90)
        detail = _detail(resp)
        print(f"[razorpay-env-fallback] status={resp.status_code} detail={detail}")
        if resp.status_code == 200:
            assert resp.json()["razorpay"]["orderId"].startswith("order_")
        else:
            assert resp.status_code in (400, 502), f"unexpected status {resp.status_code}: {detail[:300]}"
            assert "text/html" not in (resp.headers.get("content-type") or ""), (
                "error body replaced by proxy HTML page (502) — use HTTP 400")
            low = detail.lower()
            assert any(k in low for k in ["razorpay", "authentication", "settings", "payment gateway"]), detail
            assert "traceback" not in low

    def test_razorpay_bad_settings_credentials_surface_auth_error(self, admin_token, original_settings, rzp_buyer):
        r = requests.put(f"{API}/settings", json={"integrations": {"razorpay": {
            "keyId": "rzp_test_QAINVALIDKEY", "keySecret": "qainvalidsecret", "webhookSecret": ""}}},
            headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        got = requests.get(f"{API}/settings", timeout=30).json()
        assert got["integrations"]["razorpay"]["keyId"] == "rzp_test_QAINVALIDKEY"
        assert got["integrations"]["razorpay"]["keySecret"] == "qainvalidsecret"

        _add_to_cart(rzp_buyer)
        resp = requests.post(f"{API}/orders/checkout", json={
            "address": _addr(""), "paymentMethod": "razorpay",
        }, headers=hdr(rzp_buyer), timeout=90)
        detail = _detail(resp)
        print(f"[razorpay-bad-creds] status={resp.status_code} ct={resp.headers.get('content-type')} detail={detail[:200]}")
        # The backend does produce a human readable detail, but it uses HTTP 502, and the
        # preview ingress/CDN replaces any 502 body with its own HTML "Bad gateway" page,
        # so the end user never sees the message. Checkout must use a 4xx status instead.
        assert "text/html" not in (resp.headers.get("content-type") or ""), (
            f"checkout returned {resp.status_code} whose body was replaced by the proxy with an HTML "
            f"error page — user never sees the Razorpay message. Use HTTP 400 instead of 502.")
        low = detail.lower()
        assert "authentication failed" in low or "admin > settings" in low, detail
        assert resp.status_code == 400, f"expected 400 (proxy-safe) got {resp.status_code}"

    def test_razorpay_settings_creds_stored_and_readable(self, admin_token, original_settings):
        payload = {"integrations": {"razorpay": {
            "keyId": "rzp_test_STOREDKEY", "keySecret": "storedsecret", "webhookSecret": "whsec_test"}}}
        r = requests.put(f"{API}/settings", json=payload, headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        d = requests.get(f"{API}/settings", timeout=30).json()["integrations"]["razorpay"]
        assert d["keyId"] == "rzp_test_STOREDKEY"
        assert d["keySecret"] == "storedsecret"
        assert d["webhookSecret"] == "whsec_test"
