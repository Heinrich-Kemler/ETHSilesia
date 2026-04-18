"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Lock,
  Play,
  Sparkles,
  Shield,
  Crown,
  Star,
} from "lucide-react";
import {
  QUESTS,
  questTitle,
  levelNameKey,
  type Quest,
} from "@/lib/quests";
import { t, type Lang } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import SkarbnikMiner from "./SkarbnikMiner";

/**
 * Duolingo-style vertical chapter path. Replaces the flat quest grid
 * with a zig-zagging trail: Level 1 → Level 2 → Level 3. Each quest is
 * a clickable bubble + side card; the vertical spine colour-codes the
 * journey behind the nodes.
 *
 * Unlock model (new):
 *   - The first quest is always open.
 *   - Every other quest unlocks when its predecessor in `QUESTS` is
 *     complete. Levels are cosmetic — they just colour the spine.
 *
 * Old `userLevel`-based gating was a trap: finishing all of Level 1
 * (350 XP) doesn't reach the Level 2 threshold (500 XP), so the level
 * cap would permanently hide L2 quests unless the user earned XP from
 * elsewhere. Kept the prop for backwards compatibility (unused).
 */
type Props = {
  lang: Lang;
  /** @deprecated unlock is now sequential; kept so callers don't break. */
  userLevel?: 1 | 2 | 3 | 4;
  completedQuests: string[];
};

type NodeState = "locked" | "available" | "completed";

