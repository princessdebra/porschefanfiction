import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PX = (id, w, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${
    h ? `&h=${h}&fit=crop` : ""
  }`;

const PAGES = [
  { year: "1999", gen: "996 GT3",      img: PX(36626909,  900, 1200), note: "The badge begins. Built for homologation, not headlines. The first 911 GT3 was Porsche making a point: that a road car could carry the soul of a race car and not apologise for it." },
  { year: "2003", gen: "996.2 GT3 RS", img: PX(27505234,  900, 1200), note: "The first RS. Lighter. Louder. A line is drawn. Wider arches, a tail-mounted wing, bucket seats as standard. Porsche stopped asking whether this was too much." },
  { year: "2009", gen: "997.2 GT3 RS", img: PX(13207690,  900, 1200), note: "The wing grows. The philosophy sharpens. 450 PS, wider track, centre-lock wheels. Every detail was a deliberate argument for commitment over comfort." },
  { year: "2015", gen: "991.1 GT3 RS", img: PX(38160273,  900, 1200), note: "Naturally aspirated. Naturally obsessive. 500 PS from 4.0 litres. The last generation before forced induction came to Carrera. The RS stayed pure." },
  { year: "2018", gen: "991.2 GT3 RS", img: PX(17880188,  900, 1200), note: "Weissach package. The obsession gets a name. Carbon fibre everywhere it mattered. A car that understood its own purpose so completely it needed a dedicated lightweight package." },
  { year: "2022", gen: "992 GT3 RS",   img: PX(33711070,  900, 1200), note: "DRS, swan-neck wing. A race car with a number plate. 525 PS. 409 kg of downforce. The most extreme street-legal GT3 RS ever built. Ruby Star optional." },
];

const spreadVariants = {
  enter: (d) => ({ opacity: 0, x: d > 0 ? 70 : -70, rotateY: d > 0 ? -6 : 6 }),
  center: { opacity: 1, x: 0, rotateY: 0 },
  exit:  (d) => ({ opacity: 0, x: d > 0 ? -70 : 70, rotateY: d > 0 ? 6 : -6 }),
};

export default function BookHeritage() {
  const [isOpen, setIsOpen] = useState(false);
  const [page,   setPage]   = useState(0);
  const [dir,    setDir]    = useState(1);

  const openBook = () => setIsOpen(true);

  const goPrev = () => {
    if (page > 0) { setDir(-1); setPage(p => p - 1); }
    else           setIsOpen(false); // first page left tap closes book
  };

  const goNext = () => {
    if (page < PAGES.length - 1) { setDir(1); setPage(p => p + 1); }
  };

  const atStart = page === 0;
  const atEnd   = page === PAGES.length - 1;

  return (
    <section id="heritage" className="relative bg-void overflow-hidden">

      {/* ── Section header ── */}
      <div className="px-6 md:px-16 lg:px-24 pt-16 pb-14 border-b border-line/30 flex items-end justify-between gap-6">
        <div>
          <p className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ruby mb-5">The Chronicle</p>
          <p className="font-display italic leading-tight text-ink"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Six generations.<br />One obsession.
          </p>
        </div>
        <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint text-right leading-relaxed hidden md:block">
          1999 — 2022<br />
          {isOpen ? "Click pages to turn" : "Click the book to open"}
        </p>
      </div>

      {/* ── Book stage ── */}
      <div
        className="relative flex flex-col items-center justify-center py-16 md:py-24 px-4 min-h-[78vh]"
        style={{ perspective: "2800px", perspectiveOrigin: "50% 40%" }}
      >
        {/* Ambient ruby glow behind book */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ width: 800, height: 440 }}
          animate={{ opacity: isOpen ? 0.6 : 0.35, scale: isOpen ? 1.2 : 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <div className="w-full h-full" style={{ background: "radial-gradient(ellipse, rgba(225,0,107,0.09) 0%, transparent 70%)" }} />
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════
              CLOSED — floating book cover
          ════════════════════════════════════════ */}
          {!isOpen && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.22 } }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center"
            >
              {/* Float + gentle tilt loop */}
              <motion.div
                animate={{ y: [-10, 10, -10], rotateZ: [-0.7, 0.7, -0.7] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  filter: "drop-shadow(0 48px 80px rgba(0,0,0,0.88)) drop-shadow(0 6px 18px rgba(225,0,107,0.14))",
                }}
              >
                {/* 3-D hover tilt */}
                <motion.div
                  whileHover={{ scale: 1.045, rotateY: -12, rotateX: 5 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  style={{ cursor: "pointer", transformStyle: "preserve-3d", width: "min(320px, 82vw)" }}
                  onClick={openBook}
                  role="button"
                  aria-label="Open the GT3 RS Chronicle book"
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <img
                      src={PX(20252617, 900, 1200)}
                      alt="The GT3 RS Chronicle — cover"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    {/* Cover overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(155deg, rgba(11,11,12,0.74) 0%, rgba(11,11,12,0.28) 48%, rgba(11,11,12,0.90) 100%)" }}
                    />

                    {/* Cover typography */}
                    <div className="absolute inset-0 flex flex-col justify-between px-7 py-9">
                      <div>
                        <p className="font-mono-cap text-[9px] uppercase tracking-widest2 text-ruby mb-1">Ruby Star</p>
                        <div className="h-px w-10 bg-ruby/45" />
                      </div>
                      <div>
                        <div className="h-px bg-ink/18 mb-6" />
                        <p className="font-display leading-[0.88] text-ink" style={{ fontSize: "clamp(2.2rem, 6.5vw, 3.6rem)" }}>
                          The<br />GT3&nbsp;RS
                        </p>
                        <p className="font-display italic leading-none text-ruby mt-2" style={{ fontSize: "clamp(1.3rem, 3.8vw, 2.1rem)" }}>
                          Chronicle
                        </p>
                        <div className="h-px bg-ink/18 mt-6 mb-3" />
                        <p className="font-mono-cap text-[8.5px] uppercase tracking-widest2 text-ink-faint">
                          1999 — 2022 &nbsp;&middot;&nbsp; Six Generations
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono-cap text-[7.5px] uppercase tracking-widest2 text-ink-faint">Princess Debra</p>
                        <p className="font-mono-cap text-[7.5px] uppercase tracking-widest2 text-ink-faint">Portfolio 2026</p>
                      </div>
                    </div>

                    {/* Spine shadow */}
                    <div className="absolute left-0 top-0 h-full w-5 pointer-events-none"
                      style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6), transparent)" }} />
                  </div>
                </motion.div>
              </motion.div>

              {/* Pulsing open hint */}
              <motion.p
                className="mt-8 font-mono-cap text-[9px] uppercase tracking-widest2 text-ink-faint text-center"
                animate={{ opacity: [0.35, 0.9, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                Click to open &rarr;
              </motion.p>
            </motion.div>
          )}

          {/* ════════════════════════════════════════
              OPEN — full-width spread
          ════════════════════════════════════════ */}
          {isOpen && (
            <motion.div
              key="spread-wrapper"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.22 } }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
              style={{ maxWidth: 980 }}
            >
              {/* Page spreads */}
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={page}
                  custom={dir}
                  variants={spreadVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    boxShadow: "0 44px 110px rgba(0,0,0,0.8), 0 10px 28px rgba(0,0,0,0.55)",
                    transformStyle: "preserve-3d",
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 select-none"
                >
                  {/* ── LEFT PAGE — photo — click = previous ── */}
                  <div
                    className="relative overflow-hidden group"
                    style={{ minHeight: 420, cursor: atStart ? "w-resize" : "w-resize" }}
                    onClick={goPrev}
                    role="button"
                    aria-label={atStart ? "Close book" : "Previous page"}
                  >
                    <img
                      src={PAGES[page].img}
                      alt={`${PAGES[page].year} — ${PAGES[page].gen}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="eager"
                    />
                    {/* Overlay tint on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/18 transition-colors duration-300 pointer-events-none" />

                    {/* Page edge gradient (toward spine) */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to right, rgba(11,11,12,0.12) 0%, transparent 35%, rgba(11,11,12,0.5) 100%)" }} />

                    {/* Arrow indicator */}
                    <div className="absolute inset-0 flex items-center justify-start pl-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)" }}
                      >
                        <span className="text-white/90 text-base leading-none">←</span>
                      </div>
                    </div>

                    {/* Action label */}
                    <div className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <span className="font-mono-cap text-[8px] uppercase tracking-widest2 text-white/55">
                        {atStart ? "Close book" : "Previous"}
                      </span>
                    </div>

                    {/* Page number */}
                    <span className="absolute bottom-5 right-6 font-mono-cap text-[9px] tracking-widest2 text-white/32 pointer-events-none">
                      {String(page + 1).padStart(2, "0")}
                    </span>

                    {/* Spine shadow right */}
                    <div className="absolute right-0 top-0 h-full w-10 pointer-events-none"
                      style={{ background: "linear-gradient(to left, rgba(0,0,0,0.68), transparent)" }} />
                  </div>

                  {/* ── RIGHT PAGE — cream paper — click = next ── */}
                  <div
                    className={`relative overflow-hidden flex flex-col justify-between ${atEnd ? "cursor-default" : "group cursor-e-resize"}`}
                    style={{ background: "#f0ebe2", padding: "clamp(2rem, 4.5vw, 3.8rem)" }}
                    onClick={goNext}
                    role={atEnd ? undefined : "button"}
                    aria-label={atEnd ? undefined : "Next page"}
                  >
                    {/* Paper grain */}
                    <div className="absolute inset-0 opacity-[0.055] grain pointer-events-none" />

                    {/* Spine shadow left */}
                    <div className="absolute left-0 top-0 h-full w-8 pointer-events-none"
                      style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2), transparent)" }} />

                    {/* Top meta */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-9">
                        <span className="font-mono-cap text-[8.5px] uppercase tracking-widest2 text-stone-400">
                          {String(page + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
                        </span>
                        <span className="font-mono-cap text-[8.5px] uppercase tracking-widest2 text-ruby">Heritage</span>
                      </div>

                      {/* Ghost year watermark */}
                      <div className="relative overflow-hidden mb-1" style={{ height: "clamp(4.5rem, 11vw, 8.5rem)" }}>
                        <p
                          className="font-display leading-none select-none pointer-events-none absolute left-0 top-0"
                          style={{ fontSize: "clamp(4.5rem, 11vw, 8.5rem)", color: "rgba(11,11,12,0.075)" }}
                        >
                          {PAGES[page].year}
                        </p>
                      </div>

                      <div className="border-t border-stone-300 pt-5">
                        <p className="font-mono-cap text-[10.5px] uppercase tracking-widest2 text-stone-500 mb-4">
                          {PAGES[page].gen}
                        </p>
                        <p className="font-display italic leading-relaxed text-stone-800"
                          style={{ fontSize: "clamp(0.95rem, 2vw, 1.25rem)" }}>
                          {PAGES[page].note}
                        </p>
                      </div>
                    </div>

                    {/* Bottom rule */}
                    <div className="relative z-10 mt-8">
                      <div className="h-px bg-stone-300 mb-4" />
                      <div className="flex items-center justify-between">
                        <p className="font-mono-cap text-[7.5px] uppercase tracking-widest2 text-stone-400">
                          Ruby Star GT3 RS Chronicle
                        </p>
                        <p className="font-mono-cap text-[7.5px] uppercase tracking-widest2 text-stone-400">
                          {PAGES[page].year}
                        </p>
                      </div>
                    </div>

                    {/* Hover arrow (only when not at end) */}
                    {!atEnd && (
                      <div className="absolute inset-0 flex items-center justify-end pr-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(60,50,44,0.14)", backdropFilter: "blur(4px)" }}
                        >
                          <span className="text-stone-600 text-base leading-none">→</span>
                        </div>
                      </div>
                    )}
                    {!atEnd && (
                      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <span className="font-mono-cap text-[8px] uppercase tracking-widest2 text-stone-400">Next</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots — read-only indicator */}
              <div className="flex items-center justify-center gap-[10px] mt-8">
                {PAGES.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-400"
                    style={{
                      width:      i === page ? 24 : 6,
                      height:     6,
                      background: i === page ? "#e1006b" : "rgba(255,255,255,0.18)",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
