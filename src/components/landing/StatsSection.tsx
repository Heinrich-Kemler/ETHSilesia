"use client";

import { Users, BookOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const stats = [
  { key: "statsUsers" as const, value: "2,400+", icon: Users, color: "text-cyan-themed" },
  { key: "statsQuests" as const, value: "12,000+", icon: BookOpen, color: "text-gold-themed" },
  { key: "statsXp" as const, value: "850K+", icon: Sparkles, color: "text-magenta-themed" },
];

export default function StatsSection({ lang }: { lang: Lang }) {
  return (
    <section className="relative py-16 border-y border-themed bg-card-themed">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <Icon className={`w-6 h-6 ${stat.color} mb-3`} />
                <p className="font-mono text-3xl font-bold text-themed mb-1">
                  {stat.value}
                </p>
                <p className="text-muted-themed text-sm">{t(stat.key, lang)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
