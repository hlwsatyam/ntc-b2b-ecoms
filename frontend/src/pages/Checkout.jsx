import { useEffect, useState } from "react";
import { useCart } from "../store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../api";

const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Checkout() {
  const { cart, fetch, clear } = useCart();
  const nav = useNavigate();
  const [addr, setAddr] = useState({
    fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
    country: "India", gstin: "", company: "",
  });
  const [method, setMethod] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const r = await api.post("/coupons/apply", { code: coupon.trim() });
      setDiscount(r.data.discount);
      setCouponMsg(`Applied · saved ${fmt(r.data.discount)}`);
      toast.success("Coupon applied");
    } catch (e) {
      setDiscount(0);
      setCouponMsg("Invalid or ineligible coupon");
      toast.error("Invalid coupon");
    }
  };

  const validate = () => {
    const required = ["fullName", "phone", "line1", "city", "state", "pincode"];
    for (const k of required) {
      if (!addr[k] || String(addr[k]).trim().length < 2) { toast.error(`Please enter ${k}`); return false; }
    }
    if (!/^[0-9]{4,10}$/.test(addr.pincode)) { toast.error("Enter a valid pincode"); return false; }
    if (!/^[0-9+\-\s]{7,15}$/.test(addr.phone)) { toast.error("Enter a valid phone"); return false; }
    return true;
  };

  const place = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const r = await api.post("/orders/checkout", {
        address: addr, paymentMethod: method, couponCode: coupon || null,
      });
      const { order, razorpay } = r.data;
      if (method === "razorpay" && razorpay) {
        const K = window.Razorpay;
        if (!K) { toast.error("Razorpay SDK failed to load"); setBusy(false); return; }
        const rz = new K({
          key: razorpay.keyId,
          amount: razorpay.amount, currency: razorpay.currency, order_id: razorpay.orderId,
          name: "TradeHub", description: `Order ${order.orderNo}`,
          prefill: { name: addr.fullName, contact: addr.phone },
          handler: async (resp) => {
            try {
              await api.post("/orders/verify-payment", { orderId: order.id, ...resp });
              clear();
              toast.success("Payment successful!");
              nav("/account");
            } catch (e) { toast.error("Payment verification failed"); }
          },
          modal: { ondismiss: () => setBusy(false) },
        });
        rz.open();
      } else {
        clear();
        toast.success(`Order ${order.orderNo} placed (COD)`);
        nav("/account");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail?.[0]?.msg || e?.response?.data?.detail || "Checkout failed");
    }
    setBusy(false);
  };

  const finalTotal = Math.max(0, (cart.total || 0) - discount);

  return (
    <div className="container-max py-8">
      <h1 className="text-3xl font-black mb-6">Checkout</h1>
      <div className="grid md:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <div className="card-flat p-5">
            <div className="font-display font-bold text-lg mb-3">Shipping & GST details</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["fullName", "Full name *"], ["phone", "Phone *"], ["company", "Company"],
                ["gstin", "GSTIN"], ["line1", "Address line 1 *"], ["line2", "Address line 2"],
                ["city", "City *"], ["state", "State *"], ["pincode", "Pincode *"], ["country", "Country"],
              ].map(([k, label]) => (
                <label key={k} className={`text-xs ${k === "line1" || k === "line2" ? "col-span-2" : ""}`}>
                  <span className="text-slate-500">{label}</span>
                  <input value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
                    data-testid={`addr-${k}`}
                    className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--brand-primary)]" />
                </label>
              ))}
            </div>
          </div>
          <div className="card-flat p-5">
            <div className="font-display font-bold text-lg mb-3">Payment method</div>
            <div className="space-y-2">
              {[
                { v: "cod", label: "Cash on Delivery (COD)" },
                { v: "razorpay", label: "Razorpay — Card / UPI / Netbanking" },
              ].map((o) => (
                <label key={o.v} className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${method === o.v ? "border-[color:var(--brand-primary)] bg-blue-50" : "border-[color:var(--brand-border)]"}`}>
                  <input type="radio" checked={method === o.v} onChange={() => setMethod(o.v)} data-testid={`pay-${o.v}`} />
                  <span className="text-sm font-medium">{o.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="card-flat p-5 h-fit space-y-3">
          <div className="text-sm font-semibold text-slate-500">SUMMARY</div>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span className="sku">{fmt(cart.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>GST</span><span className="sku">{fmt(cart.tax)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span className="sku">{fmt(cart.shipping)}</span></div>
          <div className="flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon (e.g. BULK10)" className="flex-1 border border-[color:var(--brand-border)] rounded-md px-3 py-2 text-xs uppercase" data-testid="coupon-input" />
            <button onClick={applyCoupon} className="btn-ghost text-xs" data-testid="coupon-apply">Apply</button>
          </div>
          {couponMsg && <div className={`text-[11px] ${discount ? "text-emerald-600" : "text-red-500"}`} data-testid="coupon-msg">{couponMsg}</div>}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span className="sku">−{fmt(discount)}</span></div>
          )}
          <div className="border-t border-[color:var(--brand-border)] pt-3 flex justify-between text-lg font-black">
            <span>Total</span><span className="sku" data-testid="final-total">{fmt(finalTotal)}</span>
          </div>
          <button onClick={place} disabled={busy} className="btn-primary w-full disabled:opacity-50" data-testid="place-order-btn">
            {busy ? "Placing..." : method === "razorpay" ? "Pay & Place Order" : "Place Order (COD)"}
          </button>
        </div>
      </div>
    </div>
  );
}
