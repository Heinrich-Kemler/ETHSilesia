"use client";

import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import type { Theme } from "@/lib/useTheme";

export default function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="relative w-9 h-9 rounded-full border border-themed bg-card-themed hover:border-gold-themed/20 flex items-center justify-center transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180, scale: [1, 0.8, 1] }}
        transition={{ duration: 0.3 }}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-gold-themed" />
        ) : (
          <Moon className="w-4 h-4 text-navy-themed" />
        )}
      </motion.div>
    </button>
  );
}
