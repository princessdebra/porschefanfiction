import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Word-by-word slide-up reveal.
 *
 * Uses useInView on the CONTAINER (which has a real bounding rect) and drives
 * each word's animation with `animate`, not `whileInView`. This avoids the
 * Framer Motion / IntersectionObserver bug where a transform-offset element
 * (y:115%) is never detected as entering the viewport because its bounding
 * box is already below the clip area.
 */
export default function TextReveal({
  children,
  delay = 0,
  wordDelay = 0.06,
  duration = 0.9,
  className = "",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const words = String(children).split(" ").filter(Boolean);

  return (
    <span ref={ref} className={className} aria-label={String(children)}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden"
          style={{ paddingBottom: "0.12em", marginBottom: "-0.12em", verticalAlign: "bottom" }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={
              isInView
                ? { y: 0, opacity: 1 }
                : { y: "110%", opacity: 0 }
            }
            transition={{
              duration,
              delay: isInView ? delay + i * wordDelay : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
