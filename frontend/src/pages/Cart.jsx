import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useCart } from "../store";
import { toast } from "sonner";
import { Trash, Plus, Minus } from "@phosphor-icons/react";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Cart() {
  const { user } = useAuth();
  const { cart, fetch, remove, add } = useCart();
  const nav = useNavigate();

  useEffect(() => { if (user) fetch(); }, [user, fetch]);

  const updateQty = async (it, next) => {
    if (next < (it.moq || 1)) {
      toast.error(`Minimum order quantity is ${it.moq}`);
      return;
    }
    try { await add(it.productId, next); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  if (!user) return (
    <div className="container-max py-12 text-center">
      <h2 className="text-2xl font-black mb-3">Sign in to view your cart</h2>
      <Link to="/login" className="btn-primary inline-flex">Sign in</Link>
    </div>
  );

  if (!cart.items?.length) return (
    <div className="container-max py-12 text-center">
      <h2 className="text-2xl font-black mb-3">Your cart is empty</h2>
      <Link to="/products" className="btn-primary inline-flex">Continue shopping</Link>
    </div>
  );

  return (
    <div className="container-max py-8">
      <h1 className="text-3xl font-black mb-6">Cart · {cart.items.length} items</h1>
      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        <div className="card-flat divide-y divide-[color:var(--brand-border)]">
          {cart.items.map((it) => (
            <div key={it.productId} className="p-4 flex gap-4" data-testid={`cart-item-${it.productId}`}>
              <img src={it.image} alt={it.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{it.name}</div>
                <div className="text-[11px] text-slate-500 sku mt-0.5">{it.sku} · MOQ {it.moq}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center border border-[color:var(--brand-border)] rounded overflow-hidden" data-testid={`cart-qty-${it.productId}`}>
                    <button
                      onClick={() => updateQty(it, it.quantity - 1)}
                      disabled={it.quantity <= (it.moq || 1)}
                      className="px-2 py-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid={`cart-minus-${it.productId}`}
                      aria-label="Decrease"
                    ><Minus size={12} weight="bold" /></button>
                    <span className="px-3 text-xs font-bold sku min-w-[40px] text-center">{it.quantity}</span>
                    <button
                      onClick={() => updateQty(it, it.quantity + 1)}
                      disabled={it.stock && it.quantity >= it.stock}
                      className="px-2 py-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid={`cart-plus-${it.productId}`}
                      aria-label="Increase"
                    ><Plus size={12} weight="bold" /></button>
                  </div>
                  <span className="text-[11px] text-slate-500 sku">{fmt(it.unitPrice)} each</span>
                  <span className="pill pill-blue">GST {it.gst}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold sku">{fmt(it.lineTotal)}</div>
                <button
                  onClick={() => { remove(it.productId); toast("Removed"); }}
                  className="text-red-500 mt-2 hover:text-red-700"
                  data-testid={`remove-${it.productId}`}
                  aria-label="Remove"
                ><Trash size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="card-flat p-5 h-fit space-y-3">
          <div className="text-sm font-semibold text-slate-500">ORDER SUMMARY</div>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span className="sku">{fmt(cart.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>GST</span><span className="sku">{fmt(cart.tax)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span className="sku">{fmt(cart.shipping)}</span></div>
          <div className="border-t border-[color:var(--brand-border)] pt-3 flex justify-between text-lg font-black">
            <span>Total</span><span className="sku">{fmt(cart.total)}</span>
          </div>
          <button onClick={() => nav("/checkout")} className="btn-primary w-full" data-testid="checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
