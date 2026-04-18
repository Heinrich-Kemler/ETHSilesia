"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import SkarbnikMascot from "@/components/ui/SkarbnikMascot";
import { useSkarbnikUser } from "@/lib/useSkarbnikUser";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

/**
 * Landing hero. Redesigned against the Claude Designer v1 handoff.
 *
 * Visual changes only — every string comes from `t(...)` unchanged,
 * so the Polish marketing copy is preserved verbatim:
 *   - A mono-label strap sits above the headline ("ROZDZIAŁ I ·
 *     DEBIUT") to echo the game-chapter framing from the design lab.
 *   - Headline uses Cinzel uppercase with wide tracking.
 *   - Glow rings behind the mascot are reduced to two (gold + cyan)
 *     and held to <20% alpha so the hero feels restrained, not
 *     neon-saas. Magenta glow removed.
 *   - Floating stat badges swap their pill fills for the new
 *     .card-paper treatment with mono labels.
 *   - Primary CTA uses .btn-primary; secondary is an outlined link.
 *
 * Auth handling is unchanged — same three-path login logic as before.
 */
export default function HeroSection({ lang, theme }: { lang: Lang; theme: Theme }) {
  const router = useRouter();
  const { status, isDemo, login, logout, privyAuthenticated } =
    useSkarbnikUser();

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
      {/* Background — gold + cyan washes, restrained. Grid is slightly
          stronger than before so it reads as an architectural drafting
          grid rather than a noise texture. */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-200px] left-1/4 w-[700px] h-[700px] rounded-full blur-[120px]"
          style={{ background: "color-mix(in srgb, var(--gold) 6%, transparent)" }}
        />
        <div
          className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: "color-mix(in srgb, var(--cyan) 5%, transparent)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: theme === "dark" ? 0.035 : 0.06,
            backgroundImage:
              theme === "dark"
                ? "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)"
                : "linear-gradient(rgba(26,26,36,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,36,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — text content */}
          <div>
            {/* Mono strap — chapter framing, pulled from t() so it
                still translates cleanly. Using heroBadge preserves
                the original Polish string. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 mb-8"
            >
              <span
                style={{
                  display: "inline-block",
                  width: 28,
                  height: 1,
                  background: "var(--gold)",
                }}
              />
              <span
                className="mono-label"
                style={{ color: "var(--gold)" }}
              >
                {t("heroBadge", lang)}
              </span>
            </motion.div>

            {/* Headline — Cinzel uppercase. We keep the original split
                (last word accent) but swap the gradient for a solid
                gold underline on the final word. */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="display-heading text-themed"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.25rem)",
                letterSpacing: "0.04em",
                marginBottom: "1.5rem",
              }}
            >
              <span>
                {t("heroHeading", lang).split(" ").slice(0, -1).join(" ")}
              </span>{" "}
              <span style={{ color: "var(--gold)" }}>
                {t("heroHeading", lang).split(" ").slice(-1)}
              </span>
            </motion.h1>

            {/* Ornamental rule under the headline */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 96 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                height: 1,
                background:
                  "linear-gradient(to right, var(--gold), transparent)",
                marginBottom: "1.75rem",
              }}
            />

            {/* Subheading — body font, left intact */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-secondary-themed leading-relaxed mb-10 max-w-xl"
              style={{ fontSize: "1.05rem" }}
            >
              {t("heroSubheading", lang)}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                type="button"
                onClick={handleStart}
                className="btn-primary group"
              >
                {t("heroCta", lang)}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a href="#how" className="btn-secondary">
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
              {/* Concentric rings — gold + cyan only. */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-[22rem] h-[22rem] rounded-full animate-[spin_30s_linear_infinite]"
                  style={{ border: "1px solid var(--border-gold)" }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-[17rem] h-[17rem] rounded-full animate-[spin_24s_linear_infinite_reverse]"
                  style={{ border: "1px solid var(--border-cyan)" }}
                />
              </div>

              {/* Floating stat cards — new .card-paper + mono labels */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 right-0 card-paper shadow-card"
                style={{ padding: "10px 14px", borderRadius: 10 }}
              >
                <p className="mono-label-dim">Poziom</p>
                <p
                  className="font-mono font-bold mt-0.5"
                  style={{ color: "var(--gold)", fontSize: 15 }}
                >
                  3 · 1,250 XP
                </p>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 left-0 card-paper shadow-card"
                style={{ padding: "10px 14px", borderRadius: 10 }}
              >
                <p className="mono-label-dim">Seria</p>
                <p
                  className="font-mono font-bold mt-0.5"
                  style={{ color: "var(--cyan)", fontSize: 15 }}
                >
                  7 dni
                </p>
              </motion.div>

              <motion.div
                animate={{ y: [-3, 7, -3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 -left-12 card-paper shadow-card"
                style={{ padding: "8px 12px", borderRadius: 10 }}
              >
                <p
                  className="font-mono font-bold"
                  style={{ color: "var(--gold)", fontSize: 12 }}
                >
                  +50 XP
                </p>
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
