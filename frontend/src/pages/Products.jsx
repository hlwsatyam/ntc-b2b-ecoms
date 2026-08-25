import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";
import { Funnel } from "@phosphor-icons/react";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [cats, setCats] = useState([]);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const brand = params.get("brand") || "";
  const sort = params.get("sort") || "newest";

  useEffect(() => {
    api.get("/brands").then((r) => setBrands(r.data || []));
    api.get("/categories").then((r) => setCats(r.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (brand) p.set("brand", brand);
    if (sort) p.set("sort", sort);
    api.get(`/products?${p.toString()}`).then((r) => {
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setLoading(false);
    });
  }, [q, category, brand, sort]);

  const setParam = (k, v) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    setParams(p);
  };

  return (
    <div className="container-max py-8">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">Products</h1>
          <div className="text-sm text-slate-500 mt-1">{total} items {q && `for "${q}"`}</div>
        </div>
        <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="border border-[color:var(--brand-border)] rounded-md px-3 py-2 text-sm bg-white" data-testid="sort-select">
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="popular">Most popular</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="card-flat p-4 h-fit">
          <div className="flex items-center gap-2 mb-3"><Funnel size={16} /><span className="font-semibold text-sm">Filters</span></div>
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">CATEGORY</div>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              <button onClick={() => setParam("category", "")} className={`text-xs text-left px-2 py-1.5 rounded ${!category ? "bg-[color:var(--brand-primary)] text-white" : "hover:bg-slate-100"}`}>All</button>
              {cats.map((c) => (
                <button key={c.id} onClick={() => setParam("category", c.id)} data-testid={`filter-cat-${c.slug}`}
                  className={`text-xs text-left px-2 py-1.5 rounded ${category === c.id ? "bg-[color:var(--brand-primary)] text-white" : "hover:bg-slate-100"}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-2">BRAND</div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setParam("brand", "")} className={`text-xs text-left px-2 py-1.5 rounded ${!brand ? "bg-[color:var(--brand-primary)] text-white" : "hover:bg-slate-100"}`}>All</button>
              {brands.map((b) => (
                <button key={b.id} onClick={() => setParam("brand", b.id)} data-testid={`filter-brand-${b.slug}`}
                  className={`text-xs text-left px-2 py-1.5 rounded ${brand === b.id ? "bg-[color:var(--brand-primary)] text-white" : "hover:bg-slate-100"}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="card-flat aspect-square animate-pulse bg-slate-100" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="card-flat p-12 text-center text-slate-500">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="products-grid">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
