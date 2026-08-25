import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../store";
import { House, Package, FolderOpen, Tag, ShoppingBag, Storefront, Gear, UploadSimple, Wallet, Lightning, Bell, MagnifyingGlass, SignOut } from "@phosphor-icons/react";

const items = [
  { to: "/admin", label: "Dashboard", icon: House, end: true, testid: "nav-dashboard" },
  { to: "/admin/products", label: "Products", icon: Package, testid: "nav-products" },
  { to: "/admin/bulk-import", label: "Bulk Import", icon: UploadSimple, testid: "nav-bulk-import" },
  { to: "/admin/categories", label: "Categories", icon: FolderOpen, testid: "nav-categories" },
  { to: "/admin/brands", label: "Brands", icon: Tag, testid: "nav-brands" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, testid: "nav-orders" },
  { to: "/admin/vendors", label: "Vendors", icon: Storefront, testid: "nav-vendors" },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet, testid: "nav-payouts" },
  { to: "/admin/flash-sales", label: "Flash Sales", icon: Lightning, testid: "nav-flashsales" },
  { to: "/admin/settings", label: "Settings", icon: Gear, testid: "nav-settings" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const current = items.find((i) => i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to))?.label || "Admin";

  return (
    <div className="min-h-screen flex bg-[color:var(--brand-bg)]">
      <aside className="w-60 shrink-0 sticky top-0 h-screen overflow-y-auto text-white flex flex-col" style={{ background: "var(--brand-secondary)" }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-display font-black text-lg">TradeHub</div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">Admin Console</div>
        </div>
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              data-testid={i.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-[color:var(--brand-primary)] text-white font-semibold"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <i.icon size={18} weight="duotone" /> {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-[11px] text-white/60">{user?.email}</div>
          <button onClick={logout} className="mt-2 text-[11px] text-white/70 hover:text-white flex items-center gap-1" data-testid="admin-logout">
            <SignOut size={12} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-[color:var(--brand-border)] sticky top-0 z-20">
          <div className="px-6 py-3 flex items-center gap-4">
            <div>
              <div className="text-xs text-slate-500">Admin</div>
              <div className="font-display font-bold text-lg leading-tight">{current}</div>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md relative">
              <MagnifyingGlass size={16} className="absolute left-3 text-slate-400" />
              <input placeholder="Search anything..." className="w-full pl-9 pr-3 py-2 border border-[color:var(--brand-border)] rounded text-sm focus:outline-none focus:border-[color:var(--brand-primary)]" />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded relative" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[color:var(--brand-primary)]" />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "var(--brand-primary)" }}>
              {(user?.name || "A").slice(0, 1)}
            </div>
          </div>
        </header>
        <div className="p-6 flex-1"><Outlet /></div>
      </div>
    </div>
  );
}
