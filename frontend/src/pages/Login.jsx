import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      nav(u.role === "super_admin" || u.role === "admin" ? "/admin" : u.role === "vendor" ? "/vendor" : "/");
    } catch (e) { toast.error(e?.response?.data?.detail || "Login failed"); }
    setBusy(false);
  };

  return (
    <div className="container-max py-12 max-w-md">
      <div className="card-flat p-8">
        <h1 className="text-3xl font-black mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to your B2B account</p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-slate-500">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email"
              className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2.5 focus:outline-none focus:border-[color:var(--brand-primary)]" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password"
              className="mt-1 w-full border border-[color:var(--brand-border)] rounded-md px-3 py-2.5 focus:outline-none focus:border-[color:var(--brand-primary)]" />
          </label>
          <button disabled={busy} data-testid="login-submit" className="btn-primary w-full disabled:opacity-50">{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        <div className="mt-4 text-xs text-slate-500 text-center">
          No account? <Link to="/register" className="text-[color:var(--brand-primary)] font-semibold">Register</Link>
        </div>
        <div className="mt-6 pt-4 border-t border-[color:var(--brand-border)] text-[11px] text-slate-500">
          <div className="font-semibold mb-1">Demo credentials:</div>
          <div>Admin — admin@tradehub.com / admin123</div>
          <div>Vendor — vendor@tradehub.com / vendor123</div>
          <div>Buyer — buyer@tradehub.com / buyer123</div>
        </div>
      </div>
    </div>
  );
}
