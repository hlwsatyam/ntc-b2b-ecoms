import { useState, useEffect, useCallback } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { resolveImg } from "./ImageUpload";

export default function Carousel({ slides = [], interval = 4000 }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const total = slides.length;

  const next = useCallback(() => {
    if (total === 0) return;
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total === 0) return;
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  // Auto-slide
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [paused, next, interval, total]);

  // Reset index if slides change
  useEffect(() => {
    if (current >= total) setCurrent(0);
  }, [total, current]);

  if (total === 0) return null;
  if (total === 1) {
    const s = slides[0];
    return (
      <a href={s.link || "/products"} className="block relative overflow-hidden rounded-lg aspect-[21/8] bg-slate-100">
        {s.image && <img src={resolveImg(s.image)} alt={s.title || ""} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.25) 55%, transparent 100%)" }} />
        <div className="relative h-full flex flex-col justify-center px-8 md:px-14 text-white max-w-lg">
          {s.tag && <span className="inline-block w-fit bg-white/15 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">{s.tag}</span>}
          {s.title && <h2 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight">{s.title}</h2>}
          {s.subtitle && <p className="mt-3 text-sm md:text-base text-white/85 max-w-md">{s.subtitle}</p>}
          {s.cta && <span className="mt-5 inline-flex w-fit bg-[color:var(--brand-primary)] hover:brightness-110 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all">{s.cta} →</span>}
        </div>
      </a>
    );
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
        setTouchStart(null);
      }}
    >
      {/* Slides */}
      <div className="relative aspect-[21/8] bg-slate-100">
        {slides.map((s, i) => (
          <a
            key={s.id || i}
            href={s.link || "/products"}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
          >
            {s.image && (
              <img
                src={resolveImg(s.image)}
                alt={s.title || ""}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.25) 55%, transparent 100%)" }} />
            <div className="relative h-full flex flex-col justify-center px-8 md:px-14 text-white max-w-lg">
              {s.tag && <span className="inline-block w-fit bg-white/15 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">{s.tag}</span>}
              {s.title && <h2 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight drop-shadow-lg">{s.title}</h2>}
              {s.subtitle && <p className="mt-3 text-sm md:text-base text-white/85 max-w-md drop-shadow">{s.subtitle}</p>}
              {s.cta && <span className="mt-5 inline-flex w-fit bg-[color:var(--brand-primary)] hover:brightness-110 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all shadow-lg">{s.cta} →</span>}
            </div>
          </a>
        ))}
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            aria-label="Next slide"
          >
            <CaretRight size={22} weight="bold" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setCurrent(i); }}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-white w-7" : "bg-white/50 w-2 hover:bg-white/75"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {total > 1 && !paused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 z-20 bg-black/20">
          <div
            className="h-full bg-[color:var(--brand-primary)] transition-all ease-linear"
            style={{ width: `${((current + 1) / total) * 100}%`, transitionDuration: paused ? "0ms" : `${interval}ms` }}
          />
        </div>
      )}
    </div>
  );
}
