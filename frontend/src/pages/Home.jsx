import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useSettings } from "../store";
import ProductCard from "../components/ProductCard";
import { resolveImg } from "../components/ImageUpload";
import { Lightning, CaretRight, ShieldCheck, Truck, ArrowRight, Hash } from "@phosphor-icons/react";

function SectionHeader({ label, viewLink }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-8">
      <h2 className="section-title">{label}</h2>
      {viewLink && <Link to={viewLink} className="text-xs font-bold text-[color:var(--brand-primary)] hover:underline">View More →</Link>}
    </div>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [rootCats, setRootCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [flash, setFlash] = useState([]);

  useEffect(() => {
    api.get("/products?featured=true&limit=12").then((r) => setFeatured(r.data.items || []));
    api.get("/categories?tree=true").then((r) => setRootCats((r.data || []).filter((c) => !c.parentId)));
    api.get("/brands").then((r) => setBrands(r.data || []));
    api.get("/flash-sales?activeOnly=true").then((r) => setFlash(r.data || [])).catch(() => {});
  }, []);

  const banner = settings?.homepage?.heroBanners?.[0];
  const promoCards = settings?.homepage?.promoCards || [];
  const midBanner = settings?.homepage?.midBanner;
  const activeFlash = flash[0];

  return (
    <div>
      {/* 1. HERO BANNER (admin-managed) */}
      <section className="container-max py-4">
        <Link to={banner?.link || "/products"} className="block relative overflow-hidden rounded aspect-[3.5/1] bg-slate-100" data-testid="hero-banner">
          {banner?.image && <img src={resolveImg(banner.image)} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.2) 60%, transparent 100%)" }} />
          <div className="relative h-full flex flex-col justify-center p-6 md:p-10 text-white max-w-lg">
            <span className="pill pill-red uppercase w-fit">Verified B2B Suppliers</span>
            <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight">{banner?.title || "Bulk buying, better prices"}</h1>
            <p className="mt-2 text-sm text-white/85">{banner?.subtitle}</p>
            <span className="btn-primary mt-4 inline-flex w-fit">{banner?.cta || "Shop now"} →</span>
          </div>
        </Link>
      </section>

      {/* 2. 8 PROMO CARDS (admin-managed image + link each) */}
      {promoCards.length > 0 && (
        <section className="container-max">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" data-testid="promo-cards">
            {promoCards.slice(0, 8).map((pc, i) => (
              <Link key={pc.id || i} to={pc.link || "/products"} className="card-flat relative aspect-square overflow-hidden group" data-testid={`promo-card-${i}`}>
                {pc.image && <img src={resolveImg(pc.image)} alt={pc.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 55%, rgba(15,23,42,0.85))" }} />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-[11px] font-black uppercase text-center leading-tight">{pc.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Brand strip */}
      {brands.length > 0 && (
        <section className="container-max py-6">
          <div className="hscroll">
            {brands.map((b) => (
              <Link key={b.id} to={`/products?brand=${b.id}`} className="shrink-0 w-32 h-16 card-flat flex items-center justify-center p-2" data-testid={`brand-strip-${b.slug}`}>
                {b.logo ? <img src={resolveImg(b.logo)} alt={b.name} className="max-h-10 max-w-full object-contain" /> : <span className="font-display font-black text-slate-700 text-lg">{b.name}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeFlash && (
        <section className="container-max">
          <Link to="/products" className="flex items-center gap-3 p-4 rounded text-white overflow-hidden" style={{ background: "linear-gradient(90deg, var(--brand-primary), var(--brand-accent))" }} data-testid="flash-sale-banner">
            <Lightning size={26} weight="fill" className="animate-pulse" />
            <div className="flex-1">
              <div className="font-display font-black text-lg">{activeFlash.name} · {activeFlash.discountPct}% OFF</div>
              <div className="text-[11px] opacity-90">Ends {new Date(activeFlash.endsAt).toLocaleString()}</div>
            </div>
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded font-bold">Shop now</span>
          </Link>
        </section>
      )}

      {/* 3. TOP SELLING PRODUCT LIST */}
      <section className="container-max">
        <SectionHeader label="Top Selling" viewLink="/products?sort=popular" />
        <div className="hscroll">
          {featured.slice(0, 12).map((p) => (
            <div key={p.id} className="w-[190px]"><ProductCard p={p} /></div>
          ))}
        </div>
      </section>

      {/* 4. MID BANNER (admin-managed) */}
      {midBanner?.image && (
        <section className="container-max mt-8">
          <Link to={midBanner.link || "/products"} className="block relative rounded overflow-hidden aspect-[5/1] bg-slate-100" data-testid="mid-banner">
            <img src={resolveImg(midBanner.image)} alt={midBanner.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.7), transparent)" }} />
            <div className="relative h-full flex flex-col justify-center p-6 md:p-8 text-white max-w-md">
              <div className="font-display font-black text-xl md:text-2xl">{midBanner.title}</div>
              {midBanner.subtitle && <div className="text-xs mt-1 opacity-90">{midBanner.subtitle}</div>}
              <span className="mt-3 inline-flex w-fit pill pill-red uppercase">Explore now →</span>
            </div>
          </Link>
        </section>
      )}

      {/* All products list */}
      <section className="container-max">
        <SectionHeader label="Featured Wholesale Deals" viewLink="/products" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {featured.slice(0, 12).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* 5. CATEGORY #SUBCATEGORY HASHTAG LIST */}
      <section className="container-max mt-10 mb-6" data-testid="category-hashtag-list">
        <div className="card-flat p-6">
          <h2 className="section-title mb-4">Shop by category</h2>
          <div className="space-y-3 text-[12px] leading-relaxed">
            {rootCats.map((c) => (
              <div key={c.id}>
                <b className="text-slate-900">{c.name} :</b>{" "}
                {(c.children || []).map((sc, i) => (
                  <span key={sc.id}>
                    <Link to={`/products?category=${sc.id}`} className="inline-flex items-center gap-0.5 text-slate-600 hover:text-[color:var(--brand-primary)]">
                      <Hash size={10} />{sc.name}
                    </Link>
                    {i < (c.children.length - 1) ? <span className="text-slate-300"> · </span> : ""}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B CTA */}
      <section className="container-max py-10">
        <div className="rounded p-6 md:p-10 grid md:grid-cols-2 gap-6 items-center" style={{ background: "var(--brand-secondary)" }}>
          <div className="text-white">
            <span className="text-[11px] uppercase tracking-widest opacity-80">B2B advantage</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2">Can't find what you need?</h2>
            <p className="mt-2 text-white/70 text-sm">Submit an RFQ. Verified vendors respond within 24 hours with quotations for your bulk requirement.</p>
          </div>
          <div className="flex md:justify-end">
            <Link to="/rfq" className="btn-primary inline-flex items-center gap-2" data-testid="cta-rfq">Request a Quote <ArrowRight size={16} weight="bold" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
