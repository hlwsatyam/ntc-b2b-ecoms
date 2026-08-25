import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useSettings } from "../store";
import ProductCard from "../components/ProductCard";
import { Lightning, CaretRight, ShieldCheck, Truck, HeadCircuit, ArrowRight } from "@phosphor-icons/react";

function SectionHeader({ label, right, viewLink }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-8">
      <h2 className="section-title">{label}</h2>
      {viewLink && <Link to={viewLink} className="text-xs font-bold text-[color:var(--brand-primary)] hover:underline">View More →</Link>}
      {right}
    </div>
  );
}

function BrandStrip({ brands }) {
  if (!brands?.length) return null;
  return (
    <section className="container-max py-4">
      <div className="hscroll">
        {brands.map((b) => (
          <Link key={b.id} to={`/products?brand=${b.id}`} className="shrink-0 w-32 h-16 card-flat flex items-center justify-center p-2" data-testid={`brand-${b.slug}`}>
            {b.logo
              ? <img src={b.logo} alt={b.name} className="max-h-10 max-w-full object-contain" />
              : <span className="font-display font-black text-slate-700 text-lg">{b.name}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [all, setAll] = useState([]);
  const [rootCats, setRootCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [flash, setFlash] = useState([]);

  useEffect(() => {
    api.get("/products?featured=true&limit=12").then((r) => setFeatured(r.data.items || []));
    api.get("/products?limit=30").then((r) => setAll(r.data.items || []));
    api.get("/categories?tree=true").then((r) => setRootCats((r.data || []).filter((c) => !c.parentId)));
    api.get("/brands").then((r) => setBrands(r.data || []));
    api.get("/flash-sales?activeOnly=true").then((r) => setFlash(r.data || [])).catch(() => {});
  }, []);

  const banner = settings?.homepage?.heroBanners?.[0];
  const activeFlash = flash[0];

  return (
    <div>
      {/* Hero */}
      <section className="container-max py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 relative overflow-hidden rounded aspect-[3/1] lg:aspect-[3.2/1] bg-slate-100" data-testid="hero-banner">
            {banner?.image && <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.3) 60%, transparent 100%)" }} />
            <div className="relative h-full flex flex-col justify-center p-6 lg:p-10 text-white max-w-lg">
              <span className="pill pill-red uppercase w-fit">Verified B2B Suppliers</span>
              <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight">{banner?.title || "Bulk buying, better prices"}</h1>
              <p className="mt-2 text-sm text-white/85">{banner?.subtitle}</p>
              <Link to={banner?.link || "/products"} className="btn-primary mt-4 inline-flex w-fit" data-testid="hero-cta">{banner?.cta || "Shop now"} →</Link>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-3">
            <div className="card-flat p-4 flex items-center gap-3">
              <Truck size={30} weight="duotone" className="text-[color:var(--brand-primary)] shrink-0" />
              <div>
                <div className="font-bold text-sm">Fast shipping</div>
                <div className="text-[11px] text-slate-500">Shiprocket · PAN India</div>
              </div>
            </div>
            <div className="card-flat p-4 flex items-center gap-3">
              <ShieldCheck size={30} weight="duotone" className="text-[color:var(--brand-primary)] shrink-0" />
              <div>
                <div className="font-bold text-sm">GST invoicing</div>
                <div className="text-[11px] text-slate-500">Claim ITC on every order</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <BrandStrip brands={brands} />

      {/* Flash sale */}
      {activeFlash && (
        <section className="container-max">
          <Link to="/products" className="flex items-center gap-3 p-4 rounded text-white overflow-hidden relative" style={{ background: "linear-gradient(90deg, var(--brand-primary), var(--brand-accent))" }} data-testid="flash-sale-banner">
            <Lightning size={28} weight="fill" className="animate-pulse" />
            <div className="flex-1">
              <div className="font-display font-black text-lg">{activeFlash.name} · {activeFlash.discountPct}% OFF</div>
              <div className="text-[11px] opacity-90">Ends {new Date(activeFlash.endsAt).toLocaleString()}</div>
            </div>
            <span className="bg-white/20 text-white text-xs px-3 py-1.5 rounded font-bold">Shop now</span>
          </Link>
        </section>
      )}

      {/* Save Upto 70% OFF section — top brand tiles */}
      <section className="container-max">
        <SectionHeader label="Save Upto 70% OFF on Top Brands" viewLink="/products" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rootCats.slice(0, 4).map((c) => (
            <Link key={c.id} to={`/products?category=${c.id}`} className="card-flat relative overflow-hidden aspect-[4/3] group" data-testid={`home-cat-${c.slug}`}>
              {c.image && <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.9))" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="font-display font-black text-lg">{c.name}</div>
                <div className="text-[11px] opacity-90">{c.description}</div>
                <div className="mt-1 flex items-center text-[11px] font-bold text-[color:var(--brand-accent)]">Explore now <CaretRight size={12} weight="bold" /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Selling — horizontal carousel */}
      <section className="container-max">
        <SectionHeader label="Top Selling" viewLink="/products?sort=popular" />
        <div className="hscroll" data-testid="top-selling-row">
          {featured.slice(0, 12).map((p) => (
            <div key={p.id} className="w-[190px]"><ProductCard p={p} /></div>
          ))}
        </div>
      </section>

      {/* Per-category sections — banner + subcategory tiles + product row */}
      {rootCats.slice(0, 3).map((c) => {
        const catProducts = all.filter((p) => p.categoryId === c.id || (c.children || []).some((sc) => sc.id === p.categoryId));
        return (
          <section key={c.id} className="container-max">
            <SectionHeader label={c.name} viewLink={`/products?category=${c.id}`} />
            <div className="grid lg:grid-cols-[280px_1fr] gap-3">
              <div className="flex flex-col gap-3">
                {c.promoImage && (
                  <Link to={`/products?category=${c.id}`} className="relative rounded overflow-hidden aspect-[3/2] group">
                    <img src={c.promoImage} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/25" />
                    <div className="absolute inset-0 p-3 flex flex-col justify-end text-white">
                      <div className="font-display font-black">{c.name}</div>
                    </div>
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {(c.children || []).slice(0, 4).map((sc) => (
                    <Link key={sc.id} to={`/products?category=${sc.id}`} className="card-flat p-3 text-center text-xs hover:text-[color:var(--brand-primary)]">
                      <div className="font-bold">{sc.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Explore now →</div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hscroll">
                {(catProducts.length ? catProducts : all).slice(0, 12).map((p) => (
                  <div key={p.id} className="w-[190px]"><ProductCard p={p} /></div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* B2B CTA */}
      <section className="container-max py-10">
        <div className="rounded p-6 md:p-10 grid md:grid-cols-2 gap-6 items-center" style={{ background: "var(--brand-secondary)" }}>
          <div className="text-white">
            <div className="flex items-center gap-2"><HeadCircuit size={22} weight="duotone" /> <span className="text-[11px] uppercase tracking-widest opacity-80">B2B advantage</span></div>
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
