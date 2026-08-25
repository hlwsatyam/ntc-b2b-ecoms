import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useCart } from "../store";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";

export default function Cart() {
  const { user } = useAuth();
  const { cart, fetch, remove } = useCart();
  const nav = useNavigate();

  useEffect(() => { if (user) fetch(); }, [user, fetch]);

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
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="sku">₹{it.unitPrice} × {it.quantity}</span>
                  <span className="pill pill-blue">GST {it.gst}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold sku">₹{it.lineTotal.toLocaleString("en-IN")}</div>
                <button onClick={() => { remove(it.productId); toast("Removed"); }} className="text-red-500 mt-2" data-testid={`remove-${it.productId}`}>
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="card-flat p-5 h-fit space-y-3">
          <div className="text-sm font-semibold text-slate-500">ORDER SUMMARY</div>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span className="sku">₹{cart.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-sm"><span>GST</span><span className="sku">₹{cart.tax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span className="sku">₹{cart.shipping.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="border-t border-[color:var(--brand-border)] pt-3 flex justify-between text-lg font-black">
            <span>Total</span><span className="sku">₹{cart.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button onClick={() => nav("/checkout")} className="btn-primary w-full" data-testid="checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
