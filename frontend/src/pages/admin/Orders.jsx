import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const load = () => api.get("/orders").then((r) => setOrders(r.data || []));
  useEffect(() => { load(); }, []);
  const ship = async (id) => { try { await api.post(`/orders/${id}/ship`); toast.success("Shipment created"); load(); } catch (e) { toast.error("Shipping failed"); } };
  const setStatus = async (id, status) => { await api.put(`/orders/${id}/status`, { status }); load(); };
  return (
    <div>
      <h1 className="text-3xl font-black mb-6">Orders</h1>
      <div className="card-flat overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="text-left p-3">Order</th><th className="text-left p-3">Items</th><th className="text-right p-3">Total</th><th className="text-left p-3">Payment</th><th className="text-left p-3">Status</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-border)]">
            {orders.map((o) => (
              <tr key={o.id} data-testid={`admin-order-${o.orderNo}`}>
                <td className="p-3"><div className="sku font-semibold">{o.orderNo}</div><div className="text-[11px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</div></td>
                <td className="p-3 text-xs">{o.items?.length} items</td>
                <td className="p-3 text-right sku font-bold">₹{o.total?.toLocaleString("en-IN")}</td>
                <td className="p-3"><span className="pill pill-blue">{o.paymentMethod}</span></td>
                <td className="p-3">
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="text-xs border rounded px-2 py-1" data-testid={`status-${o.orderNo}`}>
                    {["pending_payment","confirmed","processing","packed","shipped","delivered","cancelled","returned"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 text-right flex items-center justify-end gap-3">
                  <button onClick={() => {
                    const token = localStorage.getItem("token");
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${o.id}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
                      .then((r) => r.blob())
                      .then((b) => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `Invoice-${o.orderNo}.pdf`; a.click(); URL.revokeObjectURL(u); });
                  }} className="text-[color:var(--brand-primary)] text-xs font-semibold" data-testid={`invoice-${o.orderNo}`}>Invoice PDF</button>
                  <button onClick={() => ship(o.id)} className="text-slate-600 text-xs font-semibold" data-testid={`ship-${o.orderNo}`}>Ship via Shiprocket</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
