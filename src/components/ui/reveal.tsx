"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Fades its children into view once, as they scroll onto the screen. Distances used on the
 * reference site: labels and headings 10px, buttons 20px, cards and content blocks 40px
 * (the default), list rows 20px, and the review slides in from the side (x 60px).
 */
export function Reveal({
  children,
  delay = 0,
  y = 40,
  x = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, x, y: x ? 0 : y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
