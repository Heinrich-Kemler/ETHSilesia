"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Shield,
  Crown,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import ChatPanel, { ChatFab } from "@/components/app/ChatPanel";
import { useLanguage } from "@/lib/useLanguage";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { t } from "@/lib/i18n";
import { levelNameKey } from "@/lib/quests";

type LeaderRow = {
  user_id: string;
  username: string | null;
  total_xp: number;
  level: number;
};

type LeaderResponse = {
  topUsers: LeaderRow[];
  currentUserRank: number | null;
  currentUser: LeaderRow | null;
};

// Season end: 30 days from today (static for MVP). For the live demo we
// show a readable per-locale date.
const SEASON_END = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export default function LeaderboardPage() {
  const { lang } = useLanguage();
  const demo = useDemoMode();
  const { user } = useSkarbnikUser();
  const [chatOpen, setChatOpen] = useState(false);
  const [data, setData] = useState<LeaderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const url = user?.id
        ? `/api/leaderboard?userId=${encodeURIComponent(user.id)}`
        : "/api/leaderboard";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`leaderboard ${res.status}`);
      const json = (await res.json()) as LeaderResponse;
      setData(json);
    } catch {
      setData({ topUsers: [], currentUserRank: null, currentUser: null });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load(false);
    const id = setInterval(() => void load(true), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const seasonEndLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return SEASON_END.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", opts);
  }, [lang]);

  const rows = data?.topUsers ?? [];
  const myRank = data?.currentUserRank;

  return (
    <main className="min-h-screen bg-themed">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">
        <Link
          href={demo ? "/quest?demo=true" : "/quest"}
          className="inline-flex items-center gap-2 text-muted-themed hover:text-themed text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("quizBackHub", lang)}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-themed/10 border border-gold-themed/20 text-gold-themed text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg mb-3">
              <Trophy className="w-3.5 h-3.5" />
              {t("leaderboardPageTitle", lang)}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-themed">
              {t("leaderboardPageTitle", lang)}
            </h1>
            <p className="text-muted-themed text-sm mt-2">
              {t("leaderboardSeason", lang, { date: seasonEndLabel })}
            </p>
          </div>
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-themed hover:border-gold-themed/30 text-muted-themed hover:text-themed transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </motion.div>

        {myRank && data?.currentUser ? (
          <div className="bg-card-themed border border-gold-themed/30 rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-gold-themed/15 border border-gold-themed/20 flex items-center justify-center font-heading font-bold text-gold-themed text-lg">
              #{myRank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-themed font-mono uppercase tracking-widest">
                {t("leaderboardYou", lang)}
              </p>
              <p className="text-themed font-semibold truncate">
                {data.currentUser.username ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-gold-themed text-lg">
                {data.currentUser.total_xp.toLocaleString()}
              </p>
              <p className="text-muted-themed text-xs">
                {t("questLevel", lang)} {data.currentUser.level}
              </p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-card-themed border border-themed rounded-2xl p-10 text-center text-muted-themed">
            {t("leaderboardEmpty", lang)}
          </div>
        ) : (
          <div className="bg-card-themed border border-themed rounded-2xl overflow-hidden shadow-card">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-themed text-[10px] uppercase tracking-widest font-mono text-muted-themed">
              <span>{t("rank", lang)}</span>
              <span>{t("player", lang)}</span>
              <span>{t("questLevel", lang)}</span>
              <span>{t("questXP", lang)}</span>
            </div>
            {rows.map((r, i) => {
              const isMe = r.user_id === (user?.id ?? null);
              const levelKey = levelNameKey(Math.min(3, Math.max(1, r.level)) as 1 | 2 | 3);
              const LevelIcon =
                r.level <= 1 ? Sparkles : r.level === 2 ? Shield : Crown;
              const levelColor =
                r.level <= 1
                  ? "#10b981"
                  : r.level === 2
                  ? "var(--cyan)"
                  : "var(--gold)";
              return (
                <motion.div
                  key={r.user_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 items-center ${
                    i < rows.length - 1 ? "border-b border-themed" : ""
                  } ${isMe ? "bg-gold-themed/5" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        i === 0
                          ? "bg-gold-themed text-white"
                          : i === 1
                          ? "bg-cyan-themed text-white"
                          : i === 2
                          ? "bg-magenta-themed text-white"
                          : "bg-elevated-themed text-themed"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-themed text-sm font-semibold truncate">
                      {r.username ?? "—"}
                      {isMe && (
                        <span className="ml-2 text-[10px] bg-gold-themed/10 text-gold-themed border border-gold-themed/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                          {t("leaderboardYou", lang)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <LevelIcon className="w-3.5 h-3.5" style={{ color: levelColor }} />
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: levelColor }}>
                      {t(levelKey, lang)}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-gold-themed">
                    {r.total_xp.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ChatFab lang={lang} onClick={() => setChatOpen(true)} />
      <ChatPanel lang={lang} open={chatOpen} onClose={() => setChatOpen(false)} />
    </main>
  );
}
