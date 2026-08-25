import { useEffect, useState } from "react";
import api from "../../api";
import { Package, ShoppingBag, Wallet } from "@phosphor-icons/react";

export default function VendorDashboard() {
  const [v, setV] = useState(null);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get("/vendors/me").then((r) => setV(r.data)).catch(() => {});
    api.get("/orders").then((r) => setOrders(r.data || []));
  }, []);
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  return (
    <div>
      <h1 className="text-3xl font-black mb-1">Vendor Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">{v?.companyName} · Status: <span className="pill pill-blue">{v?.status}</span></p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: "Wallet", value: `₹${(v?.walletBalance || 0).toLocaleString("en-IN")}` },
          { icon: ShoppingBag, label: "Orders", value: orders.length },
          { icon: Package, label: "Revenue", value: `₹${revenue.toLocaleString("en-IN")}` },
          { icon: Package, label: "Commission %", value: `${v?.commissionPct || 0}%` },
        ].map((k, i) => (
          <div key={i} className="card-flat p-5" data-testid={`vendor-kpi-${i}`}>
            <k.icon size={22} weight="duotone" className="text-[color:var(--brand-primary)]" />
            <div className="mt-3 text-2xl font-black sku">{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
