import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, useCart } from "../store";
import { Check, Minus, Plus } from "@phosphor-icons/react";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    try {
      await add(p.id, next);
    } catch (err) { toast.error(err?.response?.data?.detail || "Failed"); }
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
    <div className={`card-flat relative overflow-hidden group flex flex-col ${compact ? "" : "min-w-[190px]"}`} data-testid={`product-card-${p.slug}`}>
      <span className="ribbon-48">Quick 48H</span>
      {inCart && (
        <span className="absolute top-1.5 right-1.5 z-10 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" data-testid={`incart-badge-${p.slug}`}>
          <Check size={10} weight="bold" /> In cart · {qty}
        </span>
      )}
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
          <span className="pill pill-slate">MOQ {moq}</span>
          {p.tierPricing?.length > 0 && <span className="pill pill-orange">Tier</span>}
        </div>
        {inCart ? (
          <div className="mt-2 flex items-center border border-emerald-600 rounded overflow-hidden" data-testid={`qty-ctrl-${p.slug}`}>
            <button onClick={(e) => changeQty(qty - 1, e)} className="flex-1 py-1.5 bg-emerald-600 text-white hover:brightness-110" data-testid={`qty-minus-${p.slug}`} aria-label="Decrease"><Minus size={12} weight="bold" className="mx-auto" /></button>
            <span className="px-3 py-1.5 text-xs font-black text-emerald-700 min-w-[36px] text-center sku">{qty}</span>
            <button onClick={(e) => changeQty(qty + 1, e)} className="flex-1 py-1.5 bg-emerald-600 text-white hover:brightness-110" data-testid={`qty-plus-${p.slug}`} aria-label="Increase"><Plus size={12} weight="bold" className="mx-auto" /></button>
          </div>
        ) : (
          <button
            onClick={addFresh}
            className="mt-2 block w-full text-center bg-[color:var(--brand-accent)] text-white py-1.5 rounded text-xs font-bold hover:brightness-105"
            data-testid={`buy-now-${p.slug}`}
          >Add to Cart</button>
        )}
      </div>
    </div>
  );
}
