# TradeHub — B2B E-Commerce Marketplace (PRD)

## Original problem statement (summary)
Production-grade, reusable/white-label B2B marketplace (Flipkart/IndiaMART-style) — user chose FastAPI+React+MongoDB, Core B2B MVP, Razorpay+COD, Shiprocket wired, Gmail SMTP, vibrant marketplace design, admin-managed mega-menu with category → subcategory → right-side promo image.

## Architecture
- Backend: FastAPI (`/app/backend/server.py`), JWT+bcrypt auth, RBAC (super_admin/admin/manager/vendor/vendor_staff/customer/warehouse), Motor/MongoDB, integrations module for Razorpay/Shiprocket/SMTP, tier-pricing engine (`price_for_qty`), server-side price recompute at checkout.
- Frontend: React + React Router + Zustand + Tailwind + shadcn/ui + Phosphor icons + Fontshare (Cabinet Grotesk + Satoshi). CSS variables driven by `/api/settings` so Admin > Settings live-changes theme across the store.
- Config-driven white-label: `/app/backend/config.py` `DEFAULT_SETTINGS` + admin Settings page controls brand, theme, commerce, homepage, features.

## Personas
- Buyer / B2B customer (browse, RFQ, order, wallet, credit)
- Vendor (list products scoped to self, manage orders, wallet, commission)
- Admin / Super admin (catalog, orders, vendors approval, settings, theme, mega-menu)

## Implemented (2026-02)
- Auth + RBAC + protected routes + refresh token issuance
- Catalog: categories (tree + right-side promo image for mega-menu), brands, products (tier pricing/MOQ/GST/HSN/stock/images/specs)
- Storefront: hero, category grid, featured products, PLP filters/sort, PDP with tier pricing table + qty stepper + MOQ + add-to-cart, mobile drawer + mobile search
- Cart with server-computed subtotal/GST/shipping; MOQ enforcement
- Checkout (COD + Razorpay live modal) with server-side price recompute, address validation (min length + pincode + phone regex), coupon apply w/ discount preview, no stock decrement / cart clear until payment verified for razorpay
- Orders: order lifecycle status updates, timeline, Shiprocket "Ship" action, admin & vendor scoped listings
- Vendors: registration → pending approval → approve/suspend; vendor dashboard KPIs; VendorProducts scoped to vendorId (fixed high-priority scoping leak)
- RFQ + quotations flow (create, list, accept)
- Coupons + apply endpoint (BULK10, WELCOME500 seeded)
- Reviews endpoint
- Admin dashboard KPIs, product/category/brand CRUD, order management + Shiprocket ship, vendor approval, settings (brand/theme live preview/commerce/homepage/feature flags)
- SMTP welcome + order confirmation emails (Gmail SMTP)
- Media upload endpoint with size/mime validation
- Razorpay webhook with HMAC verification
- Seeded 3 users, 4 root + 4 sub categories, 4 brands, 6 tier-priced products, 2 coupons

## Backlog (P1)
- Bulk product import (CSV/XLSX with validation preview)
- Wallet transactions ledger + vendor payout admin flow
- B2B credit limit & overdue reminders
- Flash sales & category promo scheduling
- Product variants / bundles / kits
- Multi-warehouse inventory & stock transfers
- Wishlist + Compare + Recently viewed
- Reviews UI + moderation
- Sitemap + structured data + PWA

## Backlog (P2)
- OpenSearch/Elasticsearch product search
- BullMQ/Redis cron jobs (abandoned cart, low-stock alerts)
- Company sub-users + spend approvals
- Multi-currency + language

## Test accounts
See `/app/memory/test_credentials.md`.
