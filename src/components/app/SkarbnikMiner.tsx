"use client";

/**
 * Animated Silesia-miner mascot that travels the chapter path.
 *
 * Behaviour:
 *   - Finds every `[data-quest-node]` bubble rendered by <ChapterPath>.
 *   - Renders one `<motion.path>` per segment between consecutive nodes
 *     on the trail (completed → completed → current). Stable `key`s
 *     mean segments that were already drawn DON'T re-animate on every
 *     render — only a brand-new segment (the one just revealed because
 *     the user finished a quest) does its pathLength 0→1 draw-in.
 *   - Positions the miner sprite at the current node and keeps him
 *     bouncing with a subtle bob + pickaxe swing while he "waits".
 *   - When the hub mounts after a fresh quest completion, a tiny
 *     localStorage handshake (see `@/lib/questWalk`) tells us which
 *     node to *start from* so the user can visibly see the miner step
 *     off that bubble and walk to the next one, with the new trail
 *     segment drawing itself behind him.
 *
 * Positioning strategy:
 *   We measure bubbles relative to the parent `.chapter-path` box via
 *   `getBoundingClientRect`. A ResizeObserver re-measures when the
 *   column resizes (mobile rotation, zoom, side nav opens, etc.) so
 *   the segments stay glued to the bubbles.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { QUESTS } from "@/lib/quests";
import {
  clearLastCompletedQuest,
  peekLastCompletedQuest,
} from "@/lib/questWalk";

type Point = { x: number; y: number };

type Props = {
  currentQuestId: string;
  completedQuests: string[];
};

// Delay between "miner appears at walk-from node" and "miner starts
// walking to current node". We hold him at the *completed* bubble
// for ~900ms so the user's eye has time to land on him before he
// steps off — 320ms was too fast, users were looking up at the XP
// toast and missed the whole walk. Combined with the slower spring
// below, the full animation is ~2s which reads as a proper journey
// rather than a flicker.
const WALK_DWELL_MS = 900;

// Arrival flash duration at the destination node. Triggers right as
// the layout spring lands the miner, for a "ta-da" beat.
const ARRIVAL_FLASH_MS = 900;

export default function SkarbnikMiner({
  currentQuestId,
  completedQuests,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [points, setPoints] = useState<Record<string, Point>>({});

  // --- Walk-from handshake -------------------------------------------------
  //
  // If the user just completed a quest, they land on `/quest` with that
  // id stored in localStorage. We read it here and hold the mascot at
  // that node for `WALK_DWELL_MS`, then release it → React swaps in the
  // true `currentQuestId`, framer's `layout` spring takes over, the
  // mascot visibly walks, and the new trail segment draws behind him.
  //
  // We use a ref flag so we only ever consume the marker once. The
  // effect re-runs when props land so it still fires after the parent's
  // async useSkarbnikUser() fetch populates `completedQuests`.
  const [walkFromId, setWalkFromId] = useState<string | null>(null);
  const [arrivalFlashAt, setArrivalFlashAt] = useState<string | null>(null);
  const walkConsumed = useRef(false);

  useEffect(() => {
    if (walkConsumed.current) return;
    const stored = peekLastCompletedQuest();
    if (!stored) return;
    // Only trigger if the stored id is actually a completed quest AND
    // isn't already where the miner would stand. Otherwise clean up the
    // stale marker and move on.
    if (!completedQuests.includes(stored)) return;
    if (stored === currentQuestId) {
      clearLastCompletedQuest();
      walkConsumed.current = true;
      return;
    }
    walkConsumed.current = true;
    setWalkFromId(stored);
    clearLastCompletedQuest();
    // Dwell → release → arrival flash. We compute the flash target up
    // front because `currentQuestId` can change under us if the parent
    // re-fetches between timers firing.
    const destination = currentQuestId;
    const releaseTimer = window.setTimeout(() => {
      setWalkFromId(null);
      // Flash fires just after the layout spring completes. Spring
      // arrival is ~900ms with the tuning below; we add a small
      // overshoot so the sparkle reads as "landed" rather than
      // "mid-step".
      const flashTimer = window.setTimeout(() => {
        setArrivalFlashAt(destination);
        const clearTimer = window.setTimeout(
          () => setArrivalFlashAt(null),
          ARRIVAL_FLASH_MS
        );
        // We don't return this one — it's fire-and-forget, and if the
        // component unmounts the flash state gets GC'd with it.
        void clearTimer;
      }, 900);
      void flashTimer;
    }, WALK_DWELL_MS);
    return () => window.clearTimeout(releaseTimer);
  }, [completedQuests, currentQuestId]);

  // The node the mascot + trail tail should sit on right now. While
  // `walkFromId` is active, everything past it is effectively hidden.
  const effectiveCurrentId = walkFromId ?? currentQuestId;

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
  }, [completedQuests.length, currentQuestId, walkFromId]);

  // Build the trail IDs: completed quests in QUESTS order, truncated at
  // effectiveCurrentId so we don't draw past the mascot's current
  // position. Always include effectiveCurrentId as the tail.
  const trailIds: string[] = [];
  for (const q of QUESTS) {
    if (completedQuests.includes(q.id) || q.id === effectiveCurrentId) {
      trailIds.push(q.id);
      if (q.id === effectiveCurrentId) break;
    }
  }
  if (!trailIds.includes(effectiveCurrentId)) {
    // Shouldn't happen, but guard against upstream bugs that would
    // otherwise leave the trail dangling short of the mascot.
    trailIds.push(effectiveCurrentId);
  }

  // Turn the id list into a pair list of consecutive segments. Each gets
  // a stable key so Framer preserves its draw state across re-renders.
  const segments: Array<{ key: string; from: Point; to: Point }> = [];
  for (let i = 0; i < trailIds.length - 1; i++) {
    const fromId = trailIds[i];
    const toId = trailIds[i + 1];
    const from = points[fromId];
    const to = points[toId];
    if (from && to) {
      segments.push({ key: `${fromId}->${toId}`, from, to });
    }
  }

  const minerPoint = points[effectiveCurrentId] ?? null;

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

          {segments.map((seg) => {
            const d = buildCurve(seg.from, seg.to);
            return (
              <g key={seg.key}>
                {/* Outer glow */}
                <motion.path
                  d={d}
                  stroke="url(#trailGradient)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.3}
                  filter="url(#trailGlow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.85, ease: "easeOut", delay: 0.35 }}
                />
                {/* Solid trail */}
                <motion.path
                  d={d}
                  stroke="url(#trailGradient)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.35 }}
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* Arrival sparkle — fires once when the miner lands on a new
          bubble after a quest completion. Pointer-events off so it
          never eats clicks on the quest node underneath. */}
      {arrivalFlashAt && points[arrivalFlashAt] && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.6, 2.2] }}
          transition={{ duration: ARRIVAL_FLASH_MS / 1000, ease: "easeOut" }}
          className="absolute pointer-events-none"
          style={{
            left: points[arrivalFlashAt].x,
            top: points[arrivalFlashAt].y,
            transform: "translate(-50%, -50%)",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--gold) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />
      )}

      {minerPoint && (
        <motion.div
          // `layout` makes the miner walk to the new bubble whenever
          // `effectiveCurrentId` changes. We place him slightly above
          // the bubble so he sits beside it, not on top.
          //
          // Spring tuned for a *visible journey* rather than a snap:
          // lower stiffness + slightly more mass stretches the arrival
          // to ~900ms, which combined with the 900ms dwell gives the
          // user a full ~2s animation — enough to notice the character
          // actually walking from the completed node to the next one.
          // Users were missing the old 700ms glide entirely.
          layout
          transition={{ type: "spring", damping: 22, stiffness: 85, mass: 1.1 }}
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
/* Single-segment cubic — gives each step a gentle S-curve so even   */
/* straight vertical segments read like a "walking" arc, which hides */
/* sub-pixel jitter from the DOM measurements.                       */
/* --------------------------------------------------------------- */
function buildCurve(from: Point, to: Point): string {
  // Control points at 1/3 and 2/3 of the vertical distance, with a
  // bit of horizontal nudging proportional to the delta — enough to
  // bend but not enough to overshoot the bubbles on the next row.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cp1x = from.x + dx * 0.25;
  const cp1y = from.y + dy * 0.5;
  const cp2x = to.x - dx * 0.25;
  const cp2y = to.y - dy * 0.5;
  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
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
            {/* Helmet is warm metal — reads from --flame so it stays
                amber on light mode where --gold is PKO navy. A navy
                helmet would ruin the miner silhouette. */}
            <stop offset="0%" stopColor="var(--flame-soft)" />
            <stop offset="100%" stopColor="var(--flame)" />
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
            {/* Lamp face: pale-hot core on every theme; outer ring
                reads --flame (warm amber in both themes). The lamp is
                literally firelight, so it can't go navy in light mode. */}
            <stop offset="0%" stopColor="#FFF8E1" />
            <stop offset="80%" stopColor="var(--flame)" />
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
          stroke="var(--cyan)"
          strokeOpacity="0.25"
          strokeWidth="0.8"
        />
        {/* Shirt stripe — the tricolour nod to Silesian miners */}
        <rect x="17" y="42" width="30" height="2.5" fill="var(--cyan)" opacity="0.35" />
        {/* Second stripe uses --flame so the Silesian tricolour still
            contrasts with the cyan; --gold is navy in light mode and
            would visually merge with the first stripe. */}
        <rect x="17" y="46" width="30" height="2" fill="var(--flame)" opacity="0.35" />

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
        {/* Hat band — split Polish-flag white/red. Subtle nod to the
            national palette + PKO brand accent without being a literal
            flag plastered on the hat. Kept inside the brim so it reads
            as a riveted band at a glance. */}
        <rect x="19" y="19" width="26" height="1.5" fill="#F7F1E1" />
        <rect x="19" y="20.5" width="26" height="1.5" fill="var(--accent-red)" />
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
