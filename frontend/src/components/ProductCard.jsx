import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useCart } from "../store";
import { Check, Minus, Plus } from "@phosphor-icons/react";

const fmt = (n) => "\u20B9" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProductCard({ p, compact = false }) {
  const img = (p.images && p.images[0]) || "https://images.unsplash.com/photo-1518770660439-4636190af475";
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const { user } = useAuth();
  const { add, qtyOf } = useCart();
  const nav = useNavigate();
  const qty = qtyOf(p.id);
  const inCart = qty > 0;
  const moq = p.moq || 1;

  const changeQty = async (next, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!user) { nav("/login"); return; }
    if (next < moq) { toast.error(`Minimum ${moq}`); return; }
    try { await add(p.id, next); } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };

  const addFresh = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { nav("/login"); return; }
    try {
      await add(p.id, moq);
      toast.success(`Added ${moq} × ${p.name}`);
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
  };

  return (
    <Link
      to={`/products/${p.slug}`}
      className="block bg-white rounded overflow-hidden group border border-slate-100 hover:shadow-lg transition-all duration-200 relative"
      data-testid={`product-card-${p.slug}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-50 p-3 overflow-hidden">
        <img
          src={img}
          alt={p.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Badges */}
        {off > 0 && (
          <span className="absolute top-2 left-2 bg-[var(--brand-primary)] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">{off}% off</span>
        )}
        {inCart && (
          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" data-testid={`incart-badge-${p.slug}`}>
            <Check size={10} weight="bold" /> In cart
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2">
        <h3 className="text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug min-h-[36px] group-hover:text-[var(--brand-primary)] transition-colors">
          {p.name}
        </h3>
        {p.vendor && (
          <div className="text-[10px] text-slate-500 mt-1 truncate">by {p.vendor.companyName}</div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-black text-slate-900">{fmt(p.price)}</span>
          {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">{fmt(p.mrp)}</span>}
          {off > 0 && <span className="text-xs font-bold text-emerald-600">{off}% off</span>}
        </div>

        {/* MOQ + Tier */}
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {p.tierPricing?.length > 0 && (
            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Tier Pricing</span>
          )}
          <span className="text-[10px] text-slate-400">MOQ: {moq}</span>
        </div>

        {/* Add to cart / qty control */}
        <div className="mt-2.5">
          {inCart ? (
            <div className="flex items-center border border-emerald-500 rounded overflow-hidden" data-testid={`qty-ctrl-${p.slug}`}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeQty(qty - 1); }}
                disabled={qty <= moq}
                className="flex-1 py-2 bg-emerald-600 text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid={`qty-minus-${p.slug}`}
              >
                <Minus size={12} weight="bold" className="mx-auto" />
              </button>
              <span className="px-3 py-2 text-xs font-black text-emerald-700 min-w-[36px] text-center">{qty}</span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeQty(qty + 1); }}
                className="flex-1 py-2 bg-emerald-600 text-white hover:brightness-110"
                data-testid={`qty-plus-${p.slug}`}
              >
                <Plus size={12} weight="bold" className="mx-auto" />
              </button>
            </div>
          ) : (
            <button
              onClick={addFresh}
              className="w-full py-2 bg-[var(--brand-primary)] hover:brightness-110 text-white text-xs font-bold rounded transition-all"
              data-testid={`buy-now-${p.slug}`}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
