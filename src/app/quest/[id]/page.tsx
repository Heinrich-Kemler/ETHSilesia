"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ChevronRight,
  Sparkles,
  Trophy,
  ArrowLeft,
  Shield,
  Crown,
  Award,
  BookOpen,
} from "lucide-react";
import AppNav from "@/components/app/AppNav";
import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import {
  getQuestById,
  levelNameKey,
  questTitle,
  type Quest,
} from "@/lib/quests";
import { markActiveDay } from "@/lib/streak";
import CelebrationModal from "@/components/app/CelebrationModal";
import { useToast } from "@/components/ui/Toast";

type Phase = "loading" | "quiz" | "complete" | "not-found";

const QUESTION_TIME_SECONDS = 30;

export default function ActiveQuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const demo = useDemoMode();
  const { user, isDemo, login, logout, refetch } = useSkarbnikUser();
  const toast = useToast();

  const quest = useMemo<Quest | undefined>(() => getQuestById(id), [id]);

  const [phase, setPhase] = useState<Phase>("loading");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [timerStart, setTimerStart] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    xpEarned: number;
    newXP: number;
    levelUp: boolean;
    badgeEarned: number | null;
  } | null>(null);
  // Sequenced celebration: show level-up first (if any), then badge (if any).
  const [celebrationStep, setCelebrationStep] = useState<
    "level-up" | "badge" | "done"
  >("done");
  const demoAppend = demo ? "?demo=true" : "";
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase init
  useEffect(() => {
    if (!quest) {
      setPhase("not-found");
      return;
    }
    setPhase("quiz");
    setTimerStart(Date.now());
    setElapsed(0);
  }, [quest]);

  // Start/stop timer when question changes
  useEffect(() => {
    if (phase !== "quiz" || locked) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setTimerStart(Date.now());
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.1;
        if (next >= QUESTION_TIME_SECONDS) {
          return QUESTION_TIME_SECONDS;
        }
        return next;
      });
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, qIndex, locked]);

  // Auto-submit on timeout
  useEffect(() => {
    if (phase !== "quiz" || locked) return;
    if (elapsed >= QUESTION_TIME_SECONDS) {
      // Time's up — treat as wrong, advance.
      handleAnswer(-1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const handleAnswer = useCallback(
    async (idx: number, timedOut = false) => {
      if (!quest) return;
      if (locked) return;
      setLocked(true);
      setSelected(idx);
      const q = quest.questions[qIndex];
      const isCorrect = idx === q.correctIndex;
      if (isCorrect) setCorrectCount((c) => c + 1);

      // Fetch AI explanation (skip if demo + no OPENAI_API_KEY, but let the
      // API respond — if it 500s we fall back to a static line).
      setAiLoading(true);
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q.question[lang],
            userAnswer:
              idx >= 0
                ? q.options[idx][lang]
                : lang === "pl"
                ? "(brak odpowiedzi)"
                : "(no answer)",
            correctAnswer: q.options[q.correctIndex][lang],
            language: lang,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { explanation?: string };
          setAiExplanation(data.explanation ?? "");
        } else {
          setAiExplanation(
            timedOut
              ? lang === "pl"
                ? "Czas minął. Poprawna odpowiedź jest zaznaczona na zielono."
                : "Time's up. The correct answer is highlighted in green."
              : lang === "pl"
              ? "Nie udało się pobrać wyjaśnienia, ale poprawna odpowiedź jest zaznaczona na zielono."
              : "Couldn't fetch an explanation, but the correct answer is highlighted in green."
          );
        }
      } catch {
        setAiExplanation(
          lang === "pl"
            ? "Brak połączenia z AI. Poprawna odpowiedź jest zaznaczona na zielono."
            : "AI connection failed. The correct answer is highlighted in green."
        );
      } finally {
        setAiLoading(false);
      }
    },
    [quest, qIndex, lang, locked]
  );

  const goNext = useCallback(() => {
    if (!quest) return;
    if (qIndex + 1 < quest.questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setAiExplanation("");
      setLocked(false);
      return;
    }
    // all done — complete
    void finishQuest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, quest]);

  const finishQuest = useCallback(async () => {
    if (!quest) return;
    const totalQ = quest.questions.length;
    const xpEarned = Math.round((correctCount * quest.xp) / totalQ);

    // Mark today active for the streak tracker (idempotent, runs in demo + real paths).
    markActiveDay(user?.id ?? null);

    // Demo mode → skip the server call, show synthetic success.
    if (isDemo) {
      setCompletionResult({
        xpEarned,
        newXP: (user?.total_xp ?? 0) + xpEarned,
        levelUp: false,
        badgeEarned: null,
      });
      setPhase("complete");
      toast({
        variant: "success",
        message: t("toastQuestCompleted", lang, { xp: xpEarned }),
      });
      return;
    }

    if (!user?.id) {
      // no user row yet — still show the UI but skip persistence
      setCompletionResult({
        xpEarned,
        newXP: xpEarned,
        levelUp: false,
        badgeEarned: null,
      });
      setPhase("complete");
      return;
    }

    try {
      const res = await fetch("/api/quests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          questId: quest.id,
          xpEarned,
          score: correctCount,
          answersTotal: totalQ,
        }),
      });
      if (res.status === 409) {
        // already completed (replay) — show UI anyway
        setCompletionResult({
          xpEarned: 0,
          newXP: user.total_xp ?? 0,
          levelUp: false,
          badgeEarned: null,
        });
        setPhase("complete");
        return;
      }
      if (!res.ok) throw new Error(`complete ${res.status}`);
      const data = (await res.json()) as {
        newXP: number;
        levelUp: boolean;
        badgeEarned: number | null;
      };
      setCompletionResult({
        xpEarned,
        newXP: data.newXP,
        levelUp: data.levelUp,
        badgeEarned: data.badgeEarned,
      });
      setPhase("complete");
      // Trigger the sequenced celebration modal. Level-up wins the first slot
      // if present; otherwise a badge takes it. Any remaining reward shows
      // after the user dismisses the first modal.
      if (data.levelUp) setCelebrationStep("level-up");
      else if (data.badgeEarned) setCelebrationStep("badge");
      toast({
        variant: "success",
        message: t("toastQuestCompleted", lang, { xp: xpEarned }),
      });
      await refetch();
    } catch {
      toast({
        variant: "error",
        message: t("toastGenericError", lang),
      });
      setCompletionResult({
        xpEarned,
        newXP: user.total_xp ?? 0,
        levelUp: false,
        badgeEarned: null,
      });
      setPhase("complete");
    }
  }, [quest, correctCount, user, isDemo, lang, toast, refetch]);

  /* ===============================================================
     RENDER
     =============================================================== */
  if (phase === "not-found") {
    return (
      <main className="min-h-screen bg-themed">
        <AppNav
          lang={lang}
          onToggleLang={toggleLang}
          theme={theme}
          onToggleTheme={toggleTheme}
          authenticated={!!user}
          onLogin={login}
          onLogout={logout}
          demo={demo}
        />
        <div className="max-w-2xl mx-auto px-6 pt-28 text-center">
          <h1 className="font-heading text-3xl font-bold text-themed mb-4">
            {lang === "pl" ? "Quest nie znaleziony" : "Quest not found"}
          </h1>
          <Link
            href={`/quest${demoAppend}`}
            className="inline-flex items-center gap-2 text-cyan-themed hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("quizBackHub", lang)}
          </Link>
        </div>
      </main>
    );
  }

  if (!quest || phase === "loading") {
    return (
      <main className="min-h-screen bg-themed">
        <AppNav
          lang={lang}
          onToggleLang={toggleLang}
          theme={theme}
          onToggleTheme={toggleTheme}
          authenticated={!!user}
          onLogin={login}
          onLogout={logout}
          demo={demo}
        />
        <div className="flex items-center justify-center py-28">
          <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
        </div>
      </main>
    );
  }

  const totalQ = quest.questions.length;
  const currentQ = quest.questions[qIndex];

  return (
    <main className="min-h-screen bg-themed">
      <AppNav
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        authenticated={!!user}
        onLogin={login}
        onLogout={logout}
        demo={demo}
      />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        {phase === "quiz" && (
          <>
            {/* Quest header */}
            <Link
              href={`/quest${demoAppend}`}
              className="inline-flex items-center gap-2 text-muted-themed hover:text-themed text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("quizBackHub", lang)}
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-themed">
                  {questTitle(quest, lang)}
                </h1>
                <p className="text-muted-themed text-sm mt-1 font-mono">
                  {t("quizQuestionOf", lang, {
                    current: qIndex + 1,
                    total: totalQ,
                  })}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 bg-gold-themed/10 border border-gold-themed/20 text-gold-themed font-mono text-xs font-bold px-3 py-1.5 rounded-lg self-start sm:self-end">
                +{quest.xp} XP
              </span>
            </div>

            {/* Progress bar (one segment per question) */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: totalQ }).map((_, i) => {
                const active = i <= qIndex;
                return (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full overflow-hidden bg-elevated-themed"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: active ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                      className="h-full gradient-gold-themed"
                    />
                  </div>
                );
              })}
            </div>

            {/* Timer bar */}
            <div className="h-1 rounded-full bg-elevated-themed overflow-hidden mb-8">
              <div
                className="h-full transition-[width,background-color] duration-100 linear"
                style={{
                  width: `${Math.max(
                    0,
                    ((QUESTION_TIME_SECONDS - elapsed) /
                      QUESTION_TIME_SECONDS) *
                      100
                  )}%`,
                  backgroundColor:
                    elapsed > QUESTION_TIME_SECONDS * 0.75
                      ? "#ef4444"
                      : elapsed > QUESTION_TIME_SECONDS * 0.5
                      ? "var(--gold)"
                      : "var(--cyan)",
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="bg-card-themed border border-themed rounded-2xl p-8 shadow-card"
              >
                <h2 className="font-heading text-2xl font-bold text-themed mb-8 leading-tight">
                  {currentQ.question[lang]}
                </h2>

                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === currentQ.correctIndex;
                    const reveal = locked;

                    let cls =
                      "border-themed hover:border-gold-themed/40 hover:bg-card-hover-themed";
                    if (reveal && isCorrect) {
                      cls = "border-green bg-green/10";
                    } else if (reveal && isSelected && !isCorrect) {
                      cls = "border-red bg-red/10";
                    } else if (reveal) {
                      cls = "border-themed opacity-60";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={locked}
                        className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border transition-all disabled:cursor-default ${cls}`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 ${
                            reveal && isCorrect
                              ? "bg-green text-white"
                              : reveal && isSelected && !isCorrect
                              ? "bg-red text-white"
                              : "bg-elevated-themed text-gold-themed"
                          }`}
                        >
                          {reveal && isCorrect ? (
                            <Check className="w-4 h-4" />
                          ) : reveal && isSelected && !isCorrect ? (
                            <X className="w-4 h-4" />
                          ) : (
                            String.fromCharCode(65 + i)
                          )}
                        </span>
                        <span className="text-themed text-base">
                          {opt[lang]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* AI explanation */}
                <AnimatePresence>
                  {locked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 overflow-hidden"
                    >
                      <div className="bg-elevated-themed border border-themed rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-gold-themed" />
                          <span className="text-themed text-sm font-semibold">
                            Skarbnik AI
                          </span>
                          <span
                            className={`ml-auto text-xs font-mono uppercase tracking-wider ${
                              selected === currentQ.correctIndex
                                ? "text-green"
                                : "text-red"
                            }`}
                          >
                            {selected === currentQ.correctIndex
                              ? t("quizCorrectLabel", lang)
                              : t("quizWrongLabel", lang)}
                          </span>
                        </div>

                        {aiLoading ? (
                          <div className="flex items-center gap-2 text-muted-themed text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-themed animate-bounce" />
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-muted-themed animate-bounce"
                              style={{ animationDelay: "0.15s" }}
                            />
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-muted-themed animate-bounce"
                              style={{ animationDelay: "0.3s" }}
                            />
                            <span className="ml-2">
                              {t("quizAiThinking", lang)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-secondary-themed text-sm leading-relaxed">
                            {aiExplanation}
                          </p>
                        )}
                      </div>

                      {/* Static quest explainer — always-on educational takeaway */}
                      {!aiLoading && quest.explainer && (
                        <div className="mt-3 bg-cyan-themed/5 border border-cyan-themed/20 rounded-xl p-4 flex gap-3">
                          <BookOpen className="w-4 h-4 text-cyan-themed flex-shrink-0 mt-0.5" />
                          <p className="text-secondary-themed text-xs leading-relaxed">
                            {quest.explainer[lang]}
                          </p>
                        </div>
                      )}

                      {!aiLoading && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={goNext}
                          className="mt-5 w-full sm:w-auto gradient-gold-themed text-white font-heading font-bold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2"
                        >
                          {qIndex + 1 < totalQ
                            ? t("quizNext", lang)
                            : t("quizFinish", lang)}
                          <ChevronRight className="w-5 h-5" />
                        </motion.button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {phase === "complete" && completionResult && (
          <CompletionScreen
            quest={quest}
            lang={lang}
            correct={correctCount}
            total={totalQ}
            xpEarned={completionResult.xpEarned}
            levelUp={completionResult.levelUp}
            badgeEarned={completionResult.badgeEarned}
            newLevel={(user?.level ?? 1) as number}
            demoAppend={demoAppend}
          />
        )}
      </div>

      {/* Sequenced celebration overlays. Level-up shows first; if a badge
          was also earned, it shows after the level-up modal is dismissed. */}
      {completionResult?.levelUp && (
        <CelebrationModal
          open={celebrationStep === "level-up"}
          lang={lang}
          variant="level-up"
          newLevel={
            Math.min(4, (user?.level ?? 2)) as 2 | 3 | 4
          }
          levelName={t(
            levelNameKey(
              Math.min(3, (user?.level ?? 1)) as 1 | 2 | 3
            ),
            lang
          )}
          onClose={() =>
            setCelebrationStep(
              completionResult?.badgeEarned ? "badge" : "done"
            )
          }
        />
      )}
      {completionResult?.badgeEarned && (
        <CelebrationModal
          open={celebrationStep === "badge"}
          lang={lang}
          variant="badge"
          badgeId={completionResult.badgeEarned}
          onClose={() => setCelebrationStep("done")}
        />
      )}
    </main>
  );
}

/* ==============================================================
   Completion screen with animated count-up
   ============================================================== */
function CompletionScreen({
  quest,
  lang,
  correct,
  total,
  xpEarned,
  levelUp,
  badgeEarned,
  newLevel,
  demoAppend,
}: {
  quest: Quest;
  lang: "pl" | "en";
  correct: number;
  total: number;
  xpEarned: number;
  levelUp: boolean;
  badgeEarned: number | null;
  newLevel: number;
  demoAppend: string;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    let frame = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setCount(Math.round(xpEarned * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [xpEarned]);

  const NewLevelIcon =
    newLevel === 1 ? Sparkles : newLevel === 2 ? Shield : Crown;
  const levelColor =
    newLevel === 1
      ? "#10b981"
      : newLevel === 2
      ? "var(--cyan)"
      : "var(--gold)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="text-center py-8"
    >
      {levelUp && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-muted-themed text-xs font-mono uppercase tracking-widest mb-2">
            {t("quizLevelUpTitle", lang)}
          </p>
          <div className="inline-flex items-center gap-3 bg-card-themed border rounded-2xl px-6 py-4"
            style={{ borderColor: `color-mix(in srgb, ${levelColor} 40%, transparent)` }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${levelColor}, color-mix(in srgb, ${levelColor} 60%, transparent))`,
              }}
            >
              <NewLevelIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-themed uppercase tracking-wider">
                {t("quizLevelUpNew", lang)}
              </p>
              <p className="font-heading text-lg font-bold text-themed">
                {t(
                  levelNameKey(
                    Math.min(3, Math.max(1, newLevel)) as 1 | 2 | 3
                  ),
                  lang
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-gold-cyan-themed mb-6">
        <Trophy className="w-10 h-10 text-white" />
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-themed mb-2">
        {t("quizCompleteTitle", lang)}
      </h1>
      <p className="text-muted-themed text-sm font-mono uppercase tracking-widest mb-8">
        {questTitle(quest, lang)}
      </p>

      <div className="bg-card-themed border border-themed rounded-2xl p-8 mb-8 max-w-md mx-auto shadow-card">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-muted-themed text-xs font-mono uppercase tracking-widest mb-2">
              {t("quizXpEarned", lang)}
            </p>
            <p className="font-heading text-4xl font-bold text-gold-themed">
              +{count}
            </p>
          </div>
          <div>
            <p className="text-muted-themed text-xs font-mono uppercase tracking-widest mb-2">
              {lang === "pl" ? "Wynik" : "Score"}
            </p>
            <p className="font-heading text-4xl font-bold text-themed">
              {correct}<span className="text-muted-themed">/{total}</span>
            </p>
            <p className="text-xs text-muted-themed mt-1">
              {t("quizCompleteScore", lang, { score: correct, total })}
            </p>
          </div>
        </div>
      </div>

      {badgeEarned && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-3 bg-magenta-themed/10 border border-magenta-themed/30 rounded-xl px-5 py-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-magenta-themed/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-magenta-themed" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-themed uppercase tracking-wider">
              {t("quizBadgeEarned", lang)}
            </p>
            <p className="font-heading text-base font-bold text-themed">
              {t(
                ("badge" + badgeEarned) as TranslationKey,
                lang
              )}
            </p>
          </div>
        </motion.div>
      )}

      <div>
        <Link
          href={`/quest${demoAppend}`}
          className="gradient-gold-themed text-white font-heading font-bold px-8 py-4 rounded-xl inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("quizBackHub", lang)}
        </Link>
      </div>
    </motion.div>
  );
}
