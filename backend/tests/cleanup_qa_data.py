"""One-off cleanup of QA/TEST artifacts created during UI testing."""
import os
import requests
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
API = f"{BASE}/api"
tok = requests.post(f"{API}/auth/login", json={"email": "admin@tradehub.com", "password": "admin123"}).json()["token"]
H = {"Authorization": f"Bearer {tok}"}

prods = requests.get(f"{API}/products?limit=200").json()["items"]
for p in prods:
    if p["name"].startswith(("QA ", "TEST_")):
        print("del product", p["name"], requests.delete(f"{API}/products/{p['id']}", headers=H).status_code)

for c in requests.get(f"{API}/categories").json():
    if c["name"].startswith(("QA ", "TEST_")):
        print("del category", c["name"], requests.delete(f"{API}/categories/{c['id']}", headers=H).status_code)

for b in requests.get(f"{API}/brands").json():
    if b["name"].startswith(("QA ", "TEST_")):
        print("del brand", b["name"], requests.delete(f"{API}/brands/{b['id']}", headers=H).status_code)

s = requests.get(f"{API}/settings").json()
theme = dict(s["theme"])
theme["primary"] = "#0052ff"
r = requests.put(f"{API}/settings", json={"theme": theme}, headers=H)
print("theme primary restored:", r.status_code, r.json()["theme"]["primary"])
