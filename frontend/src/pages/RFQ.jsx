import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "sonner";

export default function RFQ() {
  const loc = useLocation();
  const nav = useNavigate();
  const [f, setF] = useState({
    productName: loc.state?.productName || "",
    productId: loc.state?.productId || null,
    quantity: 100, targetPrice: "", deliveryLocation: "", requiredBy: "", notes: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/rfq", { ...f, quantity: parseInt(f.quantity), targetPrice: f.targetPrice ? parseFloat(f.targetPrice) : null });
      toast.success("RFQ submitted. Vendors will respond within 24h.");
      nav("/account");
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    setBusy(false);
  };

  return (
    <div className="container-max py-8 max-w-2xl">
      <h1 className="text-3xl font-black mb-2">Request for Quotation</h1>
      <p className="text-sm text-slate-500 mb-6">Tell us what you need. Verified vendors will submit competing quotes.</p>
      <form onSubmit={submit} className="card-flat p-6 grid grid-cols-2 gap-4">
        {[
          ["productName", "Product name", "text", 2, true],
          ["quantity", "Quantity", "number", 1, true],
          ["targetPrice", "Target price (₹, optional)", "number", 1, false],
          ["deliveryLocation", "Delivery city/state", "text", 2, true],
          ["requiredBy", "Required by", "date", 1, false],
        ].map(([k, l, t, col, req]) => (
          <label key={k} className={col === 2 ? "col-span-2" : ""}>
            <span className="text-xs text-slate-500">{l}</span>
            <input type={t} required={req} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
              data-testid={`rfq-${k}`}
              className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[color:var(--brand-primary)]" />
          </label>
        ))}
        <label className="col-span-2">
          <span className="text-xs text-slate-500">Additional notes</span>
          <textarea rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })}
            data-testid="rfq-notes"
            className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[color:var(--brand-primary)]" />
        </label>
        <button disabled={busy} data-testid="rfq-submit" className="col-span-2 btn-primary disabled:opacity-50">{busy ? "Submitting..." : "Submit RFQ"}</button>
      </form>
    </div>
  );
}
