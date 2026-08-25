import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";
import { Plus, Trash, Lightning } from "@phosphor-icons/react";

const toLocal = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : "";
const fromLocal = (l) => l ? new Date(l).toISOString() : "";

export default function AdminFlashSales() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", discountPct: 20, productIds: [], categoryId: "", startsAt: "", endsAt: "", banner: "", isActive: true });

  const load = () => api.get("/flash-sales").then((r) => setRows(r.data || []));
  useEffect(() => {
    load();
    api.get("/products?limit=100").then((r) => setProducts(r.data.items || []));
    api.get("/categories").then((r) => setCategories(r.data || []));
  }, []);

  const save = async () => {
    if (!f.name || !f.startsAt || !f.endsAt) { toast.error("Name and start/end are required"); return; }
    try {
      await api.post("/flash-sales", { ...f, startsAt: fromLocal(f.startsAt), endsAt: fromLocal(f.endsAt), categoryId: f.categoryId || null });
      toast.success("Flash sale scheduled");
      setShow(false); load();
      setF({ name: "", discountPct: 20, productIds: [], categoryId: "", startsAt: "", endsAt: "", banner: "", isActive: true });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const del = async (id) => { if (window.confirm("Delete flash sale?")) { await api.delete(`/flash-sales/${id}`); load(); } };
  const toggle = async (r) => { await api.put(`/flash-sales/${r.id}`, { isActive: !r.isActive }); load(); };

  const active = (r) => {
    const n = new Date();
    return r.isActive && new Date(r.startsAt) <= n && new Date(r.endsAt) >= n;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Flash Sales</h1>
        <button onClick={() => setShow(true)} className="btn-primary text-sm flex items-center gap-1" data-testid="add-flashsale-btn"><Plus size={14} /> New sale</button>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 && <div className="card-flat p-8 text-center text-slate-500">No flash sales yet. Create your first scheduled deal.</div>}
        {rows.map((r) => (
          <div key={r.id} className="card-flat p-4 flex items-center gap-4" data-testid={`flashsale-${r.id}`}>
            <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: active(r) ? "var(--brand-accent)" : "var(--brand-border)" }}>
              <Lightning size={22} color="white" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold">{r.name} <span className="pill pill-orange ml-2">{r.discountPct}% off</span></div>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(r.startsAt).toLocaleString()} → {new Date(r.endsAt).toLocaleString()}
                {r.categoryId && <span> · Category</span>}
                {r.productIds?.length > 0 && <span> · {r.productIds.length} products</span>}
              </div>
            </div>
            <span className={`pill ${active(r) ? "pill-emerald" : "pill-blue"}`}>{active(r) ? "Live now" : r.isActive ? "Scheduled" : "Paused"}</span>
            <button onClick={() => toggle(r)} className="btn-ghost text-xs">{r.isActive ? "Pause" : "Resume"}</button>
            <button onClick={() => del(r.id)} className="text-red-500"><Trash size={14} /></button>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-4">New Flash Sale</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs"><span className="text-slate-500">Sale name</span>
                <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="flashsale-name" placeholder="e.g. Diwali Mega Deal" /></label>
              <label className="text-xs"><span className="text-slate-500">Discount %</span>
                <input type="number" value={f.discountPct} onChange={(e) => setF({ ...f, discountPct: parseFloat(e.target.value) })} className="mt-1 w-full border rounded px-3 py-2" data-testid="flashsale-pct" /></label>
              <label className="text-xs"><span className="text-slate-500">Category (optional)</span>
                <select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} className="mt-1 w-full border rounded px-3 py-2">
                  <option value="">— All / product list —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-xs"><span className="text-slate-500">Starts at</span>
                <input type="datetime-local" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="flashsale-start" /></label>
              <label className="text-xs"><span className="text-slate-500">Ends at</span>
                <input type="datetime-local" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="flashsale-end" /></label>
              <label className="col-span-2 text-xs"><span className="text-slate-500">Banner image URL (optional)</span>
                <input value={f.banner} onChange={(e) => setF({ ...f, banner: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://..." /></label>
              <div className="col-span-2 text-xs">
                <span className="text-slate-500">Products (multi-select, optional)</span>
                <div className="mt-1 max-h-40 overflow-y-auto border rounded p-2 grid grid-cols-2 gap-1">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={f.productIds.includes(p.id)} onChange={(e) => setF({ ...f, productIds: e.target.checked ? [...f.productIds, p.id] : f.productIds.filter((x) => x !== p.id) })} />
                      <span className="truncate text-[11px]">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary" data-testid="save-flashsale">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
