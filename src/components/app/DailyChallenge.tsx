"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, Flame, Sparkles, X, Zap } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { questTitle } from "@/lib/quests";
import {
  DAILY_BONUS_XP,
  formatCountdown,
  getDailyResult,
  msUntilMidnight,
  pickDailyChallenge,
  saveDailyResult,
  todayISO,
  type DailyResult,
} from "@/lib/dailyChallenge";
import { markActiveDay } from "@/lib/streak";
import { useToast } from "@/components/ui/Toast";
import Confetti from "@/components/ui/Confetti";
import CoalBurst from "@/components/ui/CoalBurst";

type Props = {
  lang: Lang;
  /** The user's current level (used to cap eligible quest pool). */
  unlockedLevel: 1 | 2 | 3 | 4;
  /** User id — stable key for picker + result bucketing. `null` for anon/demo. */
  userId: string | null;
  /** Called when the user earns the daily XP — parent decides whether to POST. */
  onEarned?: (xp: number) => void;
};

export default function DailyChallenge({
  lang,
  unlockedLevel,
  userId,
  onEarned,
}: Props) {
  const toast = useToast();
  const [date] = useState(() => todayISO());
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  /**
   * Transient celebration / failure burst. Set inside `handleAnswer`
   * (never during hydration) so reopening the page after yesterday's
   * result doesn't replay the effect. AnimatePresence unmounts the
   * overlay once `burst` is cleared by the timer below.
   */
  const [burst, setBurst] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    if (!burst) return;
    // Match the longest particle duration (~2.6s for coal) + a small buffer.
    const id = setTimeout(() => setBurst(null), 2800);
    return () => clearTimeout(id);
  }, [burst]);

  // Pick today's question deterministically
  const selection = useMemo(
    () => pickDailyChallenge(date, userId, unlockedLevel),
    [date, userId, unlockedLevel]
  );

  // Load any existing result for today
  const [result, setResult] = useState<DailyResult | null>(null);
  useEffect(() => {
    setResult(getDailyResult(userId, date));
  }, [userId, date]);

  // Countdown ticker
  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilMidnight(), lang));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lang]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (!selection || submitted) return;
      setSelected(idx);
      setSubmitted(true);
      const isCorrect = idx === selection.question.correctIndex;
      const earned = isCorrect ? DAILY_BONUS_XP : 0;
      const saved: DailyResult = {
        dateISO: date,
        questId: selection.quest.id,
        questionIndex: selection.questionIndex,
        status: isCorrect ? "correct" : "incorrect",
        earnedXp: earned,
      };
      saveDailyResult(userId, saved);
      markActiveDay(userId);
      setResult(saved);
      // Fire the overlay regardless of outcome — the effect component
      // itself differs based on status (confetti vs. coal + embers).
      // Derive from the local `isCorrect` boolean rather than
      // `saved.status` so TS keeps the literal-union narrow (the
      // DailyResult type allows "pending" which we never emit here).
      setBurst(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        toast({
          variant: "level-up",
          message: t("toastDailyCorrect", lang, { xp: DAILY_BONUS_XP }),
        });
        onEarned?.(DAILY_BONUS_XP);
      } else {
        toast({
          variant: "error",
          message: t("toastDailyWrong", lang),
        });
      }
    },
    [selection, submitted, userId, date, lang, toast, onEarned]
  );

  if (!selection) return null;

  const answered = !!result;
  const resolvedSelected = answered ? result!.questionIndex : null;
  const statusColor =
    result?.status === "correct"
      ? "var(--cyan)"
      : result?.status === "incorrect"
      ? "#ef4444"
      : "var(--gold)";
  void resolvedSelected; // suppress unused for now

  return (
    <>
      {/* Full-viewport celebration / coal burst. Fixed + high z so it
          lays over every card, but pointer-events are off so the user
          can keep clicking the reveal panel underneath. AnimatePresence
          lets the inner particle components keep animating cleanly
          during unmount when the timer clears `burst`. */}
      <AnimatePresence>
        {burst && (
          <motion.div
            key={`burst-${burst}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 pointer-events-none z-[60]"
          >
            {burst === "correct" ? (
              <Confetti
                count={60}
                colors={[
                  "#C9A84C", // gold (dark-mode hero hue — pops on both themes)
                  "#38BDF8", // cyan
                  "#E0414B", // PKO accent red
                  "#F59E0B", // amber
                  "#10B981", // emerald
                  "#F9D71C", // bright gold sparkle
                ]}
              />
            ) : (
              <CoalBurst />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mt-4 bg-card-themed border border-gold-themed/30 rounded-2xl overflow-hidden shadow-card"
    >
      {/* Header row */}
      <button
        onClick={() => !answered && setExpanded((v) => !v)}
        className="w-full text-left px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-card-hover-themed transition-colors disabled:cursor-default"
        disabled={answered}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: `linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 55%, transparent))`,
          }}
        >
          {answered && result?.status === "correct" ? (
            <Check className="w-5 h-5 text-white" />
          ) : answered && result?.status === "incorrect" ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Calendar className="w-5 h-5 text-white" />
          )}
          {!answered && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold-themed animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading text-base font-bold text-themed">
              {t("dailyTitle", lang)}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border"
              style={{
                color: statusColor,
                borderColor: `color-mix(in srgb, ${statusColor} 30%, transparent)`,
                background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
              }}
            >
              <Zap className="w-2.5 h-2.5" />
              {t("dailyReward", lang, { xp: DAILY_BONUS_XP })}
            </span>
          </div>
          <p className="text-muted-themed text-xs mt-0.5 truncate">
            {answered
              ? t("dailyDoneToday", lang)
              : t("dailySubtitle", lang)}
          </p>
        </div>

        <div className="flex flex-col items-end flex-shrink-0 gap-1">
          {answered ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider"
              style={{ color: statusColor }}
            >
              <Flame className="w-3 h-3" />
              {result?.status === "correct"
                ? t("dailyCorrect", lang)
                : t("dailyWrong", lang)}
            </span>
          ) : (
            <span className="text-gold-themed text-xs font-mono">
              {expanded
                ? lang === "pl"
                  ? "Zwiń"
                  : "Collapse"
                : t("dailyCta", lang)}
            </span>
          )}
          <span className="text-[10px] text-muted-themed font-mono">
            {t("dailyNextIn", lang, { time: countdown })}
          </span>
        </div>
      </button>

      {/* Expanded question panel */}
      <AnimatePresence>
        {(expanded || answered) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-themed"
          >
            <div className="px-5 sm:px-6 py-5">
              <p className="text-muted-themed text-[10px] font-mono uppercase tracking-widest mb-2 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-themed" />
                {questTitle(selection.quest, lang)}
              </p>
              <h3 className="font-heading text-lg font-bold text-themed mb-4">
                {selection.question.question[lang]}
              </h3>

              <div className="space-y-2">
                {selection.question.options.map((opt, i) => {
                  const isCorrect = i === selection.question.correctIndex;
                  const isSelected = submitted
                    ? selected === i
                    : answered && result?.questionIndex !== undefined
                    ? false
                    : false;
                  const reveal = submitted || answered;

                  let cls =
                    "border-themed hover:border-gold-themed/40 hover:bg-card-hover-themed";
                  if (reveal && isCorrect) cls = "border-green bg-green/10";
                  else if (reveal && isSelected && !isCorrect)
                    cls = "border-red bg-red/10";
                  else if (reveal) cls = "border-themed opacity-60";

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={reveal}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:cursor-default text-sm ${cls}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                          reveal && isCorrect
                            ? "bg-green text-white"
                            : reveal && isSelected && !isCorrect
                            ? "bg-red text-white"
                            : "bg-elevated-themed text-gold-themed"
                        }`}
                      >
                        {reveal && isCorrect ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : reveal && isSelected && !isCorrect ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className="text-themed">{opt[lang]}</span>
                    </button>
                  );
                })}
              </div>

              {answered && result?.status === "incorrect" && (
                <p className="mt-4 text-xs text-muted-themed">
                  {t("dailyCorrectAnswerWas", lang)}{" "}
                  <span className="text-themed font-semibold">
                    {
                      selection.question.options[
                        selection.question.correctIndex
                      ][lang]
                    }
                  </span>
                </p>
              )}

              <p className="mt-4 text-[11px] text-muted-themed inline-flex items-center gap-1">
                <Flame className="w-3 h-3 text-gold-themed" />
                {t("dailyStreakShield", lang)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
