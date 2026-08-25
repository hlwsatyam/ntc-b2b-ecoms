import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, ArrowDownLeft } from "@phosphor-icons/react";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function VendorWallet() {
  const [data, setData] = useState(null);
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/wallet/vendor").then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  const request = async () => {
    const amt = parseFloat(amount);
    if (!(amt > 0)) { toast.error("Enter valid amount"); return; }
    setBusy(true);
    try {
      await api.post("/payouts/request", { amount: amt });
      toast.success("Payout request submitted");
      setShow(false); setAmount(""); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    setBusy(false);
  };

  if (!data) return <div>Loading...</div>;
  const { vendor, transactions, payouts } = data;

  return (
    <div>
      <h1 className="text-3xl font-black mb-1">Wallet & Payouts</h1>
      <p className="text-sm text-slate-500 mb-6">{vendor.companyName} · Commission {vendor.commissionPct}%</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-flat p-5" data-testid="wallet-balance">
          <Wallet size={22} weight="duotone" className="text-[color:var(--brand-primary)]" />
          <div className="mt-3 text-3xl font-black sku">{fmt(vendor.walletBalance)}</div>
          <div className="text-xs text-slate-500">Available balance</div>
          <button onClick={() => setShow(true)} className="btn-primary mt-4 text-xs" data-testid="request-payout-btn">Request payout</button>
        </div>
        <div className="card-flat p-5">
          <div className="text-xs text-slate-500">Lifetime credited</div>
          <div className="mt-2 text-2xl font-black sku">{fmt(transactions.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount || 0), 0))}</div>
        </div>
        <div className="card-flat p-5">
          <div className="text-xs text-slate-500">Total paid out</div>
          <div className="mt-2 text-2xl font-black sku">{fmt(payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0))}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-flat overflow-hidden">
          <div className="p-3 border-b border-[color:var(--brand-border)] font-semibold text-sm">Wallet transactions</div>
          <div className="divide-y divide-[color:var(--brand-border)] max-h-96 overflow-y-auto">
            {transactions.length === 0 && <div className="p-6 text-xs text-slate-500 text-center">No transactions yet — earnings appear here when your orders are delivered.</div>}
            {transactions.map((t) => (
              <div key={t.id} className="p-3 flex items-center gap-3 text-xs" data-testid={`txn-${t.id}`}>
                {t.type === "credit"
                  ? <ArrowDownLeft size={16} className="text-emerald-600" />
                  : <ArrowUpRight size={16} className="text-red-500" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.note}</div>
                  <div className="text-slate-500 text-[10px]">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className={`font-bold sku ${t.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                  {t.type === "credit" ? "+" : ""}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-flat overflow-hidden">
          <div className="p-3 border-b border-[color:var(--brand-border)] font-semibold text-sm">Payout requests</div>
          <div className="divide-y divide-[color:var(--brand-border)] max-h-96 overflow-y-auto">
            {payouts.length === 0 && <div className="p-6 text-xs text-slate-500 text-center">No payouts yet.</div>}
            {payouts.map((p) => (
              <div key={p.id} className="p-3 text-xs" data-testid={`payout-${p.id}`}>
                <div className="flex justify-between">
                  <span className="font-semibold sku">{fmt(p.amount)}</span>
                  <span className={`pill ${p.status === "paid" ? "pill-emerald" : p.status === "rejected" ? "pill-orange" : "pill-blue"}`}>{p.status}</span>
                </div>
                <div className="text-slate-500 text-[10px] mt-1">{p.method} · {new Date(p.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">Request Payout</h2>
            <p className="text-xs text-slate-500 mt-1">Available: {fmt(vendor.walletBalance)}</p>
            <label className="block text-xs mt-4">
              <span className="text-slate-500">Amount (₹)</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                data-testid="payout-amount"
                className="mt-1 w-full border rounded px-3 py-2" />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="btn-ghost">Cancel</button>
              <button onClick={request} disabled={busy} className="btn-primary disabled:opacity-50" data-testid="submit-payout">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
