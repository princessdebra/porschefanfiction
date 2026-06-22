import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Accessible lightbox: traps focus, closes on Escape,
 * navigates with Arrow Left / Right, restores focus to the
 * trigger element on close.
 */
export default function Lightbox({ images, activeIndex, onClose, onNavigate }) {
  const dialogRef = useRef(null);
  const isOpen = activeIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        onNavigate((activeIndex + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        onNavigate((activeIndex - 1 + images.length) % images.length);
      } else if (e.key === "Tab") {
        // Simple focus trap within the dialog
        e.preventDefault();
        dialogRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen, activeIndex, images.length, onClose, onNavigate]);

  if (!isOpen) return null;
  const current = images[activeIndex];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/95 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${activeIndex + 1} of ${images.length}: ${current.alt}`}
          tabIndex={-1}
          className="relative max-w-5xl w-full outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative aspect-[16/10] w-full overflow-hidden bg-void-deep"
          >
            <img
              src={current.src}
              alt={current.alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </motion.div>

          <div className="mt-4 flex items-center justify-between font-mono-cap text-[11px] uppercase tracking-widest2 text-ink-dim">
            <span>
              {String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </span>
            <span className="hidden sm:inline">{current.caption}</span>
            <button
              onClick={onClose}
              className="text-ink-dim hover:text-ruby transition-colors duration-300"
              aria-label="Close image viewer"
            >
              Close ✕
            </button>
          </div>

          <button
            onClick={() => onNavigate((activeIndex - 1 + images.length) % images.length)}
            aria-label="Previous image"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 hidden md:flex items-center justify-center w-10 h-10 text-ink-dim hover:text-ruby transition-colors duration-300"
          >
            ←
          </button>
          <button
            onClick={() => onNavigate((activeIndex + 1) % images.length)}
            aria-label="Next image"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 hidden md:flex items-center justify-center w-10 h-10 text-ink-dim hover:text-ruby transition-colors duration-300"
          >
            →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
