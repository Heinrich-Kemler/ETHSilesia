"use client";

import Link from "next/link";
import { LogIn, LogOut, Home, Award } from "lucide-react";
import LanguageToggle from "@/components/ui/LanguageToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

/**
 * Nav used on /assess, /quest, /quest/[id], /leaderboard.
 * Simpler than the landing Navbar — no anchor links, has
 * user actions (login / logout / home).
 */
export default function AppNav({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  authenticated,
  onLogin,
  onLogout,
  demo,
}: {
  lang: Lang;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  authenticated: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  demo?: boolean;
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-themed/80 backdrop-blur-xl border-b border-themed">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-cyan flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 120 120" fill="none">
              <path
                d="M42 38 C42 22, 78 22, 78 38"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="38" y="36" width="44" height="8" rx="2" fill="white" />
              <rect
                x="40"
                y="44"
                width="40"
                height="36"
                rx="3"
                fill="white"
                opacity="0.8"
              />
              <path
                d="M60 50 C56 56, 52 62, 55 68 C56 70, 58 71, 60 72 C62 71, 64 70, 65 68 C68 62, 64 56, 60 50Z"
                fill="#C9A84C"
              />
            </svg>
          </div>
          <span className="font-heading text-themed text-lg font-bold tracking-wider">
            Skarbnik
          </span>
          {demo ? (
            <span className="ml-2 hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-widest bg-magenta-themed/10 text-magenta-themed border border-magenta-themed/20 px-2 py-0.5 rounded">
              {t("demoBanner", lang)}
            </span>
          ) : null}
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            title="Home"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg border border-themed hover:border-gold-themed/30 text-secondary-themed hover:text-themed transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          <Link
            href={demo ? "/badges?demo=true" : "/badges"}
            title={t("navBadges", lang)}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-themed hover:border-gold-themed/30 text-secondary-themed hover:text-themed transition-colors text-sm font-medium"
          >
            <Award className="w-4 h-4" />
            <span className="hidden md:inline">{t("navBadges", lang)}</span>
          </Link>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <LanguageToggle lang={lang} onToggle={onToggleLang} />
          {authenticated ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 border border-themed hover:border-gold-themed/30 text-secondary-themed hover:text-themed text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("logOut", lang)}</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-gold-themed hover:bg-gold-dim-themed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {t("navLogin", lang)}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
