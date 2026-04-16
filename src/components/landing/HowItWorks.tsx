"use client";

import { UserPlus, BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const steps = [
  {
    num: "01",
    titleKey: "howStep1Title" as const,
    descKey: "howStep1Desc" as const,
    icon: UserPlus,
    color: "cyan",
    gradient: "from-cyan/20 to-cyan/5",
  },
  {
    num: "02",
    titleKey: "howStep2Title" as const,
    descKey: "howStep2Desc" as const,
    icon: BookOpen,
    color: "gold",
    gradient: "from-gold/20 to-gold/5",
  },
  {
    num: "03",
    titleKey: "howStep3Title" as const,
    descKey: "howStep3Desc" as const,
    icon: TrendingUp,
    color: "magenta",
    gradient: "from-magenta/20 to-magenta/5",
  },
];

const iconColor: Record<string, string> = {
  cyan: "text-cyan-themed",
  gold: "text-gold-themed",
  magenta: "text-magenta-themed",
};

const borderColor: Record<string, string> = {
  cyan: "border-cyan-themed/20",
  gold: "border-gold-themed/20",
  magenta: "border-magenta-themed/20",
};

const numColor: Record<string, string> = {
  cyan: "text-cyan-themed/30",
  gold: "text-gold-themed/30",
  magenta: "text-magenta-themed/30",
};

export default function HowItWorks({ lang }: { lang: Lang }) {
  return (
    <section id="how" className="relative py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-themed mb-3">
            {t("howTitle", lang)}
          </h2>
          <p className="text-muted-themed text-lg max-w-xl mx-auto">
            {t("howSubtitle", lang)}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-20 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-cyan/20 via-gold/20 to-magenta/20" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                <div
                  className={`bg-card-themed border ${borderColor[step.color]} rounded-2xl p-8 h-full`}
                >
                  {/* Step number */}
                  <span
                    className={`font-mono text-5xl font-bold ${numColor[step.color]} absolute top-4 right-6`}
                  >
                    {step.num}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} border ${borderColor[step.color]} flex items-center justify-center mb-6`}
                  >
                    <Icon className={`w-7 h-7 ${iconColor[step.color]}`} />
                  </div>

                  {/* Text */}
                  <h3 className="font-heading text-xl font-semibold text-themed mb-3">
                    {t(step.titleKey, lang)}
                  </h3>
                  <p className="text-secondary-themed text-sm leading-relaxed">
                    {t(step.descKey, lang)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
