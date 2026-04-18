"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import SkarbnikMascot from "@/components/ui/SkarbnikMascot";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

export default function HeroSection({ lang, theme }: { lang: Lang; theme: Theme }) {
  const router = useRouter();
  const { status, isDemo, login, logout, privyAuthenticated } =
    useSkarbnikUser();

  // Three paths:
  //   (1) fully synced → /quest
  //   (2) not authed at all → open the Privy modal
  //   (3) privy-authed but sync stuck/errored → reset the session first,
  //       then reopen the Privy modal. Calling `login()` alone while
  //       Privy already has a session is a silent no-op, which is what
  //       made this button look "dead" after a stale session.
  const handleStart = async () => {
    console.log("[HeroSection] CTA clicked", {
      status,
      isDemo,
      privyAuthenticated,
    });
    if (status === "authenticated" || isDemo) {
      router.push("/quest");
      return;
    }
    if (privyAuthenticated) {
      // Privy says "already logged in" but we haven't reached status=authenticated.
      // Either sync is stuck or this is a stale session from a previous run. The
      // user clicking Login is the signal to reset — force a logout so the next
      // login() actually opens the modal instead of no-opping silently.
      await logout();
      login();
      return;
    }
    login();
  };
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/4 w-[700px] h-[700px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-cyan/[0.04] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-magenta/[0.02] rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              theme === "dark"
                ? "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
                : "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — text content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-card-themed border border-themed rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span className="text-secondary-themed text-xs font-medium">
                {t("heroBadge", lang)}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              <span className="text-themed">{t("heroHeading", lang).split(" ").slice(0, -1).join(" ")}{" "}</span>
              <span className="gradient-text-themed">
                {t("heroHeading", lang).split(" ").slice(-1)}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-secondary-themed text-lg leading-relaxed mb-8 max-w-lg"
            >
              {t("heroSubheading", lang)}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                type="button"
                onClick={handleStart}
                className="group flex items-center justify-center gap-2 gradient-gold-themed text-white font-heading font-bold text-base px-8 py-4 rounded-xl transition-all"
                style={{ boxShadow: `0 0 30px var(--gold-glow)` }}
              >
                {t("heroCta", lang)}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#how"
                className="flex items-center justify-center gap-2 border border-themed hover:border-muted-themed text-secondary-themed hover:text-themed font-medium text-base px-8 py-4 rounded-xl transition-all"
              >
                {t("heroSecondary", lang)}
              </a>
            </motion.div>
          </div>

          {/* Right — mascot visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              {/* Outer glow rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 rounded-full border border-gold-themed/20 animate-[spin_20s_linear_infinite]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border border-cyan-themed/10 animate-[spin_15s_linear_infinite_reverse]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-96 h-96 rounded-full border border-magenta-themed/5" />
              </div>

              {/* Floating stat badges */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 right-0 bg-card-themed border border-themed rounded-xl px-3 py-2 shadow-lg"
              >
                <p className="text-xs text-muted-themed">Level 3</p>
                <p className="text-sm font-mono font-bold text-gold-themed">1,250 XP</p>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 left-0 bg-card-themed border border-themed rounded-xl px-3 py-2 shadow-lg"
              >
                <p className="text-xs text-muted-themed">Streak</p>
                <p className="text-sm font-mono font-bold text-cyan-themed">7 days</p>
              </motion.div>

              <motion.div
                animate={{ y: [-3, 7, -3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 -left-12 bg-card-themed border border-themed rounded-xl px-3 py-2 shadow-lg"
              >
                <p className="text-xs font-mono font-bold text-green">+50 XP</p>
              </motion.div>

              {/* Mascot center */}
              <div className="relative z-10 p-12">
                <SkarbnikMascot size={200} theme={theme} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-5 h-5 text-muted-themed" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
