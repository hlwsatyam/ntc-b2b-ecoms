"""Ad-hoc verification: with settings.integrations.razorpay set to bad creds, the PUBLIC
preview URL must return HTTP 400 + application/json (not ingress HTML) for razorpay checkout."""
import uuid
import requests
from dotenv import dotenv_values

BASE = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"

ADDR = {"fullName": "QA Tester", "phone": "9876543210", "line1": "1 QA Street",
        "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "gstin": ""}


def main():
    email = f"TEST_rzp_pub_{uuid.uuid4().hex[:8]}@example.com"
    tok = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test@12345", "name": "TEST Rzp Pub",
        "phone": "9876543213", "role": "customer"}, timeout=40).json()["token"]
    h = {"Authorization": f"Bearer {tok}"}
    p = requests.get(f"{API}/products", timeout=30).json()["items"][0]
    requests.post(f"{API}/cart/add", json={"productId": p["id"], "quantity": max(int(p.get("moq") or 1), 1)},
                  headers=h, timeout=30)
    r = requests.post(f"{API}/orders/checkout", json={"address": ADDR, "paymentMethod": "razorpay"},
                      headers=h, timeout=90)
    print("status:", r.status_code)
    print("content-type:", r.headers.get("content-type"))
    print("body:", r.text[:400])
    assert r.status_code == 400, r.status_code
    assert "application/json" in (r.headers.get("content-type") or "")
    assert "razorpay" in r.text.lower()
    print("PASS: public URL returns JSON 400 with Razorpay message")


main()