export default function ChapterPath({
  lang,
  completedQuests,
}: Props) {
  const toast = useToast();
  const demoAppend =
    typeof window !== "undefined" &&
    window.location.search.includes("demo=true")
      ? "?demo=true"
      : "";
  const levels: Array<1 | 2 | 3> = [1, 2, 3];

  // Build per-quest state once per completedQuests change — used both
  // for rendering the nodes and for positioning the walking mascot.
  const stateByQuest = useMemo<Record<string, NodeState>>(() => {
    const out: Record<string, NodeState> = {};
    QUESTS.forEach((q, idx) => {
      if (completedQuests.includes(q.id)) {
        out[q.id] = "completed";
        return;
      }
      if (idx === 0) {
        out[q.id] = "available";
        return;
      }
      const prev = QUESTS[idx - 1];
      out[q.id] = completedQuests.includes(prev.id) ? "available" : "locked";
    });
    return out;
  }, [completedQuests]);

  // The "current" quest is the first non-completed node — that's where
  // the miner mascot will stand.
  const currentQuestId = useMemo(() => {
    const next = QUESTS.find((q) => !completedQuests.includes(q.id));
    return next?.id ?? QUESTS[QUESTS.length - 1].id;
  }, [completedQuests]);

  // Called when someone taps a locked node. Clarifies why.
  function onLockedTap(q: Quest) {
    const idx = QUESTS.findIndex((entry) => entry.id === q.id);
    const prev = idx > 0 ? QUESTS[idx - 1] : null;
    toast({
      variant: "info",
      message: t("questLockedToastTitle", lang),
      sub: prev
        ? t("questLockedToastBody", lang, { prev: questTitle(prev, lang) })
        : t("questCompletePrevious", lang),
    });
  }

  return (
    <div className="relative">
      {/* Vertical spine (colour-shifts across the three levels) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-4 bottom-4 w-[3px] -translate-x-1/2 rounded-full opacity-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #10b981 0%, #10b981 30%, var(--cyan) 32%, var(--cyan) 64%, var(--gold) 66%, var(--gold) 100%)",
        }}
      />

      {/*
        Walking miner — overlays the entire path and travels from the
        first quest to the current (first-unfinished) node, drawing a
        glowing trail through every completed node on the way.
      */}
      <SkarbnikMiner
        currentQuestId={currentQuestId}
        completedQuests={completedQuests}
      />

      {levels.map((lvl) => {
        const quests = QUESTS.filter((q) => q.level === lvl);
        // The level banner is "locked" only in the cosmetic sense —
        // if no quest at this level is unlocked yet, dim the header.
        const anyUnlocked = quests.some(
          (q) => stateByQuest[q.id] !== "locked"
        );
        const LevelIcon =
          lvl === 1 ? Sparkles : lvl === 2 ? Shield : Crown;
        const levelColor =
          lvl === 1
            ? "#10b981"
            : lvl === 2
            ? "var(--cyan)"
            : "var(--gold)";

        return (
          <div key={lvl} className="relative">
            {/* Level milestone banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="relative flex justify-center py-6 z-20"
            >
              <div
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border bg-card-themed shadow-card"
                style={{
                  borderColor: `color-mix(in srgb, ${levelColor} 35%, transparent)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${levelColor}, color-mix(in srgb, ${levelColor} 55%, transparent))`,
                  }}
                >
                  <LevelIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-themed">
                    {t("questLevel", lang)} {lvl}
                  </p>
                  <p className="font-heading text-sm font-bold text-themed">
                    {t(levelNameKey(lvl), lang)}
                  </p>
                </div>
                {!anyUnlocked && (
                  <Lock className="w-4 h-4 text-muted-themed ml-1" />
                )}
              </div>
            </motion.div>

            {/* Quest nodes within this level */}
            <div className="space-y-5 sm:space-y-6">
              {quests.map((q, idx) => {
                // Zig-zag continues across level boundaries so the
                // spine still feels like one uninterrupted trail.
                const globalIdx = QUESTS.findIndex((x) => x.id === q.id);
                const side: "left" | "right" =
                  globalIdx % 2 === 0 ? "left" : "right";
                const state = stateByQuest[q.id] ?? "locked";
                return (
                  <ChapterNode
                    key={q.id}
                    quest={q}
                    side={side}
                    state={state}
                    lang={lang}
                    demoAppend={demoAppend}
                    index={idx}
                    onLockedTap={onLockedTap}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Final flag — reached the end of the path. The "more quests
          coming soon" subtitle signals that the content library is
          still growing, so power-users who finish every quest don't
          think the app is broken or abandoned. Kept intentionally
          small and muted so it doesn't compete with the crown. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="relative flex flex-col items-center pt-10 z-20"
      >
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-gold-themed/40 bg-card-themed shadow-card">
          <Crown className="w-5 h-5 text-gold-themed" />
          <p className="font-mono text-xs uppercase tracking-widest text-gold-themed">
            {t("trailEnd", lang)}
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-themed font-mono tracking-wider">
          {t("trailEndHint", lang)}
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single quest node — bubble + side card, alternating left/right     */
/* ------------------------------------------------------------------ */
function ChapterNode({
  quest,
  side,
  state,
  lang,
  demoAppend,
  index,
  onLockedTap,
}: {
  quest: Quest;
  side: "left" | "right";
  state: NodeState;
  lang: Lang;
  demoAppend: string;
  index: number;
  onLockedTap: (q: Quest) => void;
}) {
  const Icon =
    state === "locked" ? Lock : state === "completed" ? Check : Play;

  const bubbleClass =
    state === "locked"
      ? "bg-elevated-themed border-2 border-themed"
      : state === "completed"
      ? "bg-green/20 border-2 border-green"
      : "gradient-gold-cyan-themed border-2 border-gold-themed/50 shadow-lg shadow-gold-themed/25";

  const statusLabel =
    state === "locked"
      ? t("questLocked", lang)
      : state === "completed"
      ? t("questCompleted", lang)
      : t("questAvailable", lang);

  const statusColor =
    state === "locked"
      ? "text-muted-themed"
      : state === "completed"
      ? "text-green"
      : "text-gold-themed";

  const iconColor =
    state === "locked"
      ? "text-muted-themed"
      : state === "completed"
      ? "text-green"
      : "text-white";

  const innerContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={state !== "locked" ? { scale: 1.03 } : undefined}
      className={`flex items-center gap-3 sm:gap-4 ${
        side === "right" ? "flex-row-reverse" : ""
      }`}
    >
      {/* Bubble — `data-quest-node` lets <SkarbnikMiner> position itself */}
      <div
        data-quest-node={quest.id}
        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${bubbleClass} flex-shrink-0`}
      >
        <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${iconColor}`} />
        {state === "available" && (
          <motion.span
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-gold-themed"
          />
        )}
        {state === "completed" && <CompletionFlag questId={quest.id} />}
      </div>

      {/* Side card */}
      <div
        className={`flex-1 max-w-[220px] sm:max-w-[260px] bg-card-themed border border-themed rounded-xl p-3 sm:p-4 shadow-card ${
          side === "right" ? "text-right" : "text-left"
        }`}
      >
        <p
          className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${statusColor}`}
        >
          {statusLabel}
        </p>
        <h3 className="font-heading text-sm sm:text-base font-bold text-themed leading-tight mb-2">
          {questTitle(quest, lang)}
        </h3>
        <div
          className={`flex items-center gap-2 ${
            side === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${
                  s <= quest.stars
                    ? "text-gold-themed fill-current"
                    : "text-muted-themed/40"
                }`}
                fill={s <= quest.stars ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="text-xs font-mono font-bold text-gold-themed">
            +{quest.xp} XP
          </span>
        </div>
        {state === "locked" && (
          <p className="mt-2 text-[10px] font-mono text-muted-themed">
            {t("questCompletePrevious", lang)}
          </p>
        )}
      </div>
    </motion.div>
  );

  const rowClass = `relative flex ${
    side === "right" ? "justify-end" : "justify-start"
  } pr-2 sm:pr-4 z-10`;

  if (state === "locked") {
    // Locked bubbles are still tappable so the user gets feedback
    // instead of a dead click — the toast explains what to finish.
    return (
      <div className={rowClass}>
        <button
          type="button"
          onClick={() => onLockedTap(quest)}
          className="cursor-not-allowed block bg-transparent border-0 p-0 text-left"
          aria-disabled
        >
          {innerContent}
        </button>
      </div>
    );
  }

  return (
    <div className={rowClass}>
      <Link
        href={`/quest/${quest.id}${demoAppend}`}
        className="block transition-transform"
      >
        {innerContent}
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Completion flag — tiny pennant that plants itself on finished      */
/* quest bubbles. Pops in with a spring, then ripples in the wind via */
/* a continuous skewY so it reads as "alive" at a glance.             */
/* ------------------------------------------------------------------ */
function CompletionFlag({ questId }: { questId: string }) {
  // Per-instance gradient id keeps the SVG defs isolated when the
  // browser inlines multiple flags on the same page — otherwise every
  // flag would reference the last-parsed <linearGradient>.
  const gradId = `flagGrad-${questId}`;
  return (
    <motion.div
      initial={{ scale: 0, y: 6, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
      className="absolute -top-6 -right-1 sm:-top-7 sm:-right-1 pointer-events-none"
      aria-hidden
    >
      <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5CE47" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
        {/* Wooden pole */}
        <rect x="4" y="3" width="2" height="25" rx="1" fill="#6b4423" />
        {/* Brass finial on top */}
        <circle cx="5" cy="3" r="1.6" fill="#d9a441" />
        {/* Pennant with fishtail cut-out, waves in "wind" */}
        <motion.path
          d="M 6 4 L 21 6 L 18 10 L 21 14 L 6 12 Z"
          fill={`url(#${gradId})`}
          stroke="#0f172a"
          strokeOpacity="0.25"
          strokeWidth="0.6"
          style={{ originX: "5px", originY: "8px", transformBox: "fill-box" }}
          animate={{ skewY: [-3, 4, -3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle highlight */}
        <ellipse cx="11" cy="7" rx="2.5" ry="0.8" fill="#fff" opacity="0.35" />
      </svg>
    </motion.div>
  );
}
