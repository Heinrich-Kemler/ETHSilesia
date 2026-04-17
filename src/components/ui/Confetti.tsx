"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  /** How many particles to spawn. Keep modest for perf (~40 is plenty). */
  count?: number;
  /** Palette — particles cycle through these colours. */
  colors?: string[];
  /** Pointer events are off by default so clicks pass through. */
  className?: string;
};

type Particle = {
  i: number;
  color: string;
  leftPct: number;
  driftPx: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  shape: "square" | "rect";
};

/**
 * Lightweight confetti: absolutely positioned <span>s animated with
 * framer-motion. Drops from the top, drifts horizontally with a random
 * offset, and fades out. Cheaper than <canvas> for a quick celebration.
 *
 * Randomness is generated inside a mount effect (not during render) so
 * this component stays compatible with React 19's purity rule. First
 * paint is empty for a single tick — that frame is invisible anyway
 * because the particles animate from `y: -10vh`.
 */
export default function Confetti({
  count = 40,
  colors = ["#f59e0b", "#10b981", "#06b6d4", "#a855f7", "#ef4444", "#f9d71c"],
  className = "",
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Math.random in an effect is fine — it is not a derived render
    // value and only runs once per mount.
    const next: Particle[] = Array.from({ length: count }, (_, i) => ({
      i,
      color: colors[i % colors.length],
      leftPct: Math.random() * 100, // 0–100% from left
      driftPx: (Math.random() - 0.5) * 200, // left/right drift
      size: 6 + Math.random() * 8, // 6–14 px squares
      delay: Math.random() * 0.3,
      duration: 1.4 + Math.random() * 1.2,
      rotate: Math.random() * 720 - 360, // spin direction + speed
      shape: Math.random() > 0.5 ? "square" : "rect",
    }));
    // The rule flags setState-in-effect because derivable state should
    // live in render. Here, randomness is intentionally non-derivable —
    // generating once per mount is the contract of this one-shot
    // visual component. Using useEffect keeps render pure.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(next);
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
