import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useAnimation,
  useMotionValueEvent,
} from "framer-motion";
import Spine from "./components/Spine.jsx";
import Reveal from "./components/Reveal.jsx";
import Lightbox from "./components/Lightbox.jsx";
import Cursor from "./components/Cursor.jsx";
import HamburgerMenu from "./components/HamburgerMenu.jsx";
import TextReveal from "./components/TextReveal.jsx";
import BookHeritage from "./components/BookHeritage.jsx";
import DriveSequence from "./components/DriveSequence.jsx";

/* ─── helpers ───────────────────────────────────────────────────── */
const PX = (id, w, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${
    h ? `&h=${h}&fit=crop` : ""
  }`;

const DISCLAIMER =
  `This is an unofficial, fan-made tribute project created by Princess Debra for portfolio purposes only. It is not affiliated with, endorsed by, or sponsored by Porsche AG. “Porsche”, “911”, and “GT3 RS” are trademarks of Porsche AG, used here descriptively and respectfully. No commercial claim is made to these marks.`;

/* ─── data ──────────────────────────────────────────────────────── */
const TRACK_IMAGES = [
  { src: PX(27505234, 1920, 1080), alt: "Blue Porsche 911 GT3 at speed on a wet racing circuit",      caption: "Turn-in, blue line, wet track" },
  { src: PX(38160273, 1920, 1080), alt: "Yellow Porsche GT3 RS cornering at the Nürburgring",         caption: "Nürburgring, sector two" },
  { src: PX(36626909, 1920, 1080), alt: "White GT3 RS Cup car at speed on circuit",                    caption: "Cup entry, aero loaded" },
  { src: PX(13207690, 1920, 1080), alt: "GT3 RS rear wing detail in vibrant orange",                   caption: "Swan-neck wing, full load" },
  { src: PX(17880188, 1920, 1080), alt: "GT3 bucket seat interior with green accents",                 caption: "Cockpit, pre-session" },
  { src: PX(20252617, 1920, 1080), alt: "Orange 992 GT3 RS on mountain road at dusk",                  caption: "Last run of the day" },
];

const COLOR_IMAGES = [
  { src: PX(33711071, 900, 1200), alt: "Pink Porsche 911 GT3 front quarter" },
  { src: PX(33711070, 900, 900),  alt: "Pink Porsche 911 GT3 rear three-quarter" },
  { src: PX(14518974, 900, 900),  alt: "GT3 badge on red bodywork" },
  { src: PX(33711087, 900, 1200), alt: "Pink Porsche 911 GT3 side profile" },
  { src: PX(13207690, 900, 900),  alt: "GT3 RS badge and rear wing" },
  { src: PX(17880188, 900, 900),  alt: "GT3 bucket seat interior" },
];

const TIMELINE = [
  { year: "1999", gen: "996 GT3",      note: "The badge begins. Built for homologation, not headlines." },
  { year: "2003", gen: "996.2 GT3 RS", note: "The first RS. Lighter. Louder. A line is drawn." },
  { year: "2009", gen: "997.2 GT3 RS", note: "The wing grows. The philosophy sharpens." },
  { year: "2015", gen: "991.1 GT3 RS", note: "Naturally aspirated. Naturally obsessive." },
  { year: "2018", gen: "991.2 GT3 RS", note: "Weissach package. The obsession gets a name." },
  { year: "2022", gen: "992 GT3 RS",   note: "DRS, swan-neck wing. A race car with a number plate." },
];

const ARTICLES = [
  {
    index: "01", category: "Aerodynamics",
    title: "The Wing That Changed Everything",
    excerpt: "On a circuit, downforce is the difference between fast and committed. The swan-neck wing isn't a styling exercise — it's a position statement about what this car is actually for.",
    img: PX(27505234, 900, 600), alt: "Blue GT3 RS at speed on wet circuit",
  },
  {
    index: "02", category: "Engine",
    title: "9,000 Reasons",
    excerpt: "The 4.0-litre flat-six doesn't make power early. It earns it — at 9,000 RPM, at the edge of what an engine is allowed to feel like.",
    img: PX(38160273, 900, 600), alt: "Yellow GT3 RS cornering at the Nürburgring",
  },
  {
    index: "03", category: "Colour",
    title: "Painted to Sample: Ruby Star",
    excerpt: "The decision to go Paint to Sample isn't about standing out. It's about being specific. Ruby Star is a very specific answer to a very old question.",
    img: PX(33711071, 900, 600), alt: "Pink GT3 RS front quarter detail",
  },
];

const PAINT_OPTIONS = [
  { name: "Ruby Star",    hex: "#d4607a", imgId: 33711070, filter: "" },
  { name: "Shark Blue",   hex: "#1b3f6e", imgId: 27505234, filter: "" },
  { name: "Speed Yellow", hex: "#f2c200", imgId: 38160273, filter: "" },
  { name: "GT Silver",    hex: "#8a8d94", imgId: 36626909, filter: "grayscale(0.8) brightness(1.05)" },
  { name: "Python Green", hex: "#1a4728", imgId: 27505234, filter: "hue-rotate(80deg) saturate(0.75)" },
];

const SPECS_TICKER = [
  { label: "Engine",    value: "4.0L Flat-Six" },
  { label: "Power",     value: "525 PS" },
  { label: "Redline",   value: "9,000 RPM" },
  { label: "0–100",     value: "3.2 s" },
  { label: "Top Speed", value: "296 km/h" },
  { label: "Weight",    value: "1,430 kg" },
  { label: "Aero",      value: "409 kg DN" },
];

/* ─── CountUp ───────────────────────────────────────────────────── */
function CountUp({ to, suffix = "", duration = 2.2, decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / (duration * 1000), 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(decimals > 0 ? parseFloat((e * to).toFixed(decimals)) : Math.floor(e * to));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, decimals]);
  return <span ref={ref}>{decimals > 0 ? val.toFixed(decimals) : val}{suffix}</span>;
}

/* ─── SectionDivider ────────────────────────────────────────────── */
function SectionDivider({ index, title }) {
  return (
    <div className="relative border-t border-line overflow-hidden">
      <div className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-7">
        <div className="flex items-center gap-5">
          <motion.span
            className="font-mono-cap text-ruby text-xs tracking-widest2"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            {index}
          </motion.span>
          <motion.span
            className="block h-px bg-line"
            style={{ width: 56 }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.12 }}
          />
          <motion.span
            className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-faint"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.22 }}
          >
            {title}
          </motion.span>
        </div>
        <span
          aria-hidden
          className="font-display leading-none select-none pointer-events-none"
          style={{ fontSize: "clamp(4rem,8vw,8rem)", color: "rgba(255,255,255,0.04)" }}
        >
          {index}
        </span>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────── */
export default function App() {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [seqDone, setSeqDone] = useState(false);

  return (
    <div className="bg-void text-ink font-body relative overflow-x-clip cursor-none">
      <AnimatePresence>
        {!seqDone && (
          <DriveSequence onComplete={() => setSeqDone(true)} />
        )}
      </AnimatePresence>
      <Cursor />
      <Spine />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <a
        href="#heritage"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-ruby focus:text-void focus:px-4 focus:py-2 focus:rounded font-mono-cap text-xs uppercase tracking-widest2"
      >
        Skip to content
      </a>

      <Hero onMenuOpen={() => setMenuOpen(true)} seqDone={seqDone} />

      <main id="main-content">
        {/* Specs ticker */}
        <div className="border-y border-line/60 bg-void-deep overflow-hidden">
          <div className="py-5 overflow-hidden">
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            >
              {[...SPECS_TICKER, ...SPECS_TICKER, ...SPECS_TICKER, ...SPECS_TICKER].map((s, i) => (
                <span key={i} className="inline-flex items-center gap-3 px-10 font-mono-cap text-[11px] uppercase tracking-widest2">
                  <span className="text-ink-faint">{s.label}</span>
                  <span className="font-display text-xl text-ink">{s.value}</span>
                  <span className="text-ruby/40 ml-6">×</span>
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        <SectionDivider index="01" title="Heritage" />
        <BookHeritage />

        <SectionDivider index="02" title="Engineering" />
        <Engineering />

        <SectionDivider index="03" title="Aerodynamics" />
        <Aerodynamics />

        <SectionDivider index="04" title="The Journal" />
        <TheJournal />

        <SectionDivider index="05" title="On Track" />
        <OnTrack onOpenImage={(i) => setLightboxIndex(i)} />

        <SectionDivider index="06" title="Configure" />
        <Configure />

        <SectionDivider index="07" title="Enquiry" />
        <Enquiry />
      </main>

      <Footer onMenuOpen={() => setMenuOpen(true)} />

      <Lightbox
        images={TRACK_IMAGES}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
/* ── Hero animation variants ── */
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
};
const heroItem = {
  hidden:   { opacity: 0, y: 22 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] } },
};
const heroLine = {
  hidden:   { y: "110%" },
  visible:  { y: 0,      transition: { duration: 1.1,  ease: [0.16, 1, 0.3, 1] } },
};

function Hero({ onMenuOpen, seqDone }) {
  const heroRef   = useRef(null);
  const shakeCtrl = useAnimation();
  const [engineOn, setEngineOn] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY     = useTransform(scrollYProgress, [0, 1], ["0%", "32%"]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const liftOut = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);

  const toggleEngine = useCallback(async () => {
    const next = !engineOn;
    setEngineOn(next);
    if (next) {
      await shakeCtrl.start({
        x: [0, -6, 6, -5, 5, -3, 3, -1, 1, 0],
        transition: { duration: 0.7, ease: "easeOut" },
      });
    }
  }, [engineOn, shakeCtrl]);

  return (
    <section id="hero" ref={heroRef} className="relative h-screen overflow-hidden">
      {/* Background — preloaded during the drive sequence */}
      <motion.div className="absolute inset-0" style={{ y: bgY }} aria-hidden>
        <img
          src={PX(20252617, 1920, 1080)}
          alt=""
          className="w-full h-[130%] -mt-[10%] object-cover object-center"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-void/25 to-void" />
        <div className="grain absolute inset-0 pointer-events-none" />
      </motion.div>

      {/* Content — stagger triggers when seqDone flips */}
      <motion.div
        className="relative flex flex-col h-full px-6 md:px-16 lg:px-24 pt-9 pb-12"
        style={{ opacity: fadeOut, y: liftOut }}
        animate={shakeCtrl}
      >
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate={seqDone ? "visible" : "hidden"}
          className="contents"
        >
          {/* Topbar */}
          <motion.div
            variants={heroItem}
            className="flex items-center justify-between font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-dim"
          >
            <span>Ruby Star &middot; GT3 RS Tribute</span>
            <button
              onClick={onMenuOpen}
              aria-label="Open menu"
              className="flex items-center gap-3 border border-line/60 rounded-full px-5 py-2 hover:border-ruby/70 hover:text-ruby transition-all duration-300"
            >
              Menu
              <span aria-hidden className="flex flex-col gap-[5px]">
                <span className="block w-4 h-px bg-current" />
                <span className="block w-3 h-px bg-current" />
              </span>
            </button>
          </motion.div>

          {/* Headline block */}
          <div className="flex-1 flex items-end pb-14">
            <div className="w-full">
              <motion.p
                variants={heroItem}
                className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ruby mb-8"
              >
                Painted to Sample &middot; 992 Generation
              </motion.p>

              <h1 className="font-display font-light leading-[0.87] tracking-tight">
                {[
                  { text: "One colour.", cls: "text-[13vw] md:text-[11vw] text-ink" },
                  { text: "No apology.", cls: "text-[13vw] md:text-[11vw] text-ruby italic" },
                ].map(({ text, cls }) => (
                  <div key={text} className="overflow-hidden">
                    <motion.span variants={heroLine} className={`block ${cls}`}>
                      {text}
                    </motion.span>
                  </div>
                ))}
              </h1>

              <motion.div
                variants={heroItem}
                className="mt-10 pt-8 border-t border-line/40 flex items-center gap-8 flex-wrap"
              >
                <p className="text-ink-dim text-sm md:text-base leading-relaxed max-w-sm">
                  A personal study of the 911 GT3&nbsp;RS — finished in Ruby Star, built for nothing but the drive.
                </p>
                <button
                  onClick={toggleEngine}
                  aria-pressed={engineOn}
                  className={`flex items-center gap-3 font-mono-cap text-[11px] uppercase tracking-widest2 border px-5 py-3 rounded-full transition-all duration-300 ${
                    engineOn
                      ? "border-ruby text-ruby bg-ruby/10 engine-on"
                      : "border-line/60 text-ink-dim hover:border-ruby/60 hover:text-ruby"
                  }`}
                >
                  <span className={`block w-2 h-2 rounded-full ${engineOn ? "bg-ruby" : "bg-ink-faint"}`} />
                  {engineOn ? "Engine On" : "Start Engine"}
                </button>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div variants={heroItem} className="flex items-end justify-between gap-6">
            <p className="hidden md:block font-mono-cap text-[10px] uppercase tracking-wide text-ink-faint leading-relaxed max-w-sm">
              {DISCLAIMER}
            </p>
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div className="flex gap-[6px]">
                <div className="w-px h-16 bg-line/30 relative overflow-hidden">
                  <motion.div
                    className="absolute left-0 w-full bg-ruby"
                    animate={seqDone ? { top: ["0%","100%"], height: ["0%","100%","0%"] } : { top: "0%", height: "0%" }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
                  />
                </div>
                <div className="w-px h-16 bg-line/30" />
              </div>
              <span className="font-mono-cap text-[9px] uppercase tracking-widest2 text-ink-faint">Scroll</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   01 · HERITAGE
   Sticky image left · each year panel fills full screen on desktop
══════════════════════════════════════════════════════════════════ */
function HeritagePanel({ item, index, total }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <div
      ref={ref}
      className="min-h-screen flex flex-col justify-center px-10 lg:px-16 py-20 border-b border-line/30 relative overflow-hidden"
    >
      {/* Huge faded index watermark */}
      <span
        aria-hidden
        className="absolute right-4 bottom-0 font-display leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 22vw, 22rem)", color: "rgba(255,255,255,0.03)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Counter badge */}
      <motion.p
        className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ruby mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </motion.p>

      {/* Giant year — always visible, no clip trick */}
      <motion.p
        className="font-display text-ruby leading-none mb-6"
        style={{ fontSize: "clamp(5rem, 14vw, 14rem)" }}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {item.year}
      </motion.p>

      {/* Gen + note */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.25 }}
      >
        <p className="font-mono-cap text-xs uppercase tracking-widest2 text-ink mb-4">{item.gen}</p>
        <p className="text-ink-dim leading-relaxed max-w-xs text-base">{item.note}</p>
      </motion.div>
    </div>
  );
}

function Heritage() {
  const sRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section id="heritage" ref={sRef}>
      {/* Full-bleed chapter intro */}
      <div className="relative h-[60vh] overflow-hidden">
        <motion.img
          src={PX(36626909, 1920, 1080)}
          alt="GT3 RS Cup car at speed on circuit"
          className="absolute inset-0 w-full h-[130%] -mt-[10%] object-cover"
          style={{ y: imgY }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void/90 via-void/55 to-void/15" />
        <div className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24">
          <div>
            <TextReveal delay={0.05} wordDelay={0.055} duration={1.0}
              className="font-display italic text-5xl md:text-7xl lg:text-8xl leading-none text-ink block">
              Six generations.
            </TextReveal>
            <TextReveal delay={0.35} wordDelay={0.055} duration={1.0}
              className="font-display italic text-5xl md:text-7xl lg:text-8xl leading-none text-ruby block mt-2">
              One obsession.
            </TextReveal>
          </div>
        </div>
      </div>

      {/* Desktop: sticky image + scrolling year panels */}
      <div className="hidden md:flex items-start">
        {/* Sticky side — the car image */}
        <div className="w-1/2 sticky top-0 h-screen overflow-hidden flex-shrink-0">
          <img
            src={PX(33711070, 900, 1200)}
            alt="Pink Porsche 911 GT3 RS side profile"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-void/20" />
        </div>

        {/* Scrolling year panels */}
        <div className="w-1/2 bg-void">
          {TIMELINE.map((item, i) => (
            <HeritagePanel key={item.year} item={item} index={i} total={TIMELINE.length} />
          ))}
        </div>
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden">
        {TIMELINE.map((item, i) => (
          <div key={item.year} className="px-6 py-14 border-b border-line/30 relative overflow-hidden">
            <span aria-hidden className="absolute right-2 bottom-0 font-display leading-none select-none" style={{ fontSize: "8rem", color: "rgba(255,255,255,0.04)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <Reveal>
              <p className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ruby mb-4">
                {String(i + 1).padStart(2, "0")} / {String(TIMELINE.length).padStart(2, "0")}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="font-display text-ruby leading-none mb-4" style={{ fontSize: "clamp(4rem,18vw,6rem)" }}>{item.year}</p>
              <p className="font-mono-cap text-xs uppercase tracking-widest2 text-ink mb-3">{item.gen}</p>
              <p className="text-ink-dim leading-relaxed">{item.note}</p>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   02 · ENGINEERING
══════════════════════════════════════════════════════════════════ */
function Engineering() {
  const sRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section id="engineering" ref={sRef} className="carbon">
      {/* Full-bleed image + quote overlay */}
      <div className="relative h-[85vh] overflow-hidden">
        <motion.img
          src={PX(27505234, 1920, 1080)}
          alt="Porsche 911 GT3 at speed on wet circuit"
          className="absolute inset-0 w-full h-[130%] -mt-[10%] object-cover"
          style={{ y: imgY }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void/92 via-void/55 to-void/10" />
        <div className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24">
          <div className="max-w-2xl">
            <TextReveal delay={0.1} wordDelay={0.055}
              className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight text-ink block">
              Every surface is an argument,
            </TextReveal>
            <TextReveal delay={0.55} wordDelay={0.055}
              className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight text-ink-dim block mt-2">
              not a decoration.
            </TextReveal>
          </div>
        </div>
      </div>

      {/* Kinetic stat counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-line/40">
        {[
          { to: 409,  suffix: " kg", label: "Downforce\nat 200 km/h" },
          { to: 9000, suffix: "",    label: "RPM\nRedline" },
          { to: 525,  suffix: " PS", label: "Naturally\naspirated power" },
          { to: 3.2,  suffix: " s",  label: "0 to 100\nkm/h", decimals: 1, duration: 1.8 },
        ].map((s, i) => (
          <div key={s.label} className="border-r last:border-r-0 border-b md:border-b-0 border-line/40 p-8 md:p-10 hover:bg-void-raised/20 transition-colors duration-300">
            <Reveal delay={i * 0.09}>
              <p className="font-display text-5xl md:text-6xl text-ruby mb-3 tabular-nums">
                <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} duration={s.duration ?? 2.2} />
              </p>
              <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint leading-relaxed whitespace-pre-line">
                {s.label}
              </p>
            </Reveal>
          </div>
        ))}
      </div>

      {/* Body copy */}
      <div className="px-6 md:px-16 lg:px-24 py-20 md:py-28 grid md:grid-cols-2 gap-14">
        <Reveal className="space-y-5 text-ink-dim leading-relaxed">
          <p>The swan-neck wing exists because of how air behaves underneath it, not above. The dive planes at the front aren't styling — they're a negotiation with downforce at a specific, deliberate speed.</p>
          <p>None of it is loud about what it does. It just does it, lap after lap, until you stop noticing the engineering and start noticing the confidence it gives you in a fast corner.</p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-2 gap-4">
          {[
            { stat: "DRS",      label: "Drag reduction system" },
            { stat: "PDCC",     label: "Active anti-roll bars" },
            { stat: "6-speed",  label: "PDK dual-clutch" },
            { stat: "Weissach", label: "Optional weight package" },
          ].map((item) => (
            <div key={item.stat} className="border border-line/50 p-5 hover:border-ruby/50 transition-colors duration-300">
              <p className="font-display text-2xl md:text-3xl text-ruby mb-2">{item.stat}</p>
              <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint leading-relaxed">{item.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* Progress dot — fills ruby as the stack scrolls past its poster. */
function PosterDot({ progress, start, end }) {
  const bg = useTransform(progress, [start, end], ["rgba(255,255,255,0.22)", "rgba(225,0,107,0.95)"]);
  return <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bg }} />;
}

/* One poster in the pinned stack. It rests centred (covered by the posters
   above it) until its slice of scroll arrives, then flies up-and-back —
   tumbling and fading — to reveal the poster sitting beneath it.

   The LAST poster never flies: it stays centred and simply scrolls away with
   the stage when the sticky zone releases, handing straight off to the next
   section (no duplicated image, no black gap). */
function StackPoster({ src, alt, caption, index, total, progress, sliceStart, sliceEnd, fly }) {
  const flyStart = sliceStart + (sliceEnd - sliceStart) * 0.4; // brief rest, then fly

  const y       = useTransform(progress, [flyStart, sliceEnd], ["0%", "-135%"]);
  const rotateZ = useTransform(progress, [flyStart, sliceEnd], [0, index % 2 ? 13 : -13]);
  const rotateX = useTransform(progress, [flyStart, sliceEnd], [0, 40]);
  const scale   = useTransform(progress, [flyStart, sliceEnd], [1, 0.74]);
  const opacity = useTransform(progress, [flyStart, sliceEnd], [1, 0]);

  const motionStyle = fly
    ? { zIndex: total - index, y, rotateZ, rotateX, scale, opacity, transformStyle: "preserve-3d" }
    : { zIndex: total - index };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={motionStyle}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width:  "min(90vw, 960px)",
          height: "min(84vh, 780px)",
          boxShadow: "0 50px 110px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void/85 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink/85 max-w-[70%]">{caption}</p>
          <p className="font-mono-cap text-[10px] text-ruby tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   03 · AERODYNAMICS
══════════════════════════════════════════════════════════════════ */
function Aerodynamics() {
  const sRef      = useRef(null);
  const stickyRef = useRef(null);
  const TOTAL     = COLOR_IMAGES.length;
  const FLYERS    = TOTAL - 1;   // first N-1 posters fly; the last stays & scrolls off
  const EXIT_END  = 0.86;        // the fliers finish over [0, EXIT_END]

  /* Scroll progress through the pinned stack zone */
  const { scrollYProgress: stackP } = useScroll({
    target: stickyRef,
    offset: ["start start", "end end"],
  });

  const hintFade = useTransform(stackP, [0, 0.06], [1, 0]);
  const uiFade   = useTransform(stackP, [0.9, 0.99], [1, 0]);

  /* Parallax for the full-bleed aero shot below */
  const { scrollYProgress } = useScroll({ target: sRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section id="aerodynamics" ref={sRef}>
      {/*
        Pinned poster stack. The stage stays fixed (sticky) so the page never
        feels like it's moving — each poster flies away in turn to reveal the
        next. The last poster stays put and scrolls off naturally as the sticky
        zone releases, handing straight into the aero section below.
      */}
      <div ref={stickyRef} style={{ height: `${TOTAL * 80 + 90}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden bg-void" style={{ perspective: "1400px" }}>
          {COLOR_IMAGES.map((img, i) => {
            const isLast = i === TOTAL - 1;
            return (
              <StackPoster
                key={img.alt}
                src={img.src}
                alt={img.alt}
                caption={img.alt}
                index={i}
                total={TOTAL}
                progress={stackP}
                sliceStart={(i / FLYERS) * EXIT_END}
                sliceEnd={((i + 1) / FLYERS) * EXIT_END}
                fly={!isLast}
              />
            );
          })}

          {/* Progress dots */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[40] pointer-events-none"
            style={{ opacity: uiFade }}
          >
            {COLOR_IMAGES.map((_, i) => (
              <PosterDot
                key={i}
                progress={stackP}
                start={(i / TOTAL)}
                end={((i + 1) / TOTAL)}
              />
            ))}
          </motion.div>

          {/* Scroll hint */}
          <motion.p
            className="absolute bottom-8 right-8 z-[40] font-mono-cap text-[9px] uppercase tracking-widest2 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.3)", opacity: hintFade }}
          >
            Scroll to explore
          </motion.p>
        </div>
      </div>

      {/* Full-bleed aero shot + animated SVG airflow */}
      <div className="relative h-[85vh] overflow-hidden">
        <motion.img
          src={PX(13207690, 1920, 1080)}
          alt="GT3 RS rear wing and aero package"
          className="absolute inset-0 w-full h-[130%] -mt-[10%] object-cover"
          style={{ y: imgY }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-void/55" />

        {/* Animated airflow lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {[
            "M-20,100 C200,80 400,120 650,95 S900,75 1020,88",
            "M-20,200 C180,175 380,215 630,188 S880,170 1020,180",
            "M-20,300 C160,278 360,315 610,290 S865,272 1020,282",
            "M-20,400 C140,375 340,412 590,386 S845,365 1020,375",
            "M-20,490 C175,470 375,502 625,478 S875,458 1020,468",
          ].map((d, i) => (
            <path key={i} d={d} stroke="rgba(225,0,107,0.4)" strokeWidth="1.2" fill="none"
              strokeDasharray="16 32" className={i % 2 === 0 ? "airflow-path" : "airflow-path-slow"}
              style={{ animationDelay: `${i * 0.45}s` }} />
          ))}
        </svg>

        {/* Centred downforce stat */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <Reveal>
            <p className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-faint mb-4">Downforce at top speed</p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="font-display leading-none text-ruby tabular-nums" style={{ fontSize: "clamp(5rem,15vw,14rem)" }}>
              <CountUp to={409} suffix=" kg" />
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="font-display italic text-2xl md:text-4xl text-ink mt-6 max-w-lg">
              More downforce than the car weighs.
            </p>
          </Reveal>
        </div>
      </div>

      {/* 3-column callout row */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-line/40">
        {[
          { title: "Swan-neck Wing",    desc: "Mounted above the wing plane to produce clean air over its entire upper surface — maximising downforce without compromising drag reduction." },
          { title: "Front Dive Planes", desc: "Redirect air into the underbody and around the front tyres, reducing lift and keeping the front end planted at high speed." },
          { title: "DRS System",        desc: "Drag reduction pulls the wing flat on long straights — trading downforce for speed — then snaps back the moment you brake." },
        ].map((item, i) => (
          <Reveal key={item.title} delay={i * 0.1}
            className="px-8 md:px-10 py-12 border-b md:border-b-0 border-r last:border-r-0 border-line/40">
            <p className="font-mono-cap text-ruby text-[11px] uppercase tracking-widest2 mb-4">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="font-display text-2xl text-ink mb-4">{item.title}</h3>
            <p className="text-ink-dim leading-relaxed text-sm">{item.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   04 · THE JOURNAL — floating magazine cards
══════════════════════════════════════════════════════════════════ */
function TheJournal() {
  return (
    <section id="the-journal" className="bg-void py-16 md:py-24">
      {/* Header */}
      <div className="px-6 md:px-16 lg:px-24 mb-12 md:mb-20">
        <Reveal className="mb-5">
          <p className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-faint">Editorial</p>
        </Reveal>
        <TextReveal delay={0.1} wordDelay={0.05}
          className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight text-ink block max-w-3xl">
          Stories from the build, the track, and the philosophy.
        </TextReveal>
      </div>

      {/* Floating magazine cards */}
      <div className="px-6 md:px-10 lg:px-16 grid md:grid-cols-3 gap-6 md:gap-8">
        {ARTICLES.map((article, i) => (
          <motion.article
            key={article.index}
            className="group flex flex-col bg-void-raised border border-line/40 overflow-hidden"
            style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, boxShadow: "0 36px 80px rgba(0,0,0,0.7)" }}
          >
            {/* Card image */}
            <div className="relative aspect-[3/2] overflow-hidden flex-shrink-0">
              <img
                src={article.img}
                alt={article.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              {/* Ruby tint on hover */}
              <div className="absolute inset-0 bg-ruby/0 group-hover:bg-ruby/10 transition-colors duration-500" />
              {/* Category badge top-left */}
              <div className="absolute top-4 left-4">
                <span className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink bg-void/70 px-3 py-1 backdrop-blur-sm">
                  {article.category}
                </span>
              </div>
              {/* Article number top-right */}
              <div className="absolute top-4 right-4">
                <span className="font-mono-cap text-ruby text-xs tracking-widest2">{article.index}</span>
              </div>
            </div>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-6 md:p-8">
              <h3 className="font-display text-xl md:text-2xl leading-tight text-ink mb-4 group-hover:text-ruby transition-colors duration-400">
                {article.title}
              </h3>
              <p className="text-ink-dim leading-relaxed text-sm flex-1 mb-8">{article.excerpt}</p>
              <span className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ruby flex items-center gap-3 group-hover:gap-5 transition-all duration-300 border-t border-line/40 pt-5">
                Read more <span aria-hidden>→</span>
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   05 · ON TRACK
══════════════════════════════════════════════════════════════════ */
function OnTrack({ onOpenImage }) {
  return (
    <section id="on-track" className="bg-void-deep">
      <div className="px-6 md:px-16 lg:px-24 py-16 md:py-24">
        <TextReveal delay={0.05} wordDelay={0.06}
          className="font-display text-5xl md:text-7xl lg:text-8xl leading-none text-ink block">
          Momentum has a colour now, too.
        </TextReveal>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3">
        {TRACK_IMAGES.map((img, i) => (
          <motion.div
            key={img.alt}
            className={`group relative overflow-hidden ${i % 5 === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
          >
            <button onClick={() => onOpenImage(i)} className="absolute inset-0 w-full h-full" aria-label={img.alt}>
              <img src={img.src} alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <span className="p-4 font-mono-cap text-[10px] uppercase tracking-widest2 text-ink/80">{img.caption}</span>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <Reveal className="px-6 md:px-16 lg:px-24 py-14 md:py-20 max-w-md text-ink-dim leading-relaxed">
        <p>On track, the colour stops being a statement and becomes a reference point — the thing your eye picks out first on a long straight, just before the braking marker.</p>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   06 · CONFIGURE
══════════════════════════════════════════════════════════════════ */
function Configure() {
  const [selected, setSelected] = useState(0);
  const opt = PAINT_OPTIONS[selected];

  return (
    <section id="configure" className="bg-void">
      <div className="px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <Reveal className="mb-6">
          <p className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-faint">Paint to Sample</p>
        </Reveal>
        <TextReveal delay={0.1} wordDelay={0.055}
          className="font-display text-4xl md:text-5xl leading-tight text-ink block">
          Choose your finish.
        </TextReveal>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={opt.imgId + opt.filter}
            src={PX(opt.imgId, 1920, 1080)}
            alt={`GT3 RS in ${opt.name}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: opt.filter || "none" }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            loading="eager"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-void/65" />
        <div className="absolute bottom-8 left-6 md:left-16 lg:left-24">
          <AnimatePresence mode="wait">
            <motion.p key={opt.name} className="font-display text-4xl md:text-6xl text-ink"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}>
              {opt.name}
            </motion.p>
          </AnimatePresence>
          <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint mt-1">Porsche Paint to Sample</p>
        </div>
      </div>

      <div className="px-6 md:px-16 lg:px-24 py-10 flex items-center gap-5 flex-wrap">
        {PAINT_OPTIONS.map((p, i) => (
          <button key={p.name} onClick={() => setSelected(i)} aria-label={p.name} aria-pressed={selected === i}
            className={`relative w-10 h-10 rounded-full transition-all duration-300 magnetic ${
              selected === i
                ? "scale-125 shadow-[0_0_0_2px_rgba(225,0,107,0.9),0_0_0_5px_rgba(225,0,107,0.15)]"
                : "hover:scale-110"
            }`}
            style={{ backgroundColor: p.hex }}
          />
        ))}
        <span className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-faint ml-1">
          {PAINT_OPTIONS[selected].name}
        </span>
      </div>

      <Reveal className="px-6 md:px-16 lg:px-24 pb-14 max-w-md text-ink-dim leading-relaxed text-sm">
        <p>Every GT3 RS leaves the factory as a statement. Paint to Sample turns that statement into a signature. The colour shown is a visual representation — real RS finishes are mixed to order.</p>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   07 · ENQUIRY
══════════════════════════════════════════════════════════════════ */
function Enquiry() {
  const sRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sRef, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);

  return (
    <section id="enquiry" ref={sRef} className="relative min-h-screen overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY }} aria-hidden>
        <img src={PX(33711070, 1920, 1080)} alt=""
          className="w-full h-[130%] -mt-[15%] object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-void/80" />
        <div className="grain absolute inset-0 pointer-events-none opacity-50" />
      </motion.div>

      <div className="relative grid md:grid-cols-2 min-h-screen">
        <div className="flex flex-col justify-center px-6 md:px-16 lg:px-24 py-20">
          <TextReveal delay={0.1} wordDelay={0.05}
            className="font-display italic text-4xl md:text-5xl lg:text-6xl leading-tight text-ink block mb-3">
            Some cars are driven.
          </TextReveal>
          <TextReveal delay={0.42} wordDelay={0.05}
            className="font-display italic text-4xl md:text-5xl lg:text-6xl leading-tight text-ruby block mb-14">
            This one is earned.
          </TextReveal>

          <Reveal delay={0.7}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5 max-w-md">
              {[
                { id: "name",  label: "Full name",     type: "text",  placeholder: "Your name" },
                { id: "email", label: "Email address", type: "email", placeholder: "your@email.com" },
              ].map((f) => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint block mb-2">{f.label}</label>
                  <input id={f.id} type={f.type} placeholder={f.placeholder}
                    className="w-full bg-transparent border border-line/60 rounded px-4 py-3 text-ink placeholder-ink-faint text-sm font-body focus:border-ruby focus:outline-none transition-colors duration-300" />
                </div>
              ))}
              <div>
                <label htmlFor="message" className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint block mb-2">Message</label>
                <textarea id="message" rows={4} placeholder="Tell me about your interest in the GT3 RS..."
                  className="w-full bg-transparent border border-line/60 rounded px-4 py-3 text-ink placeholder-ink-faint text-sm font-body focus:border-ruby focus:outline-none transition-colors duration-300 resize-none" />
              </div>
              <button type="submit"
                className="magnetic w-full border border-ruby text-ruby font-mono-cap text-[11px] uppercase tracking-widest2 py-4 rounded hover:bg-ruby hover:text-void transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Submit Enquiry
              </button>
            </form>
          </Reveal>
        </div>

        <div className="hidden md:flex items-end justify-end px-16 lg:px-24 pb-16">
          <Reveal>
            <p className="font-mono-cap text-[10px] uppercase tracking-widest2 text-ink-faint text-right leading-relaxed">
              Princess Debra &middot; 2024<br />Fan-made tribute &middot; Portfolio project
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════ */
function Footer({ onMenuOpen }) {
  return (
    <footer className="px-6 md:px-16 lg:px-24 py-16 border-t border-line bg-void-deep">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
        <div>
          <p className="font-display text-4xl mb-4">Ruby Star</p>
          <p className="text-ink-dim text-sm max-w-sm leading-relaxed">
            A personal portfolio project built by <span className="text-ink">Princess Debra</span>. Designed and developed as an editorial exercise in restraint, colour, and motion.
          </p>
        </div>
        <nav className="font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-faint flex flex-col gap-3">
          <a href="#hero" className="hover:text-ruby transition-colors duration-300">Back to top</a>
          <button onClick={onMenuOpen} className="text-left hover:text-ruby transition-colors duration-300">All chapters</button>
          <a href="#" className="hover:text-ruby transition-colors duration-300">Portfolio</a>
        </nav>
      </div>
      <div className="border-t border-line pt-8 space-y-4">
        <p className="font-mono-cap text-[10px] uppercase tracking-wide text-ink-faint leading-relaxed max-w-3xl">
          {DISCLAIMER} Photography sourced from Pexels.com under the Pexels License (free for personal and commercial use, no attribution required). No Porsche logos, crest, or official marketing assets are used anywhere on this site.
        </p>
        <p className="font-mono-cap text-[10px] uppercase tracking-wide text-ink-faint">
          &copy; {new Date().getFullYear()} Princess Debra. Fan-made tribute project, portfolio use only.
        </p>
      </div>
    </footer>
  );
}
