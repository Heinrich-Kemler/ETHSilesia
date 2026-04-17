"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, Sparkles, Shield, Crown } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useLanguage } from "@/lib/useLanguage";
import { t } from "@/lib/i18n";
import {
  ASSESSMENT_QUESTIONS,
  scoreToInitialXp,
  scoreToLevel,
} from "@/lib/assessment";
import { levelNameKey } from "@/lib/quests";
import { useDemoMode } from "@/lib/useDemoMode";
import { useToast } from "@/components/ui/Toast";

type Phase = "checking" | "intro" | "quiz" | "result";

function useSafePrivy() {
  try {
    return usePrivy();
  } catch {
    return null;
  }
}

export default function AssessPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const demo = useDemoMode();
  const privy = useSafePrivy();
  const toast = useToast();

  const [phase, setPhase] = useState<Phase>("checking");
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Destructure primitives so the effect only re-runs on real changes
  // rather than every time Privy hands us a new object reference.
  const privyReady = privy?.ready ?? false;
  const privyAuthenticated = privy?.authenticated ?? false;
  const privyUserId = privy?.user?.id ?? null;
  const privyWallet = privy?.user?.wallet?.address ?? null;
  const privyEmail =
    privy?.user?.email?.address ?? privy?.user?.google?.email ?? null;

  // ---------- ON MOUNT: check if user is already assessed ----------
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (demo) {
        // Demo users are always "assessed" — jump to /quest.
        router.replace("/quest?demo=true");
        return;
      }

      // If Privy unavailable (no app id), just show the intro.
      if (!privyReady) return;

      if (!privyAuthenticated || !privyUserId) {
        setPhase("intro");
        return;
      }

      if (!privyWallet) return; // wait for embedded wallet

      try {
        const res = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            privyId: privyUserId,
            walletAddress: privyWallet,
            email: privyEmail ?? undefined,
          }),
        });
        if (!res.ok) {
          throw new Error(`users/create ${res.status}`);
        }
        const data = (await res.json()) as {
          user: { id: string; total_xp: number };
          created: boolean;
        };
        if (cancelled) return;

        // If the user already exists with progress, skip the assessment.
        if (!data.created || data.user.total_xp > 0) {
          router.replace("/quest");
          return;
        }
        setPhase("intro");
      } catch {
        if (!cancelled) setPhase("intro");
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [
    demo,
    privyReady,
    privyAuthenticated,
    privyUserId,
    privyWallet,
    privyEmail,
    router,
  ]);

  // ---------- quiz navigation ----------
  const total = ASSESSMENT_QUESTIONS.length;
  const q = ASSESSMENT_QUESTIONS[current];

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowFeedback(true);
    const isCorrect = idx === q.correctIndex;
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      if (current + 1 < total) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setShowFeedback(false);
      } else {
        setPhase("result");
      }
    }, 1500);
  }

  // ---------- result handling ----------
  const finalLevel = useMemo(() => scoreToLevel(score), [score]);
  const initialXp = useMemo(() => scoreToInitialXp(score), [score]);

  async function handleBegin() {
    setSubmitting(true);
    try {
      if (privy?.authenticated && privy.user?.wallet?.address) {
        const res = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            privyId: privy.user.id,
            walletAddress: privy.user.wallet.address,
            email:
              privy.user.email?.address ??
              privy.user.google?.email ??
              undefined,
            level: finalLevel,
            initialXP: initialXp,
            language: lang,
          }),
        });
        if (!res.ok) throw new Error(`users/create ${res.status}`);
      }
      router.push("/quest");
    } catch {
      toast({
        variant: "error",
        message: t("toastGenericError", lang),
      });
      setSubmitting(false);
    }
  }

  // ---------- UI ----------
  return (
    <main className="min-h-screen bg-themed">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
        <AnimatePresence mode="wait">
          {phase === "checking" && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
            </motion.div>
          )}

          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-themed/10 mb-6">
                <Sparkles className="w-8 h-8 text-gold-themed" />
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-themed mb-4">
                {t("assessTitle", lang)}
              </h1>
              <p className="text-secondary-themed text-lg mb-10 max-w-xl mx-auto">
                {t("assessIntro", lang)}
              </p>
              <button
                onClick={() => setPhase("quiz")}
                className="gradient-gold-themed text-white font-heading font-bold px-8 py-4 rounded-xl inline-flex items-center gap-2"
              >
                {t("assessBegin", lang)}
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {phase === "quiz" && (
            <motion.div
              key={`q-${current}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-themed text-sm font-mono uppercase tracking-wider">
                    {t("assessQuestionOf", lang, {
                      current: current + 1,
                      total,
                    })}
                  </span>
                  <span className="text-gold-themed text-sm font-mono">
                    {Math.round(((current + 1) / total) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-elevated-themed overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((current + 1) / total) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-full gradient-gold-themed"
                  />
                </div>
              </div>

              <div className="bg-card-themed border border-themed rounded-2xl p-8 shadow-card">
                <h2 className="font-heading text-2xl font-bold text-themed mb-8 leading-tight">
                  {t(q.questionKey, lang)}
                </h2>

                <div className="space-y-3">
                  {q.optionKeys.map((optKey, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === q.correctIndex;
                    const showState =
                      showFeedback &&
                      (isSelected || (isCorrect && selected !== null));

                    let stateClasses =
                      "border-themed hover:border-gold-themed/40 hover:bg-card-hover-themed";
                    if (showState && isCorrect) {
                      stateClasses =
                        "border-green bg-green/10 text-themed";
                    } else if (showState && isSelected && !isCorrect) {
                      stateClasses = "border-red bg-red/10 text-themed";
                    }

                    return (
                      <button
                        key={optKey}
                        onClick={() => handleAnswer(i)}
                        disabled={selected !== null}
                        className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border transition-all ${stateClasses} disabled:cursor-default`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold flex-shrink-0 ${
                            showState && isCorrect
                              ? "bg-green text-white"
                              : showState && isSelected && !isCorrect
                              ? "bg-red text-white"
                              : "bg-elevated-themed text-gold-themed"
                          }`}
                        >
                          {showState && isCorrect ? (
                            <Check className="w-4 h-4" />
                          ) : showState && isSelected && !isCorrect ? (
                            <X className="w-4 h-4" />
                          ) : (
                            String.fromCharCode(65 + i)
                          )}
                        </span>
                        <span className="text-themed text-base">
                          {t(optKey, lang)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback banner */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-6 px-4 py-3 rounded-xl text-sm font-medium ${
                        selected === q.correctIndex
                          ? "bg-green/10 text-green"
                          : "bg-red/10 text-red"
                      }`}
                    >
                      {selected === q.correctIndex
                        ? t("assessCorrect", lang)
                        : t("assessWrong", lang)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <ResultBadge level={finalLevel} />
              <p className="text-muted-themed font-mono text-sm uppercase tracking-wider mb-3">
                {t("assessResultTitle", lang)}
              </p>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-themed mb-4">
                {t(levelNameKey(finalLevel), lang)}
              </h1>
              <p className="text-secondary-themed text-lg mb-2">
                {t(
                  finalLevel === 1
                    ? "assessWelcomeL1"
                    : finalLevel === 2
                    ? "assessWelcomeL2"
                    : "assessWelcomeL3",
                  lang
                )}
              </p>
              <p className="text-muted-themed text-sm mb-10">
                {t("assessScore", lang, { score })}
              </p>

              <button
                onClick={handleBegin}
                disabled={submitting}
                className="gradient-gold-themed text-white font-heading font-bold px-10 py-4 rounded-xl inline-flex items-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : null}
                {t("assessBegin", lang)}
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ResultBadge({ level }: { level: 1 | 2 | 3 }) {
  const Icon = level === 1 ? Sparkles : level === 2 ? Shield : Crown;
  const color =
    level === 1
      ? "#10b981" /* green */
      : level === 2
      ? "var(--cyan)"
      : "var(--gold)";

  return (
    <motion.div
      initial={{ scale: 0.6, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 14 }}
      className="relative inline-block mb-8"
    >
      <div
        className="w-32 h-32 rounded-3xl flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, transparent))`,
        }}
      >
        <Icon className="w-14 h-14 text-white relative z-10" />
        <div className="absolute inset-0 rounded-3xl bg-white/10 mix-blend-overlay" />
      </div>
      <div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-40 -z-10"
        style={{ background: color }}
      />
    </motion.div>
  );
}
