import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store";
import { toast } from "sonner";

export default function Register() {
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", company: "", gstin: "", role: "customer" });
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register(f);
      toast.success("Account created");
      nav(u.role === "vendor" ? "/vendor" : "/");
    } catch (e) { toast.error(e?.response?.data?.detail || "Registration failed"); }
    setBusy(false);
  };

  return (
    <div className="container-max py-12 max-w-lg">
      <div className="card-flat p-8">
        <h1 className="text-3xl font-black mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Trade smarter with verified vendors and MOQ pricing.</p>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          {[
            ["name", "Full name", true, "text", 2],
            ["email", "Email", true, "email", 2],
            ["password", "Password", true, "password", 2],
            ["phone", "Phone", false, "text", 1],
            ["company", "Company", false, "text", 1],
            ["gstin", "GSTIN (optional)", false, "text", 2],
          ].map(([k, l, req, t, col]) => (
            <label key={k} className={col === 2 ? "col-span-2" : ""}>
              <span className="text-xs text-slate-500">{l}</span>
              <input type={t} required={req} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
                data-testid={`reg-${k}`}
                className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2 focus:outline-none focus:border-[color:var(--brand-primary)]" />
            </label>
          ))}
          <div className="col-span-2 grid grid-cols-2 gap-2">
            {[
              { v: "customer", l: "I'm a buyer" },
              { v: "vendor", l: "I'm a seller/vendor" },
            ].map((o) => (
              <label key={o.v} data-testid={`reg-role-${o.v}`} className={`p-3 border rounded cursor-pointer text-sm text-center ${f.role === o.v ? "border-[color:var(--brand-primary)] bg-blue-50" : "border-[color:var(--brand-border)]"}`}>
                <input type="radio" className="hidden" checked={f.role === o.v} onChange={() => setF({ ...f, role: o.v })} data-testid={`reg-role-${o.v}-input`} />
                {o.l}
              </label>
            ))}
          </div>
          <button disabled={busy} data-testid="reg-submit" className="col-span-2 btn-primary w-full disabled:opacity-50">{busy ? "Creating..." : "Create account"}</button>
        </form>
        <div className="mt-4 text-xs text-slate-500 text-center">
          Have an account? <Link to="/login" className="text-[color:var(--brand-primary)] font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
