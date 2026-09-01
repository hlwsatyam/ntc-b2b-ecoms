import { create } from "zustand";
import api from "./api";

export const useAuth = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  init: async () => {
    if (!get().token) return;
    try {
      const r = await api.get("/auth/me");
      set({ user: r.data });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },
  login: async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", r.data.token);
    set({ user: r.data.user, token: r.data.token });
    return r.data.user;
  },
  register: async (data) => {
    const r = await api.post("/auth/register", data);
    localStorage.setItem("token", r.data.token);
    set({ user: r.data.user, token: r.data.token });
    return r.data.user;
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));

export const useSettings = create((set) => ({
  settings: null,
  fetch: async () => {
    try {
      const r = await api.get("/settings");
      set({ settings: r.data });
      // apply theme to CSS vars
      const t = r.data.theme || {};
      const root = document.documentElement;
      if (t.primary) root.style.setProperty("--brand-primary", t.primary);
      if (t.secondary) root.style.setProperty("--brand-secondary", t.secondary);
      if (t.accent) root.style.setProperty("--brand-accent", t.accent);
      if (t.background) { root.style.setProperty("--brand-bg", t.background); } else { root.style.setProperty("--brand-bg", "#f1f3f6"); }
      if (t.surface) root.style.setProperty("--brand-surface", t.surface);
      if (t.border) root.style.setProperty("--brand-border", t.border);
      if (t.radius) root.style.setProperty("--brand-radius", t.radius);
    } catch (e) {
      console.error("settings fetch failed", e);
    }
  },
}));

export const useCart = create((set, get) => ({
  cart: { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 },
  fetch: async () => {
    try {
      const r = await api.get("/cart");
      set({ cart: r.data });
    } catch {}
  },
  add: async (productId, quantity) => {
    const r = await api.post("/cart/add", { productId, quantity });
    set({ cart: r.data });
    return r.data;
  },
  remove: async (productId) => {
    const r = await api.delete(`/cart/${productId}`);
    set({ cart: r.data });
  },
  qtyOf: (productId) => {
    const it = (get().cart.items || []).find((i) => i.productId === productId);
    return it ? it.quantity : 0;
  },
  clear: () => set({ cart: { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 } }),
}));
