import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "sonner";
import { useAuth, useCart } from "../store";
import { CheckCircle, ShieldCheck, Package, Truck, Check } from "@phosphor-icons/react";

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const { user } = useAuth();
  const { add, qtyOf } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setP(r.data);
      setQty(r.data.moq || 1);
    });
  }, [slug]);

  if (!p) return <div className="container-max py-12">Loading...</div>;
  const inCartQty = qtyOf(p.id);

  const currentPrice = (() => {
    if (!p.tierPricing?.length) return p.price;
    let price = p.price;
    for (const t of p.tierPricing) {
      if (qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty)) price = t.price;
    }
    return price;
  })();

  const addToCart = async () => {
    if (!user) { nav("/login"); return; }
    try {
      await add(p.id, qty);
      toast.success(`Added ${qty} × ${p.name} to cart`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Add failed");
    }
  };

  return (
    <div className="container-max py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="card-flat overflow-hidden aspect-square bg-[color:var(--brand-bg)]">
            <img src={p.images[img] || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 mt-3">
            {p.images.map((im, i) => (
              <button key={i} onClick={() => setImg(i)} className={`w-16 h-16 border-2 rounded ${i === img ? "border-[color:var(--brand-primary)]" : "border-[color:var(--brand-border)]"}`}>
                <img src={im} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          {p.vendor && (
            <div className="pill pill-blue mb-2"><CheckCircle size={12} weight="fill" /> Verified · {p.vendor.companyName}</div>
          )}
          <h1 className="text-3xl md:text-4xl font-black">{p.name}</h1>
          <div className="mt-2 text-xs text-slate-500 sku">{p.sku} · HSN {p.hsn || "—"} · GST {p.gst}%</div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-black">₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {p.mrp > currentPrice && <span className="text-sm text-slate-400 line-through">MRP ₹{p.mrp?.toLocaleString("en-IN")}</span>}
            {p.mrp > currentPrice && <span className="pill pill-orange">{Math.round(((p.mrp - currentPrice) / p.mrp) * 100)}% off</span>}
          </div>

          {p.tierPricing?.length > 0 && (
            <div className="mt-4 card-flat p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">TIER PRICING · Buy more, save more</div>
              <div className="grid grid-cols-3 gap-2">
                {p.tierPricing.map((t, i) => (
                  <div key={i} className={`border rounded p-2 text-center transition-colors ${qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty) ? "border-[color:var(--brand-primary)] bg-blue-50" : "border-[color:var(--brand-border)]"}`}>
                    <div className="text-[10px] text-slate-500 sku">{t.minQty}{t.maxQty ? `–${t.maxQty}` : "+"} units</div>
                    <div className="font-bold sku">₹{t.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-[color:var(--brand-border)] rounded-md">
              <button onClick={() => setQty(Math.max(p.moq, qty - 1))} className="px-3 py-2" data-testid="qty-minus">−</button>
              <input type="number" value={qty} onChange={(e) => setQty(Math.max(p.moq, parseInt(e.target.value) || p.moq))} className="w-16 text-center py-2 border-0 outline-none sku" data-testid="qty-input" />
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2" data-testid="qty-plus">+</button>
            </div>
            <span className="pill pill-yellow">MOQ {p.moq}</span>
            <span className="text-xs text-slate-500">Stock: {p.stock}</span>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={addToCart} className="btn-primary flex-1" data-testid="add-to-cart-btn">
              {inCartQty > 0
                ? `Update cart · ₹${(currentPrice * qty).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `Add to Cart · ₹${(currentPrice * qty).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </button>
            <button onClick={() => nav("/rfq", { state: { productId: p.id, productName: p.name } })} className="btn-ghost" data-testid="rfq-btn">Request Quote</button>
          </div>
          {inCartQty > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700" data-testid="pdp-in-cart">
              <Check size={14} weight="fill" className="text-emerald-600" />
              <span><b className="sku">{inCartQty}</b> already in your cart</span>
              <button onClick={() => nav("/cart")} className="text-[color:var(--brand-primary)] font-bold hover:underline">View cart →</button>
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2"><ShieldCheck size={18} weight="duotone" className="text-[color:var(--brand-primary)]" /> Verified vendor</div>
            <div className="flex items-center gap-2"><Package size={18} weight="duotone" className="text-[color:var(--brand-primary)]" /> GST invoicing</div>
            <div className="flex items-center gap-2"><Truck size={18} weight="duotone" className="text-[color:var(--brand-primary)]" /> Pan-India shipping</div>
          </div>

          <div className="mt-8">
            <h3 className="font-display font-bold text-lg mb-2">Description</h3>
            <p className="text-sm text-slate-600">{p.description}</p>
          </div>

          {p.specifications && Object.keys(p.specifications).length > 0 && (
            <div className="mt-6">
              <h3 className="font-display font-bold text-lg mb-2">Specifications</h3>
              <div className="card-flat divide-y divide-[color:var(--brand-border)]">
                {Object.entries(p.specifications).map(([k, v]) => (
                  <div key={k} className="flex px-3 py-2 text-sm">
                    <div className="w-1/3 text-slate-500">{k}</div>
                    <div className="flex-1 sku">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
