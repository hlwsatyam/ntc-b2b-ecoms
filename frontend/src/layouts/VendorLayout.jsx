import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../store";
import { House, Package, ShoppingBag, Wallet } from "@phosphor-icons/react";

const items = [
  { to: "/vendor", label: "Dashboard", icon: House, end: true, testid: "vendor-nav-dashboard" },
  { to: "/vendor/products", label: "My Products", icon: Package, testid: "vendor-nav-products" },
  { to: "/vendor/orders", label: "Orders", icon: ShoppingBag, testid: "vendor-nav-orders" },
  { to: "/vendor/wallet", label: "Wallet", icon: Wallet, testid: "vendor-nav-wallet" },
];

export default function VendorLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex bg-[color:var(--brand-bg)]">
      <aside className="w-56 shrink-0 border-r border-[color:var(--brand-border)] bg-white p-4">
        <div className="font-display font-black text-lg mb-6">Vendor</div>
        <nav className="flex flex-col gap-1">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} data-testid={i.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${isActive ? "bg-[color:var(--brand-primary)] text-white" : "text-slate-700 hover:bg-slate-100"}`
              }>
              <i.icon size={18} /> {i.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="text-xs text-red-600 mt-6" data-testid="vendor-logout">Logout</button>
      </aside>
      <div className="flex-1 p-6"><Outlet /></div>
    </div>
  );
}
