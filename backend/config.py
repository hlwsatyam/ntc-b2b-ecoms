"""Central configuration. All business/branding lives in DB `settings` doc; env for secrets only."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_REFRESH_SECRET = os.environ["JWT_REFRESH_SECRET"]
JWT_EXPIRES_MIN = int(os.environ.get("JWT_EXPIRES_MIN", "1440"))

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

SHIPROCKET_EMAIL = os.environ.get("SHIPROCKET_EMAIL", "")
SHIPROCKET_PASSWORD = os.environ.get("SHIPROCKET_PASSWORD", "")
SHIPROCKET_PICKUP = os.environ.get("SHIPROCKET_PICKUP_LOCATION", "Primary")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_MAIL = os.environ.get("SMTP_MAIL", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_MAIL)

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", str(ROOT / "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_UPLOAD_URL = os.environ.get("PUBLIC_UPLOAD_URL", "/api/media")

# Default branding/business config - overridable via Admin > Settings (stored in DB)
DEFAULT_SETTINGS = {
    "brand": {
        "storeName": "TradeHub",
        "tagline": "Shop quality home & industrial supplies online",
        "logo": "",
        "favicon": "",
        "supportEmail": "support@tradehub.example",
        "phone": "+91 90000 00000",
        "whatsapp": "+91 90000 00000",
        "address": "Mumbai, India",
        "gstin": "",
        "socials": {"facebook": "", "instagram": "", "twitter": "", "linkedin": ""},
        "topBar": {
            "presalesPhone": "+91 87541 11207",
            "customerPhone": "+91 97913 52020",
            "offerText": "Register to use Coupon Code **BULK10** and get ₹500/- off on purchase of ₹5,000/- & above",
            "alertText": "⚠ Alert: We NEVER accept payments through third-party sites or links; pay securely ONLY on the TradeHub website.",
        },
    },
    "theme": {
        "primary": "#E11D48",
        "secondary": "#0F172A",
        "accent": "#F59E0B",
        "background": "#F5F5F7",
        "surface": "#FFFFFF",
        "border": "#E5E7EB",
        "radius": "0.375rem",
        "fontHeading": "Cabinet Grotesk",
        "fontBody": "Satoshi",
    },
    "commerce": {
        "currency": "INR",
        "currencySymbol": "₹",
        "country": "IN",
        "timezone": "Asia/Kolkata",
        "orderPrefix": "ORD",
        "invoicePrefix": "INV",
        "skuPrefix": "SKU",
        "codEnabled": True,
        "codMinAmount": 0,
        "codMaxAmount": 100000,
        "codCharges": 0,
        "taxInclusive": False,
        "defaultGst": 18,
    },
    "features": {
        "vendorMarketplace": True,
        "razorpay": True,
        "cod": True,
        "shiprocket": True,
        "rfq": True,
        "wallet": True,
        "credit": True,
        "reviews": True,
        "coupons": True,
        "wishlist": True,
        "compare": True,
        "flashSale": True,
    },
    "homepage": {
        "announcementBar": "Free shipping on bulk orders above ₹10,000 · GST invoice on every order",
        "heroBanners": [
            {
                "id": "b1",
                "title": "Bulk buying, better prices",
                "subtitle": "Verified vendors · MOQ-based pricing · GST invoicing",
                "image": "https://images.pexels.com/photos/36398150/pexels-photo-36398150.jpeg",
                "cta": "Shop deals",
                "link": "/products",
            }
        ],
        "promoCards": [
            {"id": "pc1", "image": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400", "title": "Test & Measure",   "link": "/products?category=c-electronics"},
            {"id": "pc2", "image": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400", "title": "Automotive",      "link": "/products?category=c-industrial"},
            {"id": "pc3", "image": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", "title": "Controlling Devices", "link": "/products?category=c-components"},
            {"id": "pc4", "image": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400", "title": "Personal Care",   "link": "/products"},
            {"id": "pc5", "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400", "title": "New Brands",      "link": "/products?featured=true"},
            {"id": "pc6", "image": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", "title": "Geysers",         "link": "/products?category=c-electronics"},
            {"id": "pc7", "image": "https://images.unsplash.com/photo-1558379850-a2ea4924d2c5?w=400",    "title": "Headphones & Speakers", "link": "/products?category=c-electronics"},
            {"id": "pc8", "image": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400", "title": "Safety Gear",     "link": "/products?category=c-safety"},
        ],
        "midBanner": {
            "image": "https://images.pexels.com/photos/18631424/pexels-photo-18631424.jpeg",
            "title": "Unlock Easy Deals — Get ₹500 OFF Today",
            "subtitle": "Register with code BULK10",
            "link": "/products",
        },
    },
    "seo": {
        "title": "TradeHub — India's B2B Marketplace",
        "description": "Wholesale marketplace for verified buyers and sellers.",
        "ogImage": "",
    },
}

PERMISSIONS = [
    "dashboard.view", "products.view", "products.create", "products.edit", "products.delete",
    "products.bulk_upload", "orders.view", "orders.update", "customers.view", "vendors.view",
    "vendors.approve", "inventory.manage", "payments.manage", "reports.view", "settings.manage",
    "cms.manage", "coupons.manage", "rfq.manage", "roles.manage",
]

ROLE_PERMISSIONS = {
    "super_admin": PERMISSIONS,
    "admin": [p for p in PERMISSIONS if p != "roles.manage"],
    "manager": ["dashboard.view", "products.view", "orders.view", "orders.update", "customers.view", "reports.view"],
    "vendor": ["dashboard.view", "products.view", "products.create", "products.edit", "orders.view", "orders.update", "inventory.manage"],
    "vendor_staff": ["products.view", "orders.view"],
    "customer": [],
    "warehouse": ["inventory.manage", "orders.view"],
}
