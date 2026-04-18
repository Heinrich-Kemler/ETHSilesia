"use client";

/**
 * Animated Silesia-miner mascot that travels the chapter path.
 *
 * Behaviour:
 *   - Finds every `[data-quest-node]` bubble rendered by <ChapterPath>.
 *   - Draws a glowing polyline through the *completed* nodes + the
 *     current (first-unfinished) node — so the path of progress is
 *     literally drawn as the player progresses.
 *   - Positions the miner sprite at the current node and keeps him
 *     bouncing with a subtle bob + pickaxe swing while he "waits".
 *   - When a new quest completes, React re-renders with the new
 *     `currentQuestId`; Framer's `layout` prop animates the miner
 *     walking to the next bubble.
 *
 * Positioning strategy:
 *   We measure bubbles relative to the parent `.chapter-path` box via
 *   `getBoundingClientRect`. A ResizeObserver re-measures when the
 *   column resizes (mobile rotation, zoom, side nav opens, etc.) so
 *   the polyline stays glued to the bubbles.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { QUESTS } from "@/lib/quests";

type Point = { x: number; y: number };

type Props = {
  currentQuestId: string;
  completedQuests: string[];
};

export default function SkarbnikMiner({
  currentQuestId,
  completedQuests,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [points, setPoints] = useState<Record<string, Point>>({});

  // Recompute node centers. Runs on mount, on every completedQuests
  // change, and whenever the parent resizes.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    function measure() {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
      const next: Record<string, Point> = {};
      const nodes = parent.querySelectorAll<HTMLElement>("[data-quest-node]");
      nodes.forEach((node) => {
        const id = node.dataset.questNode;
        if (!id) return;
        const nodeRect = node.getBoundingClientRect();
        next[id] = {
          x: nodeRect.left - rect.left + nodeRect.width / 2,
          y: nodeRect.top - rect.top + nodeRect.height / 2,
        };
      });
      setPoints(next);
    }

    measure();

    // Parent height can change because of Framer enter animations; retry
    // once per frame for a couple of frames to catch the settled layout.
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() =>
      requestAnimationFrame(measure)
    );

    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [completedQuests.length, currentQuestId]);

  // Build the polyline: every completed node in QUESTS order + the
  // current node at the tail. If we don't have the current point yet
  // (first layout pass), skip to avoid a jagged half-draw.
  const trailIds: string[] = [];
  for (const q of QUESTS) {
    if (completedQuests.includes(q.id)) trailIds.push(q.id);
  }
  if (!trailIds.includes(currentQuestId)) trailIds.push(currentQuestId);

  const trailPoints = trailIds
    .map((id) => points[id])
    .filter((p): p is Point => !!p);

  const minerPoint = points[currentQuestId] ?? null;

  // SVG path string — a smooth curve feels more like "walking" than
  // straight line segments, which also hides any sub-pixel jitter in
  // the DOM measurements.
  const pathD = buildSmoothPath(trailPoints);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
    >
      {dims.w > 0 && (
        <svg
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="var(--cyan)" />
              <stop offset="100%" stopColor="var(--gold)" />
            </linearGradient>
            <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {pathD && (
            <>
              {/*
                `key` is tied to the trail length so the path remounts
                (and pathLength re-animates 0→1) every time a new node
                is appended — without it, framer keeps pathLength at 1
                forever after the first mount and the drawing effect
                only ever fires once. `delay` lets the miner take his
                first step before the line catches up, matching the
                "only the person moves, line is drawn after" spec.
              */}
              <motion.path
                key={`glow-${trailIds.length}`}
                d={pathD}
                stroke="url(#trailGradient)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.35}
                filter="url(#trailGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.85, ease: "easeOut", delay: 0.35 }}
              />
              {/* Solid trail */}
              <motion.path
                key={`trail-${trailIds.length}`}
                d={pathD}
                stroke="url(#trailGradient)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
              />
            </>
          )}
        </svg>
      )}

      {minerPoint && (
        <motion.div
          // `layout` makes the miner walk to the new bubble whenever
          // `currentQuestId` changes. We place him slightly above and
          // to the side so he sits beside the bubble, not on top of it.
          //
          // Spring tuned for a smoother glide: higher damping kills the
          // bounce the old `damping: 18` had, and slightly lower
          // stiffness stretches the arrival so it lands ~700ms later —
          // long enough that the delayed path-draw (delay: 0.35s) feels
          // like it's painted behind him, not beside him.
          layout
          transition={{ type: "spring", damping: 24, stiffness: 120, mass: 0.9 }}
          className="absolute"
          style={{
            left: minerPoint.x,
            top: minerPoint.y,
            transform: "translate(-50%, -140%)",
          }}
        >
          <MinerSprite />
        </motion.div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */
/* Smooth-path helper: Catmull-Rom-ish cubic bezier between points. */
/* --------------------------------------------------------------- */
function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    // Tension 0.2 gives a gentle S-curve without overshooting.
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* --------------------------------------------------------------- */
/* The miner sprite itself — hand-drawn SVG, Silesia coal-miner     */
/* styling (hard hat + headlamp + pickaxe). Subtle idle animation.  */
/* --------------------------------------------------------------- */
function MinerSprite() {
  // Hard-coded so every rerender gets the same animation phase —
  // using a random seed would make Strict Mode double-render flicker.
  return (
    <motion.div
      className="relative w-14 h-16 sm:w-16 sm:h-20"
      // Idle bob — translateY via spring, loops forever.
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Lantern glow behind the miner */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gold-themed/30 blur-xl"
        animate={{ opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg
        viewBox="0 0 64 80"
        className="relative w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5CE47" />
            <stop offset="100%" stopColor="#C9A84C" />
          </linearGradient>
          <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a3553" />
            <stop offset="100%" stopColor="#131625" />
          </linearGradient>
          <linearGradient id="beamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFF8E1" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="lampFace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF8E1" />
            <stop offset="80%" stopColor="#C9A84C" />
          </radialGradient>
        </defs>

        {/* Head-lamp beam — subtle forward glow */}
        <motion.path
          d="M 20 22 L 2 14 L 2 30 Z"
          fill="url(#beamGrad)"
          animate={{ opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shadow */}
        <ellipse cx="32" cy="76" rx="14" ry="2.5" fill="#000" opacity="0.35" />

        {/* Legs */}
        <rect x="22" y="58" width="8" height="16" rx="2" fill="#1f2438" />
        <rect x="34" y="58" width="8" height="16" rx="2" fill="#1f2438" />
        <rect x="22" y="72" width="9" height="4" rx="1.5" fill="#0b0e17" />
        <rect x="33" y="72" width="9" height="4" rx="1.5" fill="#0b0e17" />

        {/* Body / shirt */}
        <rect
          x="17"
          y="34"
          width="30"
          height="28"
          rx="5"
          fill="url(#shirtGrad)"
          stroke="#38BDF8"
          strokeOpacity="0.25"
          strokeWidth="0.8"
        />
        {/* Shirt stripe — the tricolour nod to Silesian miners */}
        <rect x="17" y="42" width="30" height="2.5" fill="#38BDF8" opacity="0.35" />
        <rect x="17" y="46" width="30" height="2" fill="#C9A84C" opacity="0.35" />

        {/* Arms */}
        <rect x="10" y="36" width="8" height="18" rx="2.5" fill="#1f2438" />
        {/* Right arm holds pickaxe; wiggle slightly */}
        <motion.g
          style={{ originX: 50, originY: 42, transformBox: "fill-box" }}
          animate={{ rotate: [-4, 6, -4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="46" y="36" width="8" height="18" rx="2.5" fill="#1f2438" />
          {/* Pickaxe handle */}
          <rect
            x="52"
            y="22"
            width="2.4"
            height="28"
            rx="1"
            fill="#8b5a2b"
            transform="rotate(-18 53 36)"
          />
          {/* Pickaxe head */}
          <path
            d="M 47 20 L 60 16 L 62 22 L 52 26 Z"
            fill="#9aa4b8"
            stroke="#2a3553"
            strokeWidth="0.6"
            transform="rotate(-18 54 21)"
          />
        </motion.g>

        {/* Head */}
        <circle cx="32" cy="24" r="10" fill="#f1c27d" />
        {/* Stubble shadow */}
        <path
          d="M 23 28 Q 32 34 41 28 Q 39 32 32 32 Q 25 32 23 28 Z"
          fill="#a1774f"
          opacity="0.4"
        />
        {/* Eyes */}
        <circle cx="28.5" cy="24" r="1.2" fill="#0b0e17" />
        <circle cx="35.5" cy="24" r="1.2" fill="#0b0e17" />
        {/* Smile */}
        <path
          d="M 29 28 Q 32 30 35 28"
          stroke="#0b0e17"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        {/* Moustache (classic Silesian) */}
        <path
          d="M 27 27.5 Q 32 26 37 27.5"
          stroke="#5b3a1b"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Hard hat */}
        <path
          d="M 20 20 Q 22 10 32 10 Q 42 10 44 20 Z"
          fill="url(#hatGrad)"
        />
        <rect x="19" y="19" width="26" height="3" rx="1" fill="#9a7d30" />
        {/* Head-lamp */}
        <circle cx="24" cy="18" r="3" fill="url(#lampFace)" />
        <motion.circle
          cx="24"
          cy="18"
          r="1.4"
          fill="#FFF8E1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
