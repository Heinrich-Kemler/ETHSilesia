"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import {
  type BadgeDef,
  badgeName,
  badgeDescription,
  badgeTrigger,
} from "@/lib/badgeRegistry";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Props = {
  badge: BadgeDef;
  earned: boolean;
  lang: Lang;
  index: number;
};

export default function BadgeCard({ badge, earned, lang, index }: Props) {
  const Icon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={earned ? { y: -4, scale: 1.02 } : undefined}
      className={`relative bg-card-themed border rounded-2xl p-5 shadow-card overflow-hidden ${
        earned ? "border-themed" : "border-themed opacity-80"
      }`}
      style={
        earned
          ? {
              borderColor: `color-mix(in srgb, ${badge.accent} 45%, transparent)`,
              boxShadow: `0 10px 40px color-mix(in srgb, ${badge.accent} 12%, transparent)`,
            }
          : undefined
      }
    >
      {/* Soft radial glow behind earned badges */}
      {earned && (
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-25 pointer-events-none blur-3xl"
          style={{ background: badge.accent }}
        />
      )}

      <div className="relative flex flex-col items-center text-center gap-3">
        {/* Icon orb */}
        <div
          className={`relative w-20 h-20 rounded-2xl flex items-center justify-center ${
            earned ? "" : "grayscale"
          }`}
          style={{
            background: earned
              ? badge.gradient
              : "color-mix(in srgb, var(--muted) 15%, transparent)",
          }}
        >
          {earned ? (
            <Icon className="w-10 h-10 text-white drop-shadow" />
          ) : (
            <Lock className="w-8 h-8 text-muted-themed" />
          )}
          {earned && (
            <motion.span
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.15, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-2"
              style={{ borderColor: badge.accent }}
            />
          )}
        </div>

        {/* Tier pill */}
        <span
          className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md border"
          style={{
            color: earned ? badge.accent : "var(--muted)",
            borderColor: earned
              ? `color-mix(in srgb, ${badge.accent} 35%, transparent)`
              : "var(--border)",
            background: earned
              ? `color-mix(in srgb, ${badge.accent} 12%, transparent)`
              : "var(--elevated)",
          }}
        >
          {badge.tier}
        </span>

        {/* Name */}
        <h3 className="font-heading text-base font-bold text-themed leading-tight">
          {badgeName(badge, lang)}
        </h3>

        {/* Description */}
        <p className="text-muted-themed text-xs leading-relaxed">
          {badgeDescription(badge, lang)}
        </p>

        {/* Trigger / status */}
        <div
          className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider ${
            earned ? "text-gold-themed" : "text-muted-themed"
          }`}
        >
          {earned ? (
            <span>✓ {t("badgeEarned", lang)}</span>
          ) : (
            <span>{badgeTrigger(badge, lang)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
