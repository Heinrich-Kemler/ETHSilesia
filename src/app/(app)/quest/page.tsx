"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  User as UserIcon,
  Sparkles,
  Shield,
  Crown,
} from "lucide-react";
import ChatPanel, { ChatFab } from "@/components/app/ChatPanel";
import ChapterPath from "@/components/app/ChapterPath";
import DailyChallenge from "@/components/app/DailyChallenge";
import StreakCalendar from "@/components/app/StreakCalendar";
import WalkingSkarbnik from "@/components/app/WalkingSkarbnik";
import { useLanguage } from "@/lib/useLanguage";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { useTheme } from "@/lib/useTheme";
import { todayISO } from "@/lib/dailyChallenge";
import { t } from "@/lib/i18n";
import {
  levelNameKey,
  xpProgress,
} from "@/lib/quests";

export default function QuestHubPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const demo = useDemoMode();
  const { theme } = useTheme();
  const {
    user,
    completedQuests,
    status,
    isDemo,
    ready,
    refetch,
  } = useSkarbnikUser();
  const [chatOpen, setChatOpen] = useState(false);

  // Auth redirect — kick unauthenticated users back to landing (demo users pass through).
  useEffect(() => {
    if (!ready) return;
    if (demo) return;
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [ready, status, demo, router]);

  // The leaderboard preview that used to live at the bottom of this
  // page was removed — ranking now has its own dedicated surface at
  // /leaderboard, reachable from the AppNav "Ranking" chip. Keeping
  // the preview here duplicated the fetch + forced every quest-hub
  // visit to hit /api/leaderboard even when the user wasn't looking
  // at a scoreboard.

  const loading = !user && (status === "idle" || status === "loading");

  const level = (user?.level ?? 1) as 1 | 2 | 3 | 4;
  const totalXp = user?.total_xp ?? 0;
  const xp = xpProgress(totalXp);

  return (
    <main className="min-h-screen bg-themed">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
          </div>
        ) : (
          <>
            {/* TOP BAR */}
            <TopBar
              user={user}
              lang={lang}
              level={level}
              totalXp={totalXp}
              xpInto={xp.into}
              xpNeeded={xp.needed}
              xpPercent={xp.percent}
              streak={(user as { streak_days?: number } | null)?.streak_days ?? 0}
              isDemo={isDemo}
            />

            {/* Streak calendar — 7-day activity strip */}
            <StreakCalendar lang={lang} userId={user?.id ?? null} />

            {/* Daily Challenge
                onEarned persists the +50 XP to the server and returns
                a boolean so DailyChallenge can gate its localStorage
                write on actual success. Demo users and pre-auth
                viewers return `true` because there's no server row
                to update — their "done today" state lives only in
                localStorage anyway, and that's fine. After a real
                successful POST we refetch so the TopBar XP/level
                reflect the award immediately.

                Returning `false` on transient failure lets the child
                component reset itself so the user can retry —
                previously we silently logged the failure while the
                UI latched into "done today" with no XP banked.
                A `daily_completions` table would let us retry on
                the next page load; see the endpoint doc comment
                for the MVP tradeoff. */}
            <DailyChallenge
              lang={lang}
              unlockedLevel={level}
              userId={user?.id ?? null}
              onEarned={async () => {
                if (isDemo || !user?.id) return true;
                try {
                  const res = await fetch("/api/daily/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.id,
                      dateISO: todayISO(),
                    }),
                  });
                  // 409 = already claimed server-side. That's still a
                  // success from the UI's point of view — the XP is
                  // banked, just not by us — so we don't force a
                  // refetch and we do let the "done today" state
                  // stick.
                  if (res.status === 409) return true;
                  if (!res.ok) {
                    console.warn(
                      "[daily] complete failed",
                      res.status,
                      await res.text().catch(() => "")
                    );
                    return false;
                  }
                  await refetch();
                  return true;
                } catch (err) {
                  console.warn("[daily] complete network error", err);
                  return false;
                }
              }}
            />

            {/* Quest grid — show current-level quests, with higher levels locked */}
            <div className="mt-10">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p
                    className="mono-label"
                    style={{ color: "var(--gold)", marginBottom: 6 }}
                  >
                    {/* Mono strap — section framing */}
                    Ścieżka
                  </p>
                  <h2
                    className="display-heading text-themed"
                    style={{ fontSize: "1.75rem" }}
                  >
                    {t("questHubTitle", lang)}
                  </h2>
                  <p className="text-muted-themed text-sm mt-1">
                    {t("questHubSubtitle", lang)}
                  </p>
                </div>
              </div>

              <ChapterPath
                lang={lang}
                userLevel={level}
                completedQuests={completedQuests}
              />
            </div>

          </>
        )}
      </div>

      {/* AI Coach */}
      <ChatFab lang={lang} onClick={() => setChatOpen(true)} />
      <ChatPanel
        lang={lang}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Ambient mascot — strolls across the bottom of the page
          as a low-volume reminder of the Skarbnik persona. Click
          to dismiss (per-session only). */}
      <WalkingSkarbnik theme={theme} />
    </main>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function TopBar({
  user,
  lang,
  level,
  totalXp,
  xpInto,
  xpNeeded,
  xpPercent,
  streak,
  isDemo,
}: {
  user: { username?: string | null; wallet_address?: string | null } | null;
  lang: "pl" | "en";
  level: 1 | 2 | 3 | 4;
  totalXp: number;
  xpInto: number;
  xpNeeded: number;
  xpPercent: number;
  streak: number;
  isDemo: boolean;
}) {
  const levelKey = levelNameKey(level === 4 ? 3 : level);
  const LevelIcon =
    level === 1 ? Sparkles : level === 2 ? Shield : Crown;
  const levelColor =
    level === 1
      ? "#10b981"
      : level === 2
      ? "var(--cyan)"
      : "var(--gold)";

  const displayName =
    user?.username?.trim() ||
    (isDemo
      ? "Demo Skarbnik"
      : user?.wallet_address
      ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
      : "—");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-themed border border-themed rounded-2xl p-6 shadow-card"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
            style={{
              background: `linear-gradient(135deg, ${levelColor}, color-mix(in srgb, ${levelColor} 55%, transparent))`,
            }}
          >
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-themed font-semibold leading-tight">
              {displayName}
            </p>
            <div
              className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider mt-1"
              style={{ color: levelColor }}
            >
              <LevelIcon className="w-3 h-3" />
              {t(levelKey, lang)}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-themed mb-2 font-mono">
            <span>
              {totalXp.toLocaleString()} XP
            </span>
            <span>
              {level === 4
                ? lang === "pl"
                  ? "Max"
                  : "Max"
                : `${xpInto} / ${xpNeeded}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-elevated-themed overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(to right, ${levelColor}, color-mix(in srgb, ${levelColor} 60%, transparent))`,
              }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 flex-shrink-0 bg-elevated-themed border border-themed rounded-xl px-4 py-3">
          <Flame
            className={`w-5 h-5 ${streak > 0 ? "text-gold-themed" : "text-muted-themed"}`}
          />
          <div>
            <p className="text-themed font-mono font-bold text-lg leading-none">
              {streak}
            </p>
            <p className="text-muted-themed text-[10px] uppercase tracking-wider mt-0.5">
              {t("questStreak", lang)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
