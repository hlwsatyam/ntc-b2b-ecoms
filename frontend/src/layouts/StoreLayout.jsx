import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth, useSettings, useCart } from "../store";
import { ShoppingCartSimple, MagnifyingGlass, User, Storefront, List, X, House } from "@phosphor-icons/react";
import api from "../api";

function MegaMenu({ categories }) {
  const [open, setOpen] = useState(null);
  const roots = categories.filter((c) => !c.parentId);
  return (
    <nav className="hidden lg:flex items-center gap-1 h-12 border-t border-[color:var(--brand-border)]" data-testid="mega-menu">
      {roots.map((c) => (
        <div
          key={c.id}
          onMouseEnter={() => setOpen(c.id)}
          onMouseLeave={() => setOpen(null)}
          className="relative h-full"
        >
          <Link
            to={`/products?category=${c.id}`}
            data-testid={`menu-cat-${c.slug}`}
            className="flex items-center px-4 h-full text-sm font-medium hover:text-[color:var(--brand-primary)] transition-colors"
          >
            {c.name}
          </Link>
          {open === c.id && c.children && c.children.length > 0 && (
            <div className="absolute left-0 top-full w-[720px] bg-white border border-[color:var(--brand-border)] mega-shadow z-50 grid grid-cols-3 gap-0" data-testid={`megamenu-panel-${c.slug}`}>
              <div className="col-span-2 grid grid-cols-2 gap-2 p-6">
                {c.children.map((sc) => (
                  <Link
                    key={sc.id}
                    to={`/products?category=${sc.id}`}
                    className="text-sm py-2 px-2 rounded hover:bg-[color:var(--brand-bg)] hover:text-[color:var(--brand-primary)] transition-colors"
                  >
                    {sc.name}
                  </Link>
                ))}
              </div>
              <div className="col-span-1 p-4 bg-[color:var(--brand-bg)] flex flex-col">
                {c.promoImage && (
                  <img src={c.promoImage} alt={c.name} className="w-full h-32 object-cover rounded" />
                )}
                <div className="mt-3 text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</div>
                <Link to={`/products?category=${c.id}`} className="mt-3 text-xs font-semibold text-[color:var(--brand-primary)] hover:underline">
                  Explore all →
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export default function StoreLayout() {
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const { cart, fetch: fetchCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/categories?tree=true").then((r) => setCategories(r.data)).catch(() => {});
    if (localStorage.getItem("token")) fetchCart();
  }, [fetchCart]);

  const brand = settings?.brand || { storeName: "TradeHub", tagline: "" };
  const ann = settings?.homepage?.announcementBar;

  return (
    <div className="min-h-screen flex flex-col">
      {ann && (
        <div className="text-xs text-white text-center py-2 px-4" style={{ background: "var(--brand-secondary)" }} data-testid="announcement-bar">
          {ann}
        </div>
      )}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[color:var(--brand-border)]">
        <div className="container-max flex items-center gap-4 py-3">
          <button className="lg:hidden" onClick={() => setDrawer(true)} data-testid="mobile-menu-btn">
            <List size={24} />
          </button>
          <Link to="/" data-testid="brand-link" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "var(--brand-primary)" }}>
              <Storefront size={18} color="white" weight="fill" />
            </div>
            <span className="font-display font-black text-xl">{brand.storeName}</span>
          </Link>
          <form
            onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.target).get("q"); nav(`/products?q=${encodeURIComponent(q || "")}`); }}
            className="hidden md:flex flex-1 max-w-2xl relative"
          >
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              placeholder="Search products, brands, SKUs..."
              className="w-full pl-10 pr-4 py-2.5 border border-[color:var(--brand-border)] rounded-md text-sm focus:outline-none focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--brand-primary)]/20"
              data-testid="search-input"
            />
          </form>
          <button
            className="md:hidden ml-auto"
            onClick={() => { const q = window.prompt("Search products, brands, SKUs..."); if (q) nav(`/products?q=${encodeURIComponent(q)}`); }}
            data-testid="mobile-search-btn"
            aria-label="Search"
          >
            <MagnifyingGlass size={22} />
          </button>
          <div className="flex items-center gap-1 ml-auto">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "super_admin" || user.role === "admin" ? (
                  <Link to="/admin" className="hidden md:inline-flex btn-ghost text-xs" data-testid="admin-link">Admin</Link>
                ) : null}
                {user.role === "vendor" ? (
                  <Link to="/vendor" className="hidden md:inline-flex btn-ghost text-xs" data-testid="vendor-link">Vendor</Link>
                ) : null}
                <Link to="/account" className="btn-ghost text-xs flex items-center gap-1.5" data-testid="account-link">
                  <User size={16} /> {user.name.split(" ")[0]}
                </Link>
                <button onClick={() => { logout(); nav("/"); }} className="text-xs text-slate-500 px-2" data-testid="logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="btn-ghost text-xs flex items-center gap-1.5" data-testid="login-link">
                <User size={16} /> Sign in
              </Link>
            )}
            <Link to="/cart" className="relative btn-ghost text-xs flex items-center gap-1.5" data-testid="cart-link">
              <ShoppingCartSimple size={16} /> Cart
              {cart.items?.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[color:var(--brand-accent)] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cart.items.length}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="container-max">
          <MegaMenu categories={categories} />
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-display font-black">{brand.storeName}</div>
              <button onClick={() => setDrawer(false)}><X size={22} /></button>
            </div>
            {categories.filter((c) => !c.parentId).map((c) => (
              <details key={c.id} className="border-b border-[color:var(--brand-border)] py-2">
                <summary className="cursor-pointer font-medium text-sm">{c.name}</summary>
                <div className="pl-3 pt-2 flex flex-col gap-1">
                  {(c.children || []).map((sc) => (
                    <Link key={sc.id} to={`/products?category=${sc.id}`} onClick={() => setDrawer(false)} className="text-xs py-1 text-slate-600">
                      {sc.name}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-[color:var(--brand-secondary)] text-white/80 mt-16">
        <div className="container-max py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="font-display font-black text-white text-lg mb-3">{brand.storeName}</div>
            <p className="text-xs">{brand.tagline}</p>
            <p className="text-xs mt-3">{brand.address}</p>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">Shop</div>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?featured=true">Featured</Link></li>
              <li><Link to="/rfq">Request a Quote</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">Account</div>
            <ul className="space-y-2 text-xs">
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/account">My orders</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-3">Contact</div>
            <ul className="space-y-2 text-xs">
              <li>{brand.supportEmail}</li>
              <li>{brand.phone}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} {brand.storeName}. All rights reserved.</div>
      </footer>
    </div>
  );
}
