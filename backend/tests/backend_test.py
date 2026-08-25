"""B2B Marketplace backend API tests — auth, catalog, cart, orders, RBAC, admin, vendor, RFQ."""
import os
import re
import time
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

CREDS = {
    "admin": ("admin@tradehub.com", "admin123"),
    "vendor": ("vendor@tradehub.com", "vendor123"),
    "buyer": ("buyer@tradehub.com", "buyer123"),
}


def _login(role):
    email, pw = CREDS[role]
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login {role} failed {r.status_code}: {r.text[:300]}")
    return r.json()


@pytest.fixture(scope="session")
def admin_token():
    return _login("admin")["token"]


@pytest.fixture(scope="session")
def vendor_token():
    return _login("vendor")["token"]


@pytest.fixture(scope="session")
def buyer_token():
    return _login("buyer")["token"]


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- health / public catalog ----------
class TestPublic:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=30)
        assert r.status_code == 200
        assert "message" in r.json()

    def test_settings(self):
        r = requests.get(f"{API}/settings", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "global"
        assert "brand" in d and "theme" in d

    def test_categories_tree(self):
        r = requests.get(f"{API}/categories", params={"tree": "true"}, timeout=30)
        assert r.status_code == 200
        roots = r.json()
        assert len(roots) >= 4
        assert any(c["children"] for c in roots)
        assert any(c.get("promoImage") for c in roots)

    def test_brands(self):
        r = requests.get(f"{API}/brands", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_products_list_and_no_mongo_id(self):
        r = requests.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 6
        assert all("_id" not in p for p in d["items"])

    def test_products_search(self):
        r = requests.get(f"{API}/products", params={"q": "drill"}, timeout=30)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        assert any("drill" in p["name"].lower() for p in items)

    def test_products_sort_price_low(self):
        r = requests.get(f"{API}/products", params={"sort": "price_low", "limit": 20}, timeout=30)
        prices = [p["price"] for p in r.json()["items"]]
        assert prices == sorted(prices)

    def test_products_filter_category(self):
        r = requests.get(f"{API}/products", params={"category": "c-textiles"}, timeout=30)
        assert r.status_code == 200
        assert all(p["categoryId"] == "c-textiles" for p in r.json()["items"])

    def test_product_detail_tiers(self):
        r = requests.get(f"{API}/products/p-1", timeout=30)
        assert r.status_code == 200
        p = r.json()
        assert p["moq"] == 5
        tiers = {t["minQty"]: t["price"] for t in p["tierPricing"]}
        assert tiers[5] == 2199 and tiers[25] == 1999 and tiers[100] == 1799

    def test_product_404(self):
        r = requests.get(f"{API}/products/does-not-exist", timeout=30)
        assert r.status_code == 404


# ---------- auth ----------
class TestAuth:
    def test_login_roles(self):
        assert _login("admin")["user"]["role"] in ("super_admin", "admin")
        assert _login("vendor")["user"]["role"] == "vendor"
        assert _login("buyer")["user"]["role"] == "customer"

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": "buyer@tradehub.com", "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me(self, buyer_token):
        r = requests.get(f"{API}/auth/me", headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == "buyer@tradehub.com"
        assert "password" not in d

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code in (401, 403)

    def test_register_customer(self):
        email = f"TEST_qa_{int(time.time())}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "pass1234", "name": "TEST_QA User", "role": "customer"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["user"]["role"] == "customer"
        assert d["token"]
        # duplicate
        r2 = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "pass1234", "name": "dup", "role": "customer"}, timeout=60)
        assert r2.status_code == 400

    def test_register_short_password_validation(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": "TEST_short@example.com", "password": "12", "name": "x"}, timeout=30)
        assert r.status_code == 422


# ---------- RBAC / security ----------
class TestSecurity:
    def test_create_product_unauth(self):
        r = requests.post(f"{API}/products", json={"name": "x", "categoryId": "c-1", "price": 1, "mrp": 1}, timeout=30)
        assert r.status_code in (401, 403)

    def test_cart_unauth(self):
        r = requests.get(f"{API}/cart", timeout=30)
        assert r.status_code in (401, 403)

    def test_settings_update_forbidden_for_buyer(self, buyer_token):
        r = requests.put(f"{API}/settings", json={"brand": {"name": "hack"}}, headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 403

    def test_admin_stats_forbidden_for_buyer(self, buyer_token):
        r = requests.get(f"{API}/admin/stats", headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 403

    def test_buyer_cannot_create_product(self, buyer_token):
        r = requests.post(f"{API}/products", json={"name": "TEST_x", "categoryId": "c-textiles", "price": 1, "mrp": 1},
                          headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 403

    def test_vendors_me_requires_vendor(self, buyer_token):
        r = requests.get(f"{API}/vendors/me", headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 403

    def test_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers=hdr("garbage.token.here"), timeout=30)
        assert r.status_code in (401, 403)


# ---------- cart + tier pricing ----------
class TestCart:
    def test_moq_enforced(self, buyer_token):
        r = requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 2},
                          headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 400
        assert "5" in r.text

    def test_add_and_tier_price(self, buyer_token):
        r = requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 10},
                          headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        item = next(i for i in d["items"] if i["productId"] == "p-1")
        assert item["unitPrice"] == 2199
        assert item["lineTotal"] == 21990
        assert d["subtotal"] == 21990
        assert d["shipping"] == 0  # >=10000 free
        assert round(d["tax"], 2) == round(21990 * item["gst"] / 100, 2)
        assert round(d["total"], 2) == round(d["subtotal"] + d["tax"] + d["shipping"], 2)
        # GET persists
        g = requests.get(f"{API}/cart", headers=hdr(buyer_token), timeout=30)
        assert g.status_code == 200
        assert any(i["productId"] == "p-1" for i in g.json()["items"])

    def test_tier_price_upgrade_at_25(self, buyer_token):
        r = requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 25},
                          headers=hdr(buyer_token), timeout=30)
        item = next(i for i in r.json()["items"] if i["productId"] == "p-1")
        assert item["unitPrice"] == 1999

    def test_remove_item(self, buyer_token):
        requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 5}, headers=hdr(buyer_token), timeout=30)
        r = requests.delete(f"{API}/cart/p-1", headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 200
        assert not any(i["productId"] == "p-1" for i in r.json()["items"])

    def test_add_nonexistent_product(self, buyer_token):
        r = requests.post(f"{API}/cart/add", json={"productId": "nope", "quantity": 5},
                          headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 404

    def test_coupon_apply(self, buyer_token):
        requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 10}, headers=hdr(buyer_token), timeout=30)
        coupons = requests.get(f"{API}/coupons", headers=hdr(buyer_token), timeout=30)
        assert coupons.status_code == 200
        codes = [c["code"] for c in coupons.json()]
        assert codes, "no seeded coupons"
        r = requests.post(f"{API}/coupons/apply", json={"code": codes[0]}, headers=hdr(buyer_token), timeout=30)
        assert r.status_code in (200, 400), r.text[:200]
        if r.status_code == 200:
            assert r.json()["discount"] > 0
        bad = requests.post(f"{API}/coupons/apply", json={"code": "TEST_NOPE"}, headers=hdr(buyer_token), timeout=30)
        assert bad.status_code == 400
        requests.delete(f"{API}/cart/p-1", headers=hdr(buyer_token), timeout=30)


