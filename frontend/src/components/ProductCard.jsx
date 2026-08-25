import { Link } from "react-router-dom";
import { Star, CheckCircle } from "@phosphor-icons/react";

export default function ProductCard({ p }) {
  const img = (p.images && p.images[0]) || "https://images.unsplash.com/photo-1518770660439-4636190af475";
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <Link
      to={`/products/${p.slug}`}
      data-testid={`product-card-${p.slug}`}
      className="card-flat p-3 flex flex-col group"
    >
      <div className="aspect-square bg-[color:var(--brand-bg)] rounded overflow-hidden">
        <img src={img} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="mt-3 flex-1 flex flex-col">
        {p.vendor && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <CheckCircle size={12} weight="fill" className="text-[color:var(--brand-primary)]" />
            <span className="truncate">{p.vendor.companyName}</span>
          </div>
        )}
        <div className="text-sm font-semibold line-clamp-2">{p.name}</div>
        <div className="mt-1 text-[11px] text-slate-500 sku">{p.sku}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold">₹{p.price?.toLocaleString?.("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">MRP ₹{p.mrp?.toLocaleString?.("en-IN")}</span>}
          {off > 0 && <span className="pill pill-orange">{off}% off</span>}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span className="pill pill-yellow">MOQ {p.moq}</span>
          {p.tierPricing?.length > 0 && <span className="pill pill-blue">Tier pricing</span>}
        </div>
      </div>
    </Link>
  );
}
