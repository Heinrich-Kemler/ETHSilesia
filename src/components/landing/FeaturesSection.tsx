"use client";

import {
  Layers,
  Coins,
  ArrowLeftRight,
  TrendingUp,
  Shield,
  FileCode,
} from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const features = [
  {
    titleKey: "feat1Title" as const,
    descKey: "feat1Desc" as const,
    icon: Layers,
    color: "cyan",
  },
  {
    titleKey: "feat2Title" as const,
    descKey: "feat2Desc" as const,
    icon: Coins,
    color: "gold",
  },
  {
    titleKey: "feat3Title" as const,
    descKey: "feat3Desc" as const,
    icon: ArrowLeftRight,
    color: "magenta",
  },
  {
    titleKey: "feat4Title" as const,
    descKey: "feat4Desc" as const,
    icon: TrendingUp,
    color: "cyan",
  },
  {
    titleKey: "feat5Title" as const,
    descKey: "feat5Desc" as const,
    icon: Shield,
    color: "gold",
  },
  {
    titleKey: "feat6Title" as const,
    descKey: "feat6Desc" as const,
    icon: FileCode,
    color: "magenta",
  },
];

const styles: Record<string, { bg: string; icon: string; border: string }> = {
  cyan: {
    bg: "bg-cyan-themed/5",
    icon: "text-cyan-themed",
    border: "group-hover:border-cyan-themed/20",
  },
  gold: {
    bg: "bg-gold-themed/5",
    icon: "text-gold-themed",
    border: "group-hover:border-gold-themed/20",
  },
  magenta: {
    bg: "bg-magenta-themed/5",
    icon: "text-magenta-themed",
    border: "group-hover:border-magenta-themed/20",
  },
};

export default function FeaturesSection({ lang }: { lang: Lang }) {
  return (
    <section id="features" className="relative py-24 bg-card-themed/30">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-themed mb-3">
            {t("featuresTitle", lang)}
          </h2>
          <p className="text-muted-themed text-lg max-w-2xl mx-auto">
            {t("featuresSubtitle", lang)}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            const s = styles[feat.color];
            return (
              <motion.div
                key={feat.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group bg-card-themed border border-themed ${s.border} rounded-2xl p-6 transition-all duration-300 hover:bg-card-hover-themed shadow-card`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-6 h-6 ${s.icon}`} />
                </div>

                <h3 className="font-heading text-lg font-semibold text-themed mb-2">
                  {t(feat.titleKey, lang)}
                </h3>
                <p className="text-secondary-themed text-sm leading-relaxed">
                  {t(feat.descKey, lang)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
