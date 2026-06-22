/**
 * DriveSequence — cinematic canvas night drive.
 *
 * Pure canvas: no photo, no hybrid. The scene is fully drawn each frame.
 * Road markings scroll at speeds that ramp from city-crawl (0.15 cycles/s)
 * to GT3-RS-on-autobahn (4.2 cycles/s) using a smooth² acceleration curve.
 *
 * Visual layers (back to front):
 *   1. Deep-blue/black night sky with fading stars
 *   2. Warm amber horizon glow (distant city / dawn)
 *   3. Dark asphalt road with gradient verge
 *   4. Warm headlight cone illuminating the road surface
 *   5. Wet-road specular reflections (headlights on wet asphalt)
 *   6. Perspective road markings — white dashes + solid edge lines
 *   7. Roadside lamp posts with orange glow halos
 *   8. Speed streaks in peripheral vision
 *   9. Radial vignette (tightens at speed — tunnel-vision effect)
 *  10. Ruby progress bar
 *
 * Auto-completes in 10 s; scrolling adds up to 70 % speed boost.
 * On arrival: canvas fades out, transparent root reveals Hero below.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DURATION_MS = 10000;
const MAX_BOOST   = 0.70;
const DS          = 0.055; // dash length in t-space
const DG          = 0.040; // gap  length in t-space
const CYCLE_T     = DS + DG;

export default function DriveSequence({ onComplete }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    boost: 0, smooth: 0.55,
    startTime: null, lastTime: null,
    roadDist: 0,
    done: false, touchY: 0, raf: null,
  });

  /* Pre-generated stable datasets */
  const dataRef = useRef(null);

  const [hint,    setHint]    = useState(false);
  const [skip,    setSkip]    = useState(false);
  const [arrived, setArrived] = useState(false);

  const finish = useCallback(() => {
    const s = stateRef.current;
    if (s.done) return;
    s.done = true;
    document.body.style.overflow = "";
    window.scrollTo(0, 0);
    setArrived(true);
    setTimeout(() => onComplete?.(), 420);
  }, [onComplete]);

  useEffect(() => {
    if (window.innerWidth < 768) { onComplete?.(); return; }

    document.body.style.overflow = "hidden";
    const s      = stateRef.current;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    let W = 0, H = 0;
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      buildData();
    }

    /* Build stable per-canvas datasets */
    function buildData() {
      const stars = Array.from({ length: 200 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.85,
        r: 0.5 + Math.random() * 1.3,
        a: 0.15 + Math.random() * 0.7,
      }));
      const lamps = Array.from({ length: 12 }, (_, i) => ({
        t:    0.05 + i * 0.082,
        side: i % 2 === 0 ? -1 : 1,
        h:    0.48 + Math.random() * 0.2,
      }));
      const streaks = Array.from({ length: 40 }, (_, i) => ({
        xFrac: (i + 0.5) / 40,
        yFrac: 0.18 + (Math.sin(i * 2.1 + 1.3) * 0.5 + 0.5) * 0.58,
        len:   90 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 220,
        opa:   0.25 + (Math.sin(i * 2.7 + 0.9) * 0.5 + 0.5) * 0.75,
      }));
      dataRef.current = { stars, lamps, streaks };
    }
    resize();
    window.addEventListener("resize", resize);

    /* ── Main draw ── */
    function draw(p, roadDist) {
      if (!dataRef.current) return;
      const { stars, lamps, streaks } = dataRef.current;
      ctx.clearRect(0, 0, W, H);

      const HY = H * 0.44;   // horizon line
      const CX = W * 0.50;   // vanishing point x
      const rH = W * 0.034;  // road half-width at horizon
      const rN = W * 0.60;   // road half-width at near edge (wider = more immersive)

      const py = t => HY + (H - HY) * t;
      const px = t => rH + (rN - rH) * t;

      /* ── 1. Sky ── */
      const sky = ctx.createLinearGradient(0, 0, 0, HY + 10);
      sky.addColorStop(0,    "#030508");
      sky.addColorStop(0.55, "#050712");
      sky.addColorStop(1,    "#0b0d1c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HY + 10);

      /* ── 2. Stars — fade as speed builds ── */
      const starVis = Math.max(0, 1 - p * 2.8);
      if (starVis > 0) {
        stars.forEach(st => {
          ctx.beginPath();
          ctx.arc(st.x * W, st.y * HY, st.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${st.a * starVis})`;
          ctx.fill();
        });
      }

      /* ── 3. Horizon amber glow (city lights) ── */
      const hg = ctx.createLinearGradient(0, HY - 70, 0, HY + 15);
      hg.addColorStop(0,   "rgba(200,130,40,0)");
      hg.addColorStop(0.5, `rgba(210,140,45,${0.055 + p * 0.045})`);
      hg.addColorStop(1,   `rgba(160,100,28,${0.03 + p * 0.02})`);
      ctx.fillStyle = hg;
      ctx.fillRect(0, HY - 70, W, 85);

      /* ── 4. Road verge (dark) ── */
      ctx.fillStyle = "#040507";
      ctx.fillRect(0, HY, W, H - HY);

      /* ── 5. Road surface ── */
      const road = ctx.createLinearGradient(0, HY, 0, H);
      road.addColorStop(0,    "#0a0b10");
      road.addColorStop(0.18, "#0e0f14");
      road.addColorStop(0.6,  "#0c0d11");
      road.addColorStop(1,    "#090a0e");
      ctx.fillStyle = road;
      ctx.beginPath();
      ctx.moveTo(CX - rH, HY); ctx.lineTo(CX + rH, HY);
      ctx.lineTo(CX + rN, H);  ctx.lineTo(CX - rN, H);
      ctx.closePath();
      ctx.fill();

      /* ── 6. Headlight cone — warm amber on the tarmac ── */
      const cone = ctx.createRadialGradient(CX, H * 1.04, 0, CX, HY + 5, W * 0.42);
      cone.addColorStop(0,    `rgba(255,242,165,${0.24 + p * 0.14})`);
      cone.addColorStop(0.22, `rgba(248,218,90, ${0.10 + p * 0.08})`);
      cone.addColorStop(0.5,  `rgba(230,180,50, ${0.03 + p * 0.03})`);
      cone.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(CX - 20, H); ctx.lineTo(CX + 20, H);
      ctx.lineTo(CX + rH * 1.3, HY + 6);
      ctx.lineTo(CX - rH * 1.3, HY + 6);
      ctx.closePath();
      ctx.fill();

      /* ── 7. Wet-road specular reflections ── */
      for (let i = 0; i < 6; i++) {
        const t    = 0.06 + i * 0.15;
        const rx   = CX + Math.sin(i * 1.9 + roadDist * 2.5) * px(t) * 0.12;
        const ry   = py(t);
        const ew   = px(t) * 0.45;
        const eh   = ew * 0.22;
        const sAlp = Math.max(0, (0.22 - t * 0.14)) * (0.4 + p * 0.6);
        if (sAlp < 0.005) continue;
        const sg = ctx.createRadialGradient(rx, ry, 0, rx, ry, ew);
        sg.addColorStop(0, `rgba(255,240,155,${sAlp})`);
        sg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.ellipse(rx, ry, ew, eh, 0, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
      }

      /* ── 8. Road edge lines ── */
      [-1, 1].forEach(side => {
        const eg = ctx.createLinearGradient(0, HY, 0, H);
        eg.addColorStop(0,    "rgba(230,230,235,0)");
        eg.addColorStop(0.1,  "rgba(230,230,235,0.55)");
        eg.addColorStop(0.5,  "rgba(230,230,235,0.82)");
        eg.addColorStop(1,    "rgba(230,230,235,0.92)");
        ctx.strokeStyle = eg;
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const t = i / 60;
          i === 0
            ? ctx.moveTo(CX + side * px(t), py(t))
            : ctx.lineTo(CX + side * px(t), py(t));
        }
        ctx.stroke();
      });

      /* ── 9. Centre dashes — the key motion driver ── */
      const phase = roadDist % CYCLE_T;
      for (let i = -1; i < 32; i++) {
        let t0 = i * CYCLE_T - phase;
        let t1 = t0 + DS;
        if (t1 < 0.005 || t0 > 1.02) continue;
        t0 = Math.max(t0, 0.005);
        t1 = Math.min(t1, 1.02);
        const alpha = Math.min(1, (t0 - 0.002) * 32) * 0.96;
        /* At high speed, dashes appear to smear (longer) */
        const smear = 1 + p * 0.6;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth   = Math.max(1.2, px(t0) * 0.028);
        ctx.beginPath();
        ctx.moveTo(CX, py(t0));
        ctx.lineTo(CX, py(Math.min(t1 * smear, 1.02)));
        ctx.stroke();
      }

      /* ── 10. Lamp posts ── */
      lamps.forEach(lp => {
        const t = (lp.t + (roadDist * 0.6)) % 1;
        if (t < 0.015) return;
        const ry      = py(t);
        const roadX   = CX + lp.side * px(t);
        const postH   = (H - HY) * lp.h * t;
        const armW    = postH * 0.22;
        const a       = Math.min(1, t * 7) * 0.8;
        const lw      = Math.max(0.8, 2.5 * t);

        /* Post */
        ctx.strokeStyle = `rgba(30,32,36,${a})`;
        ctx.lineWidth   = lw;
        ctx.beginPath();
        const px0 = roadX + lp.side * px(t) * 0.04;
        ctx.moveTo(px0, ry);
        ctx.lineTo(px0, ry - postH);
        ctx.lineTo(px0 + lp.side * armW, ry - postH);
        ctx.stroke();

        /* Glow halo at lamp head */
        const lx = px0 + lp.side * armW;
        const ly = ry - postH;
        const hr = 32 * t;
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, hr);
        lg.addColorStop(0,   `rgba(255,168,55,${0.62 * a})`);
        lg.addColorStop(0.4, `rgba(255,140,38,${0.20 * a})`);
        lg.addColorStop(1,   "rgba(255,120,20,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(lx - hr, ly - hr, hr * 2, hr * 2);
      });

      /* ── 11. Speed streaks — peripheral motion blur ── */
      if (p > 0.05) {
        const sa    = Math.pow(Math.min((p - 0.22) / 0.50, 1), 1.2);
        const count = Math.floor(16 + sa * 30);
        for (let i = 0; i < count; i++) {
          if (i >= streaks.length) break;
          const st  = streaks[i];
          const x   = st.xFrac * W;
          const y   = st.yFrac * H;
          const len = st.len * (0.4 + sa * 0.6);
          const ang = (x - CX) / W;
          ctx.strokeStyle = `rgba(195,210,255,${sa * 0.10 * st.opa})`;
          ctx.lineWidth   = 0.4 + st.opa * 0.7;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + ang * len, y - len * 0.16);
          ctx.stroke();
        }
      }

      /* ── 12. Vignette — tightens at speed (tunnel vision) ── */
      const vigStrength = 0.65 + p * 0.22;
      const vig = ctx.createRadialGradient(CX, H * 0.54, H * 0.08, CX, H * 0.54, H * 0.82);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(0,0,0,${vigStrength})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      /* ── 13. Ruby progress bar ── */
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, H - 2, W, 2);
      ctx.fillStyle = "#e1006b";
      ctx.fillRect(0, H - 2, W * p, 2);
    }

    /* ── Input — only boosts speed ── */
    function normDelta(e) {
      if (e.deltaMode === 1) return Math.abs(e.deltaY) * 0.003;
      if (e.deltaMode === 2) return Math.abs(e.deltaY) * 0.06;
      return Math.abs(e.deltaY) * 0.00008;
    }
    function addBoost(amt) { s.boost = Math.min(s.boost + amt, MAX_BOOST); }
    function onWheel(e)      { e.preventDefault(); if (!s.done) addBoost(normDelta(e)); }
    function onTouchStart(e) { s.touchY = e.touches[0].clientY; }
    function onTouchMove(e) {
      e.preventDefault(); if (s.done) return;
      const dy = Math.abs(s.touchY - e.touches[0].clientY);
      s.touchY = e.touches[0].clientY;
      addBoost(dy * 0.0004);
    }
    function onKeyDown(e) {
      if (s.done) return;
      const b = { ArrowDown: 0.04, ArrowRight: 0.04, Space: 0.06, PageDown: 0.09 }[e.code];
      if (!b) return; e.preventDefault(); addBoost(b);
    }

    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("keydown",    onKeyDown);

    /* ── TIME-BASED render loop ── */
    function tick(timestamp) {
      s.raf = requestAnimationFrame(tick);

      if (!s.startTime) { s.startTime = timestamp; s.lastTime = timestamp; }
      const dt      = Math.min((timestamp - s.lastTime) / 1000, 0.05);
      s.lastTime    = timestamp;
      const timeP   = Math.min((timestamp - s.startTime) / DURATION_MS, 1);
      const targetP = Math.min(timeP + s.boost, 1);
      s.smooth     += (targetP - s.smooth) * 0.18;

      if (!s.done) {
        const sq = s.smooth * s.smooth;
        s.roadDist += dt * (4.5 + sq * 5.5) * CYCLE_T;
      }

      draw(s.smooth, s.roadDist);

      if (targetP >= 1 && !s.done) finish();
    }

    const hintTimer = setTimeout(() => setHint(true),  600);
    const skipTimer = setTimeout(() => setSkip(true), 1400);
    tick(performance.now());

    return () => {
      clearTimeout(hintTimer);
      clearTimeout(skipTimer);
      cancelAnimationFrame(s.raf);
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("keydown",    onKeyDown);
      window.removeEventListener("resize",     resize);
      document.body.style.overflow = "";
    };
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      style={{ background: arrived ? "transparent" : "#030508" }}
      exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } }}
    >
      <motion.canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        animate={{ opacity: arrived ? 0 : 1 }}
        transition={{ duration: 0.55, ease: "easeIn" }}
      />

      {/* Scroll hint */}
      <AnimatePresence>
        {hint && !arrived && (
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-px h-12 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <motion.div
                className="absolute left-0 w-full bg-ruby"
                animate={{ top: ["0%", "100%"], height: ["0%", "100%", "0%"] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="font-mono-cap text-[9px] uppercase tracking-widest2"
              style={{ color: "rgba(255,255,255,0.28)" }}>
              Scroll to accelerate
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      <AnimatePresence>
        {skip && !arrived && (
          <motion.button
            className="absolute bottom-8 right-8 font-mono-cap text-[10px] uppercase tracking-widest2 rounded-full px-7 py-3 hover:bg-ruby hover:border-ruby hover:text-void transition-all duration-300"
            style={{
              color:          "rgba(255,255,255,0.82)",
              border:         "1px solid rgba(255,255,255,0.38)",
              background:     "rgba(3,5,8,0.55)",
              backdropFilter: "blur(10px)",
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={finish}
          >
            Skip intro →
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chapter label */}
      <motion.p
        className="absolute top-8 left-8 md:left-16 font-mono-cap text-[9px] uppercase tracking-widest2 pointer-events-none"
        style={{ color: "rgba(255,255,255,0.2)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: arrived ? 0 : 1 }}
        transition={{ delay: arrived ? 0 : 0.7, duration: 1 }}
      >
        Ruby Star &middot; 00 Ignition
      </motion.p>
    </motion.div>
  );
}
