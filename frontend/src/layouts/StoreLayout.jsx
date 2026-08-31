import { Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth, useSettings, useCart } from "../store";
import { ShoppingCart, MagnifyingGlass, User, Storefront, List, X, Phone, Scales, Heart, CaretDown } from "@phosphor-icons/react";
import api from "../api";

function TopUtility({ brand }) {
  const tb = brand?.topBar || {};
  return (
    <div className="bg-[color:var(--brand-secondary)] text-white text-[11px]" data-testid="top-utility-bar">
      <div className="container-max py-1.5 flex flex-wrap items-center gap-x-6 gap-y-1">
        {tb.presalesPhone && <div className="flex items-center gap-1.5"><Phone size={12} weight="fill" /> <span className="opacity-70">Pre-Sales:</span> <span className="font-semibold sku">{tb.presalesPhone}</span></div>}
        {tb.customerPhone && <div className="flex items-center gap-1.5"><Phone size={12} weight="fill" /> <span className="opacity-70">Customer:</span> <span className="font-semibold sku">{tb.customerPhone}</span></div>}
        <div className="ml-auto flex items-center gap-4 opacity-90">
          <Link to="/account" className="hover:text-white/100">Track your order</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Log in</Link>
        </div>
      </div>
      {tb.offerText && (
        <div className="bg-white/5 border-t border-white/10">
          <div className="container-max py-1.5 text-center opacity-90" dangerouslySetInnerHTML={{ __html: tb.offerText.replace(/\*\*(.+?)\*\*/g, "<b class='text-[color:var(--brand-accent)]'>$1</b>") }} />
        </div>
      )}
      {tb.alertText && (
        <div className="bg-[color:var(--brand-primary)] border-t border-black/10">
          <div className="container-max py-1.5 text-center font-semibold">{tb.alertText}</div>
        </div>
      )}
    </div>
  );
}

