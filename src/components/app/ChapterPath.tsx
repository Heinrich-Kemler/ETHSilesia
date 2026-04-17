"use client";

import Link from "next/link";
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
import { QUESTS, questTitle, levelNameKey, type Quest } from "@/lib/quests";
import { t, type Lang } from "@/lib/i18n";

/**
 * Duolingo-style vertical chapter path. Replaces the flat quest grid
 * with a zig-zagging trail: Level 1 → Level 2 → Level 3. Each quest is
 * a clickable bubble + side card; the vertical spine colour-codes the
 * journey behind the nodes.
 */
type Props = {
  lang: Lang;
  userLevel: 1 | 2 | 3 | 4;
  completedQuests: string[];
};

type NodeState = "locked" | "available" | "completed";

export default function ChapterPath({
  lang,
  userLevel,
  completedQuests,
}: Props) {
  const cap = userLevel === 4 ? 3 : userLevel;
  const demoAppend =
    typeof window !== "undefined" &&
    window.location.search.includes("demo=true")
      ? "?demo=true"
      : "";
  const levels: Array<1 | 2 | 3> = [1, 2, 3];

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

      {levels.map((lvl, lvlIdx) => {
        const quests = QUESTS.filter((q) => q.level === lvl);
        const locked = lvl > cap;
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
                {locked && (
                  <Lock className="w-4 h-4 text-muted-themed ml-1" />
                )}
              </div>
            </motion.div>

            {/* Quest nodes within this level */}
            <div
              className={`space-y-5 sm:space-y-6 ${
                locked ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              {quests.map((q, idx) => {
                const side: "left" | "right" =
                  (lvlIdx * 10 + idx) % 2 === 0 ? "left" : "right";
                const state: NodeState = locked
                  ? "locked"
                  : completedQuests.includes(q.id)
                  ? "completed"
                  : "available";
                return (
                  <ChapterNode
                    key={q.id}
                    quest={q}
                    side={side}
                    state={state}
                    lang={lang}
                    demoAppend={demoAppend}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Final flag — reached the end of the path */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="relative flex justify-center pt-10 z-20"
      >
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-gold-themed/40 bg-card-themed shadow-card">
          <Crown className="w-5 h-5 text-gold-themed" />
          <p className="font-mono text-xs uppercase tracking-widest text-gold-themed">
            {lang === "pl" ? "Koniec szlaku" : "End of trail"}
          </p>
        </div>
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
}: {
  quest: Quest;
  side: "left" | "right";
  state: NodeState;
  lang: Lang;
  demoAppend: string;
  index: number;
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
      {/* Bubble */}
      <div
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
      </div>
    </motion.div>
  );

  const rowClass = `relative flex ${
    side === "right" ? "justify-end" : "justify-start"
  } pr-2 sm:pr-4 z-10`;

  if (state === "locked") {
    return (
      <div className={rowClass}>
        <div className="cursor-not-allowed">{innerContent}</div>
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
