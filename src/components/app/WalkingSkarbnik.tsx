"use client";

/**
 * WalkingSkarbnik — an ambient mascot that strolls across the
 * bottom of the screen on the quest hub. Low-distraction: small
 * size, low opacity, slow loop. The user can dismiss him by
 * clicking and he won't reappear until a reload.
 *
 * Implementation:
 *   - position: fixed, left/right pinned so he's always "off-map".
 *   - uses a single framer-motion sweep (left → right → left)
 *     driven by a CSS transform so it's cheap to run.
 *   - a tiny sinusoidal bob simulates a walking gait.
 *   - flips horizontal scale at each endpoint so he's always
 *     facing his travel direction.
 *
 * We reuse the existing `SkarbnikMascot` SVG rather than porting
 * the design-lab mascot because it already ships the lantern-glow
 * aesthetic the retheme is leaning into.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SkarbnikMascot from "@/components/ui/SkarbnikMascot";
import type { Theme } from "@/lib/useTheme";

const WALK_DURATION_S = 28; // seconds for a full left→right→left cycle

export default function WalkingSkarbnik({
  theme,
  size = 72,
}: {
  theme: Theme;
  size?: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Client-only mount avoids SSR hydration mismatches from the
  // framer-motion animation timestamp and keeps the mascot out of
  // the initial HTML (he's decorative, not content).
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;

  return (
    <motion.button
      type="button"
      onClick={() => setDismissed(true)}
      aria-label="Skarbnik — przewodnik"
      title="Skarbnik patroluje kopalnię"
      className="walker"
      initial={{ x: "-10vw" }}
      animate={{
        // Walk from just off-screen-left to just off-screen-right,
        // then back. scaleX toggles flip him to face his travel dir.
        x: ["-10vw", "92vw", "-10vw"],
        scaleX: [1, 1, -1, -1, 1],
      }}
      transition={{
        duration: WALK_DURATION_S,
        ease: "linear",
        repeat: Infinity,
        times: [0, 0.49, 0.51, 0.99, 1],
      }}
      style={{
        position: "fixed",
        bottom: 20,
        left: 0,
        zIndex: 30,
        width: size,
        height: size,
        border: 0,
        background: "transparent",
        cursor: "pointer",
        opacity: 0.85,
        filter:
          theme === "dark"
            ? "drop-shadow(0 6px 14px rgba(201,168,76,0.2))"
            : "drop-shadow(0 6px 14px rgba(0,0,0,0.1))",
        // Don't steal pointer events from the real UI; he's a
        // small click target but shouldn't block text selection.
        pointerEvents: "auto",
      }}
    >
      {/* Bob — a second motion wrapper so the vertical wobble is
          independent of the horizontal sweep. Framer composes them
          as a single transform. */}
      <motion.div
        animate={{ y: [0, -4, 0, -4, 0] }}
        transition={{
          duration: 0.7,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <SkarbnikMascot size={size} theme={theme} />
      </motion.div>

      {/* Footstep puff — a tiny dust circle that pulses in sync
          with the bob so he feels like he's planting each step. */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0, 0.35, 0], scale: [0.6, 1.4, 1.8] }}
        transition={{ duration: 0.7, ease: "easeOut", repeat: Infinity }}
        style={{
          position: "absolute",
          bottom: -4,
          left: "50%",
          transform: "translateX(-50%)",
          width: 18,
          height: 4,
          borderRadius: "50%",
          background: "var(--gold)",
          filter: "blur(3px)",
        }}
      />
    </motion.button>
  );
}
