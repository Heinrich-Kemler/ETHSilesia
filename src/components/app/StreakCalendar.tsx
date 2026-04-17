"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Check } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import {
  getRecentDays,
  getStreakStats,
  getStreakVersion,
  subscribeStreak,
  type DayCell,
} from "@/lib/streak";

type Props = {
  lang: Lang;
  userId: string | null;
  /** How many days to show in the strip — defaults to 7. */
  days?: number;
};

function getServerStreakVersion(): number {
  return 0;
}

/**
 * Compact streak visualiser: current + best stats on the left, a 7-day
 * activity strip on the right. Backed by the `streak` localStorage
 * store — re-renders automatically whenever `markActiveDay()` writes.
 */
export default function StreakCalendar({ lang, userId, days = 7 }: Props) {
  // Subscribe to streak writes so the strip + counters refresh live.
  const version = useSyncExternalStore(
    subscribeStreak,
    getStreakVersion,
    getServerStreakVersion
  );

  const cells = useMemo<DayCell[]>(() => {
    void version; // recompute when the streak store writes
    return getRecentDays(userId, days, lang);
  }, [userId, days, lang, version]);
  const { current, best } = useMemo(() => {
    void version; // recompute when the streak store writes
    return getStreakStats(userId);
  }, [userId, version]);

  const hasStreak = current > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 }}
      className="mt-4 bg-card-themed border border-themed rounded-2xl p-4 sm:p-5 shadow-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: stats */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: hasStreak
                ? "linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 55%, transparent))"
                : "var(--elevated)",
            }}
          >
            <Flame
              className={`w-5 h-5 ${
                hasStreak ? "text-white" : "text-muted-themed"
              }`}
            />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-themed">
              {t("streakCalendarTitle", lang)}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-xl font-bold text-themed leading-none">
                {hasStreak
                  ? t("streakCurrent", lang, { count: current })
                  : t("streakEmpty", lang)}
              </span>
            </div>
            {best > 0 && (
              <p className="text-[11px] text-muted-themed mt-1 inline-flex items-center gap-1">
                <Trophy className="w-3 h-3 text-gold-themed" />
                {t("streakBest", lang, { count: best })}
              </p>
            )}
          </div>
        </div>

        {/* Right: 7-day strip */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {cells.map((cell, i) => (
            <DayBubble key={cell.dateISO} cell={cell} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DayBubble({ cell, index }: { cell: DayCell; index: number }) {
  const { label, active, isToday } = cell;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.25 }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 ${
          active
            ? "bg-gold-themed/90 border-gold-themed"
            : isToday
            ? "bg-elevated-themed border-gold-themed/50"
            : "bg-elevated-themed border-themed"
        }`}
        aria-label={cell.dateISO}
      >
        {active ? (
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        ) : (
          <span
            className={`text-[10px] font-mono ${
              isToday ? "text-gold-themed" : "text-muted-themed/60"
            }`}
          >
            {new Date(cell.dateISO).getDate()}
          </span>
        )}
        {isToday && !active && (
          <motion.span
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-gold-themed"
          />
        )}
      </div>
      <span
        className={`text-[9px] font-mono uppercase tracking-wider ${
          isToday
            ? "text-gold-themed font-bold"
            : active
            ? "text-themed"
            : "text-muted-themed/70"
        }`}
      >
        {label}
      </span>
    </motion.div>
  );
}
