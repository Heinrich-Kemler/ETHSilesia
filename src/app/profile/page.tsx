"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Pencil,
  Check,
  X as XIcon,
  Copy,
  CopyCheck,
  Calendar,
  Trophy,
  Zap,
  Flame,
  Target,
  Award,
  Moon,
  Sun,
  Globe,
  LogOut,
  ChevronRight,
  Lock,
} from "lucide-react";
import AppNav from "@/components/app/AppNav";
import { useLanguage } from "@/lib/useLanguage";
import { useTheme } from "@/lib/useTheme";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { useDemoMode } from "@/lib/useDemoMode";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";
import { QUESTS, getQuestById, questTitle, xpProgress, levelNameKey } from "@/lib/quests";
import { BADGES, inferEarnedBadgeIds, badgeName } from "@/lib/badgeRegistry";
import { getCurrentStreak } from "@/lib/streak";

/* =====================================================================
   Profile page — everything the user sees about themselves after login.

   Composed of seven stacked sections (header, stats, XP, badges preview,
   quest history, settings, account actions). Data comes from the
   `useSkarbnikUser` hook which already handles demo mode vs. Privy auth.
   ===================================================================== */

function shortenWallet(addr: string | undefined | null): string {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function initialsFromName(name: string | null | undefined, fallback = "SK"): string {
  const clean = (name ?? "").trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string | null | undefined, lang: "pl" | "en"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { lang, toggle: toggleLang } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const demo = useDemoMode();
  const toast = useToast();
  const {
    user,
    completedQuests,
    questCompletions,
    status,
    isDemo,
    ready,
    login,
    logout,
    refetch,
  } = useSkarbnikUser();

  /* -----------------------------------------------------------------
     Auth redirect (same pattern as /quest, /badges)
     ----------------------------------------------------------------- */
  useEffect(() => {
    if (!ready) return;
    if (demo) return;
    if (status === "unauthenticated") router.replace("/");
  }, [ready, status, demo, router]);

  /* -----------------------------------------------------------------
     Streak — read from the shared localStorage-backed store.
     ----------------------------------------------------------------- */
  const [streakDays, setStreakDays] = useState(0);
  useEffect(() => {
    setStreakDays(getCurrentStreak(user?.id ?? null));
  }, [user?.id]);

  /* -----------------------------------------------------------------
     Derived: level, XP, badges
     ----------------------------------------------------------------- */
  const level = (user?.level ?? 1) as 1 | 2 | 3 | 4;
  const totalXp = user?.total_xp ?? 0;
  const xp = xpProgress(totalXp);
  const isMaxLevel = level === 4;
  const totalQuests = QUESTS.length;
  const completedCount = completedQuests.length;
  // Use DB streak as a fallback if localStorage reads 0 (first load on a new
  // device). The two stores converge as the user plays.
  const effectiveStreak = streakDays > 0
    ? streakDays
    : (user as { streak_days?: number } | null)?.streak_days ?? 0;

  const earnedBadgeIds = useMemo(
    () => inferEarnedBadgeIds(level, completedCount, effectiveStreak),
    [level, completedCount, effectiveStreak]
  );
  const earnedBadges = useMemo(
    () => BADGES.filter((b) => earnedBadgeIds.includes(b.id)).slice(0, 4),
    [earnedBadgeIds]
  );

  /* -----------------------------------------------------------------
     Username inline edit
     ----------------------------------------------------------------- */
  const currentUsername =
    (user as { username?: string | null } | null)?.username ?? null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reset draft whenever the persisted value changes.
    setDraft(currentUsername ?? "");
  }, [currentUsername]);

  async function saveUsername(): Promise<void> {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      toast({
        variant: "error",
        message: t("profileUsernameEmpty", lang),
      });
      return;
    }
    if (trimmed === (currentUsername ?? "")) {
      setEditing(false);
      return;
    }
    if (isDemo) {
      // Demo mode — pretend it saved so the UX flow is still visible.
      toast({
        variant: "success",
        message: t("profileDemoReadOnly", lang),
      });
      setEditing(false);
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
      await refetch();
      toast({
        variant: "success",
        message: t("profileUsernameSaved", lang),
      });
      setEditing(false);
    } catch {
      toast({
        variant: "error",
        message: t("profileUsernameError", lang),
      });
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------------------------------------------------
     Wallet copy
     ----------------------------------------------------------------- */
  const [copied, setCopied] = useState(false);
  async function copyWallet(): Promise<void> {
    const addr = user?.wallet_address;
    if (!addr || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // silently ignore; some browsers block clipboard without user gesture
    }
  }

  const loading = !user && (status === "idle" || status === "loading");

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-gold-themed/30 border-t-gold-themed animate-spin" />
          </div>
        ) : (
          <>
            {/* ============================================================
                SECTION 1 — Profile Header
                ============================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-themed border border-themed rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden"
            >
              {/* Soft glow */}
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: "var(--gold)" }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Avatar — initials fallback (Privy doesn't expose Google picture) */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 font-heading font-bold text-white text-2xl tracking-wide"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 55%, transparent))",
                  }}
                  aria-hidden
                >
                  {initialsFromName(currentUsername ?? "Skarbnik", "SK")}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-themed mb-1">
                    {t("profileKicker", lang)}
                  </p>

                  {/* Username — inline-editable */}
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        disabled={saving}
                        maxLength={40}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveUsername();
                          if (e.key === "Escape") {
                            setEditing(false);
                            setDraft(currentUsername ?? "");
                          }
                        }}
                        className="font-heading text-xl sm:text-2xl font-bold text-themed bg-elevated-themed border border-themed rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold-themed/50 min-w-0 flex-1 max-w-sm"
                      />
                      <button
                        onClick={() => void saveUsername()}
                        disabled={saving}
                        aria-label={t("profileSave", lang)}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-gold-themed/15 border border-gold-themed/30 text-gold-themed hover:bg-gold-themed/25 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setDraft(currentUsername ?? "");
                        }}
                        disabled={saving}
                        aria-label={t("profileCancel", lang)}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-themed text-muted-themed hover:text-themed hover:border-gold-themed/20 transition-colors disabled:opacity-50"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="group flex items-center gap-2 text-left"
                      aria-label={t("profileEditUsername", lang)}
                    >
                      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-themed leading-tight truncate max-w-full">
                        {currentUsername && currentUsername.length > 0
                          ? currentUsername
                          : t("profileUsernamePlaceholder", lang)}
                      </h1>
                      <Pencil className="w-4 h-4 text-muted-themed group-hover:text-gold-themed transition-colors flex-shrink-0" />
                    </button>
                  )}

                  {/* Wallet + member since */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <button
                      onClick={() => void copyWallet()}
                      className="inline-flex items-center gap-2 font-mono text-muted-themed hover:text-themed transition-colors"
                      aria-label={t("profileCopyWallet", lang)}
                    >
                      {copied ? (
                        <CopyCheck className="w-3.5 h-3.5 text-gold-themed" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{shortenWallet(user?.wallet_address)}</span>
                      {copied && (
                        <span className="text-[10px] text-gold-themed font-mono uppercase tracking-widest">
                          {t("profileCopied", lang)}
                        </span>
                      )}
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-muted-themed">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-mono uppercase tracking-widest">
                        {t("profileMemberSince", lang)}
                      </span>
                      <span className="text-themed">
                        {formatDate(
                          (user as { created_at?: string } | null)?.created_at,
                          lang
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ============================================================
                SECTION 2 — Stats Row (4 cards)
                ============================================================ */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Trophy className="w-4 h-4" />}
                label={t("profileStatLevel", lang)}
                value={
                  <span className="flex items-center gap-2">
                    <span>{level}</span>
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      style={{
                        color: levelColor(level),
                        borderColor: `color-mix(in srgb, ${levelColor(level)} 35%, transparent)`,
                        background: `color-mix(in srgb, ${levelColor(level)} 12%, transparent)`,
                      }}
                    >
                      {t(levelNameKey(level), lang)}
                    </span>
                  </span>
                }
                tint={levelColor(level)}
                index={0}
              />
              <StatCard
                icon={<Zap className="w-4 h-4" />}
                label={t("profileStatXp", lang)}
                value={<span>{totalXp.toLocaleString()}</span>}
                hint={
                  isMaxLevel
                    ? t("profileMaxLevel", lang)
                    : t("profileXpToNext", lang, {
                        remaining: (xp.needed - xp.into).toLocaleString(),
                      })
                }
                tint="var(--gold)"
                index={1}
              />
              <StatCard
                icon={<Flame className="w-4 h-4" />}
                label={t("profileStatStreak", lang)}
                value={
                  <span>
                    {effectiveStreak}
                    <span className="text-muted-themed font-normal text-base">
                      {" "}
                      {t(effectiveStreak === 1 ? "profileDayOne" : "profileDays", lang)}
                    </span>
                  </span>
                }
                tint="#ef4444"
                index={2}
              />
              <StatCard
                icon={<Target className="w-4 h-4" />}
                label={t("profileStatQuests", lang)}
                value={
                  <span>
                    {completedCount}
                    <span className="text-muted-themed font-normal text-base">
                      {" "}
                      / {totalQuests}
                    </span>
                  </span>
                }
                tint="var(--cyan)"
                index={3}
              />
            </div>

            {/* ============================================================
                SECTION 3 — XP Progress bar (full width)
                ============================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 bg-card-themed border border-themed rounded-2xl p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-themed mb-0.5">
                    {t("profileXpProgressLabel", lang)}
                  </p>
                  <p className="font-heading text-base font-semibold text-themed">
                    {t(levelNameKey(level), lang)}
                  </p>
                </div>
                <p className="font-mono text-sm text-muted-themed">
                  {isMaxLevel
                    ? t("profileMaxLevel", lang)
                    : `${xp.into.toLocaleString()} / ${xp.needed.toLocaleString()} XP`}
                </p>
              </div>

              <div className="h-2.5 rounded-full bg-themed overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xp.percent}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, var(--gold), color-mix(in srgb, var(--gold) 55%, transparent))",
                  }}
                />
              </div>
            </motion.section>

            {/* ============================================================
                SECTION 4 — Badge showcase preview
                ============================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 bg-card-themed border border-themed rounded-2xl p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold-themed" />
                  <h2 className="font-heading text-base font-semibold text-themed">
                    {t("profileBadgesTitle", lang)}
                  </h2>
                  <span className="text-[10px] font-mono text-muted-themed uppercase tracking-widest">
                    {earnedBadgeIds.length} / {BADGES.length}
                  </span>
                </div>
                <Link
                  href={demo ? "/badges?demo=true" : "/badges"}
                  className="text-cyan-themed hover:underline text-sm font-medium inline-flex items-center gap-1"
                >
                  {t("profileViewAllBadges", lang)}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {earnedBadges.length === 0 ? (
                <div className="text-center py-8 text-muted-themed text-sm">
                  <Lock className="w-5 h-5 mx-auto mb-2 opacity-60" />
                  {t("profileNoBadgesYet", lang)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {earnedBadges.map((badge, i) => {
                    const Icon = badge.icon;
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * i }}
                        className="relative bg-elevated-themed border rounded-xl p-3 flex flex-col items-center text-center gap-2 overflow-hidden"
                        style={{
                          borderColor: `color-mix(in srgb, ${badge.accent} 30%, transparent)`,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: badge.gradient }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[11px] font-heading font-semibold text-themed leading-tight line-clamp-2">
                          {badgeName(badge, lang)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.section>

            {/* ============================================================
                SECTION 5 — Completed quests history
                ============================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 bg-card-themed border border-themed rounded-2xl p-5 shadow-card"
            >
              <h2 className="font-heading text-base font-semibold text-themed mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-themed" />
                {t("profileCompletedQuests", lang)}
                <span className="text-[10px] font-mono text-muted-themed uppercase tracking-widest">
                  {questCompletions.length}
                </span>
              </h2>

              {questCompletions.length === 0 ? (
                <div className="text-center py-8 text-muted-themed text-sm">
                  {t("profileNoQuestsYet", lang)}
                </div>
              ) : (
                <ul className="divide-y divide-themed">
                  {questCompletions.map((c, i) => {
                    const quest = getQuestById(c.quest_id);
                    const title = quest
                      ? questTitle(quest, lang)
                      : c.quest_id;
                    const scoreLabel = `${c.answers_correct}/${c.answers_total}`;
                    const perfect =
                      c.answers_total > 0 &&
                      c.answers_correct === c.answers_total;
                    return (
                      <motion.li
                        key={`${c.quest_id}-${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-themed text-sm font-medium truncate">
                            {title}
                          </p>
                          <p className="text-muted-themed text-xs mt-0.5">
                            {formatDate(c.completed_at, lang)}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                            perfect
                              ? "border-gold-themed/30 text-gold-themed bg-gold-themed/10"
                              : "border-themed text-muted-themed bg-elevated-themed"
                          }`}
                        >
                          {scoreLabel}
                        </span>
                        <span className="font-mono text-sm font-bold text-gold-themed tabular-nums min-w-[60px] text-right">
                          +{c.xp_earned} XP
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </motion.section>

            {/* ============================================================
                SECTION 6 — Settings (Language + Theme)
                ============================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 bg-card-themed border border-themed rounded-2xl p-5 shadow-card"
            >
              <h2 className="font-heading text-base font-semibold text-themed mb-4">
                {t("profileSettings", lang)}
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Language */}
                <div className="flex items-center justify-between gap-3 bg-elevated-themed border border-themed rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe className="w-4 h-4 text-muted-themed flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-themed text-sm font-medium">
                        {t("profileSettingLanguage", lang)}
                      </p>
                      <p className="text-muted-themed text-xs">
                        {lang === "pl" ? "Polski" : "English"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleLang}
                    className="relative flex items-center bg-card-themed border border-themed rounded-full p-0.5 w-[88px] h-9 hover:border-gold-themed/20 transition-colors flex-shrink-0"
                    aria-label={t("profileSettingLanguage", lang)}
                  >
                    <motion.div
                      className="absolute top-0.5 w-[42px] h-8 rounded-full bg-gold-themed/15 border border-gold-themed/30"
                      animate={{ left: lang === "pl" ? "2px" : "42px" }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    />
                    <span
                      className={`relative z-10 flex-1 text-center text-xs font-bold tracking-wide transition-colors ${
                        lang === "pl" ? "text-gold-themed" : "text-muted-themed"
                      }`}
                    >
                      PL
                    </span>
                    <span
                      className={`relative z-10 flex-1 text-center text-xs font-bold tracking-wide transition-colors ${
                        lang === "en" ? "text-gold-themed" : "text-muted-themed"
                      }`}
                    >
                      EN
                    </span>
                  </button>
                </div>

                {/* Theme */}
                <div className="flex items-center justify-between gap-3 bg-elevated-themed border border-themed rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {theme === "dark" ? (
                      <Moon className="w-4 h-4 text-muted-themed flex-shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-muted-themed flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-themed text-sm font-medium">
                        {t("profileSettingTheme", lang)}
                      </p>
                      <p className="text-muted-themed text-xs">
                        {theme === "dark"
                          ? t("profileThemeDark", lang)
                          : t("profileThemeLight", lang)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="relative flex items-center bg-card-themed border border-themed rounded-full p-0.5 w-[78px] h-9 hover:border-gold-themed/20 transition-colors flex-shrink-0"
                    aria-label={t("profileSettingTheme", lang)}
                  >
                    <motion.div
                      className="absolute top-0.5 w-[37px] h-8 rounded-full bg-gold-themed/15 border border-gold-themed/30"
                      animate={{ left: theme === "light" ? "2px" : "37px" }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    />
                    <span className="relative z-10 flex-1 flex items-center justify-center">
                      <Sun
                        className={`w-3.5 h-3.5 ${
                          theme === "light" ? "text-gold-themed" : "text-muted-themed"
                        }`}
                      />
                    </span>
                    <span className="relative z-10 flex-1 flex items-center justify-center">
                      <Moon
                        className={`w-3.5 h-3.5 ${
                          theme === "dark" ? "text-gold-themed" : "text-muted-themed"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </motion.section>

            {/* ============================================================
                SECTION 7 — Account actions
                ============================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-6 bg-card-themed border border-themed rounded-2xl p-5 shadow-card"
            >
              <h2 className="font-heading text-base font-semibold text-themed mb-3">
                {t("profileAccountActions", lang)}
              </h2>
              <button
                onClick={() => void logout()}
                disabled={isDemo}
                className="inline-flex items-center gap-2 border border-themed hover:border-red-500/40 text-secondary-themed hover:text-red-500 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {t("profileDisconnect", lang)}
              </button>
              {isDemo && (
                <p className="mt-3 text-xs text-muted-themed">
                  {t("profileDemoReadOnly", lang)}
                </p>
              )}
            </motion.section>
          </>
        )}
      </div>
    </main>
  );
}

/* =====================================================================
   Helpers
   ===================================================================== */

function levelColor(level: 1 | 2 | 3 | 4): string {
  if (level === 1) return "#10b981";
  if (level === 2) return "var(--cyan)";
  if (level === 3) return "var(--gold)";
  return "#a855f7"; // level 4 — max tier
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tint,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tint: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative bg-card-themed border border-themed rounded-2xl p-4 shadow-card overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: tint }}
      />
      <div className="relative">
        <div
          className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-2"
          style={{ color: tint }}
        >
          {icon}
          {label}
        </div>
        <p className="font-heading text-xl font-bold text-themed leading-tight">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-[11px] text-muted-themed font-mono tracking-wide">
            {hint}
          </p>
        )}
      </div>
    </motion.div>
  );
}