# ---------- checkout / orders ----------
ADDR = {"fullName": "TEST Buyer", "phone": "9876543210", "line1": "12 Industrial Estate",
        "city": "Pune", "state": "Maharashtra", "pincode": "411001", "gstin": "27AAAAA0000A1Z5"}


@pytest.fixture(scope="class")
def checkout_buyer_token():
    """Dedicated buyer so cart state isn't raced by the cart tests on another xdist worker."""
    email = f"TEST_checkout_{int(time.time()*1000)}@example.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "pass1234", "name": "TEST_Checkout Buyer", "role": "customer"}, timeout=60)
    if r.status_code != 200:
        pytest.fail(f"register checkout buyer failed {r.status_code}: {r.text[:300]}")
    return r.json()["token"]


class TestCheckout:
    def test_checkout_empty_cart(self, checkout_buyer_token):
        buyer_token = checkout_buyer_token
        # ensure cart empty
        cart = requests.get(f"{API}/cart", headers=hdr(buyer_token), timeout=30).json()
        for i in cart["items"]:
            requests.delete(f"{API}/cart/{i['productId']}", headers=hdr(buyer_token), timeout=30)
        r = requests.post(f"{API}/orders/checkout", json={"address": ADDR, "paymentMethod": "cod"},
                          headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 400

    def test_cod_checkout_server_recompute(self, checkout_buyer_token):
        buyer_token = checkout_buyer_token
        requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 10}, headers=hdr(buyer_token), timeout=30)
        summary = requests.get(f"{API}/cart", headers=hdr(buyer_token), timeout=30).json()
        r = requests.post(f"{API}/orders/checkout",
                          json={"address": ADDR, "paymentMethod": "cod", "total": 1},
                          headers=hdr(buyer_token), timeout=60)
        assert r.status_code == 200, r.text[:400]
        o = r.json()["order"]
        assert r.json()["razorpay"] is None
        assert o["orderNo"].startswith("ORD-")
        assert o["status"] == "confirmed"
        assert o["paymentStatus"] == "cod_pending"
        assert o["total"] == pytest.approx(summary["total"])  # server recomputed, client value ignored
        assert o["items"][0]["unitPrice"] == 2199
        # cart cleared
        assert requests.get(f"{API}/cart", headers=hdr(buyer_token), timeout=30).json()["items"] == []
        # order visible in list
        orders = requests.get(f"{API}/orders", headers=hdr(buyer_token), timeout=30).json()
        assert any(x["orderNo"] == o["orderNo"] for x in orders)
        # GET single
        g = requests.get(f"{API}/orders/{o['id']}", headers=hdr(buyer_token), timeout=30)
        assert g.status_code == 200
        assert g.json()["total"] == pytest.approx(o["total"])

    def test_two_orders_same_second_orderno_collision(self, checkout_buyer_token):
        buyer_token = checkout_buyer_token
        """orderNo uses second-precision timestamp with a unique index — check rapid orders don't 500."""
        codes = []
        for _ in range(2):
            requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 5},
                          headers=hdr(buyer_token), timeout=30)
            r = requests.post(f"{API}/orders/checkout", json={"address": ADDR, "paymentMethod": "cod"},
                              headers=hdr(buyer_token), timeout=60)
            codes.append(r.status_code)
        assert all(c == 200 for c in codes), f"rapid checkout statuses {codes}"

    def test_razorpay_order_creation(self, checkout_buyer_token):
        buyer_token = checkout_buyer_token
        requests.post(f"{API}/cart/add", json={"productId": "p-1", "quantity": 5}, headers=hdr(buyer_token), timeout=30)
        r = requests.post(f"{API}/orders/checkout", json={"address": ADDR, "paymentMethod": "razorpay"},
                          headers=hdr(buyer_token), timeout=90)
        if r.status_code != 200:
            pytest.fail(f"razorpay checkout failed {r.status_code}: {r.text[:400]}")
        d = r.json()
        assert d["razorpay"]["orderId"].startswith("order_")
        assert d["razorpay"]["keyId"]
        assert d["razorpay"]["amount"] == int(round(d["order"]["total"] * 100))
        assert d["order"]["status"] == "pending_payment"
        # cleanup cart
        cart = requests.get(f"{API}/cart", headers=hdr(buyer_token), timeout=30).json()
        for i in cart["items"]:
            requests.delete(f"{API}/cart/{i['productId']}", headers=hdr(buyer_token), timeout=30)

    def test_verify_payment_bad_signature(self, checkout_buyer_token):
        buyer_token = checkout_buyer_token
        r = requests.post(f"{API}/orders/verify-payment", json={
            "orderId": "x", "razorpay_order_id": "order_x",
            "razorpay_payment_id": "pay_x", "razorpay_signature": "bad"},
            headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 400

    def test_buyer_cannot_read_other_order(self, buyer_token, admin_token):
        all_orders = requests.get(f"{API}/orders", headers=hdr(admin_token), timeout=30).json()
        buyer_id = requests.get(f"{API}/auth/me", headers=hdr(buyer_token), timeout=30).json()["id"]
        foreign = [o for o in all_orders if o["userId"] != buyer_id]
        if not foreign:
            pytest.skip("no foreign orders to test")
        r = requests.get(f"{API}/orders/{foreign[0]['id']}", headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 403


# ---------- RFQ ----------
class TestRFQ:
    def test_create_and_list_rfq(self, buyer_token):
        r = requests.post(f"{API}/rfq", json={
            "productName": "TEST_Bulk Cement Bags", "quantity": 500,
            "deliveryLocation": "Pune, MH", "notes": "TEST"}, headers=hdr(buyer_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["status"] == "open"
        rid = d["id"]
        lst = requests.get(f"{API}/rfq", headers=hdr(buyer_token), timeout=30)
        assert lst.status_code == 200
        assert any(x["id"] == rid for x in lst.json())

    def test_vendor_sees_open_rfq_and_quotes(self, vendor_token, buyer_token):
        rfq = requests.post(f"{API}/rfq", json={
            "productName": "TEST_Quote Target", "quantity": 100, "deliveryLocation": "Delhi"},
            headers=hdr(buyer_token), timeout=30).json()
        lst = requests.get(f"{API}/rfq", headers=hdr(vendor_token), timeout=30)
        assert lst.status_code == 200
        assert any(x["id"] == rfq["id"] for x in lst.json())
        q = requests.post(f"{API}/quotations", json={"rfqId": rfq["id"], "price": 950, "moq": 50},
                          headers=hdr(vendor_token), timeout=30)
        assert q.status_code == 200, q.text[:300]
        assert q.json()["vendorId"]
        back = requests.get(f"{API}/rfq", headers=hdr(buyer_token), timeout=30).json()
        target = next(x for x in back if x["id"] == rfq["id"])
        assert len(target["quotations"]) >= 1

    def test_rfq_unauth(self):
        r = requests.post(f"{API}/rfq", json={"productName": "x", "quantity": 1, "deliveryLocation": "y"}, timeout=30)
        assert r.status_code in (401, 403)


# ---------- admin ----------
class TestAdmin:
    created = {"prod": None, "cat": None, "subcat": None, "brand": None}

    def test_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("totalOrders", "revenue", "totalCustomers", "totalVendors", "totalProducts", "lowStock"):
            assert k in d
        assert d["totalProducts"] >= 6

    def test_admin_users(self, admin_token):
        r = requests.get(f"{API}/admin/users", headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        assert all("password" not in u for u in r.json())

    def test_create_product_persists(self, admin_token):
        payload = {"name": f"TEST_Admin Widget {int(time.time())}", "categoryId": "c-textiles",
                   "price": 500, "mrp": 700, "stock": 40, "moq": 3, "gst": 18,
                   "tierPricing": [{"minQty": 3, "maxQty": 9, "price": 500},
                                   {"minQty": 10, "maxQty": None, "price": 450}]}
        r = requests.post(f"{API}/products", json=payload, headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        p = r.json()
        assert p["sku"]
        TestAdmin.created["prod"] = p["id"]
        g = requests.get(f"{API}/products/{p['id']}", timeout=30)
        assert g.status_code == 200
        assert g.json()["name"] == payload["name"]
        assert g.json()["moq"] == 3
        # update
        u = requests.put(f"{API}/products/{p['id']}", json={"stock": 77}, headers=hdr(admin_token), timeout=30)
        assert u.status_code == 200
        assert requests.get(f"{API}/products/{p['id']}", timeout=30).json()["stock"] == 77

    def test_create_category_with_promo_and_subcat(self, admin_token):
        r = requests.post(f"{API}/categories", json={
            "name": f"TEST_Cat{int(time.time())}", "promoImage": "https://example.com/promo.jpg", "sortOrder": 99},
            headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        cat = r.json()
        TestAdmin.created["cat"] = cat["id"]
        assert cat["promoImage"] == "https://example.com/promo.jpg"
        sub = requests.post(f"{API}/categories", json={"name": "TEST_Sub", "parentId": cat["id"]},
                            headers=hdr(admin_token), timeout=30)
        assert sub.status_code == 200
        TestAdmin.created["subcat"] = sub.json()["id"]
        tree = requests.get(f"{API}/categories", params={"tree": "true"}, timeout=30).json()
        node = next((c for c in tree if c["id"] == cat["id"]), None)
        assert node is not None
        assert any(ch["id"] == TestAdmin.created["subcat"] for ch in node["children"])
        assert node["promoImage"] == "https://example.com/promo.jpg"

    def test_create_brand(self, admin_token):
        r = requests.post(f"{API}/brands", json={"name": f"TEST_Brand{int(time.time())}"},
                          headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        b = r.json()
        TestAdmin.created["brand"] = b["id"]
        assert b["slug"]
        assert any(x["id"] == b["id"] for x in requests.get(f"{API}/brands", timeout=30).json())

    def test_settings_update_and_restore(self, admin_token):
        orig = requests.get(f"{API}/settings", timeout=30).json()
        theme = dict(orig.get("theme") or {})
        new_theme = {**theme, "primary": "#123456"}
        r = requests.put(f"{API}/settings", json={"theme": new_theme}, headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        assert r.json()["theme"]["primary"] == "#123456"
        assert requests.get(f"{API}/settings", timeout=30).json()["theme"]["primary"] == "#123456"
        requests.put(f"{API}/settings", json={"theme": theme}, headers=hdr(admin_token), timeout=30)

    def test_order_status_update(self, admin_token):
        orders = requests.get(f"{API}/orders", headers=hdr(admin_token), timeout=30).json()
        if not orders:
            pytest.skip("no orders")
        oid = orders[0]["id"]
        r = requests.put(f"{API}/orders/{oid}/status", json={"status": "processing"},
                         headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        assert r.json()["status"] == "processing"
        assert requests.get(f"{API}/orders/{oid}", headers=hdr(admin_token), timeout=30).json()["status"] == "processing"
        bad = requests.put(f"{API}/orders/{oid}/status", json={}, headers=hdr(admin_token), timeout=30)
        assert bad.status_code == 400

    def test_ship_order_does_not_500(self, admin_token):
        orders = requests.get(f"{API}/orders", headers=hdr(admin_token), timeout=30).json()
        if not orders:
            pytest.skip("no orders")
        r = requests.post(f"{API}/orders/{orders[0]['id']}/ship", headers=hdr(admin_token), timeout=120)
        assert r.status_code != 500, f"ship returned 500: {r.text[:400]}"

    def test_vendor_approve_flow(self, admin_token):
        vendors = requests.get(f"{API}/vendors", timeout=30).json()
        assert vendors
        vid = vendors[0]["id"]
        orig = vendors[0]["status"]
        r = requests.put(f"{API}/vendors/{vid}/approve", json={"status": "suspended"},
                         headers=hdr(admin_token), timeout=30)
        assert r.status_code == 200
        after = next(v for v in requests.get(f"{API}/vendors", timeout=30).json() if v["id"] == vid)
        assert after["status"] == "suspended"
        requests.put(f"{API}/vendors/{vid}/approve", json={"status": orig}, headers=hdr(admin_token), timeout=30)

    def test_zz_cleanup(self, admin_token):
        for key, url in (("prod", "products"), ("subcat", "categories"), ("cat", "categories"), ("brand", "brands")):
            _id = TestAdmin.created.get(key)
            if _id:
                r = requests.delete(f"{API}/{url}/{_id}", headers=hdr(admin_token), timeout=30)
                assert r.status_code in (200, 204, 404)


# ---------- vendor ----------
class TestVendor:
    def test_vendor_me(self, vendor_token):
        r = requests.get(f"{API}/vendors/me", headers=hdr(vendor_token), timeout=30)
        assert r.status_code == 200
        v = r.json()
        assert v["companyName"]
        assert "walletBalance" in v and "commissionPct" in v

    def test_vendor_product_scoped(self, vendor_token):
        r = requests.post(f"{API}/products", json={
            "name": f"TEST_Vendor Item {int(time.time())}", "categoryId": "c-textiles",
            "price": 100, "mrp": 150, "stock": 10, "moq": 1}, headers=hdr(vendor_token), timeout=30)
        assert r.status_code == 200, r.text[:300]
        p = r.json()
        assert p["vendorId"], "vendor product must be auto-assigned vendorId"
        d = requests.delete(f"{API}/products/{p['id']}", headers=hdr(vendor_token), timeout=30)
        assert d.status_code == 200

    def test_vendor_orders_scoped(self, vendor_token):
        r = requests.get(f"{API}/orders", headers=hdr(vendor_token), timeout=30)
        assert r.status_code == 200
        v = requests.get(f"{API}/vendors/me", headers=hdr(vendor_token), timeout=30).json()
        for o in r.json():
            assert any(i.get("vendorId") == v["id"] for i in o["items"])
