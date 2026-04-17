"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

type Props = {
  /** How many particles to spawn. Keep modest for perf (~40 is plenty). */
  count?: number;
  /** Palette — particles cycle through these colours. */
  colors?: string[];
  /** Pointer events are off by default so clicks pass through. */
  className?: string;
};

/**
 * Lightweight confetti: absolutely positioned <span>s animated with
 * framer-motion. Drops from the top, drifts horizontally with a random
 * offset, and fades out. Cheaper than <canvas> for a quick celebration.
 */
export default function Confetti({
  count = 40,
  colors = ["#f59e0b", "#10b981", "#06b6d4", "#a855f7", "#ef4444", "#f9d71c"],
  className = "",
}: Props) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const color = colors[i % colors.length];
      const leftPct = Math.random() * 100; // 0–100% from left
      const driftPx = (Math.random() - 0.5) * 200; // left/right drift
      const size = 6 + Math.random() * 8; // 6–14 px squares
      const delay = Math.random() * 0.3;
      const duration = 1.4 + Math.random() * 1.2;
      const rotate = Math.random() * 720 - 360; // spin direction + speed
      const shape: "square" | "rect" = Math.random() > 0.5 ? "square" : "rect";
      return {
        i,
        color,
        leftPct,
        driftPx,
        size,
        delay,
        duration,
        rotate,
        shape,
      };
    });
  }, [count, colors]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {particles.map((p) => (
        <motion.span
          key={p.i}
          initial={{ y: "-10vh", x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            x: p.driftPx,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            ease: "easeIn",
            times: [0, 0.1, 0.85, 1],
          }}
          style={{
            position: "absolute",
            left: `${p.leftPct}%`,
            top: 0,
            width: p.shape === "square" ? p.size : p.size * 0.4,
            height: p.size,
            background: p.color,
            borderRadius: 2,
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}
