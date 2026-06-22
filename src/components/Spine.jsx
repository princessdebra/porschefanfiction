import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHAPTERS = [
  { id: "hero",         label: "Ignition",      index: "00" },
  { id: "heritage",     label: "Heritage",      index: "01" },
  { id: "engineering",  label: "Engineering",   index: "02" },
  { id: "aerodynamics", label: "Aerodynamics",  index: "03" },
  { id: "the-journal",  label: "The Journal",   index: "04" },
  { id: "on-track",     label: "On Track",      index: "05" },
  { id: "configure",    label: "Configure",     index: "06" },
  { id: "enquiry",      label: "Enquiry",       index: "07" },
];

export default function Spine() {
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState("hero");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? scrollTop / max : 0);

      let current = CHAPTERS[0].id;
      for (const ch of CHAPTERS) {
        const el = document.getElementById(ch.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) {
          current = ch.id;
        }
      }
      setActiveChapter(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Chapter navigation"
      className="fixed left-4 md:left-7 top-0 h-full z-40 hidden sm:flex flex-col items-center justify-center"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="relative flex flex-col items-center" style={{ height: "52vh" }}>
        {/* Track line */}
        <div className="absolute left-[3px] top-0 w-px h-full bg-line/40" />
        {/* Fill */}
        <motion.div
          className="absolute left-[3px] top-0 w-px bg-ruby origin-top"
          style={{ height: `${progress * 100}%` }}
        />

        {CHAPTERS.map((ch, i) => {
          const isActive = ch.id === activeChapter;
          const topPct = (i / (CHAPTERS.length - 1)) * 100;
          return (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              className="absolute flex items-center"
              style={{ top: `${topPct}%`, transform: "translateY(-50%)" }}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Go to ${ch.label}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-[10px] h-[10px] bg-ruby shadow-[0_0_8px_rgba(225,0,107,0.6)]"
                    : "w-[5px] h-[5px] bg-line/60 hover:bg-ink-dim"
                }`}
              />
              <motion.span
                animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
                transition={{ duration: 0.22, delay: i * 0.02 }}
                className={`absolute left-5 whitespace-nowrap font-mono-cap text-[9px] uppercase tracking-widest2 ${
                  isActive ? "text-ruby" : "text-ink-faint"
                }`}
              >
                {ch.index}&nbsp;&nbsp;{ch.label}
              </motion.span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
