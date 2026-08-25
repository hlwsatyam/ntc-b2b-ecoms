import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useSettings } from "../store";
import ProductCard from "../components/ProductCard";
import { Lightning, ShieldCheck, Truck, Package } from "@phosphor-icons/react";

export default function Home() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/products?featured=true&limit=10").then((r) => setFeatured(r.data.items || []));
    api.get("/categories").then((r) => setCategories((r.data || []).filter((c) => !c.parentId).slice(0, 4)));
  }, []);

  const banner = settings?.homepage?.heroBanners?.[0];

  return (
    <div>
      {/* Hero — bento */}
      <section className="container-max py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative overflow-hidden border border-[color:var(--brand-border)] rounded-lg min-h-[380px] flex items-end" data-testid="hero-banner">
            {banner?.image && <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,15,44,0.1), rgba(10,15,44,0.75))" }} />
            <div className="relative p-8 md:p-10 text-white">
              <span className="pill" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                <Lightning size={12} weight="fill" /> Verified B2B Suppliers
              </span>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                {banner?.title || "Bulk buying, better prices"}
              </h1>
              <p className="mt-3 text-sm md:text-base text-white/85 max-w-md">{banner?.subtitle}</p>
              <Link to={banner?.link || "/products"} className="btn-primary mt-6 inline-flex" data-testid="hero-cta">
                {banner?.cta || "Shop now"}
              </Link>
            </div>
          </div>
          <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="card-flat p-5" data-testid="promo-cod">
              <Truck size={26} weight="duotone" className="text-[color:var(--brand-primary)]" />
              <div className="mt-3 font-semibold">Fast shipping</div>
              <div className="text-xs text-slate-500 mt-1">Shiprocket-powered PAN India</div>
            </div>
            <div className="card-flat p-5" data-testid="promo-gst">
              <ShieldCheck size={26} weight="duotone" className="text-[color:var(--brand-primary)]" />
              <div className="mt-3 font-semibold">GST invoicing</div>
              <div className="text-xs text-slate-500 mt-1">Claim ITC on every order</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-max py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-black">Shop by category</h2>
          <Link to="/products" className="text-sm font-semibold text-[color:var(--brand-primary)]">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category=${c.id}`} data-testid={`home-cat-${c.slug}`} className="card-flat relative overflow-hidden aspect-[4/3] group">
              {c.image && <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(10,15,44,0.85))" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="font-display font-bold text-lg">{c.name}</div>
                <div className="text-[11px] text-white/80">{c.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-max py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-black">Featured wholesale deals</h2>
          <Link to="/products" className="text-sm font-semibold text-[color:var(--brand-primary)]">See more →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* B2B CTA */}
      <section className="container-max py-12">
        <div className="rounded-lg p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center" style={{ background: "var(--brand-secondary)" }}>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white">Can't find what you need?</h2>
            <p className="mt-2 text-white/70">Submit an RFQ. Verified vendors respond within 24 hours with quotations for your bulk requirement.</p>
          </div>
          <div className="flex md:justify-end">
            <Link to="/rfq" className="btn-primary" data-testid="cta-rfq">Request a Quote →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
