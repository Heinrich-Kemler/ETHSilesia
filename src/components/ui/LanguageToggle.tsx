"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/i18n";

export default function LanguageToggle({
  lang,
  onToggle,
}: {
  lang: Lang;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center bg-card-themed border border-themed rounded-full p-0.5 w-[88px] h-9 hover:border-gold-themed/20 transition-colors"
      aria-label="Toggle language"
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-0.5 w-[42px] h-8 rounded-full bg-gold-themed/15 border border-gold-themed/30"
        animate={{ left: lang === "pl" ? "2px" : "42px" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      />

      {/* PL */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-bold tracking-wide transition-colors ${
          lang === "pl" ? "text-gold-themed" : "text-muted-themed"
        }`}
      >
        PL
      </span>

      {/* EN */}
      <span
        className={`relative z-10 flex-1 text-center text-xs font-bold tracking-wide transition-colors ${
          lang === "en" ? "text-gold-themed" : "text-muted-themed"
        }`}
      >
        EN
      </span>
    </button>
  );
}
