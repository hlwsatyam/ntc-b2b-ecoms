import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../store";
import { House, Package, FolderOpen, Tag, ShoppingBag, Storefront, Gear } from "@phosphor-icons/react";

const items = [
  { to: "/admin", label: "Dashboard", icon: House, end: true, testid: "nav-dashboard" },
  { to: "/admin/products", label: "Products", icon: Package, testid: "nav-products" },
  { to: "/admin/categories", label: "Categories", icon: FolderOpen, testid: "nav-categories" },
  { to: "/admin/brands", label: "Brands", icon: Tag, testid: "nav-brands" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, testid: "nav-orders" },
  { to: "/admin/vendors", label: "Vendors", icon: Storefront, testid: "nav-vendors" },
  { to: "/admin/settings", label: "Settings", icon: Gear, testid: "nav-settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex bg-[color:var(--brand-bg)]">
      <aside className="w-60 shrink-0 border-r border-[color:var(--brand-border)] bg-white p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="font-display font-black text-lg mb-6">Admin</div>
        <nav className="flex flex-col gap-1">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              data-testid={i.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "bg-[color:var(--brand-primary)] text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              <i.icon size={18} /> {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 pt-4 border-t border-[color:var(--brand-border)]">
          <div className="text-xs text-slate-500">{user?.email}</div>
          <button onClick={logout} className="text-xs text-red-600 mt-2" data-testid="admin-logout">Logout</button>
        </div>
      </aside>
      <div className="flex-1 p-6 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
