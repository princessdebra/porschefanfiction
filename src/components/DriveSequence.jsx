/**
 * DriveSequence — Engine Awakens ignition + cinematic POV night drive.
 *
 * Phase 0 · IGNITION  (0 → 3.8 s)
 *   Pure black · "PORSCHE" wordmark · dashboard warning lights flash and
 *   extinguish · "Ignition Sequence..." · VROOOM · dissolves into the drive.
 *
 * Phase 1 · DRIVE  (until scroll completes or auto-completes in ~11 s)
 *   Real cinematic POV footage — a 911-eye-view night drive down a
 *   city highway (Pexels stock, hotlinked). Layered on top:
 *     — cinematic letterbox + side/bottom gradients (windshield framing)
 *     — film grain + tightening vignette
 *     — ruby instrument-cluster glow rising from the dash
 *     — minimal premium HUD: live speed, RPM bar, gear, drive mode
 *     — Web Audio engine that pitches up with scroll
 *   Scrolling literally accelerates the footage: video.playbackRate,
 *   engine pitch and the speedometer all ramp together — the page drives.
 *
 * Mobile: skipped entirely.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── constants ─────────────────────────────────────────── */
const DRIVE_MS  = 11_000;
const MAX_BOOST = 0.70;
const TOP_SPEED = 296;       // km/h shown at full progress
const REDLINE   = 9000;      // rpm shown at full progress

/* Real POV night-drive footage (Pexels Free License, hotlinkable) */
const VIDEO_1080 = "https://videos.pexels.com/video-files/15270404/15270404-hd_1920_1080_60fps.mp4";
const VIDEO_720  = "https://videos.pexels.com/video-files/15270404/15270404-hd_1280_720_60fps.mp4";

/* ─── ignition warning-light definitions ─────────────────── */
const DASH_LIGHTS = [
  { color: "#E1006B", label: "SPORT+" },
  { color: "#22C55E", label: "SYS"    },
  { color: "#F59E0B", label: "TPMS"   },
  { color: "#3B82F6", label: "TCS"    },
  { color: "#A78BFA", label: "PDK"    },
  { color: "#22C55E", label: "PSM"    },
];

/* ─── Web Audio engine synthesiser ──────────────────────── */
function makeEngine() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const fund  = ctx.createOscillator(); fund.type  = "sawtooth"; fund.frequency.value  = 50;
    const sub   = ctx.createOscillator(); sub.type   = "square";   sub.frequency.value   = 25;
    const upper = ctx.createOscillator(); upper.type = "sawtooth"; upper.frequency.value = 100;

    const lfo    = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 14;
    const lfoAmp = ctx.createGain(); lfoAmp.gain.value = 100;
    lfo.connect(lfoAmp);

    const dist  = ctx.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (2 * i) / 512 - 1;
      curve[i] = (Math.PI + 40) * x / (Math.PI + 40 * Math.abs(x));
    }
    dist.curve = curve;
    dist.oversample = "4x";

    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass"; bpf.frequency.value = 320; bpf.Q.value = 2.0;
    lfoAmp.connect(bpf.frequency);

    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass"; lpf.frequency.value = 1600; lpf.Q.value = 0.7;

    const gF = ctx.createGain(); gF.gain.value = 0.55;
    const gS = ctx.createGain(); gS.gain.value = 0.25;
    const gU = ctx.createGain(); gU.gain.value = 0.20;
    const master = ctx.createGain(); master.gain.value = 0;

    fund.connect(gF);  gF.connect(dist);
    sub.connect(gS);   gS.connect(dist);
    upper.connect(gU); gU.connect(dist);
    dist.connect(lpf); lpf.connect(bpf); bpf.connect(master);
    master.connect(ctx.destination);
    fund.start(); sub.start(); upper.start(); lfo.start();

    return {
      ctx, master, _fund: fund, _sub: sub, _upper: upper, _lfo: lfo,
      resume() { ctx.resume().catch(() => {}); },
      setProgress(p) {
        const now  = ctx.currentTime;
        const base = 50 + Math.pow(p, 0.65) * 420;
        fund.frequency.setTargetAtTime(base,      now, 0.06);
        sub.frequency.setTargetAtTime(base / 2,   now, 0.06);
        upper.frequency.setTargetAtTime(base * 2, now, 0.06);
        lfo.frequency.setTargetAtTime(8 + p * 55, now, 0.08);
        lpf.frequency.setTargetAtTime(800 + p * 2600, now, 0.10);
        bpf.frequency.setTargetAtTime(220 + p * 720,  now, 0.10);
        master.gain.setTargetAtTime(0.05 + p * 0.11, now, 0.08);
      },
      vroom() {
        ctx.resume().then(() => {
          const now = ctx.currentTime;
          fund.frequency.setValueAtTime(95, now);
          fund.frequency.exponentialRampToValueAtTime(520, now + 0.26);
          fund.frequency.exponentialRampToValueAtTime(115, now + 0.60);
          sub.frequency.setValueAtTime(47,  now);
          sub.frequency.exponentialRampToValueAtTime(260, now + 0.26);
          sub.frequency.exponentialRampToValueAtTime(57,  now + 0.60);
          upper.frequency.setValueAtTime(190, now);
          upper.frequency.exponentialRampToValueAtTime(1040, now + 0.26);
          upper.frequency.exponentialRampToValueAtTime(230,  now + 0.60);
          master.gain.setValueAtTime(0.24, now);
          master.gain.linearRampToValueAtTime(0.06, now + 0.85);
        }).catch(() => {});
      },
      stop() {
        const now = ctx.currentTime;
        master.gain.setTargetAtTime(0, now, 0.22);
        setTimeout(() => { try { ctx.close(); } catch (_) {} }, 800);
      },
    };
  } catch (_) { return null; }
}