function CategoryStrip({ categories }) {
  const roots = categories.filter((c) => !c.parentId);
  const [openId, setOpenId] = useState(null);
  return (
    <div className="bg-white border-b border-[color:var(--brand-border)] relative" data-testid="category-strip">
      <div className="container-max">
        <div className="hscroll py-2">
          {roots.map((c) => (
            <div
              key={c.id}
              onMouseEnter={() => c.children?.length && setOpenId(c.id)}
              onMouseLeave={() => setOpenId(null)}
              className="relative"
            >
              <Link to={`/products?category=${c.id}`} className="cat-tile" data-testid={`cat-tile-${c.slug}`}>
                <img src={c.image || c.promoImage || "https://via.placeholder.com/64"} alt={c.name} className="cat-tile-img" />
                <span className="mt-1 text-[11px] font-semibold text-slate-700 line-clamp-2 flex items-center gap-0.5">{c.name}{c.children?.length ? <CaretDown size={10} /> : null}</span>
              </Link>
              {openId === c.id && c.children?.length > 0 && (
                <div className="absolute left-0 top-full w-[680px] bg-white border border-[color:var(--brand-border)] mega-shadow z-40 grid grid-cols-3" data-testid={`mega-${c.slug}`}>
                  <div className="col-span-2 grid grid-cols-2 gap-1 p-5">
                    {c.children.map((sc) => (
                      <Link key={sc.id} to={`/products?category=${sc.id}`} className="text-sm py-1.5 px-2 rounded hover:bg-[color:var(--brand-bg)] hover:text-[color:var(--brand-primary)]">{sc.name}</Link>
                    ))}
                  </div>
                  <div className="col-span-1 bg-[color:var(--brand-bg)] p-4 flex flex-col">
                    {c.promoImage && <img src={c.promoImage} alt="" className="w-full h-28 object-cover rounded" />}
                    <div className="mt-2 font-bold text-sm">{c.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">{c.description}</div>
                    <Link to={`/products?category=${c.id}`} className="mt-2 text-xs font-bold text-[color:var(--brand-primary)]">Explore all →</Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
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

  const brand = settings?.brand || { storeName: "TradeHub" };

  return (
    <div className="min-h-screen flex flex-col">
      <TopUtility brand={brand} />

      <header className="bg-white border-b border-[color:var(--brand-border)] sticky top-0 z-30">
        <div className="container-max py-3 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setDrawer(true)} data-testid="mobile-menu-btn">
            <List size={26} />
          </button>
          <Link to="/" data-testid="brand-link" className="flex items-center gap-2 shrink-0">
            {brand.logo
              ? <img src={brand.logo} alt={brand.storeName} className="h-10" />
              : (
                <>
                  <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "var(--brand-primary)" }}>
                    <Storefront size={22} color="white" weight="fill" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-display font-black text-xl leading-none">{brand.storeName}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Home &amp; Industrial Supplies</div>
                  </div>
                </>
              )}
          </Link>
          <form
            onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.target).get("q"); nav(`/products?q=${encodeURIComponent(q || "")}`); }}
            className="hidden md:flex flex-1 max-w-3xl relative mx-4"
          >
            <div className="flex w-full items-stretch rounded overflow-hidden border-2 border-[color:var(--brand-primary)]">
              <select className="bg-[color:var(--brand-bg)] px-3 border-r border-[color:var(--brand-border)] text-xs font-semibold text-slate-700 focus:outline-none">
                <option>All</option>
                {categories.filter((c) => !c.parentId).map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
              <input
                name="q"
                placeholder="Search for Products, Brands, Categories..."
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
                data-testid="search-input"
              />
              <button className="bg-[color:var(--brand-primary)] text-white px-5 flex items-center gap-1 font-semibold" data-testid="search-btn">
                <MagnifyingGlass size={16} weight="bold" /> Search
              </button>
            </div>
          </form>
          <div className="flex items-center gap-1 ml-auto">
            <button
              className="md:hidden"
              onClick={() => { const q = window.prompt("Search"); if (q) nav(`/products?q=${encodeURIComponent(q)}`); }}
              data-testid="mobile-search-btn"
            >
              <MagnifyingGlass size={22} />
            </button>
            <Link to="/products?compare=1" className="hidden lg:flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="compare-link">
              <Scales size={20} />
              <span className="text-[10px] mt-0.5">Compare</span>
            </Link>
            <Link to="/account" className="hidden lg:flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="wishlist-link">
              <Heart size={20} />
              <span className="text-[10px] mt-0.5">Wishlist</span>
            </Link>
            {user ? (
              <div className="flex items-center gap-1">
                {(user.role === "super_admin" || user.role === "admin") && (
                  <Link to="/admin" className="hidden md:flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="admin-link">
                    <User size={20} weight="fill" />
                    <span className="text-[10px] mt-0.5">Admin</span>
                  </Link>
                )}
                {user.role === "vendor" && (
                  <Link to="/vendor" className="hidden md:flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="vendor-link">
                    <User size={20} weight="fill" />
                    <span className="text-[10px] mt-0.5">Vendor</span>
                  </Link>
                )}
                <Link to="/account" className="flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="account-link">
                  <User size={20} />
                  <span className="text-[10px] mt-0.5">{user.name.split(" ")[0]}</span>
                </Link>
                <button onClick={() => { logout(); nav("/"); }} className="text-[10px] text-slate-500 px-1" data-testid="logout-btn">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="login-link">
                <User size={20} />
                <span className="text-[10px] mt-0.5">Sign in</span>
              </Link>
            )}
            <Link to="/cart" className="relative flex flex-col items-center px-3 hover:text-[color:var(--brand-primary)]" data-testid="cart-link">
              <ShoppingCart size={22} />
              <span className="text-[10px] mt-0.5">Cart</span>
              {cart.items?.length > 0 && (
                <span className="absolute -top-1 right-0 bg-[color:var(--brand-primary)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{cart.items.length}</span>
              )}
            </Link>
          </div>
        </div>
        <CategoryStrip categories={categories} />
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 h-full w-80 bg-white p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="font-display font-black">{brand.storeName}</div>
              <button onClick={() => setDrawer(false)}><X size={22} /></button>
            </div>
            {categories.filter((c) => !c.parentId).map((c) => (
              <details key={c.id} className="border-b border-[color:var(--brand-border)] py-2">
                <summary className="cursor-pointer font-semibold text-sm">{c.name}</summary>
                <div className="pl-3 pt-2 flex flex-col gap-1">
                  {(c.children || []).map((sc) => (
                    <Link key={sc.id} to={`/products?category=${sc.id}`} onClick={() => setDrawer(false)} className="text-xs py-1 text-slate-600">{sc.name}</Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-[color:var(--brand-secondary)] text-white/85 mt-12">
        <div className="container-max py-10 grid grid-cols-2 md:grid-cols-5 gap-6 text-[11px]">
          <div className="col-span-2">
            <div className="font-display font-black text-white text-lg mb-2">{brand.storeName}</div>
            <p className="opacity-70">{brand.tagline}</p>
            <p className="mt-3 opacity-70">{brand.address}</p>
            <div className="mt-3 space-y-1">
              {brand.topBar?.presalesPhone && <div><span className="opacity-70">Pre-Sales:</span> <span className="sku">{brand.topBar.presalesPhone}</span></div>}
              {brand.topBar?.customerPhone && <div><span className="opacity-70">Customer:</span> <span className="sku">{brand.topBar.customerPhone}</span></div>}
              {brand.supportEmail && <div>{brand.supportEmail}</div>}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-2">Shop</div>
            <ul className="space-y-1">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?featured=true">Featured</Link></li>
              <li><Link to="/rfq">Request a Quote</Link></li>
              <li><Link to="/products?deals=1">Today's Deals</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-2">Account</div>
            <ul className="space-y-1">
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/account">My orders</Link></li>
              <li><Link to="/account">Track order</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-2">Policies</div>
            <ul className="space-y-1">
              <li><Link to="/policy/terms" data-testid="footer-terms">Terms</Link></li>
              <li><Link to="/policy/privacy" data-testid="footer-privacy">Privacy</Link></li>
              <li><Link to="/policy/return" data-testid="footer-return">Return policy</Link></li>
              <li><Link to="/policy/shipping" data-testid="footer-shipping">Shipping policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container-max py-6 border-t border-white/10 grid gap-2 text-[10px] leading-relaxed opacity-75">
          {categories.filter((c) => !c.parentId).map((c) => (
            <div key={c.id}>
              <b className="text-white/95">{c.name} :</b>{" "}
              {(c.children || []).slice(0, 12).map((sc, i) => (
                <span key={sc.id}>
                  <Link to={`/products?category=${sc.id}`} className="hover:text-white">{sc.name}</Link>
                  {i < (c.children.length - 1) ? " · " : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[11px] opacity-70">© {new Date().getFullYear()} {brand.storeName}. All rights reserved.</div>
      </footer>
    </div>
  );
}
