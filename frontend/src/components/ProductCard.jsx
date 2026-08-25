import { Link } from "react-router-dom";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProductCard({ p, compact = false }) {
  const img = (p.images && p.images[0]) || "https://images.unsplash.com/photo-1518770660439-4636190af475";
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <div className={`card-flat relative overflow-hidden group flex flex-col ${compact ? "" : "min-w-[190px]"}`} data-testid={`product-card-${p.slug}`}>
      <span className="ribbon-48">Quick 48H</span>
      <Link to={`/products/${p.slug}`} className="block aspect-square bg-white p-3">
        <img src={img} alt={p.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
      </Link>
      <div className="px-3 pb-3 flex flex-col gap-1 flex-1">
        <Link to={`/products/${p.slug}`} className="text-[13px] font-semibold line-clamp-2 leading-snug min-h-[36px] hover:text-[color:var(--brand-primary)]">
          {p.name}
        </Link>
        <div className="text-[10px] text-slate-500 sku truncate">{p.sku}</div>
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="price-now text-sm">{fmt(p.price)}</span>
          {p.mrp > p.price && <span className="price-mrp">{fmt(p.mrp)}</span>}
          {off > 0 && <span className="price-off">{off}% Off</span>}
        </div>
        <div className="mt-1 flex items-center gap-1 flex-wrap text-[10px]">
          <span className="pill pill-slate">MOQ {p.moq}</span>
          {p.tierPricing?.length > 0 && <span className="pill pill-orange">Tier</span>}
        </div>
        <Link
          to={`/products/${p.slug}`}
          className="mt-2 block w-full text-center bg-[color:var(--brand-accent)] text-white py-1.5 rounded text-xs font-bold hover:brightness-105"
          data-testid={`buy-now-${p.slug}`}
        >
          Buy Now
        </Link>
      </div>
    </div>
  );
}
