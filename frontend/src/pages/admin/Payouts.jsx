import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminPayouts() {
  const [rows, setRows] = useState([]);
  const load = () => api.get("/payouts").then((r) => setRows(r.data || []));
  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try {
      await api.put(`/payouts/${id}/status`, { status });
      toast.success(`Payout ${status}`); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <h1 className="text-3xl font-black mb-6">Vendor Payouts</h1>
      <div className="card-flat overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="text-left p-3">Vendor</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Method</th><th className="text-left p-3">Status</th><th className="text-left p-3">Requested</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-border)]">
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No payout requests yet.</td></tr>}
            {rows.map((p) => (
              <tr key={p.id} data-testid={`admin-payout-${p.id}`}>
                <td className="p-3 font-medium">{p.vendorName}</td>
                <td className="p-3 text-right sku font-bold">{fmt(p.amount)}</td>
                <td className="p-3 text-xs">{p.method}</td>
                <td className="p-3"><span className={`pill ${p.status === "paid" ? "pill-emerald" : p.status === "rejected" ? "pill-orange" : "pill-blue"}`}>{p.status}</span></td>
                <td className="p-3 text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="p-3 text-right flex gap-2 justify-end">
                  {p.status === "pending" && (
                    <>
                      <button onClick={() => update(p.id, "paid")} className="text-emerald-600 text-xs font-semibold" data-testid={`pay-${p.id}`}>Mark paid</button>
                      <button onClick={() => update(p.id, "rejected")} className="text-red-500 text-xs">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
