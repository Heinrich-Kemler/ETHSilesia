"use client";

import { MessageCircle, Globe, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";
import SkarbnikMascot from "@/components/ui/SkarbnikMascot";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/useTheme";

export default function CoachSection({ lang, theme }: { lang: Lang; theme: Theme }) {
  const features = [
    { icon: Globe, text: t("coachFeature1", lang) },
    { icon: BookOpen, text: t("coachFeature2", lang) },
    { icon: Clock, text: t("coachFeature3", lang) },
  ];

  return (
    <section id="coach" className="relative py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-card-themed border border-themed rounded-2xl overflow-hidden shadow-2xl">
              {/* Chat header */}
              <div className="bg-elevated-themed px-5 py-4 border-b border-themed flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-themed/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-gold-themed" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-themed">
                    Skarbnik AI
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green" />
                    <span className="text-xs text-muted-themed">Online</span>
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-5 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-gold-themed/10 border border-gold-themed/20 rounded-xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-themed">
                      {lang === "pl"
                        ? "Co to jest yield farming?"
                        : "What is yield farming?"}
                    </p>
                  </div>
                </div>

                {/* Bot message */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <MessageCircle className="w-3.5 h-3.5 text-gold-themed" />
                  </div>
                  <div className="bg-elevated-themed rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-secondary-themed leading-relaxed">
                      {lang === "pl"
                        ? 'Yield farming to jak "uprawa plonów" w świecie krypto. Udostępniasz swoje tokeny protokołowi DeFi, a w zamian dostajesz nagrodę — podobnie jak odsetki w banku, ale często znacznie wyższe.'
                        : 'Yield farming is like "growing crops" in the crypto world. You provide your tokens to a DeFi protocol, and in return you receive rewards — similar to bank interest, but often much higher.'}
                    </p>
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gold-themed/20 flex-shrink-0 flex items-center justify-center">
                    <MessageCircle className="w-3.5 h-3.5 text-gold-themed" />
                  </div>
                  <div className="bg-elevated-themed rounded-xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" />
                      <span
                        className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative mascot peeking */}
            <div className="absolute -bottom-8 -right-8 opacity-60">
              <SkarbnikMascot size={80} theme={theme} />
            </div>
          </motion.div>

          {/* Right — text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-themed mb-4">
              {t("coachTitle", lang)}
            </h2>
            <p className="text-cyan-themed text-sm font-medium uppercase tracking-wider mb-6">
              {t("coachSubtitle", lang)}
            </p>
            <p className="text-secondary-themed text-base leading-relaxed mb-8">
              {t("coachDesc", lang)}
            </p>

            {/* Feature list */}
            <div className="space-y-4 mb-8">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.text} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gold-themed/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold-themed" />
                    </div>
                    <p className="text-themed text-sm">{feat.text}</p>
                  </div>
                );
              })}
            </div>

            <button className="flex items-center gap-2 bg-card-themed border border-cyan-themed/20 hover:border-cyan-themed/40 text-cyan-themed font-medium text-sm px-6 py-3 rounded-xl transition-all hover:bg-cyan-themed/5">
              <MessageCircle className="w-4 h-4" />
              {t("coachCta", lang)}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
