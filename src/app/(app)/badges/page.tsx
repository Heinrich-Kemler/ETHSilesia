"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Award, Trophy, Lock } from "lucide-react";
import BadgeCard from "@/components/app/BadgeCard";
import { useLanguage } from "@/lib/useLanguage";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { t } from "@/lib/i18n";
import { BADGES, inferEarnedBadgeIds } from "@/lib/badgeRegistry";
import {
  getCurrentStreak,
  getStreakVersion,
  subscribeStreak,
} from "@/lib/streak";

/**
 * Showcase page for the 5 SkarbnikBadges ERC-1155 collection.
 *
 * Earned badges are inferred client-side from level + completed quest
 * count + streak days. When the backend exposes a "my badges" endpoint
 * we can swap the inference for a live query — the component shape
 * stays the same.
 */
export default function BadgesPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const demo = useDemoMode();
  const {
    user,
    completedQuests,
    status,
    isDemo,
    ready,
  } = useSkarbnikUser();

  // Auth redirect — same pattern as /quest.
  useEffect(() => {
    if (!ready) return;
    if (demo) return;
    if (status === "unauthenticated") router.replace("/");
  }, [ready, status, demo, router]);

  // Subscribe to the shared streak store so badge inference stays live.
  const streakVersion = useSyncExternalStore(
    subscribeStreak,
    getStreakVersion,
    () => 0
  );
  const streakDays = useMemo(() => {
    void streakVersion; // recompute when the streak store writes
    return getCurrentStreak(user?.id ?? null);
  }, [user?.id, streakVersion]);

  const level = (user?.level ?? 1) as 1 | 2 | 3 | 4;
  const earnedIds = useMemo(
    () => inferEarnedBadgeIds(level, completedQuests, streakDays),
    [level, completedQuests, streakDays]
  );
  const earnedCount = earnedIds.length;
  const totalCount = BADGES.length;
  const percent = Math.round((earnedCount / totalCount) * 100);

  const loading = !user && (status === "idle" || status === "loading");

  return (
    <main className="min-h-screen bg-themed">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
          </div>
        ) : (
          <>
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-themed border border-themed rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden"
            >
              {/* Decorative glow */}
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: "var(--gold)" }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 55%, transparent))",
                  }}
                >
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-themed mb-1">
                    {t("badgesKicker", lang)}
                  </p>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-themed leading-tight">
                    {t("badgesTitle", lang)}
                  </h1>
                  <p className="text-muted-themed text-sm mt-1 max-w-xl">
                    {t("badgesSubtitle", lang)}
                  </p>
                </div>

                {/* Earned counter */}
                <div className="flex-shrink-0 bg-elevated-themed border border-themed rounded-2xl px-5 py-4 text-center">
                  <div className="inline-flex items-center gap-1.5 text-muted-themed text-[10px] font-mono uppercase tracking-widest mb-1">
                    <Trophy className="w-3 h-3 text-gold-themed" />
                    {t("badgesCollected", lang)}
                  </div>
                  <p className="font-heading text-2xl font-bold text-themed leading-none">
                    {earnedCount}
                    <span className="text-muted-themed font-normal text-lg">
                      {" "}
                      / {totalCount}
                    </span>
                  </p>
                  {/* Mini progress bar */}
                  <div className="mt-3 h-1.5 w-24 rounded-full bg-themed overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(to right, var(--gold), color-mix(in srgb, var(--gold) 60%, transparent))",
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Grid */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BADGES.map((badge, i) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedIds.includes(badge.id)}
                  lang={lang}
                  index={i}
                />
              ))}
            </div>

            {/* On-chain note */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-10 bg-card-themed border border-themed rounded-2xl p-5 flex items-start gap-3"
            >
              <Lock className="w-4 h-4 text-cyan-themed flex-shrink-0 mt-1" />
              <div className="flex-1 text-sm">
                <p className="text-themed font-semibold mb-1">
                  {t("badgesOnChainTitle", lang)}
                </p>
                <p className="text-muted-themed text-xs leading-relaxed">
                  {t("badgesOnChainBody", lang)}
                </p>
              </div>
            </motion.div>

            {/* Demo notice */}
            {isDemo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-xs text-muted-themed"
              >
                {t("badgesDemoNotice", lang)}
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
