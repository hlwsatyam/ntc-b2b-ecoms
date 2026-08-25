import { useEffect, useState } from "react";
import api from "../../api";
import { toast } from "sonner";
import { Plus, Trash } from "@phosphor-icons/react";

export default function VendorProducts() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [me, setMe] = useState(null);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", price: 0, mrp: 0, stock: 0, moq: 1, gst: 18, categoryId: "", brandId: "", description: "", images: [] });

  useEffect(() => {
    api.get("/vendors/me").then((r) => {
      setMe(r.data);
      api.get(`/products?vendor=${r.data.id}&limit=200`).then((rr) => setItems(rr.data.items || []));
    });
    api.get("/categories").then((r) => setCats(r.data));
    api.get("/brands").then((r) => setBrands(r.data));
  }, []);

  const reload = () => { if (me) api.get(`/products?vendor=${me.id}&limit=200`).then((r) => setItems(r.data.items || [])); };

  const save = async () => {
    if (!f.name || !f.categoryId || !(parseFloat(f.price) > 0)) { toast.error("Name, category and price>0 required"); return; }
    try {
      await api.post("/products", { ...f, price: parseFloat(f.price), mrp: parseFloat(f.mrp), stock: parseInt(f.stock), moq: parseInt(f.moq), gst: parseFloat(f.gst) });
      toast.success("Product created");
      setShow(false); reload();
      setF({ name: "", price: 0, mrp: 0, stock: 0, moq: 1, gst: 18, categoryId: "", brandId: "", description: "", images: [] });
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`); toast.success("Deleted"); reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">My Products</h1>
          <p className="text-sm text-slate-500">{me?.companyName} · {items.length} listings</p>
        </div>
        <button onClick={() => setShow(true)} className="btn-primary text-sm flex items-center gap-1" data-testid="add-product-btn"><Plus size={14} /> Add product</button>
      </div>
      <div className="card-flat overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">SKU</th><th className="text-right p-3">Price</th><th className="text-right p-3">Stock</th><th className="text-center p-3">MOQ</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--brand-border)]">
            {items.map((p) => (
              <tr key={p.id} data-testid={`vendor-product-${p.slug}`}>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 sku text-xs">{p.sku}</td>
                <td className="p-3 text-right sku">₹{p.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right sku">{p.stock}</td>
                <td className="p-3 text-center">{p.moq}</td>
                <td className="p-3 text-right"><button onClick={() => del(p.id)} className="text-red-500"><Trash size={14} /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No products yet — add your first listing.</td></tr>}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-4">New Product</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs"><span className="text-slate-500">Name *</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="prod-name" /></label>
              <label className="text-xs"><span className="text-slate-500">Category *</span>
                <select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid="prod-cat">
                  <option value="">Select</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-xs"><span className="text-slate-500">Brand</span>
                <select value={f.brandId} onChange={(e) => setF({ ...f, brandId: e.target.value })} className="mt-1 w-full border rounded px-3 py-2">
                  <option value="">Select</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              {[["price","Price *"],["mrp","MRP"],["stock","Stock"],["moq","MOQ"],["gst","GST %"]].map(([k, l]) => (
                <label key={k} className="text-xs"><span className="text-slate-500">{l}</span>
                  <input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid={`prod-${k}`} /></label>
              ))}
              <label className="col-span-2 text-xs"><span className="text-slate-500">Image URL</span>
                <input value={f.images[0] || ""} onChange={(e) => setF({ ...f, images: [e.target.value] })} className="mt-1 w-full border rounded px-3 py-2" placeholder="https://..." /></label>
              <label className="col-span-2 text-xs"><span className="text-slate-500">Description</span>
                <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className="mt-1 w-full border rounded px-3 py-2" /></label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShow(false)} className="btn-ghost">Cancel</button>
              <button onClick={save} className="btn-primary" data-testid="save-product">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
