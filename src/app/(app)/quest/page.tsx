"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Trophy,
  User as UserIcon,
  Sparkles,
  Shield,
  Crown,
} from "lucide-react";
import ChatPanel, { ChatFab } from "@/components/app/ChatPanel";
import ChapterPath from "@/components/app/ChapterPath";
import DailyChallenge from "@/components/app/DailyChallenge";
import StreakCalendar from "@/components/app/StreakCalendar";
import { useLanguage } from "@/lib/useLanguage";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { t } from "@/lib/i18n";
import {
  levelNameKey,
  xpProgress,
} from "@/lib/quests";

type LeaderRow = {
  user_id: string;
  username: string | null;
  total_xp: number;
  level: number;
};

export default function QuestHubPage() {
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
  const [chatOpen, setChatOpen] = useState(false);
  const [top3, setTop3] = useState<LeaderRow[]>([]);

  // Auth redirect — kick unauthenticated users back to landing (demo users pass through).
  useEffect(() => {
    if (!ready) return;
    if (demo) return;
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [ready, status, demo, router]);

  // Leaderboard top-3 preview
  useEffect(() => {
    let cancelled = false;
    async function loadBoard() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) return;
        const data = (await res.json()) as { topUsers: LeaderRow[] };
        if (!cancelled) setTop3((data.topUsers ?? []).slice(0, 3));
      } catch {
        /* soft-fail — leaderboard is optional */
      }
    }
    void loadBoard();
    return () => {
      cancelled = true;
    };
  }, []);

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

            {/* Daily Challenge */}
            <DailyChallenge
              lang={lang}
              unlockedLevel={level}
              userId={user?.id ?? null}
            />

            {/* Quest grid — show current-level quests, with higher levels locked */}
            <div className="mt-10">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-themed">
                    {t("questHubTitle", lang)}
                  </h2>
                  <p className="text-muted-themed text-sm">
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

            {/* Leaderboard preview */}
            <div className="mt-14">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="font-heading text-xl font-bold text-themed">
                    {t("leaderboardPreview", lang)}
                  </h2>
                </div>
                <Link
                  href={demo ? "/leaderboard?demo=true" : "/leaderboard"}
                  className="text-cyan-themed hover:underline text-sm font-medium"
                >
                  {t("seeFullLeaderboard", lang)} →
                </Link>
              </div>
              <LeaderboardPreview
                rows={top3}
                currentUserId={user?.id ?? null}
                lang={lang}
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

function LeaderboardPreview({
  rows,
  currentUserId,
  lang,
}: {
  rows: LeaderRow[];
  currentUserId: string | null;
  lang: "pl" | "en";
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-card-themed border border-themed rounded-2xl p-8 text-center text-muted-themed text-sm">
        {t("leaderboardEmpty", lang)}
      </div>
    );
  }

  return (
    <div className="bg-card-themed border border-themed rounded-2xl overflow-hidden shadow-card">
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-3 border-b border-themed text-[10px] uppercase tracking-widest font-mono text-muted-themed">
        <span>{t("rank", lang)}</span>
        <span>{t("player", lang)}</span>
        <span>{t("questXP", lang)}</span>
      </div>
      {rows.map((r, i) => {
        const isMe = r.user_id === currentUserId;
        return (
          <div
            key={r.user_id}
            className={`grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-4 items-center ${
              i < rows.length - 1 ? "border-b border-themed" : ""
            } ${isMe ? "bg-gold-themed/5" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-elevated-themed flex items-center justify-center font-mono text-xs font-bold text-themed">
                {i + 1}
              </span>
              {i === 0 && <Trophy className="w-3.5 h-3.5 text-gold-themed" />}
            </div>
            <div>
              <p className="text-themed text-sm font-semibold">
                {r.username ?? "—"}
                {isMe && (
                  <span className="ml-2 text-xs bg-gold-themed/10 text-gold-themed border border-gold-themed/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                    {t("leaderboardYou", lang)}
                  </span>
                )}
              </p>
              <p className="text-muted-themed text-xs font-mono mt-0.5">
                {t("questLevel", lang)} {r.level}
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-gold-themed">
              {r.total_xp.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
