"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  /** How many coal lumps to spawn. ~18 feels "a pile dropped", not a storm. */
  count?: number;
  /** How many bright ember sparks ride along with the coal. */
  sparkCount?: number;
  /** Palette for the coal lumps. Dark charcoals with slight variation. */
  coalColors?: string[];
  /** Palette for the sparks. Hot orange-red by default. */
  sparkColors?: string[];
  className?: string;
};

type Lump = {
  i: number;
  color: string;
  leftPct: number;
  driftPx: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  /** Irregular corner radius for a more "chunk of coal" silhouette. */
  radii: string;
};

type Spark = {
  i: number;
  color: string;
  leftPct: number;
  driftPx: number;
  size: number;
  delay: number;
  duration: number;
};

/**
 * Coal + ember burst — the "you got it wrong" companion to <Confetti />.
 *
 * Design brief (from the user): Skarbnik is a mine spirit, so a wrong
 * answer should feel like coal tumbling down the shaft rather than a
 * generic red X. We render two layered particle streams:
 *
 *   1. Chunky dark lumps with irregular border-radii so they don't read
 *      as "squares painted black" — each one picks a 4-value radius so
 *      it looks hand-hewn.
 *   2. A smaller set of bright ember sparks (hot orange / accent-red)
 *      that drop alongside the coal. These sell the "something burning"
 *      read at a glance — without them the lumps alone look dull.
 *
 * Both streams use the same drop-from-top pattern as <Confetti /> so the
 * components feel paired in motion. Coal is slightly slower (heavier)
 * and has a stronger easeIn curve to sell the weight. All randomness is
 * generated in a mount effect (React 19 purity rule — see Confetti).
 */
export default function CoalBurst({
  count = 18,
  sparkCount = 14,
  coalColors = ["#12141C", "#1A1D28", "#22263A", "#0E0F16", "#2A2D3F"],
  sparkColors = ["#E0414B", "#F59E0B", "#FB923C", "#FACC15"],
  className = "",
}: Props) {
  const [lumps, setLumps] = useState<Lump[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    // Irregular radii per lump keeps them looking like mined rock rather
    // than soft pillows. Each radius is picked per-corner in a small range.
    const makeRadii = () => {
      const r = () => 15 + Math.random() * 55; // 15–70%
      return `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`;
    };

    const nextLumps: Lump[] = Array.from({ length: count }, (_, i) => ({
      i,
      color: coalColors[i % coalColors.length],
      leftPct: Math.random() * 100,
      driftPx: (Math.random() - 0.5) * 140, // tighter drift than confetti
      size: 10 + Math.random() * 14, // 10–24px — chunkier than confetti
      delay: Math.random() * 0.25,
      duration: 1.6 + Math.random() * 1.0, // ~1.6–2.6s; heavier feel
      rotate: Math.random() * 540 - 270,
      radii: makeRadii(),
    }));

    const nextSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
      i,
      color: sparkColors[i % sparkColors.length],
      leftPct: Math.random() * 100,
      driftPx: (Math.random() - 0.5) * 180,
      size: 3 + Math.random() * 4, // 3–7px tiny embers
      delay: Math.random() * 0.4,
      duration: 1.0 + Math.random() * 0.9,
    }));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLumps(nextLumps);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSparks(nextSparks);
  }, [count, sparkCount, coalColors, sparkColors]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Coal lumps */}
      {lumps.map((p) => (
        <motion.span
          key={`coal-${p.i}`}
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
            times: [0, 0.08, 0.85, 1],
          }}
          style={{
            position: "absolute",
            left: `${p.leftPct}%`,
            top: 0,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle at 35% 30%, ${p.color}, #06070C)`,
            borderRadius: p.radii,
            // Subtle ember glow + inner highlight so the lump has depth.
            boxShadow: `0 0 8px rgba(224, 65, 75, 0.35), inset 0 -2px 3px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255, 140, 80, 0.15)`,
          }}
        />
      ))}

      {/* Ember sparks — hot pinpoints with a bright halo */}
      {sparks.map((s) => (
        <motion.span
          key={`spark-${s.i}`}
          initial={{ y: "-5vh", x: 0, opacity: 0 }}
          animate={{
            y: "110vh",
            x: s.driftPx,
            opacity: [0, 1, 0.9, 0],
          }}
          transition={{
            delay: s.delay,
            duration: s.duration,
            ease: "easeIn",
            times: [0, 0.1, 0.7, 1],
          }}
          style={{
            position: "absolute",
            left: `${s.leftPct}%`,
            top: 0,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: s.color,
            boxShadow: `0 0 8px ${s.color}, 0 0 16px ${s.color}99`,
          }}
        />
      ))}
    </div>
  );
}
