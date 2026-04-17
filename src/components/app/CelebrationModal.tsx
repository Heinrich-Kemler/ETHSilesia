"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import Confetti from "@/components/ui/Confetti";
import { getBadgeById, badgeName, badgeDescription } from "@/lib/badgeRegistry";

type LevelUpVariant = {
  variant: "level-up";
  newLevel: 2 | 3 | 4;
  /** Translated level name to surface in the headline. */
  levelName: string;
};

type BadgeVariant = {
  variant: "badge";
  badgeId: number;
};

type Props = {
  open: boolean;
  lang: Lang;
  onClose: () => void;
} & (LevelUpVariant | BadgeVariant);

/**
 * Full-screen celebration overlay. Two variants today:
 *  - "level-up"  — crossing an XP threshold
 *  - "badge"     — earning an ERC-1155 badge
 *
 * Keeps copy short and dopamine-heavy. Confetti bursts on mount; the
 * center card springs in; dismiss via X button, Escape, or backdrop.
 */
export default function CelebrationModal(props: Props) {
  const { open, lang, onClose } = props;

  // Dismiss on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  let headline: string;
  let subheadline: string;
  let body: string;
  let Icon: React.ComponentType<{ className?: string }> | null = null;
  let gradient: string;
  let accent: string;
  let confettiColors: string[];

  if (props.variant === "level-up") {
    headline = t("celebrationLevelUpTitle", lang);
    subheadline = t("celebrationLevelUpSubtitle", lang, {
      level: props.levelName,
    });
    body = t("celebrationLevelUpBody", lang);
    gradient =
      "linear-gradient(135deg, var(--gold) 0%, color-mix(in srgb, var(--gold) 55%, transparent) 100%)";
    accent = "var(--gold)";
    confettiColors = ["#f59e0b", "#fcd34d", "#f9d71c", "#fff3b0", "#ffffff"];
    // Icon is implicit in level banner below — no separate icon prop here
  } else {
    const badge = getBadgeById(props.badgeId);
    headline = t("celebrationBadgeTitle", lang);
    subheadline = badge ? badgeName(badge, lang) : "";
    body = badge ? badgeDescription(badge, lang) : "";
    gradient = badge?.gradient ?? "linear-gradient(135deg, var(--gold), transparent)";
    accent = badge?.accent ?? "var(--gold)";
    Icon = badge?.icon ?? null;
    confettiColors = [accent, "#f59e0b", "#10b981", "#06b6d4", "#ffffff"];
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <Confetti count={50} colors={confettiColors} />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative max-w-md w-full bg-card-themed border rounded-3xl p-8 sm:p-10 text-center shadow-2xl"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
              boxShadow: `0 0 80px color-mix(in srgb, ${accent} 35%, transparent)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label={lang === "pl" ? "Zamknij" : "Close"}
              className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-elevated-themed border border-themed hover:bg-card-hover-themed flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-themed" />
            </button>

            {/* Uppercase banner */}
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] font-mono uppercase tracking-[0.2em] mb-6"
              style={{ color: accent }}
            >
              {headline}
            </motion.p>

            {/* Icon orb — spring in with rotation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 14,
                delay: 0.1,
              }}
              className="relative mx-auto mb-6 w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{ background: gradient }}
            >
              {/* Outer glow ring */}
              <motion.span
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -inset-2 rounded-3xl border-2"
                style={{ borderColor: accent }}
              />
              {/* Variant-specific glyph */}
              {props.variant === "level-up" ? (
                <span className="font-heading text-white text-5xl font-black tracking-tight drop-shadow">
                  {props.newLevel}
                </span>
              ) : Icon ? (
                <Icon className="w-14 h-14 text-white drop-shadow" />
              ) : null}
            </motion.div>

            {/* Subheadline (level name / badge name) */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-heading text-3xl sm:text-4xl font-bold text-themed mb-2 leading-tight"
            >
              {subheadline}
            </motion.h2>

            {/* Body copy */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-themed text-sm sm:text-base mb-7 leading-relaxed"
            >
              {body}
            </motion.p>

            {/* Dismiss CTA */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              style={{ background: gradient }}
            >
              {t("celebrationContinue", lang)}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
