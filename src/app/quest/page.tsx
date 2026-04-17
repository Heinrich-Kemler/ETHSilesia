"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame,
  Star,
  Lock,
  Check,
  Play,
  RotateCcw,
  Trophy,
  User as UserIcon,
  Sparkles,
  Shield,
  Crown,
} from "lucide-react";
import AppNav from "@/components/app/AppNav";
import ChatPanel, { ChatFab } from "@/components/app/ChatPanel";
import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { t } from "@/lib/i18n";
import {
  QUESTS,
  levelNameKey,
  questTitle,
  xpProgress,
  type Quest,
} from "@/lib/quests";

type LeaderRow = {
  user_id: string;
  username: string | null;
  total_xp: number;
  level: number;
};

export default function QuestHubPage() {
  const router = useRouter();
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const demo = useDemoMode();
  const {
    user,
    completedQuests,
    status,
    isDemo,
    ready,
    login,
    logout,
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

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-24">
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

              <QuestGrid
                lang={lang}
                userLevel={level === 4 ? 3 : level}
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

function QuestGrid({
  lang,
  userLevel,
  completedQuests,
}: {
  lang: "pl" | "en";
  userLevel: 1 | 2 | 3;
  completedQuests: string[];
}) {
  // Group by level so we can render visible sections
  const levels: Array<1 | 2 | 3> = [1, 2, 3];

  return (
    <div className="space-y-10">
      {levels.map((lvl) => {
        const quests = QUESTS.filter((q) => q.level === lvl);
        const locked = lvl > userLevel;
        return (
          <div key={lvl}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-themed">
                {t("questLevel", lang)} {lvl}
              </span>
              <div className="h-px bg-themed flex-1" />
              {locked && (
                <span className="text-xs text-muted-themed inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {t("questUnlockAt", lang, { level: lvl })}
                </span>
              )}
            </div>
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                locked ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {quests.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  lang={lang}
                  completed={completedQuests.includes(q.id)}
                  locked={locked}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestCard({
  quest,
  lang,
  completed,
  locked,
}: {
  quest: Quest;
  lang: "pl" | "en";
  completed: boolean;
  locked: boolean;
}) {
  const demoAppend = typeof window !== "undefined" && window.location.search.includes("demo=true") ? "?demo=true" : "";
  const statusLabel = locked
    ? t("questLocked", lang)
    : completed
    ? t("questCompleted", lang)
    : t("questAvailable", lang);

  const borderClass = locked
    ? "border-themed"
    : completed
    ? "border-green/40 hover:border-green/70"
    : "border-gold-themed/30 hover:border-gold-themed/60";

  const icon = locked ? (
    <Lock className="w-4 h-4 text-muted-themed" />
  ) : completed ? (
    <Check className="w-4 h-4 text-green" />
  ) : (
    <Sparkles className="w-4 h-4 text-gold-themed" />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-card-themed border ${borderClass} rounded-2xl p-5 transition-all shadow-card relative overflow-hidden`}
    >
      {completed && (
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full bg-green/5 rounded-bl-[100%]" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3 relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-elevated-themed">
            {icon}
          </span>
          <span className="text-muted-themed text-[10px] font-mono uppercase tracking-widest">
            {statusLabel}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 bg-gold-themed/10 border border-gold-themed/20 text-gold-themed font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
          +{quest.xp} XP
        </span>
      </div>

      <h3 className="font-heading text-lg font-bold text-themed mb-3 leading-tight">
        {questTitle(quest, lang)}
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${
                s <= quest.stars
                  ? "text-gold-themed fill-current"
                  : "text-muted-themed/40"
              }`}
              fill={s <= quest.stars ? "currentColor" : "none"}
            />
          ))}
        </div>

        {locked ? (
          <span className="text-muted-themed text-xs font-medium">
            {t("questLocked", lang)}
          </span>
        ) : (
          <Link
            href={`/quest/${quest.id}${demoAppend}`}
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
              completed
                ? "bg-elevated-themed border border-themed text-themed hover:bg-card-hover-themed"
                : "gradient-gold-themed text-white"
            }`}
          >
            {completed ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                {t("questReplay", lang)}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                {t("questStart", lang)}
              </>
            )}
          </Link>
        )}
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
