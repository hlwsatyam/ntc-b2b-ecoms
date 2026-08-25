import { useEffect, useState } from "react";
import api from "../../api";
import { useSettings } from "../../store";
import { toast } from "sonner";

export default function AdminSettings() {
  const { fetch: refetch } = useSettings();
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/settings").then((r) => setS(r.data)); }, []);
  if (!s) return <div>Loading...</div>;
  const set = (path, value) => {
    setS((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = { ...cur[keys[i]] }; cur = cur[keys[i]]; }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };
  const save = async () => {
    try {
      const { id, _id, ...body } = s;
      await api.put("/settings", body);
      toast.success("Settings saved");
      refetch();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
  };

  const Color = ({ path, label }) => (
    <label className="text-xs block">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={s.theme[path]} onChange={(e) => { set(`theme.${path}`, e.target.value); document.documentElement.style.setProperty(`--brand-${path}`, e.target.value); }} className="w-12 h-10 border rounded" data-testid={`color-${path}`} />
        <input value={s.theme[path]} onChange={(e) => set(`theme.${path}`, e.target.value)} className="flex-1 border rounded px-2 py-2 text-sm sku" />
      </div>
    </label>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Settings</h1>
        <button onClick={save} className="btn-primary" data-testid="save-settings">Save changes</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Brand</div>
          {[["storeName","Store name"],["tagline","Tagline"],["logo","Logo URL"],["supportEmail","Support email"],["phone","Phone"],["whatsapp","WhatsApp"],["address","Address"],["gstin","GSTIN"]].map(([k, l]) => (
            <label key={k} className="block text-xs mb-2"><span className="text-slate-500">{l}</span>
              <input value={s.brand[k] || ""} onChange={(e) => set(`brand.${k}`, e.target.value)} className="mt-1 w-full border rounded px-3 py-2" data-testid={`brand-${k}`} /></label>
          ))}
        </div>
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Theme</div>
          <div className="grid grid-cols-2 gap-3">
            <Color path="primary" label="Primary" />
            <Color path="secondary" label="Secondary" />
            <Color path="accent" label="Accent" />
            <Color path="background" label="Background" />
            <Color path="surface" label="Surface" />
            <Color path="border" label="Border" />
          </div>
          <div className="mt-4 p-4 rounded border" style={{ background: s.theme.background, borderColor: s.theme.border }}>
            <div className="text-xs text-slate-500">Preview</div>
            <button style={{ background: s.theme.primary, color: "white", padding: "8px 16px", borderRadius: s.theme.radius, marginTop: 8 }}>Primary CTA</button>
          </div>
        </div>
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Commerce</div>
          {[["currency","Currency"],["currencySymbol","Currency symbol"],["orderPrefix","Order prefix"],["invoicePrefix","Invoice prefix"],["defaultGst","Default GST %"]].map(([k, l]) => (
            <label key={k} className="block text-xs mb-2"><span className="text-slate-500">{l}</span>
              <input value={s.commerce[k] || ""} onChange={(e) => set(`commerce.${k}`, e.target.value)} className="mt-1 w-full border rounded px-3 py-2" /></label>
          ))}
        </div>
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Homepage</div>
          <label className="block text-xs mb-2"><span className="text-slate-500">Announcement bar</span>
            <input value={s.homepage?.announcementBar || ""} onChange={(e) => set("homepage.announcementBar", e.target.value)} className="mt-1 w-full border rounded px-3 py-2" data-testid="announcement-input" /></label>
          <label className="block text-xs mb-2"><span className="text-slate-500">Hero title</span>
            <input value={s.homepage?.heroBanners?.[0]?.title || ""} onChange={(e) => set("homepage.heroBanners", [{ ...s.homepage.heroBanners[0], title: e.target.value }])} className="mt-1 w-full border rounded px-3 py-2" /></label>
          <label className="block text-xs mb-2"><span className="text-slate-500">Hero subtitle</span>
            <input value={s.homepage?.heroBanners?.[0]?.subtitle || ""} onChange={(e) => set("homepage.heroBanners", [{ ...s.homepage.heroBanners[0], subtitle: e.target.value }])} className="mt-1 w-full border rounded px-3 py-2" /></label>
          <label className="block text-xs mb-2"><span className="text-slate-500">Hero image URL</span>
            <input value={s.homepage?.heroBanners?.[0]?.image || ""} onChange={(e) => set("homepage.heroBanners", [{ ...s.homepage.heroBanners[0], image: e.target.value }])} className="mt-1 w-full border rounded px-3 py-2" /></label>
        </div>
        <div className="card-flat p-5 md:col-span-2">
          <div className="font-display font-bold text-lg mb-3">Feature Flags</div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(s.features || {}).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={v} onChange={(e) => set(`features.${k}`, e.target.checked)} data-testid={`feature-${k}`} />
                <span>{k}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
