"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanternGlyph from "@/components/ui/LanternGlyph";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

const navLinks = [
  { key: "navQuests" as const, href: "#features" },
  { key: "navCoach" as const, href: "#coach" },
];

/**
 * Landing-page nav. Redesigned against the Claude Designer v1 handoff
 * so it shares the institutional chrome with AppNav:
 *   - Cinzel gold wordmark + "CYFROWY PRZEWODNIK" mono strap.
 *   - Anchor links rendered as Space Mono uppercase chips so they
 *     read as navigation waypoints rather than web links.
 *   - The login CTA uses .btn-primary so the hierarchy lines up
 *     across landing → app.
 *
 * All Polish copy (nav labels, CTA label) comes from the existing
 * i18n dictionary untouched; the redesign is purely visual.
 */
export default function Navbar({
  lang,
  theme,
  onToggleTheme,
}: {
  lang: Lang;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { status, isDemo, login, logout, privyAuthenticated } =
    useSkarbnikUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Same logic as HeroSection. For a stuck Privy session (privy-authed
  // but sync never completed) we logout first, otherwise `login()` is
  // a silent no-op because Privy thinks the user is already in.
  const handleLogin = async () => {
    console.log("[Navbar] login clicked", {
      status,
      isDemo,
      privyAuthenticated,
    });
    if (status === "authenticated" || isDemo) {
      router.push("/quest");
      return;
    }
    if (privyAuthenticated) {
      // See HeroSection for the full explanation — in short: if Privy says
      // authed but we never hit status=authenticated, the click IS the
      // "reset me" signal. logout() + login() reopens the modal cleanly.
      await logout();
      login();
      return;
    }
    login();
  };

  // Only flip the nav CTA label once we're truly authed. A half-authed
  // (Privy yes, Supabase stuck) session keeps showing "Log in" — that's
  // the recovery affordance for the user.
  const authed = status === "authenticated" || isDemo;
  const ctaLabel = authed ? t("heroCta", lang) : t("navLogin", lang);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl" : ""
      }`}
      style={
        scrolled
          ? {
              background:
                "color-mix(in srgb, var(--bg-primary) 82%, transparent)",
              borderBottom: "1px solid var(--border-color)",
            }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark — lantern glyph mirrors the AppNav so landing → app
            feels continuous. All tints flow from CSS vars, no hard
            hex pins. */}
        <a href="#" className="flex items-center gap-3">
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
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a key={link.key} href={link.href} className="nav-anchor">
              {t(link.key, lang)}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button type="button" onClick={handleLogin} className="btn-primary">
            <LogIn className="w-4 h-4" />
            {ctaLabel}
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-themed"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden card-paper overflow-hidden"
            style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="nav-anchor block w-full"
                >
                  {t(link.key, lang)}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogin();
                }}
                className="btn-primary w-full mt-3"
              >
                <LogIn className="w-4 h-4" />
                {ctaLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .nav-anchor {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: 6px;
          transition:
            color 160ms,
            background-color 160ms;
        }
        .nav-anchor:hover {
          color: var(--gold);
          background: color-mix(in srgb, var(--gold) 6%, transparent);
        }
      `}</style>
    </nav>
  );
}
