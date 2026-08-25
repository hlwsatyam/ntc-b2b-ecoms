import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";

function CatForm({ initial, cats, onSave, onClose }) {
  const [f, setF] = useState(initial || { name: "", parentId: "", image: "", promoImage: "", description: "", sortOrder: 0, isActive: true });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-black mb-4">{initial ? "Edit" : "New"} Category</h2>
        <div className="space-y-3">
          <label className="block text-xs"><span className="text-slate-500">Name</span>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="cat-name" /></label>
          <label className="block text-xs"><span className="text-slate-500">Parent (optional — for subcategory)</span>
            <select value={f.parentId || ""} onChange={(e) => setF({ ...f, parentId: e.target.value || null })} className="mt-1 w-full border rounded px-3 py-2">
              <option value="">— Top-level —</option>
              {cats.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <label className="block text-xs"><span className="text-slate-500">Category image URL</span>
            <input value={f.image || ""} onChange={(e) => setF({ ...f, image: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://..." /></label>
          <label className="block text-xs"><span className="text-slate-500">Mega-menu right promo image URL</span>
            <input value={f.promoImage || ""} onChange={(e) => setF({ ...f, promoImage: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="cat-promo" placeholder="https://..." /></label>
          <label className="block text-xs"><span className="text-slate-500">Description</span>
            <textarea value={f.description || ""} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className="mt-1 w-full border rounded px-3 py-2" /></label>
          <label className="block text-xs"><span className="text-slate-500">Sort order</span>
            <input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: parseInt(e.target.value) })} className="mt-1 w-full border rounded px-3 py-2" /></label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onSave(f)} className="btn-primary" data-testid="save-cat">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);

  const load = () => api.get("/categories").then((r) => setCats(r.data || []));
  useEffect(() => { load(); }, []);

  const save = async (f) => {
    try {
      if (edit) await api.put(`/categories/${edit.id}`, f);
      else await api.post("/categories", f);
      toast.success("Saved"); setShow(false); setEdit(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const del = async (id) => { if (window.confirm("Delete?")) { await api.delete(`/categories/${id}`); load(); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Categories</h1>
        <button onClick={() => { setEdit(null); setShow(true); }} className="btn-primary text-sm" data-testid="add-cat-btn">+ Add category</button>
      </div>
      <div className="card-flat overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Slug</th><th className="text-left p-3">Parent</th><th className="text-left p-3">Promo Image</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-border)]">
            {cats.map((c) => (
              <tr key={c.id} data-testid={`cat-row-${c.slug}`}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 sku text-xs">{c.slug}</td>
                <td className="p-3 text-xs">{cats.find((x) => x.id === c.parentId)?.name || "—"}</td>
                <td className="p-3">{c.promoImage ? <img src={c.promoImage} className="w-10 h-10 object-cover rounded" alt="" /> : "—"}</td>
                <td className="p-3 text-right flex gap-2 justify-end">
                  <button onClick={() => { setEdit(c); setShow(true); }} className="text-blue-600 text-xs">Edit</button>
                  <button onClick={() => del(c.id)} className="text-red-500 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && <CatForm initial={edit} cats={cats} onSave={save} onClose={() => { setShow(false); setEdit(null); }} />}
    </div>
  );
}
