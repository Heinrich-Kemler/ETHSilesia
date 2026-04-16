"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export default function ChatWidget({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const suggestions = [
    t("chatSuggestion1", lang),
    t("chatSuggestion2", lang),
    t("chatSuggestion3", lang),
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-card-themed border border-themed rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-elevated-themed px-4 py-3 flex items-center justify-between border-b border-themed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold-themed/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold-themed" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-themed">
                    {t("chatTitle", lang)}
                  </p>
                  <p className="text-xs text-muted-themed">
                    {t("chatSubtitle", lang)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-themed hover:text-themed transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages area */}
            <div className="h-72 p-4 overflow-y-auto space-y-3">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center mt-1">
                  <Sparkles className="w-3 h-3 text-gold-themed" />
                </div>
                <div className="bg-elevated-themed rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                  <p className="text-sm text-secondary-themed">
                    {t("chatWelcome", lang)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pl-8">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => setMessage(q)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-cyan-themed/20 bg-cyan-themed/5 text-cyan-themed hover:bg-cyan-themed/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-themed">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("chatPlaceholder", lang)}
                  className="flex-1 bg-themed border border-themed rounded-lg px-3 py-2 text-sm text-themed placeholder-muted-themed focus:outline-none focus:border-gold-themed/40 transition-colors"
                />
                <button className="bg-gold-themed hover:bg-gold-dim-themed text-white rounded-lg px-3 py-2 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full gradient-gold-cyan-themed shadow-lg flex items-center justify-center relative"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-gold-themed/20 animate-ping" />
        )}
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}
