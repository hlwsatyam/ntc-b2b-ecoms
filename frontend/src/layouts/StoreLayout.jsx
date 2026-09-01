import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth, useSettings, useCart } from "../store";
import { ShoppingCart, MagnifyingGlass, User, Storefront, List, X, Phone, Heart, CaretDown, CaretRight, ShieldCheck, Truck, Package } from "@phosphor-icons/react";
import api from "../api";

/* ─── Flipkart-style Top Offers Strip ─── */
function OffersStrip() {
  return (
    <div className="bg-[#FFE500] text-center py-1.5 text-xs font-bold text-[#212121] tracking-wide hidden md:block" data-testid="offers-strip">
      <span className="inline-flex items-center gap-2">
        <span className="bg-[#26A541] text-white text-[10px] px-2 py-0.5 rounded-sm font-black uppercase">New</span>
        Register and get <span className="text-[var(--brand-primary)]">₹500 OFF</span> on first bulk order with code <span className="bg-[#212121] text-[#FFE500] px-1.5 py-0.5 rounded text-[11px]">BULK10</span>
      </span>
    </div>
  );
}

/* ─── Flipkart-style Mega Header ─── */
function FlipkartHeader({ brand, categories }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
  const [catOpen, setCatOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const roots = categories.filter((c) => !c.parentId);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      nav(`/products?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ("");
      setMobileSearch(false);
    }
  };

  return (
    <header className="sticky top-0 z-40" data-testid="flip-header">
      {/* Main header bar */}
      <div className="bg-[var(--brand-primary)]">
        <div className="container-max flex items-center gap-4 py-2.5">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="brand-link">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.storeName} className="h-9" />
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded bg-white/15 flex items-center justify-center">
                  <Storefront size={18} color="white" weight="fill" />
                </div>
                <div className="hidden sm:block text-white">
                  <div className="font-display font-black text-lg leading-none">{brand.storeName}</div>
                </div>
              </div>
            )}
          </Link>

          {/* Search Bar — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
            <div className="flex w-full items-stretch rounded overflow-hidden">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search for Products, Brands and more"
                className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
                data-testid="search-input"
              />
              <button type="submit" className="bg-white hover:bg-slate-50 px-5 flex items-center transition-colors" data-testid="search-btn">
                <MagnifyingGlass size={18} weight="bold" className="text-[var(--brand-primary)]" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Mobile search */}
            <button className="md:hidden text-white p-2" onClick={() => setMobileSearch(true)} data-testid="mobile-search-btn">
              <MagnifyingGlass size={22} />
            </button>

            {user ? (
              <div className="flex items-center gap-1">
                {(user.role === "super_admin" || user.role === "admin") && (
                  <Link to="/admin" className="hidden lg:flex text-white text-xs font-bold px-3 py-2 rounded hover:bg-white/15 transition-colors" data-testid="admin-link">Admin Panel</Link>
                )}
                {user.role === "vendor" && (
                  <Link to="/vendor" className="hidden lg:flex text-white text-xs font-bold px-3 py-2 rounded hover:bg-white/15 transition-colors" data-testid="vendor-link">Vendor Panel</Link>
                )}
                <Link to="/account" className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded hover:bg-white/15 transition-colors" data-testid="account-link">
                  <User size={16} weight="fill" />
                  <span className="hidden lg:inline">{user.name.split(" ")[0]}</span>
                </Link>
                <button onClick={() => { logout(); nav("/"); }} className="text-white/70 text-[11px] px-2 hover:text-white" data-testid="logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-white/15 transition-colors border border-white/40" data-testid="login-link">
                <User size={16} />
                Login
              </Link>
            )}

            <Link to="/cart" className="relative flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded hover:bg-white/15 transition-colors" data-testid="cart-link">
              <ShoppingCart size={20} weight="fill" />
              <span className="hidden lg:inline">Cart</span>
              {cart.items?.length > 0 && (
                <span className="absolute -top-1 right-0 bg-[var(--brand-accent)] text-[var(--brand-secondary)] text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-black leading-none">{cart.items.length}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category navigation bar — Flipkart-style */}
      <div className="bg-white border-b border-slate-200 hidden md:block">
        <div className="container-max flex items-center gap-0 h-11 overflow-x-auto">
          {/* All categories dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button className="flex items-center gap-1 px-4 h-11 text-xs font-bold text-slate-800 hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap" data-testid="all-categories-btn">
              <List size={16} weight="bold" /> All Categories
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full bg-white border border-slate-200 shadow-lg rounded-b min-w-[260px] z-50" data-testid="mega-categories">
                {roots.map((c) => (
                  <div key={c.id} className="group relative">
                    <Link
                      to={`/products?category=${c.id}`}
                      className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-[var(--brand-primary)] transition-colors border-b border-slate-50"
                    >
                      <span className="font-medium">{c.name}</span>
                      {c.children?.length > 0 && <CaretRight size={12} />}
                    </Link>
                    {c.children?.length > 0 && (
                      <div className="hidden group-hover:block absolute left-full top-0 bg-white border border-slate-200 shadow-lg min-w-[220px] z-50">
                        {c.children.map((sc) => (
                          <Link key={sc.id} to={`/products?category=${sc.id}`} className="block px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-[var(--brand-primary)] border-b border-slate-50 transition-colors">
                            {sc.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <Link to="/products?sort=popular" className="px-4 h-11 flex items-center text-xs font-semibold text-slate-700 hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap">Best Sellers</Link>
          <Link to="/products?featured=true" className="px-4 h-11 flex items-center text-xs font-semibold text-slate-700 hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap">Top Brands</Link>
          <Link to="/products?category=c-electronics" className="px-4 h-11 flex items-center text-xs font-semibold text-slate-700 hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap">Electronics</Link>
          <Link to="/products?category=c-industrial" className="px-4 h-11 flex items-center text-xs font-semibold text-slate-700 hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap">Industrial</Link>
          <Link to="/rfq" className="px-4 h-11 flex items-center text-xs font-semibold text-slate-700 hover:text-[var(--brand-primary)] transition-colors whitespace-nowrap">Request Quote</Link>
          <div className="ml-auto flex items-center gap-4 pr-4">
            <Link to="/policy/terms" className="text-[10px] text-slate-500 hover:text-[var(--brand-primary)]">Terms</Link>
            <Link to="/policy/privacy" className="text-[10px] text-slate-500 hover:text-[var(--brand-primary)]">Privacy</Link>
            <Link to="/policy/return" className="text-[10px] text-slate-500 hover:text-[var(--brand-primary)]">Return Policy</Link>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearch && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <form onSubmit={handleSearch} className="flex items-center gap-2 p-3 border-b border-slate-200">
            <button type="button" onClick={() => setMobileSearch(false)} className="text-slate-500 p-1">
              <X size={22} />
            </button>
            <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search products..." className="flex-1 text-sm py-2 focus:outline-none" />
            <button type="submit" className="text-[var(--brand-primary)] p-1"><MagnifyingGlass size={22} weight="bold" /></button>
          </form>
          <div className="p-4">
            <div className="text-xs font-bold text-slate-500 mb-3">Popular searches</div>
            <div className="flex flex-wrap gap-2">
              {["Drills", "LED Bulbs", "Safety Goggles", "Cables", "Packaging"].map((t) => (
                <Link key={t} to={`/products?q=${t}`} onClick={() => setMobileSearch(false)} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-700 hover:bg-slate-200">{t}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Mobile Drawer ─── */
function MobileDrawer({ open, onClose, categories, brand }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!open) return null;
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute left-0 top-0 h-full w-80 bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[var(--brand-primary)] text-white p-4 flex items-center justify-between">
          <div className="font-display font-black text-lg">{brand.storeName}</div>
          <button onClick={onClose}><X size={22} /></button>
        </div>
        <div className="p-3 border-b border-slate-100">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold">{user.name[0]}</div>
              <div>
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-[11px] text-slate-500">{user.role}</div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={onClose} className="flex-1 text-center btn-primary text-xs py-2">Login</Link>
              <Link to="/register" onClick={onClose} className="flex-1 text-center btn-ghost text-xs py-2">Register</Link>
            </div>
          )}
        </div>
        <div className="py-2">
          <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</div>
          {roots.map((c) => (
            <details key={c.id} className="border-b border-slate-50">
              <summary className="px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50">{c.name}</summary>
              <div className="pl-8 pb-2 flex flex-col gap-0.5">
                {(c.children || []).map((sc) => (
                  <Link key={sc.id} to={`/products?category=${sc.id}`} onClick={onClose} className="text-xs py-1.5 text-slate-500 hover:text-[var(--brand-primary)]">{sc.name}</Link>
                ))}
              </div>
            </details>
          ))}
        </div>
        <div className="py-2 border-t border-slate-100">
          <Link to="/products?sort=popular" onClick={onClose} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Best Sellers</Link>
          <Link to="/rfq" onClick={onClose} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Request a Quote</Link>
          <Link to="/account" onClick={onClose} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">My Account</Link>
          <Link to="/policy/terms" onClick={onClose} className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Terms & Policies</Link>
        </div>
        {user && (
          <div className="p-4 border-t border-slate-100">
            <button onClick={() => { logout(); nav("/"); onClose(); }} className="text-red-500 text-sm font-semibold">Logout</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Trust Strip (Flipkart-style) ─── */
function TrustStrip() {
  const items = [
    { icon: ShieldCheck, text: "Verified Vendors" },
    { icon: Truck, text: "Pan-India Shipping" },
    { icon: Package, text: "GST Invoicing" },
    { icon: Phone, text: "24/7 Support" },
  ];
  return (
    <div className="bg-white border-t border-slate-200 py-3 hidden md:block">
      <div className="container-max flex items-center justify-center gap-8">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
            <it.icon size={18} weight="duotone" className="text-[var(--brand-primary)]" />
            <span className="font-semibold">{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Footer ─── */
function FlipFooter({ brand, categories }) {
  return (
    <footer className="bg-[#172337] text-white mt-0">
      {/* Top — resource links */}
      <div className="border-b border-white/10">
        <div className="container-max py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-[12px]">
          <div>
            <div className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">ABOUT</div>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/policy/privacy" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/policy/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">HELP</div>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/policy/return" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link to="/policy/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
              <li><Link to="/rfq" className="hover:text-white transition-colors">Request a Quote</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">POLICY</div>
            <ul className="space-y-2 text-white/60">
              <li><Link to="/policy/return" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/policy/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link to="/policy/privacy" className="hover:text-white transition-colors">Security</Link></li>
              <li><Link to="/policy/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Mail Us:</div>
            <div className="text-white/60 text-xs leading-relaxed">
              {brand.storeName}<br />
              {brand.address}<br />
              {brand.supportEmail && <>Email: {brand.supportEmail}<br /></>}
              {brand.topBar?.customerPhone && <>Phone: {brand.topBar.customerPhone}</>}
            </div>
          </div>
        </div>
      </div>
      {/* Category links */}
      <div className="border-b border-white/10">
        <div className="container-max py-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
          {categories.filter((c) => !c.parentId).map((c) => (
            <span key={c.id}>
              {(c.children || []).slice(0, 8).map((sc, i) => (
                <span key={sc.id}>
                  <Link to={`/products?category=${sc.id}`} className="hover:text-white transition-colors">{sc.name}</Link>
                  {i < Math.min(c.children.length, 8) - 1 ? " · " : ""}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      {/* Bottom bar */}
      <div className="container-max py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[11px] text-white/60">
          <span className="font-bold text-white/80">© {new Date().getFullYear()} {brand.storeName}</span>
          <span>All rights reserved</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-white/50">
          <span>Made in India 🇮🇳</span>
          {brand.topBar?.presalesPhone && <span>Pre-Sales: {brand.topBar.presalesPhone}</span>}
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Layout ─── */
export default function StoreLayout() {
  const { settings } = useSettings();
  const { fetch: fetchCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    api.get("/categories?tree=true").then((r) => setCategories(r.data)).catch(() => {});
    if (localStorage.getItem("token")) fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const handler = () => { if (localStorage.getItem("token")) fetchCart(); };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [fetchCart]);

  const brand = settings?.brand || { storeName: "TradeHub" };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6]">
      <OffersStrip />
      <FlipkartHeader brand={brand} categories={categories} />

      {/* Mobile menu button — only on small screens in the primary bar */}
      <button className="lg:hidden fixed bottom-4 left-4 z-50 bg-[var(--brand-primary)] text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center" onClick={() => setDrawer(true)} data-testid="mobile-menu-btn">
        <List size={24} />
      </button>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} categories={categories} brand={brand} />
      <TrustStrip />

      <main className="flex-1"><Outlet /></main>

      <FlipFooter brand={brand} categories={categories} />
    </div>
  );
}
