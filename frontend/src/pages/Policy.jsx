import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function Policy() {
  const { key } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setP(null); setErr("");
    api.get(`/policies/${key}`).then((r) => setP(r.data)).catch(() => setErr("This policy is not currently available."));
  }, [key]);
  return (
    <div className="container-max py-10 max-w-3xl">
      {err ? (
        <div className="card-flat p-10 text-center">
          <h1 className="text-2xl font-black mb-2">Not available</h1>
          <p className="text-sm text-slate-500">{err}</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">Back to home</Link>
        </div>
      ) : !p ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : (
        <>
          <h1 className="text-3xl md:text-4xl font-black">{p.title}</h1>
          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-700" data-testid="policy-body">{p.body}</div>
        </>
      )}
    </div>
  );
}
