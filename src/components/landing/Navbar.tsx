"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

const navLinks = [
  { key: "navQuests" as const, href: "#features" },
  { key: "navLeaderboard" as const, href: "#leaderboard" },
  { key: "navCoach" as const, href: "#coach" },
];

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-themed/80 backdrop-blur-xl border-b border-themed shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
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
              <rect x="40" y="44" width="40" height="36" rx="3" fill="white" opacity="0.8" />
              <path
                d="M60 50 C56 56, 52 62, 55 68 C56 70, 58 71, 60 72 C62 71, 64 70, 65 68 C68 62, 64 56, 60 50Z"
                fill="#C9A84C"
              />
            </svg>
          </div>
          <span className="font-heading text-themed text-lg font-bold tracking-wider">
            Skarbnik
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-secondary-themed text-sm hover:text-themed transition-colors"
            >
              {t(link.key, lang)}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="flex items-center gap-2 bg-gold-themed hover:bg-gold-dim-themed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <LogIn className="w-4 h-4" />
            {t("navLogin", lang)}
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-themed"
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
            className="md:hidden bg-card-themed border-b border-themed overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-secondary-themed text-sm hover:text-themed transition-colors py-2"
                >
                  {t(link.key, lang)}
                </a>
              ))}
              <button className="w-full flex items-center justify-center gap-2 bg-gold-themed text-white text-sm font-semibold px-5 py-2.5 rounded-xl mt-2">
                <LogIn className="w-4 h-4" />
                {t("navLogin", lang)}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
