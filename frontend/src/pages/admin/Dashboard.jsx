import { useEffect, useState } from "react";
import api from "../../api";
import { Package, ShoppingBag, Users, Storefront, TrendUp } from "@phosphor-icons/react";

const Kpi = ({ icon: Icon, label, value, hint, color }) => (
  <div className="card-flat p-5" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
    <div className="flex items-center justify-between">
      <Icon size={22} weight="duotone" style={{ color }} />
      <span className="text-[10px] text-slate-400">{hint}</span>
    </div>
    <div className="mt-3 text-2xl font-black sku">{value}</div>
    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
  </div>
);

export default function AdminDashboard() {
  const [s, setS] = useState({});
  useEffect(() => { api.get("/admin/stats").then((r) => setS(r.data)); }, []);
  return (
    <div>
      <h1 className="text-3xl font-black mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Overview of your B2B marketplace</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={TrendUp} label="Total revenue" value={`₹${(s.revenue || 0).toLocaleString("en-IN")}`} color="#0052FF" />
        <Kpi icon={ShoppingBag} label="Orders" value={s.totalOrders || 0} hint={`${s.paidOrders || 0} paid`} color="#FF5A00" />
        <Kpi icon={Package} label="Products" value={s.totalProducts || 0} hint={`${s.activeProducts || 0} active`} color="#059669" />
        <Kpi icon={Storefront} label="Vendors" value={s.totalVendors || 0} hint={`${s.pendingVendors || 0} pending`} color="#8B5CF6" />
        <Kpi icon={Users} label="Customers" value={s.totalCustomers || 0} color="#0EA5E9" />
        <Kpi icon={Package} label="Low stock" value={s.lowStock || 0} color="#EF4444" />
      </div>
    </div>
  );
}
