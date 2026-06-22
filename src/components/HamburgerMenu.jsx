import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const PX = (id, w, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${h ? `&h=${h}&fit=crop` : ""}`;

const CHAPTERS = [
  { id: "hero",         index: "00", label: "Ignition",     sublabel: "One colour. No apology.",            img: PX(20252617, 480, 320) },
  { id: "heritage",     index: "01", label: "Heritage",     sublabel: "Six generations. One obsession.",    img: PX(36626909, 480, 320) },
  { id: "engineering",  index: "02", label: "Engineering",  sublabel: "Every surface is an argument.",      img: PX(27505234, 480, 320) },
  { id: "aerodynamics", index: "03", label: "Aerodynamics", sublabel: "409 kg of downforce.",               img: PX(13207690, 480, 320) },
  { id: "the-journal",  index: "04", label: "The Journal",  sublabel: "Stories from the build.",            img: PX(38160273, 480, 320) },
  { id: "on-track",     index: "05", label: "On Track",     sublabel: "Momentum has a colour now, too.",   img: PX(17880188, 480, 320) },
  { id: "configure",    index: "06", label: "Configure",    sublabel: "Choose your finish.",               img: PX(33711070, 480, 320) },
  { id: "enquiry",      index: "07", label: "Enquiry",      sublabel: "Some cars are earned.",             img: PX(33711071, 480, 320) },
];

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.28 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function HamburgerMenu({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-void-deep flex flex-col overflow-y-auto"
          initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
          exit={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-8 border-b border-line flex-shrink-0">
            <p className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-dim">
              Ruby Star &middot; Navigation
            </p>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="flex items-center gap-3 font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-dim hover:text-ruby transition-colors duration-300"
            >
              Close <span aria-hidden className="text-lg leading-none">✕</span>
            </button>
          </div>

          {/* Chapter list */}
          <nav className="flex-1 px-6 md:px-16 lg:px-24 py-10">
            <motion.ul variants={listVariants} initial="hidden" animate="visible" className="divide-y divide-line">
              {CHAPTERS.map((ch) => (
                <motion.li key={ch.id} variants={itemVariants}>
                  <a
                    href={`#${ch.id}`}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-6 py-5 md:py-6 hover:pl-3 transition-all duration-300"
                  >
                    <div className="flex items-baseline gap-5 min-w-0">
                      <span className="font-mono-cap text-[11px] tracking-widest2 text-ruby flex-shrink-0">
                        {ch.index}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-2xl md:text-4xl text-ink group-hover:text-ruby transition-colors duration-300 leading-tight">
                          {ch.label}
                        </p>
                        <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint mt-1">
                          {ch.sublabel}
                        </p>
                      </div>
                    </div>
                    <div className="w-20 h-12 md:w-32 md:h-18 flex-shrink-0 overflow-hidden opacity-25 group-hover:opacity-65 transition-all duration-500 group-hover:scale-105">
                      <img src={ch.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 md:px-16 lg:px-24 py-8 border-t border-line">
            <p className="font-mono-cap text-[10px] uppercase tracking-wide text-ink-faint">
              Princess Debra &middot; Portfolio Project &middot; Not affiliated with Porsche&nbsp;AG
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
