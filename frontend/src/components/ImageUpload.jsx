import { useRef, useState } from "react";
import api from "../api";
import { UploadSimple, X } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function resolveImg(v) {
  if (!v) return "";
  if (typeof v !== "string") return "";
  if (v.startsWith("http") || v.startsWith("data:")) return v;
  return `${BACKEND_URL}${v}`;
}

export default function ImageUpload({ value, onChange, label = "Image", testid = "upload", aspect = "square", height = 90 }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const preview = resolveImg(value);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("Max 8 MB"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(r.data.url);
    } catch (err) { alert(err?.response?.data?.detail || "Upload failed"); }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div>
      {label && <div className="text-xs text-slate-500 mb-1">{label}</div>}
      <div className={`relative border-2 border-dashed border-[color:var(--brand-border)] rounded overflow-hidden bg-slate-50 flex items-center justify-center transition-colors hover:border-[color:var(--brand-primary)]`}
           style={{ height: aspect === "banner" ? 120 : height }}>
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black" aria-label="Remove">
              <X size={12} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <UploadSimple size={22} />
            <span className="text-[10px] mt-1">No image</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={upload} className="hidden" data-testid={testid} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        className="mt-2 w-full text-xs py-1.5 rounded border border-[color:var(--brand-border)] hover:border-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary)] disabled:opacity-50">
        {busy ? "Uploading..." : preview ? "Replace" : "Upload image"}
      </button>
    </div>
  );
}
