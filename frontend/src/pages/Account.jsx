import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../store";
import { Link } from "react-router-dom";

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [rfqs, setRfqs] = useState([]);

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data || []));
    api.get("/rfq").then((r) => setRfqs(r.data || []));
  }, []);

  return (
    <div className="container-max py-8">
      <h1 className="text-3xl font-black mb-2">My Account</h1>
      <div className="text-sm text-slate-500 mb-6">{user?.email} · <span className="pill pill-blue">{user?.role}</span></div>

      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold text-xl">Orders</h2>
          <Link to="/products" className="text-sm text-[color:var(--brand-primary)]">Reorder from catalog →</Link>
        </div>
        <div className="card-flat divide-y divide-[color:var(--brand-border)]">
          {orders.length === 0 && <div className="p-6 text-sm text-slate-500 text-center">No orders yet</div>}
          {orders.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between text-sm" data-testid={`order-${o.orderNo}`}>
              <div>
                <div className="sku font-semibold">{o.orderNo}</div>
                <div className="text-xs text-slate-500">{o.items.length} items · {new Date(o.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="font-bold sku">₹{o.total?.toLocaleString("en-IN")}</div>
                  <span className="pill pill-blue">{o.status}</span>
                </div>
                <a
                  href={`${process.env.REACT_APP_BACKEND_URL}/api/orders/${o.id}/invoice`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem("token");
                    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders/${o.id}/invoice`, { headers: { Authorization: `Bearer ${token}` } })
                      .then((r) => r.blob())
                      .then((b) => {
                        const url = URL.createObjectURL(b);
                        const a = document.createElement("a");
                        a.href = url; a.download = `Invoice-${o.orderNo}.pdf`; a.click();
                        URL.revokeObjectURL(url);
                      });
                  }}
                  className="text-xs font-bold text-[color:var(--brand-primary)] hover:underline"
                  data-testid={`invoice-${o.orderNo}`}
                >Invoice PDF</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold text-xl">Quote requests (RFQ)</h2>
          <Link to="/rfq" className="text-sm text-[color:var(--brand-primary)]">New RFQ →</Link>
        </div>
        <div className="card-flat divide-y divide-[color:var(--brand-border)]">
          {rfqs.length === 0 && <div className="p-6 text-sm text-slate-500 text-center">No RFQs yet</div>}
          {rfqs.map((r) => (
            <div key={r.id} className="p-4 text-sm" data-testid={`rfq-${r.id}`}>
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{r.productName}</div>
                  <div className="text-xs text-slate-500">Qty {r.quantity} · {r.deliveryLocation}</div>
                </div>
                <span className="pill pill-blue">{r.status}</span>
              </div>
              {r.quotations?.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-[color:var(--brand-primary)] space-y-1">
                  {r.quotations.map((q) => (
                    <div key={q.id} className="text-xs">
                      <span className="font-semibold">{q.vendorName}</span> — ₹{q.price} · MOQ {q.moq}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
