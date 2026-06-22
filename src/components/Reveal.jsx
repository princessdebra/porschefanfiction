import React from "react";
import { motion } from "framer-motion";

/**
 * Slow, restrained fade + rise on scroll into view. Used throughout
 * to keep motion consistent, quiet, and non-distracting.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
  as: Component = motion.div,
}) {
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
