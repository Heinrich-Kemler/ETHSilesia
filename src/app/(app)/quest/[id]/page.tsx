"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import { useLanguage } from "@/lib/useLanguage";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import {
  getPreviousQuestId,
  getQuestById,
  isQuestUnlocked,
  levelNameKey,
  questTitle,
  type Quest,
} from "@/lib/quests";
import { markActiveDay } from "@/lib/streak";
import CelebrationModal from "@/components/app/CelebrationModal";
import Confetti from "@/components/ui/Confetti";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

type Phase = "loading" | "quiz" | "complete" | "not-found";

// Per-question timer. Short, punchy rounds — 10s forces gut-level
// recognition of DeFi vocab and keeps the quiz feeling more like a
// gameshow than an exam. Longer values previously let users zone out
// and the AI explanation already covers the "why" post-hoc.
const QUESTION_TIME_SECONDS = 10;

// Module-scope constant so the reference is stable across renders.
// Confetti includes `colors` in its effect deps; passing the prop as
// an inline literal would regenerate particles on every parent
// rerender and make the burst visibly restart mid-fall.
const CONFETTI_COLORS = [
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#a855f7",
  "#ef4444",
  "#f9d71c",
];

export default function ActiveQuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lang } = useLanguage();
  const demo = useDemoMode();
  const router = useRouter();
  const { user, isDemo, refetch, completedQuests, status, ready } =
    useSkarbnikUser();
  const toast = useToast();

  const quest = useMemo<Quest | undefined>(() => getQuestById(id), [id]);

  // Sequential-unlock guard. Direct URL access to /quest/l3-boss from
  // a Level 1 user used to work because this page never looked at
  // `completedQuests`. Now we bounce them back to the hub with a
  // toast — but only once we know the user's real completion set.
  const gateDecided = isDemo || (ready && status === "authenticated");
  const questUnlocked = useMemo(() => {
    if (!quest) return true; // fall through to the not-found branch
    return isQuestUnlocked(quest.id, completedQuests);
  }, [quest, completedQuests]);
  const bouncedRef = useRef(false);
  useEffect(() => {
    if (!gateDecided) return;
    if (!quest) return;
    if (questUnlocked) return;
    if (bouncedRef.current) return;
    bouncedRef.current = true;
    const prevId = getPreviousQuestId(quest.id);
    const prev = prevId ? getQuestById(prevId) : null;
    toast({
      variant: "info",
      message: t("questLockedToastTitle", lang),
      sub: prev
        ? t("questLockedToastBody", lang, { prev: questTitle(prev, lang) })
        : t("questCompletePrevious", lang),
    });
    router.replace(demo ? "/quest?demo=true" : "/quest");
  }, [gateDecided, quest, questUnlocked, toast, lang, router, demo]);

  const [phase, setPhase] = useState<Phase>("loading");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  // `failed` distinguishes "completed with <100%" (show retry UI, no
  // server persistence) from "completed with 100%" or "replay 409" —
  // both of those still render the normal success screen. It matters
  // because xpEarned=0 is ambiguous on its own: a 409 replay also
  // returns zero and we do NOT want that path to invite another
  // retry (the quest is already in completedQuests server-side).
  const [completionResult, setCompletionResult] = useState<{
    xpEarned: number;
    newXP: number;
    levelUp: boolean;
    badgeEarned: number | null;
    failed: boolean;
  } | null>(null);
  // Sequenced celebration: show level-up first (if any), then badge (if any).
  const [celebrationStep, setCelebrationStep] = useState<
    "level-up" | "badge" | "done"
  >("done");
  const demoAppend = demo ? "?demo=true" : "";
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phase init. We deliberately hold "loading" until the unlock gate
  // has a confident answer — otherwise a locked user would see the
  // quiz for a frame before the redirect effect ran.
  useEffect(() => {
    if (!quest) {
      setPhase("not-found");
      return;
    }
    if (!gateDecided) return;
    if (!questUnlocked) return;
    setPhase("quiz");
    setElapsed(0);
  }, [quest, gateDecided, questUnlocked]);

  // Start/stop timer when question changes
  useEffect(() => {
    if (phase !== "quiz" || locked) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
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
    // No partial credit. A single wrong answer blocks XP AND leaves
    // the quest uncompleted server-side, so the user can replay for
    // full XP. Previously we did `Math.round((correctCount*xp)/total)`
    // which handed out 66% XP for 2/3 — that created the "I got some
    // XP but the next level didn't unlock" confusion because the
    // server's completion gate still requires `answersTotal === score`.
    const allCorrect = correctCount === totalQ;
    const xpEarned = allCorrect ? quest.xp : 0;

    // Streak counts engagement, not success, so bump it either way.
    markActiveDay(user?.id ?? null);

    // Partial-score branch: keep the failure entirely client-side.
    // We skip the /api/quests/complete POST because a) the server
    // would 400 on score < answersTotal, and b) we want the quest to
    // stay in its un-completed state so the retry earns full XP.
    if (!allCorrect) {
      setCompletionResult({
        xpEarned: 0,
        newXP: user?.total_xp ?? 0,
        levelUp: false,
        badgeEarned: null,
        failed: true,
      });
      setPhase("complete");
      return;
    }

    // Demo mode → skip the server call, show synthetic success.
    if (isDemo) {
      setCompletionResult({
        xpEarned,
        newXP: (user?.total_xp ?? 0) + xpEarned,
        levelUp: false,
        badgeEarned: null,
        failed: false,
      });
      setPhase("complete");
      toast({
        variant: "success",
        message: t("toastQuestCompleted", lang, { xp: xpEarned }),
      });
      return;
    }

    if (!user?.id) {
      // Privy authed but our Supabase sync never produced a user row.
      // The old behaviour was to fake a "complete" screen with zero
      // persistence — that's the bug where XP "disappears" and the
      // next quest never unlocks. Surface the real problem instead so
      // the user can hit the floating SessionResetButton (rendered by
      // the (app) layout whenever privyAuthenticated && !authenticated)
      // and recover. Bounce back to the hub so the reset affordance
      // is visible and the quiz state doesn't mislead them.
      console.warn("[quest/complete] no user.id — cannot persist, routing to reset");
      toast({
        variant: "error",
        message:
          lang === "pl"
            ? "Nie udało się zapisać ukończenia questu."
            : "Couldn't save quest completion.",
        sub:
          lang === "pl"
            ? "Sesja nie jest zsynchronizowana. Użyj przycisku \"Resetuj sesję\" w prawym dolnym rogu."
            : "Session isn't synced. Tap \"Reset session\" in the bottom-right corner.",
      });
      router.replace(`/quest${demoAppend}`);
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
        // Already completed (replay). failed=false on purpose — the
        // user earned this quest previously, we just don't award XP
        // twice. Showing the retry screen here would be misleading
        // because replaying a third time still gives zero XP.
        setCompletionResult({
          xpEarned: 0,
          newXP: user.total_xp ?? 0,
          levelUp: false,
          badgeEarned: null,
          failed: false,
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
        failed: false,
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
      // Network error after a 100% run. Don't flag as `failed` — the
      // user answered correctly, the persistence just didn't land.
      // The retry button is on the hub (replay the quest) rather than
      // here; showing the failure screen would imply they got an
      // answer wrong.
      setCompletionResult({
        xpEarned,
        newXP: user.total_xp ?? 0,
        levelUp: false,
        badgeEarned: null,
        failed: false,
      });
      setPhase("complete");
    }
  }, [quest, correctCount, user, isDemo, lang, toast, refetch, router, demoAppend]);

  // Full quiz reset. Used by the retry button on the failure screen
  // — the user gets a clean slate (scorecard, question index, AI
  // explanation, timer) without a page navigation, which would drop
  // the ephemeral gate-decided / mount state we already have.
  const restartQuiz = useCallback(() => {
    setQIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setAiExplanation("");
    setAiLoading(false);
    setElapsed(0);
    setLocked(false);
    setCompletionResult(null);
    setCelebrationStep("done");
    setPhase("quiz");
  }, []);

  /* ===============================================================
     RENDER
     =============================================================== */
  if (phase === "not-found") {
    return (
      <main className="min-h-screen bg-themed">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 text-center">
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
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
            failed={completionResult.failed}
            onRetry={restartQuiz}
          />
        )}
      </div>

      {/*
        Confetti burst — only when we actually persisted XP (replays
        return xpEarned=0 from the server, and the silent-no-op branch
        is gone, so `xpEarned > 0` is now a reliable "we earned
        something" signal). Fixed + pointer-events-none so it floats
        over the whole viewport without blocking the back button.
      */}
      {phase === "complete" &&
        completionResult &&
        completionResult.xpEarned > 0 && (
          <div className="fixed inset-0 pointer-events-none z-40">
            <Confetti count={70} colors={CONFETTI_COLORS} />
          </div>
        )}

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
  failed,
  onRetry,
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
  failed: boolean;
  onRetry: () => void;
}) {
  // Hooks must run unconditionally on every render (Rules of Hooks),
  // so the count-up state/effect live ABOVE the failure early-return.
  // On the failure path xpEarned=0, so the effect is a harmless 0→0
  // count that never makes it to the DOM because we return early
  // below.
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

  // Failure branch: no XP was persisted, show a retry affordance.
  // The quest stays uncompleted server-side, so a fresh attempt
  // earns full XP through the normal completion endpoint.
  if (failed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red/10 border border-red/30 mb-6">
          <X className="w-10 h-10 text-red" />
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-themed mb-2">
          {t("quizFailedTitle", lang)}
        </h1>
        <p className="text-muted-themed text-sm font-mono uppercase tracking-widest mb-8">
          {questTitle(quest, lang)}
        </p>

        <div className="bg-card-themed border border-themed rounded-2xl p-8 mb-8 max-w-md mx-auto shadow-card">
          <p className="text-muted-themed text-xs font-mono uppercase tracking-widest mb-2">
            {t("quizPerfectRequired", lang)}
          </p>
          <p className="font-heading text-4xl font-bold text-themed">
            {correct}
            <span className="text-muted-themed">/{total}</span>
          </p>
          <p className="text-sm text-secondary-themed mt-4 leading-relaxed">
            {t("quizFailedBody", lang)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="gradient-gold-themed text-white font-heading font-bold px-8 py-4 rounded-xl inline-flex items-center gap-2"
          >
            {t("quizTryAgain", lang)}
            <ChevronRight className="w-5 h-5" />
          </button>
          <Link
            href={`/quest${demoAppend}`}
            className="text-muted-themed hover:text-themed font-heading font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("quizBackHub", lang)}
          </Link>
        </div>
      </motion.div>
    );
  }

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
