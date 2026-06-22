import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const [visible, setVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const x = useSpring(rawX, { stiffness: 500, damping: 40, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    const onMove = (e) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onOver = (e) => {
      setIsPointer(
        !!e.target.closest("a, button, [role=button], input, textarea, select, label")
      );
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [visible, rawX, rawY]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
      style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ opacity: { duration: 0.3 } }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full border border-ruby/60"
        animate={{
          width: isPointer ? 52 : 32,
          height: isPointer ? 52 : 32,
          backgroundColor: isPointer ? "rgba(225,0,107,0.08)" : "transparent",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      {/* Inner dot */}
      <motion.div
        className="rounded-full bg-ruby"
        animate={{
          width: isPointer ? 3 : 5,
          height: isPointer ? 3 : 5,
          opacity: isPointer ? 0.5 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </motion.div>
  );
}
