"use client";

import Link from "next/link";
import {
  LogIn,
  LogOut,
  Award,
  User as UserIcon,
  Trophy,
  ShieldAlert,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanternGlyph from "@/components/ui/LanternGlyph";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

/**
 * Nav used on every `(app)` page — /quest, /assess, /quest/[id],
 * /leaderboard, /alerts, /badges, /profile.
 *
 * Redesigned against the Claude Designer v1 handoff:
 *  - Cinzel gold wordmark (no gradient logo tile) + small
 *    "SKARBIEC · POZIOM I" mono strap for institutional feel.
 *  - Icon + label buttons sit on a thin outlined chip, hover
 *    lifts the border to gold instead of filling the pill.
 *  - Primary CTA uses the new .btn-primary utility (gold fill,
 *    Space Mono caps) so the same hierarchy shows up on every
 *    login button in the product.
 *
 * Chip order is content-first, then identity:
 *    Odznaki → Ranking → Alerty → Profil → Theme → (Log in/out)
 * Ranking and Alerty sit in the "content" group because both pages
 * are public (see (app)/layout.tsx), while Profil only renders when
 * the user is authenticated.
 *
 * The UI is Polish-only for this release (no <LanguageToggle>). The
 * `lang` prop is still threaded in so `t(...)` calls resolve, and so
 * a future release that re-enables the toggle only has to flip the
 * hook + add one button back in here.
 */
export default function AppNav({
  lang,
  theme,
  onToggleTheme,
  authenticated,
  onLogin,
  onLogout,
  demo,
}: {
  lang: Lang;
  theme: Theme;
  onToggleTheme: () => void;
  authenticated: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  demo?: boolean;
}) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl"
      style={{
        background: "color-mix(in srgb, var(--bg-primary) 82%, transparent)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark — Cinzel gold + the mine-lantern glyph. The lantern
            sits at 28px so it reads as an icon next to the wordmark
            rather than a mascot; all its colours follow the active
            theme through --gold / --cyan / --navy. */}
        <Link href="/quest" className="flex items-center gap-3 group">
          <LanternGlyph size={28} />
          <div className="flex flex-col leading-none">
            <span
              className="display-heading text-themed"
              style={{ fontSize: 18, letterSpacing: "0.14em" }}
            >
              Skarbnik
            </span>
            <span
              className="mono-label-dim hidden sm:block"
              style={{ fontSize: 9, marginTop: 3 }}
            >
              Cyfrowy przewodnik
            </span>
          </div>
          {demo ? (
            <span
              className="ml-2 hidden sm:inline-block mono-label"
              style={{
                fontSize: 9,
                padding: "3px 8px",
                borderRadius: 3,
                border: "1px solid var(--border-gold)",
                color: "var(--gold)",
                letterSpacing: "0.2em",
              }}
            >
              {t("demoBanner", lang)}
            </span>
          ) : null}
        </Link>

        <div className="flex items-center gap-2">
          {/*
            Home chip was here and looked orphaned beside the labelled
            chips (icon-only, square, no text — sat awkwardly next to
            the Odznaki / Profil pair). The logo on the left already
            links home, so the chip was pure visual noise. If we ever
            need to bring it back, use the same icon+label pattern as
            Odznaki / Profil so the row stays visually balanced.
          */}
          <Link
            href={demo ? "/badges?demo=true" : "/badges"}
            title={t("navBadges", lang)}
            className="nav-chip hidden sm:inline-flex"
          >
            <Award className="w-4 h-4" />
            <span className="hidden md:inline">{t("navBadges", lang)}</span>
          </Link>
          <Link
            href={demo ? "/leaderboard?demo=true" : "/leaderboard"}
            title={t("navLeaderboard", lang)}
            className="nav-chip hidden sm:inline-flex"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden md:inline">
              {t("navLeaderboard", lang)}
            </span>
          </Link>
          <Link
            href={demo ? "/alerts?demo=true" : "/alerts"}
            title={t("navAlerts", lang)}
            className="nav-chip hidden sm:inline-flex"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden md:inline">{t("navAlerts", lang)}</span>
          </Link>
          {authenticated ? (
            <Link
              href={demo ? "/profile?demo=true" : "/profile"}
              title={t("navProfile", lang)}
              className="nav-chip hidden sm:inline-flex"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden md:inline">{t("navProfile", lang)}</span>
            </Link>
          ) : null}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {authenticated ? (
            <button
              onClick={onLogout}
              className="nav-chip"
              title={t("logOut", lang)}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("logOut", lang)}</span>
            </button>
          ) : (
            <button onClick={onLogin} className="btn-primary">
              <LogIn className="w-4 h-4" />
              {t("navLogin", lang)}
            </button>
          )}
        </div>
      </div>

      {/*
        Global styles — `<style jsx>` (scoped) only attaches the
        styled-jsx hash class to native JSX elements, not to React
        components. Our `<Link>` chips would render an `<a>` without
        the scope hash, so the scoped `.nav-chip` rule never matched
        and the anchors lost their border / mono font / uppercase
        tracking (Wyloguj worked only because it's a raw `<button>`).
        `global` makes the rule match any `.nav-chip` under the nav
        regardless of origin. Selectors are scoped to `nav .nav-chip`
        so the class can't leak into anywhere else if it ever gets
        copy-pasted.
      */}
      <style jsx global>{`
        nav .nav-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-secondary);
          padding: 0 0.75rem;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: transparent;
          transition:
            border-color 160ms,
            color 160ms,
            background-color 160ms;
          cursor: pointer;
          text-decoration: none;
        }
        nav .nav-chip:hover {
          color: var(--gold);
          border-color: var(--border-gold);
        }
        nav .nav-chip-icon {
          padding: 0;
          width: 36px;
          justify-content: center;
        }
      `}</style>
    </nav>
  );
}
