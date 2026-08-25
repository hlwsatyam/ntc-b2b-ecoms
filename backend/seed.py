"""Seed initial data: admin, vendor, customer, categories, brands, products, coupons."""
import asyncio, uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME, DEFAULT_SETTINGS
from auth_utils import hash_pw

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


def now():
    return datetime.now(timezone.utc).isoformat()


def nid():
    return str(uuid.uuid4())


async def seed():
    # settings
    await db.settings.update_one({"id": "global"}, {"$set": {"id": "global", **DEFAULT_SETTINGS}}, upsert=True)

    # users
    users = [
        {"id": "u-admin", "email": "admin@tradehub.com", "password": hash_pw("admin123"),
         "name": "Super Admin", "role": "super_admin", "isActive": True, "isApproved": True, "createdAt": now()},
        {"id": "u-vendor", "email": "vendor@tradehub.com", "password": hash_pw("vendor123"),
         "name": "Vendor Owner", "role": "vendor", "isActive": True, "isApproved": True,
         "company": "AceMart Wholesale", "gstin": "27AACCA1234B1Z5", "phone": "+919000000001", "createdAt": now()},
        {"id": "u-customer", "email": "buyer@tradehub.com", "password": hash_pw("buyer123"),
         "name": "Buyer Corp", "role": "customer", "isActive": True, "isApproved": True,
         "company": "BuyerCorp Pvt Ltd", "gstin": "29AABCB1234C1Z1", "phone": "+919000000002", "createdAt": now()},
    ]
    for u in users:
        await db.users.update_one({"email": u["email"]}, {"$set": u}, upsert=True)

    # vendor profile
    await db.vendors.update_one({"userId": "u-vendor"}, {"$set": {
        "id": "v-1", "userId": "u-vendor", "companyName": "AceMart Wholesale",
        "email": "vendor@tradehub.com", "phone": "+919000000001", "gstin": "27AACCA1234B1Z5",
        "status": "approved", "commissionPct": 8, "walletBalance": 25000, "createdAt": now(),
        "logo": "https://images.pexels.com/photos/38453564/pexels-photo-38453564.jpeg",
        "rating": 4.6,
    }}, upsert=True)

    # categories with promo images for mega-menu
    categories = [
        {"id": "c-electronics", "name": "Electronics", "slug": "electronics", "parentId": None,
         "image": "https://images.unsplash.com/photo-1518770660439-4636190af475",
         "promoImage": "https://images.unsplash.com/photo-1550009158-9ebf69173e03",
         "description": "Wholesale electronics & components", "isActive": True, "sortOrder": 1},
        {"id": "c-industrial", "name": "Industrial Supplies", "slug": "industrial", "parentId": None,
         "image": "https://images.pexels.com/photos/18631424/pexels-photo-18631424.jpeg",
         "promoImage": "https://images.pexels.com/photos/18631424/pexels-photo-18631424.jpeg",
         "description": "Machinery, tools & MRO", "isActive": True, "sortOrder": 2},
        {"id": "c-textiles", "name": "Textiles & Apparel", "slug": "textiles", "parentId": None,
         "image": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e",
         "promoImage": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e",
         "description": "Fabrics, garments, uniforms", "isActive": True, "sortOrder": 3},
        {"id": "c-packaging", "name": "Packaging", "slug": "packaging", "parentId": None,
         "image": "https://images.pexels.com/photos/36398150/pexels-photo-36398150.jpeg",
         "promoImage": "https://images.pexels.com/photos/36398150/pexels-photo-36398150.jpeg",
         "description": "Boxes, films, labels", "isActive": True, "sortOrder": 4},
        # subcategories
        {"id": "c-mobile", "name": "Mobile Accessories", "slug": "mobile-accessories", "parentId": "c-electronics", "isActive": True, "sortOrder": 1},
        {"id": "c-components", "name": "Components", "slug": "components", "parentId": "c-electronics", "isActive": True, "sortOrder": 2},
        {"id": "c-tools", "name": "Power Tools", "slug": "power-tools", "parentId": "c-industrial", "isActive": True, "sortOrder": 1},
        {"id": "c-safety", "name": "Safety Gear", "slug": "safety-gear", "parentId": "c-industrial", "isActive": True, "sortOrder": 2},
    ]
    for c in categories:
        await db.categories.update_one({"id": c["id"]}, {"$set": c}, upsert=True)

    # brands
    brands = [
        {"id": "b-1", "name": "Bosch", "slug": "bosch", "isActive": True, "logo": ""},
        {"id": "b-2", "name": "Philips", "slug": "philips", "isActive": True, "logo": ""},
        {"id": "b-3", "name": "3M", "slug": "3m", "isActive": True, "logo": ""},
        {"id": "b-4", "name": "Havells", "slug": "havells", "isActive": True, "logo": ""},
    ]
    for b in brands:
        await db.brands.update_one({"id": b["id"]}, {"$set": b}, upsert=True)

    # products with tier pricing
    products = [
        {"id": "p-1", "slug": "bosch-drill-450w",
         "name": "Bosch 450W Impact Drill GSB 450 RE", "sku": "SKU-BSH-DRL-001",
         "categoryId": "c-tools", "brandId": "b-1", "vendorId": "v-1",
         "description": "Professional impact drill for concrete/wood/metal. 13mm chuck.",
         "shortDescription": "13mm, 450W, variable speed.",
         "images": ["https://images.unsplash.com/photo-1426927308491-6380b6a9936f",
                    "https://images.unsplash.com/photo-1572981779307-38b8cabb2407"],
         "price": 2199, "mrp": 2799, "moq": 5, "stock": 240, "gst": 18,
         "tierPricing": [{"minQty": 5, "maxQty": 24, "price": 2199},
                          {"minQty": 25, "maxQty": 99, "price": 1999},
                          {"minQty": 100, "maxQty": None, "price": 1799}],
         "specifications": {"Power": "450W", "Chuck": "13mm", "Speed": "0-2600 rpm"},
         "isActive": True, "isFeatured": True, "soldCount": 340, "createdAt": now(),
         "tags": ["power-tool", "drill", "bosch"]},
        {"id": "p-2", "slug": "philips-led-bulb-9w",
         "name": "Philips 9W LED Bulb (Pack of 10)", "sku": "SKU-PHL-LED-010",
         "categoryId": "c-electronics", "brandId": "b-2", "vendorId": "v-1",
         "description": "Cool daylight, 806 lumens, 2-year warranty.",
         "shortDescription": "9W, E27, 6500K",
         "images": ["https://images.unsplash.com/photo-1550009158-9ebf69173e03"],
         "price": 649, "mrp": 899, "moq": 10, "stock": 1200, "gst": 12,
         "tierPricing": [{"minQty": 10, "maxQty": 49, "price": 649},
                          {"minQty": 50, "maxQty": 199, "price": 599},
                          {"minQty": 200, "maxQty": None, "price": 549}],
         "specifications": {"Wattage": "9W", "Voltage": "220-240V", "Cap": "E27"},
         "isActive": True, "isFeatured": True, "soldCount": 890, "createdAt": now()},
        {"id": "p-3", "slug": "3m-safety-goggles",
         "name": "3M Safety Goggles Anti-Fog (Box of 12)", "sku": "SKU-3M-GGL-012",
         "categoryId": "c-safety", "brandId": "b-3", "vendorId": "v-1",
         "description": "Anti-fog polycarbonate lens. UV protection. ISI certified.",
         "shortDescription": "Anti-fog UV goggles",
         "images": ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88"],
         "price": 1499, "mrp": 1999, "moq": 3, "stock": 320, "gst": 18,
         "tierPricing": [{"minQty": 3, "maxQty": 9, "price": 1499},
                          {"minQty": 10, "maxQty": 49, "price": 1349},
                          {"minQty": 50, "maxQty": None, "price": 1199}],
         "isActive": True, "isFeatured": True, "soldCount": 210, "createdAt": now()},
        {"id": "p-4", "slug": "havells-copper-cable",
         "name": "Havells 1.5 sq mm Copper Cable 90m", "sku": "SKU-HAV-CBL-15",
         "categoryId": "c-components", "brandId": "b-4", "vendorId": "v-1",
         "description": "FR PVC insulated. IS 694 compliant.",
         "shortDescription": "1.5mm² FR Cable 90m coil",
         "images": ["https://images.unsplash.com/photo-1518770660439-4636190af475"],
         "price": 1299, "mrp": 1599, "moq": 5, "stock": 150, "gst": 18,
         "tierPricing": [{"minQty": 5, "maxQty": 19, "price": 1299},
                          {"minQty": 20, "maxQty": 99, "price": 1199},
                          {"minQty": 100, "maxQty": None, "price": 1099}],
         "isActive": True, "isFeatured": True, "soldCount": 440, "createdAt": now()},
        {"id": "p-5", "slug": "corrugated-boxes-9x6x4",
         "name": "Corrugated Boxes 9x6x4 inch (Pack of 100)", "sku": "SKU-PKG-BOX-964",
         "categoryId": "c-packaging", "brandId": None, "vendorId": "v-1",
         "description": "3-ply, food-grade kraft.",
         "shortDescription": "9x6x4 3-ply, 100 pcs",
         "images": ["https://images.pexels.com/photos/36398150/pexels-photo-36398150.jpeg"],
         "price": 899, "mrp": 1199, "moq": 5, "stock": 500, "gst": 12,
         "tierPricing": [{"minQty": 5, "maxQty": 19, "price": 899},
                          {"minQty": 20, "maxQty": 99, "price": 799},
                          {"minQty": 100, "maxQty": None, "price": 699}],
         "isActive": True, "isFeatured": True, "soldCount": 620, "createdAt": now()},
        {"id": "p-6", "slug": "cotton-fabric-roll",
         "name": "Cotton Fabric Roll 100m — Uniform Grade", "sku": "SKU-TXT-CTN-100",
         "categoryId": "c-textiles", "brandId": None, "vendorId": "v-1",
         "description": "Poly-cotton blend, uniform manufacturing grade.",
         "shortDescription": "100m roll, 44 inch width",
         "images": ["https://images.unsplash.com/photo-1558769132-cb1aea458c5e"],
         "price": 4999, "mrp": 5999, "moq": 2, "stock": 60, "gst": 5,
         "tierPricing": [{"minQty": 2, "maxQty": 9, "price": 4999},
                          {"minQty": 10, "maxQty": 49, "price": 4499},
                          {"minQty": 50, "maxQty": None, "price": 3999}],
         "isActive": True, "isFeatured": False, "soldCount": 120, "createdAt": now()},
    ]
    for p in products:
        await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)

    # coupons
    coupons = [
        {"id": "cp-1", "code": "BULK10", "type": "percentage", "value": 10, "minOrder": 5000,
         "maxDiscount": 2000, "isActive": True, "createdAt": now()},
        {"id": "cp-2", "code": "WELCOME500", "type": "fixed", "value": 500, "minOrder": 2000,
         "isActive": True, "createdAt": now()},
    ]
    for c in coupons:
        await db.coupons.update_one({"code": c["code"]}, {"$set": c}, upsert=True)

    print("✔ Seed complete")
    print("  Admin:   admin@tradehub.com / admin123")
    print("  Vendor:  vendor@tradehub.com / vendor123")
    print("  Buyer:   buyer@tradehub.com / buyer123")


if __name__ == "__main__":
    asyncio.run(seed())
