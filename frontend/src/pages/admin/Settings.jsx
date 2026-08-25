import { useEffect, useState } from "react";
import api from "../../api";
import { useSettings } from "../../store";
import { toast } from "sonner";
import ImageUpload from "../../components/ImageUpload";

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
      for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = { ...(cur[keys[i]] || {}) }; cur = cur[keys[i]]; }
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

  const promoCards = s.homepage?.promoCards || [];
  const ensurePromoCards = () => {
    if (promoCards.length < 8) {
      const filled = [...promoCards];
      while (filled.length < 8) filled.push({ id: `pc${filled.length + 1}`, image: "", title: "", link: "/products" });
      set("homepage.promoCards", filled);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">Settings</h1>
        <button onClick={save} className="btn-primary" data-testid="save-settings">Save changes</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">

        {/* Brand */}
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Brand</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <ImageUpload value={s.brand.logo} onChange={(v) => set("brand.logo", v)} label="Logo" testid="upload-logo" height={70} />
            </div>
            {[["storeName","Store name",2],["tagline","Tagline",2],["supportEmail","Support email",1],["phone","Phone",1],["whatsapp","WhatsApp",1],["address","Address",2],["gstin","GSTIN",1]].map(([k, l, col]) => (
              <label key={k} className={`text-xs ${col === 2 ? "col-span-2" : ""}`}><span className="text-slate-500">{l}</span>
                <input value={s.brand[k] || ""} onChange={(e) => set(`brand.${k}`, e.target.value)} className="mt-1 w-full border rounded px-3 py-2" data-testid={`brand-${k}`} /></label>
            ))}
          </div>
        </div>

        {/* Top Utility Bar */}
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Top Utility Bar</div>
          <div className="space-y-2">
            {[["presalesPhone","Pre-Sales phone"],["customerPhone","Customer phone"],["offerText","Offer text (use **word** to highlight)"],["alertText","Alert text (red strip)"]].map(([k, l]) => (
              <label key={k} className="text-xs block"><span className="text-slate-500">{l}</span>
                <input value={s.brand?.topBar?.[k] || ""} onChange={(e) => set(`brand.topBar.${k}`, e.target.value)} className="mt-1 w-full border rounded px-3 py-2" data-testid={`topbar-${k}`} /></label>
            ))}
          </div>
        </div>

        {/* Theme */}
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
            <button style={{ background: s.theme.primary, color: "white", padding: "8px 16px", borderRadius: s.theme.radius, marginTop: 8, fontWeight: 700 }}>Primary CTA</button>
          </div>
        </div>

        {/* Commerce */}
        <div className="card-flat p-5">
          <div className="font-display font-bold text-lg mb-3">Commerce</div>
          {[["currency","Currency"],["currencySymbol","Currency symbol"],["orderPrefix","Order prefix"],["invoicePrefix","Invoice prefix"],["defaultGst","Default GST %"]].map(([k, l]) => (
            <label key={k} className="block text-xs mb-2"><span className="text-slate-500">{l}</span>
              <input value={s.commerce[k] || ""} onChange={(e) => set(`commerce.${k}`, e.target.value)} className="mt-1 w-full border rounded px-3 py-2" /></label>
          ))}
        </div>

        {/* Hero Banner */}
        <div className="card-flat p-5 md:col-span-2">
          <div className="font-display font-bold text-lg mb-3">Hero Banner</div>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <ImageUpload
              value={s.homepage?.heroBanners?.[0]?.image}
              onChange={(v) => set("homepage.heroBanners", [{ ...(s.homepage?.heroBanners?.[0] || {}), image: v }])}
              label="Hero image" testid="upload-hero" aspect="banner"
            />
            <div className="grid grid-cols-2 gap-3">
              {[["title","Title",2],["subtitle","Subtitle",2],["cta","CTA button label",1],["link","Link (URL or /path)",1]].map(([k, l, col]) => (
                <label key={k} className={`text-xs ${col === 2 ? "col-span-2" : ""}`}><span className="text-slate-500">{l}</span>
                  <input value={s.homepage?.heroBanners?.[0]?.[k] || ""} onChange={(e) => set("homepage.heroBanners", [{ ...(s.homepage.heroBanners?.[0] || {}), [k]: e.target.value }])} className="mt-1 w-full border rounded px-3 py-2" data-testid={`hero-${k}`} /></label>
              ))}
            </div>
          </div>
        </div>

        {/* Mid Banner */}
        <div className="card-flat p-5 md:col-span-2">
          <div className="font-display font-bold text-lg mb-3">Mid Banner (below product list)</div>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <ImageUpload
              value={s.homepage?.midBanner?.image}
              onChange={(v) => set("homepage.midBanner", { ...(s.homepage?.midBanner || {}), image: v })}
              label="Banner image" testid="upload-mid" aspect="banner"
            />
            <div className="grid grid-cols-2 gap-3">
              {[["title","Title",2],["subtitle","Subtitle",2],["link","Link",2]].map(([k, l, col]) => (
                <label key={k} className={`text-xs ${col === 2 ? "col-span-2" : ""}`}><span className="text-slate-500">{l}</span>
                  <input value={s.homepage?.midBanner?.[k] || ""} onChange={(e) => set("homepage.midBanner", { ...(s.homepage?.midBanner || {}), [k]: e.target.value })} className="mt-1 w-full border rounded px-3 py-2" data-testid={`mid-${k}`} /></label>
              ))}
            </div>
          </div>
        </div>

        {/* 8 Promo Cards */}
        <div className="card-flat p-5 md:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <div className="font-display font-bold text-lg">8 Homepage Promo Cards</div>
            <button onClick={ensurePromoCards} className="btn-ghost text-xs">Initialize 8 cards</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => {
              const card = promoCards[i] || { id: `pc${i + 1}`, image: "", title: "", link: "/products" };
              return (
                <div key={i} className="border border-[color:var(--brand-border)] rounded p-3 space-y-2" data-testid={`promo-card-edit-${i}`}>
                  <div className="text-[11px] font-semibold text-slate-500">Card #{i + 1}</div>
                  <ImageUpload
                    value={card.image}
                    onChange={(v) => {
                      const next = [...promoCards];
                      while (next.length < 8) next.push({ id: `pc${next.length + 1}`, image: "", title: "", link: "/products" });
                      next[i] = { ...next[i], image: v };
                      set("homepage.promoCards", next);
                    }}
                    label=""
                    testid={`promo-upload-${i}`}
                    height={80}
                  />
                  <input placeholder="Title" value={card.title} onChange={(e) => {
                    const next = [...promoCards];
                    while (next.length < 8) next.push({ id: `pc${next.length + 1}`, image: "", title: "", link: "/products" });
                    next[i] = { ...next[i], title: e.target.value };
                    set("homepage.promoCards", next);
                  }} className="w-full border rounded px-2 py-1 text-xs" data-testid={`promo-title-${i}`} />
                  <input placeholder="/products?category=..." value={card.link} onChange={(e) => {
                    const next = [...promoCards];
                    while (next.length < 8) next.push({ id: `pc${next.length + 1}`, image: "", title: "", link: "/products" });
                    next[i] = { ...next[i], link: e.target.value };
                    set("homepage.promoCards", next);
                  }} className="w-full border rounded px-2 py-1 text-[11px] sku" data-testid={`promo-link-${i}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature flags */}
        <div className="card-flat p-5 md:col-span-2">
          <div className="font-display font-bold text-lg mb-3">Feature Flags</div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
