import { useEffect, useState } from "react";
import { useCart } from "../store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../api";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

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
  const [checkoutError, setCheckoutError] = useState("");
  const [gstStatus, setGstStatus] = useState(null); // {gstVerified, gstin, details}
  const [verifying, setVerifying] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    fetch();
    api.get("/gst/me").then((r) => {
      const g = r.data;
      setGstStatus(g);
      if (g?.gstin) setAddr((a) => ({ ...a, gstin: g.gstin }));
    }).catch(() => {});
    api.get("/settings").then((r) => setBankDetails(r.data?.bankDetails || {})).catch(() => {});
  }, [fetch]);

  const verifyGst = async () => {
    if (!addr.gstin || addr.gstin.trim().length !== 15) { toast.error("Enter a 15-character GSTIN"); return; }
    setVerifying(true);
    try {
      const r = await api.post("/gst/verify", { gstin: addr.gstin.trim().toUpperCase() });
      if (r.data.valid) {
        setGstStatus({ gstVerified: true, gstin: r.data.gstin, gstDetails: r.data });
        toast.success(`GSTIN verified — ${r.data.state}`);
      } else {
        setGstStatus({ gstVerified: false });
        toast.error(r.data.error || "GSTIN not valid");
      }
    } catch (e) { toast.error(e?.response?.data?.detail || "GST verify failed"); }
    setVerifying(false);
  };

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
    if ((addr.gstin || "").trim()) {
      if (!gstStatus?.gstVerified || gstStatus.gstin?.toUpperCase() !== addr.gstin.trim().toUpperCase()) {
        toast.error("Verify your GSTIN before placing the order");
        return false;
      }
    }
    return true;
  };

  const place = async () => {
    if (!validate()) return;
    setBusy(true);
    setCheckoutError("");
    try {
      const r = await api.post("/orders/checkout", {
        address: addr, paymentMethod: method, couponCode: coupon || null,
      });
      const { order, razorpay } = r.data;
      if (method === "razorpay" && razorpay) {
        const K = window.Razorpay;
        if (!K) { setCheckoutError("Razorpay SDK failed to load. Please check your internet or refresh."); toast.error("Razorpay SDK failed to load"); setBusy(false); return; }
        const rz = new K({
          key: razorpay.keyId,
          amount: razorpay.amount, currency: razorpay.currency, order_id: razorpay.orderId,
          name: "TradeHub", description: `Order ${order.orderNo}`,
          prefill: { name: addr.fullName, contact: addr.phone },
          handler: async (resp) => {
            try {
              await api.post("/orders/verify-payment", { orderId: order.id, ...resp });
              clear(); toast.success("Payment successful!"); nav("/account");
            } catch (e) { setCheckoutError("Payment verification failed. Please retry."); toast.error("Payment verification failed"); }
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
      const detail = e?.response?.data?.detail;
      let msg;
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((d) => d.msg || d).join(", ");
      else msg = e?.response?.status >= 500 ? "Payment gateway is temporarily unavailable. Please try COD or contact support." : "Checkout failed. Please try again.";
      setCheckoutError(msg);
      toast.error(msg);
    }
    setBusy(false);
  };

  const finalTotal = Math.max(0, (cart.total || 0) - discount);
  const gstOk = gstStatus?.gstVerified && gstStatus?.gstin?.toUpperCase() === addr.gstin?.trim().toUpperCase();

  return (
    <div className="container-max py-8">
      <h1 className="text-3xl font-black mb-6">Checkout</h1>
      <div className="grid md:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <div className="card-flat p-5">
            <div className="font-display font-bold text-lg mb-3">Shipping &amp; GST details</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["fullName", "Full name *"], ["phone", "Phone *"], ["company", "Company"],
              ].map(([k, label]) => (
                <label key={k} className="text-xs">
                  <span className="text-slate-500">{label}</span>
                  <input value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
                    data-testid={`addr-${k}`}
                    className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--brand-primary)]" />
                </label>
              ))}
              {/* GSTIN + verify */}
              <div className="col-span-2 border border-[color:var(--brand-border)] rounded p-3 bg-slate-50" data-testid="gst-verify-block">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700">GSTIN (optional — required for GST invoice)</div>
                  {gstOk ? (
                    <span className="pill pill-emerald flex items-center gap-1"><CheckCircle size={12} weight="fill" /> Verified</span>
                  ) : addr.gstin ? (
                    <span className="pill pill-orange flex items-center gap-1"><WarningCircle size={12} weight="fill" /> Not verified</span>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={addr.gstin} onChange={(e) => { setAddr({ ...addr, gstin: e.target.value.toUpperCase() }); if (gstStatus?.gstin?.toUpperCase() !== e.target.value.toUpperCase()) setGstStatus((s) => ({ ...(s || {}), gstVerified: false })); }}
                    placeholder="27AACCA1234B1Z5"
                    maxLength={15}
                    data-testid="addr-gstin"
                    className="flex-1 border border-[color:var(--brand-border)] rounded-md px-3 py-2 text-sm sku uppercase focus:outline-none focus:border-[color:var(--brand-primary)]" />
                  <button
                    type="button"
                    onClick={verifyGst}
                    disabled={verifying || !addr.gstin || addr.gstin.length !== 15}
                    className="btn-primary text-xs disabled:opacity-50 whitespace-nowrap"
                    data-testid="verify-gst-btn"
                  >{verifying ? "Verifying..." : gstOk ? "Re-verify" : "Verify"}</button>
                </div>
                {gstStatus?.gstDetails?.state && (
                  <div className="mt-2 text-[11px] text-slate-500">State: <b>{gstStatus.gstDetails.state}</b> · PAN: <span className="sku">{gstStatus.gstDetails.pan}</span></div>
                )}
              </div>
              {[
                ["line1", "Address line 1 *", 2], ["line2", "Address line 2", 2],
                ["city", "City *", 1], ["state", "State *", 1], ["pincode", "Pincode *", 1], ["country", "Country", 1],
              ].map(([k, label, col]) => (
                <label key={k} className={`text-xs ${col === 2 ? "col-span-2" : ""}`}>
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
                <label key={o.v} className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${method === o.v ? "border-[color:var(--brand-primary)] bg-red-50" : "border-[color:var(--brand-border)]"}`}>
                  <input type="radio" checked={method === o.v} onChange={() => setMethod(o.v)} data-testid={`pay-${o.v}`} />
                  <span className="text-sm font-medium">{o.label}</span>
                </label>
              ))}
            </div>

            {/* Bank details shown when COD is selected */}
            {method === "cod" && bankDetails && (bankDetails.bankName || bankDetails.accountNumber) && (
              <div className="mt-4 border border-dashed border-[color:var(--brand-primary)] rounded-lg p-4 bg-red-50/50" data-testid="cod-bank-details">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded bg-[color:var(--brand-primary)] text-white flex items-center justify-center text-sm font-black">₹</div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Bank Transfer Details</div>
                    <div className="text-[11px] text-slate-500">Transfer the order amount to the account below</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {bankDetails.bankName && (
                    <><span className="text-slate-500">Bank Name</span><span className="font-semibold text-slate-800 sku">{bankDetails.bankName}</span></>
                  )}
                  {bankDetails.accountHolder && (
                    <><span className="text-slate-500">Account Holder</span><span className="font-semibold text-slate-800">{bankDetails.accountHolder}</span></>
                  )}
                  {bankDetails.accountNumber && (
                    <><span className="text-slate-500">Account Number</span><span className="font-semibold text-slate-800 sku">{bankDetails.accountNumber}</span></>
                  )}
                  {bankDetails.ifsc && (
                    <><span className="text-slate-500">IFSC Code</span><span className="font-semibold text-slate-800 sku">{bankDetails.ifsc}</span></>
                  )}
                  {bankDetails.branch && (
                    <><span className="text-slate-500">Branch</span><span className="font-semibold text-slate-800">{bankDetails.branch}</span></>
                  )}
                  {bankDetails.upiId && (
                    <><span className="text-slate-500">UPI ID</span><span className="font-semibold text-slate-800 sku">{bankDetails.upiId}</span></>
                  )}
                </div>
                <div className="mt-3 text-[11px] text-slate-500 flex items-start gap-1.5">
                  <WarningCircle size={13} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
                  <span>Please complete the bank transfer after placing the order. Your order will be processed once payment is confirmed.</span>
                </div>
              </div>
            )}
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
          {addr.gstin && !gstOk && (
            <div className="text-[11px] text-red-500 flex items-center gap-1"><WarningCircle size={12} weight="fill" /> Verify your GSTIN to continue</div>
          )}
          {checkoutError && (
            <div className="border border-red-200 bg-red-50 text-red-700 rounded p-2 text-[11px] flex items-start gap-2" data-testid="checkout-error">
              <WarningCircle size={14} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}
          <button onClick={place} disabled={busy} className="btn-primary w-full disabled:opacity-50" data-testid="place-order-btn">
            {busy ? "Placing..." : method === "razorpay" ? "Pay & Place Order" : "Place Order (COD)"}
          </button>
        </div>
      </div>
    </div>
  );
}
