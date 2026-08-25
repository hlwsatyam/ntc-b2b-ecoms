import { useState, useRef } from "react";
import api from "../../api";
import { toast } from "sonner";
import { UploadSimple, DownloadSimple, CheckCircle, WarningCircle } from "@phosphor-icons/react";

export default function BulkImport() {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const download = async () => {
    const r = await api.get("/products/import/template", { responseType: "blob" });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url; a.download = "product-import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await api.post("/products/import/preview", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPreview(r.data);
      toast.success(`Parsed ${r.data.total} rows — ${r.data.valid.length} valid, ${r.data.errors.length} errors`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Import failed"); }
    setBusy(false);
  };

  const commit = async () => {
    if (!preview?.valid?.length) return;
    setBusy(true);
    try {
      const r = await api.post("/products/import/commit", { items: preview.valid });
      toast.success(`Inserted ${r.data.inserted} products`);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) { toast.error(e?.response?.data?.detail || "Commit failed"); }
    setBusy(false);
  };

  const downloadErrors = () => {
    if (!preview?.errors?.length) return;
    const rows = [["row", "errors", "name", "sku", "categoryId", "price"]];
    for (const e of preview.errors) {
      rows.push([e.row, e.errors.join("; "), e.data.name, e.data.sku || "", e.data.categoryId, e.data.price]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "import-errors.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Bulk Product Import</h1>
          <p className="text-sm text-slate-500">Upload CSV/XLSX to list hundreds of SKUs at once</p>
        </div>
        <button onClick={download} className="btn-ghost text-xs flex items-center gap-1" data-testid="download-template-btn">
          <DownloadSimple size={14} /> Sample template
        </button>
      </div>

      <div className="card-flat p-8 text-center border-dashed" data-testid="upload-zone">
        <UploadSimple size={40} className="mx-auto text-slate-400" />
        <p className="mt-3 text-sm text-slate-600">Drop CSV/XLSX here or click to upload</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={onFile}
          className="mt-4"
          data-testid="import-file-input"
        />
        <p className="mt-2 text-[11px] text-slate-400">Columns: name, categoryId, price, mrp, stock, moq, gst (required) · sku, brandId, description, hsn, images (pipe-separated) (optional)</p>
      </div>

      {preview && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="card-flat p-4"><div className="text-xs text-slate-500">Total rows</div><div className="text-2xl font-black sku">{preview.total}</div></div>
            <div className="card-flat p-4"><div className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={12} weight="fill" /> Valid</div><div className="text-2xl font-black sku text-emerald-600">{preview.valid.length}</div></div>
            <div className="card-flat p-4"><div className="text-xs text-red-500 flex items-center gap-1"><WarningCircle size={12} weight="fill" /> Errors</div><div className="text-2xl font-black sku text-red-500">{preview.errors.length}</div></div>
          </div>

          <div className="flex justify-end gap-2">
            {preview.errors.length > 0 && <button onClick={downloadErrors} className="btn-ghost text-xs">Download errors CSV</button>}
            <button onClick={commit} disabled={busy || !preview.valid.length} className="btn-primary disabled:opacity-50" data-testid="commit-import-btn">
              {busy ? "Importing..." : `Import ${preview.valid.length} valid rows`}
            </button>
          </div>

          {preview.errors.length > 0 && (
            <div className="card-flat overflow-x-auto">
              <div className="p-3 text-sm font-semibold border-b border-[color:var(--brand-border)]">Rows with errors</div>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr><th className="p-2 text-left">Row</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Errors</th></tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--brand-border)]">
                  {preview.errors.slice(0, 200).map((e, i) => (
                    <tr key={i}><td className="p-2 sku">{e.row}</td><td className="p-2">{e.data.name || "—"}</td><td className="p-2 text-red-600">{e.errors.join(" · ")}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card-flat overflow-x-auto">
            <div className="p-3 text-sm font-semibold border-b border-[color:var(--brand-border)]">Valid rows preview</div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">SKU</th><th className="p-2 text-left">Category</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Stock</th></tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--brand-border)]">
                {preview.valid.slice(0, 200).map((v, i) => (
                  <tr key={i}><td className="p-2">{v.data.name}</td><td className="p-2 sku">{v.data.sku || "auto"}</td><td className="p-2 sku">{v.data.categoryId}</td><td className="p-2 text-right sku">₹{v.data.price}</td><td className="p-2 text-right sku">{v.data.stock}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
