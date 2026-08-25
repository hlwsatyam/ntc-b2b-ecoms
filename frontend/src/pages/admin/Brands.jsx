import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", logo: "", description: "", isActive: true });
  const load = () => api.get("/brands").then((r) => setBrands(r.data || []));
  useEffect(() => { load(); }, []);
  const save = async () => { try { await api.post("/brands", f); toast.success("Saved"); setShow(false); setF({ name: "", logo: "", description: "", isActive: true }); load(); } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); } };
  const del = async (id) => { if (window.confirm("Delete?")) { await api.delete(`/brands/${id}`); load(); } };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Brands</h1>
        <button onClick={() => setShow(true)} className="btn-primary text-sm" data-testid="add-brand-btn">+ Add brand</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {brands.map((b) => (
          <div key={b.id} className="card-flat p-4 flex items-center justify-between" data-testid={`brand-${b.slug}`}>
            <div><div className="font-semibold">{b.name}</div><div className="text-[11px] text-slate-500 sku">{b.slug}</div></div>
            <button onClick={() => del(b.id)} className="text-red-500 text-xs">×</button>
          </div>
        ))}
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-4">New Brand</h2>
            <div className="space-y-3">
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name" className="w-full border rounded px-3 py-2" data-testid="brand-name" />
              <input value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} placeholder="Logo URL" className="w-full border rounded px-3 py-2" />
              <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description" rows={2} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setShow(false)} className="btn-ghost">Cancel</button><button onClick={save} className="btn-primary" data-testid="save-brand">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