/* ─── component ─────────────────────────────────────────── */
export default function DriveSequence({ onComplete }) {
  const [isMobile] = useState(() => window.innerWidth < 768);

  const [phase,     setPhase]     = useState("ignition");
  const [step,      setStep]      = useState(0);
  const [hint,      setHint]      = useState(false);
  const [skip,      setSkip]      = useState(false);
  const [arrived,   setArrived]   = useState(false);

  const videoRef  = useRef(null);
  const engineRef = useRef(null);

  /* Live HUD value nodes — updated directly to avoid per-frame re-renders */
  const speedRef = useRef(null);
  const rpmRef   = useRef(null);
  const rpmBarRef= useRef(null);
  const gearRef  = useRef(null);
  const modeRef  = useRef(null);
  const progRef  = useRef(null);

  const stateRef = useRef({
    boost: 0, smooth: 0,
    startTime: null, lastTime: null,
    done: false, touchY: 0, raf: null,
  });

  /* ── finish ──────────────────────────────────────────── */
  const finish = useCallback(() => {
    const s = stateRef.current;
    if (s.done) return;
    s.done = true;
    document.body.style.overflow = "";
    window.scrollTo(0, 0);
    engineRef.current?.stop();
    setArrived(true);
    setTimeout(() => onComplete?.(), 560);
  }, [onComplete]);

  /* ── mobile skip ─────────────────────────────────────── */
  useEffect(() => {
    if (isMobile) onComplete?.();
  }, []); // eslint-disable-line

  /* ── ignition beats ──────────────────────────────────── */
  useEffect(() => {
    if (isMobile || phase !== "ignition") return;
    const t1 = setTimeout(() => {
      if (!engineRef.current) engineRef.current = makeEngine();
      setStep(1);
    }, 600);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => { setStep(3); engineRef.current?.vroom(); }, 2350);
    const t4 = setTimeout(() => { setStep(4); setPhase("drive"); }, 3750);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [isMobile, phase]);

  /* ── drive loop ──────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "drive" || isMobile) return;

    document.body.style.overflow = "hidden";
    const s   = stateRef.current;
    const vid = videoRef.current;
    if (vid) { vid.play?.().catch(() => {}); }

    /* ── input ── */
    function normDelta(e) {
      if (e.deltaMode === 1) return Math.abs(e.deltaY) * 0.003;
      if (e.deltaMode === 2) return Math.abs(e.deltaY) * 0.06;
      return Math.abs(e.deltaY) * 0.00008;
    }
    function addBoost(amt) { s.boost = Math.min(s.boost + amt, MAX_BOOST); }
    function onWheel(e) {
      e.preventDefault();
      if (!s.done) { engineRef.current?.resume(); addBoost(normDelta(e)); }
    }
    function onTouchStart(e) { s.touchY = e.touches[0].clientY; }
    function onTouchMove(e) {
      e.preventDefault();
      if (s.done) return;
      const dy = Math.abs(s.touchY - e.touches[0].clientY);
      s.touchY = e.touches[0].clientY;
      addBoost(dy * 0.0004);
    }
    function onKeyDown(e) {
      if (s.done) return;
      const b = { ArrowDown: 0.04, ArrowRight: 0.04, Space: 0.06, PageDown: 0.09 }[e.code];
      if (!b) return;
      e.preventDefault();
      addBoost(b);
    }
    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true  });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("keydown",    onKeyDown);

    /* ── render loop — drives video rate + HUD + audio ── */
    let lastDom = 0;
    function tick(ts) {
      s.raf = requestAnimationFrame(tick);
      if (!s.startTime) { s.startTime = ts; s.lastTime = ts; }
      s.lastTime  = ts;
      const timeP = Math.min((ts - s.startTime) / DRIVE_MS, 1);
      const tgtP  = Math.min(timeP + s.boost, 1);
      s.smooth   += (tgtP - s.smooth) * 0.10;
      const p     = s.smooth;

      if (!s.done) {
        /* Footage accelerates with scroll: 0.5× idle → 2.6× flat-out */
        if (vid && vid.readyState >= 2) {
          const rate = 0.5 + p * 2.1;
          if (Math.abs(vid.playbackRate - rate) > 0.02) {
            try { vid.playbackRate = rate; } catch (_) {}
          }
        }
        engineRef.current?.setProgress(p);

        /* HUD — update ~20×/s via direct DOM writes (no re-render) */
        if (ts - lastDom > 50) {
          lastDom = ts;
          const speed = Math.round(p * TOP_SPEED);
          const rpm   = Math.round(1200 + p * (REDLINE - 1200));
          const gear  = p < 0.10 ? 1 : p < 0.22 ? 2 : p < 0.36 ? 3
                      : p < 0.52 ? 4 : p < 0.70 ? 5 : p < 0.88 ? 6 : 7;
          const mode  = p < 0.28 ? "SPORT" : "SPORT+";
          if (speedRef.current) speedRef.current.textContent = speed;
          if (rpmRef.current)   rpmRef.current.textContent   = rpm.toLocaleString();
          if (rpmBarRef.current)rpmBarRef.current.style.transform = `scaleX(${p})`;
          if (gearRef.current)  gearRef.current.textContent  = gear;
          if (modeRef.current)  modeRef.current.textContent  = mode;
          if (progRef.current)  progRef.current.style.transform = `scaleX(${tgtP})`;
        }
      }

      if (tgtP >= 1 && !s.done) finish();
    }

    const hintTimer = setTimeout(() => setHint(true),  700);
    const skipTimer = setTimeout(() => setSkip(true), 1600);
    s.raf = requestAnimationFrame(tick);

    return () => {
      clearTimeout(hintTimer); clearTimeout(skipTimer);
      cancelAnimationFrame(s.raf);
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("keydown",    onKeyDown);
      document.body.style.overflow = "";
    };
  }, [phase, finish, isMobile]);

  if (isMobile) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
      style={{ background: "#030508" }}
      exit={{ opacity: 0, transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* ── REAL POV FOOTAGE ── */}
      <motion.video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay muted loop playsInline preload="auto"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{
          opacity: phase === "drive" && !arrived ? 1 : 0,
          scale:   phase === "drive" ? 1 : 1.08,
        }}
        transition={{
          opacity: { duration: phase === "drive" ? 1.0 : 0.55, ease: [0.16, 1, 0.3, 1] },
          scale:   { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <source src={VIDEO_1080} type="video/mp4" />
        <source src={VIDEO_720}  type="video/mp4" />
      </motion.video>

      {/* ── Cinematic colour grade + framing (over video) ── */}
      <AnimatePresence>
        {phase === "drive" && !arrived && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.3 }}
          >
            {/* Cool night grade + ruby cast */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(3,6,18,0.55) 0%, rgba(3,5,12,0.10) 38%, rgba(3,5,12,0.18) 62%, rgba(3,4,10,0.85) 100%)",
              }}
            />
            {/* Side A-pillar darkening (windshield frame) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(0,0,0,0.78) 100%)",
              }}
            />
            {/* Tightening radial vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 65% at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.72) 100%)",
              }}
            />
            {/* Ruby instrument-cluster glow from below */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/3"
              style={{
                background:
                  "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(225,0,107,0.16) 0%, rgba(225,0,107,0.04) 45%, rgba(0,0,0,0) 75%)",
              }}
            />
            {/* Film grain */}
            <div className="grain absolute inset-0 opacity-60" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PREMIUM HUD ── */}
      <AnimatePresence>
        {phase === "drive" && !arrived && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 pointer-events-none"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-end justify-center gap-0 pb-9">

              {/* Speed */}
              <div className="flex flex-col items-center px-7 md:px-11 border-r border-white/10">
                <span
                  ref={speedRef}
                  className="font-display leading-none text-ink tabular-nums"
                  style={{ fontSize: "clamp(2.4rem,5.5vw,4.5rem)", fontVariantNumeric: "tabular-nums" }}
                >0</span>
                <span className="font-mono-cap uppercase tracking-widest2 text-ink-faint mt-2"
                  style={{ fontSize: "0.5rem" }}>km/h</span>
              </div>

              {/* RPM + redline bar */}
              <div className="flex flex-col items-center px-7 md:px-11 border-r border-white/10">
                <span
                  ref={rpmRef}
                  className="font-display leading-none text-ruby tabular-nums"
                  style={{ fontSize: "clamp(2.4rem,5.5vw,4.5rem)", fontVariantNumeric: "tabular-nums" }}
                >1,200</span>
                <div className="w-24 h-[2px] bg-white/12 mt-3 overflow-hidden">
                  <div
                    ref={rpmBarRef}
                    className="h-full bg-ruby origin-left"
                    style={{ transform: "scaleX(0)" }}
                  />
                </div>
                <span className="font-mono-cap uppercase tracking-widest2 text-ink-faint mt-2"
                  style={{ fontSize: "0.5rem" }}>RPM</span>
              </div>

              {/* Gear */}
              <div className="flex flex-col items-center px-7 md:px-11 border-r border-white/10">
                <span
                  ref={gearRef}
                  className="font-display leading-none text-ink tabular-nums"
                  style={{ fontSize: "clamp(2.4rem,5.5vw,4.5rem)" }}
                >1</span>
                <span className="font-mono-cap uppercase tracking-widest2 text-ink-faint mt-2"
                  style={{ fontSize: "0.5rem" }}>Gear</span>
              </div>

              {/* Mode */}
              <div className="flex flex-col items-center px-7 md:px-11">
                <span
                  ref={modeRef}
                  className="font-mono-cap tracking-widest2 text-ruby leading-none"
                  style={{ fontSize: "clamp(0.8rem,1.5vw,1.1rem)" }}
                >SPORT</span>
                <span className="font-mono-cap uppercase tracking-widest2 text-ink-faint mt-3"
                  style={{ fontSize: "0.5rem" }}>Mode</span>
              </div>
            </div>

            {/* Progress line */}
            <div className="h-[2px] w-full bg-white/8">
              <div
                ref={progRef}
                className="h-full bg-ruby origin-left"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IGNITION OVERLAY ── */}
      <AnimatePresence>
        {phase === "ignition" && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#030508]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } }}
          >
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono-cap uppercase"
                style={{ fontSize: "0.58rem", letterSpacing: "0.82em", color: "rgba(244,239,232,0.36)" }}>
                PORSCHE
              </p>
              <motion.div
                className="mx-auto mt-5 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent"
                initial={{ width: 0 }}
                animate={{ width: "9rem" }}
                transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.div>

            <AnimatePresence>
              {step >= 1 && (
                <motion.div className="flex gap-5 mb-12"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  {DASH_LIGHTS.map((light, i) => (
                    <motion.div key={light.label} className="flex flex-col items-center gap-1.5"
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.22 }}>
                      <motion.div className="w-[5px] h-[5px] rounded-full"
                        style={{ backgroundColor: light.color }}
                        animate={{ opacity: [1, 0.08, 1, 0.15, 0.9, 0] }}
                        transition={{ duration: 0.85, delay: i * 0.065, times: [0, 0.22, 0.44, 0.62, 0.80, 1], ease: "linear" }}
                      />
                      <p className="font-mono-cap uppercase"
                        style={{ fontSize: "0.38rem", letterSpacing: "0.16em", color: `${light.color}55` }}>
                        {light.label}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {step >= 2 && (
                <motion.p className="font-mono-cap uppercase mb-9"
                  style={{ fontSize: "0.55rem", letterSpacing: "0.40em", color: "rgba(244,239,232,0.24)" }}
                  initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.55 }}>
                  Ignition Sequence...
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {step >= 3 && (
                <motion.p className="font-display italic select-none"
                  style={{ fontSize: "clamp(4rem, 14vw, 11rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
                  initial={{ opacity: 0, scale: 0.80, y: 14 }}
                  animate={{ opacity: [0, 1, 0.90], scale: [0.80, 1.08, 1.01], y: 0 }}
                  transition={{ duration: 0.50, times: [0, 0.36, 1], ease: [0.16, 1, 0.3, 1] }}>
                  <span style={{ color: "rgba(244,239,232,0.82)" }}>VR</span>
                  <span className="text-ruby">OO</span>
                  <span style={{ color: "rgba(244,239,232,0.82)" }}>OM</span>
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scroll hint ── */}
      <AnimatePresence>
        {hint && phase === "drive" && !arrived && (
          <motion.div
            className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none z-20"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.75 }}>
            <div className="w-px h-12 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.16)" }}>
              <motion.div className="absolute left-0 w-full bg-ruby"
                animate={{ top: ["0%", "100%"], height: ["0%", "100%", "0%"] }}
                transition={{ duration: 1.75, repeat: Infinity, ease: "easeInOut" }} />
            </div>
            <p className="font-mono-cap text-[9px] uppercase tracking-widest2"
              style={{ color: "rgba(255,255,255,0.38)" }}>
              Scroll to accelerate
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Skip ── */}
      <AnimatePresence>
        {!arrived && (phase === "ignition" || skip) && (
          <motion.button
            className="absolute bottom-8 right-8 z-30 font-mono-cap text-[10px] uppercase tracking-widest2 rounded-full px-7 py-3 hover:bg-ruby hover:border-ruby hover:text-void transition-all duration-300"
            style={{
              color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.32)",
              background: "rgba(3,5,8,0.55)", backdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            onClick={() => { engineRef.current?.resume(); finish(); }}>
            Skip intro →
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chapter label ── */}
      <motion.p
        className="absolute top-8 left-8 md:left-16 z-30 font-mono-cap text-[9px] uppercase tracking-widest2 pointer-events-none"
        style={{ color: "rgba(255,255,255,0.40)" }}
        initial={{ opacity: 0 }} animate={{ opacity: arrived ? 0 : 1 }}
        transition={{ delay: arrived ? 0 : 0.8, duration: 1.0 }}>
        Ruby Star &middot; 00 Ignition
      </motion.p>
    </motion.div>
  );
}
