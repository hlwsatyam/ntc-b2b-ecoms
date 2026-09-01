import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useSettings } from "../store";
import ProductCard from "../components/ProductCard";
import Carousel from "../components/Carousel";
import { resolveImg } from "../components/ImageUpload";
import { Lightning, CaretRight, ArrowRight, Hash, Clock, Flame, TrendUp, Sparkle } from "@phosphor-icons/react";

/* ─── Countdown Timer (Flipkart deal style) ─── */
function CountdownTimer({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  return (
    <span className="deal-timer">
      <span className="deal-timer-block">{h}</span>
      <span className="deal-timer-sep">:</span>
      <span className="deal-timer-block">{m}</span>
      <span className="deal-timer-sep">:</span>
      <span className="deal-timer-block">{s}</span>
    </span>
  );
}

/* ─── Section Header (Flipkart-style) ─── */
function FlipSectionHeader({ label, viewLink, right }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h2 className="text-base font-black text-slate-900">{label}</h2>
      <div className="flex items-center gap-3">
        {right}
        {viewLink && (
          <Link to={viewLink} className="flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline">
            View All <CaretRight size={12} weight="bold" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Category Circle Strip (Flipkart style) ─── */
function CategoryStrip({ categories }) {
  return (
    <div className="bg-white mt-1" data-testid="category-circle-strip">
      <div className="container-max py-4">
        <div className="flip-scroll">
          {categories.filter((c) => !c.parentId).map((c) => (
            <Link key={c.id} to={`/products?category=${c.id}`} className="flip-strip-item group" data-testid={`cat-circle-${c.slug}`}>
              <div className="w-[72px] h-[72px] mx-auto rounded-full overflow-hidden border-2 border-slate-100 group-hover:border-[var(--brand-primary)] transition-colors">
                <img
                  src={c.image || c.promoImage || "https://via.placeholder.com/72"}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-700 text-center leading-tight group-hover:text-[var(--brand-primary)]">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Flash Sale Strip (Flipkart-style) ─── */
function FlashSaleStrip({ flash }) {
  if (!flash) return null;
  return (
    <div className="bg-white mt-1" data-testid="flash-sale-section">
      <div className="container-max">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flame size={22} weight="fill" className="text-[var(--brand-primary)] animate-pulse" />
            <h2 className="text-base font-black text-slate-900">{flash.name}</h2>
          </div>
          <span className="deal-badge">{flash.discountPct}% OFF</span>
          <div className="ml-2 flex items-center gap-2 text-xs text-slate-500">
            <Clock size={14} />
            <span>Ends in</span>
            <CountdownTimer target={flash.endsAt} />
          </div>
          <Link to="/products" className="ml-auto btn-primary text-xs py-2 px-4">Shop Now →</Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Product Horizontal Rail (Flipkart-style) ─── */
function ProductRail({ title, source, categoryId, limit, viewLink }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", categoryId);
    if (source === "featured") p.set("featured", "true");
    if (source === "popular") p.set("sort", "popular");
    p.set("limit", String(limit || 12));
    api.get(`/products?${p.toString()}`).then((r) => setItems(r.data.items || [])).catch(() => {});
  }, [source, categoryId, limit]);

  if (items.length === 0) return null;
  return (
    <div className="bg-white mt-1" data-testid={`rail-${title?.replace(/\s/g, "-").toLowerCase()}`}>
      <FlipSectionHeader label={title} viewLink={viewLink} />
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((p) => <div key={p.id}><ProductCard p={p} compact /></div>)}
        </div>
      </div>
    </div>
  );
}

/* ─── Promo Grid (Flipkart-style 8 cards) ─── */
function PromoGrid({ cards }) {
  if (!cards?.length) return null;
  return (
    <div className="bg-white mt-1" data-testid="promo-grid-section">
      <div className="container-max py-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {cards.filter((c) => c.visible !== false).map((pc, i) => (
            <Link key={pc.id || i} to={pc.link || "/products"} className="group text-center" data-testid={`promo-card-${i}`}>
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 border border-slate-100 group-hover:shadow-md transition-shadow">
                {pc.image && (
                  <img src={resolveImg(pc.image)} alt={pc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-700 group-hover:text-[var(--brand-primary)] leading-tight">{pc.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Mid Banner (Flipkart style) ─── */
function MidBanner({ banner }) {
  if (!banner?.image) return null;
  return (
    <div className="mt-1" data-testid="mid-banner">
      <Link to={banner.link || "/products"} className="block relative overflow-hidden aspect-[21/4] bg-slate-100">
        <img src={resolveImg(banner.image)} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.65) 0%, transparent 70%)" }} />
        <div className="relative h-full flex flex-col justify-center px-8 md:px-14 text-white">
          {banner.title && <div className="font-display font-black text-xl md:text-3xl drop-shadow-lg">{banner.title}</div>}
          {banner.subtitle && <div className="text-sm mt-1 text-white/85 drop-shadow">{banner.subtitle}</div>}
        </div>
      </Link>
    </div>
  );
}

/* ─── Brand Strip (Flipkart-style) ─── */
function BrandStrip({ brands }) {
  if (!brands?.length) return null;
  return (
    <div className="bg-white mt-1" data-testid="brand-strip">
      <FlipSectionHeader label="Top Brands" viewLink="/products" />
      <div className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {brands.map((b) => (
            <Link key={b.id} to={`/products?brand=${b.id}`} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-100 hover:border-[var(--brand-primary)] hover:shadow-md transition-all group" data-testid={`brand-card-${b.slug}`}>
              {b.logo ? (
                <img src={resolveImg(b.logo)} alt={b.name} className="h-10 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[var(--brand-primary)]/10 transition-colors">
                  <span className="font-display font-black text-lg text-slate-600 group-hover:text-[var(--brand-primary)]">{b.name[0]}</span>
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 group-hover:text-[var(--brand-primary)]">{b.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── RFQ CTA (Flipkart-style banner) ─── */
function RfqBanner() {
  return (
    <div className="mt-1" data-testid="rfq-banner">
      <div className="bg-[var(--brand-secondary)]">
        <div className="container-max py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-white/50 mb-2">B2B Advantage</div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Can't find what you need?</h2>
            <p className="mt-2 text-white/60 text-sm max-w-md">Submit an RFQ and get competing quotations from verified vendors within 24 hours.</p>
          </div>
          <Link to="/rfq" className="btn-primary inline-flex items-center gap-2 text-sm px-8 py-3" data-testid="cta-rfq">
            Request a Quote <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Category Hashtags (Flipkart style) ─── */
function CategoryHashtags({ categories }) {
  const roots = categories.filter((c) => !c.parentId);
  if (!roots.length) return null;
  return (
    <div className="bg-white mt-1" data-testid="category-hashtags">
      <div className="container-max py-4 px-4">
        <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Shop by Category</div>
        <div className="flex flex-wrap gap-2">
          {roots.map((c) => (
            <div key={c.id}>
              {(c.children || []).map((sc) => (
                <Link key={sc.id} to={`/products?category=${sc.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-[var(--brand-primary)] hover:text-white text-[11px] font-medium text-slate-600 rounded-full transition-colors border border-slate-200 hover:border-[var(--brand-primary)]">
                  <Hash size={10} /> {sc.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Custom Sections Builder (from Admin CMS) ─── */
function RenderSection({ s }) {
  if (s.visible === false) return null;
  if (s.type === "banner") {
    if (!s.image) return null;
    return (
      <div className="mt-1">
        <Link to={s.link || "/products"} className="block relative overflow-hidden aspect-[21/5] bg-slate-100">
          <img src={resolveImg(s.image)} alt={s.title || ""} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.7) 0%, transparent 70%)" }} />
          <div className="relative h-full flex flex-col justify-center px-8 md:px-14 text-white max-w-md">
            {s.title && <div className="font-display font-black text-xl md:text-2xl">{s.title}</div>}
            {s.subtitle && <div className="text-xs mt-1 opacity-90">{s.subtitle}</div>}
            {s.cta && <span className="mt-3 inline-flex w-fit bg-[var(--brand-primary)] text-white text-xs font-bold px-4 py-2 rounded">{s.cta} →</span>}
          </div>
        </Link>
      </div>
    );
  }
  if (s.type === "banner_row") {
    const items = s.banners || [];
    if (!items.length) return null;
    return (
      <div className="bg-white mt-1">
        <FlipSectionHeader label={s.title || "Featured"} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {items.slice(0, 4).map((b, i) => (
            <Link key={i} to={b.link || "/products"} className="relative overflow-hidden aspect-[4/3] group border-r border-b border-slate-100 last:border-r-0">
              {b.image && <img src={resolveImg(b.image)} alt={b.title || ""} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(15,23,42,0.85))" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="font-display font-black text-sm">{b.title}</div>
                <div className="mt-1 flex items-center text-[11px] font-bold text-[var(--brand-accent)]">Explore now <CaretRight size={12} weight="bold" /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  if (s.type === "products") {
    return <ProductRail title={s.title || "Products"} source={s.source} categoryId={s.categoryId} limit={s.limit} viewLink={s.viewLink} />;
  }
  return null;
}

/* ═══════════════════════════════════════════════════════ */
/* ─── MAIN HOME PAGE ─── */
/* ═══════════════════════════════════════════════════════ */
export default function Home() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [rootCats, setRootCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [flash, setFlash] = useState([]);

  useEffect(() => {
    api.get("/products?featured=true&limit=12").then((r) => setFeatured(r.data.items || [])).catch(() => {});
    api.get("/products?sort=popular&limit=12").then((r) => setPopular(r.data.items || [])).catch(() => {});
    api.get("/categories?tree=true").then((r) => setRootCats((r.data || []).filter((c) => !c.parentId))).catch(() => {});
    api.get("/brands").then((r) => setBrands(r.data || [])).catch(() => {});
    api.get("/flash-sales?activeOnly=true").then((r) => setFlash(r.data || [])).catch(() => {});
  }, []);

  // Support both old single-banner and new multi-banner array
  const heroBanners = settings?.homepage?.heroBanners || [];
  const promoCards = (settings?.homepage?.promoCards || []).filter((c) => c.visible !== false);
  const midBanner = settings?.homepage?.midBanner;
  const sections = settings?.homepage?.sections || [];
  const activeFlash = flash[0];

  return (
    <div>
      {/* ── Carousel Banner ── */}
      <section className="container-max mt-2" data-testid="hero-carousel">
        <Carousel slides={heroBanners} interval={4500} />
      </section>

      {/* ── Category Circles ── */}
      <CategoryStrip categories={rootCats} />

      {/* ── Flash Sale with Countdown ── */}
      <FlashSaleStrip flash={activeFlash} />

      {/* ── 8 Promo Cards Grid ── */}
      <PromoGrid cards={promoCards} />

      {/* ── Brand Strip ── */}
      <BrandStrip brands={brands} />

      {/* ── Top Selling Products ── */}
      <div className="bg-white mt-1" data-testid="top-selling-section">
        <FlipSectionHeader label="Top Selling" viewLink="/products?sort=popular" />
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {featured.slice(0, 12).map((p) => <div key={p.id}><ProductCard p={p} compact /></div>)}
          </div>
        </div>
      </div>

      {/* ── Mid Banner ── */}
      <MidBanner banner={midBanner} />

      {/* ── Popular Products ── */}
      <div className="bg-white mt-1" data-testid="popular-section">
        <FlipSectionHeader label="Popular near you" viewLink="/products?sort=popular" />
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {popular.slice(0, 12).map((p) => <div key={p.id}><ProductCard p={p} compact /></div>)}
          </div>
        </div>
      </div>

      {/* ── Admin-defined Sections ── */}
      {sections.map((s) => <RenderSection key={s.id} s={s} />)}

      {/* ── Category Hashtags ── */}
      <CategoryHashtags categories={rootCats} />

      {/* ── RFQ CTA Banner ── */}
      <RfqBanner />
    </div>
  );
}
