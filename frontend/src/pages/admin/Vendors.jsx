import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const load = () => api.get("/vendors").then((r) => setVendors(r.data || []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id, status) => { try { await api.put(`/vendors/${id}/approve`, { status }); toast.success("Updated"); load(); } catch (e) { toast.error("Failed"); } };
  return (
    <div>
      <h1 className="text-3xl font-black mb-6">Vendors</h1>
      <div className="card-flat overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="text-left p-3">Company</th><th className="text-left p-3">Email</th><th className="text-left p-3">GSTIN</th><th className="text-left p-3">Status</th><th></th></tr></thead>
          <tbody className="divide-y divide-[color:var(--brand-border)]">
            {vendors.map((v) => (
              <tr key={v.id} data-testid={`vendor-${v.id}`}>
                <td className="p-3 font-medium">{v.companyName}</td>
                <td className="p-3 text-xs">{v.email}</td>
                <td className="p-3 text-xs sku">{v.gstin || "—"}</td>
                <td className="p-3"><span className="pill pill-blue">{v.status}</span></td>
                <td className="p-3 text-right flex gap-2 justify-end">
                  {v.status !== "approved" && <button onClick={() => setStatus(v.id, "approved")} className="text-emerald-600 text-xs font-semibold" data-testid={`approve-${v.id}`}>Approve</button>}
                  {v.status !== "suspended" && <button onClick={() => setStatus(v.id, "suspended")} className="text-red-500 text-xs" data-testid={`suspend-${v.id}`}>Suspend</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
